<?php
// Test script to check announcements table structure
require_once 'backend/application/config/database.php';

$mysqli = new mysqli($db['default']['hostname'], $db['default']['username'], $db['default']['password'], $db['default']['database']);

if ($mysqli->connect_error) {
    die('Connection failed: ' . $mysqli->connect_error);
}

echo "=== ANNOUNCEMENTS TABLE STRUCTURE ===\n";
$result = $mysqli->query("DESCRIBE announcements");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        echo $row['Field'] . ' - ' . $row['Type'] . ' - ' . $row['Null'] . ' - ' . $row['Default'] . "\n";
    }
} else {
    echo 'Error: ' . $mysqli->error . "\n";
}

$mysqli->close();
?>
