package com.lg.reminder.service.impl;

import com.lg.reminder.dto.request.TaskDTOs.*;
import com.lg.reminder.dto.response.PagedResponse;
import com.lg.reminder.entity.*;
import com.lg.reminder.enums.*;
import com.lg.reminder.exception.*;
import com.lg.reminder.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final TaskUpdateRepository taskUpdateRepository;
    private final ReminderScheduleRepository reminderScheduleRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    @Transactional
    public Task createTask(CreateTaskRequest req, String creatorEmail) {
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Creator user not found"));

        Employee assignedTo = employeeRepository.findById(req.getAssignedToEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", req.getAssignedToEmployeeId()));

        Task task = Task.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .priority(req.getPriority() != null ? req.getPriority() : TaskPriority.MEDIUM)
                .status(TaskStatus.ASSIGNED)
                .assignedTo(assignedTo)
                .assignedBy(creator)
                .dueDate(req.getDueDate())
                .reminderDate(req.getReminderDate())
                .estimatedHours(req.getEstimatedHours())
                .build();

        if (req.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(req.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", req.getDepartmentId()));
            task.setDepartment(dept);
        }

        task = taskRepository.save(task);

        // Create default deadline reminders
        createDefaultReminderSchedules(task);

        // Notify employee
        emailService.sendTaskAssignmentEmail(assignedTo.getUser().getEmail(), assignedTo.getUser().getFullName(), task);
        notificationService.createNotification(
            assignedTo.getUser(), "New Task Assigned",
            "Task '" + task.getTitle() + "' assigned by " + creator.getFullName(),
            NotificationType.TASK_ASSIGNED, task.getId()
        );

        auditLogService.log(creator, "TASK_CREATED", "Task", task.getId(),
                "Task created and assigned to " + assignedTo.getUser().getEmail(), null);

        return task;
    }

    @Transactional
    public Task updateTask(Long taskId, UpdateTaskRequest req, String updaterEmail) {
        Task task = getTaskById(taskId);
        User updater = userRepository.findByEmail(updaterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (req.getTitle() != null) task.setTitle(req.getTitle());
        if (req.getDescription() != null) task.setDescription(req.getDescription());
        if (req.getPriority() != null) task.setPriority(req.getPriority());
        if (req.getDueDate() != null) task.setDueDate(req.getDueDate());
        if (req.getReminderDate() != null) task.setReminderDate(req.getReminderDate());
        if (req.getEstimatedHours() != null) task.setEstimatedHours(req.getEstimatedHours());

        if (req.getStatus() != null) {
            TaskStatus oldStatus = task.getStatus();
            task.setStatus(req.getStatus());
            if (req.getStatus() == TaskStatus.COMPLETED) {
                task.setCompletedAt(LocalDate.now());
                task.setReminderActive(false);
                disableRemindersForTask(taskId);
            }
            notificationService.createNotification(
                task.getAssignedTo().getUser(), "Task Status Updated",
                "Task '" + task.getTitle() + "' status changed to " + req.getStatus(),
                NotificationType.TASK_UPDATED, taskId
            );
        }

        if (req.getAssignedToEmployeeId() != null) {
            Employee newAssignee = employeeRepository.findById(req.getAssignedToEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", req.getAssignedToEmployeeId()));
            task.setAssignedTo(newAssignee);
        }

        task = taskRepository.save(task);
        auditLogService.log(updater, "TASK_UPDATED", "Task", task.getId(), "Task updated", null);
        return task;
    }

    @Transactional
    public TaskUpdate addProgress(Long taskId, AddProgressRequest req, String updaterEmail) {
        Task task = getTaskById(taskId);
        User updater = userRepository.findByEmail(updaterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (req.getProgressPercent() != null) {
            task.setProgressPercent(req.getProgressPercent());
            if (task.getStatus() == TaskStatus.ASSIGNED || task.getStatus() == TaskStatus.PENDING) {
                task.setStatus(TaskStatus.IN_PROGRESS);
            }
            if (req.getProgressPercent() == 100) {
                task.setStatus(TaskStatus.AWAITING_REVIEW);
            }
            taskRepository.save(task);
        }

        TaskUpdate update = TaskUpdate.builder()
                .task(task)
                .updatedBy(updater)
                .comment(req.getComment())
                .progressPercent(req.getProgressPercent())
                .build();

        update = taskUpdateRepository.save(update);
        notificationService.createNotification(
            task.getAssignedBy(), "Task Progress Update",
            updater.getFullName() + " updated task '" + task.getTitle() + "': " + req.getComment(),
            NotificationType.TASK_UPDATED, taskId
        );

        return update;
    }

    @Transactional
    public Task completeTask(Long taskId, String email) {
        Task task = getTaskById(taskId);
        task.setStatus(TaskStatus.COMPLETED);
        task.setProgressPercent(100);
        task.setCompletedAt(LocalDate.now());
        task.setReminderActive(false);
        disableRemindersForTask(taskId);
        task = taskRepository.save(task);

        notificationService.createNotification(
            task.getAssignedBy(), "Task Completed",
            "Task '" + task.getTitle() + "' has been marked as completed",
            NotificationType.TASK_COMPLETED, taskId
        );
        return task;
    }

    public Task getTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id));
    }

    public PagedResponse<Task> getTasksForEmployee(Long employeeId, int page, int size) {
        Page<Task> taskPage = taskRepository.findByAssignedToId(employeeId, PageRequest.of(page, size, Sort.by("dueDate")));
        return buildPagedResponse(taskPage);
    }

    public PagedResponse<Task> getAllTasks(int page, int size, String sortBy) {
        Page<Task> taskPage = taskRepository.findAll(PageRequest.of(page, size, Sort.by(sortBy != null ? sortBy : "createdAt").descending()));
        return buildPagedResponse(taskPage);
    }

    public Map<String, Long> getDashboardStats() {
        LocalDate today = LocalDate.now();
        return Map.of(
            "total", taskRepository.count(),
            "pending", taskRepository.countByStatus(TaskStatus.PENDING),
            "inProgress", taskRepository.countByStatus(TaskStatus.IN_PROGRESS),
            "completed", taskRepository.countByStatus(TaskStatus.COMPLETED),
            "overdue", taskRepository.countOverdueTasks(today),
            "awaitingReview", taskRepository.countByStatus(TaskStatus.AWAITING_REVIEW)
        );
    }

    private void createDefaultReminderSchedules(Task task) {
        // 7 days, 3 days, 1 day, on due date reminders
        for (int days : new int[]{7, 3, 1, 0}) {
            ReminderSchedule schedule = ReminderSchedule.builder()
                    .task(task)
                    .reminderType(ReminderType.DEADLINE)
                    .frequency(ReminderFrequency.ONCE)
                    .daysBefore(days)
                    .nextRun(task.getDueDate().minusDays(days).atStartOfDay())
                    .isActive(true)
                    .build();
            reminderScheduleRepository.save(schedule);
        }
    }

    private void disableRemindersForTask(Long taskId) {
        reminderScheduleRepository.findByTaskId(taskId).forEach(schedule -> {
            schedule.setIsActive(false);
            reminderScheduleRepository.save(schedule);
        });
    }

    private <T> PagedResponse<T> buildPagedResponse(Page<T> page) {
        return PagedResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional
    public void deleteTask(Long taskId, String email) {
        Task task = getTaskById(taskId);
        taskRepository.delete(task);
        User user = userRepository.findByEmail(email).orElse(null);
        auditLogService.log(user, "TASK_DELETED", "Task", taskId, "Task deleted: " + task.getTitle(), null);
    }

    public List<Task> getUpcomingDeadlines(int days) {
        LocalDate from = LocalDate.now();
        LocalDate to = from.plusDays(days);
        return taskRepository.findTasksDueBetween(from, to);
    }
}
