-- Update student_fee_assignments table to support semester-based fee tracking
-- This adds a semester field to track which semester each fee assignment belongs to

-- Add semester field to student_fee_assignments table
ALTER TABLE `student_fee_assignments` 
ADD COLUMN `semester` ENUM('Semester 1', 'Semester 2') NOT NULL DEFAULT 'Semester 1' AFTER `fee_structure_id`;

-- Update existing records to be Semester 1 by default (if any exist)
UPDATE `student_fee_assignments` SET `semester` = 'Semester 1' WHERE `semester` IS NULL;

-- Add index for better performance on semester queries
ALTER TABLE `student_fee_assignments` 
ADD INDEX `idx_student_semester_status` (`student_id`, `semester`, `status`);