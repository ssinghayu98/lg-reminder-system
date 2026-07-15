package com.lg.reminder.service.impl;
import com.lg.reminder.entity.CustomReminder;
import com.lg.reminder.repository.CustomReminderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomReminderService {
    private final CustomReminderRepository customReminderRepository;
    private final EmailService emailService;
    public CustomReminder createReminder(String email, String subject, String message, LocalDateTime scheduledAt) {
        CustomReminder reminder = CustomReminder.builder()
                .email(email)
                .subject(subject)
                .message(message)
                .scheduledAt(scheduledAt)
                .sent(false)
                .build();
        return customReminderRepository.save(reminder);
    }
    public List<CustomReminder> getAllReminders() {
        return customReminderRepository.findAll();
    }
    @Scheduled(fixedRate = 60000) // runs every 60 seconds
    public void processDueReminders() {
        List<CustomReminder> dueReminders = customReminderRepository.findDueReminders(LocalDateTime.now());
        for (CustomReminder reminder : dueReminders) {
            try {
                emailService.sendCustomReminderEmail(reminder.getEmail(), reminder.getSubject(), buildEmailBody(reminder));
                reminder.setSent(true);
                reminder.setSentAt(LocalDateTime.now());
                customReminderRepository.save(reminder);
                log.info("Sent custom reminder to {}", reminder.getEmail());
            } catch (Exception e) {
                log.error("Failed to send custom reminder to {}: {}", reminder.getEmail(), e.getMessage());
            }
        }
    }
    private String buildEmailBody(CustomReminder reminder) {
        return """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #1e3a5f; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h2 style="margin: 0;">Reminder</h2>
                    </div>
                    <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 16px; color: #333;">%s</p>
                        <p style="font-size: 12px; color: #999; margin-top: 24px;">
                            This reminder was scheduled for %s
                        </p>
                    </div>
                </div>
                """.formatted(reminder.getMessage(), reminder.getScheduledAt().toString());
    }
}