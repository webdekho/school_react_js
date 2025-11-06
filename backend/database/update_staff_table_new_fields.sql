-- Add new fields to staff table for enhanced staff management
-- Medical History, Qualification, Experience, Achievements, Salary Information, PF Info, Photo

ALTER TABLE `staff` 
ADD COLUMN `medical_history` TEXT NULL COMMENT 'Medical history and health conditions' AFTER `pincode`,
ADD COLUMN `qualification` VARCHAR(255) NOT NULL COMMENT 'Educational qualification (B.Ed, M.Sc, etc.)' AFTER `medical_history`,
ADD COLUMN `experience` TEXT NULL COMMENT 'Past work experience and organizations' AFTER `qualification`,
ADD COLUMN `achievements` TEXT NULL COMMENT 'Awards, recognitions, and special contributions' AFTER `experience`,
ADD COLUMN `basic_salary` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Basic salary amount' AFTER `achievements`,
ADD COLUMN `allowances` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Additional allowances' AFTER `basic_salary`,
ADD COLUMN `deductions` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Salary deductions' AFTER `allowances`,
ADD COLUMN `net_salary` DECIMAL(10,2) GENERATED ALWAYS AS (`basic_salary` + `allowances` - `deductions`) STORED COMMENT 'Auto-calculated net salary' AFTER `deductions`,
ADD COLUMN `pf_number` VARCHAR(50) NULL COMMENT 'Provident Fund number' AFTER `net_salary`,
ADD COLUMN `pf_contribution` DECIMAL(10,2) NULL COMMENT 'PF contribution amount or percentage' AFTER `pf_number`,
ADD COLUMN `photo_url` VARCHAR(500) NULL COMMENT 'URL to uploaded staff photo' AFTER `pf_contribution`;

-- Add index for better performance on salary fields
ALTER TABLE `staff` 
ADD INDEX `idx_salary` (`basic_salary`, `net_salary`),
ADD INDEX `idx_qualification` (`qualification`);