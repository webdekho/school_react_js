-- Test data for semester fees display functionality
-- This creates test scenarios for both "found" and "not found" cases

-- Add grade-specific fees for Grade 1 (Class 1) to test "found" scenario
INSERT IGNORE INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 'Semester 1', 1, 800.00, '2024-06-15', 'Grade 1 Specific Bag Fee - Semester 1', 1, NOW(), NOW()),
(1, 1, NULL, 'Semester 1', 2, 1200.00, '2024-06-15', 'Grade 1 Specific Book Fee - Semester 1', 1, NOW(), NOW()),
(1, 1, NULL, 'Semester 2', 1, 850.00, '2024-12-15', 'Grade 1 Specific Bag Fee - Semester 2', 1, NOW(), NOW()),
(1, 1, NULL, 'Semester 2', 2, 1250.00, '2024-12-15', 'Grade 1 Specific Book Fee - Semester 2', 1, NOW(), NOW());

-- Add division-specific fees for Grade 1 Division A to test priority
INSERT IGNORE INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'Semester 1', 3, 500.00, '2024-06-15', 'Grade 1A Special Uniform Fee - Semester 1', 1, NOW(), NOW()),
(1, 1, 1, 'Semester 2', 3, 550.00, '2024-12-15', 'Grade 1A Special Uniform Fee - Semester 2', 1, NOW(), NOW());

-- Clear any existing fees for Grade 5 to test "not found" scenario
-- (We'll use Grade 5 for testing "no record found" messages)

-- Test query to verify data for Grade 1, Division A
SELECT 
    'TEST RESULT - Grade 1, Division A' as test_case,
    fs.semester,
    fc.name as category_name,
    fs.amount,
    CASE 
        WHEN fs.grade_id IS NOT NULL AND fs.division_id IS NOT NULL THEN 'Grade+Division Specific'
        WHEN fs.grade_id IS NOT NULL AND fs.division_id IS NULL THEN 'Grade Specific'  
        ELSE 'Universal'
    END as fee_type
FROM fee_structures fs
JOIN fee_categories fc ON fs.fee_category_id = fc.id
WHERE fs.academic_year_id = 1 
  AND fs.is_active = 1
  AND (
    (fs.grade_id = 1 AND fs.division_id = 1) OR
    (fs.grade_id = 1 AND fs.division_id IS NULL) OR  
    (fs.grade_id IS NULL AND fs.division_id IS NULL)
  )
ORDER BY fs.semester, fee_type DESC, fc.name;

-- Test query for Grade 5 (should show mostly universal fees or empty if none exist)
SELECT 
    'TEST RESULT - Grade 5 (for no record test)' as test_case,
    fs.semester,
    fc.name as category_name,
    fs.amount,
    CASE 
        WHEN fs.grade_id IS NOT NULL AND fs.division_id IS NOT NULL THEN 'Grade+Division Specific'
        WHEN fs.grade_id IS NOT NULL AND fs.division_id IS NULL THEN 'Grade Specific'  
        ELSE 'Universal'
    END as fee_type
FROM fee_structures fs
JOIN fee_categories fc ON fs.fee_category_id = fc.id
WHERE fs.academic_year_id = 1 
  AND fs.is_active = 1
  AND (
    (fs.grade_id = 5 AND fs.division_id = 1) OR
    (fs.grade_id = 5 AND fs.division_id IS NULL) OR  
    (fs.grade_id IS NULL AND fs.division_id IS NULL)
  )
ORDER BY fs.semester, fee_type DESC, fc.name;