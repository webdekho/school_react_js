-- Update system_settings table structure if needed
-- Add primary key and unique constraint if they don't exist

-- Add auto increment primary key if it doesn't exist
ALTER TABLE `system_settings` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Add unique constraint on setting_key if it doesn't exist
ALTER TABLE `system_settings` ADD UNIQUE KEY `unique_setting_key` (`setting_key`);

-- Add index on setting_key for better performance
ALTER TABLE `system_settings` ADD KEY `idx_setting_key` (`setting_key`);

-- Show table structure
DESCRIBE system_settings;