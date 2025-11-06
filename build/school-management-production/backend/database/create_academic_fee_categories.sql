-- Create proper academic fee categories for mandatory semester fees
INSERT INTO `fee_categories` (`name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
('Tuition Fee', 'Academic tuition charges per semester', 1, NOW(), NOW()),
('Library Fee', 'Library maintenance and book access fees', 1, NOW(), NOW()),
('Lab Fee', 'Laboratory usage and equipment fees', 1, NOW(), NOW()),
('Sports Fee', 'Sports facilities and equipment fees', 1, NOW(), NOW()),
('Activity Fee', 'Co-curricular activities and events', 1, NOW(), NOW()),
('Computer Fee', 'Computer lab and IT infrastructure fees', 1, NOW(), NOW()),
('Examination Fee', 'Semester examination charges', 1, NOW(), NOW()),
('Registration Fee', 'Academic registration per semester', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Create sample mandatory semester fees for each grade
-- These will be the compulsory fees that every student must pay

-- Grade 1 Mandatory Fees
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `is_mandatory`, `description`, `is_active`)
SELECT 
    1 as academic_year_id,
    g.id as grade_id,
    NULL as division_id,  -- Applies to all divisions
    'Semester 1' as semester,
    fc.id as fee_category_id,
    CASE fc.name
        WHEN 'Tuition Fee' THEN 5000
        WHEN 'Library Fee' THEN 500
        WHEN 'Sports Fee' THEN 300
        WHEN 'Activity Fee' THEN 200
        WHEN 'Examination Fee' THEN 500
        WHEN 'Registration Fee' THEN 100
    END as amount,
    1 as is_mandatory,
    CONCAT('Mandatory ', fc.name, ' for Semester 1') as description,
    1 as is_active
FROM grades g
CROSS JOIN fee_categories fc
WHERE g.name = 'Class 1' 
  AND fc.name IN ('Tuition Fee', 'Library Fee', 'Sports Fee', 'Activity Fee', 'Examination Fee', 'Registration Fee');

-- Grade 1 Semester 2 Mandatory Fees
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `is_mandatory`, `description`, `is_active`)
SELECT 
    1 as academic_year_id,
    g.id as grade_id,
    NULL as division_id,
    'Semester 2' as semester,
    fc.id as fee_category_id,
    CASE fc.name
        WHEN 'Tuition Fee' THEN 5000
        WHEN 'Library Fee' THEN 500
        WHEN 'Sports Fee' THEN 300
        WHEN 'Activity Fee' THEN 200
        WHEN 'Examination Fee' THEN 500
    END as amount,
    1 as is_mandatory,
    CONCAT('Mandatory ', fc.name, ' for Semester 2') as description,
    1 as is_active
FROM grades g
CROSS JOIN fee_categories fc
WHERE g.name = 'Class 1' 
  AND fc.name IN ('Tuition Fee', 'Library Fee', 'Sports Fee', 'Activity Fee', 'Examination Fee');

-- Add mandatory fees for other grades with progressive amounts
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `is_mandatory`, `description`, `is_active`)
SELECT 
    1 as academic_year_id,
    g.id as grade_id,
    NULL as division_id,
    s.semester,
    fc.id as fee_category_id,
    CASE 
        WHEN g.display_order <= 5 THEN  -- Primary grades
            CASE fc.name
                WHEN 'Tuition Fee' THEN 5000 + (g.display_order - 1) * 500
                WHEN 'Library Fee' THEN 500 + (g.display_order - 1) * 50
                WHEN 'Lab Fee' THEN IF(g.display_order >= 3, 800, 0)
                WHEN 'Sports Fee' THEN 300 + (g.display_order - 1) * 50
                WHEN 'Activity Fee' THEN 200 + (g.display_order - 1) * 50
                WHEN 'Computer Fee' THEN IF(g.display_order >= 3, 600, 0)
                WHEN 'Examination Fee' THEN 500
                WHEN 'Registration Fee' THEN IF(s.semester = 'Semester 1', 100, 0)
            END
        WHEN g.display_order <= 8 THEN  -- Middle school
            CASE fc.name
                WHEN 'Tuition Fee' THEN 7500 + (g.display_order - 6) * 500
                WHEN 'Library Fee' THEN 750
                WHEN 'Lab Fee' THEN 1200
                WHEN 'Sports Fee' THEN 500
                WHEN 'Activity Fee' THEN 400
                WHEN 'Computer Fee' THEN 800
                WHEN 'Examination Fee' THEN 600
                WHEN 'Registration Fee' THEN IF(s.semester = 'Semester 1', 150, 0)
            END
        ELSE  -- High school
            CASE fc.name
                WHEN 'Tuition Fee' THEN 10000 + (g.display_order - 9) * 1000
                WHEN 'Library Fee' THEN 1000
                WHEN 'Lab Fee' THEN 1500
                WHEN 'Sports Fee' THEN 600
                WHEN 'Activity Fee' THEN 500
                WHEN 'Computer Fee' THEN 1000
                WHEN 'Examination Fee' THEN 800
                WHEN 'Registration Fee' THEN IF(s.semester = 'Semester 1', 200, 0)
            END
    END as amount,
    1 as is_mandatory,
    CONCAT('Mandatory ', fc.name, ' for ', s.semester) as description,
    1 as is_active
FROM grades g
CROSS JOIN (SELECT 'Semester 1' as semester UNION SELECT 'Semester 2') s
CROSS JOIN fee_categories fc
WHERE g.name NOT IN ('Class 1', 'Grade 99 No Fees')  -- Exclude already inserted and test grade
  AND fc.name IN ('Tuition Fee', 'Library Fee', 'Lab Fee', 'Sports Fee', 'Activity Fee', 'Computer Fee', 'Examination Fee', 'Registration Fee')
  AND NOT (fc.name IN ('Lab Fee', 'Computer Fee') AND g.display_order < 3)  -- No lab/computer for grades 1-2
  AND NOT (fc.name = 'Registration Fee' AND s.semester = 'Semester 2')  -- Registration only in Sem 1
ON DUPLICATE KEY UPDATE 
  amount = VALUES(amount),
  is_mandatory = VALUES(is_mandatory),
  updated_at = NOW();

-- Mark existing non-academic fees as optional
UPDATE fee_structures fs
JOIN fee_categories fc ON fs.fee_category_id = fc.id
SET fs.is_mandatory = 0
WHERE fc.name IN ('Bag', 'Book', 'Bus Payment', 'Event Payment', 'General Payment', 'Penalty Charges', 'Uniform/Shoes', 
                  'Admission Fee', 'Development Fee', 'Security Fee', 'Transport Fee', 'Hostel Fee');

-- Show summary of mandatory fees by grade
SELECT 
    g.name as grade,
    COUNT(DISTINCT CASE WHEN fs.semester = 'Semester 1' THEN fs.id END) as sem1_mandatory_fees,
    SUM(CASE WHEN fs.semester = 'Semester 1' AND fs.is_mandatory = 1 THEN fs.amount ELSE 0 END) as sem1_mandatory_total,
    COUNT(DISTINCT CASE WHEN fs.semester = 'Semester 2' THEN fs.id END) as sem2_mandatory_fees,
    SUM(CASE WHEN fs.semester = 'Semester 2' AND fs.is_mandatory = 1 THEN fs.amount ELSE 0 END) as sem2_mandatory_total
FROM grades g
LEFT JOIN fee_structures fs ON g.id = fs.grade_id AND fs.is_active = 1 AND fs.is_mandatory = 1
WHERE g.is_active = 1
GROUP BY g.id, g.name
ORDER BY g.display_order;