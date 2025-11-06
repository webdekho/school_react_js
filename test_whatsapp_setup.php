<?php
// Test script to insert WhatsApp settings into your database
// Run this file once to set up the WhatsApp configuration

// Database configuration - update these to match your settings
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>Setting up WhatsApp Configuration</h2>";
    
    // Check if system_settings table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'system_settings'");
    if ($stmt->rowCount() == 0) {
        echo "<p style='color: red;'>ERROR: system_settings table does not exist!</p>";
        exit;
    }
    
    echo "<p style='color: green;'>✓ system_settings table exists</p>";
    
    // Show current table structure
    echo "<h3>Current table structure:</h3>";
    $stmt = $pdo->query("DESCRIBE system_settings");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>";
    foreach ($columns as $column) {
        echo "<tr>";
        echo "<td>" . $column['Field'] . "</td>";
        echo "<td>" . $column['Type'] . "</td>";
        echo "<td>" . $column['Null'] . "</td>";
        echo "<td>" . $column['Key'] . "</td>";
        echo "<td>" . $column['Default'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Insert WhatsApp settings
    echo "<h3>Inserting WhatsApp settings...</h3>";
    
    $whatsapp_settings = [
        ['whatsapp_type', 'text', 'string', 'WhatsApp message type (text, media, document)'],
        ['whatsapp_baseUrl', 'https://wa.clareinfotech.com/api/send', 'string', 'WhatsApp API base URL endpoint'],
        ['whatsapp_instance_id', '687646EA9210B', 'string', 'WhatsApp instance identifier'],
        ['whatsapp_access_token', '648db645b4f8c', 'string', 'WhatsApp API access token'],
        ['whatsapp_enabled', '0', 'boolean', 'Whether WhatsApp notifications are enabled']
    ];
    
    $sql = "INSERT INTO system_settings (setting_key, setting_value, setting_type, description, updated_by) 
            VALUES (?, ?, ?, ?, 1) 
            ON DUPLICATE KEY UPDATE 
                setting_value = VALUES(setting_value),
                setting_type = VALUES(setting_type),
                description = VALUES(description),
                updated_by = VALUES(updated_by)";
    
    $stmt = $pdo->prepare($sql);
    
    foreach ($whatsapp_settings as $setting) {
        $stmt->execute($setting);
        echo "<p style='color: green;'>✓ Inserted/Updated: {$setting[0]} = {$setting[1]}</p>";
    }
    
    // Verify the settings were inserted
    echo "<h3>Verifying WhatsApp settings:</h3>";
    $stmt = $pdo->query("SELECT * FROM system_settings WHERE setting_key LIKE 'whatsapp_%'");
    $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($settings) > 0) {
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Setting Key</th><th>Setting Value</th><th>Type</th><th>Description</th></tr>";
        foreach ($settings as $setting) {
            echo "<tr>";
            echo "<td>" . $setting['id'] . "</td>";
            echo "<td>" . $setting['setting_key'] . "</td>";
            echo "<td>" . $setting['setting_value'] . "</td>";
            echo "<td>" . $setting['setting_type'] . "</td>";
            echo "<td>" . $setting['description'] . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        echo "<h3 style='color: green;'>✅ WhatsApp configuration setup complete!</h3>";
        echo "<p>You can now use the following endpoints:</p>";
        echo "<ul>";
        echo "<li><strong>GET</strong> /api/admin/system-settings/whatsapp - Get WhatsApp settings</li>";
        echo "<li><strong>PUT</strong> /api/admin/system-settings/whatsapp - Update WhatsApp settings</li>";
        echo "<li><strong>POST</strong> /api/admin/test-whatsapp - Test WhatsApp configuration</li>";
        echo "</ul>";
        
        echo "<p style='background: #f0f8ff; padding: 10px; border: 1px solid #0066cc;'>";
        echo "<strong>Next steps:</strong><br>";
        echo "1. Go to Admin → System Settings → WhatsApp tab<br>";
        echo "2. Enable WhatsApp notifications<br>";
        echo "3. Test with a phone number<br>";
        echo "4. Delete this test file for security";
        echo "</p>";
        
    } else {
        echo "<p style='color: red;'>ERROR: No WhatsApp settings found after insertion!</p>";
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>Database error: " . $e->getMessage() . "</p>";
}
?>