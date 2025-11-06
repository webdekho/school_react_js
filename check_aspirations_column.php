<?php
// Check if student aspirations column exists
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check for student_aspirations column specifically
    $stmt = $pdo->prepare("
        SELECT 
            COLUMN_NAME, 
            COLUMN_TYPE, 
            IS_NULLABLE, 
            COLUMN_DEFAULT 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'students'
            AND COLUMN_NAME = 'student_aspirations'
    ");
    
    $stmt->execute();
    $column = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($column) {
        echo "✓ student_aspirations column exists:\n";
        echo "  Type: " . $column['COLUMN_TYPE'] . "\n";
        echo "  Nullable: " . $column['IS_NULLABLE'] . "\n";
        echo "  Default: " . ($column['COLUMN_DEFAULT'] ?: 'NULL') . "\n\n";
        
        // Check if any students have aspirations set
        $stmt2 = $pdo->prepare("
            SELECT 
                COUNT(*) as total_students,
                COUNT(student_aspirations) as students_with_aspirations,
                SUM(CASE WHEN student_aspirations IS NOT NULL AND student_aspirations != '' THEN 1 ELSE 0 END) as students_with_non_empty_aspirations
            FROM students 
            WHERE is_active = 1
        ");
        $stmt2->execute();
        $stats = $stmt2->fetch(PDO::FETCH_ASSOC);
        
        echo "Student aspirations data:\n";
        echo "  Total active students: " . $stats['total_students'] . "\n";
        echo "  Students with aspirations (not NULL): " . $stats['students_with_aspirations'] . "\n";
        echo "  Students with non-empty aspirations: " . $stats['students_with_non_empty_aspirations'] . "\n\n";
        
        // Show recent students with their aspirations
        $stmt3 = $pdo->prepare("
            SELECT 
                id,
                student_name,
                student_aspirations,
                created_at
            FROM students 
            WHERE is_active = 1
            ORDER BY created_at DESC 
            LIMIT 5
        ");
        $stmt3->execute();
        $recent_students = $stmt3->fetchAll(PDO::FETCH_ASSOC);
        
        echo "Recent students and their aspirations:\n";
        foreach ($recent_students as $student) {
            echo "- " . $student['student_name'] . " (ID: " . $student['id'] . ")\n";
            echo "  Aspirations: " . ($student['student_aspirations'] ?: '(empty)') . "\n";
            echo "  Created: " . $student['created_at'] . "\n\n";
        }
    } else {
        echo "✗ student_aspirations column does NOT exist in students table!\n";
        echo "This is the problem - the column needs to be added to the database.\n";
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}
?>