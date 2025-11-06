<?php
// Get logs for the debug monitor
header('Content-Type: text/plain');

$logFile = '/Applications/XAMPP/xamppfiles/htdocs/School/api_intercept.log';
$backendLog = '/Applications/XAMPP/xamppfiles/htdocs/School/backend/application/logs/log-' . date('Y-m-d') . '.php';

$output = "";

// Show intercepted requests
if (file_exists($logFile)) {
    $output .= "=== FRONTEND → BACKEND REQUESTS ===\n";
    $output .= file_get_contents($logFile);
    $output .= "\n\n";
}

// Show recent backend logs related to students
if (file_exists($backendLog)) {
    $output .= "=== BACKEND PROCESSING LOGS ===\n";
    $backendContent = file_get_contents($backendLog);
    $lines = explode("\n", $backendContent);
    
    // Get last 100 lines and filter for student-related entries
    $recentLines = array_slice($lines, -100);
    $studentLines = array_filter($recentLines, function($line) {
        return stripos($line, 'student') !== false || 
               stripos($line, 'photo_url') !== false || 
               stripos($line, 'aspirations') !== false ||
               stripos($line, 'Admin::students') !== false;
    });
    
    if (!empty($studentLines)) {
        $output .= implode("\n", $studentLines);
    } else {
        $output .= "No recent student-related log entries found.\n";
    }
}

if (empty($output)) {
    $output = "No logs available yet. Try creating or updating a student.";
}

echo $output;
?>