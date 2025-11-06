-- Staff Attendance Table
-- This table tracks staff attendance including check-in, check-out times, and work hours

CREATE TABLE IF NOT EXISTS `staff_attendance` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `staff_id` int(11) NOT NULL,
    `attendance_date` date NOT NULL,
    `status` enum('present','absent','late','half_day','leave') NOT NULL DEFAULT 'present',
    `check_in_time` time DEFAULT NULL,
    `check_out_time` time DEFAULT NULL,
    `work_hours` decimal(5,2) DEFAULT NULL COMMENT 'Total work hours for the day',
    `remarks` text DEFAULT NULL,
    `marked_by_staff_id` int(11) DEFAULT NULL COMMENT 'Staff member who marked this attendance',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_staff_date` (`staff_id`, `attendance_date`),
    KEY `idx_staff_id` (`staff_id`),
    KEY `idx_attendance_date` (`attendance_date`),
    KEY `idx_status` (`status`),
    KEY `idx_marked_by` (`marked_by_staff_id`),
    CONSTRAINT `fk_staff_attendance_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_staff_attendance_marked_by` FOREIGN KEY (`marked_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Staff attendance tracking';

-- Indexes for better performance
CREATE INDEX `idx_date_status` ON `staff_attendance` (`attendance_date`, `status`);
CREATE INDEX `idx_staff_date_status` ON `staff_attendance` (`staff_id`, `attendance_date`, `status`);
