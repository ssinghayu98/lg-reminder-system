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

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final TemplateEngine templateEngine;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.gmail.client-id}")
    private String clientId;

    @Value("${app.gmail.client-secret}")
    private String clientSecret;

    @Value("${app.gmail.refresh-token}")
    private String refreshToken;

    @Value("${app.gmail.sender-email}")
    private String senderEmail;

    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

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

    @Async
    public void sendCustomReminderEmail(String toEmail, String subject, String htmlBody) {
        try {
            sendEmail(toEmail, subject, htmlBody);
        } catch (Exception e) {
            log.error("Failed to send custom reminder email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String getAccessToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String body = "client_id=" + clientId
                + "&client_secret=" + clientSecret
                + "&refresh_token=" + refreshToken
                + "&grant_type=refresh_token";

        HttpEntity<String> request = new HttpEntity<>(body, headers);
        Map<?, ?> response = restTemplate.postForObject(TOKEN_URL, request, Map.class);
        return (String) response.get("access_token");
    }

    private void sendEmail(String to, String subject, String htmlBody) {
        try {
            String accessToken = getAccessToken();

            String mimeMessage = "From: " + senderEmail + "\r\n"
                    + "To: " + to + "\r\n"
                    + "Subject: " + subject + "\r\n"
                    + "MIME-Version: 1.0\r\n"
                    + "Content-Type: text/html; charset=UTF-8\r\n\r\n"
                    + htmlBody;

            String encodedMessage = Base64.getUrlEncoder()
                    .encodeToString(mimeMessage.getBytes(StandardCharsets.UTF_8));

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> payload = new HashMap<>();
            payload.put("raw", encodedMessage);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(payload, headers);
            restTemplate.postForEntity(SEND_URL, request, String.class);
            log.info("Email sent via Gmail API to {}", to);
        } catch (Exception e) {
            log.error("Gmail API email send failed to {}: {}", to, e.getMessage());
            throw new RuntimeException("Gmail email send failed: " + e.getMessage());
        }
    }
}