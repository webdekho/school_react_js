-- Complete System Settings Setup for SMS, Email, and WhatsApp
-- This script will set up all communication settings in your existing system_settings table

-- Insert/Update General Settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, updated_by) 
VALUES 
('general_school_name', 'ABC International School', 'string', 'School name displayed throughout the system', 1),
('general_school_address', '123 Education Lane, Learning City, LC 12345', 'string', 'School physical address', 1),
('general_school_phone', '+91 98765 43210', 'string', 'School contact phone number', 1),
('general_school_email', 'info@abcschool.edu', 'string', 'School contact email address', 1),
('general_school_website', 'https://www.abcschool.edu', 'string', 'School website URL', 1),
('general_academic_year_start_month', 'April', 'string', 'Month when academic year starts', 1),
('general_default_currency', 'INR', 'string', 'Default currency for fees and payments', 1),
('general_timezone', 'Asia/Kolkata', 'string', 'System timezone', 1),
('general_date_format', 'DD/MM/YYYY', 'string', 'Default date format for display', 1),
('general_fee_reminder_days', '7', 'number', 'Days before due date to send fee reminders', 1),
('general_late_fee_percentage', '5', 'number', 'Percentage of fee amount charged as late fee', 1)
ON DUPLICATE KEY UPDATE 
    setting_value = VALUES(setting_value),
    setting_type = VALUES(setting_type),
    description = VALUES(description),
    updated_by = VALUES(updated_by);

-- Insert/Update Email Settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, updated_by) 
VALUES 
('email_smtp_host', '', 'string', 'SMTP server hostname (e.g., smtp.gmail.com)', 1),
('email_smtp_port', '587', 'number', 'SMTP server port (587 for TLS, 465 for SSL)', 1),
('email_smtp_username', '', 'string', 'SMTP username (usually your email address)', 1),
('email_smtp_password', '', 'string', 'SMTP password (use app password for Gmail)', 1),
('email_smtp_encryption', 'tls', 'string', 'SMTP encryption method (tls, ssl, none)', 1),
('email_from_email', '', 'string', 'Default from email address', 1),
('email_from_name', 'School Management System', 'string', 'Default from name', 1),
('email_enabled', '0', 'boolean', 'Whether email notifications are enabled', 1)
ON DUPLICATE KEY UPDATE 
    setting_value = VALUES(setting_value),
    setting_type = VALUES(setting_type),
    description = VALUES(description),
    updated_by = VALUES(updated_by);

-- Insert/Update SMS Settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, updated_by) 
VALUES 
('sms_provider', 'twilio', 'string', 'SMS service provider (twilio, textlocal, msg91, custom)', 1),
('sms_api_key', '', 'string', 'SMS API key or Account SID', 1),
('sms_api_secret', '', 'string', 'SMS API secret or Auth Token', 1),
('sms_sender_id', '', 'string', 'SMS sender ID or phone number', 1),
('sms_api_url', '', 'string', 'Custom SMS API URL (for custom provider)', 1),
('sms_enabled', '0', 'boolean', 'Whether SMS notifications are enabled', 1)
ON DUPLICATE KEY UPDATE 
    setting_value = VALUES(setting_value),
    setting_type = VALUES(setting_type),
    description = VALUES(description),
    updated_by = VALUES(updated_by);

-- Insert/Update WhatsApp Settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, updated_by) 
VALUES 
('whatsapp_type', 'text', 'string', 'WhatsApp message type (text, media, document)', 1),
('whatsapp_baseUrl', 'https://wa.clareinfotech.com/api/send', 'string', 'WhatsApp API base URL endpoint', 1),
('whatsapp_instance_id', '687646EA9210B', 'string', 'WhatsApp instance identifier', 1),
('whatsapp_access_token', '648db645b4f8c', 'string', 'WhatsApp API access token', 1),
('whatsapp_enabled', '0', 'boolean', 'Whether WhatsApp notifications are enabled', 1)
ON DUPLICATE KEY UPDATE 
    setting_value = VALUES(setting_value),
    setting_type = VALUES(setting_type),
    description = VALUES(description),
    updated_by = VALUES(updated_by);

-- Verify all settings were inserted
SELECT 'GENERAL SETTINGS' as category, setting_key, setting_value, setting_type 
FROM system_settings WHERE setting_key LIKE 'general_%'
UNION ALL
SELECT 'EMAIL SETTINGS' as category, setting_key, setting_value, setting_type 
FROM system_settings WHERE setting_key LIKE 'email_%'
UNION ALL
SELECT 'SMS SETTINGS' as category, setting_key, setting_value, setting_type 
FROM system_settings WHERE setting_key LIKE 'sms_%'
UNION ALL
SELECT 'WHATSAPP SETTINGS' as category, setting_key, setting_value, setting_type 
FROM system_settings WHERE setting_key LIKE 'whatsapp_%'
ORDER BY category, setting_key;