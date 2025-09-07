-- =============================================
-- REVERT GRADES AND DIVISIONS ACADEMIC YEAR CHANGES
-- =============================================
-- This script reverts the academic year changes to grades and divisions
-- making them generic and available across all academic years

-- 1. Remove foreign key constraints first
ALTER TABLE `grades` DROP FOREIGN KEY `fk_grades_academic_year`;
ALTER TABLE `divisions` DROP FOREIGN KEY `fk_divisions_academic_year`;

-- 2. Remove indexes related to academic year
ALTER TABLE `grades` 
DROP INDEX `idx_grades_academic_year`,
DROP INDEX `idx_grades_academic_name`;

ALTER TABLE `divisions`
DROP INDEX `idx_divisions_academic_year`,
DROP INDEX `idx_divisions_academic_grade`;

-- 3. Remove unique constraints that include academic year
ALTER TABLE `grades` DROP INDEX `uk_grades_name_academic_year`;
ALTER TABLE `divisions` DROP INDEX `uk_divisions_name_grade_academic_year`;

-- 4. Remove academic_year_id columns
ALTER TABLE `grades` DROP COLUMN `academic_year_id`;
ALTER TABLE `divisions` DROP COLUMN `academic_year_id`;

-- 5. Restore original unique constraints
ALTER TABLE `grades` ADD UNIQUE KEY `name` (`name`);
ALTER TABLE `divisions` ADD UNIQUE KEY `name_grade` (`name`, `grade_id`);

-- 6. Drop the procedures that were created for academic year management
DROP PROCEDURE IF EXISTS CopyGradesToNewAcademicYear;
DROP PROCEDURE IF EXISTS SetupNewAcademicYear;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check that grades no longer have academic_year_id:
-- DESCRIBE grades;

-- Check that divisions no longer have academic_year_id:
-- DESCRIBE divisions;

-- Verify unique constraints:
-- SHOW INDEX FROM grades WHERE Key_name = 'name';
-- SHOW INDEX FROM divisions WHERE Key_name = 'name_grade';

-- =============================================
-- NOTES
-- =============================================
-- After running this script:
-- 1. Grades will be generic and available across all academic years
-- 2. Divisions will be generic and available across all academic years
-- 3. Students will still be filtered by academic year
-- 4. The same grade/division names can be used across different academic years
-- 5. Academic year filtering happens only at the student level