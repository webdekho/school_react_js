-- Complete School Management System Database Schema
-- This file contains ALL tables needed for the comprehensive school management system

-- =============================================
-- CORE SYSTEM TABLES
-- =============================================

-- Academic Years Table
CREATE TABLE IF NOT EXISTS `academic_years` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `start_year` year(4) NOT NULL,
  `end_year` year(4) NOT NULL,
  `name` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_current` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `start_end_year` (`start_year`, `end_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default academic years
INSERT IGNORE INTO `academic_years` (`start_year`, `end_year`, `name`, `is_current`) VALUES
(2024, 2025, '2024-2025', 1),
(2025, 2026, '2025-2026', 0),
(2023, 2024, '2023-2024', 0);

-- Grades Table
CREATE TABLE IF NOT EXISTS `grades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default grades
INSERT IGNORE INTO `grades` (`name`, `display_order`) VALUES
('Pre-KG', 1), ('LKG', 2), ('UKG', 3), ('Grade 1', 4), ('Grade 2', 5),
('Grade 3', 6), ('Grade 4', 7), ('Grade 5', 8), ('Grade 6', 9), ('Grade 7', 10),
('Grade 8', 11), ('Grade 9', 12), ('Grade 10', 13), ('Grade 11', 14), ('Grade 12', 15);

-- Divisions Table
CREATE TABLE IF NOT EXISTS `divisions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default divisions
INSERT IGNORE INTO `divisions` (`name`, `display_order`) VALUES
('A', 1), ('B', 2), ('C', 3), ('D', 4), ('E', 5);

-- =============================================
-- USER MANAGEMENT TABLES
-- =============================================

-- Staff Table
CREATE TABLE IF NOT EXISTS `staff` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) UNIQUE,
  `mobile` varchar(15),
  `role_name` varchar(50) DEFAULT 'Teacher',
  `department` varchar(100),
  `address` text,
  `date_of_joining` date,
  `salary` decimal(10,2) DEFAULT 0.00,
  `qualifications` text,
  `emergency_contact` varchar(15),
  `employee_id` varchar(20) UNIQUE,
  `is_active` tinyint(1) DEFAULT 1,
  `password_hash` varchar(255),
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_employee_id` (`employee_id`),
  INDEX `idx_role` (`role_name`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin user
INSERT IGNORE INTO `staff` (`name`, `email`, `role_name`, `employee_id`, `password_hash`) VALUES
('System Administrator', 'admin@school.com', 'Administrator', 'ADMIN001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Parents Table
CREATE TABLE IF NOT EXISTS `parents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) UNIQUE,
  `mobile` varchar(15) NOT NULL,
  `alternate_mobile` varchar(15),
  `address` text,
  `occupation` varchar(100),
  `annual_income` decimal(12,2),
  `emergency_contact` varchar(15),
  `relationship` enum('Father', 'Mother', 'Guardian') DEFAULT 'Father',
  `is_active` tinyint(1) DEFAULT 1,
  `password_hash` varchar(255),
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_mobile` (`mobile`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Students Table
CREATE TABLE IF NOT EXISTS `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_name` varchar(100) NOT NULL,
  `roll_number` varchar(20) UNIQUE,
  `admission_number` varchar(20) UNIQUE,
  `academic_year_id` int(11) NOT NULL,
  `grade_id` int(11) NOT NULL,
  `division_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `date_of_birth` date,
  `gender` enum('male', 'female', 'other') DEFAULT 'male',
  `blood_group` varchar(5),
  `address` text,
  `mobile` varchar(15),
  `email` varchar(100),
  `admission_date` date,
  `previous_school` varchar(200),
  `medical_conditions` text,
  `bus_route_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON DELETE RESTRICT,
  INDEX `idx_roll_number` (`roll_number`),
  INDEX `idx_admission_number` (`admission_number`),
  INDEX `idx_grade_division` (`grade_id`, `division_id`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- FEE MANAGEMENT TABLES
-- =============================================

-- Fee Categories Table
CREATE TABLE IF NOT EXISTS `fee_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default fee categories
INSERT IGNORE INTO `fee_categories` (`name`, `description`) VALUES
('Bag', 'School bag and related accessories'),
('Book', 'Textbooks and learning materials'),
('Uniform/Shoes', 'School uniform, shoes and dress code items'),
('General Payment', 'Miscellaneous payments and fees'),
('Event Payment', 'School events, trips and activities'),
('Bus Payment', 'School transportation fees'),
('Penalty Charges', 'Late fees and penalty charges');

-- Bus Routes Table
CREATE TABLE IF NOT EXISTS `bus_routes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `route_name` varchar(100) NOT NULL,
  `pickup_points` json,
  `monthly_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `distance_km` decimal(5,2),
  `driver_name` varchar(100),
  `driver_mobile` varchar(15),
  `bus_number` varchar(20),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `route_name` (`route_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fee Structures Table
CREATE TABLE IF NOT EXISTS `fee_structures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `academic_year_id` int(11) NOT NULL,
  `grade_id` int(11) DEFAULT NULL,
  `division_id` int(11) DEFAULT NULL,
  `fee_category_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `due_date` date,
  `late_fee_amount` decimal(10,2) DEFAULT 0.00,
  `late_fee_days` int(11) DEFAULT 0,
  `is_mandatory` tinyint(1) DEFAULT 1,
  `installments_allowed` tinyint(1) DEFAULT 0,
  `max_installments` int(11) DEFAULT 1,
  `description` text,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`fee_category_id`) REFERENCES `fee_categories`(`id`) ON DELETE CASCADE,
  INDEX `idx_academic_year` (`academic_year_id`),
  INDEX `idx_grade_division` (`grade_id`, `division_id`),
  INDEX `idx_category` (`fee_category_id`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student Fee Assignments Table
CREATE TABLE IF NOT EXISTS `student_fee_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `fee_structure_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `pending_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `due_date` date,
  `status` enum('pending', 'partial', 'paid', 'overdue') DEFAULT 'pending',
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `discount_reason` varchar(200),
  `late_fee_applied` decimal(10,2) DEFAULT 0.00,
  `notes` text,
  `is_active` tinyint(1) DEFAULT 1,
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`fee_structure_id`) REFERENCES `fee_structures`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `student_fee_unique` (`student_id`, `fee_structure_id`),
  INDEX `idx_student` (`student_id`),
  INDEX `idx_fee_structure` (`fee_structure_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_due_date` (`due_date`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fee Collections Table
CREATE TABLE IF NOT EXISTS `fee_collections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_fee_assignment_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cash', 'card', 'online', 'cheque', 'dd') NOT NULL DEFAULT 'cash',
  `transaction_id` varchar(100),
  `reference_number` varchar(100),
  `collection_date` date NOT NULL,
  `collected_by_staff_id` int(11) NOT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `verified_by_staff_id` int(11) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `receipt_number` varchar(50),
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`student_fee_assignment_id`) REFERENCES `student_fee_assignments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`collected_by_staff_id`) REFERENCES `staff`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`verified_by_staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL,
  INDEX `idx_assignment` (`student_fee_assignment_id`),
  INDEX `idx_collection_date` (`collection_date`),
  INDEX `idx_collected_by` (`collected_by_staff_id`),
  INDEX `idx_receipt_number` (`receipt_number`),
  INDEX `idx_payment_method` (`payment_method`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Staff Ledger Table
CREATE TABLE IF NOT EXISTS `staff_ledger` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `staff_id` int(11) NOT NULL,
  `fee_collection_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `collection_date` date NOT NULL,
  `status` enum('pending', 'verified', 'discrepancy') DEFAULT 'pending',
  `verified_by_staff_id` int(11) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`fee_collection_id`) REFERENCES `fee_collections`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`verified_by_staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL,
  INDEX `idx_staff` (`staff_id`),
  INDEX `idx_collection_date` (`collection_date`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- COMMUNICATION TABLES
-- =============================================

-- Announcements Table
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `target_type` enum('all', 'grade', 'division', 'parent', 'staff', 'fee_dues') NOT NULL DEFAULT 'all',
  `target_filters` json,
  `channels` json,
  `priority` enum('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `status` enum('draft', 'scheduled', 'sent', 'failed') DEFAULT 'draft',
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `total_recipients` int(11) DEFAULT 0,
  `sent_count` int(11) DEFAULT 0,
  `failed_count` int(11) DEFAULT 0,
  `created_by_staff_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`created_by_staff_id`) REFERENCES `staff`(`id`) ON DELETE RESTRICT,
  INDEX `idx_target_type` (`target_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_by` (`created_by_staff_id`),
  INDEX `idx_scheduled_at` (`scheduled_at`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Announcement Delivery Status Table
CREATE TABLE IF NOT EXISTS `announcement_delivery_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `announcement_id` int(11) NOT NULL,
  `recipient_type` enum('parent', 'staff', 'student') NOT NULL,
  `recipient_id` int(11) NOT NULL,
  `channel` enum('whatsapp', 'sms', 'email') NOT NULL,
  `recipient_contact` varchar(100) NOT NULL,
  `status` enum('pending', 'sent', 'delivered', 'failed', 'read') DEFAULT 'pending',
  `sent_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `error_message` text,
  `retry_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`announcement_id`) REFERENCES `announcements`(`id`) ON DELETE CASCADE,
  INDEX `idx_announcement` (`announcement_id`),
  INDEX `idx_recipient` (`recipient_type`, `recipient_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_channel` (`channel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- COMPLAINT MANAGEMENT TABLES
-- =============================================

-- Complaints Table
CREATE TABLE IF NOT EXISTS `complaints` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `complaint_number` varchar(50) UNIQUE NOT NULL,
  `parent_id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `subject` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `category` enum('Academic', 'Transport', 'Facility', 'Staff', 'Fee', 'Other') DEFAULT 'Other',
  `priority` enum('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
  `status` enum('New', 'In Progress', 'Resolved', 'Closed') DEFAULT 'New',
  `assigned_to_staff_id` int(11) DEFAULT NULL,
  `resolution_notes` text,
  `resolved_by_staff_id` int(11) DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `is_anonymous` tinyint(1) DEFAULT 0,
  `attachments` json,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`assigned_to_staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`resolved_by_staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `complaint_number` (`complaint_number`),
  INDEX `idx_parent` (`parent_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_category` (`category`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_assigned_to` (`assigned_to_staff_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Complaint Comments Table
CREATE TABLE IF NOT EXISTS `complaint_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `complaint_id` int(11) NOT NULL,
  `commenter_type` enum('parent', 'staff') NOT NULL,
  `commenter_id` int(11) NOT NULL,
  `comment` text NOT NULL,
  `is_internal` tinyint(1) DEFAULT 0,
  `attachments` json,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE CASCADE,
  INDEX `idx_complaint` (`complaint_id`),
  INDEX `idx_commenter` (`commenter_type`, `commenter_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- ATTENDANCE TABLES (Optional - for future use)
-- =============================================

-- Student Attendance Table
CREATE TABLE IF NOT EXISTS `student_attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('present', 'absent', 'late', 'half_day') DEFAULT 'present',
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `remarks` varchar(200),
  `marked_by_staff_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`marked_by_staff_id`) REFERENCES `staff`(`id`) ON DELETE RESTRICT,
  UNIQUE KEY `student_date` (`student_id`, `attendance_date`),
  INDEX `idx_attendance_date` (`attendance_date`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Staff Attendance Table
CREATE TABLE IF NOT EXISTS `staff_attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `staff_id` int(11) NOT NULL,
  `attendance_date` date NOT NULL,
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `status` enum('present', 'absent', 'late', 'half_day', 'on_leave') DEFAULT 'present',
  `total_hours` decimal(4,2) DEFAULT 0.00,
  `overtime_hours` decimal(4,2) DEFAULT 0.00,
  `remarks` varchar(200),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `staff_date` (`staff_id`, `attendance_date`),
  INDEX `idx_attendance_date` (`attendance_date`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- SYSTEM CONFIGURATION TABLES
-- =============================================

-- System Settings Table
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `setting_type` enum('string', 'number', 'boolean', 'json') DEFAULT 'string',
  `description` varchar(200),
  `is_public` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default system settings
INSERT IGNORE INTO `system_settings` (`setting_key`, `setting_value`, `setting_type`, `description`, `is_public`) VALUES
('school_name', 'School Management System', 'string', 'School name', 1),
('school_address', '', 'string', 'School address', 1),
('school_phone', '', 'string', 'School contact number', 1),
('school_email', '', 'string', 'School email address', 1),
('academic_year_start_month', '4', 'number', 'Academic year start month (1-12)', 0),
('default_late_fee_days', '30', 'number', 'Default late fee applicable after days', 0),
('receipt_prefix', 'RCP', 'string', 'Receipt number prefix', 0),
('complaint_prefix', 'CMP', 'string', 'Complaint number prefix', 0),
('sms_gateway_enabled', '0', 'boolean', 'Enable SMS gateway', 0),
('email_gateway_enabled', '1', 'boolean', 'Enable email gateway', 0),
('whatsapp_gateway_enabled', '0', 'boolean', 'Enable WhatsApp gateway', 0);

-- =============================================
-- AUDIT AND LOG TABLES
-- =============================================

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_type` enum('staff', 'parent', 'student', 'system') NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `table_name` varchar(50),
  `record_id` int(11) DEFAULT NULL,
  `old_values` json,
  `new_values` json,
  `ip_address` varchar(45),
  `user_agent` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user` (`user_type`, `user_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_table` (`table_name`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- CREATE TRIGGERS FOR AUTO-CALCULATIONS
-- =============================================

-- Trigger to update pending amount in student_fee_assignments
DELIMITER $$
CREATE TRIGGER `update_pending_amount_after_collection` 
AFTER INSERT ON `fee_collections` 
FOR EACH ROW 
BEGIN
    UPDATE `student_fee_assignments` 
    SET 
        `paid_amount` = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM `fee_collections` 
            WHERE `student_fee_assignment_id` = NEW.student_fee_assignment_id
        ),
        `pending_amount` = `total_amount` - (
            SELECT COALESCE(SUM(amount), 0) 
            FROM `fee_collections` 
            WHERE `student_fee_assignment_id` = NEW.student_fee_assignment_id
        ),
        `status` = CASE 
            WHEN (`total_amount` - (
                SELECT COALESCE(SUM(amount), 0) 
                FROM `fee_collections` 
                WHERE `student_fee_assignment_id` = NEW.student_fee_assignment_id
            )) = 0 THEN 'paid'
            WHEN (
                SELECT COALESCE(SUM(amount), 0) 
                FROM `fee_collections` 
                WHERE `student_fee_assignment_id` = NEW.student_fee_assignment_id
            ) > 0 THEN 'partial'
            ELSE 'pending'
        END
    WHERE `id` = NEW.student_fee_assignment_id;
END$$
DELIMITER ;

-- Trigger to insert into staff ledger when fee is collected
DELIMITER $$
CREATE TRIGGER `insert_staff_ledger_on_collection` 
AFTER INSERT ON `fee_collections` 
FOR EACH ROW 
BEGIN
    INSERT INTO `staff_ledger` (
        `staff_id`, 
        `fee_collection_id`, 
        `amount`, 
        `collection_date`, 
        `status`
    ) VALUES (
        NEW.collected_by_staff_id, 
        NEW.id, 
        NEW.amount, 
        NEW.collection_date, 
        'pending'
    );
END$$
DELIMITER ;

-- =============================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =============================================

-- Additional indexes for better query performance
CREATE INDEX `idx_students_search` ON `students` (`student_name`, `roll_number`, `mobile`);
CREATE INDEX `idx_parents_search` ON `parents` (`name`, `mobile`, `email`);
CREATE INDEX `idx_staff_search` ON `staff` (`name`, `mobile`, `email`);
CREATE INDEX `idx_fee_collections_date_staff` ON `fee_collections` (`collection_date`, `collected_by_staff_id`);
CREATE INDEX `idx_student_fee_assignments_due_date` ON `student_fee_assignments` (`due_date`, `status`);
CREATE INDEX `idx_announcements_target_status` ON `announcements` (`target_type`, `status`);
CREATE INDEX `idx_complaints_status_category` ON `complaints` (`status`, `category`);

-- =============================================
-- SAMPLE DATA INSERTION
-- =============================================

-- Insert sample bus routes
INSERT IGNORE INTO `bus_routes` (`route_name`, `monthly_fee`, `distance_km`, `driver_name`, `driver_mobile`, `bus_number`) VALUES
('Route A - Main Road', 1200.00, 15.5, 'Raj Kumar', '9876543210', 'KA01AB1234'),
('Route B - Station Road', 1000.00, 12.0, 'Suresh Babu', '9876543211', 'KA01AB5678'),
('Route C - Market Road', 800.00, 8.5, 'Ramesh Singh', '9876543212', 'KA01AB9012');

-- =============================================
-- COMPLETED SCHOOL MANAGEMENT SYSTEM DATABASE
-- =============================================

-- This database schema includes:
-- 1. Academic year and grade/division management
-- 2. Student, parent, and staff management with complete profiles
-- 3. Comprehensive fee management with categories, structures, assignments, and collections
-- 4. Staff ledger for collection tracking and verification
-- 5. Multi-channel announcement system with delivery tracking
-- 6. Complete complaint management with workflow and comments
-- 7. Attendance tracking for students and staff
-- 8. System configuration and settings
-- 9. Activity logging for audit trails
-- 10. Automatic triggers for calculations
-- 11. Performance-optimized indexes
-- 12. Sample data for immediate testing

-- Total Tables: 19 core tables + system tables
-- Foreign Key Relationships: Properly defined with cascade rules
-- Data Integrity: Enforced through constraints and triggers
-- Performance: Optimized with strategic indexes
-- Scalability: Designed for growth with proper normalization