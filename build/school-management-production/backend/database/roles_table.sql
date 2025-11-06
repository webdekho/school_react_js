-- Create roles table and update staff table to use role_id
-- This fixes the role autocomplete issue in StaffManagement

-- Create roles table
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  `permissions` text,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default roles
INSERT IGNORE INTO `roles` (`name`, `description`, `permissions`) VALUES
('Teacher', 'Regular teaching staff', '["students.view", "students.create", "students.update", "parents.view", "grades.view", "divisions.view"]'),
('Principal', 'School Principal', '["dashboard", "students", "parents", "staff.view", "grades", "divisions", "announcements", "reports"]'),
('Vice Principal', 'Assistant Principal', '["dashboard", "students", "parents", "staff.view", "grades", "divisions", "announcements"]'),
('Admin', 'System Administrator', '["dashboard", "students", "parents", "staff", "grades", "divisions", "academic_years", "fees", "announcements", "reports"]'),
('Librarian', 'Library staff', '["students.view", "parents.view", "grades.view", "divisions.view"]'),
('Accountant', 'Accounts and fees management', '["students.view", "parents.view", "fees", "reports.view"]');

-- Add role_id column to staff table
ALTER TABLE `staff` ADD COLUMN `role_id` int(11) DEFAULT NULL AFTER `mobile`;

-- Add foreign key constraint
ALTER TABLE `staff` ADD CONSTRAINT `fk_staff_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL;

-- Update existing staff records to use role_id based on role_name
UPDATE `staff` SET `role_id` = (
  CASE 
    WHEN `role_name` = 'Administrator' THEN (SELECT id FROM roles WHERE name = 'Admin')
    WHEN `role_name` = 'Principal' THEN (SELECT id FROM roles WHERE name = 'Principal')
    WHEN `role_name` = 'Vice Principal' THEN (SELECT id FROM roles WHERE name = 'Vice Principal')
    WHEN `role_name` = 'Teacher' THEN (SELECT id FROM roles WHERE name = 'Teacher')
    WHEN `role_name` = 'Librarian' THEN (SELECT id FROM roles WHERE name = 'Librarian')
    WHEN `role_name` = 'Accountant' THEN (SELECT id FROM roles WHERE name = 'Accountant')
    ELSE (SELECT id FROM roles WHERE name = 'Teacher')
  END
);

-- Make role_id NOT NULL after updating existing records
ALTER TABLE `staff` MODIFY `role_id` int(11) NOT NULL;

-- Add index for better performance
ALTER TABLE `staff` ADD INDEX `idx_role_id` (`role_id`);