<?php
/**
 * Script to create staff_kids table
 * Run this file once from browser: http://localhost/School/backend/run_staff_kids_table_create.php
 * Or from command line: php run_staff_kids_table_create.php
 */

// Database configuration
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_db';

// Connect to database
$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "Connected successfully to database: $database<br><br>";

// Read and execute SQL file
$sql_file = __DIR__ . '/database/create_staff_kids_table.sql';

if (!file_exists($sql_file)) {
    die("SQL file not found: $sql_file");
}

$sql_content = file_get_contents($sql_file);

// Split SQL commands by semicolon
$sql_commands = array_filter(
    array_map('trim', explode(';', $sql_content)),
    function($cmd) {
        return !empty($cmd) && !preg_match('/^--/', $cmd);
    }
);

echo "<h3>Executing SQL commands...</h3>";

$success_count = 0;
$error_count = 0;

foreach ($sql_commands as $sql) {
    // Skip comments and empty lines
    if (empty(trim($sql)) || preg_match('/^--/', $sql)) {
        continue;
    }
    
    echo "<div style='margin: 10px 0; padding: 10px; background: #f5f5f5; border-left: 3px solid #007bff;'>";
    echo "<strong>Executing:</strong><br>";
    echo "<code>" . htmlspecialchars(substr($sql, 0, 200)) . (strlen($sql) > 200 ? '...' : '') . "</code><br>";
    
    if ($conn->query($sql) === TRUE) {
        echo "<span style='color: green;'>✓ Success</span>";
        $success_count++;
    } else {
        echo "<span style='color: red;'>✗ Error: " . $conn->error . "</span>";
        $error_count++;
    }
    echo "</div>";
}

echo "<br><hr><br>";
echo "<h3>Summary:</h3>";
echo "<p style='color: green;'>✓ Successful queries: $success_count</p>";
echo "<p style='color: red;'>✗ Failed queries: $error_count</p>";

if ($error_count === 0) {
    echo "<p style='color: green; font-weight: bold;'>✓ All updates completed successfully!</p>";
    echo "<p><strong>NOTE:</strong> You can now delete this file (run_staff_kids_table_create.php) as it's no longer needed.</p>";
} else {
    echo "<p style='color: orange;'>⚠ Some queries failed. Please check the errors above and fix manually if needed.</p>";
}

$conn->close();
?>

