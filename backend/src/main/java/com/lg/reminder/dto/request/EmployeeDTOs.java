package com.lg.reminder.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

public class EmployeeDTOs {

    @Data
    public static class CreateEmployeeRequest {
        @NotBlank @Size(min = 2, max = 100)
        private String fullName;
        @NotBlank @Email
        private String email;
        @NotBlank @Size(min = 8)
        private String password;
        @Pattern(regexp = "^\\+?[0-9]{10,15}$")
        private String phone;
        @NotNull
        private Long departmentId;
        private String designation;
        private LocalDate joiningDate;
    }

    @Data
    public static class UpdateEmployeeRequest {
        @Size(min = 2, max = 100)
        private String fullName;
        private String phone;
        private Long departmentId;
        private String designation;
    }

    @Data
    public static class BulkImportRow {
        private String fullName;
        private String email;
        private String phone;
        private String departmentName;
        private String designation;
        private String joiningDate;
    }
}
