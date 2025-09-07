<?php
// Test password hash generation
$password = 'password';
$hash = password_hash($password, PASSWORD_BCRYPT);
echo "Password: " . $password . "\n";
echo "Hash: " . $hash . "\n";
echo "Verify: " . (password_verify($password, $hash) ? 'YES' : 'NO') . "\n";

// Test with the hash we used
$old_hash = '$2y$10$X8LlZ3xY7d7cD5rT6N.WZuoB9lQKczxBY9PqV8NLKG8oOdnKQfqjm';
echo "\nOld hash verify: " . (password_verify($password, $old_hash) ? 'YES' : 'NO') . "\n";
?>