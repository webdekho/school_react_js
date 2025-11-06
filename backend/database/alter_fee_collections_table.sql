-- Add fee_category_id column to fee_collections table for direct payments
ALTER TABLE `fee_collections`
ADD COLUMN `fee_category_id` INT NULL DEFAULT NULL AFTER `fee_type_id`,
ADD INDEX `idx_fee_category_id` (`fee_category_id`);

-- Add semester column to fee_collections table
ALTER TABLE `fee_collections`
ADD COLUMN `semester` ENUM('Semester 1', 'Semester 2') NULL DEFAULT NULL AFTER `fee_category_id`,
ADD INDEX `idx_semester` (`semester`);

-- Add foreign key constraint if fee_categories table exists
-- Note: Uncomment the line below if you want to enforce referential integrity
-- ALTER TABLE `fee_collections`
-- ADD CONSTRAINT `fk_fee_collections_category` FOREIGN KEY (`fee_category_id`) REFERENCES `fee_categories`(`id`) ON DELETE SET NULL;

