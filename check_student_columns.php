<?php
// Check if student file URL columns exist in database
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management_system';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check specific columns
    $stmt = $pdo->prepare("
        SELECT 
            COLUMN_NAME, 
            COLUMN_TYPE, 
            IS_NULLABLE, 
            COLUMN_DEFAULT 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'students'
            AND COLUMN_NAME IN ('student_photo_url', 'id_proof_url', 'address_proof_url')
        ORDER BY ORDINAL_POSITION
    ");
    
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "=== Student File URL Columns ===\n";
    if (empty($columns)) {
        echo "ERROR: File URL columns don't exist in students table!\n";
        echo "You need to run the database migration to add these columns.\n\n";
        
        // Show what columns do exist
        $stmt2 = $pdo->prepare("SHOW COLUMNS FROM students");
        $stmt2->execute();
        $all_columns = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        
        echo "Existing columns in students table:\n";
        foreach ($all_columns as $col) {
            echo "- " . $col['Field'] . " (" . $col['Type'] . ")\n";
        }
    } else {
        echo "Found " . count($columns) . " file URL columns:\n";
        foreach ($columns as $col) {
            echo "- " . $col['COLUMN_NAME'] . " (" . $col['COLUMN_TYPE'] . ")\n";
        }
        
        // Test if any student records have these URLs set
        $stmt3 = $pdo->prepare("
            SELECT 
                id, 
                student_name,
                student_photo_url,
                id_proof_url,
                address_proof_url
            FROM students 
            WHERE student_photo_url IS NOT NULL 
               OR id_proof_url IS NOT NULL 
               OR address_proof_url IS NOT NULL
            LIMIT 5
        ");
        $stmt3->execute();
        $students_with_urls = $stmt3->fetchAll(PDO::FETCH_ASSOC);
        
        echo "\nStudents with file URLs:\n";
        if (empty($students_with_urls)) {
            echo "No students have file URLs set in database.\n";
        } else {
            foreach ($students_with_urls as $student) {
                echo "- Student: " . $student['student_name'] . "\n";
                echo "  Photo: " . ($student['student_photo_url'] ?: 'NULL') . "\n";
                echo "  ID Proof: " . ($student['id_proof_url'] ?: 'NULL') . "\n";
                echo "  Address Proof: " . ($student['address_proof_url'] ?: 'NULL') . "\n\n";
            }
        }
    }
    
} catch (PDOException $e) {
    echo "Database connection failed: " . $e->getMessage() . "\n";
}
?>