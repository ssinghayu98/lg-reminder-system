package com.lg.reminder.repository;

import com.lg.reminder.entity.ReminderLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReminderLogRepository extends JpaRepository<ReminderLog, Long> {
    List<ReminderLog> findByTaskId(Long taskId);
    Page<ReminderLog> findAllByOrderBySentAtDesc(Pageable pageable);
    long countByStatus(String status);

    @Query("SELECT COUNT(r) FROM ReminderLog r WHERE r.status = 'SENT'")
    long countSuccessful();

    @Query("SELECT COUNT(r) FROM ReminderLog r WHERE r.status = 'FAILED'")
    long countFailed();
}
