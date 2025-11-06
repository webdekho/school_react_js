-- =============================================
-- STUDENT ATTENDANCE TABLE
-- =============================================

-- Drop table if exists (use with caution in production)
-- DROP TABLE IF EXISTS `student_attendance`;

-- Create Student Attendance Table
CREATE TABLE IF NOT EXISTS `student_attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('present', 'absent', 'late', 'half_day') DEFAULT 'present',
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `remarks` varchar(200) DEFAULT NULL,
  `marked_by_staff_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`marked_by_staff_id`) REFERENCES `staff`(`id`) ON DELETE RESTRICT,
  UNIQUE KEY `student_date` (`student_id`, `attendance_date`),
  INDEX `idx_attendance_date` (`attendance_date`),
  INDEX `idx_status` (`status`),
  INDEX `idx_student` (`student_id`),
  INDEX `idx_marked_by` (`marked_by_staff_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- You can insert sample attendance data if needed
-- Example:
-- INSERT INTO `student_attendance` (`student_id`, `attendance_date`, `status`, `marked_by_staff_id`) VALUES
-- (1, '2024-11-01', 'present', 1),
-- (2, '2024-11-01', 'present', 1),
-- (3, '2024-11-01', 'absent', 1);


