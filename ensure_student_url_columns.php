<?php
// Script to ensure student URL columns exist
// Run this if the columns are missing

require_once 'backend/application/config/database.php';

$db_config = $db['default'];
$pdo = new PDO(
    "mysql:host={$db_config['hostname']};dbname={$db_config['database']};charset=utf8mb4",
    $db_config['username'],
    $db_config['password']
);

echo "<h2>Ensuring Student URL Columns Exist</h2>";

// Check if columns exist
$stmt = $pdo->query("SHOW COLUMNS FROM students LIKE '%_url'");
$existing_columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

$required_columns = ['student_photo_url', 'id_proof_url', 'address_proof_url'];
$missing_columns = array_diff($required_columns, $existing_columns);

if (empty($missing_columns)) {
    echo "<div style='color: green;'>✓ All URL columns already exist!</div>";
    foreach ($required_columns as $col) {
        echo "<div>- {$col}</div>";
    }
} else {
    echo "<div style='color: orange;'>Adding missing columns...</div>";
    
    foreach ($missing_columns as $column) {
        try {
            $sql = "ALTER TABLE students ADD COLUMN {$column} VARCHAR(255) NULL";
            $pdo->exec($sql);
            echo "<div style='color: green;'>✓ Added column: {$column}</div>";
        } catch (Exception $e) {
            echo "<div style='color: red;'>❌ Failed to add {$column}: " . $e->getMessage() . "</div>";
        }
    }
}

echo "<hr>";
echo "<div>Columns verification complete. You can now test file uploads.</div>";
?>