<?php
// API Test Tool for Student File Upload Issue
// Place this in the root directory and access via browser

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student File Upload API Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-section { border: 1px solid #ddd; padding: 15px; margin: 10px 0; }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
        button { padding: 10px 15px; margin: 5px; }
        input, select { padding: 5px; margin: 5px; }
    </style>
</head>
<body>
    <h1>Student File Upload API Test Tool</h1>
    
    <div class="test-section">
        <h3>Test 1: Upload a Document</h3>
        <form id="uploadForm" enctype="multipart/form-data">
            <label>Document Type:</label>
            <select name="document_type" required>
                <option value="student_photo">Student Photo</option>
                <option value="id_proof">ID Proof</option>
                <option value="address_proof">Address Proof</option>
            </select><br>
            
            <label>File:</label>
            <input type="file" name="file" accept=".jpg,.jpeg,.png,.pdf" required><br>
            
            <button type="submit">Upload Document</button>
        </form>
        <div id="uploadResult"></div>
    </div>

    <div class="test-section">
        <h3>Test 2: Create Student with File URLs</h3>
        <form id="studentForm">
            <label>Student Name:</label>
            <input type="text" name="student_name" value="Test Student API" required><br>
            
            <label>Roll Number:</label>
            <input type="text" name="roll_number" value="TEST<?= date('His') ?>" required><br>
            
            <label>Grade ID:</label>
            <input type="number" name="grade_id" value="1" required><br>
            
            <label>Division ID:</label>
            <input type="number" name="division_id" value="1" required><br>
            
            <label>Parent ID:</label>
            <input type="number" name="parent_id" value="1" required><br>
            
            <label>Admission Date:</label>
            <input type="date" name="admission_date" value="<?= date('Y-m-d') ?>" required><br>
            
            <label>Student Photo URL:</label>
            <input type="text" name="student_photo_url" placeholder="Will be filled from upload"><br>
            
            <label>ID Proof URL:</label>
            <input type="text" name="id_proof_url" placeholder="Will be filled from upload"><br>
            
            <label>Address Proof URL:</label>
            <input type="text" name="address_proof_url" placeholder="Will be filled from upload"><br>
            
            <button type="submit">Create Student</button>
        </form>
        <div id="studentResult"></div>
    </div>

    <div class="test-section">
        <h3>Test 3: Check Recent Students</h3>
        <button onclick="checkRecentStudents()">Check Recent Students with URLs</button>
        <div id="recentStudentsResult"></div>
    </div>

    <script>
        // Get auth token from localStorage (assuming you're logged in)
        const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
        
        if (!authToken) {
            document.body.innerHTML = '<h2 style="color: red;">Please log in to the system first to get an auth token.</h2>';
        }

        const API_BASE = window.location.origin;

        async function makeAPIRequest(url, options = {}) {
            const defaultOptions = {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    ...options.headers
                }
            };
            
            const response = await fetch(API_BASE + url, {
                ...options,
                headers: defaultOptions.headers
            });
            
            const result = await response.json();
            return { response, result };
        }

        // Test 1: Upload Document
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            document.getElementById('uploadResult').innerHTML = '<div class="info">Uploading...</div>';
            
            try {
                const { response, result } = await makeAPIRequest('/api/admin/upload_student_document', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    document.getElementById('uploadResult').innerHTML = `
                        <div class="success">✓ Upload successful!</div>
                        <pre>${JSON.stringify(result, null, 2)}</pre>
                    `;
                    
                    // Auto-fill the student form with the uploaded URL
                    const documentType = formData.get('document_type');
                    const urlField = document.querySelector(`input[name="${documentType}_url"]`);
                    if (urlField && result.url) {
                        urlField.value = result.url;
                    }
                } else {
                    document.getElementById('uploadResult').innerHTML = `
                        <div class="error">❌ Upload failed</div>
                        <pre>${JSON.stringify(result, null, 2)}</pre>
                    `;
                }
            } catch (error) {
                document.getElementById('uploadResult').innerHTML = `
                    <div class="error">❌ Error: ${error.message}</div>
                `;
            }
        });

        // Test 2: Create Student
        document.getElementById('studentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const studentData = Object.fromEntries(formData.entries());
            
            // Convert numeric fields
            studentData.grade_id = parseInt(studentData.grade_id);
            studentData.division_id = parseInt(studentData.division_id);
            studentData.parent_id = parseInt(studentData.parent_id);
            
            document.getElementById('studentResult').innerHTML = '<div class="info">Creating student...</div>';
            
            try {
                const { response, result } = await makeAPIRequest('/api/admin/students', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(studentData)
                });
                
                if (response.ok) {
                    document.getElementById('studentResult').innerHTML = `
                        <div class="success">✓ Student created successfully!</div>
                        <pre>${JSON.stringify(result, null, 2)}</pre>
                        <div class="info">Student ID: ${result.id || 'Unknown'}</div>
                    `;
                } else {
                    document.getElementById('studentResult').innerHTML = `
                        <div class="error">❌ Student creation failed</div>
                        <pre>${JSON.stringify(result, null, 2)}</pre>
                    `;
                }
            } catch (error) {
                document.getElementById('studentResult').innerHTML = `
                    <div class="error">❌ Error: ${error.message}</div>
                `;
            }
        });

        // Test 3: Check Recent Students
        async function checkRecentStudents() {
            document.getElementById('recentStudentsResult').innerHTML = '<div class="info">Loading recent students...</div>';
            
            try {
                const { response, result } = await makeAPIRequest('/api/admin/students?limit=5&offset=0');
                
                if (response.ok && result.data) {
                    const studentsWithUrls = result.data.filter(student => 
                        student.student_photo_url || student.id_proof_url || student.address_proof_url
                    );
                    
                    document.getElementById('recentStudentsResult').innerHTML = `
                        <div class="success">✓ Found ${result.data.length} recent students</div>
                        <div class="info">${studentsWithUrls.length} students have document URLs</div>
                        <h4>Recent Students with Documents:</h4>
                        <pre>${JSON.stringify(studentsWithUrls.map(s => ({
                            id: s.id,
                            name: s.student_name,
                            student_photo_url: s.student_photo_url,
                            id_proof_url: s.id_proof_url,
                            address_proof_url: s.address_proof_url
                        })), null, 2)}</pre>
                    `;
                } else {
                    document.getElementById('recentStudentsResult').innerHTML = `
                        <div class="error">❌ Failed to load students</div>
                        <pre>${JSON.stringify(result, null, 2)}</pre>
                    `;
                }
            } catch (error) {
                document.getElementById('recentStudentsResult').innerHTML = `
                    <div class="error">❌ Error: ${error.message}</div>
                `;
            }
        }
    </script>
</body>
</html><?php // End of HTML ?>