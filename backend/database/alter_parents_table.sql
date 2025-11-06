-- Add new columns to parents table
ALTER TABLE `parents`
ADD COLUMN `occupation` VARCHAR(150) NULL AFTER `pincode`,
ADD COLUMN `current_employment` VARCHAR(150) NULL AFTER `occupation`,
ADD COLUMN `company_name` VARCHAR(150) NULL AFTER `current_employment`,
ADD COLUMN `how_know_kid` TEXT NULL AFTER `company_name`,
ADD COLUMN `best_contact_day` VARCHAR(50) NULL AFTER `how_know_kid`,
ADD COLUMN `best_contact_time` VARCHAR(50) NULL AFTER `best_contact_day`,
ADD COLUMN `kid_likes` TEXT NULL AFTER `best_contact_time`,
ADD COLUMN `kid_dislikes` TEXT NULL AFTER `kid_likes`,
ADD COLUMN `kid_aspirations` TEXT NULL AFTER `kid_dislikes`,
ADD COLUMN `id_proof` VARCHAR(255) NULL AFTER `kid_aspirations`,
ADD COLUMN `address_proof` VARCHAR(255) NULL AFTER `id_proof`,
ADD COLUMN `parent_photo` VARCHAR(255) NULL AFTER `address_proof`;

-- Add indexes for frequently accessed columns
ALTER TABLE `parents`
ADD INDEX `idx_occupation` (`occupation`),
ADD INDEX `idx_best_contact_day` (`best_contact_day`);

