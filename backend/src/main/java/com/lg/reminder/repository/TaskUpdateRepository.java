package com.lg.reminder.repository;

import com.lg.reminder.entity.TaskUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskUpdateRepository extends JpaRepository<TaskUpdate, Long> {
    List<TaskUpdate> findByTaskIdOrderByCreatedAtDesc(Long taskId);
}
