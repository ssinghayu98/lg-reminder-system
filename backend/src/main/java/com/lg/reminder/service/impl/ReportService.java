package com.lg.reminder.service.impl;

import com.lg.reminder.entity.*;
import com.lg.reminder.enums.*;
import com.lg.reminder.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {
    private final TaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;
    private final ReminderLogRepository reminderLogRepository;

    public Map<String, Object> getAdminDashboardStats() {
        LocalDate today = LocalDate.now();
        return Map.of(
            "totalEmployees", employeeRepository.count(),
            "activeEmployees", employeeRepository.countByStatus(EmployeeStatus.ACTIVE),
            "totalTasks", taskRepository.count(),
            "pendingTasks", taskRepository.countByStatus(TaskStatus.PENDING)
                         + taskRepository.countByStatus(TaskStatus.ASSIGNED)
                         + taskRepository.countByStatus(TaskStatus.IN_PROGRESS),
            "completedTasks", taskRepository.countByStatus(TaskStatus.COMPLETED),
            "overdueTasks", taskRepository.countOverdueTasks(today),
            "remindersSent", reminderLogRepository.countSuccessful(),
            "remindersFailed", reminderLogRepository.countFailed()
        );
    }

    public byte[] generateTaskReportExcel() throws Exception {
        List<Task> tasks = taskRepository.findAll();
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Task Report");

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Headers
            String[] headers = {"ID","Title","Description","Priority","Status","Assigned To","Department","Due Date","Progress %","Created At"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 1;
            for (Task task : tasks) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(task.getId());
                row.createCell(1).setCellValue(task.getTitle());
                row.createCell(2).setCellValue(task.getDescription() != null ? task.getDescription() : "");
                row.createCell(3).setCellValue(task.getPriority().name());
                row.createCell(4).setCellValue(task.getStatus().name());
                row.createCell(5).setCellValue(task.getAssignedTo() != null
                        ? task.getAssignedTo().getUser().getFullName() : "Unassigned");
                row.createCell(6).setCellValue(task.getDepartment() != null
                        ? task.getDepartment().getName() : "");
                row.createCell(7).setCellValue(task.getDueDate().toString());
                row.createCell(8).setCellValue(task.getProgressPercent() != null ? task.getProgressPercent() : 0);
                row.createCell(9).setCellValue(task.getCreatedAt().toString());
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] generateEmployeeReportExcel() throws Exception {
        List<Employee> employees = employeeRepository.findAll();
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Employee Report");
            CellStyle hStyle = workbook.createCellStyle();
            Font hFont = workbook.createFont(); hFont.setBold(true);
            hStyle.setFont(hFont);

            String[] headers = {"Code","Name","Email","Phone","Department","Designation","Status","Total Tasks","Completed","Pending"};
            Row hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell c = hRow.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(hStyle);
            }

            int rowNum = 1;
            for (Employee emp : employees) {
                Row row = sheet.createRow(rowNum++);
                long total = taskRepository.countByAssignedToId(emp.getId());
                long completed = taskRepository.countByAssignedToIdAndStatus(emp.getId(), TaskStatus.COMPLETED);
                row.createCell(0).setCellValue(emp.getEmployeeCode() != null ? emp.getEmployeeCode() : "");
                row.createCell(1).setCellValue(emp.getUser().getFullName());
                row.createCell(2).setCellValue(emp.getUser().getEmail());
                row.createCell(3).setCellValue(emp.getUser().getPhone() != null ? emp.getUser().getPhone() : "");
                row.createCell(4).setCellValue(emp.getDepartment() != null ? emp.getDepartment().getName() : "");
                row.createCell(5).setCellValue(emp.getDesignation() != null ? emp.getDesignation() : "");
                row.createCell(6).setCellValue(emp.getStatus().name());
                row.createCell(7).setCellValue(total);
                row.createCell(8).setCellValue(completed);
                row.createCell(9).setCellValue(total - completed);
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }
}
