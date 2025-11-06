-- Create a test grade with absolutely no fee structures to test "No record found" scenario

-- Create a completely new grade that will have no fee structures
INSERT IGNORE INTO `grades` (`academic_year_id`, `name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES 
(1, 'Grade 99 No Fees', 99, 1, NOW(), NOW());

-- Get the ID of the new grade
SET @no_fee_grade_id = (SELECT id FROM grades WHERE name = 'Grade 99 No Fees' LIMIT 1);

-- Create divisions for this grade (but no fee structures)
INSERT IGNORE INTO `divisions` (`academic_year_id`, `grade_id`, `name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES 
(1, @no_fee_grade_id, 'No Fee A', 1, 1, NOW(), NOW()),
(1, @no_fee_grade_id, 'No Fee B', 2, 1, NOW(), NOW());

-- Verify this grade has no fees (should return empty result)
SELECT 
    'VERIFICATION: Grade 99 Fee Check' as test_name,
    fs.semester,
    fc.name as category_name,
    fs.amount
FROM fee_structures fs
JOIN fee_categories fc ON fs.fee_category_id = fc.id
WHERE fs.grade_id = @no_fee_grade_id AND fs.academic_year_id = 1 AND fs.is_active = 1
ORDER BY fs.semester, fc.name;

-- Show what this grade WILL get (only universal fees)
SELECT 
    'UNIVERSAL FEES THAT WILL APPLY' as info,
    fs.semester,
    fc.name as category_name,
    fs.amount
FROM fee_structures fs
JOIN fee_categories fc ON fs.fee_category_id = fc.id
WHERE fs.grade_id IS NULL AND fs.division_id IS NULL AND fs.academic_year_id = 1 AND fs.is_active = 1
ORDER BY fs.semester, fc.name
LIMIT 8;

-- Get the division IDs for testing
SELECT 
    'TEST PARAMETERS' as info,
    @no_fee_grade_id as grade_id_to_test,
    d.id as division_id_to_test,
    d.name as division_name
FROM divisions d 
WHERE d.grade_id = @no_fee_grade_id;

-- Final verification - show total fees for this grade combination
SELECT 
    'FINAL TOTAL CHECK' as check_type,
    fs.semester,
    COUNT(*) as fee_categories,
    SUM(fs.amount) as total_amount,
    'These should be ONLY universal fees' as note
FROM fee_structures fs
WHERE (fs.grade_id = @no_fee_grade_id OR fs.grade_id IS NULL) 
  AND fs.academic_year_id = 1 
  AND fs.is_active = 1
GROUP BY fs.semester
ORDER BY fs.semester;