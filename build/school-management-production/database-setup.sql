-- Database Setup for Production
-- Run this script on your production database

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS school_management CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Use the database
USE school_management;

-- Note: Import your existing database structure and data here
-- You can export from your development database using:
-- mysqldump -u root -p school_management > database_backup.sql

-- Then import on production:
-- mysql -u production_user -p school_management < database_backup.sql

-- Update any development-specific data
-- UPDATE settings SET value = 'production' WHERE setting_key = 'environment';
-- UPDATE settings SET value = 'https://yourdomain.com' WHERE setting_key = 'base_url';
