-- =============================================
-- GRADES AND DIVISIONS ACADEMIC YEAR UPDATES
-- =============================================
-- This script updates grades and divisions tables to be properly scoped to academic years

-- 1. Add academic_year_id to grades table
ALTER TABLE `grades` 
ADD COLUMN `academic_year_id` INT(11) NOT NULL AFTER `id`;

-- 2. Add academic_year_id to divisions table  
ALTER TABLE `divisions`
ADD COLUMN `academic_year_id` INT(11) NOT NULL AFTER `id`;

-- 3. Add foreign key constraints
ALTER TABLE `grades`
ADD CONSTRAINT `fk_grades_academic_year` 
FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE RESTRICT;

ALTER TABLE `divisions`
ADD CONSTRAINT `fk_divisions_academic_year` 
FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE RESTRICT;

-- 4. Add indexes for better performance
ALTER TABLE `grades`
ADD INDEX `idx_grades_academic_year` (`academic_year_id`),
ADD INDEX `idx_grades_academic_name` (`academic_year_id`, `name`);

ALTER TABLE `divisions`
ADD INDEX `idx_divisions_academic_year` (`academic_year_id`),
ADD INDEX `idx_divisions_academic_grade` (`academic_year_id`, `grade_id`);

-- 5. Update unique constraints to be scoped to academic year
-- Drop existing unique constraints
ALTER TABLE `grades` DROP INDEX `name`;
ALTER TABLE `divisions` DROP INDEX `name`;

-- Add new composite unique constraints
ALTER TABLE `grades`
ADD UNIQUE KEY `uk_grades_name_academic_year` (`name`, `academic_year_id`);

ALTER TABLE `divisions`
ADD UNIQUE KEY `uk_divisions_name_grade_academic_year` (`name`, `grade_id`, `academic_year_id`);

-- 6. Migrate existing data to current academic year
-- Update grades - assign to current/default academic year
UPDATE `grades` 
SET `academic_year_id` = (
    SELECT `id` FROM `academic_years` 
    WHERE `is_default` = 1 OR `is_current` = 1 
    ORDER BY `is_default` DESC, `is_current` DESC 
    LIMIT 1
)
WHERE `academic_year_id` = 0;

-- Update divisions - assign to current/default academic year
UPDATE `divisions` 
SET `academic_year_id` = (
    SELECT `id` FROM `academic_years` 
    WHERE `is_default` = 1 OR `is_current` = 1 
    ORDER BY `is_default` DESC, `is_current` DESC 
    LIMIT 1
)
WHERE `academic_year_id` = 0;

-- 7. Create a procedure to copy grades and divisions to new academic year
DELIMITER //

CREATE PROCEDURE CopyGradesToNewAcademicYear(
    IN source_year_id INT,
    IN target_year_id INT
)
BEGIN
    -- Copy grades from source year to target year
    INSERT INTO `grades` (`name`, `display_order`, `academic_year_id`, `is_active`, `created_at`, `updated_at`)
    SELECT `name`, `display_order`, target_year_id, `is_active`, NOW(), NOW()
    FROM `grades`
    WHERE `academic_year_id` = source_year_id
    AND NOT EXISTS (
        SELECT 1 FROM `grades` g2 
        WHERE g2.`name` = `grades`.`name` 
        AND g2.`academic_year_id` = target_year_id
    );
    
    -- Copy divisions for each grade
    INSERT INTO `divisions` (`name`, `grade_id`, `capacity`, `academic_year_id`, `display_order`, `is_active`, `created_at`, `updated_at`)
    SELECT d.`name`, 
           (SELECT g_new.`id` FROM `grades` g_new 
            JOIN `grades` g_old ON g_new.`name` = g_old.`name` 
            WHERE g_old.`id` = d.`grade_id` 
            AND g_new.`academic_year_id` = target_year_id),
           d.`capacity`, 
           target_year_id, 
           d.`display_order`, 
           d.`is_active`, 
           NOW(), 
           NOW()
    FROM `divisions` d
    WHERE d.`academic_year_id` = source_year_id
    AND NOT EXISTS (
        SELECT 1 FROM `divisions` d2 
        JOIN `grades` g_new ON d2.`grade_id` = g_new.`id`
        JOIN `grades` g_old ON g_new.`name` = g_old.`name`
        WHERE d2.`name` = d.`name` 
        AND g_old.`id` = d.`grade_id`
        AND d2.`academic_year_id` = target_year_id
    );
END //

DELIMITER ;

-- 8. Create a procedure to setup new academic year with grades and divisions
DELIMITER //

CREATE PROCEDURE SetupNewAcademicYear(
    IN new_year_id INT,
    IN copy_from_year_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Copy grades and divisions from previous year
    CALL CopyGradesToNewAcademicYear(copy_from_year_id, new_year_id);
    
    COMMIT;
    
    SELECT CONCAT('Successfully setup academic year ', new_year_id, ' with grades and divisions') AS message;
END //

DELIMITER ;

-- =============================================
-- USAGE EXAMPLES
-- =============================================

-- To copy grades and divisions from academic year 1 to academic year 2:
-- CALL CopyGradesToNewAcademicYear(1, 2);

-- To setup a completely new academic year:
-- CALL SetupNewAcademicYear(3, 1);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check grades by academic year:
-- SELECT ay.name as academic_year, g.name as grade_name, g.display_order 
-- FROM grades g 
-- JOIN academic_years ay ON g.academic_year_id = ay.id 
-- ORDER BY ay.name, g.display_order;

-- Check divisions by academic year:
-- SELECT ay.name as academic_year, g.name as grade_name, d.name as division_name
-- FROM divisions d
-- JOIN grades g ON d.grade_id = g.id
-- JOIN academic_years ay ON d.academic_year_id = ay.id
-- ORDER BY ay.name, g.display_order, d.name;