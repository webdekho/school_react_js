<?php
// Check if student file URLs are being saved
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== Checking Student File URLs ===\n\n";
    
    // Get total students
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM students WHERE is_active = 1");
    $total_students = $stmt->fetch()['total'];
    echo "Total active students: $total_students\n\n";
    
    // Check students with file URLs
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as count_with_photo,
            (SELECT COUNT(*) FROM students WHERE is_active = 1 AND id_proof_url IS NOT NULL AND id_proof_url != '') as count_with_id_proof,
            (SELECT COUNT(*) FROM students WHERE is_active = 1 AND address_proof_url IS NOT NULL AND address_proof_url != '') as count_with_address_proof
        FROM students 
        WHERE is_active = 1 
          AND student_photo_url IS NOT NULL 
          AND student_photo_url != ''
    ");
    $stmt->execute();
    $counts = $stmt->fetch();
    
    echo "Students with files:\n";
    echo "- Photo URLs: " . $counts['count_with_photo'] . "\n";
    echo "- ID Proof URLs: " . $counts['count_with_id_proof'] . "\n";
    echo "- Address Proof URLs: " . $counts['count_with_address_proof'] . "\n\n";
    
    // Show recent students (last 5) with their file URLs
    $stmt = $pdo->prepare("
        SELECT 
            id,
            student_name,
            student_photo_url,
            id_proof_url,
            address_proof_url,
            created_at
        FROM students 
        WHERE is_active = 1
        ORDER BY created_at DESC 
        LIMIT 10
    ");
    $stmt->execute();
    $recent_students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Recent students and their file URLs:\n";
    foreach ($recent_students as $student) {
        echo "Student: " . $student['student_name'] . " (ID: " . $student['id'] . ")\n";
        echo "  Created: " . $student['created_at'] . "\n";
        echo "  Photo URL: " . ($student['student_photo_url'] ?: '(empty)') . "\n";
        echo "  ID Proof URL: " . ($student['id_proof_url'] ?: '(empty)') . "\n";
        echo "  Address Proof URL: " . ($student['address_proof_url'] ?: '(empty)') . "\n";
        echo "  ---\n";
    }
    
    // Check if there are any file uploads in the uploads directory
    $upload_dir = '/Applications/XAMPP/xamppfiles/htdocs/School/backend/uploads/students/';
    if (is_dir($upload_dir)) {
        $files = scandir($upload_dir);
        $file_count = count($files) - 2; // Exclude . and ..
        echo "\nFiles in uploads/students directory: $file_count\n";
        if ($file_count > 0) {
            echo "Recent uploads:\n";
            $files = array_filter($files, function($f) { return $f != '.' && $f != '..'; });
            $files = array_slice($files, -5); // Last 5 files
            foreach ($files as $file) {
                echo "- $file\n";
            }
        }
    } else {
        echo "\nUploads directory doesn't exist: $upload_dir\n";
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}
?>