package com.lg.reminder.repository;

import com.lg.reminder.entity.Task;
import com.lg.reminder.enums.TaskPriority;
import com.lg.reminder.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {
    Page<Task> findByAssignedToId(Long employeeId, Pageable pageable);
    Page<Task> findByDepartmentId(Long departmentId, Pageable pageable);
    List<Task> findByStatus(TaskStatus status);
    List<Task> findByStatusIn(List<TaskStatus> statuses);

    @Query("SELECT t FROM Task t WHERE t.dueDate < :today AND t.status NOT IN ('COMPLETED','CANCELLED','OVERDUE')")
    List<Task> findOverdueTasks(@Param("today") LocalDate today);

    @Query("SELECT t FROM Task t WHERE t.reminderDate = :date AND t.status NOT IN ('COMPLETED','CANCELLED') AND t.reminderActive = true")
    List<Task> findTasksDueForReminder(@Param("date") LocalDate date);

    @Query("SELECT t FROM Task t WHERE t.dueDate BETWEEN :from AND :to AND t.status NOT IN ('COMPLETED','CANCELLED')")
    List<Task> findTasksDueBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    long countByStatus(TaskStatus status);
    long countByAssignedToId(Long employeeId);
    long countByDepartmentId(Long departmentId);
    long countByAssignedToIdAndStatus(Long employeeId, TaskStatus status);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.dueDate < :today AND t.status NOT IN ('COMPLETED','CANCELLED','OVERDUE')")
    long countOverdueTasks(@Param("today") LocalDate today);
}
