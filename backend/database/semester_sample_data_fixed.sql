-- Fixed Semester Sample Data with proper table structure
-- This creates comprehensive sample data for testing semester fee display

-- Ensure academic year exists with correct structure
INSERT IGNORE INTO `academic_years` (`id`, `name`, `start_date`, `end_date`, `is_active`, `is_default`, `description`, `created_at`, `updated_at`) VALUES 
(1, '2024-25', '2024-04-01', '2025-03-31', 1, 1, 'Sample Academic Year', NOW(), NOW());

-- Additional sample fee structures for comprehensive testing

-- NURSERY/KG GRADES (if they exist) - Lower fees
INSERT IGNORE INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
-- For any kindergarten grades
(1, 11, NULL, 'Semester 1', 1, 1500.00, '2024-06-15', 'KG Tuition Fee Semester 1 - Sample', 1, NOW(), NOW()),
(1, 11, NULL, 'Semester 1', 2, 100.00, '2024-06-15', 'KG Library Fee Semester 1 - Sample', 1, NOW(), NOW()),
(1, 11, NULL, 'Semester 1', 5, 200.00, '2024-06-15', 'KG Activity Fee Semester 1 - Sample', 1, NOW(), NOW()),
(1, 11, NULL, 'Semester 2', 1, 1500.00, '2024-12-15', 'KG Tuition Fee Semester 2 - Sample', 1, NOW(), NOW()),
(1, 11, NULL, 'Semester 2', 2, 100.00, '2024-12-15', 'KG Library Fee Semester 2 - Sample', 1, NOW(), NOW()),
(1, 11, NULL, 'Semester 2', 7, 300.00, '2024-12-15', 'KG Exam Fee Semester 2 - Sample', 1, NOW(), NOW());

-- Create some grades without any fee structures (for "no record found" testing)
INSERT IGNORE INTO `grades` (`academic_year_id`, `name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES 
(1, 'Grade 11 Science', 11, 1, NOW(), NOW()),
(1, 'Grade 12 Commerce', 12, 1, NOW(), NOW());

-- Get the IDs of newly created grades for divisions
SET @grade_11_id = (SELECT id FROM grades WHERE name = 'Grade 11 Science' LIMIT 1);
SET @grade_12_id = (SELECT id FROM grades WHERE name = 'Grade 12 Commerce' LIMIT 1);

-- Create divisions for these grades (but no fee structures - will show "no record found")
INSERT IGNORE INTO `divisions` (`academic_year_id`, `grade_id`, `name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES 
(1, @grade_11_id, 'Science A', 1, 1, NOW(), NOW()),
(1, @grade_11_id, 'Science B', 2, 1, NOW(), NOW()),
(1, @grade_12_id, 'Commerce A', 1, 1, NOW(), NOW());

-- PREMIUM STREAM FEES - Example of higher fees for specialized programs
-- Add premium fees for existing Grade 9 and Grade 10
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
-- Grade 9 Premium Science Stream (Division C if exists)
(1, 9, 3, 'Semester 1', 1, 2000.00, '2024-06-15', 'Grade 9 Premium Science Stream - Additional Tuition', 1, NOW(), NOW()),
(1, 9, 3, 'Semester 1', 3, 1500.00, '2024-06-15', 'Grade 9 Premium Science Stream - Advanced Lab Fee', 1, NOW(), NOW()),
(1, 9, 3, 'Semester 2', 1, 2000.00, '2024-12-15', 'Grade 9 Premium Science Stream - Additional Tuition', 1, NOW(), NOW()),
(1, 9, 3, 'Semester 2', 3, 1500.00, '2024-12-15', 'Grade 9 Premium Science Stream - Advanced Lab Fee', 1, NOW(), NOW()),

-- Grade 10 Specialized Commerce Stream  
(1, 10, 3, 'Semester 1', 1, 1800.00, '2024-06-15', 'Grade 10 Commerce Stream - Additional Tuition', 1, NOW(), NOW()),
(1, 10, 3, 'Semester 1', 2, 500.00, '2024-06-15', 'Grade 10 Commerce Stream - Advanced Library Access', 1, NOW(), NOW()),
(1, 10, 3, 'Semester 2', 1, 1800.00, '2024-12-15', 'Grade 10 Commerce Stream - Additional Tuition', 1, NOW(), NOW()),
(1, 10, 3, 'Semester 2', 7, 800.00, '2024-12-15', 'Grade 10 Commerce Stream - Board Preparation Fee', 1, NOW(), NOW());

-- SCHOLARSHIPS AND DISCOUNTED FEE STRUCTURES
-- Example of reduced fees for scholarship students (Grade 8 Division D)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 8, 4, 'Semester 1', 1, 3000.00, '2024-06-15', 'Grade 8D Scholarship - Reduced Tuition Fee', 1, NOW(), NOW()),
(1, 8, 4, 'Semester 1', 2, 200.00, '2024-06-15', 'Grade 8D Scholarship - Reduced Library Fee', 1, NOW(), NOW()),
(1, 8, 4, 'Semester 2', 1, 3000.00, '2024-12-15', 'Grade 8D Scholarship - Reduced Tuition Fee', 1, NOW(), NOW()),
(1, 8, 4, 'Semester 2', 2, 200.00, '2024-12-15', 'Grade 8D Scholarship - Reduced Library Fee', 1, NOW(), NOW());

-- DAYCARE/HOSTEL FEES - Additional fees for boarding students
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
-- Hostel fees (universal - can apply to any grade)
(1, NULL, NULL, 'Semester 1', 6, 3000.00, '2024-06-15', 'Hostel Accommodation Fee Semester 1 - Sample', 1, NOW(), NOW()),
(1, NULL, NULL, 'Semester 1', 8, 1500.00, '2024-06-15', 'Hostel Mess Fee Semester 1 - Sample', 1, NOW(), NOW()),
(1, NULL, NULL, 'Semester 2', 6, 3000.00, '2024-12-15', 'Hostel Accommodation Fee Semester 2 - Sample', 1, NOW(), NOW()),
(1, NULL, NULL, 'Semester 2', 8, 1500.00, '2024-12-15', 'Hostel Mess Fee Semester 2 - Sample', 1, NOW(), NOW());

-- Create comprehensive test scenarios verification
SELECT 
    'COMPREHENSIVE TEST SCENARIOS' as title,
    '' as divider;

-- Scenario 1: Grade with normal fees
SELECT 
    'SCENARIO 1: Normal Fee Structure (Grade 1)' as scenario,
    fs.semester,
    fc.name as fee_category,
    fs.amount,
    fs.description
FROM fee_structures fs
JOIN fee_categories fc ON fs.fee_category_id = fc.id
WHERE fs.grade_id = 1 AND fs.division_id IS NULL AND fs.is_active = 1
ORDER BY fs.semester, fc.name
LIMIT 10;

-- Scenario 2: Grade with division-specific fees  
SELECT 
    'SCENARIO 2: Division-Specific Fees (Grade 9 Division C)' as scenario,
    fs.semester,
    fc.name as fee_category,
    fs.amount,
    fs.description
FROM fee_structures fs
JOIN fee_categories fc ON fs.fee_category_id = fc.id
WHERE fs.grade_id = 9 AND fs.division_id = 3 AND fs.is_active = 1
ORDER BY fs.semester, fc.name;

-- Scenario 3: Universal fees (apply to all)
SELECT 
    'SCENARIO 3: Universal Fees (All Students)' as scenario,
    fs.semester,
    fc.name as fee_category,
    fs.amount,
    fs.description
FROM fee_structures fs
JOIN fee_categories fc ON fs.fee_category_id = fc.id
WHERE fs.grade_id IS NULL AND fs.division_id IS NULL AND fs.is_active = 1
ORDER BY fs.semester, fc.name
LIMIT 8;

-- Final summary of all sample data
SELECT 
    'FINAL SUMMARY' as summary_type,
    COUNT(*) as total_fee_structures,
    COUNT(DISTINCT COALESCE(grade_id, 'Universal')) as unique_grades,
    COUNT(DISTINCT semester) as semesters_covered,
    MIN(amount) as min_fee,
    MAX(amount) as max_fee,
    AVG(amount) as avg_fee,
    SUM(amount) as total_fee_amount
FROM fee_structures 
WHERE is_active = 1;