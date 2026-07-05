package com.lg.reminder.repository;

import com.lg.reminder.entity.CustomReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CustomReminderRepository extends JpaRepository<CustomReminder, Long> {

    @Query("SELECT r FROM CustomReminder r WHERE r.sent = false AND r.scheduledAt <= :now")
    List<CustomReminder> findDueReminders(LocalDateTime now);

    List<CustomReminder> findByEmailOrderByScheduledAtDesc(String email);
}