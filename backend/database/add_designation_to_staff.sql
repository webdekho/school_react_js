-- Add designation column to staff table
ALTER TABLE `staff` 
ADD COLUMN `designation` VARCHAR(100) NULL COMMENT 'Staff designation (e.g., Senior Teacher, Head of Department)' AFTER `role_id`;

-- Add index for better performance
ALTER TABLE `staff` 
ADD INDEX `idx_designation` (`designation`);

