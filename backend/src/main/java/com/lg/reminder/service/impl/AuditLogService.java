package com.lg.reminder.service.impl;

import com.lg.reminder.entity.AuditLog;
import com.lg.reminder.entity.User;
import com.lg.reminder.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;

    @Async
    public void log(User user, String action, String entityType, Long entityId, String description, String ip) {
        AuditLog log = AuditLog.builder()
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .description(description)
                .ipAddress(ip)
                .build();
        auditLogRepository.save(log);
    }
}
