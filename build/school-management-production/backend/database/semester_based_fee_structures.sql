-- Semester-based Fee Structures (Semester Master) Data
-- This file contains sample data for semester-based fee assignment system
-- Each grade will have separate fee structures for Semester 1 and Semester 2

-- Clear existing sample data if needed
-- DELETE FROM fee_structures WHERE academic_year_id = 1;

-- Grade 1 Fee Structures - Semester 1
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 'Semester 1', 1, 2500.00, '2024-06-15', 'Grade 1 - Tuition Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 1, NULL, 'Semester 1', 2, 250.00, '2024-06-15', 'Grade 1 - Library Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 1, NULL, 'Semester 1', 3, 150.00, '2024-06-15', 'Grade 1 - Activity Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 1, NULL, 'Semester 1', 4, 100.00, '2024-06-15', 'Grade 1 - Sports Fee Semester 1 (All Divisions)', 1, NOW(), NOW());

-- Grade 1 Fee Structures - Semester 2
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 'Semester 2', 1, 2500.00, '2024-12-15', 'Grade 1 - Tuition Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 1, NULL, 'Semester 2', 2, 250.00, '2024-12-15', 'Grade 1 - Library Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 1, NULL, 'Semester 2', 3, 150.00, '2024-12-15', 'Grade 1 - Activity Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 1, NULL, 'Semester 2', 4, 100.00, '2024-12-15', 'Grade 1 - Sports Fee Semester 2 (All Divisions)', 1, NOW(), NOW());

-- Grade 2 Fee Structures - Semester 1
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 2, NULL, 'Semester 1', 1, 2750.00, '2024-06-15', 'Grade 2 - Tuition Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 2, NULL, 'Semester 1', 2, 250.00, '2024-06-15', 'Grade 2 - Library Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 2, NULL, 'Semester 1', 3, 175.00, '2024-06-15', 'Grade 2 - Activity Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 2, NULL, 'Semester 1', 4, 125.00, '2024-06-15', 'Grade 2 - Sports Fee Semester 1 (All Divisions)', 1, NOW(), NOW());

-- Grade 2 Fee Structures - Semester 2
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 2, NULL, 'Semester 2', 1, 2750.00, '2024-12-15', 'Grade 2 - Tuition Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 2, NULL, 'Semester 2', 2, 250.00, '2024-12-15', 'Grade 2 - Library Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 2, NULL, 'Semester 2', 3, 175.00, '2024-12-15', 'Grade 2 - Activity Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 2, NULL, 'Semester 2', 4, 125.00, '2024-12-15', 'Grade 2 - Sports Fee Semester 2 (All Divisions)', 1, NOW(), NOW());

-- Grade 3 Fee Structures - Semester 1
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 3, NULL, 'Semester 1', 1, 3000.00, '2024-06-15', 'Grade 3 - Tuition Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 3, NULL, 'Semester 1', 2, 300.00, '2024-06-15', 'Grade 3 - Library Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 3, NULL, 'Semester 1', 3, 200.00, '2024-06-15', 'Grade 3 - Activity Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 3, NULL, 'Semester 1', 4, 150.00, '2024-06-15', 'Grade 3 - Sports Fee Semester 1 (All Divisions)', 1, NOW(), NOW());

-- Grade 3 Fee Structures - Semester 2
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 3, NULL, 'Semester 2', 1, 3000.00, '2024-12-15', 'Grade 3 - Tuition Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 3, NULL, 'Semester 2', 2, 300.00, '2024-12-15', 'Grade 3 - Library Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 3, NULL, 'Semester 2', 3, 200.00, '2024-12-15', 'Grade 3 - Activity Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 3, NULL, 'Semester 2', 4, 150.00, '2024-12-15', 'Grade 3 - Sports Fee Semester 2 (All Divisions)', 1, NOW(), NOW());

-- Grade 4 Fee Structures - Semester 1
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 4, NULL, 'Semester 1', 1, 3250.00, '2024-06-15', 'Grade 4 - Tuition Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 4, NULL, 'Semester 1', 2, 300.00, '2024-06-15', 'Grade 4 - Library Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 4, NULL, 'Semester 1', 3, 225.00, '2024-06-15', 'Grade 4 - Activity Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 4, NULL, 'Semester 1', 4, 175.00, '2024-06-15', 'Grade 4 - Sports Fee Semester 1 (All Divisions)', 1, NOW(), NOW());

-- Grade 4 Fee Structures - Semester 2
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 4, NULL, 'Semester 2', 1, 3250.00, '2024-12-15', 'Grade 4 - Tuition Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 4, NULL, 'Semester 2', 2, 300.00, '2024-12-15', 'Grade 4 - Library Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 4, NULL, 'Semester 2', 3, 225.00, '2024-12-15', 'Grade 4 - Activity Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 4, NULL, 'Semester 2', 4, 175.00, '2024-12-15', 'Grade 4 - Sports Fee Semester 2 (All Divisions)', 1, NOW(), NOW());

-- Grade 5 Fee Structures - Semester 1
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 5, NULL, 'Semester 1', 1, 3500.00, '2024-06-15', 'Grade 5 - Tuition Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 5, NULL, 'Semester 1', 2, 350.00, '2024-06-15', 'Grade 5 - Library Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 5, NULL, 'Semester 1', 3, 250.00, '2024-06-15', 'Grade 5 - Activity Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 5, NULL, 'Semester 1', 4, 200.00, '2024-06-15', 'Grade 5 - Sports Fee Semester 1 (All Divisions)', 1, NOW(), NOW());

-- Grade 5 Fee Structures - Semester 2
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 5, NULL, 'Semester 2', 1, 3500.00, '2024-12-15', 'Grade 5 - Tuition Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 5, NULL, 'Semester 2', 2, 350.00, '2024-12-15', 'Grade 5 - Library Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 5, NULL, 'Semester 2', 3, 250.00, '2024-12-15', 'Grade 5 - Activity Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 5, NULL, 'Semester 2', 4, 200.00, '2024-12-15', 'Grade 5 - Sports Fee Semester 2 (All Divisions)', 1, NOW(), NOW());

-- Special fee for Grade 5 Division A (Science Lab Fee) - Both Semesters
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 5, 1, 'Semester 1', 5, 500.00, '2024-06-15', 'Grade 5 Division A - Science Lab Fee Semester 1', 1, NOW(), NOW()),
(1, 5, 1, 'Semester 2', 5, 500.00, '2024-12-15', 'Grade 5 Division A - Science Lab Fee Semester 2', 1, NOW(), NOW());

-- Grade 6 Fee Structures - Semester 1 (Higher fees for secondary)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 6, NULL, 'Semester 1', 1, 4000.00, '2024-06-15', 'Grade 6 - Tuition Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 6, NULL, 'Semester 1', 2, 400.00, '2024-06-15', 'Grade 6 - Library Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 6, NULL, 'Semester 1', 3, 300.00, '2024-06-15', 'Grade 6 - Activity Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 6, NULL, 'Semester 1', 4, 250.00, '2024-06-15', 'Grade 6 - Sports Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 6, NULL, 'Semester 1', 5, 600.00, '2024-06-15', 'Grade 6 - Lab Fee Semester 1 (All Divisions)', 1, NOW(), NOW());

-- Grade 6 Fee Structures - Semester 2
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 6, NULL, 'Semester 2', 1, 4000.00, '2024-12-15', 'Grade 6 - Tuition Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 6, NULL, 'Semester 2', 2, 400.00, '2024-12-15', 'Grade 6 - Library Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 6, NULL, 'Semester 2', 3, 300.00, '2024-12-15', 'Grade 6 - Activity Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 6, NULL, 'Semester 2', 4, 250.00, '2024-12-15', 'Grade 6 - Sports Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 6, NULL, 'Semester 2', 5, 600.00, '2024-12-15', 'Grade 6 - Lab Fee Semester 2 (All Divisions)', 1, NOW(), NOW());

-- Grade 7 Fee Structures - Semester 1
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 7, NULL, 'Semester 1', 1, 4250.00, '2024-06-15', 'Grade 7 - Tuition Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 7, NULL, 'Semester 1', 2, 400.00, '2024-06-15', 'Grade 7 - Library Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 7, NULL, 'Semester 1', 3, 325.00, '2024-06-15', 'Grade 7 - Activity Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 7, NULL, 'Semester 1', 4, 275.00, '2024-06-15', 'Grade 7 - Sports Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 7, NULL, 'Semester 1', 5, 650.00, '2024-06-15', 'Grade 7 - Lab Fee Semester 1 (All Divisions)', 1, NOW(), NOW());

-- Grade 7 Fee Structures - Semester 2
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 7, NULL, 'Semester 2', 1, 4250.00, '2024-12-15', 'Grade 7 - Tuition Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 7, NULL, 'Semester 2', 2, 400.00, '2024-12-15', 'Grade 7 - Library Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 7, NULL, 'Semester 2', 3, 325.00, '2024-12-15', 'Grade 7 - Activity Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 7, NULL, 'Semester 2', 4, 275.00, '2024-12-15', 'Grade 7 - Sports Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 7, NULL, 'Semester 2', 5, 650.00, '2024-12-15', 'Grade 7 - Lab Fee Semester 2 (All Divisions)', 1, NOW(), NOW());

-- Grade 8 Fee Structures - Semester 1
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 8, NULL, 'Semester 1', 1, 4500.00, '2024-06-15', 'Grade 8 - Tuition Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 8, NULL, 'Semester 1', 2, 450.00, '2024-06-15', 'Grade 8 - Library Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 8, NULL, 'Semester 1', 3, 350.00, '2024-06-15', 'Grade 8 - Activity Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 8, NULL, 'Semester 1', 4, 300.00, '2024-06-15', 'Grade 8 - Sports Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 8, NULL, 'Semester 1', 5, 700.00, '2024-06-15', 'Grade 8 - Lab Fee Semester 1 (All Divisions)', 1, NOW(), NOW());

-- Grade 8 Fee Structures - Semester 2
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 8, NULL, 'Semester 2', 1, 4500.00, '2024-12-15', 'Grade 8 - Tuition Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 8, NULL, 'Semester 2', 2, 450.00, '2024-12-15', 'Grade 8 - Library Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 8, NULL, 'Semester 2', 3, 350.00, '2024-12-15', 'Grade 8 - Activity Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 8, NULL, 'Semester 2', 4, 300.00, '2024-12-15', 'Grade 8 - Sports Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 8, NULL, 'Semester 2', 5, 700.00, '2024-12-15', 'Grade 8 - Lab Fee Semester 2 (All Divisions)', 1, NOW(), NOW());

-- Grade 9 Fee Structures - Semester 1 (Pre-Board preparation)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 9, NULL, 'Semester 1', 1, 5000.00, '2024-06-15', 'Grade 9 - Tuition Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 1', 2, 500.00, '2024-06-15', 'Grade 9 - Library Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 1', 3, 400.00, '2024-06-15', 'Grade 9 - Activity Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 1', 4, 350.00, '2024-06-15', 'Grade 9 - Sports Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 1', 5, 750.00, '2024-06-15', 'Grade 9 - Lab Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 1', 6, 250.00, '2024-06-15', 'Grade 9 - Exam Fee Semester 1 (All Divisions)', 1, NOW(), NOW());

-- Grade 9 Fee Structures - Semester 2
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 9, NULL, 'Semester 2', 1, 5000.00, '2024-12-15', 'Grade 9 - Tuition Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 2', 2, 500.00, '2024-12-15', 'Grade 9 - Library Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 2', 3, 400.00, '2024-12-15', 'Grade 9 - Activity Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 2', 4, 350.00, '2024-12-15', 'Grade 9 - Sports Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 2', 5, 750.00, '2024-12-15', 'Grade 9 - Lab Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 9, NULL, 'Semester 2', 6, 250.00, '2024-12-15', 'Grade 9 - Exam Fee Semester 2 (All Divisions)', 1, NOW(), NOW());

-- Grade 10 Fee Structures - Semester 1 (Board exam preparation)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 10, NULL, 'Semester 1', 1, 6000.00, '2024-06-15', 'Grade 10 - Tuition Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 1', 2, 600.00, '2024-06-15', 'Grade 10 - Library Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 1', 3, 500.00, '2024-06-15', 'Grade 10 - Activity Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 1', 4, 400.00, '2024-06-15', 'Grade 10 - Sports Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 1', 5, 1000.00, '2024-06-15', 'Grade 10 - Lab Fee Semester 1 (All Divisions)', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 1', 6, 750.00, '2024-06-15', 'Grade 10 - Board Exam Fee Semester 1 (All Divisions)', 1, NOW(), NOW());

-- Grade 10 Fee Structures - Semester 2
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 10, NULL, 'Semester 2', 1, 6000.00, '2024-12-15', 'Grade 10 - Tuition Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 2', 2, 600.00, '2024-12-15', 'Grade 10 - Library Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 2', 3, 500.00, '2024-12-15', 'Grade 10 - Activity Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 2', 4, 400.00, '2024-12-15', 'Grade 10 - Sports Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 2', 5, 1000.00, '2024-12-15', 'Grade 10 - Lab Fee Semester 2 (All Divisions)', 1, NOW(), NOW()),
(1, 10, NULL, 'Semester 2', 6, 750.00, '2024-12-15', 'Grade 10 - Board Exam Fee Semester 2 (All Divisions)', 1, NOW(), NOW());

-- Universal fees (apply to all grades and divisions) - Semester 1
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, NULL, NULL, 'Semester 1', 7, 500.00, '2024-06-15', 'Transportation Fee Semester 1 (All Students)', 1, NOW(), NOW()),
(1, NULL, NULL, 'Semester 1', 8, 150.00, '2024-06-15', 'Security Fee Semester 1 (All Students)', 1, NOW(), NOW()),
(1, NULL, NULL, 'Semester 1', 9, 100.00, '2024-06-15', 'Development Fee Semester 1 (All Students)', 1, NOW(), NOW());

-- Universal fees (apply to all grades and divisions) - Semester 2
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, NULL, NULL, 'Semester 2', 7, 500.00, '2024-12-15', 'Transportation Fee Semester 2 (All Students)', 1, NOW(), NOW()),
(1, NULL, NULL, 'Semester 2', 8, 150.00, '2024-12-15', 'Security Fee Semester 2 (All Students)', 1, NOW(), NOW()),
(1, NULL, NULL, 'Semester 2', 9, 100.00, '2024-12-15', 'Development Fee Semester 2 (All Students)', 1, NOW(), NOW());

-- Ensure fee categories exist
INSERT IGNORE INTO `fee_categories` (`id`, `name`, `description`, `is_active`) VALUES
(1, 'Tuition Fee', 'Academic tuition charges', 1),
(2, 'Library Fee', 'Library usage and book charges', 1),
(3, 'Activity Fee', 'Extra-curricular activities', 1),
(4, 'Sports Fee', 'Sports equipment and activities', 1),
(5, 'Lab Fee', 'Science/Computer lab usage', 1),
(6, 'Exam Fee', 'Examination and assessment charges', 1),
(7, 'Transportation', 'Bus/Transport facility', 1),
(8, 'Security Fee', 'Campus security charges', 1),
(9, 'Development Fee', 'Infrastructure development', 1);