<?php
/**
 * Script to add fee_category_id column to fee_collections table
 * Run this once to update the database schema
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

echo "Connected successfully to database: $database\n\n";

// Read the SQL file
$sql_file = __DIR__ . '/database/alter_fee_collections_table.sql';
$sql = file_get_contents($sql_file);

if ($sql === false) {
    die("Error reading SQL file: $sql_file\n");
}

// Split SQL into individual statements
$statements = array_filter(
    array_map('trim', 
    preg_split('/;(\s*--.*)?$/m', $sql, -1, PREG_SPLIT_NO_EMPTY))
);

$success_count = 0;
$error_count = 0;

echo "Executing ALTER queries...\n\n";

foreach ($statements as $index => $statement) {
    // Skip comments and empty statements
    if (empty($statement) || strpos(trim($statement), '--') === 0) {
        continue;
    }
    
    echo "Statement " . ($index + 1) . ":\n";
    echo substr($statement, 0, 100) . "...\n";
    
    if ($conn->query($statement) === TRUE) {
        echo "✓ Success\n\n";
        $success_count++;
    } else {
        // Check if error is because column already exists
        if (strpos($conn->error, 'Duplicate column name') !== false) {
            echo "⚠ Column already exists (skipped)\n\n";
            $success_count++;
        } else {
            echo "✗ Error: " . $conn->error . "\n\n";
            $error_count++;
        }
    }
}

echo "\n========================================\n";
echo "Execution Summary:\n";
echo "Successful: $success_count\n";
echo "Errors: $error_count\n";
echo "========================================\n";

if ($error_count === 0) {
    echo "\n✓ All updates completed successfully!\n";
    echo "The fee_category_id column has been added to the fee_collections table.\n";
} else {
    echo "\n⚠ Some updates failed. Please review the errors above.\n";
}

$conn->close();
?>

