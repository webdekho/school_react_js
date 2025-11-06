-- First, set all fees as optional by default
UPDATE `fee_structures` SET `is_mandatory` = 0;

-- Mark only semester-specific academic fees as mandatory
-- These are fees tied to specific grades and semesters
UPDATE `fee_structures` 
SET `is_mandatory` = 1 
WHERE `semester` IN (1, 2) 
  AND `grade_id` IS NOT NULL 
  AND `fee_category_id` IN (
    SELECT id FROM fee_categories 
    WHERE name IN ('Tuition Fee', 'Library Fee', 'Lab Fee', 'Sports Fee', 'Activity Fee', 
                   'Computer Fee', 'Science Lab Fee', 'Board Exam Fee', 'Practical Fee',
                   'Examination Fee', 'Registration Fee')
  );

-- Ensure all universal fees and optional fees remain optional
UPDATE `fee_structures` 
SET `is_mandatory` = 0 
WHERE `grade_id` IS NULL  -- Universal fees
   OR `fee_category_id` IN (
    SELECT id FROM fee_categories 
    WHERE name IN ('Transport Fee', 'Hostel Fee', 'Meal Plan', 'Development Fee', 
                   'Security Fee', 'Admission Fee', 'Uniform', 'Books', 'Stationery',
                   'School Bag', 'Shoes', 'ID Card', 'Insurance Fee')
  );

-- Show summary of mandatory vs optional fees
SELECT 
    'Mandatory Semester Fees' as fee_type,
    COUNT(DISTINCT CASE WHEN semester = 1 THEN fs.id END) as semester_1_count,
    COUNT(DISTINCT CASE WHEN semester = 2 THEN fs.id END) as semester_2_count,
    SUM(CASE WHEN semester = 1 THEN amount ELSE 0 END) as semester_1_total,
    SUM(CASE WHEN semester = 2 THEN amount ELSE 0 END) as semester_2_total
FROM fee_structures fs
WHERE is_mandatory = 1 AND is_active = 1
UNION ALL
SELECT 
    'Optional Fees' as fee_type,
    COUNT(DISTINCT CASE WHEN semester = 1 THEN fs.id END) as semester_1_count,
    COUNT(DISTINCT CASE WHEN semester = 2 THEN fs.id END) as semester_2_count,
    SUM(CASE WHEN semester = 1 THEN amount ELSE 0 END) as semester_1_total,
    SUM(CASE WHEN semester = 2 THEN amount ELSE 0 END) as semester_2_total
FROM fee_structures fs
WHERE is_mandatory = 0 AND is_active = 1;