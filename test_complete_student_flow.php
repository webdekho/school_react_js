<?php
// Test the complete student creation flow including file uploads
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== Testing Complete Student Creation Flow ===\n\n";

// Step 1: Test file upload endpoint to get URLs
echo "Step 1: Testing file upload endpoint...\n";

// Create a test image file
$test_image_data = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
$temp_image = tempnam(sys_get_temp_dir(), 'test_student_photo') . '.png';
file_put_contents($temp_image, $test_image_data);

// Test the upload endpoint via HTTP
$upload_url = 'http://localhost/School/backend/api/admin/upload_student_document';

// Create a POST request
$post_data = [
    'document_type' => 'student_photo',
    'file' => new CURLFile($temp_image, 'image/png', 'test_photo.png')
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $upload_url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzY2hvb2wtbWFuYWdlbWVudCIsImlhdCI6MTczMDcxNDk4MCwiZXhwIjoxNzMwNzE4NTgwLCJ1c2VyX2lkIjoxLCJ1c2VyX3R5cGUiOiJhZG1pbiIsInJvbGVfaWQiOjEsInBlcm1pc3Npb25zIjoiKiJ9.rNSR44dpPH2Hv4Y5xANcWJNHmEHJq9jGNUkjWzPBX4I'
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "Upload HTTP Status: $http_code\n";
if ($error) {
    echo "CURL Error: $error\n";
}
echo "Upload Response: $response\n\n";

// Parse response to get file URL
$upload_data = json_decode($response, true);
$file_url = $upload_data['data']['url'] ?? null;

if ($file_url) {
    echo "✓ File uploaded successfully, URL: $file_url\n\n";
    
    // Step 2: Test student creation with the file URL
    echo "Step 2: Testing student creation with file URL...\n";
    
    $student_data = [
        'student_name' => 'Test Student with File Upload',
        'academic_year_id' => 1,
        'grade_id' => 1,
        'division_id' => 1,
        'roll_number' => 'TEST_FILE_' . time(),
        'parent_id' => 1,
        'admission_date' => date('Y-m-d'),
        'total_fees' => 5000.00,
        'student_photo_url' => $file_url, // Use the uploaded file URL
        'id_proof_url' => '',
        'address_proof_url' => '',
        'student_aspirations' => 'I want to test if file uploads and aspirations work correctly in the student management system.'
    ];
    
    $student_url = 'http://localhost/School/backend/api/admin/students';
    
    $ch2 = curl_init();
    curl_setopt($ch2, CURLOPT_URL, $student_url);
    curl_setopt($ch2, CURLOPT_POST, true);
    curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode($student_data));
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch2, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzY2hvb2wtbWFuYWdlbWVudCIsImlhdCI6MTczMDcxNDk4MCwiZXhwIjoxNzMwNzE4NTgwLCJ1c2VyX2lkIjoxLCJ1c2VyX3R5cGUiOiJhZG1pbiIsInJvbGVfaWQiOjEsInBlcm1pc3Npb25zIjoiKiJ9.rNSR44dpPH2Hv4Y5xANcWJNHmEHJq9jGNUkjWzPBX4I'
    ]);
    
    $student_response = curl_exec($ch2);
    $student_http_code = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
    $student_error = curl_error($ch2);
    curl_close($ch2);
    
    echo "Student Creation HTTP Status: $student_http_code\n";
    if ($student_error) {
        echo "CURL Error: $student_error\n";
    }
    echo "Student Creation Response: $student_response\n\n";
    
    // Parse response to get student ID
    $student_response_data = json_decode($student_response, true);
    $student_id = $student_response_data['data']['id'] ?? null;
    
    if ($student_id) {
        echo "✓ Student created successfully with ID: $student_id\n\n";
        
        // Step 3: Verify the data was saved correctly
        echo "Step 3: Verifying data was saved correctly...\n";
        
        // Connect to database and check
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
                echo "✓ Student record found in database:\n";
                echo "  Name: " . $saved_data['student_name'] . "\n";
                echo "  Photo URL: " . ($saved_data['student_photo_url'] ?: '(empty)') . "\n";
                echo "  ID Proof URL: " . ($saved_data['id_proof_url'] ?: '(empty)') . "\n";
                echo "  Address Proof URL: " . ($saved_data['address_proof_url'] ?: '(empty)') . "\n";
                echo "  Aspirations: " . ($saved_data['student_aspirations'] ?: '(empty)') . "\n\n";
                
                // Check if file URL matches what we sent
                if ($saved_data['student_photo_url'] === $file_url) {
                    echo "✅ SUCCESS: File URL saved correctly!\n";
                } else {
                    echo "❌ FAILURE: File URL not saved correctly\n";
                    echo "   Expected: $file_url\n";
                    echo "   Actual: " . ($saved_data['student_photo_url'] ?: '(empty)') . "\n";
                }
                
                // Check if aspirations saved correctly
                if ($saved_data['student_aspirations'] === $student_data['student_aspirations']) {
                    echo "✅ SUCCESS: Student aspirations saved correctly!\n";
                } else {
                    echo "❌ FAILURE: Student aspirations not saved correctly\n";
                    echo "   Expected: " . $student_data['student_aspirations'] . "\n";
                    echo "   Actual: " . ($saved_data['student_aspirations'] ?: '(empty)') . "\n";
                }
                
                // Clean up - delete test student
                $pdo->prepare("DELETE FROM students WHERE id = ?")->execute([$student_id]);
                echo "\n✓ Test student cleaned up\n";
                
            } else {
                echo "❌ FAILURE: Student record not found in database\n";
            }
            
        } catch (PDOException $e) {
            echo "❌ Database error: " . $e->getMessage() . "\n";
        }
        
    } else {
        echo "❌ FAILURE: Student creation failed\n";
    }
    
} else {
    echo "❌ FAILURE: File upload failed\n";
}

// Clean up temp file
unlink($temp_image);

echo "\n=== Test Complete ===\n";
?>