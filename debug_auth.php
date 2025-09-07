<?php
// Debug script to check authentication setup
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database connection
$host = 'localhost';
$user = 'root';
$pass = '';
$dbname = 'school_db';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== DATABASE CONNECTION SUCCESSFUL ===\n";
    
    // Check if demo accounts exist in staff table
    echo "\n=== CHECKING STAFF TABLE ===\n";
    $stmt = $pdo->query("SELECT id, name, mobile, email, password_hash, is_active FROM staff WHERE mobile IN ('1111111111', '2222222222')");
    $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($staff)) {
        echo "❌ NO DEMO STAFF ACCOUNTS FOUND!\n";
    } else {
        echo "✅ Found " . count($staff) . " staff accounts:\n";
        foreach ($staff as $s) {
            echo "- ID: {$s['id']}, Name: {$s['name']}, Mobile: {$s['mobile']}, Active: {$s['is_active']}\n";
            echo "  Password hash exists: " . (!empty($s['password_hash']) ? 'YES' : 'NO') . "\n";
        }
    }
    
    // Check if demo parent exists
    echo "\n=== CHECKING PARENTS TABLE ===\n";
    $stmt = $pdo->query("SELECT id, name, mobile, email, password_hash, is_active FROM parents WHERE mobile = '3333333333'");
    $parent = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$parent) {
        echo "❌ NO DEMO PARENT ACCOUNT FOUND!\n";
    } else {
        echo "✅ Found parent account:\n";
        echo "- ID: {$parent['id']}, Name: {$parent['name']}, Mobile: {$parent['mobile']}, Active: {$parent['is_active']}\n";
        echo "  Password hash exists: " . (!empty($parent['password_hash']) ? 'YES' : 'NO') . "\n";
    }
    
    // Test password verification
    echo "\n=== TESTING PASSWORD VERIFICATION ===\n";
    $test_password = 'password';
    $correct_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    
    echo "Testing password: '$test_password'\n";
    echo "Expected hash: $correct_hash\n";
    echo "Verification result: " . (password_verify($test_password, $correct_hash) ? '✅ PASS' : '❌ FAIL') . "\n";
    
    // Test with actual database hashes
    if (!empty($staff)) {
        foreach ($staff as $s) {
            $verify_result = password_verify($test_password, $s['password_hash']);
            echo "Staff {$s['mobile']} password verify: " . ($verify_result ? '✅ PASS' : '❌ FAIL') . "\n";
        }
    }
    
    if ($parent && !empty($parent['password_hash'])) {
        $verify_result = password_verify($test_password, $parent['password_hash']);
        echo "Parent {$parent['mobile']} password verify: " . ($verify_result ? '✅ PASS' : '❌ FAIL') . "\n";
    }
    
    // Check roles table
    echo "\n=== CHECKING ROLES TABLE ===\n";
    $stmt = $pdo->query("SELECT id, name, permissions FROM roles WHERE name = 'Demo Staff'");
    $role = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$role) {
        echo "❌ NO DEMO ROLE FOUND!\n";
    } else {
        echo "✅ Found demo role: ID {$role['id']}, Name: {$role['name']}\n";
        echo "  Permissions: {$role['permissions']}\n";
    }
    
} catch (PDOException $e) {
    echo "❌ DATABASE ERROR: " . $e->getMessage() . "\n";
}
?>