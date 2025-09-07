-- Comprehensive Sample Data for Semester-Based Fee Structures
-- This creates a complete fee structure system for all grades with both Semester 1 and Semester 2 fees

-- Clear existing sample data if needed (be careful in production)
-- DELETE FROM fee_structures WHERE description LIKE '%Sample%';

-- First ensure we have proper academic year
INSERT IGNORE INTO `academic_years` (`id`, `name`, `start_date`, `end_date`, `is_current`, `is_active`, `created_at`, `updated_at`) VALUES 
(1, '2024-25', '2024-04-01', '2025-03-31', 1, 1, NOW(), NOW());

-- Ensure we have comprehensive fee categories
INSERT IGNORE INTO `fee_categories` (`id`, `name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Tuition Fee', 'Academic instruction charges', 1, NOW(), NOW()),
(2, 'Library Fee', 'Library usage and book charges', 1, NOW(), NOW()),
(3, 'Lab Fee', 'Science and computer lab charges', 1, NOW(), NOW()),
(4, 'Sports Fee', 'Sports activities and equipment', 1, NOW(), NOW()),
(5, 'Activity Fee', 'Extra-curricular activities', 1, NOW(), NOW()),
(6, 'Transport Fee', 'School bus transportation', 1, NOW(), NOW()),
(7, 'Exam Fee', 'Examination and assessment charges', 1, NOW(), NOW()),
(8, 'Development Fee', 'School infrastructure development', 1, NOW(), NOW()),
(9, 'Security Fee', 'Campus security services', 1, NOW(), NOW()),
(10, 'Admission Fee', 'One-time admission processing fee', 1, NOW(), NOW());

-- PRIMARY GRADES (1-5) - Basic Education Level
-- Grade 1 Fee Structures
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
-- Semester 1
(1, 1, NULL, 'Semester 1', 1, 2500.00, '2024-06-15', 'Grade 1 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 1, NULL, 'Semester 1', 2, 200.00, '2024-06-15', 'Grade 1 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 1, NULL, 'Semester 1', 4, 300.00, '2024-06-15', 'Grade 1 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 1, NULL, 'Semester 1', 5, 250.00, '2024-06-15', 'Grade 1 Activity Fee - Sample Data', 1, NOW(), NOW()),
-- Semester 2
(1, 1, NULL, 'Semester 2', 1, 2500.00, '2024-12-15', 'Grade 1 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 1, NULL, 'Semester 2', 2, 200.00, '2024-12-15', 'Grade 1 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 1, NULL, 'Semester 2', 4, 300.00, '2024-12-15', 'Grade 1 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 1, NULL, 'Semester 2', 7, 400.00, '2024-12-15', 'Grade 1 Exam Fee - Sample Data', 1, NOW(), NOW());

-- Grade 2 Fee Structures (slightly higher fees)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
-- Semester 1
(1, 2, NULL, 'Semester 1', 1, 2800.00, '2024-06-15', 'Grade 2 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 2, NULL, 'Semester 1', 2, 250.00, '2024-06-15', 'Grade 2 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 2, NULL, 'Semester 1', 4, 350.00, '2024-06-15', 'Grade 2 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 2, NULL, 'Semester 1', 5, 300.00, '2024-06-15', 'Grade 2 Activity Fee - Sample Data', 1, NOW(), NOW()),
-- Semester 2
(1, 2, NULL, 'Semester 2', 1, 2800.00, '2024-12-15', 'Grade 2 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 2, NULL, 'Semester 2', 2, 250.00, '2024-12-15', 'Grade 2 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 2, NULL, 'Semester 2', 4, 350.00, '2024-12-15', 'Grade 2 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 2, NULL, 'Semester 2', 7, 450.00, '2024-12-15', 'Grade 2 Exam Fee - Sample Data', 1, NOW(), NOW());

-- Grade 3 Fee Structures
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
-- Semester 1
(1, 3, NULL, 'Semester 1', 1, 3200.00, '2024-06-15', 'Grade 3 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 3, NULL, 'Semester 1', 2, 300.00, '2024-06-15', 'Grade 3 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 3, NULL, 'Semester 1', 3, 200.00, '2024-06-15', 'Grade 3 Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 3, NULL, 'Semester 1', 4, 400.00, '2024-06-15', 'Grade 3 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 3, NULL, 'Semester 1', 5, 350.00, '2024-06-15', 'Grade 3 Activity Fee - Sample Data', 1, NOW(), NOW()),
-- Semester 2
(1, 3, NULL, 'Semester 2', 1, 3200.00, '2024-12-15', 'Grade 3 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 3, NULL, 'Semester 2', 2, 300.00, '2024-12-15', 'Grade 3 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 3, NULL, 'Semester 2', 3, 200.00, '2024-12-15', 'Grade 3 Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 3, NULL, 'Semester 2', 4, 400.00, '2024-12-15', 'Grade 3 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 3, NULL, 'Semester 2', 7, 500.00, '2024-12-15', 'Grade 3 Exam Fee - Sample Data', 1, NOW(), NOW());

-- Grade 4 Fee Structures
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
-- Semester 1
(1, 4, NULL, 'Semester 1', 1, 3600.00, '2024-06-15', 'Grade 4 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 4, NULL, 'Semester 1', 2, 350.00, '2024-06-15', 'Grade 4 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 4, NULL, 'Semester 1', 3, 300.00, '2024-06-15', 'Grade 4 Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 4, NULL, 'Semester 1', 4, 450.00, '2024-06-15', 'Grade 4 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 4, NULL, 'Semester 1', 5, 400.00, '2024-06-15', 'Grade 4 Activity Fee - Sample Data', 1, NOW(), NOW()),
-- Semester 2
(1, 4, NULL, 'Semester 2', 1, 3600.00, '2024-12-15', 'Grade 4 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 4, NULL, 'Semester 2', 2, 350.00, '2024-12-15', 'Grade 4 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 4, NULL, 'Semester 2', 3, 300.00, '2024-12-15', 'Grade 4 Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 4, NULL, 'Semester 2', 4, 450.00, '2024-12-15', 'Grade 4 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 4, NULL, 'Semester 2', 7, 550.00, '2024-12-15', 'Grade 4 Exam Fee - Sample Data', 1, NOW(), NOW());

-- Grade 5 Fee Structures (Higher fees as it's upper primary)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
-- Semester 1
(1, 5, NULL, 'Semester 1', 1, 4000.00, '2024-06-15', 'Grade 5 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 5, NULL, 'Semester 1', 2, 400.00, '2024-06-15', 'Grade 5 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 5, NULL, 'Semester 1', 3, 500.00, '2024-06-15', 'Grade 5 Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 5, NULL, 'Semester 1', 4, 500.00, '2024-06-15', 'Grade 5 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 5, NULL, 'Semester 1', 5, 450.00, '2024-06-15', 'Grade 5 Activity Fee - Sample Data', 1, NOW(), NOW()),
-- Semester 2
(1, 5, NULL, 'Semester 2', 1, 4000.00, '2024-12-15', 'Grade 5 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 5, NULL, 'Semester 2', 2, 400.00, '2024-12-15', 'Grade 5 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 5, NULL, 'Semester 2', 3, 500.00, '2024-12-15', 'Grade 5 Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 5, NULL, 'Semester 2', 4, 500.00, '2024-12-15', 'Grade 5 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 5, NULL, 'Semester 2', 7, 600.00, '2024-12-15', 'Grade 5 Exam Fee - Sample Data', 1, NOW(), NOW());

-- SECONDARY GRADES (6-8) - Middle School Level
-- Grade 6 Fee Structures (Introduction of more subjects)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
-- Semester 1
(1, 6, NULL, 'Semester 1', 1, 5000.00, '2024-06-15', 'Grade 6 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 6, NULL, 'Semester 1', 2, 500.00, '2024-06-15', 'Grade 6 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 6, NULL, 'Semester 1', 3, 800.00, '2024-06-15', 'Grade 6 Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 6, NULL, 'Semester 1', 4, 600.00, '2024-06-15', 'Grade 6 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 6, NULL, 'Semester 1', 5, 550.00, '2024-06-15', 'Grade 6 Activity Fee - Sample Data', 1, NOW(), NOW()),
-- Semester 2
(1, 6, NULL, 'Semester 2', 1, 5000.00, '2024-12-15', 'Grade 6 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 6, NULL, 'Semester 2', 2, 500.00, '2024-12-15', 'Grade 6 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 6, NULL, 'Semester 2', 3, 800.00, '2024-12-15', 'Grade 6 Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 6, NULL, 'Semester 2', 4, 600.00, '2024-12-15', 'Grade 6 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 6, NULL, 'Semester 2', 7, 750.00, '2024-12-15', 'Grade 6 Exam Fee - Sample Data', 1, NOW(), NOW());

-- Grade 7 Fee Structures
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
-- Semester 1
(1, 7, NULL, 'Semester 1', 1, 5500.00, '2024-06-15', 'Grade 7 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 7, NULL, 'Semester 1', 2, 550.00, '2024-06-15', 'Grade 7 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 7, NULL, 'Semester 1', 3, 900.00, '2024-06-15', 'Grade 7 Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 7, NULL, 'Semester 1', 4, 650.00, '2024-06-15', 'Grade 7 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 7, NULL, 'Semester 1', 5, 600.00, '2024-06-15', 'Grade 7 Activity Fee - Sample Data', 1, NOW(), NOW()),
-- Semester 2
(1, 7, NULL, 'Semester 2', 1, 5500.00, '2024-12-15', 'Grade 7 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 7, NULL, 'Semester 2', 2, 550.00, '2024-12-15', 'Grade 7 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 7, NULL, 'Semester 2', 3, 900.00, '2024-12-15', 'Grade 7 Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 7, NULL, 'Semester 2', 4, 650.00, '2024-12-15', 'Grade 7 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 7, NULL, 'Semester 2', 7, 800.00, '2024-12-15', 'Grade 7 Exam Fee - Sample Data', 1, NOW(), NOW());

-- Grade 8 Fee Structures
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
-- Semester 1
(1, 8, NULL, 'Semester 1', 1, 6000.00, '2024-06-15', 'Grade 8 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 8, NULL, 'Semester 1', 2, 600.00, '2024-06-15', 'Grade 8 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 8, NULL, 'Semester 1', 3, 1000.00, '2024-06-15', 'Grade 8 Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 8, NULL, 'Semester 1', 4, 700.00, '2024-06-15', 'Grade 8 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 8, NULL, 'Semester 1', 5, 650.00, '2024-06-15', 'Grade 8 Activity Fee - Sample Data', 1, NOW(), NOW()),
-- Semester 2
(1, 8, NULL, 'Semester 2', 1, 6000.00, '2024-12-15', 'Grade 8 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 8, NULL, 'Semester 2', 2, 600.00, '2024-12-15', 'Grade 8 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 8, NULL, 'Semester 2', 3, 1000.00, '2024-12-15', 'Grade 8 Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 8, NULL, 'Semester 2', 4, 700.00, '2024-12-15', 'Grade 8 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 8, NULL, 'Semester 2', 7, 850.00, '2024-12-15', 'Grade 8 Exam Fee - Sample Data', 1, NOW(), NOW());

-- HIGHER SECONDARY GRADES (9-10) - Senior Level with Board Preparation
-- Grade 9 Fee Structures (Pre-board preparation)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
-- Semester 1
(1, 9, NULL, 'Semester 1', 1, 7000.00, '2024-06-15', 'Grade 9 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 1', 2, 750.00, '2024-06-15', 'Grade 9 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 1', 3, 1200.00, '2024-06-15', 'Grade 9 Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 1', 4, 800.00, '2024-06-15', 'Grade 9 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 1', 5, 750.00, '2024-06-15', 'Grade 9 Activity Fee - Sample Data', 1, NOW(), NOW()),
-- Semester 2
(1, 9, NULL, 'Semester 2', 1, 7000.00, '2024-12-15', 'Grade 9 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 2', 2, 750.00, '2024-12-15', 'Grade 9 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 2', 3, 1200.00, '2024-12-15', 'Grade 9 Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 2', 4, 800.00, '2024-12-15', 'Grade 9 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 2', 7, 1000.00, '2024-12-15', 'Grade 9 Exam Fee - Sample Data', 1, NOW(), NOW());

-- Grade 10 Fee Structures (Board exam year - highest fees)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
-- Semester 1
(1, 10, NULL, 'Semester 1', 1, 8000.00, '2024-06-15', 'Grade 10 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 1', 2, 1000.00, '2024-06-15', 'Grade 10 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 1', 3, 1500.00, '2024-06-15', 'Grade 10 Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 1', 4, 900.00, '2024-06-15', 'Grade 10 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 1', 5, 850.00, '2024-06-15', 'Grade 10 Activity Fee - Sample Data', 1, NOW(), NOW()),
-- Semester 2
(1, 10, NULL, 'Semester 2', 1, 8000.00, '2024-12-15', 'Grade 10 Tuition Fee - Sample Data', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 2', 2, 1000.00, '2024-12-15', 'Grade 10 Library Fee - Sample Data', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 2', 3, 1500.00, '2024-12-15', 'Grade 10 Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 2', 4, 900.00, '2024-12-15', 'Grade 10 Sports Fee - Sample Data', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 2', 7, 1200.00, '2024-12-15', 'Grade 10 Board Exam Fee - Sample Data', 1, NOW(), NOW());

-- UNIVERSAL FEES (Apply to all students regardless of grade)
-- These fees are common across all grades and divisions
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
-- Semester 1 Universal Fees
(1, NULL, NULL, 'Semester 1', 6, 1200.00, '2024-06-15', 'Transport Fee Semester 1 - Sample Data', 1, NOW(), NOW()),
(1, NULL, NULL, 'Semester 1', 8, 300.00, '2024-06-15', 'Development Fee Semester 1 - Sample Data', 1, NOW(), NOW()),
(1, NULL, NULL, 'Semester 1', 9, 200.00, '2024-06-15', 'Security Fee Semester 1 - Sample Data', 1, NOW(), NOW()),
-- Semester 2 Universal Fees
(1, NULL, NULL, 'Semester 2', 6, 1200.00, '2024-12-15', 'Transport Fee Semester 2 - Sample Data', 1, NOW(), NOW()),
(1, NULL, NULL, 'Semester 2', 8, 300.00, '2024-12-15', 'Development Fee Semester 2 - Sample Data', 1, NOW(), NOW()),
(1, NULL, NULL, 'Semester 2', 9, 200.00, '2024-12-15', 'Security Fee Semester 2 - Sample Data', 1, NOW(), NOW());

-- SPECIAL DIVISION-SPECIFIC FEES (Examples of targeted fees)
-- Science stream for Grade 9 Division A (higher lab fees)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 9, 1, 'Semester 1', 3, 500.00, '2024-06-15', 'Grade 9A Science Stream Extra Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 9, 1, 'Semester 2', 3, 500.00, '2024-12-15', 'Grade 9A Science Stream Extra Lab Fee - Sample Data', 1, NOW(), NOW());

-- Computer stream for Grade 10 Division B
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 10, 2, 'Semester 1', 3, 800.00, '2024-06-15', 'Grade 10B Computer Stream Lab Fee - Sample Data', 1, NOW(), NOW()),
(1, 10, 2, 'Semester 2', 3, 800.00, '2024-12-15', 'Grade 10B Computer Stream Lab Fee - Sample Data', 1, NOW(), NOW());

-- ONE-TIME ADMISSION FEE (Only for new admissions)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, NULL, NULL, 'Semester 1', 10, 2000.00, '2024-06-15', 'One-time Admission Fee - Sample Data', 1, NOW(), NOW());

-- Verification Query - Show fee structure summary
SELECT 
  'SAMPLE DATA SUMMARY' as summary,
  COUNT(*) as total_fee_structures,
  COUNT(DISTINCT grade_id) as grades_covered,
  COUNT(DISTINCT semester) as semesters,
  SUM(amount) as total_fee_amount
FROM fee_structures 
WHERE description LIKE '%Sample Data%' AND is_active = 1;

-- Show grade-wise totals
SELECT 
  COALESCE(g.name, 'Universal') as grade_name,
  fs.semester,
  COUNT(fs.id) as fee_categories,
  SUM(fs.amount) as total_amount
FROM fee_structures fs
LEFT JOIN grades g ON fs.grade_id = g.id
WHERE fs.description LIKE '%Sample Data%' AND fs.is_active = 1
GROUP BY fs.grade_id, g.name, fs.semester
ORDER BY fs.grade_id, fs.semester;