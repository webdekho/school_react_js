<?php
// Debug script to check student file upload issue
// Place this in the root directory and access via browser

require_once 'backend/application/config/database.php';

// Database connection
$db_config = $db['default'];
$pdo = new PDO(
    "mysql:host={$db_config['hostname']};dbname={$db_config['database']};charset=utf8mb4",
    $db_config['username'],
    $db_config['password']
);

echo "<h2>Student File Upload Debug</h2>";

// 1. Check if the columns exist in the students table
echo "<h3>1. Checking student table schema:</h3>";
$stmt = $pdo->query("DESCRIBE students");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
$url_columns = [];
foreach ($columns as $column) {
    if (strpos($column['Field'], '_url') !== false) {
        $url_columns[] = $column['Field'];
        echo "<div style='color: green;'>✓ {$column['Field']} - {$column['Type']}</div>";
    }
}

if (empty($url_columns)) {
    echo "<div style='color: red;'>❌ No URL columns found! Please run the migration script.</div>";
    echo "<pre>SQL to add columns:
ALTER TABLE students
ADD COLUMN student_photo_url VARCHAR(255) NULL,
ADD COLUMN id_proof_url VARCHAR(255) NULL,
ADD COLUMN address_proof_url VARCHAR(255) NULL;
</pre>";
    exit;
}

// 2. Check recent students to see if URL fields are being populated
echo "<h3>2. Checking recent students for URL data:</h3>";
$stmt = $pdo->query("
    SELECT id, student_name, student_photo_url, id_proof_url, address_proof_url, created_at 
    FROM students 
    WHERE is_active = 1 
    ORDER BY created_at DESC 
    LIMIT 10
");
$recent_students = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($recent_students)) {
    echo "<div style='color: orange;'>No students found in database.</div>";
} else {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>ID</th><th>Name</th><th>Photo URL</th><th>ID Proof URL</th><th>Address Proof URL</th><th>Created</th></tr>";
    foreach ($recent_students as $student) {
        echo "<tr>";
        echo "<td>{$student['id']}</td>";
        echo "<td>{$student['student_name']}</td>";
        echo "<td>" . ($student['student_photo_url'] ? '<span style="color: green;">✓ ' . $student['student_photo_url'] . '</span>' : '<span style="color: red;">❌ Empty</span>') . "</td>";
        echo "<td>" . ($student['id_proof_url'] ? '<span style="color: green;">✓ ' . $student['id_proof_url'] . '</span>' : '<span style="color: red;">❌ Empty</span>') . "</td>";
        echo "<td>" . ($student['address_proof_url'] ? '<span style="color: green;">✓ ' . $student['address_proof_url'] . '</span>' : '<span style="color: red;">❌ Empty</span>') . "</td>";
        echo "<td>{$student['created_at']}</td>";
        echo "</tr>";
    }
    echo "</table>";
}

// 3. Test if we can manually insert URL data
echo "<h3>3. Testing manual URL insertion:</h3>";
try {
    $test_student_id = $recent_students[0]['id'] ?? null;
    if ($test_student_id) {
        $test_url = 'backend/uploads/student_photos/test_photo_' . time() . '.jpg';
        $stmt = $pdo->prepare("UPDATE students SET student_photo_url = ? WHERE id = ?");
        $result = $stmt->execute([$test_url, $test_student_id]);
        
        if ($result) {
            echo "<div style='color: green;'>✓ Manual URL update successful for student ID: {$test_student_id}</div>";
            
            // Verify the update
            $stmt = $pdo->prepare("SELECT student_photo_url FROM students WHERE id = ?");
            $stmt->execute([$test_student_id]);
            $updated_url = $stmt->fetchColumn();
            echo "<div>Verified URL: {$updated_url}</div>";
            
            // Revert the test change
            $stmt = $pdo->prepare("UPDATE students SET student_photo_url = NULL WHERE id = ?");
            $stmt->execute([$test_student_id]);
            echo "<div style='color: blue;'>Test data reverted.</div>";
        } else {
            echo "<div style='color: red;'>❌ Manual URL update failed</div>";
        }
    }
} catch (Exception $e) {
    echo "<div style='color: red;'>❌ Error during manual test: " . $e->getMessage() . "</div>";
}

// 4. Check upload directory permissions
echo "<h3>4. Checking upload directories:</h3>";
$upload_dirs = [
    'backend/uploads/student_photos/',
    'backend/uploads/student_id_proofs/',
    'backend/uploads/student_address_proofs/'
];

foreach ($upload_dirs as $dir) {
    if (is_dir($dir)) {
        $perms = substr(sprintf('%o', fileperms($dir)), -4);
        $writable = is_writable($dir) ? 'Writable' : 'Not Writable';
        echo "<div style='color: " . (is_writable($dir) ? 'green' : 'red') . ";'>✓ {$dir} - Permissions: {$perms} - {$writable}</div>";
    } else {
        echo "<div style='color: orange;'>⚠ {$dir} - Directory does not exist</div>";
    }
}

// 5. Sample files in upload directories
echo "<h3>5. Sample uploaded files:</h3>";
foreach ($upload_dirs as $dir) {
    if (is_dir($dir)) {
        $files = array_diff(scandir($dir), array('..', '.'));
        $file_count = count($files);
        echo "<div><strong>{$dir}</strong> - {$file_count} files</div>";
        if ($file_count > 0) {
            $sample_files = array_slice($files, 0, 3);
            foreach ($sample_files as $file) {
                echo "<div style='margin-left: 20px;'>- {$file}</div>";
            }
            if ($file_count > 3) {
                echo "<div style='margin-left: 20px;'>... and " . ($file_count - 3) . " more files</div>";
            }
        }
    }
}

echo "<h3>6. Next Steps:</h3>";
echo "<div>
<ol>
<li>If URL columns are missing, run the migration script</li>
<li>If files are uploading but URLs aren't saving, check the frontend console logs during student creation</li>
<li>Check the backend logs in <code>backend/application/logs/</code></li>
<li>Test the upload API directly: <code>POST /api/admin/upload_student_document</code></li>
<li>Test the student create/update API to ensure URL data is being received</li>
</ol>
</div>";

echo "<hr>";
echo "<p style='color: gray; font-size: 12px;'>Debug script completed at: " . date('Y-m-d H:i:s') . "</p>";
?>