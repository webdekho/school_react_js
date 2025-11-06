-- Add emergency contact name and relationship fields to students table
-- Run this script to update your students table schema

ALTER TABLE `students`
ADD COLUMN `emergency_contact_name` VARCHAR(100) NULL DEFAULT NULL AFTER `emergency_contact_number`,
ADD COLUMN `emergency_contact_relationship` VARCHAR(50) NULL DEFAULT NULL AFTER `emergency_contact_name`;

-- Add indexes for better query performance
ALTER TABLE `students`
ADD INDEX `idx_emergency_contact_name` (`emergency_contact_name`);

