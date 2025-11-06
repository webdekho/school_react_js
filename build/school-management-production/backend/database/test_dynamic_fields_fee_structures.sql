-- Test dynamic fields for fee structures
-- This adds sample data to test photo upload for Bag items and size selection for Shoes/Uniform items

-- Clear existing test data (be careful in production)
-- DELETE FROM fee_structures WHERE description LIKE '%test%';

-- Insert Bag fee structures (should show photo upload field)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 'Semester 1', 1, 1500.00, '2024-06-15', 'Grade 1 School Bag - test dynamic photo field', 1, NOW(), NOW()),
(1, 2, NULL, 'Semester 1', 1, 1600.00, '2024-06-15', 'Grade 2 School Bag - test dynamic photo field', 1, NOW(), NOW());

-- Insert Uniform/Shoes fee structures (should show size selection field)
INSERT INTO `fee_structures` (`academic_year_id`, `grade_id`, `division_id`, `semester`, `fee_category_id`, `amount`, `due_date`, `description`, `item_size`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 'Semester 1', 3, 800.00, '2024-06-15', 'Grade 1 School Uniform - test dynamic size field', 'S', 1, NOW(), NOW()),
(1, 1, NULL, 'Semester 1', 3, 850.00, '2024-06-15', 'Grade 1 School Shoes - test dynamic size field', '6', 1, NOW(), NOW()),
(1, 2, NULL, 'Semester 1', 3, 900.00, '2024-06-15', 'Grade 2 School Uniform - test dynamic size field', 'M', 1, NOW(), NOW()),
(1, 2, NULL, 'Semester 1', 3, 950.00, '2024-06-15', 'Grade 2 School Shoes - test dynamic size field', '7', 1, NOW(), NOW());

-- Verify the data
SELECT 
  fs.id,
  fc.name as category_name,
  g.name as grade_name,
  fs.amount,
  fs.item_photo,
  fs.item_size,
  fs.description
FROM fee_structures fs
JOIN fee_categories fc ON fs.fee_category_id = fc.id
LEFT JOIN grades g ON fs.grade_id = g.id
WHERE fs.description LIKE '%test%'
ORDER BY fc.name, g.name;