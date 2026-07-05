package com.lg.reminder.repository;

import com.lg.reminder.entity.ReminderSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReminderScheduleRepository extends JpaRepository<ReminderSchedule, Long> {
    List<ReminderSchedule> findByTaskId(Long taskId);

    @Query("SELECT r FROM ReminderSchedule r WHERE r.isActive = true AND r.nextRun <= :now AND r.task.status NOT IN ('COMPLETED','CANCELLED')")
    List<ReminderSchedule> findDueReminders(@Param("now") LocalDateTime now);
}
