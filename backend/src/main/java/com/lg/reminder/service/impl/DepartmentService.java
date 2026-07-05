package com.lg.reminder.service.impl;

import com.lg.reminder.entity.*;
import com.lg.reminder.exception.*;
import com.lg.reminder.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DepartmentService {
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional
    public Department create(String name, String description, Long managerId) {
        if (departmentRepository.existsByName(name))
            throw new BadRequestException("Department already exists: " + name);
        Department dept = Department.builder().name(name).description(description).build();
        if (managerId != null) {
            dept.setManager(userRepository.findById(managerId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", managerId)));
        }
        return departmentRepository.save(dept);
    }

    @Transactional
    public Department update(Long id, String name, String description, Long managerId) {
        Department dept = getById(id);
        if (name != null) dept.setName(name);
        if (description != null) dept.setDescription(description);
        if (managerId != null) {
            dept.setManager(userRepository.findById(managerId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", managerId)));
        }
        return departmentRepository.save(dept);
    }

    public Department getById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
    }

    public List<Department> getAll() {
        return departmentRepository.findByIsActiveTrue();
    }

    public Map<String, Object> getDepartmentStats(Long deptId) {
        Department dept = getById(deptId);
        return Map.of(
            "name", dept.getName(),
            "totalEmployees", employeeRepository.countByDepartmentId(deptId),
            "totalTasks", taskRepository.countByDepartmentId(deptId)
        );
    }

    @Transactional
    public void delete(Long id) {
        departmentRepository.deleteById(id);
    }
}
