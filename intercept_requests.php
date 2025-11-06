<?php
// Real-time request interceptor to debug student API calls
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log file path
$logFile = '/Applications/XAMPP/xamppfiles/htdocs/School/api_intercept.log';

// Function to log with timestamp
function logData($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND | LOCK_EX);
}

// Check if this is a student API request
$method = $_SERVER['REQUEST_METHOD'] ?? '';
$uri = $_SERVER['REQUEST_URI'] ?? '';

if (($method === 'POST' || $method === 'PUT') && 
    (strpos($uri, 'students') !== false && strpos($uri, 'upload') === false)) {
    
    logData("=== INTERCEPTED STUDENT REQUEST ===");
    logData("Method: $method");
    logData("URI: $uri");
    logData("Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
    
    // Get raw input
    $rawInput = file_get_contents('php://input');
    logData("Raw input length: " . strlen($rawInput));
    
    // Try to parse JSON
    $jsonData = json_decode($rawInput, true);
    
    if ($jsonData && is_array($jsonData)) {
        logData("=== PARSED JSON DATA ===");
        
        // Focus on the problematic fields
        $targetFields = [
            'student_name' => 'Student Name',
            'student_photo_url' => 'Photo URL', 
            'id_proof_url' => 'ID Proof URL',
            'address_proof_url' => 'Address Proof URL',
            'student_aspirations' => 'Aspirations'
        ];
        
        foreach ($targetFields as $field => $label) {
            if (isset($jsonData[$field])) {
                $value = $jsonData[$field];
                $display = is_string($value) ? "'$value'" : json_encode($value);
                logData("$label ($field): $display");
            } else {
                logData("$label ($field): [FIELD NOT PRESENT]");
            }
        }
        
        logData("=== FULL REQUEST PAYLOAD ===");
        logData(json_encode($jsonData, JSON_PRETTY_PRINT));
        
    } else {
        logData("ERROR: Could not parse JSON data");
        logData("Raw data: " . substr($rawInput, 0, 500));
    }
    
    logData("=== END INTERCEPT ===\n");
}

// Continue normal execution - include the original backend
require_once 'backend/index.php';
?>