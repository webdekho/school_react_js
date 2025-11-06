<?php
// Direct test of student model to verify backend functionality
define('ENVIRONMENT', 'development');

// Include CodeIgniter
require_once 'backend/index.php';

echo "=== Direct Backend Test ===\n\n";

$CI = &get_instance();
$CI->load->model('Student_model');

// Test data that simulates what frontend should send
$test_data = [
    'student_name' => 'Backend Test Student',
    'academic_year_id' => 1,
    'grade_id' => 1,
    'division_id' => 1,
    'roll_number' => 'BACKEND_TEST_' . time(),
    'parent_id' => 1,
    'admission_date' => date('Y-m-d'),
    'total_fees' => 5000.00,
    'student_photo_url' => '/uploads/test_photo_' . time() . '.jpg',
    'id_proof_url' => '/uploads/test_id_proof_' . time() . '.pdf',
    'address_proof_url' => '/uploads/test_address_proof_' . time() . '.pdf',
    'student_aspirations' => 'Backend test: I want to verify that file URLs and aspirations are saved correctly when created through the model.'
];

echo "Testing with data:\n";
echo "- student_photo_url: " . $test_data['student_photo_url'] . "\n";
echo "- id_proof_url: " . $test_data['id_proof_url'] . "\n";
echo "- address_proof_url: " . $test_data['address_proof_url'] . "\n";
echo "- student_aspirations: " . substr($test_data['student_aspirations'], 0, 50) . "...\n\n";

try {
    // Create student
    $student_id = $CI->Student_model->create_student($test_data);
    
    if ($student_id) {
        echo "✓ Student created with ID: $student_id\n\n";
        
        // Retrieve and verify
        $saved_student = $CI->Student_model->get_student_by_id($student_id);
        
        echo "Verification results:\n";
        echo "- student_photo_url: " . ($saved_student['student_photo_url'] ?: '(empty)') . "\n";
        echo "- id_proof_url: " . ($saved_student['id_proof_url'] ?: '(empty)') . "\n";
        echo "- address_proof_url: " . ($saved_student['address_proof_url'] ?: '(empty)') . "\n";
        echo "- student_aspirations: " . ($saved_student['student_aspirations'] ?: '(empty)') . "\n\n";
        
        // Check each field
        $success = true;
        
        if ($saved_student['student_photo_url'] !== $test_data['student_photo_url']) {
            echo "❌ Photo URL mismatch\n";
            $success = false;
        }
        
        if ($saved_student['id_proof_url'] !== $test_data['id_proof_url']) {
            echo "❌ ID Proof URL mismatch\n";
            $success = false;
        }
        
        if ($saved_student['address_proof_url'] !== $test_data['address_proof_url']) {
            echo "❌ Address Proof URL mismatch\n";
            $success = false;
        }
        
        if ($saved_student['student_aspirations'] !== $test_data['student_aspirations']) {
            echo "❌ Student aspirations mismatch\n";
            $success = false;
        }
        
        if ($success) {
            echo "✅ ALL FIELDS SAVED CORRECTLY! Backend is working.\n";
            echo "The issue must be in the frontend data transmission.\n";
        }
        
        // Clean up
        $CI->Student_model->delete_student($student_id);
        echo "\n✓ Test student cleaned up\n";
        
    } else {
        echo "❌ Failed to create student\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
?>