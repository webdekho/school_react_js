<?php
// Check available databases and find the correct one
$host = 'localhost';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get all databases
    $stmt = $pdo->query("SHOW DATABASES");
    $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Available databases:\n";
    foreach ($databases as $db) {
        echo "- $db\n";
    }
    
    // Try to find the school database by checking for school-related tables
    $school_databases = [];
    foreach ($databases as $db) {
        if (strpos(strtolower($db), 'school') !== false) {
            $school_databases[] = $db;
        }
    }
    
    if (!empty($school_databases)) {
        echo "\nPossible school databases:\n";
        foreach ($school_databases as $db) {
            echo "- $db\n";
            
            // Check if this database has students table
            try {
                $pdo->exec("USE `$db`");
                $tables = $pdo->query("SHOW TABLES LIKE 'students'")->fetchAll();
                if (!empty($tables)) {
                    echo "  → Has students table!\n";
                    
                    // Check columns in students table
                    $columns = $pdo->query("SHOW COLUMNS FROM students")->fetchAll(PDO::FETCH_ASSOC);
                    $has_photo_url = false;
                    $has_id_proof_url = false;
                    $has_address_proof_url = false;
                    
                    foreach ($columns as $col) {
                        if ($col['Field'] === 'student_photo_url') $has_photo_url = true;
                        if ($col['Field'] === 'id_proof_url') $has_id_proof_url = true;
                        if ($col['Field'] === 'address_proof_url') $has_address_proof_url = true;
                    }
                    
                    echo "  → File URL columns: ";
                    echo "student_photo_url=" . ($has_photo_url ? 'YES' : 'NO') . ", ";
                    echo "id_proof_url=" . ($has_id_proof_url ? 'YES' : 'NO') . ", ";
                    echo "address_proof_url=" . ($has_address_proof_url ? 'YES' : 'NO') . "\n";
                    
                    if (!$has_photo_url || !$has_id_proof_url || !$has_address_proof_url) {
                        echo "  → MISSING FILE URL COLUMNS - THIS IS THE PROBLEM!\n";
                    }
                }
            } catch (Exception $e) {
                echo "  → Error checking: " . $e->getMessage() . "\n";
            }
        }
    }
    
} catch (PDOException $e) {
    echo "Database connection failed: " . $e->getMessage() . "\n";
}
?>