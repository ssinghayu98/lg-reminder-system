package com.lg.reminder.controller;

import com.lg.reminder.dto.request.TaskDTOs.*;
import com.lg.reminder.dto.response.*;
import com.lg.reminder.entity.*;
import com.lg.reminder.service.impl.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Task management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @Operation(summary = "Create a new task")
    public ResponseEntity<ApiResponse<Task>> createTask(
            @Valid @RequestBody CreateTaskRequest request,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Task created", taskService.createTask(request, auth.getName())));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get task by ID")
    public ResponseEntity<ApiResponse<Task>> getTask(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTaskById(id)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @Operation(summary = "Get all tasks (paginated)")
    public ResponseEntity<ApiResponse<PagedResponse<Task>>> getAllTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getAllTasks(page, size, sortBy)));
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get tasks for a specific employee")
    public ResponseEntity<ApiResponse<PagedResponse<Task>>> getEmployeeTasks(
            @PathVariable Long employeeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTasksForEmployee(employeeId, page, size)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @Operation(summary = "Update task details")
    public ResponseEntity<ApiResponse<Task>> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskRequest request,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Task updated", taskService.updateTask(id, request, auth.getName())));
    }

    @PostMapping("/{id}/progress")
    @Operation(summary = "Add progress update to task")
    public ResponseEntity<ApiResponse<TaskUpdate>> addProgress(
            @PathVariable Long id,
            @Valid @RequestBody AddProgressRequest request,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Progress added", taskService.addProgress(id, request, auth.getName())));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Mark task as completed")
    public ResponseEntity<ApiResponse<Task>> completeTask(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Task completed", taskService.completeTask(id, auth.getName())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Delete a task")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @PathVariable Long id,
            Authentication auth) {
        taskService.deleteTask(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Task deleted", null));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get task statistics for dashboard")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(taskService.getDashboardStats()));
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Get upcoming deadline tasks")
    public ResponseEntity<ApiResponse<List<Task>>> getUpcoming(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getUpcomingDeadlines(days)));
    }
}
