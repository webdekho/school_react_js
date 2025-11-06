<?php
// Simple test to create a student with file URLs and aspirations
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== Testing Student Creation with Hardcoded Data ===\n\n";

// Test via HTTP POST with actual data
$student_data = [
    'student_name' => 'Test Student with Files and Aspirations',
    'academic_year_id' => 1,
    'grade_id' => 1,
    'division_id' => 1,
    'roll_number' => 'TEST_' . time(),
    'parent_id' => 1,
    'admission_date' => date('Y-m-d'),
    'total_fees' => 5000.00,
    'residential_address' => 'Test Address',
    'pincode' => '123456',
    'sam_samagrah_id' => 'TEST123',
    'aapar_id' => 'AAPAR123',
    'emergency_contact_number' => '9999999999',
    'gender' => 'Male',
    'travel_mode' => 'School Bus',
    'vehicle_number' => '',
    'parent_or_staff_name' => '',
    'verified_tts_id' => '',
    'allergies' => '[]',
    'diabetic' => '0',
    'lifestyle_diseases' => '',
    'asthmatic' => '0',
    'phobia' => '0',
    'doctor_name' => 'Dr. Test',
    'doctor_contact' => '8888888888',
    'clinic_address' => 'Test Clinic',
    'blood_group' => 'O+',
    // The crucial fields that are not working
    'student_photo_url' => '/uploads/test_photo_' . time() . '.jpg',
    'id_proof_url' => '/uploads/test_id_proof_' . time() . '.pdf',
    'address_proof_url' => '/uploads/test_address_proof_' . time() . '.pdf',
    'student_aspirations' => 'This is a test aspiration to verify that the student aspirations field is working correctly.'
];

echo "Sending POST request to create student...\n";
echo "File URLs being sent:\n";
echo "- Photo: " . $student_data['student_photo_url'] . "\n";
echo "- ID Proof: " . $student_data['id_proof_url'] . "\n";
echo "- Address Proof: " . $student_data['address_proof_url'] . "\n";
echo "- Aspirations: " . substr($student_data['student_aspirations'], 0, 50) . "...\n\n";

$url = 'http://localhost/School/backend/api/admin/students';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($student_data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzY2hvb2xfbWFuYWdlbWVudF9zeXN0ZW0iLCJhdWQiOiJzY2hvb2xfdXNlcnMiLCJpYXQiOjE3NjIyNDg5NjksImV4cCI6MTc2MjI1NjE2OSwidXNlcl9pZCI6IjEiLCJ1c2VyX3R5cGUiOiJhZG1pbiIsInJvbGVfaWQiOiIxIn0.44Jkdke6JZ3CLUg8dI6eKsOUGDW-nCPk8V9fbceGNjw'
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Status: $http_code\n";
if ($error) {
    echo "CURL Error: $error\n";
}
echo "Response: $response\n\n";

$response_data = json_decode($response, true);
$student_id = $response_data['data']['id'] ?? null;

if ($student_id) {
    echo "✓ Student created successfully with ID: $student_id\n\n";
    
    // Verify the data was saved
    echo "Verifying data in database...\n";
    
    try {
        $pdo = new PDO("mysql:host=localhost;dbname=school_management", 'root', '');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $pdo->prepare("
            SELECT 
                student_name,
                student_photo_url,
                id_proof_url,
                address_proof_url,
                student_aspirations
            FROM students 
            WHERE id = ?
        ");
        $stmt->execute([$student_id]);
        $saved_data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($saved_data) {
            echo "Data saved in database:\n";
            echo "- Name: " . $saved_data['student_name'] . "\n";
            echo "- Photo URL: " . ($saved_data['student_photo_url'] ?: '(empty)') . "\n";
            echo "- ID Proof URL: " . ($saved_data['id_proof_url'] ?: '(empty)') . "\n";
            echo "- Address Proof URL: " . ($saved_data['address_proof_url'] ?: '(empty)') . "\n";
            echo "- Aspirations: " . ($saved_data['student_aspirations'] ?: '(empty)') . "\n\n";
            
            // Check if data matches what we sent
            $all_correct = true;
            if ($saved_data['student_photo_url'] !== $student_data['student_photo_url']) {
                echo "❌ Photo URL not saved correctly\n";
                $all_correct = false;
            }
            if ($saved_data['id_proof_url'] !== $student_data['id_proof_url']) {
                echo "❌ ID Proof URL not saved correctly\n";
                $all_correct = false;
            }
            if ($saved_data['address_proof_url'] !== $student_data['address_proof_url']) {
                echo "❌ Address Proof URL not saved correctly\n";
                $all_correct = false;
            }
            if ($saved_data['student_aspirations'] !== $student_data['student_aspirations']) {
                echo "❌ Student aspirations not saved correctly\n";
                $all_correct = false;
            }
            
            if ($all_correct) {
                echo "✅ ALL DATA SAVED CORRECTLY!\n";
                echo "The backend API is working perfectly.\n";
                echo "The issue is definitely in the frontend data preparation.\n";
            }
            
            // Clean up
            $pdo->prepare("DELETE FROM students WHERE id = ?")->execute([$student_id]);
            echo "\nTest student cleaned up.\n";
            
        } else {
            echo "❌ Student record not found in database\n";
        }
        
    } catch (PDOException $e) {
        echo "Database error: " . $e->getMessage() . "\n";
    }
    
} else {
    echo "❌ Student creation failed\n";
    echo "Response details: $response\n";
}

echo "\n=== Test Complete ===\n";
?>