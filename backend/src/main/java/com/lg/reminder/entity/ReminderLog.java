package com.lg.reminder.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
@Entity
@Table(name = "reminder_logs", indexes = {
    @Index(name = "idx_reminder_logs_task", columnList = "task_id"),
    @Index(name = "idx_reminder_logs_sent_at", columnList = "sentAt")
})
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ReminderLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
@JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    private String emailTo;
    private String emailSubject;

    @Column(nullable = false)
    @Builder.Default
    private String status = "SENT";

    private String errorMessage;

    @Builder.Default
    private LocalDateTime sentAt = LocalDateTime.now();
}
