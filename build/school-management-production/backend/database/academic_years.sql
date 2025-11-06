-- Academic Years Table
CREATE TABLE `academic_years` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT 'e.g., 2025-2026',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 = Active, 0 = Inactive',
  `is_default` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 = Default Academic Year, 0 = Not Default',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_is_default` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default academic year
INSERT INTO `academic_years` (`name`, `start_date`, `end_date`, `is_active`, `is_default`) 
VALUES ('2025-2026', '2025-04-01', '2026-03-31', 1, 1);

-- Add academic_year_id to existing tables
ALTER TABLE `grades` ADD COLUMN `academic_year_id` int(11) NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `grades` ADD KEY `idx_academic_year_id` (`academic_year_id`);
ALTER TABLE `grades` ADD FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE;

ALTER TABLE `divisions` ADD COLUMN `academic_year_id` int(11) NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `divisions` ADD KEY `idx_academic_year_id` (`academic_year_id`);
ALTER TABLE `divisions` ADD FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE;

ALTER TABLE `students` ADD COLUMN `academic_year_id` int(11) NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `students` ADD KEY `idx_academic_year_id` (`academic_year_id`);
ALTER TABLE `students` ADD FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE;

-- Parents table (enhanced)
CREATE TABLE IF NOT EXISTS `parents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `address` text,
  `pincode` varchar(10) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobile` (`mobile`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Staff table (enhanced)
CREATE TABLE IF NOT EXISTS `staff` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `address` text,
  `pincode` varchar(10) DEFAULT NULL,
  `role_id` int(11) NOT NULL DEFAULT 2,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobile` (`mobile`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_is_active` (`is_active`),
  FOREIGN KEY (`role_id`) REFERENCES `user_roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Staff Grade/Division Assignments (Academic Year specific)
CREATE TABLE `staff_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `staff_id` int(11) NOT NULL,
  `grade_id` int(11) DEFAULT NULL,
  `division_id` int(11) DEFAULT NULL,
  `academic_year_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_staff_id` (`staff_id`),
  KEY `idx_grade_id` (`grade_id`),
  KEY `idx_division_id` (`division_id`),
  KEY `idx_academic_year_id` (`academic_year_id`),
  FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fee Structures
CREATE TABLE `fee_structures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT 'e.g., same1, same2',
  `description` text,
  `academic_year_id` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_academic_year_id` (`academic_year_id`),
  KEY `idx_is_active` (`is_active`),
  FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fee Collection Categories
CREATE TABLE `fee_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT 'Bag, Book, Uniform, Bus, etc.',
  `description` text,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default fee categories
INSERT INTO `fee_categories` (`name`, `description`) VALUES
('Bag', 'School bag fees'),
('Book', 'Textbook and notebook fees'),
('Uniform', 'School uniform and shoes fees'),
('Bus', 'Transportation fees'),
('General', 'General payment for miscellaneous items'),
('Event', 'Special event participation fees'),
('Penalty', 'Late payment penalty charges');

-- Fee Collections
CREATE TABLE `fee_collections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `collected_by` int(11) NOT NULL COMMENT 'Staff/Admin ID',
  `collection_date` date NOT NULL,
  `payment_method` enum('cash','online','card') NOT NULL DEFAULT 'cash',
  `receipt_number` varchar(50) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_academic_year_id` (`academic_year_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_collected_by` (`collected_by`),
  KEY `idx_collection_date` (`collection_date`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `fee_categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Announcements
CREATE TABLE `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `target_type` enum('all','grade','division','staff','parent','fee_due') NOT NULL DEFAULT 'all',
  `target_ids` text COMMENT 'JSON array of target IDs',
  `academic_year_id` int(11) NOT NULL,
  `created_by` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sent_via_whatsapp` tinyint(1) NOT NULL DEFAULT 0,
  `sent_via_sms` tinyint(1) NOT NULL DEFAULT 0,
  `sent_via_email` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_academic_year_id` (`academic_year_id`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_target_type` (`target_type`),
  FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Complaints
CREATE TABLE `complaints` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `academic_year_id` int(11) NOT NULL,
  `subject` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `assigned_to` int(11) DEFAULT NULL COMMENT 'Staff/Admin ID',
  `resolution` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_academic_year_id` (`academic_year_id`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Staff Ledger
CREATE TABLE `staff_ledger` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `staff_id` int(11) NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `collection_date` date NOT NULL,
  `total_collected` decimal(10,2) NOT NULL DEFAULT 0.00,
  `transferred_to_admin` decimal(10,2) NOT NULL DEFAULT 0.00,
  `pending_transfer` decimal(10,2) GENERATED ALWAYS AS (`total_collected` - `transferred_to_admin`) STORED,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_staff_id` (`staff_id`),
  KEY `idx_academic_year_id` (`academic_year_id`),
  KEY `idx_collection_date` (`collection_date`),
  FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Update existing audit_logs table to include academic_year_id
ALTER TABLE `audit_logs` ADD COLUMN `academic_year_id` int(11) DEFAULT NULL AFTER `table_name`;
ALTER TABLE `audit_logs` ADD KEY `idx_academic_year_id` (`academic_year_id`);

-- User Sessions (for Academic Year context)
CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `user_type` enum('admin','staff','parent') NOT NULL,
  `selected_academic_year_id` int(11) NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_session` (`user_id`, `user_type`),
  KEY `idx_session_token` (`session_token`),
  KEY `idx_selected_academic_year_id` (`selected_academic_year_id`),
  FOREIGN KEY (`selected_academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;