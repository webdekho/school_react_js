<?php
defined('BASEPATH') OR exit('No direct script access allowed');

// For API requests, return JSON
if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false || 
    (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/api/') !== false)) {
    header('Content-Type: application/json');
    
    // Get more detailed error information
    $error_details = [
        'status' => 'error',
        'message' => 'Database error occurred',
        'error_code' => 500
    ];
    
    // Add detailed error information if available
    if (isset($heading)) {
        $error_details['error_type'] = $heading;
    }
    
    if (isset($message)) {
        $error_details['error_details'] = strip_tags($message);
        // Extract more specific error if it's a MySQL error
        if (strpos($message, 'Error Number:') !== false) {
            preg_match('/Error Number: (\d+)/', $message, $matches);
            if (isset($matches[1])) {
                $error_details['mysql_error_code'] = $matches[1];
            }
        }
        
        // Look for specific MySQL error messages
        if (strpos($message, 'Unknown column') !== false) {
            $error_details['message'] = 'Database table column error: ' . strip_tags($message);
        } elseif (strpos($message, 'Duplicate entry') !== false) {
            $error_details['message'] = 'Duplicate entry error: ' . strip_tags($message);
        } elseif (strpos($message, 'foreign key constraint fails') !== false || strpos($message, 'Cannot add or update') !== false) {
            $error_details['message'] = 'Foreign key constraint error: ' . strip_tags($message);
        } elseif (strpos($message, "doesn't exist") !== false) {
            $error_details['message'] = 'Database table/column missing: ' . strip_tags($message);
        } elseif (isset($message) && strlen(trim(strip_tags($message))) > 0) {
            $error_details['message'] = 'Database error: ' . strip_tags($message);
        }
    }
    
    // Log the detailed error
    if (function_exists('log_message')) {
        log_message('error', 'Database Error Handler: ' . json_encode($error_details));
    }
    
    echo json_encode($error_details);
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Database Error</title>
    <style type="text/css">
        body {
            background-color: #fff;
            margin: 40px;
            font: 13px/20px normal Helvetica, Arial, sans-serif;
            color: #4F5155;
        }

        h1 {
            color: #444;
            background-color: transparent;
            border-bottom: 1px solid #D0D0D0;
            font-size: 19px;
            font-weight: normal;
            margin: 0 0 14px 0;
            padding: 14px 15px 10px 15px;
        }

        code {
            font-family: Consolas, Monaco, Courier New, Courier, monospace;
            font-size: 12px;
            background-color: #f9f9f9;
            border: 1px solid #D0D0D0;
            color: #002166;
            display: block;
            margin: 14px 0 14px 0;
            padding: 12px 10px 12px 10px;
        }
    </style>
</head>
<body>
    <h1><?php echo isset($heading) ? $heading : 'Database Error'; ?></h1>
    <?php echo isset($message) ? $message : 'A database error occurred'; ?>
</body>
</html>