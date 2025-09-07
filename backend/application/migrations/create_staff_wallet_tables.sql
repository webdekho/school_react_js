-- Staff Wallet System Tables
-- Run this SQL to create the necessary tables for staff wallet management

-- 1. Staff Wallets Table - Maintains current balance for each staff member
CREATE TABLE IF NOT EXISTS `staff_wallets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `staff_id` int(11) NOT NULL,
  `current_balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_collected` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_withdrawn` decimal(10,2) NOT NULL DEFAULT '0.00',
  `last_transaction_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_staff_wallet` (`staff_id`),
  KEY `idx_balance` (`current_balance`),
  CONSTRAINT `fk_staff_wallet_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- 2. Staff Ledger Table - Records all wallet transactions
CREATE TABLE IF NOT EXISTS `staff_ledger` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `staff_id` int(11) NOT NULL,
  `transaction_type` enum('collection','withdrawal','admin_clear','admin_adjustment') NOT NULL,
  `transaction_source` varchar(50) NOT NULL COMMENT 'fee_collection, admin_action, etc.',
  `reference_id` int(11) NULL COMMENT 'ID of related record (fee_collection.id, etc.)',
  `amount` decimal(10,2) NOT NULL,
  `balance_before` decimal(10,2) NOT NULL DEFAULT '0.00',
  `balance_after` decimal(10,2) NOT NULL DEFAULT '0.00',
  `description` text NULL,
  `payment_method` varchar(20) NULL COMMENT 'cash, bank_transfer, etc.',
  `receipt_number` varchar(50) NULL,
  `processed_by_admin_id` int(11) NULL,
  `transaction_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_staff_ledger_staff` (`staff_id`),
  KEY `idx_staff_ledger_date` (`transaction_date`),
  KEY `idx_staff_ledger_type` (`transaction_type`),
  KEY `idx_staff_ledger_source` (`transaction_source`, `reference_id`),
  KEY `idx_processed_by` (`processed_by_admin_id`),
  CONSTRAINT `fk_staff_ledger_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS `idx_staff_ledger_composite` ON `staff_ledger` (`staff_id`, `transaction_date` DESC);
CREATE INDEX IF NOT EXISTS `idx_wallet_last_transaction` ON `staff_wallets` (`last_transaction_at` DESC);

-- 4. Insert initial wallet records for existing staff
INSERT IGNORE INTO `staff_wallets` (`staff_id`, `current_balance`, `total_collected`, `total_withdrawn`, `created_at`, `updated_at`)
SELECT 
    `id` as staff_id, 
    0.00 as current_balance,
    0.00 as total_collected, 
    0.00 as total_withdrawn,
    NOW() as created_at,
    NOW() as updated_at
FROM `staff` 
WHERE `is_active` = 1;

-- Sample data for testing (remove in production)
-- UPDATE staff_wallets SET current_balance = 1500.00, total_collected = 1500.00 WHERE staff_id = 1;
-- INSERT INTO staff_ledger (staff_id, transaction_type, transaction_source, amount, balance_before, balance_after, description, transaction_date)
-- VALUES (1, 'collection', 'fee_collection', 1500.00, 0.00, 1500.00, 'Initial test collection', CURDATE());