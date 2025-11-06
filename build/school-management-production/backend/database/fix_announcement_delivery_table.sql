-- Create announcement_delivery_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS `announcement_delivery_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `announcement_id` int(11) NOT NULL,
  `recipient_type` enum('parent','staff') NOT NULL,
  `recipient_id` int(11) NOT NULL,
  `recipient_name` varchar(100) DEFAULT NULL,
  `recipient_mobile` varchar(20) DEFAULT NULL,
  `recipient_email` varchar(100) DEFAULT NULL,
  `channel` enum('whatsapp','sms','email') NOT NULL,
  `status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
  `sent_at` datetime DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `announcement_id` (`announcement_id`),
  KEY `recipient_type_id` (`recipient_type`, `recipient_id`),
  KEY `status` (`status`),
  KEY `channel` (`channel`),
  CONSTRAINT `announcement_delivery_status_ibfk_1` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add any missing columns to announcements table
ALTER TABLE `announcements` 
  ADD COLUMN IF NOT EXISTS `total_recipients` int(11) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `sent_count` int(11) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `failed_count` int(11) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `sent_at` datetime DEFAULT NULL;