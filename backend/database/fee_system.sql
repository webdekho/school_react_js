-- Fee System Database Schema
-- This file contains all tables needed for the comprehensive fee collection system

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
INSERT INTO `fee_categories` (`name`, `description`) VALUES
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
  `is_mandatory` tinyint(1) DEFAULT 1,
  `installments_allowed` tinyint(1) DEFAULT 1,
  `max_installments` int(11) DEFAULT 1,
  `late_fee_amount` decimal(10,2) DEFAULT 0.00,
  `late_fee_days` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `academic_year_id` (`academic_year_id`),
  KEY `grade_id` (`grade_id`),
  KEY `division_id` (`division_id`),
  KEY `fee_category_id` (`fee_category_id`),
  CONSTRAINT `fee_structures_ibfk_1` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fee_structures_ibfk_2` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fee_structures_ibfk_3` FOREIGN KEY (`division_id`) REFERENCES `divisions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fee_structures_ibfk_4` FOREIGN KEY (`fee_category_id`) REFERENCES `fee_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student Fee Assignments Table
CREATE TABLE IF NOT EXISTS `student_fee_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `fee_structure_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(10,2) DEFAULT 0.00,
  `pending_amount` decimal(10,2) DEFAULT 0.00,
  `due_date` date,
  `late_fee_applied` decimal(10,2) DEFAULT 0.00,
  `status` enum('pending','partial','paid','overdue') DEFAULT 'pending',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `fee_structure_id` (`fee_structure_id`),
  KEY `status` (`status`),
  CONSTRAINT `student_fee_assignments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_fee_assignments_ibfk_2` FOREIGN KEY (`fee_structure_id`) REFERENCES `fee_structures` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fee Collections Table (Payment Transactions)
CREATE TABLE IF NOT EXISTS `fee_collections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `student_fee_assignment_id` int(11) NOT NULL,
  `collected_by_staff_id` int(11),
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` enum('cash','card','online','cheque','dd') DEFAULT 'cash',
  `payment_reference` varchar(100),
  `transaction_id` varchar(100),
  `receipt_number` varchar(50) NOT NULL,
  `collection_date` date NOT NULL,
  `remarks` text,
  `is_verified` tinyint(1) DEFAULT 0,
  `verified_by_admin_id` int(11),
  `verification_date` timestamp NULL,
  `is_transferred` tinyint(1) DEFAULT 0,
  `transferred_date` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  KEY `student_id` (`student_id`),
  KEY `student_fee_assignment_id` (`student_fee_assignment_id`),
  KEY `collected_by_staff_id` (`collected_by_staff_id`),
  KEY `verified_by_admin_id` (`verified_by_admin_id`),
  KEY `collection_date` (`collection_date`),
  CONSTRAINT `fee_collections_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fee_collections_ibfk_2` FOREIGN KEY (`student_fee_assignment_id`) REFERENCES `student_fee_assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fee_collections_ibfk_3` FOREIGN KEY (`collected_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fee_collections_ibfk_4` FOREIGN KEY (`verified_by_admin_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Staff Ledger Table
CREATE TABLE IF NOT EXISTS `staff_ledger` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `staff_id` int(11) NOT NULL,
  `collection_date` date NOT NULL,
  `total_collections` decimal(10,2) DEFAULT 0.00,
  `cash_amount` decimal(10,2) DEFAULT 0.00,
  `card_amount` decimal(10,2) DEFAULT 0.00,
  `online_amount` decimal(10,2) DEFAULT 0.00,
  `cheque_amount` decimal(10,2) DEFAULT 0.00,
  `dd_amount` decimal(10,2) DEFAULT 0.00,
  `pending_verification` decimal(10,2) DEFAULT 0.00,
  `verified_amount` decimal(10,2) DEFAULT 0.00,
  `transferred_amount` decimal(10,2) DEFAULT 0.00,
  `pending_transfer` decimal(10,2) DEFAULT 0.00,
  `remarks` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_date_unique` (`staff_id`, `collection_date`),
  KEY `staff_id` (`staff_id`),
  KEY `collection_date` (`collection_date`),
  CONSTRAINT `staff_ledger_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Announcements Table
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `created_by_staff_id` int(11) NOT NULL,
  `target_type` enum('all','grade','division','parent','staff','fee_due') NOT NULL,
  `target_ids` json,
  `channels` json NOT NULL COMMENT 'Array of channels: whatsapp, sms, email',
  `scheduled_at` timestamp NULL,
  `sent_at` timestamp NULL,
  `status` enum('draft','scheduled','sending','sent','failed') DEFAULT 'draft',
  `total_recipients` int(11) DEFAULT 0,
  `sent_count` int(11) DEFAULT 0,
  `failed_count` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by_staff_id` (`created_by_staff_id`),
  KEY `status` (`status`),
  KEY `scheduled_at` (`scheduled_at`),
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`created_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Announcement Delivery Status Table
CREATE TABLE IF NOT EXISTS `announcement_delivery_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `announcement_id` int(11) NOT NULL,
  `recipient_type` enum('parent','staff') NOT NULL,
  `recipient_id` int(11) NOT NULL,
  `recipient_mobile` varchar(15),
  `recipient_email` varchar(100),
  `channel` enum('whatsapp','sms','email') NOT NULL,
  `status` enum('pending','sent','delivered','failed','read') DEFAULT 'pending',
  `sent_at` timestamp NULL,
  `delivered_at` timestamp NULL,
  `failed_reason` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `announcement_id` (`announcement_id`),
  KEY `recipient_type_id` (`recipient_type`, `recipient_id`),
  KEY `status` (`status`),
  CONSTRAINT `announcement_delivery_status_ibfk_1` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Complaints Table
CREATE TABLE IF NOT EXISTS `complaints` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `complaint_number` varchar(50) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `subject` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `category` enum('academic','transport','facility','staff','fee','other') DEFAULT 'other',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `status` enum('new','in_progress','resolved','closed') DEFAULT 'new',
  `assigned_to_staff_id` int(11) DEFAULT NULL,
  `resolution` text,
  `resolved_at` timestamp NULL,
  `resolved_by_staff_id` int(11) DEFAULT NULL,
  `attachments` json,
  `is_anonymous` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `complaint_number` (`complaint_number`),
  KEY `parent_id` (`parent_id`),
  KEY `student_id` (`student_id`),
  KEY `assigned_to_staff_id` (`assigned_to_staff_id`),
  KEY `resolved_by_staff_id` (`resolved_by_staff_id`),
  KEY `status` (`status`),
  KEY `priority` (`priority`),
  CONSTRAINT `complaints_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `complaints_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL,
  CONSTRAINT `complaints_ibfk_3` FOREIGN KEY (`assigned_to_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `complaints_ibfk_4` FOREIGN KEY (`resolved_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Complaint Comments/Updates Table
CREATE TABLE IF NOT EXISTS `complaint_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `complaint_id` int(11) NOT NULL,
  `commented_by_type` enum('parent','staff','admin') NOT NULL,
  `commented_by_id` int(11) NOT NULL,
  `comment` text NOT NULL,
  `attachments` json,
  `is_internal` tinyint(1) DEFAULT 0 COMMENT 'Internal staff notes not visible to parents',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `complaint_id` (`complaint_id`),
  KEY `commented_by` (`commented_by_type`, `commented_by_id`),
  CONSTRAINT `complaint_comments_ibfk_1` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Update students table to add bus route
ALTER TABLE `students` ADD COLUMN `bus_route_id` int(11) DEFAULT NULL AFTER `parent_id`;
ALTER TABLE `students` ADD KEY `bus_route_id` (`bus_route_id`);
ALTER TABLE `students` ADD CONSTRAINT `students_ibfk_bus_route` FOREIGN KEY (`bus_route_id`) REFERENCES `bus_routes` (`id`) ON DELETE SET NULL;

-- Add indexes for better performance
ALTER TABLE `fee_collections` ADD INDEX `idx_collection_staff_date` (`collected_by_staff_id`, `collection_date`);
ALTER TABLE `fee_collections` ADD INDEX `idx_student_date` (`student_id`, `collection_date`);
ALTER TABLE `student_fee_assignments` ADD INDEX `idx_student_status` (`student_id`, `status`);

-- Insert sample bus routes
INSERT INTO `bus_routes` (`route_name`, `pickup_points`, `monthly_fee`, `distance_km`, `driver_name`, `driver_mobile`, `bus_number`) VALUES
('Route A - Central Area', '["Stop 1: Central Market", "Stop 2: City Park", "Stop 3: Main Square"]', 500.00, 15.5, 'Rajesh Kumar', '9876543210', 'RJ-01-AB-1234'),
('Route B - North Zone', '["Stop 1: North Plaza", "Stop 2: Green Valley", "Stop 3: Hill View"]', 600.00, 20.0, 'Suresh Singh', '9876543211', 'RJ-01-AB-1235'),
('Route C - South Zone', '["Stop 1: South Mall", "Stop 2: River Side", "Stop 3: Palm Heights"]', 550.00, 18.2, 'Mahesh Sharma', '9876543212', 'RJ-01-AB-1236');