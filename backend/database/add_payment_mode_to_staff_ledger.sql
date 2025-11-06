-- Add payment_mode field to staff_ledger table
-- This adds a new payment_mode field to the existing staff_ledger table

ALTER TABLE `staff_ledger` 
ADD COLUMN `payment_mode` varchar(50) NULL COMMENT 'Payment mode information' 
AFTER `description`;

-- Create index for the new payment_mode field for better performance
CREATE INDEX IF NOT EXISTS `idx_staff_ledger_payment_mode` ON `staff_ledger` (`payment_mode`);