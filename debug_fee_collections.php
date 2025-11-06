<?php
/**
 * Debug script for Fee Collections API
 * 
 * This script will help you test and debug the role-based filtering
 * 
 * Instructions:
 * 1. Replace the JWT tokens below with real tokens
 * 2. Access via browser: http://localhost/School/debug_fee_collections.php
 */

function makeAPICall($token, $endpoint) {
    $url = "http://localhost/School/backend/$endpoint";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'http_code' => $httpCode,
        'response' => $response ? json_decode($response, true) : null
    ];
}

function displayResults($testName, $result, $token) {
    echo "<div style='border: 1px solid #ccc; margin: 20px 0; padding: 15px; border-radius: 5px;'>";
    echo "<h3>$testName</h3>";
    
    if ($result['http_code'] === 200 && $result['response']) {
        $data = $result['response'];
        
        echo "<div style='background: #f0f8ff; padding: 10px; margin: 10px 0; border-radius: 3px;'>";
        echo "<strong>Authentication Info:</strong><br>";
        if (isset($data['debug_info'])) {
            echo "User Type: " . $data['debug_info']['user_type'] . "<br>";
            echo "User ID: " . $data['debug_info']['user_id'] . "<br>";
            echo "Is Admin: " . ($data['debug_info']['is_admin'] ? 'Yes' : 'No') . "<br>";
            echo "Staff Filter Applied: " . ($data['debug_info']['staff_id_filter_applied'] ? 'Yes' : 'No') . "<br>";
            echo "Staff Filter Value: " . ($data['debug_info']['staff_id_filter_value'] ?: 'None') . "<br>";
            echo "Filtering Logic: " . $data['debug_info']['filtering_logic'] . "<br>";
            echo "Query Will Return: " . $data['debug_info']['query_will_return'] . "<br>";
        }
        echo "</div>";
        
        echo "<div style='background: #f0fff0; padding: 10px; margin: 10px 0; border-radius: 3px;'>";
        echo "<strong>Results:</strong><br>";
        echo "Total Records: " . $data['total'] . "<br>";
        echo "Records in Response: " . count($data['data']) . "<br>";
        
        if (!empty($data['data'])) {
            echo "<br><strong>Sample Records:</strong><br>";
            echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr><th>ID</th><th>Receipt</th><th>Student</th><th>Amount</th><th>Collected By</th><th>Collected By ID</th></tr>";
            
            foreach (array_slice($data['data'], 0, 5) as $record) {
                echo "<tr>";
                echo "<td>" . $record['id'] . "</td>";
                echo "<td>" . $record['receipt_number'] . "</td>";
                echo "<td>" . $record['student_name'] . "</td>";
                echo "<td>₹" . $record['amount'] . "</td>";
                echo "<td>" . ($record['collected_by_name'] ?? 'Unknown') . "</td>";
                echo "<td>" . $record['collected_by_id'] . "</td>";
                echo "</tr>";
            }
            echo "</table>";
            
            // Show unique collected_by IDs
            $collected_by_ids = array_unique(array_column($data['data'], 'collected_by_id'));
            echo "<br><strong>Unique Staff IDs in results:</strong> " . implode(', ', $collected_by_ids) . "<br>";
        }
        echo "</div>";
        
    } else {
        echo "<div style='background: #ffe0e0; padding: 10px; margin: 10px 0; border-radius: 3px;'>";
        echo "<strong>Error:</strong><br>";
        echo "HTTP Code: " . $result['http_code'] . "<br>";
        if ($result['response']) {
            echo "Response: " . json_encode($result['response'], JSON_PRETTY_PRINT) . "<br>";
        } else {
            echo "No response received<br>";
        }
        echo "</div>";
    }
    
    echo "</div>";
}

echo "<html><head><title>Fee Collections API Debug</title></head><body>";
echo "<h1>Fee Collections API Role-Based Filtering Debug</h1>";

// You need to replace these with actual JWT tokens
$adminToken = "YOUR_ADMIN_JWT_TOKEN_HERE";
$staffToken = "YOUR_STAFF_JWT_TOKEN_HERE";

if ($adminToken === "YOUR_ADMIN_JWT_TOKEN_HERE" || $staffToken === "YOUR_STAFF_JWT_TOKEN_HERE") {
    echo "<div style='background: #fff3cd; padding: 15px; border: 1px solid #ffeaa7; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>⚠️ Setup Required</h3>";
    echo "<p>To use this debug script, you need to:</p>";
    echo "<ol>";
    echo "<li>Login to your application and get a JWT token for an admin user</li>";
    echo "<li>Login to your application and get a JWT token for a staff user</li>";
    echo "<li>Replace the token variables in this script with the actual tokens</li>";
    echo "<li>Refresh this page</li>";
    echo "</ol>";
    echo "<p><strong>How to get JWT tokens:</strong></p>";
    echo "<ol>";
    echo "<li>Open browser DevTools (F12)</li>";
    echo "<li>Go to Network tab</li>";
    echo "<li>Login to your application</li>";
    echo "<li>Look for the login API call</li>";
    echo "<li>Copy the JWT token from the response</li>";
    echo "</ol>";
    echo "</div>";
} else {
    // Test Cases
    $testCases = [
        [
            'name' => '🔹 Admin User - All Records',
            'token' => $adminToken,
            'endpoint' => 'api/admin/fee_collections?limit=10&offset=0'
        ],
        [
            'name' => '🔹 Staff User - Own Records Only',
            'token' => $staffToken,
            'endpoint' => 'api/admin/fee_collections?limit=10&offset=0'
        ],
        [
            'name' => '🔹 Admin User - Filter by Staff ID 1',
            'token' => $adminToken,
            'endpoint' => 'api/admin/fee_collections?limit=10&offset=0&staff_id=1'
        ],
        [
            'name' => '🔹 Staff User via Staff Endpoint',
            'token' => $staffToken,
            'endpoint' => 'api/staff/fee_collections?limit=10&offset=0'
        ]
    ];
    
    foreach ($testCases as $test) {
        $result = makeAPICall($test['token'], $test['endpoint']);
        displayResults($test['name'], $result, $test['token']);
    }
}

echo "<hr><h3>Manual Testing Commands</h3>";
echo "<div style='background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace;'>";
echo "<strong>Admin User Test:</strong><br>";
echo "curl -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \\<br>";
echo "&nbsp;&nbsp;&nbsp;&nbsp;'http://localhost/School/backend/api/admin/fee_collections?limit=5&offset=0'<br><br>";

echo "<strong>Staff User Test:</strong><br>";
echo "curl -H 'Authorization: Bearer YOUR_STAFF_TOKEN' \\<br>";
echo "&nbsp;&nbsp;&nbsp;&nbsp;'http://localhost/School/backend/api/admin/fee_collections?limit=5&offset=0'<br><br>";

echo "<strong>Admin with Staff Filter:</strong><br>";
echo "curl -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \\<br>";
echo "&nbsp;&nbsp;&nbsp;&nbsp;'http://localhost/School/backend/api/admin/fee_collections?limit=5&offset=0&staff_id=1'<br>";
echo "</div>";

echo "</body></html>";
?>