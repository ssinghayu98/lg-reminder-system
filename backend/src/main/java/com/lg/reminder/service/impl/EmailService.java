package com.lg.reminder.service.impl;

import com.lg.reminder.entity.Task;
import com.lg.reminder.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final TemplateEngine templateEngine;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.brevo.api-key}")
    private String brevoApiKey;

    @Value("${app.brevo.sender-email}")
    private String senderEmail;

    @Value("${app.brevo.sender-name:LG Reminder System}")
    private String senderName;

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    @Async
    public void sendReminderEmail(String toEmail, String employeeName, Task task) {
        try {
            Context context = new Context();
            context.setVariable("employeeName", employeeName);
            context.setVariable("taskTitle", task.getTitle());
            context.setVariable("taskDescription", task.getDescription());
            context.setVariable("dueDate", task.getDueDate());
            context.setVariable("status", task.getStatus().name().replace("_", " "));
            context.setVariable("priority", task.getPriority().name());

            String html = templateEngine.process("email/reminder", context);
            sendEmail(toEmail, "LG Employee Reminder System - Task Update Required", html);
            log.info("Reminder email sent to {} for task {}", toEmail, task.getId());
        } catch (Exception e) {
            log.error("Failed to send reminder email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Email send failed: " + e.getMessage());
        }
    }

    @Async
    public void sendOverdueEscalationEmail(String managerEmail, String managerName, Task task, int overdueDays) {
        try {
            Context context = new Context();
            context.setVariable("managerName", managerName);
            context.setVariable("taskTitle", task.getTitle());
            context.setVariable("employeeName", task.getAssignedTo().getUser().getFullName());
            context.setVariable("dueDate", task.getDueDate());
            context.setVariable("overdueDays", overdueDays);
            context.setVariable("status", task.getStatus().name());

            String html = templateEngine.process("email/escalation", context);
            sendEmail(managerEmail, "ESCALATION: Overdue Task - " + task.getTitle(), html);
        } catch (Exception e) {
            log.error("Failed to send escalation email: {}", e.getMessage());
        }
    }

    @Async
    public void sendEmailVerification(String toEmail, String name, String token, String frontendUrl) {
        try {
            String verificationLink = frontendUrl + "/verify-email?token=" + token;
            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("verificationLink", verificationLink);

            String html = templateEngine.process("email/verification", context);
            sendEmail(toEmail, "Verify your LG Reminder System account", html);
        } catch (Exception e) {
            log.error("Failed to send verification email: {}", e.getMessage());
        }
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String name, String token, String frontendUrl) {
        try {
            String resetLink = frontendUrl + "/reset-password?token=" + token;
            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("resetLink", resetLink);

            String html = templateEngine.process("email/password-reset", context);
            sendEmail(toEmail, "Reset your LG Reminder System password", html);
        } catch (Exception e) {
            log.error("Failed to send password reset email: {}", e.getMessage());
        }
    }

    @Async
    public void sendTaskAssignmentEmail(String toEmail, String employeeName, Task task) {
        try {
            Context context = new Context();
            context.setVariable("employeeName", employeeName);
            context.setVariable("taskTitle", task.getTitle());
            context.setVariable("taskDescription", task.getDescription());
            context.setVariable("priority", task.getPriority().name());
            context.setVariable("dueDate", task.getDueDate());
            context.setVariable("assignedBy", task.getAssignedBy().getFullName());

            String html = templateEngine.process("email/task-assigned", context);
            sendEmail(toEmail, "New Task Assigned: " + task.getTitle(), html);
        } catch (Exception e) {
            log.error("Failed to send task assignment email: {}", e.getMessage());
        }
    }

    private void sendEmail(String to, String subject, String htmlBody) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("api-key", brevoApiKey);
        headers.set("accept", "application/json");
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> sender = new HashMap<>();
        sender.put("name", senderName);
        sender.put("email", senderEmail);

        Map<String, Object> recipient = new HashMap<>();
        recipient.put("email", to);

        Map<String, Object> body = new HashMap<>();
        body.put("sender", sender);
        body.put("to", List.of(recipient));
        body.put("subject", subject);
        body.put("htmlContent", htmlBody);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            restTemplate.postForEntity(BREVO_API_URL, request, String.class);
            log.info("Email sent via Brevo API to {}", to);
        } catch (Exception e) {
            log.error("Brevo API email send failed to {}: {}", to, e.getMessage());
            throw new RuntimeException("Brevo email send failed: " + e.getMessage());
        }
    }
}