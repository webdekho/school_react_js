-- Add WhatsApp configuration settings to system_settings table
-- Run this if you already have the system_settings table but need to add WhatsApp settings

INSERT IGNORE INTO `system_settings` (`category`, `key`, `value`, `description`) VALUES
('whatsapp', 'type', 'text', 'WhatsApp message type (text, media, document)'),
('whatsapp', 'baseUrl', 'https://wa.clareinfotech.com/api/send', 'WhatsApp API base URL'),
('whatsapp', 'instance_id', '687646EA9210B', 'WhatsApp instance identifier'),
('whatsapp', 'access_token', '648db645b4f8c', 'WhatsApp API access token'),
('whatsapp', 'enabled', '0', 'Whether WhatsApp notifications are enabled');

-- Verify the settings were added
SELECT * FROM system_settings WHERE category = 'whatsapp';