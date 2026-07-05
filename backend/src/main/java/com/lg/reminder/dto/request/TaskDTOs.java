package com.lg.reminder.dto.request;

import com.lg.reminder.enums.TaskPriority;
import com.lg.reminder.enums.TaskStatus;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import jakarta.validation.constraints.FutureOrPresent;
public class TaskDTOs {

    @Data
    public static class CreateTaskRequest {
        @NotBlank @Size(min = 3, max = 255)
        private String title;
        private String description;
        private TaskPriority priority = TaskPriority.MEDIUM;
        @NotNull
        private Long assignedToEmployeeId;
        private Long departmentId;
       @NotNull @FutureOrPresent(message = "Due date must be today or in the future")
        private LocalDate dueDate;
        private LocalDate reminderDate;
        private Integer estimatedHours;
    }

    @Data
    public static class UpdateTaskRequest {
        @Size(min = 3, max = 255)
        private String title;
        private String description;
        private TaskPriority priority;
        private TaskStatus status;
        private Long assignedToEmployeeId;
        private LocalDate dueDate;
        private LocalDate reminderDate;
        private Integer estimatedHours;
    }

    @Data
    public static class AddProgressRequest {
        @NotBlank
        private String comment;
        @Min(0) @Max(100)
        private Integer progressPercent;
    }

    @Data
    public static class ExtensionRequest {
        @NotNull @FutureOrPresent(message = "New due date must be today or in the future")
        private LocalDate newDueDate;
        @NotBlank
        private String reason;
    }
}
