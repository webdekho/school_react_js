-- Create subject table
CREATE TABLE IF NOT EXISTS `subject` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `subject_name` VARCHAR(100) NOT NULL,
    `grade_id` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_grade_id` (`grade_id`),
    INDEX `idx_subject_name` (`subject_name`),
    FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create syllabus_daywise table
CREATE TABLE IF NOT EXISTS `syllabus_daywise` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `grade_id` INT NOT NULL,
    `subject_id` INT NOT NULL,
    `topic_title` VARCHAR(150) NOT NULL,
    `topic_description` TEXT NULL,
    `day_number` INT NOT NULL,
    `video_link` VARCHAR(225) NULL DEFAULT NULL,
    `documents` VARCHAR(225) NULL DEFAULT NULL,
    `syllabus_date` DATE NOT NULL,
    `created_by` INT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_grade_id` (`grade_id`),
    INDEX `idx_subject_id` (`subject_id`),
    INDEX `idx_syllabus_date` (`syllabus_date`),
    INDEX `idx_day_number` (`day_number`),
    FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`subject_id`) REFERENCES `subject`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`created_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

