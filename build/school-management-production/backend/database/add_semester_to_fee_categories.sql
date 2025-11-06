-- Add is_semester_based flag to fee_categories table
ALTER TABLE `fee_categories` 
ADD COLUMN `is_semester_based` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether this category should be split into semesters' AFTER `description`;

-- Update existing academic fee categories to be semester-based
UPDATE `fee_categories` 
SET `is_semester_based` = 1 
WHERE `name` IN ('Tuition Fee', 'Library Fee', 'Lab Fee', 'Sports Fee', 'Activity Fee', 'Computer Fee', 'Examination Fee', 'Registration Fee');

-- Add semester categories
INSERT INTO `fee_categories` (`name`, `description`, `is_semester_based`, `is_active`, `created_at`, `updated_at`) VALUES
('Semester 1', 'First semester fees', 1, 1, NOW(), NOW()),
('Semester 2', 'Second semester fees', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();