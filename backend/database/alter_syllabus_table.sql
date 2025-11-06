-- Add video_link and documents columns to syllabus_daywise table
ALTER TABLE `syllabus_daywise` 
ADD `video_link` VARCHAR(225) NULL DEFAULT NULL AFTER `day_number`, 
ADD `documents` VARCHAR(225) NULL DEFAULT NULL AFTER `video_link`;

