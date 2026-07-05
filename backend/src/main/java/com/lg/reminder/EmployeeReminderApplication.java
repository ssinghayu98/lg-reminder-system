package com.lg.reminder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EmployeeReminderApplication {
    public static void main(String[] args) {
        SpringApplication.run(EmployeeReminderApplication.class, args);
    }
}
