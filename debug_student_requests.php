<?php
// Real-time debugging script to capture student API requests
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log file
$logFile = '/Applications/XAMPP/xamppfiles/htdocs/School/student_api_debug.log';

// Function to log data
function debugLog($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND | LOCK_EX);
}

// Check if this is a student API request
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? '';

if (($requestMethod === 'POST' || $requestMethod === 'PUT') && 
    (strpos($requestUri, '/api/admin/students') !== false || 
     strpos($requestUri, '/api/staff/students') !== false)) {
    
    debugLog("=== STUDENT API REQUEST INTERCEPTED ===");
    debugLog("Method: $requestMethod");
    debugLog("URI: $requestUri");
    debugLog("Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'Not set'));
    
    // Capture raw input
    $rawInput = file_get_contents('php://input');
    debugLog("Raw Input Length: " . strlen($rawInput));
    
    // Parse JSON data
    $jsonData = json_decode($rawInput, true);
    
    if ($jsonData && is_array($jsonData)) {
        debugLog("=== PARSED JSON DATA ===");
        
        // Check specifically for our problematic fields
        $checkFields = [
            'student_photo_url',
            'id_proof_url', 
            'address_proof_url',
            'student_aspirations',
            'student_name'
        ];
        
        foreach ($checkFields as $field) {
            $value = isset($jsonData[$field]) ? $jsonData[$field] : 'FIELD_NOT_PRESENT';
            debugLog("$field: " . (is_string($value) ? "'{$value}'" : json_encode($value)));
        }
        
        // Log full data structure for debugging
        debugLog("=== FULL JSON DATA ===");
        debugLog(json_encode($jsonData, JSON_PRETTY_PRINT));
        
    } else {
        debugLog("ERROR: Failed to parse JSON data");
        debugLog("Raw input: " . substr($rawInput, 0, 1000) . (strlen($rawInput) > 1000 ? '...' : ''));
    }
    
    debugLog("=== END REQUEST DEBUG ===\n");
}

// Continue with normal execution
?><!DOCTYPE html>
<html>
<head>
    <title>Student API Debug Monitor</title>
    <style>
        body { font-family: monospace; margin: 20px; }
        .log { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .refresh { margin: 10px 0; }
    </style>
</head>
<body>
    <h2>Student API Debug Monitor</h2>
    <p>This page intercepts and logs all student create/update API requests.</p>
    
    <div class="refresh">
        <button onclick="location.reload()">Refresh Logs</button>
        <button onclick="clearLogs()">Clear Logs</button>
    </div>
    
    <div id="logs">
        <h3>Recent Logs:</h3>
        <div class="log">
            <?php
            if (file_exists($logFile)) {
                $logs = file_get_contents($logFile);
                echo "<pre>" . htmlspecialchars(substr($logs, -5000)) . "</pre>"; // Last 5KB
            } else {
                echo "No logs yet. Make a student create/update request to see logs here.";
            }
            ?>
        </div>
    </div>
    
    <script>
        function clearLogs() {
            if (confirm('Clear all logs?')) {
                fetch('', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    body: 'action=clear_logs'
                }).then(() => location.reload());
            }
        }
        
        // Auto-refresh every 5 seconds
        setInterval(() => {
            fetch('', {method: 'GET'})
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const newLogs = doc.getElementById('logs');
                    if (newLogs) {
                        document.getElementById('logs').innerHTML = newLogs.innerHTML;
                    }
                });
        }, 5000);
    </script>
</body>
</html>

<?php
// Handle clear logs action
if ($_POST['action'] ?? '' === 'clear_logs') {
    file_put_contents($logFile, '');
    echo "Logs cleared";
    exit;
}
?>