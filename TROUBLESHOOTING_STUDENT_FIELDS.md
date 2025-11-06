# Troubleshooting: Student Document URLs Not Inserting

## Issue
The fields `student_photo_url`, `id_proof_url`, and `address_proof_url` are not being inserted into the students table.

---

## Root Cause
The database columns **don't exist yet**. You need to run the ALTER queries to add these columns to the students table.

---

## Solution

### Step 1: Verify Current Columns
Run this query to check which columns exist:

```sql
mysql -u root -p school_management < /Applications/XAMPP/xamppfiles/htdocs/School/backend/database/verify_student_columns.sql
```

OR in MySQL:
```sql
USE school_management;
SOURCE /Applications/XAMPP/xamppfiles/htdocs/School/backend/database/verify_student_columns.sql;
```

**Expected Result:**
- If columns don't exist: Empty result or only some columns shown
- If columns exist: List of all 19 new columns

---

### Step 2: Run ALTER Queries
If columns don't exist, run the ALTER queries:

```bash
mysql -u root -p school_management < /Applications/XAMPP/xamppfiles/htdocs/School/backend/database/alter_students_table.sql
```

OR via phpMyAdmin:
1. Open phpMyAdmin
2. Select `school_management` database
3. Click "SQL" tab
4. Open file: `/backend/database/alter_students_table.sql`
5. Click "Go"

---

### Step 3: Verify Columns Added
Run this query:
```sql
SHOW COLUMNS FROM students LIKE '%photo%';
SHOW COLUMNS FROM students LIKE '%proof%';
```

Should show:
- `student_photo_url`
- `id_proof_url`
- `address_proof_url`

---

### Step 4: Test Insert
Try creating a student with uploaded documents.

Check if data is saved:
```sql
SELECT 
    id,
    student_name,
    student_photo_url,
    id_proof_url,
    address_proof_url
FROM students
ORDER BY id DESC
LIMIT 1;
```

---

## Quick Fix Commands

### All-in-One Command:
```bash
# Run ALTER queries
mysql -u root -p school_management < /Applications/XAMPP/xamppfiles/htdocs/School/backend/database/alter_students_table.sql

# Verify
mysql -u root -p school_management -e "SHOW COLUMNS FROM students LIKE '%url';"
```

---

## Common Issues

### Issue 1: Column Already Exists
**Error:** `Duplicate column name 'student_photo_url'`

**Solution:** Column already exists, skip that ALTER query

### Issue 2: Access Denied
**Error:** `Access denied for user`

**Solution:** Use root user or user with ALTER privileges
```bash
mysql -u root -p school_management < alter_students_table.sql
```

### Issue 3: Wrong Database
**Error:** `Table 'students' doesn't exist`

**Solution:** Make sure you're using the correct database
```sql
USE school_management;
SHOW TABLES LIKE 'students';
```

### Issue 4: AFTER column doesn't exist
**Error:** `Unknown column 'mobile' in 'students'`

**Solution:** Use the modified ALTER file without AFTER clauses (already provided in alter_students_table.sql - the user edited version)

---

## Verification Checklist

After running ALTER queries:

- [ ] Run verification query
- [ ] Check all 19 columns exist
- [ ] Check all 4 indexes created
- [ ] Upload a test document
- [ ] Create a test student
- [ ] Verify URLs are saved in database
- [ ] Check documents are accessible

---

## If Still Not Working

### Check Backend Logs:
```bash
tail -f /Applications/XAMPP/xamppfiles/htdocs/School/backend/application/logs/log-$(date +%Y-%m-%d).php
```

### Check PHP Error Logs:
```bash
tail -f /Applications/XAMPP/xamppfiles/logs/php_error_log
```

### Check MySQL Query Log:
Enable general log temporarily:
```sql
SET GLOBAL general_log = 'ON';
SET GLOBAL log_output = 'TABLE';
-- Create student
-- Check log
SELECT * FROM mysql.general_log ORDER BY event_time DESC LIMIT 10;
SET GLOBAL general_log = 'OFF';
```

---

## Quick Test Script

Create a test file: `/backend/test_student_columns.php`

```php
<?php
require_once('index.php');

$CI =& get_instance();
$CI->load->database();

// Check if columns exist
$query = $CI->db->query("SHOW COLUMNS FROM students LIKE '%url'");
$columns = $query->result_array();

echo "<h3>Document URL Columns:</h3>";
if (count($columns) > 0) {
    echo "<ul>";
    foreach ($columns as $col) {
        echo "<li>" . $col['Field'] . " (" . $col['Type'] . ")</li>";
    }
    echo "</ul>";
} else {
    echo "<p style='color:red;'>No URL columns found! Run ALTER queries first.</p>";
}

// Test insert
$test_data = array(
    'student_name' => 'Test Student',
    'grade_id' => 1,
    'division_id' => 1,
    'parent_id' => 1,
    'roll_number' => 'TEST001',
    'admission_date' => date('Y-m-d'),
    'academic_year_id' => 1,
    'student_photo_url' => 'test/photo.jpg',
    'id_proof_url' => 'test/id.pdf',
    'address_proof_url' => 'test/address.pdf'
);

echo "<h3>Test Insert:</h3>";
if ($CI->db->insert('students', $test_data)) {
    $inserted_id = $CI->db->insert_id();
    echo "<p style='color:green;'>Success! Inserted student ID: " . $inserted_id . "</p>";
    
    // Verify
    $student = $CI->db->get_where('students', array('id' => $inserted_id))->row_array();
    echo "<h4>Inserted Data:</h4>";
    echo "<ul>";
    echo "<li>student_photo_url: " . ($student['student_photo_url'] ?? 'NULL') . "</li>";
    echo "<li>id_proof_url: " . ($student['id_proof_url'] ?? 'NULL') . "</li>";
    echo "<li>address_proof_url: " . ($student['address_proof_url'] ?? 'NULL') . "</li>";
    echo "</ul>";
    
    // Clean up
    $CI->db->delete('students', array('id' => $inserted_id));
    echo "<p>Test student deleted.</p>";
} else {
    $error = $CI->db->error();
    echo "<p style='color:red;'>Error: " . $error['message'] . "</p>";
}
?>
```

Access at: `http://localhost/School/backend/test_student_columns.php`

---

## Most Likely Solution:

**You need to run the ALTER queries first!**

```bash
mysql -u root -p school_management < /Applications/XAMPP/xamppfiles/htdocs/School/backend/database/alter_students_table.sql
```

The columns `student_photo_url`, `id_proof_url`, and `address_proof_url` **don't exist in your database yet**.

Once you run the ALTER queries, the fields will save properly! ✅

