package com.lg.reminder.controller;

import com.lg.reminder.dto.response.ApiResponse;
import com.lg.reminder.entity.Department;
import com.lg.reminder.service.impl.DepartmentService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
@Tag(name = "Departments")
@SecurityRequirement(name = "bearerAuth")
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Department>> create(@RequestBody Map<String, Object> body) {
        Department dept = departmentService.create(
            (String) body.get("name"),
            (String) body.get("description"),
            body.get("managerId") != null ? Long.valueOf(body.get("managerId").toString()) : null
        );
        return ResponseEntity.ok(ApiResponse.success("Department created", dept));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Department>>> list() {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Department>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Department>> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Department dept = departmentService.update(id,
            (String) body.get("name"),
            (String) body.get("description"),
            body.get("managerId") != null ? Long.valueOf(body.get("managerId").toString()) : null
        );
        return ResponseEntity.ok(ApiResponse.success("Updated", dept));
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getDepartmentStats(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        departmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }
}
