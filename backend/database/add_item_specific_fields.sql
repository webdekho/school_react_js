-- Add item-specific fields to fee_structures table
-- This adds photo field for Bag items and size field for Shoes/Uniform items

-- Add photo field for Bag items (stores image file path)
ALTER TABLE `fee_structures` 
ADD COLUMN `item_photo` VARCHAR(255) NULL DEFAULT NULL AFTER `description`,
ADD COLUMN `item_size` VARCHAR(50) NULL DEFAULT NULL AFTER `item_photo`;

-- Add comments to clarify field usage
ALTER TABLE `fee_structures` 
MODIFY COLUMN `item_photo` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Photo file path for Bag items',
MODIFY COLUMN `item_size` VARCHAR(50) NULL DEFAULT NULL COMMENT 'Size field for Shoes/Uniform items (S, M, L, XL or shoe sizes)';