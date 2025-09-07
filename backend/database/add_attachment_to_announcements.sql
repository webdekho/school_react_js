-- Add file attachment support to announcements table

ALTER TABLE `announcements` 
ADD COLUMN `attachment_filename` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Original filename of the attachment',
ADD COLUMN `attachment_filepath` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Server path to the uploaded file',
ADD COLUMN `attachment_size` INT(11) NULL DEFAULT NULL COMMENT 'File size in bytes',
ADD COLUMN `attachment_mime_type` VARCHAR(100) NULL DEFAULT NULL COMMENT 'MIME type of the attachment';

-- Add index for file operations
ALTER TABLE `announcements` 
ADD INDEX `idx_attachment` (`attachment_filename`);

-- Create uploads directory structure if not exists
-- This should be created manually: /Applications/XAMPP/xamppfiles/htdocs/School/backend/uploads/announcements/