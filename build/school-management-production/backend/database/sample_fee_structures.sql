-- Sample Fee Structures (Semester Master) Data
-- This file contains sample data for the fee_structures table to demonstrate automatic fee assignment

-- Insert sample fee structures for different grades and categories
-- Assuming academic_year_id = 1 for current academic year

-- Grade 1 Fee Structures
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 1, 5000.00, '2024-04-15', 'Grade 1 - Tuition Fee (All Divisions)', 1, NOW(), NOW()),
(1, 1, NULL, 2, 500.00, '2024-04-15', 'Grade 1 - Library Fee (All Divisions)', 1, NOW(), NOW()),
(1, 1, NULL, 3, 300.00, '2024-04-15', 'Grade 1 - Activity Fee (All Divisions)', 1, NOW(), NOW()),
(1, 1, NULL, 4, 200.00, '2024-04-15', 'Grade 1 - Sports Fee (All Divisions)', 1, NOW(), NOW());

-- Grade 2 Fee Structures
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 2, NULL, 1, 5500.00, '2024-04-15', 'Grade 2 - Tuition Fee (All Divisions)', 1, NOW(), NOW()),
(1, 2, NULL, 2, 500.00, '2024-04-15', 'Grade 2 - Library Fee (All Divisions)', 1, NOW(), NOW()),
(1, 2, NULL, 3, 350.00, '2024-04-15', 'Grade 2 - Activity Fee (All Divisions)', 1, NOW(), NOW()),
(1, 2, NULL, 4, 250.00, '2024-04-15', 'Grade 2 - Sports Fee (All Divisions)', 1, NOW(), NOW());

-- Grade 3 Fee Structures
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 3, NULL, 1, 6000.00, '2024-04-15', 'Grade 3 - Tuition Fee (All Divisions)', 1, NOW(), NOW()),
(1, 3, NULL, 2, 600.00, '2024-04-15', 'Grade 3 - Library Fee (All Divisions)', 1, NOW(), NOW()),
(1, 3, NULL, 3, 400.00, '2024-04-15', 'Grade 3 - Activity Fee (All Divisions)', 1, NOW(), NOW()),
(1, 3, NULL, 4, 300.00, '2024-04-15', 'Grade 3 - Sports Fee (All Divisions)', 1, NOW(), NOW());

-- Grade 4 Fee Structures
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 4, NULL, 1, 6500.00, '2024-04-15', 'Grade 4 - Tuition Fee (All Divisions)', 1, NOW(), NOW()),
(1, 4, NULL, 2, 600.00, '2024-04-15', 'Grade 4 - Library Fee (All Divisions)', 1, NOW(), NOW()),
(1, 4, NULL, 3, 450.00, '2024-04-15', 'Grade 4 - Activity Fee (All Divisions)', 1, NOW(), NOW()),
(1, 4, NULL, 4, 350.00, '2024-04-15', 'Grade 4 - Sports Fee (All Divisions)', 1, NOW(), NOW());

-- Grade 5 Fee Structures
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 5, NULL, 1, 7000.00, '2024-04-15', 'Grade 5 - Tuition Fee (All Divisions)', 1, NOW(), NOW()),
(1, 5, NULL, 2, 700.00, '2024-04-15', 'Grade 5 - Library Fee (All Divisions)', 1, NOW(), NOW()),
(1, 5, NULL, 3, 500.00, '2024-04-15', 'Grade 5 - Activity Fee (All Divisions)', 1, NOW(), NOW()),
(1, 5, NULL, 4, 400.00, '2024-04-15', 'Grade 5 - Sports Fee (All Divisions)', 1, NOW(), NOW());

-- Special fee for Grade 5 Division A (Science Lab Fee)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 5, 1, 5, 1000.00, '2024-04-15', 'Grade 5 Division A - Science Lab Fee', 1, NOW(), NOW());

-- Grade 6 Fee Structures (Higher fees for secondary)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 6, NULL, 1, 8000.00, '2024-04-15', 'Grade 6 - Tuition Fee (All Divisions)', 1, NOW(), NOW()),
(1, 6, NULL, 2, 800.00, '2024-04-15', 'Grade 6 - Library Fee (All Divisions)', 1, NOW(), NOW()),
(1, 6, NULL, 3, 600.00, '2024-04-15', 'Grade 6 - Activity Fee (All Divisions)', 1, NOW(), NOW()),
(1, 6, NULL, 4, 500.00, '2024-04-15', 'Grade 6 - Sports Fee (All Divisions)', 1, NOW(), NOW()),
(1, 6, NULL, 5, 1200.00, '2024-04-15', 'Grade 6 - Lab Fee (All Divisions)', 1, NOW(), NOW());

-- Grade 7 Fee Structures
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 7, NULL, 1, 8500.00, '2024-04-15', 'Grade 7 - Tuition Fee (All Divisions)', 1, NOW(), NOW()),
(1, 7, NULL, 2, 800.00, '2024-04-15', 'Grade 7 - Library Fee (All Divisions)', 1, NOW(), NOW()),
(1, 7, NULL, 3, 650.00, '2024-04-15', 'Grade 7 - Activity Fee (All Divisions)', 1, NOW(), NOW()),
(1, 7, NULL, 4, 550.00, '2024-04-15', 'Grade 7 - Sports Fee (All Divisions)', 1, NOW(), NOW()),
(1, 7, NULL, 5, 1300.00, '2024-04-15', 'Grade 7 - Lab Fee (All Divisions)', 1, NOW(), NOW());

-- Grade 8 Fee Structures
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 8, NULL, 1, 9000.00, '2024-04-15', 'Grade 8 - Tuition Fee (All Divisions)', 1, NOW(), NOW()),
(1, 8, NULL, 2, 900.00, '2024-04-15', 'Grade 8 - Library Fee (All Divisions)', 1, NOW(), NOW()),
(1, 8, NULL, 3, 700.00, '2024-04-15', 'Grade 8 - Activity Fee (All Divisions)', 1, NOW(), NOW()),
(1, 8, NULL, 4, 600.00, '2024-04-15', 'Grade 8 - Sports Fee (All Divisions)', 1, NOW(), NOW()),
(1, 8, NULL, 5, 1400.00, '2024-04-15', 'Grade 8 - Lab Fee (All Divisions)', 1, NOW(), NOW());

-- Grade 9 Fee Structures (Pre-Board preparation)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 9, NULL, 1, 10000.00, '2024-04-15', 'Grade 9 - Tuition Fee (All Divisions)', 1, NOW(), NOW()),
(1, 9, NULL, 2, 1000.00, '2024-04-15', 'Grade 9 - Library Fee (All Divisions)', 1, NOW(), NOW()),
(1, 9, NULL, 3, 800.00, '2024-04-15', 'Grade 9 - Activity Fee (All Divisions)', 1, NOW(), NOW()),
(1, 9, NULL, 4, 700.00, '2024-04-15', 'Grade 9 - Sports Fee (All Divisions)', 1, NOW(), NOW()),
(1, 9, NULL, 5, 1500.00, '2024-04-15', 'Grade 9 - Lab Fee (All Divisions)', 1, NOW(), NOW()),
(1, 9, NULL, 6, 500.00, '2024-04-15', 'Grade 9 - Exam Fee (All Divisions)', 1, NOW(), NOW());

-- Grade 10 Fee Structures (Board exam preparation)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 10, NULL, 1, 12000.00, '2024-04-15', 'Grade 10 - Tuition Fee (All Divisions)', 1, NOW(), NOW()),
(1, 10, NULL, 2, 1200.00, '2024-04-15', 'Grade 10 - Library Fee (All Divisions)', 1, NOW(), NOW()),
(1, 10, NULL, 3, 1000.00, '2024-04-15', 'Grade 10 - Activity Fee (All Divisions)', 1, NOW(), NOW()),
(1, 10, NULL, 4, 800.00, '2024-04-15', 'Grade 10 - Sports Fee (All Divisions)', 1, NOW(), NOW()),
(1, 10, NULL, 5, 2000.00, '2024-04-15', 'Grade 10 - Lab Fee (All Divisions)', 1, NOW(), NOW()),
(1, 10, NULL, 6, 1500.00, '2024-04-15', 'Grade 10 - Board Exam Fee (All Divisions)', 1, NOW(), NOW());

-- Universal fees (apply to all grades and divisions)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, NULL, NULL, 7, 1000.00, '2024-04-15', 'Transportation Fee (All Students)', 1, NOW(), NOW()),
(1, NULL, NULL, 8, 300.00, '2024-04-15', 'Security Fee (All Students)', 1, NOW(), NOW()),
(1, NULL, NULL, 9, 200.00, '2024-04-15', 'Development Fee (All Students)', 1, NOW(), NOW());

-- Sample fee categories (if not exists)
INSERT IGNORE INTO `fee_categories` (`id`, `name`, `description`, `is_active`) VALUES
(1, 'Tuition Fee', 'Monthly tuition charges', 1),
(2, 'Library Fee', 'Library usage and book charges', 1),
(3, 'Activity Fee', 'Extra-curricular activities', 1),
(4, 'Sports Fee', 'Sports equipment and activities', 1),
(5, 'Lab Fee', 'Science/Computer lab usage', 1),
(6, 'Exam Fee', 'Examination and assessment charges', 1),
(7, 'Transportation', 'Bus/Transport facility', 1),
(8, 'Security Fee', 'Campus security charges', 1),
(9, 'Development Fee', 'Infrastructure development', 1);