<?php
/**
 * Test script for Fee Collections API role-based filtering
 * 
 * Usage: 
 * 1. Replace YOUR_JWT_TOKEN with actual JWT token
 * 2. Run: php test_fee_collections_api.php
 * OR access via browser: http://localhost/School/test_fee_collections_api.php
 */

// Test with different JWT tokens
$test_cases = [
    [
        'name' => 'Admin User Test',
        'token' => 'YOUR_ADMIN_JWT_TOKEN_HERE',
        'expected' => 'Should return ALL fee collections'
    ],
    [
        'name' => 'Staff User Test', 
        'token' => 'YOUR_STAFF_JWT_TOKEN_HERE',
        'expected' => 'Should return only collections made by this staff member'
    ]
];

function test_api($token, $test_name) {
    $url = 'http://localhost/School/backend/api/admin/fee_collections?limit=5&offset=0';
    
    $headers = [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "=== $test_name ===\n";
    echo "HTTP Code: $http_code\n";
    
    if ($response) {
        $data = json_decode($response, true);
        
        if (isset($data['debug_info'])) {
            echo "User Type: " . $data['debug_info']['user_type'] . "\n";
            echo "User ID: " . $data['debug_info']['user_id'] . "\n";
            echo "Is Admin: " . ($data['debug_info']['is_admin'] ? 'Yes' : 'No') . "\n";
            echo "Staff Filter Applied: " . ($data['debug_info']['staff_id_filter_applied'] ? 'Yes' : 'No') . "\n";
            echo "Filtering Logic: " . $data['debug_info']['filtering_logic'] . "\n";
            echo "Applied Filters: " . json_encode($data['debug_info']['applied_filters']) . "\n";
        }
        
        if (isset($data['data'])) {
            echo "Total Records: " . $data['total'] . "\n";
            echo "Records in Response: " . count($data['data']) . "\n";
            
            if (!empty($data['data'])) {
                echo "Sample Collection IDs: ";
                $sample_ids = array_slice(array_column($data['data'], 'id'), 0, 5);
                echo implode(', ', $sample_ids) . "\n";
                
                echo "Collected By Staff IDs: ";
                $collected_by_ids = array_unique(array_column($data['data'], 'collected_by'));
                echo implode(', ', $collected_by_ids) . "\n";
            }
        }
        
        if (isset($data['message'])) {
            echo "Message: " . $data['message'] . "\n";
        }
    } else {
        echo "No response received\n";
    }
    
    echo "\n" . str_repeat('-', 50) . "\n\n";
}

// Run tests
foreach ($test_cases as $test) {
    if ($test['token'] !== 'YOUR_ADMIN_JWT_TOKEN_HERE' && $test['token'] !== 'YOUR_STAFF_JWT_TOKEN_HERE') {
        test_api($test['token'], $test['name']);
    } else {
        echo "=== {$test['name']} ===\n";
        echo "Please replace {$test['token']} with actual JWT token\n";
        echo "Expected: {$test['expected']}\n\n";
        echo str_repeat('-', 50) . "\n\n";
    }
}

// Alternative: Manual test instructions
echo "=== MANUAL TESTING INSTRUCTIONS ===\n";
echo "1. Get your JWT token from browser DevTools or login response\n";
echo "2. Test Admin User:\n";
echo "   curl -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \\\n";
echo "        'http://localhost/School/backend/api/admin/fee_collections?limit=5&offset=0'\n\n";
echo "3. Test Staff User:\n";
echo "   curl -H 'Authorization: Bearer YOUR_STAFF_TOKEN' \\\n";
echo "        'http://localhost/School/backend/api/admin/fee_collections?limit=5&offset=0'\n\n";
echo "4. Check the debug_info in the response to verify filtering logic\n";
?>