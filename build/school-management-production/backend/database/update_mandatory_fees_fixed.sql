-- First, set all fees as optional by default
UPDATE `fee_structures` SET `is_mandatory` = 0;

-- Mark only semester-specific academic fees as mandatory
-- These are fees tied to specific grades and semesters
UPDATE `fee_structures` 
SET `is_mandatory` = 1 
WHERE `semester` IN ('Semester 1', 'Semester 2') 
  AND `grade_id` IS NOT NULL 
  AND `fee_category_id` IN (
    SELECT id FROM fee_categories 
    WHERE name IN ('Tuition Fee', 'Library Fee', 'Lab Fee', 'Sports Fee', 'Activity Fee', 
                   'Computer Fee', 'Science Lab Fee', 'Board Exam Fee', 'Practical Fee',
                   'Examination Fee', 'Registration Fee')
  );

-- Show summary of mandatory vs optional fees by grade
SELECT 
    CONCAT('Grade ', g.name) as grade_level,
    SUM(CASE WHEN fs.semester = 'Semester 1' AND fs.is_mandatory = 1 THEN fs.amount ELSE 0 END) as mandatory_sem1_total,
    SUM(CASE WHEN fs.semester = 'Semester 2' AND fs.is_mandatory = 1 THEN fs.amount ELSE 0 END) as mandatory_sem2_total,
    SUM(CASE WHEN fs.semester = 'Semester 1' AND fs.is_mandatory = 0 THEN fs.amount ELSE 0 END) as optional_sem1_total,
    SUM(CASE WHEN fs.semester = 'Semester 2' AND fs.is_mandatory = 0 THEN fs.amount ELSE 0 END) as optional_sem2_total
FROM fee_structures fs
JOIN grades g ON fs.grade_id = g.id
WHERE fs.is_active = 1
GROUP BY g.id, g.name
ORDER BY g.display_order
LIMIT 10;