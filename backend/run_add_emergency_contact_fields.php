<?php
/**
 * Script to add emergency contact name and relationship fields to students table
 * Run this script once to update your database schema
 */

// Database configuration
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management';

// Create connection
$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "Connected to database successfully.\n\n";

// Read SQL file
$sql_file = __DIR__ . '/database/add_emergency_contact_fields.sql';
if (!file_exists($sql_file)) {
    die("SQL file not found: $sql_file\n");
}

$sql = file_get_contents($sql_file);

// Split SQL into individual statements
$statements = array_filter(
    array_map('trim', explode(';', $sql)),
    function($stmt) {
        // Remove comments and empty lines
        $stmt = preg_replace('/--.*$/m', '', $stmt);
        $stmt = trim($stmt);
        return !empty($stmt);
    }
);

echo "Executing SQL statements...\n\n";

$success_count = 0;
$error_count = 0;

foreach ($statements as $statement) {
    // Skip if just a comment
    if (empty(trim($statement))) {
        continue;
    }
    
    echo "Executing: " . substr($statement, 0, 100) . "...\n";
    
    if ($conn->query($statement) === TRUE) {
        echo "✓ Success\n\n";
        $success_count++;
    } else {
        // Check if error is due to column already existing
        if (strpos($conn->error, 'Duplicate column name') !== false) {
            echo "⚠ Column already exists (skipping)\n\n";
        } else {
            echo "✗ Error: " . $conn->error . "\n\n";
            $error_count++;
        }
    }
}

echo "======================================\n";
echo "Summary:\n";
echo "  Successful: $success_count\n";
echo "  Errors: $error_count\n";
echo "======================================\n\n";

if ($error_count === 0) {
    echo "✓ Database schema updated successfully!\n";
} else {
    echo "⚠ Some errors occurred. Please check the output above.\n";
}

$conn->close();
?>

