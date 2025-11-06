-- Add special_need column to students table if it does not exist
ALTER TABLE `students`
ADD COLUMN `special need` TEXT NULL AFTER `lifestyle_diseases`;

