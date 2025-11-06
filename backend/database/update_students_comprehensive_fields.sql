-- Comprehensive Student Information Update
-- This script adds all new fields requested for enhanced student management
-- Run this script to add emergency contact, travel mode, medical info, family doctor, documents, and more

-- Add Emergency Contact and Gender fields
ALTER TABLE `students` 
ADD COLUMN `emergency_contact_number` VARCHAR(15) NULL COMMENT 'Emergency contact number (10 digits)' AFTER `mobile`,
MODIFY COLUMN `gender` ENUM('Male', 'Female', 'Other') DEFAULT NULL COMMENT 'Student gender';

-- Add Travel Mode fields
ALTER TABLE `students`
ADD COLUMN `travel_mode` ENUM('School Bus', 'Own') DEFAULT NULL COMMENT 'Mode of travel to school' AFTER `bus_route_id`,
ADD COLUMN `vehicle_number` VARCHAR(20) NULL COMMENT 'Vehicle registration number (if Own transport)' AFTER `travel_mode`,
ADD COLUMN `parent_or_staff_name` VARCHAR(100) NULL COMMENT 'Name of parent/staff driving (if Own transport)' AFTER `vehicle_number`,
ADD COLUMN `verified_tts_id` VARCHAR(50) NULL COMMENT 'Verified TTS ID for barcode generation' AFTER `parent_or_staff_name`;

-- Add Medical Information fields
ALTER TABLE `students`
ADD COLUMN `allergies` TEXT NULL COMMENT 'JSON array of allergies (multi-select)' AFTER `medical_conditions`,
ADD COLUMN `diabetic` TINYINT(1) DEFAULT 0 COMMENT 'Is diabetic (0=No, 1=Yes)' AFTER `allergies`,
ADD COLUMN `lifestyle_diseases` TEXT NULL COMMENT 'Any lifestyle diseases' AFTER `diabetic`,
ADD COLUMN `asthmatic` TINYINT(1) DEFAULT 0 COMMENT 'Is asthmatic (0=No, 1=Yes)' AFTER `lifestyle_diseases`,
ADD COLUMN `phobia` TINYINT(1) DEFAULT 0 COMMENT 'Has phobia (0=No, 1=Yes)' AFTER `asthmatic`;

-- Add Family Doctor Information fields
ALTER TABLE `students`
ADD COLUMN `doctor_name` VARCHAR(100) NULL COMMENT 'Family doctor name' AFTER `phobia`,
ADD COLUMN `doctor_contact` VARCHAR(15) NULL COMMENT 'Family doctor contact number' AFTER `doctor_name`,
ADD COLUMN `clinic_address` TEXT NULL COMMENT 'Doctor clinic address' AFTER `doctor_contact`;

-- Update Blood Group to be more explicit
ALTER TABLE `students`
MODIFY COLUMN `blood_group` ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-') DEFAULT NULL COMMENT 'Blood group';

-- Add Document Upload fields
ALTER TABLE `students`
ADD COLUMN `student_photo_url` VARCHAR(255) NULL COMMENT 'Student photograph URL' AFTER `clinic_address`,
ADD COLUMN `id_proof_url` VARCHAR(255) NULL COMMENT 'ID proof document URL' AFTER `student_photo_url`,
ADD COLUMN `address_proof_url` VARCHAR(255) NULL COMMENT 'Address proof document URL' AFTER `id_proof_url`;

-- Add Student Aspirations field (Teacher editable)
ALTER TABLE `students`
ADD COLUMN `student_aspirations` TEXT NULL COMMENT 'Student aspirations (entered by teacher)' AFTER `address_proof_url`;

-- Add indexes for performance
ALTER TABLE `students`
ADD INDEX `idx_emergency_contact` (`emergency_contact_number`),
ADD INDEX `idx_travel_mode` (`travel_mode`),
ADD INDEX `idx_blood_group` (`blood_group`),
ADD INDEX `idx_verified_tts_id` (`verified_tts_id`);

-- Update existing gender values to match new enum format (if needed)
UPDATE `students` SET `gender` = 'Male' WHERE LOWER(`gender`) = 'male';
UPDATE `students` SET `gender` = 'Female' WHERE LOWER(`gender`) = 'female';
UPDATE `students` SET `gender` = 'Other' WHERE LOWER(`gender`) = 'other';

-- Create uploads directory structure note
-- Ensure the following directories exist in backend/uploads/:
-- - student_photos/
-- - student_id_proofs/
-- - student_address_proofs/

-- Verification queries
SELECT 
    COLUMN_NAME, 
    COLUMN_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT, 
    COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'students' 
    AND COLUMN_NAME IN (
        'emergency_contact_number', 'gender', 'travel_mode', 'vehicle_number', 
        'parent_or_staff_name', 'verified_tts_id', 'allergies', 'diabetic', 
        'lifestyle_diseases', 'asthmatic', 'phobia', 'doctor_name', 'doctor_contact', 
        'clinic_address', 'blood_group', 'student_photo_url', 'id_proof_url', 
        'address_proof_url', 'student_aspirations'
    )
ORDER BY ORDINAL_POSITION;

