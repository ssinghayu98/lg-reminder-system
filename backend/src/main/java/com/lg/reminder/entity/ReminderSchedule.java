package com.lg.reminder.entity;

import com.lg.reminder.enums.ReminderFrequency;
import com.lg.reminder.enums.ReminderType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
@Entity
@Table(name = "reminder_schedules")
@EntityListeners(AuditingEntityListener.class)
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ReminderSchedule {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

   @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Enumerated(EnumType.STRING)
    private ReminderType reminderType;

    @Enumerated(EnumType.STRING)
    private ReminderFrequency frequency;

    private Integer daysBefore;
    private Integer customIntervalDays;

    @Builder.Default
    private Boolean isActive = true;

    private LocalDateTime nextRun;
    private LocalDateTime lastRun;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
