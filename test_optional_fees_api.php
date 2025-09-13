<?php
// Test script for optional fees API
require_once 'backend/application/config/database.php';

// Database connection
$host = 'localhost';
$dbname = 'school_management';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Database connection successful!\n\n";
    
    // Test 1: Check if fee_structures table has optional fees
    echo "=== Test 1: Check optional fee structures ===\n";
    $stmt = $pdo->query("
        SELECT fs.id, fs.amount, fs.is_mandatory, fc.name as category_name 
        FROM fee_structures fs 
        JOIN fee_categories fc ON fs.fee_category_id = fc.id 
        WHERE fs.is_mandatory = 0 AND fs.is_active = 1 
        LIMIT 5
    ");
    $optional_fees = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($optional_fees) > 0) {
        echo "Found " . count($optional_fees) . " optional fee structures:\n";
        foreach ($optional_fees as $fee) {
            echo "- ID: {$fee['id']}, Category: {$fee['category_name']}, Amount: {$fee['amount']}, Mandatory: {$fee['is_mandatory']}\n";
        }
    } else {
        echo "No optional fee structures found. Creating sample data...\n";
        
        // Create sample optional fee structures
        $sample_fees = [
            ['Transport Fee', 800.00],
            ['Sports Fee', 300.00],
            ['Computer Lab Fee', 600.00],
            ['Uniform Fee', 1200.00],
            ['Development Fee', 500.00]
        ];
        
        foreach ($sample_fees as $fee) {
            $stmt = $pdo->prepare("
                INSERT INTO fee_structures (academic_year_id, grade_id, division_id, fee_category_id, amount, is_mandatory, is_active, created_at, updated_at) 
                VALUES (1, NULL, NULL, (SELECT id FROM fee_categories WHERE name = ? LIMIT 1), ?, 0, 1, NOW(), NOW())
            ");
            $stmt->execute([$fee[0], $fee[1]]);
        }
        
        echo "Sample optional fee structures created!\n";
    }
    
    echo "\n";
    
    // Test 2: Check student_fee_assignments table structure
    echo "=== Test 2: Check student_fee_assignments table structure ===\n";
    $stmt = $pdo->query("DESCRIBE student_fee_assignments");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "student_fee_assignments table columns:\n";
    foreach ($columns as $column) {
        echo "- {$column['Field']} ({$column['Type']})\n";
    }
    
    echo "\n";
    
    // Test 3: Check if student exists
    echo "=== Test 3: Check student data ===\n";
    $stmt = $pdo->query("SELECT id, student_name, grade_id, division_id FROM students LIMIT 3");
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($students) > 0) {
        echo "Found students:\n";
        foreach ($students as $student) {
            echo "- ID: {$student['id']}, Name: {$student['student_name']}, Grade: {$student['grade_id']}, Division: {$student['division_id']}\n";
        }
    } else {
        echo "No students found in database.\n";
    }
    
    echo "\n";
    
    // Test 4: Simulate the optional fees query
    echo "=== Test 4: Simulate optional fees query ===\n";
    $student_id = 1;
    $grade_id = 1;
    $division_id = 1;
    
    $stmt = $pdo->prepare("
        SELECT fs.*, fc.name as category_name, fc.description as category_description
        FROM fee_structures fs
        JOIN fee_categories fc ON fs.fee_category_id = fc.id
        WHERE fs.is_mandatory = 0 
        AND fs.is_active = 1
        AND (
            (fs.grade_id = ? AND fs.division_id = ?) OR
            (fs.grade_id = ? AND fs.division_id IS NULL) OR
            (fs.grade_id IS NULL AND fs.division_id IS NULL)
        )
        ORDER BY fc.name, fs.amount
    ");
    $stmt->execute([$grade_id, $division_id, $grade_id]);
    $all_optional_fees = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($all_optional_fees) . " optional fee structures for grade $grade_id, division $division_id:\n";
    foreach ($all_optional_fees as $fee) {
        echo "- ID: {$fee['id']}, Category: {$fee['category_name']}, Amount: {$fee['amount']}\n";
    }
    
    echo "\n";
    
    // Test 5: Check assigned fees
    echo "=== Test 5: Check assigned fees for student $student_id ===\n";
    $stmt = $pdo->prepare("
        SELECT fee_structure_id 
        FROM student_fee_assignments 
        WHERE student_id = ? 
        AND is_active = 1 
        AND status != 'cancelled'
    ");
    $stmt->execute([$student_id]);
    $assigned_fees = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Found " . count($assigned_fees) . " assigned fees for student $student_id:\n";
    foreach ($assigned_fees as $fee_id) {
        echo "- Fee Structure ID: $fee_id\n";
    }
    
    echo "\n";
    
    // Test 6: Final result
    echo "=== Test 6: Available optional fees ===\n";
    $available_fees = array_filter($all_optional_fees, function($fee) use ($assigned_fees) {
        return !in_array($fee['id'], $assigned_fees);
    });
    
    echo "Available optional fees for student $student_id:\n";
    if (count($available_fees) > 0) {
        foreach ($available_fees as $fee) {
            echo "- ID: {$fee['id']}, Category: {$fee['category_name']}, Amount: {$fee['amount']}\n";
        }
    } else {
        echo "No available optional fees found.\n";
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
