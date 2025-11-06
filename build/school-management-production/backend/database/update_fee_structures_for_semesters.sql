-- Update fee_structures table to support semester-based fees
-- This adds a semester field to distinguish between Semester 1 and Semester 2 fees

-- Add semester field to fee_structures table
ALTER TABLE `fee_structures` 
ADD COLUMN `semester` ENUM('Semester 1', 'Semester 2') NOT NULL DEFAULT 'Semester 1' AFTER `division_id`;

-- Update existing records to be Semester 1 by default
UPDATE `fee_structures` SET `semester` = 'Semester 1' WHERE `semester` IS NULL;

-- Add index for better performance on semester queries
ALTER TABLE `fee_structures` 
ADD INDEX `idx_grade_division_semester` (`grade_id`, `division_id`, `semester`, `academic_year_id`);