-- Create optional fee structures for testing
-- First, ensure we have the necessary fee categories

INSERT IGNORE INTO `fee_categories` (`name`, `description`, `is_active`) VALUES
('Transport Fee', 'School bus and transportation services', 1),
('Computer Lab Fee', 'Computer lab access and IT resources', 1),
('Sports Fee', 'Sports facilities and equipment', 1),
('Uniform Fee', 'School uniform and accessories', 1),
('Development Fee', 'School infrastructure development', 1),
('Hostel Fee', 'Boarding and accommodation services', 1),
('Meal Plan', 'Food and dining services', 1);

-- Create optional fee structures (is_mandatory = 0)
-- These are universal fees (grade_id = NULL, division_id = NULL)

INSERT INTO `fee_structures` (
    `academic_year_id`, 
    `grade_id`, 
    `division_id`, 
    `fee_category_id`, 
    `amount`, 
    `is_mandatory`, 
    `is_active`, 
    `created_at`, 
    `updated_at`
) VALUES
(1, NULL, NULL, (SELECT id FROM fee_categories WHERE name = 'Transport Fee' LIMIT 1), 800.00, 0, 1, NOW(), NOW()),
(1, NULL, NULL, (SELECT id FROM fee_categories WHERE name = 'Computer Lab Fee' LIMIT 1), 600.00, 0, 1, NOW(), NOW()),
(1, NULL, NULL, (SELECT id FROM fee_categories WHERE name = 'Sports Fee' LIMIT 1), 300.00, 0, 1, NOW(), NOW()),
(1, NULL, NULL, (SELECT id FROM fee_categories WHERE name = 'Uniform Fee' LIMIT 1), 1200.00, 0, 1, NOW(), NOW()),
(1, NULL, NULL, (SELECT id FROM fee_categories WHERE name = 'Development Fee' LIMIT 1), 500.00, 0, 1, NOW(), NOW()),
(1, NULL, NULL, (SELECT id FROM fee_categories WHERE name = 'Hostel Fee' LIMIT 1), 2000.00, 0, 1, NOW(), NOW()),
(1, NULL, NULL, (SELECT id FROM fee_categories WHERE name = 'Meal Plan' LIMIT 1), 1500.00, 0, 1, NOW(), NOW());

-- Also create some grade-specific optional fees
INSERT INTO `fee_structures` (
    `academic_year_id`, 
    `grade_id`, 
    `division_id`, 
    `fee_category_id`, 
    `amount`, 
    `is_mandatory`, 
    `is_active`, 
    `created_at`, 
    `updated_at`
) VALUES
(1, 1, NULL, (SELECT id FROM fee_categories WHERE name = 'Sports Fee' LIMIT 1), 250.00, 0, 1, NOW(), NOW()),
(1, 2, NULL, (SELECT id FROM fee_categories WHERE name = 'Sports Fee' LIMIT 1), 300.00, 0, 1, NOW(), NOW()),
(1, 3, NULL, (SELECT id FROM fee_categories WHERE name = 'Sports Fee' LIMIT 1), 350.00, 0, 1, NOW(), NOW()),
(1, 4, NULL, (SELECT id FROM fee_categories WHERE name = 'Computer Lab Fee' LIMIT 1), 500.00, 0, 1, NOW(), NOW()),
(1, 5, NULL, (SELECT id FROM fee_categories WHERE name = 'Computer Lab Fee' LIMIT 1), 600.00, 0, 1, NOW(), NOW());

-- Verify the created optional fees
SELECT 
    fs.id,
    fs.amount,
    fs.is_mandatory,
    fc.name as category_name,
    CASE 
        WHEN fs.grade_id IS NULL AND fs.division_id IS NULL THEN 'Universal'
        WHEN fs.grade_id IS NOT NULL AND fs.division_id IS NULL THEN CONCAT('Grade ', fs.grade_id)
        ELSE CONCAT('Grade ', fs.grade_id, ', Division ', fs.division_id)
    END as scope
FROM fee_structures fs
JOIN fee_categories fc ON fs.fee_category_id = fc.id
WHERE fs.is_mandatory = 0 
AND fs.is_active = 1
ORDER BY fc.name, fs.grade_id;
