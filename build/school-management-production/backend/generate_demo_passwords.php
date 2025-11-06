<?php
/**
 * Script to generate password hashes for demo accounts
 * Run this file to get the correct bcrypt hashes for the passwords
 */

// Demo passwords
$passwords = [
    'Admin@123' => 'Admin account',
    'Staff@123' => 'Staff account',
    'Parent@123' => 'Parent account'
];

echo "========================================\n";
echo "GENERATING PASSWORD HASHES FOR DEMO ACCOUNTS\n";
echo "========================================\n\n";

foreach ($passwords as $password => $description) {
    $hash = password_hash($password, PASSWORD_BCRYPT);
    echo "$description:\n";
    echo "Password: $password\n";
    echo "Hash: $hash\n";
    echo "Verified: " . (password_verify($password, $hash) ? "✓ YES" : "✗ NO") . "\n";
    echo "----------------------------------------\n\n";
}

echo "========================================\n";
echo "DEMO LOGIN CREDENTIALS:\n";
echo "========================================\n\n";
echo "ADMIN:\n";
echo "  Email: admin@demo.com\n";
echo "  Password: Admin@123\n\n";

echo "STAFF:\n";
echo "  Email: staff@demo.com\n";
echo "  Password: Staff@123\n\n";

echo "PARENT:\n";
echo "  Email: parent@demo.com\n";
echo "  Password: Parent@123\n\n";

echo "========================================\n";
echo "To apply these credentials, run:\n";
echo "mysql -u root -p school_db < database/demo_credentials.sql\n";
echo "========================================\n";
?>