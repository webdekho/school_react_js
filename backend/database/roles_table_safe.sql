-- Create roles table (safe version)
-- Run this first to fix the roles_dropdown API error

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

-- Insert default roles (if they don't exist)
INSERT IGNORE INTO `roles` (`name`, `description`, `permissions`) VALUES
('Teacher', 'Regular teaching staff', '["students.view", "students.create", "students.update", "parents.view", "grades.view", "divisions.view"]'),
('Principal', 'School Principal', '["dashboard", "students", "parents", "staff.view", "grades", "divisions", "announcements", "reports"]'),
('Vice Principal', 'Assistant Principal', '["dashboard", "students", "parents", "staff.view", "grades", "divisions", "announcements"]'),
('Admin', 'System Administrator', '["dashboard", "students", "parents", "staff", "grades", "divisions", "academic_years", "fees", "announcements", "reports"]'),
('Librarian', 'Library staff', '["students.view", "parents.view", "grades.view", "divisions.view"]'),
('Accountant', 'Accounts and fees management', '["students.view", "parents.view", "fees", "reports.view"]');