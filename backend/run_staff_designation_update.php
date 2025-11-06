<?php
/**
 * Run SQL Migration: Add Designation Column to Staff Table
 * 
 * This script adds the designation column to the staff table
 */

// Database configuration
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management';

try {
    // Connect to database
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ Connected to database\n";
    
    // Check if column already exists
    $checkQuery = "SHOW COLUMNS FROM `staff` LIKE 'designation'";
    $result = $pdo->query($checkQuery);
    
    if ($result->rowCount() > 0) {
        echo "✓ Column 'designation' already exists\n";
    } else {
        echo "→ Adding designation column...\n";
        
        // Add designation column
        $alterQuery = "ALTER TABLE `staff` 
            ADD COLUMN `designation` VARCHAR(100) NULL 
            COMMENT 'Staff designation (e.g., Senior Teacher, Head of Department)' 
            AFTER `role_id`";
        
        $pdo->exec($alterQuery);
        echo "✓ Column 'designation' added successfully\n";
        
        // Add index
        echo "→ Adding index...\n";
        $indexQuery = "ALTER TABLE `staff` 
            ADD INDEX `idx_designation` (`designation`)";
        
        $pdo->exec($indexQuery);
        echo "✓ Index added successfully\n";
    }
    
    // Verify column exists
    $verifyQuery = "SHOW COLUMNS FROM `staff` LIKE 'designation'";
    $verifyResult = $pdo->query($verifyQuery);
    
    if ($verifyResult->rowCount() > 0) {
        $columnInfo = $verifyResult->fetch(PDO::FETCH_ASSOC);
        echo "\n✓ Verification Successful!\n";
        echo "Column Details:\n";
        echo "  - Name: " . $columnInfo['Field'] . "\n";
        echo "  - Type: " . $columnInfo['Type'] . "\n";
        echo "  - Null: " . $columnInfo['Null'] . "\n";
        echo "  - Default: " . ($columnInfo['Default'] ?? 'NULL') . "\n";
    } else {
        throw new Exception("Column verification failed!");
    }
    
    echo "\n✅ Migration completed successfully!\n";
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

