-- =============================================
-- STUDENTS TABLE UPDATES FOR ACADEMIC YEAR SUPPORT
-- =============================================
-- This script updates the students table to properly support academic year-based organization

-- First, let's add the missing indexes and constraints for better academic year support

-- 1. Add index on academic_year_id for faster filtering
ALTER TABLE `students` 
ADD INDEX `idx_academic_year` (`academic_year_id`);

-- 2. Add composite index for academic year + grade + division (common query pattern)
ALTER TABLE `students` 
ADD INDEX `idx_academic_grade_division` (`academic_year_id`, `grade_id`, `division_id`);

-- 3. Add composite index for academic year + active status (for counting active students per year)
ALTER TABLE `students` 
ADD INDEX `idx_academic_active` (`academic_year_id`, `is_active`);

-- 4. Drop the existing unique constraints on roll_number and admission_number
-- because these should be unique per academic year, not globally unique
ALTER TABLE `students` 
DROP INDEX `roll_number`,
DROP INDEX `admission_number`;

-- 5. Add new composite unique constraints for roll_number and admission_number per academic year
-- This ensures roll numbers can repeat across different academic years but remain unique within each year
ALTER TABLE `students` 
ADD UNIQUE KEY `uk_roll_academic_year` (`roll_number`, `academic_year_id`),
ADD UNIQUE KEY `uk_admission_academic_year` (`admission_number`, `academic_year_id`);

-- 6. Add index for searching by student name within academic year (common search pattern)
ALTER TABLE `students` 
ADD INDEX `idx_academic_name` (`academic_year_id`, `student_name`);

-- 7. Add index for parent lookup within academic year
ALTER TABLE `students` 
ADD INDEX `idx_academic_parent` (`academic_year_id`, `parent_id`);

-- 8. Add additional fields that might be useful for academic year management
ALTER TABLE `students` 
ADD COLUMN `academic_status` ENUM('active', 'promoted', 'transferred', 'dropped') DEFAULT 'active' AFTER `is_active`,
ADD COLUMN `promotion_date` DATE NULL AFTER `academic_status`,
ADD COLUMN `transfer_date` DATE NULL AFTER `promotion_date`,
ADD COLUMN `remarks` TEXT NULL AFTER `transfer_date`;

-- 9. Add index on academic status for filtering
ALTER TABLE `students` 
ADD INDEX `idx_academic_status` (`academic_year_id`, `academic_status`);

-- =============================================
-- SAMPLE DATA MIGRATION (if needed)
-- =============================================
-- If you have existing students without academic_year_id, 
-- uncomment and modify the following to set them to current academic year

-- UPDATE `students` 
-- SET `academic_year_id` = (
--     SELECT `id` FROM `academic_years` 
--     WHERE `is_current` = 1 OR `is_default` = 1 
--     LIMIT 1
-- ) 
-- WHERE `academic_year_id` IS NULL OR `academic_year_id` = 0;

-- =============================================
-- VERIFY THE CHANGES
-- =============================================
-- Run this to verify all indexes were created properly:
-- SHOW INDEX FROM `students`;

-- =============================================
-- PERFORMANCE NOTES
-- =============================================
-- With these changes:
-- 1. Queries filtering by academic_year_id will be much faster
-- 2. Roll numbers and admission numbers can be reused across academic years
-- 3. Common query patterns (academic year + grade + division) are optimized
-- 4. Student searches within academic years are optimized
-- 5. Academic status tracking is now possible for promotions/transfers