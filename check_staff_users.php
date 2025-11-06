<?php
/**
 * Check what staff users exist in the system
 */

// Database connection
$host = 'localhost';
$dbname = 'school_management';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>Staff Users in System</h2>";
    
    // Get all staff users with their roles
    $stmt = $pdo->prepare("
        SELECT 
            s.id,
            s.name,
            s.email,
            s.employee_id,
            s.is_active,
            r.name as role_name,
            r.id as role_id
        FROM staff s
        LEFT JOIN roles r ON s.role_id = r.id
        WHERE s.is_active = 1
        ORDER BY s.id
    ");
    $stmt->execute();
    $staff_users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background: #f0f0f0;'>";
    echo "<th>ID</th><th>Name</th><th>Email</th><th>Employee ID</th><th>Role Name</th><th>Role ID</th><th>User Type</th>";
    echo "</tr>";
    
    foreach ($staff_users as $user) {
        // Determine user type based on role or other criteria
        $user_type = 'staff'; // Default to staff
        
        // You might need to adjust this logic based on how you determine admin vs staff
        if (in_array($user['role_id'], [1, 2]) || stripos($user['role_name'], 'admin') !== false) {
            $user_type = 'admin';
        }
        
        $bg_color = $user_type === 'admin' ? '#ffe6e6' : '#e6f3ff';
        
        echo "<tr style='background: $bg_color;'>";
        echo "<td>{$user['id']}</td>";
        echo "<td>{$user['name']}</td>";
        echo "<td>{$user['email']}</td>";
        echo "<td>{$user['employee_id']}</td>";
        echo "<td>{$user['role_name']}</td>";
        echo "<td>{$user['role_id']}</td>";
        echo "<td><strong>$user_type</strong></td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "<br><h3>Test Instructions:</h3>";
    echo "<ol>";
    echo "<li>Find a user with 'staff' user type in the table above</li>";
    echo "<li>Login to your application with that user's credentials</li>";
    echo "<li>Get the JWT token from the login response</li>";
    echo "<li>Test the API with that token</li>";
    echo "</ol>";
    
    echo "<h3>Sample Staff Users for Testing:</h3>";
    $staff_only = array_filter($staff_users, function($user) {
        return !in_array($user['role_id'], [1, 2]) && stripos($user['role_name'], 'admin') === false;
    });
    
    if (!empty($staff_only)) {
        echo "<ul>";
        foreach (array_slice($staff_only, 0, 3) as $staff) {
            echo "<li><strong>{$staff['name']}</strong> (ID: {$staff['id']}, Email: {$staff['email']}) - Role: {$staff['role_name']}</li>";
        }
        echo "</ul>";
    } else {
        echo "<p style='color: red;'>No non-admin staff users found. All users appear to be admins.</p>";
    }
    
    // Check auth_tokens table to see what tokens exist
    echo "<br><h3>Recent Auth Tokens:</h3>";
    $stmt = $pdo->prepare("
        SELECT 
            user_id,
            user_type,
            created_at,
            expires_at,
            is_revoked
        FROM auth_tokens 
        WHERE expires_at > NOW() 
        AND is_revoked = 0
        ORDER BY created_at DESC 
        LIMIT 10
    ");
    $stmt->execute();
    $tokens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (!empty($tokens)) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr style='background: #f0f0f0;'>";
        echo "<th>User ID</th><th>User Type</th><th>Created</th><th>Expires</th>";
        echo "</tr>";
        
        foreach ($tokens as $token) {
            $bg_color = $token['user_type'] === 'admin' ? '#ffe6e6' : '#e6f3ff';
            echo "<tr style='background: $bg_color;'>";
            echo "<td>{$token['user_id']}</td>";
            echo "<td><strong>{$token['user_type']}</strong></td>";
            echo "<td>{$token['created_at']}</td>";
            echo "<td>{$token['expires_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
} catch (PDOException $e) {
    echo "Database connection failed: " . $e->getMessage();
    echo "<br><br>";
    echo "<strong>Please update the database connection details in this script:</strong><br>";
    echo "Host: $host<br>";
    echo "Database: $dbname<br>";
    echo "Username: $username<br>";
    echo "Password: " . ($password ? '[hidden]' : '[empty]') . "<br>";
}
?>

<style>
body { font-family: Arial, sans-serif; margin: 20px; }
table { margin: 10px 0; }
th, td { padding: 8px; text-align: left; }
</style>