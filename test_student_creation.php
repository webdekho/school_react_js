<?php
// Test student creation with file URLs and aspirations
define('ENVIRONMENT', 'development');
require_once 'backend/index.php';

// Simulate creating a student with file URLs and aspirations
$CI = &get_instance();
$CI->load->model('Student_model');

echo "=== Testing Student Creation with Files and Aspirations ===\n\n";

// Test data that simulates what frontend should send
$test_data = [
    'student_name' => 'Test Student for File URLs',
    'academic_year_id' => 1,
    'grade_id' => 1,
    'division_id' => 1,
    'roll_number' => 'TEST001',
    'parent_id' => 1,
    'admission_date' => date('Y-m-d'),
    'total_fees' => 5000.00,
    'student_photo_url' => 'backend/uploads/student_photos/test_photo.jpg',
    'id_proof_url' => 'backend/uploads/student_id_proofs/test_id_proof.pdf',
    'address_proof_url' => 'backend/uploads/student_address_proofs/test_address_proof.pdf',
    'student_aspirations' => 'I want to become a software engineer and help build innovative technology solutions for education.'
];

echo "Test data to insert:\n";
foreach (['student_photo_url', 'id_proof_url', 'address_proof_url', 'student_aspirations'] as $field) {
    echo "  $field: " . ($test_data[$field] ?: '(empty)') . "\n";
}
echo "\n";

try {
    // Test creation
    $student_id = $CI->Student_model->create_student($test_data);
    
    if ($student_id) {
        echo "✓ Student created successfully with ID: $student_id\n\n";
        
        // Verify the data was saved correctly
        $saved_student = $CI->Student_model->get_student_by_id($student_id);
        
        echo "Verification - Data saved in database:\n";
        echo "  student_photo_url: " . ($saved_student['student_photo_url'] ?: '(empty)') . "\n";
        echo "  id_proof_url: " . ($saved_student['id_proof_url'] ?: '(empty)') . "\n";
        echo "  address_proof_url: " . ($saved_student['address_proof_url'] ?: '(empty)') . "\n";
        echo "  student_aspirations: " . ($saved_student['student_aspirations'] ?: '(empty)') . "\n";
        
        // Test if the issue is with creation or retrieval
        if (!$saved_student['student_photo_url'] || !$saved_student['student_aspirations']) {
            echo "\n✗ PROBLEM FOUND: Data not saved correctly!\n";
            
            // Check what actually got inserted with raw query
            $raw_query = "SELECT student_photo_url, id_proof_url, address_proof_url, student_aspirations FROM students WHERE id = $student_id";
            $raw_result = $CI->db->query($raw_query)->row_array();
            
            echo "\nRaw database query result:\n";
            echo "  student_photo_url: " . ($raw_result['student_photo_url'] ?: '(NULL)') . "\n";
            echo "  id_proof_url: " . ($raw_result['id_proof_url'] ?: '(NULL)') . "\n";
            echo "  address_proof_url: " . ($raw_result['address_proof_url'] ?: '(NULL)') . "\n";
            echo "  student_aspirations: " . ($raw_result['student_aspirations'] ?: '(NULL)') . "\n";
        } else {
            echo "\n✓ SUCCESS: All data saved correctly!\n";
        }
        
        // Clean up test student
        $CI->Student_model->delete_student($student_id);
        echo "\nTest student removed.\n";
        
    } else {
        echo "✗ Failed to create student\n";
    }
    
} catch (Exception $e) {
    echo "✗ Error during test: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
?>