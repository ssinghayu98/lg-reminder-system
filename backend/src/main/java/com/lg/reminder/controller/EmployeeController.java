package com.lg.reminder.controller;

import com.lg.reminder.dto.request.EmployeeDTOs.*;
import com.lg.reminder.dto.response.*;
import com.lg.reminder.entity.Employee;
import com.lg.reminder.service.impl.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
@Tag(name = "Employees", description = "Employee management")
@SecurityRequirement(name = "bearerAuth")
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @Operation(summary = "Create a new employee")
    public ResponseEntity<ApiResponse<Employee>> create(
            @Valid @RequestBody CreateEmployeeRequest req, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Employee created", employeeService.createEmployee(req, auth.getName())));
    }

    @GetMapping
    @Operation(summary = "List all employees (paginated)")
    public ResponseEntity<ApiResponse<PagedResponse<Employee>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getAllEmployees(page, size, search)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get employee by ID")
    public ResponseEntity<ApiResponse<Employee>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @Operation(summary = "Update employee details")
    public ResponseEntity<ApiResponse<Employee>> update(
            @PathVariable Long id, @RequestBody UpdateEmployeeRequest req, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Updated", employeeService.updateEmployee(id, req, auth.getName())));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Activate or deactivate employee")
    public ResponseEntity<ApiResponse<Void>> toggleStatus(@PathVariable Long id, Authentication auth) {
        employeeService.toggleStatus(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Status toggled", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Delete employee")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id, Authentication auth) {
        employeeService.deleteEmployee(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }

    @GetMapping("/department/{deptId}")
    @Operation(summary = "Get employees by department")
    public ResponseEntity<ApiResponse<PagedResponse<Employee>>> byDepartment(
            @PathVariable Long deptId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getByDepartment(deptId, page, size)));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get employee statistics")
    public ResponseEntity<ApiResponse<Map<String, Long>>> stats() {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getStats()));
    }

    @PostMapping("/bulk-import")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Bulk import employees from CSV data")
    public ResponseEntity<ApiResponse<List<Employee>>> bulkImport(
            @RequestBody List<BulkImportRow> rows, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Import complete",
                employeeService.bulkImport(rows, auth.getName())));
    }
}
