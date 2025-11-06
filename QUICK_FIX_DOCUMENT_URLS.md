# 🚨 URGENT FIX: Document URLs Not Inserting

## Problem
Fields `student_photo_url`, `id_proof_url`, and `address_proof_url` are **NOT being inserted** into the students table.

## Root Cause
❌ **Database columns don't exist yet!** You haven't run the ALTER queries.

---

## ✅ QUICK FIX (Choose One Method)

### **METHOD 1: Automated PHP Script (EASIEST)** ⭐

**Step 1:** Open this URL in your browser:
```
http://localhost/School/backend/run_student_table_update.php
```

**Step 2:** Wait for the script to complete (shows green checkmarks)

**Step 3:** Refresh your frontend and try again

**DONE!** ✅

---

### **METHOD 2: phpMyAdmin (GUI Method)**

**Step 1:** Open phpMyAdmin
```
http://localhost/phpmyadmin
```

**Step 2:** Select database `school_management` (left sidebar)

**Step 3:** Click "SQL" tab (top menu)

**Step 4:** Copy these 3 queries and paste:

```sql
ALTER TABLE `students` ADD COLUMN `student_photo_url` VARCHAR(255) NULL COMMENT 'Student photograph URL';

ALTER TABLE `students` ADD COLUMN `id_proof_url` VARCHAR(255) NULL COMMENT 'ID proof document URL';

ALTER TABLE `students` ADD COLUMN `address_proof_url` VARCHAR(255) NULL COMMENT 'Address proof document URL';
```

**Step 5:** Click "Go" button

**Step 6:** You should see: "3 rows affected" or "Query executed successfully"

**DONE!** ✅

---

### **METHOD 3: Full ALTER Script (Complete Method)**

Run the complete ALTER script to add ALL new fields:

**Via phpMyAdmin:**
1. Open phpMyAdmin → school_management database
2. Click "SQL" tab
3. Click "Choose File" or open file browser
4. Select: `/Applications/XAMPP/xamppfiles/htdocs/School/backend/database/alter_students_table.sql`
5. Click "Go"

**OR copy all content** from `alter_students_table.sql` and paste in SQL tab

---

## 🔍 Verify Columns Were Added

**Option A: Via Browser**
```
http://localhost/School/backend/run_student_table_update.php
```
(Will show all columns)

**Option B: Via phpMyAdmin**
```sql
SHOW COLUMNS FROM students LIKE '%url';
```

Should show:
```
student_photo_url    | varchar(255)
id_proof_url         | varchar(255)
address_proof_url    | varchar(255)
```

**Option C: Quick Test Query**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name IN ('student_photo_url', 'id_proof_url', 'address_proof_url');
```

---

## ✅ After Columns Are Added - Frontend Update

I've already updated the frontend code to **explicitly include** document URLs in the submit data:

```javascript
// Now includes:
student_photo_url: formData.student_photo_url || '',
id_proof_url: formData.id_proof_url || '',
address_proof_url: formData.address_proof_url || ''
```

---

## 📝 Test After Fix

1. **Refresh browser** (Ctrl + F5)
2. **Go to Student Management**
3. **Click "Add New Student"**
4. **Upload documents:**
   - Student Photo
   - ID Proof
   - Address Proof
5. **Fill required fields** and click "Create Student"
6. **Edit the student** - verify URLs are saved
7. **Check database:**
   ```sql
   SELECT student_name, student_photo_url, id_proof_url, address_proof_url 
   FROM students 
   ORDER BY id DESC 
   LIMIT 1;
   ```

---

## 🎯 Most Common Issues After Running ALTER

### Issue: "Column already exists"
✅ **Good!** This means the column was added before. Skip to testing.

### Issue: "Table doesn't exist"
❌ Wrong database selected. Make sure you're in `school_management` database.

### Issue: Still not inserting after ALTER
**Check:**
1. Refresh browser completely (hard refresh)
2. Check backend logs: `/backend/application/logs/log-*.php`
3. Verify columns exist: Run verification query above
4. Check Student_model.php isn't filtering out these fields

---

## ⚡ FASTEST FIX (30 seconds)

1. Open: `http://localhost/School/backend/run_student_table_update.php`
2. Wait for green checkmarks
3. Refresh frontend (Ctrl + F5)
4. Test upload
5. **DONE!** ✅

---

## 🆘 If Still Not Working

Run this debug query:
```sql
-- Check if columns exist
DESCRIBE students;

-- Try manual insert test
INSERT INTO students (
    student_name, 
    grade_id, 
    division_id, 
    parent_id, 
    roll_number, 
    admission_date, 
    academic_year_id,
    student_photo_url,
    id_proof_url,
    address_proof_url
) VALUES (
    'Test Student',
    1,
    1,
    1,
    'TEST999',
    '2025-11-04',
    1,
    'test/photo.jpg',
    'test/id.pdf',
    'test/address.pdf'
);

-- Check if it saved
SELECT id, student_name, student_photo_url, id_proof_url, address_proof_url 
FROM students 
WHERE roll_number = 'TEST999';

-- Clean up
DELETE FROM students WHERE roll_number = 'TEST999';
```

If this **INSERT works**, your frontend issue is fixed.
If this **INSERT fails**, columns don't exist - run ALTER queries again.

---

## 📞 Support

**The fix is simple: Run the ALTER queries to add the missing columns!**

Use METHOD 1 (PHP script) - it's the easiest and safest.

After that, document uploads will work perfectly! 🎉

