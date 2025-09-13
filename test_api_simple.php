<?php
// Simple test for the optional fees API without authentication
header('Content-Type: application/json');

// Simulate the database query that the API would run
$host = 'localhost';
$dbname = 'school_management';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $student_id = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 1;
    $grade_id = isset($_GET['grade_id']) ? (int)$_GET['grade_id'] : 1;
    $division_id = isset($_GET['division_id']) ? (int)$_GET['division_id'] : 1;
    
    // Get all optional fee structures applicable to this student
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
    
    // Get already assigned fee structures for this student
    $stmt = $pdo->prepare("
        SELECT fee_structure_id 
        FROM student_fee_assignments 
        WHERE student_id = ? 
        AND is_active = 1 
        AND status != 'cancelled'
    ");
    $stmt->execute([$student_id]);
    $assigned_fee_structure_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Filter out already assigned fees
    $available_fees = array_filter($all_optional_fees, function($fee) use ($assigned_fee_structure_ids) {
        return !in_array($fee['id'], $assigned_fee_structure_ids);
    });
    
    $response = [
        'status' => 'success',
        'data' => array_values($available_fees),
        'total' => count($available_fees),
        'debug' => [
            'student_id' => $student_id,
            'grade_id' => $grade_id,
            'division_id' => $division_id,
            'all_optional_fees_count' => count($all_optional_fees),
            'assigned_fees_count' => count($assigned_fee_structure_ids),
            'available_fees_count' => count($available_fees)
        ]
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage(),
        'error_code' => 500
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Error: ' . $e->getMessage(),
        'error_code' => 500
    ], JSON_PRETTY_PRINT);
}
?>
