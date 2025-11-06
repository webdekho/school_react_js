-- Fix complaints system tables and ensure all columns exist

-- First, add missing columns one by one
ALTER TABLE `complaints` 
  ADD COLUMN IF NOT EXISTS `complaint_number` varchar(50) UNIQUE DEFAULT NULL AFTER `id`;

ALTER TABLE `complaints`
  ADD COLUMN IF NOT EXISTS `category` enum('academic','transport','facility','staff','fee','other') DEFAULT 'other' AFTER `description`;

ALTER TABLE `complaints`
  ADD COLUMN IF NOT EXISTS `resolution` text DEFAULT NULL;

ALTER TABLE `complaints`
  ADD COLUMN IF NOT EXISTS `assigned_to_staff_id` int(11) DEFAULT NULL;

ALTER TABLE `complaints`
  ADD COLUMN IF NOT EXISTS `resolved_by_staff_id` int(11) DEFAULT NULL;

ALTER TABLE `complaints`
  ADD COLUMN IF NOT EXISTS `resolved_at` timestamp NULL DEFAULT NULL;

ALTER TABLE `complaints`
  ADD COLUMN IF NOT EXISTS `is_anonymous` tinyint(1) DEFAULT 0;

ALTER TABLE `complaints`
  ADD COLUMN IF NOT EXISTS `attachments` json;

ALTER TABLE `complaints`
  ADD COLUMN IF NOT EXISTS `is_active` tinyint(1) DEFAULT 1;

-- Update column types
ALTER TABLE `complaints`
  MODIFY COLUMN `status` enum('new','open','in_progress','resolved','closed') DEFAULT 'new';

ALTER TABLE `complaints`
  MODIFY COLUMN `priority` enum('low','medium','high','urgent') DEFAULT 'medium';

-- Drop old column if exists
ALTER TABLE `complaints` DROP COLUMN IF EXISTS `assigned_to`;

-- Add indexes for better performance
ALTER TABLE `complaints` 
  ADD INDEX IF NOT EXISTS `idx_status` (`status`),
  ADD INDEX IF NOT EXISTS `idx_category` (`category`),
  ADD INDEX IF NOT EXISTS `idx_priority` (`priority`),
  ADD INDEX IF NOT EXISTS `idx_assigned_to` (`assigned_to_staff_id`);

-- Create complaint_comments table if not exists
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

-- Generate complaint numbers for existing complaints without one
UPDATE complaints 
SET complaint_number = CONCAT('COMP-', YEAR(created_at), '-', LPAD(id, 5, '0'))
WHERE complaint_number IS NULL OR complaint_number = '';

-- Add sample data for testing if no complaints exist
INSERT IGNORE INTO complaints (complaint_number, parent_id, student_id, subject, description, category, priority, status)
SELECT 
  CONCAT('COMP-2025-', LPAD(1, 5, '0')),
  1, 
  1, 
  'Bus service issue',
  'The school bus is consistently arriving 30 minutes late in the morning, causing my child to miss the first period.',
  'transport',
  'high',
  'new'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM complaints WHERE parent_id = 1 AND subject = 'Bus service issue');

INSERT IGNORE INTO complaints (complaint_number, parent_id, student_id, subject, description, category, priority, status)
SELECT 
  CONCAT('COMP-2025-', LPAD(2, 5, '0')),
  2, 
  2, 
  'Homework overload concern',
  'My child is receiving excessive homework that takes 4-5 hours daily to complete. This is affecting their sleep and health.',
  'academic',
  'medium',
  'open'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM complaints WHERE parent_id = 2 AND subject = 'Homework overload concern');

-- Ensure foreign key constraints are properly set
ALTER TABLE `complaints`
  ADD CONSTRAINT IF NOT EXISTS `fk_complaints_parent` FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`),
  ADD CONSTRAINT IF NOT EXISTS `fk_complaints_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`),
  ADD CONSTRAINT IF NOT EXISTS `fk_complaints_assigned_to` FOREIGN KEY (`assigned_to_staff_id`) REFERENCES `staff`(`id`),
  ADD CONSTRAINT IF NOT EXISTS `fk_complaints_resolved_by` FOREIGN KEY (`resolved_by_staff_id`) REFERENCES `staff`(`id`);