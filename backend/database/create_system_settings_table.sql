-- Create system_settings table for storing application configuration
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category` varchar(50) NOT NULL COMMENT 'Setting category (general, email, sms, etc.)',
  `key` varchar(100) NOT NULL COMMENT 'Setting key name',
  `value` text COMMENT 'Setting value',
  `description` text COMMENT 'Setting description',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_category_key` (`category`, `key`),
  KEY `idx_category` (`category`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default system settings
INSERT INTO `system_settings` (`category`, `key`, `value`, `description`) VALUES
('general', 'school_name', 'ABC International School', 'School name displayed throughout the system'),
('general', 'school_address', '123 Education Lane, Learning City, LC 12345', 'School physical address'),
('general', 'school_phone', '+91 98765 43210', 'School contact phone number'),
('general', 'school_email', 'info@abcschool.edu', 'School contact email address'),
('general', 'school_website', 'https://www.abcschool.edu', 'School website URL'),
('general', 'academic_year_start_month', 'April', 'Month when academic year starts'),
('general', 'default_currency', 'INR', 'Default currency for fees and payments'),
('general', 'timezone', 'Asia/Kolkata', 'System timezone'),
('general', 'date_format', 'DD/MM/YYYY', 'Default date format for display'),
('general', 'fee_reminder_days', '7', 'Days before due date to send fee reminders'),
('general', 'late_fee_percentage', '5', 'Percentage of fee amount charged as late fee'),

('email', 'smtp_host', '', 'SMTP server hostname'),
('email', 'smtp_port', '587', 'SMTP server port'),
('email', 'smtp_username', '', 'SMTP username'),
('email', 'smtp_password', '', 'SMTP password'),
('email', 'smtp_encryption', 'tls', 'SMTP encryption method'),
('email', 'from_email', '', 'Default from email address'),
('email', 'from_name', 'School Management System', 'Default from name'),

('sms', 'sms_provider', 'twilio', 'SMS service provider'),
('sms', 'api_key', '', 'SMS API key'),
('sms', 'api_secret', '', 'SMS API secret'),
('sms', 'sender_id', '', 'SMS sender ID'),
('sms', 'enabled', '0', 'Whether SMS is enabled'),

('whatsapp', 'type', 'text', 'WhatsApp message type (text, media, document)'),
('whatsapp', 'baseUrl', 'https://wa.clareinfotech.com/api/send', 'WhatsApp API base URL'),
('whatsapp', 'instance_id', '687646EA9210B', 'WhatsApp instance identifier'),
('whatsapp', 'access_token', '648db645b4f8c', 'WhatsApp API access token'),
('whatsapp', 'enabled', '0', 'Whether WhatsApp notifications are enabled');