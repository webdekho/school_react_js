-- Create staff_kids table
CREATE TABLE IF NOT EXISTS `staff_kids` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `staff_id` INT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
    `age` INT NOT NULL,
    `dob_date` DATE NULL,
    `grade` VARCHAR(50) NULL,
    `school_name` VARCHAR(150) NULL,
    `created_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_staff_id` (`staff_id`),
    INDEX `idx_name` (`name`),
    FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

