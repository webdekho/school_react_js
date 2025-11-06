-- Add is_mandatory field to fee_structures table to distinguish between mandatory and optional fees
ALTER TABLE `fee_structures` 
ADD COLUMN `is_mandatory` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=Mandatory (Semester fees), 0=Optional' AFTER `is_active`;

-- Update existing fee structures to mark only semester-specific fees as mandatory
-- Semester fees are those that are specific to a grade/division and have a semester value
UPDATE `fee_structures` 
SET `is_mandatory` = 1 
WHERE `semester` IN (1, 2) 
  AND `grade_id` IS NOT NULL 
  AND `fee_category_id` IN (
    SELECT id FROM fee_categories 
    WHERE name IN ('Tuition Fee', 'Library Fee', 'Lab Fee', 'Sports Fee', 'Activity Fee', 
                   'Computer Fee', 'Science Lab Fee', 'Board Exam Fee', 'Practical Fee')
  );

-- Mark universal fees (transport, hostel, etc.) as optional
UPDATE `fee_structures` 
SET `is_mandatory` = 0 
WHERE `grade_id` IS NULL 
   OR `fee_category_id` IN (
    SELECT id FROM fee_categories 
    WHERE name IN ('Transport Fee', 'Hostel Fee', 'Meal Plan', 'Development Fee', 
                   'Security Fee', 'Admission Fee', 'Uniform Fee', 'Books Fee')
  );

-- Verify the update
SELECT 
    CASE 
        WHEN fs.grade_id IS NULL THEN 'Universal'
        ELSE CONCAT('Grade ', g.name)
    END as grade_level,
    fc.name as fee_category,
    fs.semester,
    fs.is_mandatory,
    COUNT(*) as count
FROM fee_structures fs
LEFT JOIN grades g ON fs.grade_id = g.id
JOIN fee_categories fc ON fs.fee_category_id = fc.id
WHERE fs.is_active = 1
GROUP BY fs.grade_id, g.name, fc.name, fs.semester, fs.is_mandatory
ORDER BY fs.is_mandatory DESC, fs.grade_id, fc.name;