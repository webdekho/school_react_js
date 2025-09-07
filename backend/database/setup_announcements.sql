-- Announcements Tables Setup
-- Run this script to set up announcements functionality

-- First, let's check if we need to create staff/parents tables
-- Create staff table if it doesn't exist
CREATE TABLE IF NOT EXISTS `staff` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role_name` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create parents table if it doesn't exist
CREATE TABLE IF NOT EXISTS `parents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create grades table if it doesn't exist
CREATE TABLE IF NOT EXISTS `grades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create divisions table if it doesn't exist
CREATE TABLE IF NOT EXISTS `divisions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `grade_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Announcements table
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `target_type` enum('all','grade','division','parent','staff','fee_due') NOT NULL,
  `target_ids` json DEFAULT NULL,
  `channels` json NOT NULL,
  `status` enum('draft','scheduled','sending','sent','failed') NOT NULL DEFAULT 'draft',
  `scheduled_at` datetime DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `total_recipients` int(11) DEFAULT 0,
  `sent_count` int(11) DEFAULT 0,
  `failed_count` int(11) DEFAULT 0,
  `created_by_staff_id` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by_staff_id` (`created_by_staff_id`),
  KEY `status` (`status`),
  KEY `target_type` (`target_type`),
  KEY `scheduled_at` (`scheduled_at`),
  KEY `idx_announcements_target_status` (`target_type`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Announcement Delivery Status table
CREATE TABLE IF NOT EXISTS `announcement_delivery_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `announcement_id` int(11) NOT NULL,
  `recipient_type` enum('parent','staff') NOT NULL,
  `recipient_id` int(11) NOT NULL,
  `recipient_name` varchar(100) DEFAULT NULL,
  `recipient_mobile` varchar(20) DEFAULT NULL,
  `recipient_email` varchar(100) DEFAULT NULL,
  `channel` enum('whatsapp','sms','email') NOT NULL,
  `status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
  `sent_at` datetime DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `announcement_id` (`announcement_id`),
  KEY `recipient_type_id` (`recipient_type`, `recipient_id`),
  KEY `status` (`status`),
  KEY `channel` (`channel`),
  CONSTRAINT `announcement_delivery_status_ibfk_1` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample data
-- Add sample staff
INSERT IGNORE INTO `staff` (`id`, `name`, `mobile`, `email`, `role_name`) VALUES 
(1, 'Admin User', '+91-9876543210', 'admin@school.com', 'Admin'),
(2, 'Principal', '+91-9876543211', 'principal@school.com', 'Principal');

-- Add sample parents
INSERT IGNORE INTO `parents` (`id`, `name`, `mobile`, `email`) VALUES 
(1, 'John Doe', '+91-9876543212', 'john.doe@email.com'),
(2, 'Jane Smith', '+91-9876543213', 'jane.smith@email.com'),
(3, 'Mike Johnson', '+91-9876543214', 'mike.johnson@email.com');

-- Add sample grades
INSERT IGNORE INTO `grades` (`id`, `name`) VALUES 
(1, 'Grade 1'),
(2, 'Grade 2'),
(3, 'Grade 3');

-- Add sample divisions
INSERT IGNORE INTO `divisions` (`id`, `name`, `grade_id`) VALUES 
(1, 'Division A', 1),
(2, 'Division B', 1),
(3, 'Division A', 2);

-- Insert sample announcement data
INSERT IGNORE INTO `announcements` (
  `id`, `title`, `message`, `target_type`, `channels`, `status`, `created_by_staff_id`, `total_recipients`, `sent_count`
) VALUES 
(1, 'Welcome to the New Academic Year', 'Dear Parents and Students, Welcome to the new academic year! We are excited to begin this journey with you. Please ensure all admission formalities are completed by the end of this week.', 'all', '["whatsapp", "sms"]', 'sent', 1, 5, 5),
(2, 'Fee Payment Reminder', 'This is a gentle reminder that the fee payment for this semester is due by the end of this month. Please visit the school office or use our online payment system.', 'fee_due', '["whatsapp", "email"]', 'sent', 1, 2, 2),
(3, 'Parent-Teacher Meeting Schedule', 'Parent-Teacher meetings are scheduled for next weekend. Please check the schedule posted on the school notice board and confirm your attendance.', 'all', '["whatsapp", "sms", "email"]', 'draft', 1, 0, 0);