<?php
// Debug script to test production environment
header('Content-Type: application/json');

$debug_info = [
    'status' => 'success',
    'message' => 'Debug information',
    'data' => [
        'php_version' => phpversion(),
        'environment' => defined('ENVIRONMENT') ? ENVIRONMENT : 'unknown',
        'server_name' => $_SERVER['SERVER_NAME'] ?? 'unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'unknown',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
        'extensions' => [
            'mysqli' => extension_loaded('mysqli'),
            'json' => extension_loaded('json'),
            'curl' => extension_loaded('curl'),
            'openssl' => extension_loaded('openssl')
        ],
        'database_test' => 'pending'
    ]
];

// Test database connection
try {
    $host = 'localhost';
    $username = 'root';
    $password = '';
    $database = 'school_management';
    
    $connection = new mysqli($host, $username, $password, $database);
    
    if ($connection->connect_error) {
        $debug_info['data']['database_test'] = 'failed: ' . $connection->connect_error;
    } else {
        $debug_info['data']['database_test'] = 'success';
        $connection->close();
    }
} catch (Exception $e) {
    $debug_info['data']['database_test'] = 'error: ' . $e->getMessage();
}

echo json_encode($debug_info, JSON_PRETTY_PRINT);
?>