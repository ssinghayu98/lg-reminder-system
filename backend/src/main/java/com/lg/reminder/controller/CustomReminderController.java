package com.lg.reminder.controller;

import com.lg.reminder.entity.CustomReminder;
import com.lg.reminder.service.impl.CustomReminderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/custom-reminders")
@RequiredArgsConstructor
public class CustomReminderController {

    private final CustomReminderService customReminderService;

    @PostMapping
    public ResponseEntity<CustomReminder> create(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String subject = body.get("subject");
        String message = body.get("message");
        LocalDateTime scheduledAt = LocalDateTime.parse(body.get("scheduledAt"));

        CustomReminder reminder = customReminderService.createReminder(email, subject, message, scheduledAt);
        return ResponseEntity.ok(reminder);
    }

    @GetMapping
    public ResponseEntity<List<CustomReminder>> getAll() {
        return ResponseEntity.ok(customReminderService.getAllReminders());
    }
}