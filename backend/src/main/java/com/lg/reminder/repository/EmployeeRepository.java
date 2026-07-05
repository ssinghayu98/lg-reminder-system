package com.lg.reminder.repository;

import com.lg.reminder.entity.Employee;
import com.lg.reminder.enums.EmployeeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;


@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.user LEFT JOIN FETCH e.department")
    Page<Employee> findAllWithUserAndDepartment(Pageable pageable);

    Optional<Employee> findByUserId(Long userId);
    Optional<Employee> findByEmployeeCode(String code);
    List<Employee> findByDepartmentId(Long departmentId);
    List<Employee> findByStatus(EmployeeStatus status);
    Page<Employee> findByDepartmentId(Long departmentId, Pageable pageable);
    long countByStatus(EmployeeStatus status);
    long countByDepartmentId(Long departmentId);
}
