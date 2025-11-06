-- Add dob_date column to staff_kids table if it does not exist
ALTER TABLE `staff_kids`
    ADD COLUMN `dob_date` DATE NULL AFTER `age`;


