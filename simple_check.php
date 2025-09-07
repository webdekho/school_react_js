<?php
// Simple database check - run this directly in browser
// http://localhost/school/simple_check.php

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Database Check Results</h2>";

try {
    // Try to connect to database
    $pdo = new PDO("mysql:host=localhost;dbname=school_db", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p style='color: green;'>✅ Database connection successful</p>";
    
    // Check if tables exist
    $tables = ['staff', 'parents', 'roles'];
    echo "<h3>Table Check:</h3>";
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) FROM $table");
            $count = $stmt->fetchColumn();
            echo "<p style='color: green;'>✅ Table '$table' exists with $count records</p>";
        } catch (Exception $e) {
            echo "<p style='color: red;'>❌ Table '$table' error: " . $e->getMessage() . "</p>";
        }
    }
    
    // Check for demo accounts
    echo "<h3>Demo Accounts Check:</h3>";
    
    // Check staff table
    $stmt = $pdo->query("SHOW COLUMNS FROM staff LIKE 'password_hash'");
    if ($stmt->rowCount() > 0) {
        echo "<p style='color: green;'>✅ Staff table has password_hash column</p>";
    } else {
        echo "<p style='color: red;'>❌ Staff table missing password_hash column</p>";
    }
    
    $stmt = $pdo->query("SHOW COLUMNS FROM staff LIKE 'is_active'");
    if ($stmt->rowCount() > 0) {
        echo "<p style='color: green;'>✅ Staff table has is_active column</p>";
    } else {
        echo "<p style='color: red;'>❌ Staff table missing is_active column</p>";
    }
    
    // Check for admin account
    $stmt = $pdo->prepare("SELECT id, name, mobile, email, is_active FROM staff WHERE mobile = ?");
    $stmt->execute(['1111111111']);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($admin) {
        echo "<p style='color: green;'>✅ Admin account found: " . json_encode($admin) . "</p>";
    } else {
        echo "<p style='color: red;'>❌ Admin account NOT found</p>";
    }
    
    // Check for staff account
    $stmt = $pdo->prepare("SELECT id, name, mobile, email, is_active FROM staff WHERE mobile = ?");
    $stmt->execute(['2222222222']);
    $staff = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($staff) {
        echo "<p style='color: green;'>✅ Staff account found: " . json_encode($staff) . "</p>";
    } else {
        echo "<p style='color: red;'>❌ Staff account NOT found</p>";
    }
    
    // Check parents table
    $stmt = $pdo->query("SHOW COLUMNS FROM parents LIKE 'password_hash'");
    if ($stmt->rowCount() > 0) {
        echo "<p style='color: green;'>✅ Parents table has password_hash column</p>";
    } else {
        echo "<p style='color: red;'>❌ Parents table missing password_hash column</p>";
    }
    
    // Check for parent account
    $stmt = $pdo->prepare("SELECT id, name, mobile, email, is_active FROM parents WHERE mobile = ?");
    $stmt->execute(['3333333333']);
    $parent = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($parent) {
        echo "<p style='color: green;'>✅ Parent account found: " . json_encode($parent) . "</p>";
    } else {
        echo "<p style='color: red;'>❌ Parent account NOT found</p>";
    }
    
    // Test password verification
    echo "<h3>Password Test:</h3>";
    $test_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    $result = password_verify('password', $test_hash);
    echo "<p style='color: " . ($result ? 'green' : 'red') . ";'>" . ($result ? '✅' : '❌') . " Password 'password' verification: " . ($result ? 'PASS' : 'FAIL') . "</p>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Database error: " . $e->getMessage() . "</p>";
    echo "<p>This usually means:</p>";
    echo "<ul>";
    echo "<li>MySQL is not running</li>";
    echo "<li>Database 'school_db' doesn't exist</li>";
    echo "<li>Wrong database credentials</li>";
    echo "</ul>";
}

echo "<h3>Next Steps:</h3>";
echo "<ol>";
echo "<li>If database connection failed: Start XAMPP MySQL and create 'school_db' database</li>";
echo "<li>If accounts are missing: Run the comprehensive SQL setup</li>";
echo "<li>If password_hash columns are missing: The SQL will add them</li>";
echo "</ol>";
?>