<?php
/**
 * Script to add new columns to students table
 * Run this file in browser: http://localhost/School/backend/run_student_table_update.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load CodeIgniter to use database config
require_once('index.php');
$CI =& get_instance();
$CI->load->database();

echo "<h2>Student Table Update Script</h2>";
echo "<hr>";

// Check existing columns first
echo "<h3>Step 1: Checking existing columns...</h3>";
$query = $CI->db->query("SHOW COLUMNS FROM students LIKE '%url%'");
$existing_url_columns = $query->result_array();

if (count($existing_url_columns) > 0) {
    echo "<p style='color:green;'>✓ Document URL columns already exist:</p>";
    echo "<ul>";
    foreach ($existing_url_columns as $col) {
        echo "<li><strong>" . $col['Field'] . "</strong> (" . $col['Type'] . ")</li>";
    }
    echo "</ul>";
    echo "<p><strong>Columns already exist - No ALTER needed!</strong></p>";
} else {
    echo "<p style='color:orange;'>⚠ Document URL columns don't exist yet. Running ALTER queries...</p>";
    
    // Run ALTER queries
    $alter_queries = [
        // Emergency Contact
        "ALTER TABLE `students` ADD COLUMN `emergency_contact_number` VARCHAR(15) NULL COMMENT 'Emergency contact number'",
        
        // Travel Mode
        "ALTER TABLE `students` ADD COLUMN `travel_mode` ENUM('School Bus', 'Own') DEFAULT NULL COMMENT 'Mode of travel to school'",
        "ALTER TABLE `students` ADD COLUMN `vehicle_number` VARCHAR(20) NULL COMMENT 'Vehicle registration number'",
        "ALTER TABLE `students` ADD COLUMN `parent_or_staff_name` VARCHAR(100) NULL COMMENT 'Name of parent/staff driving'",
        "ALTER TABLE `students` ADD COLUMN `verified_tts_id` VARCHAR(50) NULL COMMENT 'Verified TTS ID'",
        
        // Medical Information
        "ALTER TABLE `students` ADD COLUMN `allergies` TEXT NULL COMMENT 'JSON array of allergies'",
        "ALTER TABLE `students` ADD COLUMN `diabetic` TINYINT(1) DEFAULT 0 COMMENT 'Is diabetic'",
        "ALTER TABLE `students` ADD COLUMN `lifestyle_diseases` TEXT NULL COMMENT 'Lifestyle diseases'",
        "ALTER TABLE `students` ADD COLUMN `asthmatic` TINYINT(1) DEFAULT 0 COMMENT 'Is asthmatic'",
        "ALTER TABLE `students` ADD COLUMN `phobia` TINYINT(1) DEFAULT 0 COMMENT 'Has phobia'",
        
        // Family Doctor
        "ALTER TABLE `students` ADD COLUMN `doctor_name` VARCHAR(100) NULL COMMENT 'Family doctor name'",
        "ALTER TABLE `students` ADD COLUMN `doctor_contact` VARCHAR(15) NULL COMMENT 'Doctor contact number'",
        "ALTER TABLE `students` ADD COLUMN `clinic_address` TEXT NULL COMMENT 'Clinic address'",
        
        // Blood Group
        "ALTER TABLE `students` ADD COLUMN `blood_group` ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-') DEFAULT NULL COMMENT 'Blood group'",
        
        // Documents
        "ALTER TABLE `students` ADD COLUMN `student_photo_url` VARCHAR(255) NULL COMMENT 'Student photograph URL'",
        "ALTER TABLE `students` ADD COLUMN `id_proof_url` VARCHAR(255) NULL COMMENT 'ID proof document URL'",
        "ALTER TABLE `students` ADD COLUMN `address_proof_url` VARCHAR(255) NULL COMMENT 'Address proof document URL'",
        
        // Student Aspirations
        "ALTER TABLE `students` ADD COLUMN `student_aspirations` TEXT NULL COMMENT 'Student aspirations'"
    ];
    
    $success_count = 0;
    $skip_count = 0;
    $error_count = 0;
    
    echo "<h3>Step 2: Running ALTER queries...</h3>";
    echo "<ul>";
    
    foreach ($alter_queries as $sql) {
        // Extract column name for display
        preg_match('/ADD COLUMN `(\w+)`/', $sql, $matches);
        $column_name = $matches[1] ?? 'unknown';
        
        // Disable error reporting temporarily
        $CI->db->db_debug = FALSE;
        
        if ($CI->db->query($sql)) {
            echo "<li style='color:green;'>✓ Added column: <strong>$column_name</strong></li>";
            $success_count++;
        } else {
            $error = $CI->db->error();
            if ($error['code'] == 1060) { // Duplicate column
                echo "<li style='color:blue;'>⊙ Column already exists: <strong>$column_name</strong></li>";
                $skip_count++;
            } else {
                echo "<li style='color:red;'>✗ Error adding column <strong>$column_name</strong>: " . $error['message'] . "</li>";
                $error_count++;
            }
        }
        
        $CI->db->db_debug = TRUE;
    }
    
    echo "</ul>";
    
    echo "<h3>Summary:</h3>";
    echo "<ul>";
    echo "<li style='color:green;'>Added: <strong>$success_count</strong> columns</li>";
    echo "<li style='color:blue;'>Already existed: <strong>$skip_count</strong> columns</li>";
    echo "<li style='color:red;'>Errors: <strong>$error_count</strong> columns</li>";
    echo "</ul>";
}

// Verify final state
echo "<hr>";
echo "<h3>Step 3: Verification - All columns in students table:</h3>";
$all_columns = $CI->db->query("SHOW COLUMNS FROM students")->result_array();
echo "<p>Total columns: <strong>" . count($all_columns) . "</strong></p>";

echo "<h4>New columns added:</h4>";
echo "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse:collapse;'>";
echo "<tr><th>Column Name</th><th>Type</th><th>Null</th><th>Default</th><th>Comment</th></tr>";

$new_columns = [
    'emergency_contact_number', 'travel_mode', 'vehicle_number', 'parent_or_staff_name',
    'verified_tts_id', 'allergies', 'diabetic', 'lifestyle_diseases', 'asthmatic',
    'phobia', 'doctor_name', 'doctor_contact', 'clinic_address', 'blood_group',
    'student_photo_url', 'id_proof_url', 'address_proof_url', 'student_aspirations'
];

foreach ($all_columns as $col) {
    if (in_array($col['Field'], $new_columns)) {
        $comment = isset($col['Comment']) ? $col['Comment'] : '';
        echo "<tr>";
        echo "<td><strong>" . $col['Field'] . "</strong></td>";
        echo "<td>" . $col['Type'] . "</td>";
        echo "<td>" . $col['Null'] . "</td>";
        echo "<td>" . ($col['Default'] ?? 'NULL') . "</td>";
        echo "<td>" . $comment . "</td>";
        echo "</tr>";
    }
}
echo "</table>";

echo "<hr>";
echo "<h3 style='color:green;'>✓ Update Complete!</h3>";
echo "<p>You can now use the student management system with all new fields.</p>";
echo "<p><a href='/School/frontend'>Go to Frontend</a> | <a href='javascript:location.reload()'>Refresh This Page</a></p>";
?>

