-- Insert WhatsApp settings into existing system_settings table
-- This matches your table structure with setting_key and setting_value columns

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `setting_type`, `description`, `updated_by`) VALUES
('whatsapp_type', 'text', 'string', 'WhatsApp message type (text, media, document)', 1),
('whatsapp_baseUrl', 'https://wa.clareinfotech.com/api/send', 'string', 'WhatsApp API base URL endpoint', 1),
('whatsapp_instance_id', '687646EA9210B', 'string', 'WhatsApp instance identifier', 1),
('whatsapp_access_token', '648db645b4f8c', 'string', 'WhatsApp API access token', 1),
('whatsapp_enabled', '0', 'boolean', 'Whether WhatsApp notifications are enabled', 1)
ON DUPLICATE KEY UPDATE 
    `setting_value` = VALUES(`setting_value`),
    `setting_type` = VALUES(`setting_type`),
    `description` = VALUES(`description`),
    `updated_by` = VALUES(`updated_by`);

-- Verify the settings were inserted
SELECT * FROM system_settings WHERE setting_key LIKE 'whatsapp_%';