<?php
/**
 * Create a test JWT token for testing role-based filtering
 */

// Simple JWT creation for testing (you should use your actual JWT library)
function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function createTestJWT($user_id, $user_type, $role_id) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'iss' => 'school_management_system',
        'aud' => 'school_users',
        'iat' => time(),
        'exp' => time() + (2 * 60 * 60), // 2 hours
        'user_id' => (string)$user_id,
        'user_type' => $user_type,
        'role_id' => (string)$role_id
    ]);
    
    $headerEncoded = base64UrlEncode($header);
    $payloadEncoded = base64UrlEncode($payload);
    
    // You need to use the same secret key that your application uses
    $secret = 'your_secret_key_here'; // UPDATE THIS WITH YOUR ACTUAL SECRET
    $signature = hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, $secret, true);
    $signatureEncoded = base64UrlEncode($signature);
    
    return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
}

echo "<h2>Create Test JWT Token</h2>";

if ($_POST) {
    $user_id = $_POST['user_id'];
    $user_type = $_POST['user_type'];
    $role_id = $_POST['role_id'];
    
    $token = createTestJWT($user_id, $user_type, $role_id);
    
    echo "<div style='background: #e6f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>Generated Token:</h3>";
    echo "<textarea style='width: 100%; height: 100px; font-family: monospace;'>$token</textarea>";
    echo "<br><br>";
    echo "<strong>Test Commands:</strong><br>";
    echo "<div style='background: #f0f0f0; padding: 10px; font-family: monospace; margin: 10px 0;'>";
    echo "curl -H 'Authorization: Bearer $token' \\<br>";
    echo "&nbsp;&nbsp;&nbsp;&nbsp;'http://localhost/School/backend/api/admin/fee_collections?limit=5&offset=0'";
    echo "</div>";
    echo "</div>";
}

?>

<form method="POST" style="background: #f9f9f9; padding: 20px; border-radius: 5px;">
    <h3>Create Test Token</h3>
    
    <label>User ID:</label><br>
    <input type="number" name="user_id" value="5" required style="width: 100px; padding: 5px; margin: 5px 0;"><br><br>
    
    <label>User Type:</label><br>
    <select name="user_type" required style="padding: 5px; margin: 5px 0;">
        <option value="staff">Staff (should be filtered)</option>
        <option value="admin">Admin (should see all)</option>
    </select><br><br>
    
    <label>Role ID:</label><br>
    <input type="number" name="role_id" value="4" required style="width: 100px; padding: 5px; margin: 5px 0;"><br><br>
    
    <button type="submit" style="background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 3px;">
        Generate Token
    </button>
</form>

<div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3>⚠️ Important Notes:</h3>
    <ol>
        <li><strong>Update Secret Key:</strong> Replace 'your_secret_key_here' with your actual JWT secret key from your application</li>
        <li><strong>Check Staff Users:</strong> Visit <a href="check_staff_users.php">check_staff_users.php</a> to see available users</li>
        <li><strong>Use Correct User ID:</strong> Choose a user ID that exists in your staff table</li>
        <li><strong>Test Both Types:</strong> Create tokens for both 'staff' and 'admin' user types to verify filtering</li>
    </ol>
</div>

<div style="background: #e6f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3>Expected Results:</h3>
    <ul>
        <li><strong>Admin Token:</strong> Should return all 77 fee collections</li>
        <li><strong>Staff Token:</strong> Should return only collections where collected_by_id matches the user_id</li>
    </ul>
</div>

<style>
body { font-family: Arial, sans-serif; margin: 20px; }
input, select, button { font-size: 14px; }
</style>