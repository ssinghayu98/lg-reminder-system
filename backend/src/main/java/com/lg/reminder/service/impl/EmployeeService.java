package com.lg.reminder.service.impl;

import com.lg.reminder.dto.request.EmployeeDTOs.*;
import com.lg.reminder.dto.response.PagedResponse;
import com.lg.reminder.entity.*;
import com.lg.reminder.enums.*;
import com.lg.reminder.exception.*;
import com.lg.reminder.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Transactional
    public Employee createEmployee(CreateEmployeeRequest req, String adminEmail) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email already registered: " + req.getEmail());
        }

        Department dept = departmentRepository.findById(req.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", req.getDepartmentId()));

        User user = User.builder()
                .fullName(req.getFullName())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .phone(req.getPhone())
                .role(Role.ROLE_EMPLOYEE)
                .emailVerified(true)
                .build();
        user = userRepository.save(user);

        String empCode = generateEmployeeCode(dept.getName());

        Employee employee = Employee.builder()
                .user(user)
                .department(dept)
                .employeeCode(empCode)
                .designation(req.getDesignation())
                .joiningDate(req.getJoiningDate() != null ? req.getJoiningDate() : LocalDate.now())
                .status(EmployeeStatus.ACTIVE)
                .build();

        employee = employeeRepository.save(employee);

        User admin = userRepository.findByEmail(adminEmail).orElse(null);
        auditLogService.log(admin, "EMPLOYEE_CREATED", "Employee", employee.getId(),
                "Employee created: " + user.getEmail(), null);

        return employee;
    }

    @Transactional
    public Employee updateEmployee(Long id, UpdateEmployeeRequest req, String updaterEmail) {
        Employee employee = getById(id);

        if (req.getFullName() != null) employee.getUser().setFullName(req.getFullName());
        if (req.getPhone() != null) employee.getUser().setPhone(req.getPhone());
        if (req.getDesignation() != null) employee.setDesignation(req.getDesignation());

        if (req.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(req.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", req.getDepartmentId()));
            employee.setDepartment(dept);
        }

        userRepository.save(employee.getUser());
        employee = employeeRepository.save(employee);

        User updater = userRepository.findByEmail(updaterEmail).orElse(null);
        auditLogService.log(updater, "EMPLOYEE_UPDATED", "Employee", id, "Employee updated", null);
        return employee;
    }

    @Transactional
    public void toggleStatus(Long id, String email) {
        Employee employee = getById(id);
        employee.setStatus(employee.getStatus() == EmployeeStatus.ACTIVE
                ? EmployeeStatus.INACTIVE : EmployeeStatus.ACTIVE);
        employee.getUser().setIsActive(employee.getStatus() == EmployeeStatus.ACTIVE);
        userRepository.save(employee.getUser());
        employeeRepository.save(employee);
    }

    @Transactional
    public void deleteEmployee(Long id, String adminEmail) {
        Employee employee = getById(id);
        employeeRepository.delete(employee);
        User admin = userRepository.findByEmail(adminEmail).orElse(null);
        auditLogService.log(admin, "EMPLOYEE_DELETED", "Employee", id,
                "Employee deleted: " + employee.getUser().getEmail(), null);
    }

    public Employee getById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
    }

    public PagedResponse<Employee> getAllEmployees(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("user.fullName"));
       Page<Employee> result = employeeRepository.findAllWithUserAndDepartment(pageable);
        return buildPagedResponse(result);
    }

    public PagedResponse<Employee> getByDepartment(Long deptId, int page, int size) {
        Page<Employee> result = employeeRepository.findByDepartmentId(deptId, PageRequest.of(page, size));
        return buildPagedResponse(result);
    }

    public Map<String, Long> getStats() {
        return Map.of(
            "total", employeeRepository.count(),
            "active", employeeRepository.countByStatus(EmployeeStatus.ACTIVE),
            "inactive", employeeRepository.countByStatus(EmployeeStatus.INACTIVE),
            "onLeave", employeeRepository.countByStatus(EmployeeStatus.ON_LEAVE)
        );
    }

    @Transactional
    public List<Employee> bulkImport(List<BulkImportRow> rows, String adminEmail) {
        List<Employee> created = new ArrayList<>();
        for (BulkImportRow row : rows) {
            try {
                CreateEmployeeRequest req = new CreateEmployeeRequest();
                req.setFullName(row.getFullName());
                req.setEmail(row.getEmail());
                req.setPhone(row.getPhone());
                req.setDesignation(row.getDesignation());

                Department dept = departmentRepository.findByName(row.getDepartmentName())
                        .orElseThrow(() -> new ResourceNotFoundException("Department: " + row.getDepartmentName()));
                req.setDepartmentId(dept.getId());
                req.setPassword(UUID.randomUUID().toString());

                if (row.getJoiningDate() != null && !row.getJoiningDate().isBlank()) {
                    req.setJoiningDate(LocalDate.parse(row.getJoiningDate(), DateTimeFormatter.ISO_DATE));
                }

                created.add(createEmployee(req, adminEmail));
            } catch (Exception e) {
                log.warn("Skipping row for {}: {}", row.getEmail(), e.getMessage());
            }
        }
        return created;
    }

    private String generateEmployeeCode(String deptName) {
        String prefix = deptName.substring(0, Math.min(3, deptName.length())).toUpperCase();
        return prefix + "-" + System.currentTimeMillis() % 100000;
    }

    private <T> PagedResponse<T> buildPagedResponse(Page<T> page) {
        return PagedResponse.<T>builder()
                .content(page.getContent()).page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .last(page.isLast()).build();
    }
}
