package com.lg.reminder.scheduler;

import com.lg.reminder.entity.*;
import com.lg.reminder.enums.*;
import com.lg.reminder.repository.*;
import com.lg.reminder.service.impl.EmailService;
import com.lg.reminder.service.impl.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderScheduler {

    private final TaskRepository taskRepository;
    private final ReminderScheduleRepository reminderScheduleRepository;
    private final ReminderLogRepository reminderLogRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    @Value("${app.reminder.scheduler-enabled:true}")
    private boolean schedulerEnabled;

    /**
     * Main daily scheduler: runs at 8 AM every day.
     * Checks all pending reminder schedules and overdue tasks.
     */
    @Scheduled(cron = "${app.reminder.cron:0 0 8 * * *}")
    @Transactional
    public void runDailyReminderCheck() {
        if (!schedulerEnabled) {
            log.info("Scheduler is disabled, skipping reminder check");
            return;
        }
        log.info("Running daily reminder check at {}", LocalDateTime.now());

        processDeadlineReminders();
        processRecurringReminders();
        markOverdueTasks();
        sendOverdueNotifications();
        sendEscalationEmails();
    }

    /**
     * Marks tasks as OVERDUE if they passed their due date
     */
    private void markOverdueTasks() {
        List<Task> overdueTasks = taskRepository.findOverdueTasks(LocalDate.now());
        overdueTasks.forEach(task -> {
            task.setStatus(TaskStatus.OVERDUE);
            taskRepository.save(task);
            log.debug("Marked task {} as OVERDUE", task.getId());
        });
        log.info("Marked {} tasks as overdue", overdueTasks.size());
    }

    /**
     * Deadline-based reminders: 7 days, 3 days, 1 day, on deadline
     */
    private void processDeadlineReminders() {
        LocalDate today = LocalDate.now();

        // 7 days before
        sendDeadlineReminderForDaysAhead(today, 7);
        // 3 days before
        sendDeadlineReminderForDaysAhead(today, 3);
        // 1 day before
        sendDeadlineReminderForDaysAhead(today, 1);
        // On deadline day
        sendDeadlineReminderForDaysAhead(today, 0);
    }

    private void sendDeadlineReminderForDaysAhead(LocalDate today, int daysAhead) {
        LocalDate targetDate = today.plusDays(daysAhead);
        List<Task> tasks = taskRepository.findTasksDueBetween(targetDate, targetDate);

        for (Task task : tasks) {
            if (task.getAssignedTo() == null) continue;
            Employee employee = task.getAssignedTo();
            String toEmail = employee.getUser().getEmail();
            String employeeName = employee.getUser().getFullName();

            try {
                emailService.sendReminderEmail(toEmail, employeeName, task);
                logReminder(task, employee, toEmail, "SENT", null);
                notificationService.createNotification(
                    employee.getUser(),
                    "Task Deadline Reminder",
                    daysAhead == 0 ? "Task '" + task.getTitle() + "' is due TODAY!"
                        : "Task '" + task.getTitle() + "' is due in " + daysAhead + " day(s)",
                    NotificationType.REMINDER_SENT,
                    task.getId()
                );
            } catch (Exception e) {
                logReminder(task, employee, toEmail, "FAILED", e.getMessage());
                log.error("Failed reminder for task {}: {}", task.getId(), e.getMessage());
            }
        }
    }

    /**
     * Processes all active recurring reminder schedules that are due
     */
    private void processRecurringReminders() {
        List<ReminderSchedule> dueSchedules = reminderScheduleRepository.findDueReminders(LocalDateTime.now());

        for (ReminderSchedule schedule : dueSchedules) {
            Task task = schedule.getTask();
            if (task.getAssignedTo() == null) continue;

            Employee employee = task.getAssignedTo();
            try {
                emailService.sendReminderEmail(employee.getUser().getEmail(), employee.getUser().getFullName(), task);
                logReminder(task, employee, employee.getUser().getEmail(), "SENT", null);

                // Update next run
                schedule.setLastRun(LocalDateTime.now());
                schedule.setNextRun(calculateNextRun(schedule));
                reminderScheduleRepository.save(schedule);
            } catch (Exception e) {
                logReminder(task, employee, employee.getUser().getEmail(), "FAILED", e.getMessage());
            }
        }
    }

    /**
     * Send notifications to employees about overdue tasks
     */
    private void sendOverdueNotifications() {
        List<Task> overdueTasks = taskRepository.findByStatus(TaskStatus.OVERDUE);
        for (Task task : overdueTasks) {
            if (task.getAssignedTo() == null) continue;
            notificationService.createNotification(
                task.getAssignedTo().getUser(),
                "Task Overdue",
                "Your task '" + task.getTitle() + "' is overdue. Please update immediately.",
                NotificationType.TASK_OVERDUE,
                task.getId()
            );
        }
    }

    /**
     * Escalation emails to managers for tasks overdue by 3, 7, 15 days
     */
    private void sendEscalationEmails() {
        List<Task> overdueTasks = taskRepository.findByStatus(TaskStatus.OVERDUE);
        LocalDate today = LocalDate.now();

        for (Task task : overdueTasks) {
            long overdueDays = ChronoUnit.DAYS.between(task.getDueDate(), today);

            if (overdueDays == 3 || overdueDays == 7 || overdueDays == 15) {
                User manager = findManagerForTask(task);
                if (manager != null) {
                    emailService.sendOverdueEscalationEmail(
                        manager.getEmail(),
                        manager.getFullName(),
                        task,
                        (int) overdueDays
                    );
                    notificationService.createNotification(
                        manager,
                        "Escalation: Task Overdue by " + overdueDays + " days",
                        "Task '" + task.getTitle() + "' assigned to " +
                            task.getAssignedTo().getUser().getFullName() + " is overdue by " + overdueDays + " days",
                        NotificationType.ESCALATION,
                        task.getId()
                    );
                }
            }
        }
    }

    private User findManagerForTask(Task task) {
        if (task.getDepartment() != null && task.getDepartment().getManager() != null) {
            return task.getDepartment().getManager();
        }
        // Fallback: find a MANAGER role user
        return userRepository.findByRole(com.lg.reminder.enums.Role.ROLE_MANAGER)
                .stream().findFirst().orElse(null);
    }

    private LocalDateTime calculateNextRun(ReminderSchedule schedule) {
        return switch (schedule.getFrequency()) {
            case DAILY   -> LocalDateTime.now().plusDays(1);
            case WEEKLY  -> LocalDateTime.now().plusWeeks(1);
            case MONTHLY -> LocalDateTime.now().plusMonths(1);
            case CUSTOM  -> LocalDateTime.now().plusDays(
                    schedule.getCustomIntervalDays() != null ? schedule.getCustomIntervalDays() : 7);
            default      -> null;
        };
    }

    private void logReminder(Task task, Employee employee, String email, String status, String errorMsg) {
        ReminderLog log = ReminderLog.builder()
                .task(task)
                .employee(employee)
                .emailTo(email)
                .emailSubject("LG Employee Reminder System – Task Update Required")
                .status(status)
                .errorMessage(errorMsg)
                .build();
        reminderLogRepository.save(log);
    }
}
