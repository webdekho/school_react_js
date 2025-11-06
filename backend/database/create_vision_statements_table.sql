-- Create vision_statements table
CREATE TABLE IF NOT EXISTS `vision_statements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `grade_id` int(11) DEFAULT 0 COMMENT '0 for global/staff vision, specific grade_id for student vision',
  `staff_id` int(11) NOT NULL,
  `vision` text NOT NULL,
  `created_date` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_grade_id` (`grade_id`),
  KEY `idx_staff_id` (`staff_id`),
  KEY `idx_created_date` (`created_date`),
  CONSTRAINT `fk_vision_grade` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vision_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
