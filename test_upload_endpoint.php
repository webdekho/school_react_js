<?php
// Test the upload endpoint to verify URL format is fixed
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Simulate a file upload with correct data
    echo "Testing file upload endpoint...\n";
    
    // Create a test file for upload
    $test_file_content = "Test file content for student photo";
    $temp_file = tempnam(sys_get_temp_dir(), 'test_student_photo');
    file_put_contents($temp_file, $test_file_content);
    
    // Simulate the upload using curl
    $url = 'http://localhost/School/backend/api/admin/upload_student_document';
    
    $post_data = [
        'document_type' => 'student_photo',
        'file' => new CURLFile($temp_file, 'image/jpeg', 'test_photo.jpg')
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer test_token' // You'll need a real token
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Status: $http_code\n";
    echo "Response: $response\n";
    
    // Clean up
    unlink($temp_file);
    
} else {
    echo "Test file upload functionality\n";
    echo "This endpoint tests the student document upload to verify URL format.\n";
    echo "URL format should be: /uploads/filename.jpg\n";
}
?>