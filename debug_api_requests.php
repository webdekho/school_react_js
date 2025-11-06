<?php
// Debug API requests to see what data is actually being sent from frontend
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log all POST requests to students endpoint
$logFile = '/Applications/XAMPP/xamppfiles/htdocs/School/api_debug.log';

// Check if this is a POST/PUT request to students endpoint
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? '';
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (($requestMethod === 'POST' || $requestMethod === 'PUT') && 
    (strpos($requestUri, '/api/admin/students') !== false || 
     strpos($requestUri, '/students') !== false)) {
    
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'method' => $requestMethod,
        'uri' => $requestUri,
        'content_type' => $contentType,
        'raw_input' => file_get_contents('php://input'),
        'post_data' => $_POST,
        'files' => $_FILES,
        'headers' => getallheaders()
    ];
    
    // Parse JSON input if applicable
    if (strpos($contentType, 'application/json') !== false) {
        $jsonData = json_decode($logEntry['raw_input'], true);
        $logEntry['json_data'] = $jsonData;
        
        // Check specifically for our fields
        if ($jsonData && is_array($jsonData)) {
            $logEntry['contains_file_urls'] = [
                'student_photo_url' => isset($jsonData['student_photo_url']) ? $jsonData['student_photo_url'] : 'NOT_SET',
                'id_proof_url' => isset($jsonData['id_proof_url']) ? $jsonData['id_proof_url'] : 'NOT_SET',
                'address_proof_url' => isset($jsonData['address_proof_url']) ? $jsonData['address_proof_url'] : 'NOT_SET',
                'student_aspirations' => isset($jsonData['student_aspirations']) ? $jsonData['student_aspirations'] : 'NOT_SET'
            ];
        }
    }
    
    // Write to log file
    file_put_contents($logFile, "=== API REQUEST DEBUG ===\n" . json_encode($logEntry, JSON_PRETTY_PRINT) . "\n\n", FILE_APPEND | LOCK_EX);
    
    // Also echo for immediate debugging (remove in production)
    echo "<!-- DEBUG: API request logged at " . date('Y-m-d H:i:s') . " -->\n";
}

// Include the original index.php
require_once 'backend/index.php';
?>