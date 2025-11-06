# Student Management System - Comprehensive Enhancements

## Overview
This document outlines all the enhancements made to the student management system, including emergency contact information, travel mode tracking, medical information, family doctor details, document uploads, blood group, student aspirations, and ID card generation.

## Table of Contents
1. [Database Changes](#database-changes)
2. [Backend Updates](#backend-updates)
3. [Frontend Enhancements](#frontend-enhancements)
4. [New Features](#new-features)
5. [Installation & Setup](#installation--setup)
6. [Usage Guide](#usage-guide)

---

## Database Changes

### Migration File
**Location:** `/backend/database/update_students_comprehensive_fields.sql`

### New Fields Added to `students` Table

#### 1. Emergency Contact Section
- `emergency_contact_number` (VARCHAR 15) - Emergency contact number (10 digits validation)
- `gender` (ENUM) - Gender options: Male, Female, Other

#### 2. Travel Mode Section
- `travel_mode` (ENUM) - Options: School Bus, Own
- `vehicle_number` (VARCHAR 20) - Vehicle registration number (when Own transport)
- `parent_or_staff_name` (VARCHAR 100) - Name of driver (when Own transport)
- `verified_tts_id` (VARCHAR 50) - Verified TTS ID with barcode support

#### 3. Medical Information Section
- `allergies` (TEXT) - JSON array of selected allergies
- `diabetic` (TINYINT) - Is diabetic (0=No, 1=Yes)
- `lifestyle_diseases` (TEXT) - Any lifestyle diseases
- `asthmatic` (TINYINT) - Is asthmatic (0=No, 1=Yes)
- `phobia` (TINYINT) - Has phobia (0=No, 1=Yes)

#### 4. Family Doctor Information
- `doctor_name` (VARCHAR 100) - Family doctor name
- `doctor_contact` (VARCHAR 15) - Doctor contact number
- `clinic_address` (TEXT) - Doctor clinic address

#### 5. Blood Group
- `blood_group` (ENUM) - Options: A+, A-, B+, B-, O+, O-, AB+, AB-

#### 6. Document Uploads
- `student_photo_url` (VARCHAR 255) - Student photograph URL
- `id_proof_url` (VARCHAR 255) - ID proof document URL
- `address_proof_url` (VARCHAR 255) - Address proof document URL

#### 7. Student Aspirations
- `student_aspirations` (TEXT) - Student aspirations (teacher editable only)

### Running the Migration

```bash
# Connect to MySQL
mysql -u username -p school_management

# Run the migration
source /path/to/backend/database/update_students_comprehensive_fields.sql
```

---

## Backend Updates

### 1. Admin Controller Updates
**File:** `/backend/application/controllers/api/Admin.php`

#### New Validation Rules
Updated `students()` POST and PUT methods to include validation for:
- emergency_contact_number (max 15 chars)
- gender (must be Male, Female, or Other)
- travel_mode (must be School Bus or Own)
- blood_group (must be valid blood type)
- All medical information fields
- Document URLs
- Student aspirations

#### New Upload Endpoint
```php
POST /api/admin/upload_student_document
```

**Parameters:**
- `file` - The file to upload
- `document_type` - One of: student_photo, id_proof, address_proof

**Response:**
```json
{
  "status": "success",
  "data": {
    "url": "backend/uploads/student_photos/abc123.jpg",
    "file_name": "abc123.jpg",
    "file_type": "image/jpeg",
    "file_size": 150000,
    "document_type": "student_photo"
  }
}
```

**Validation:**
- Max file size: 2MB
- Allowed types for photo: JPG, JPEG, PNG
- Allowed types for proofs: JPG, JPEG, PNG, PDF

### 2. Upload Directories Created
```
backend/uploads/
├── student_photos/
├── student_id_proofs/
└── student_address_proofs/
```

---

## Frontend Enhancements

### 1. New Dependencies Installed
```bash
npm install react-barcode jspdf jspdf-autotable
```

### 2. New Components & Features

#### Emergency Contact Section
- Emergency contact number input (10-digit validation)
- Gender dropdown (Male/Female/Other)

#### Blood Group Section
- Dropdown with all blood group options (A+, A-, B+, B-, O+, O-, AB+, AB-)

#### Travel Mode Section
- Travel mode dropdown (School Bus/Own)
- **Conditional rendering** when "Own" is selected:
  - Vehicle number input
  - Parent/Staff name input
  - Verified TTS ID input with **real-time barcode display**

#### Medical Information Section (Accordion)
- **Expandable/collapsible** accordion for better UX
- Multi-select dropdown for allergies with 32 predefined options:
  - No known allergies
  - Food allergies (Peanut, Tree nuts, Dairy, Egg, Soy, Wheat, etc.)
  - Environmental allergies (Pollen, Dust mite, Mold, etc.)
  - Drug allergies (Penicillin, NSAIDs, etc.)
  - Other allergies (Latex, Nickel, etc.)
- Toggle switches for:
  - Diabetic (Yes/No)
  - Asthmatic (Yes/No)
  - Has Phobia (Yes/No)
- Text area for lifestyle diseases

#### Family Doctor Information Section
- Doctor name input
- Doctor contact number input
- Clinic address textarea

#### Documents & Photos Upload Section
- Three file upload fields:
  1. **Student Photograph** (JPG/PNG, max 2MB)
  2. **ID Proof** (JPG/PNG/PDF, max 2MB)
  3. **Address Proof** (JPG/PNG/PDF, max 2MB)
- Real-time preview for images
- PDF indicator badge for PDF documents
- Upload progress handling
- File size and type validation

#### Student Aspirations Section
- **Teacher-only access** (hidden for other roles)
- Rich textarea for entering student aspirations
- Helpful info text indicating teacher-only access
- Max 2000 characters

#### Student ID Card Generation
- New button in student actions column
- Generates credit-card-sized PDF ID card with:
  - School name
  - Student photo placeholder
  - Student name
  - Roll number
  - Class (Grade & Division)
  - TTS ID (if available)
- One-click download as PDF
- Uses jsPDF library

---

## New Features

### 1. Emergency Contact Management
Track emergency contact information for each student with proper validation.

### 2. Travel Mode Tracking
- Monitor how students travel to school
- For students with own transport:
  - Track vehicle details
  - Record driver information
  - Generate and verify TTS IDs with barcodes

### 3. Comprehensive Medical Records
- Maintain detailed allergy information
- Track chronic conditions (diabetes, asthma)
- Record lifestyle diseases
- Document phobias
- All information expandable to save screen space

### 4. Family Doctor Integration
- Store family doctor contact information
- Quick access to medical support contacts
- Clinic location tracking

### 5. Document Management
- Upload and store student photographs
- Maintain digital copies of ID proofs
- Store address verification documents
- Image preview functionality
- PDF support with indicators

### 6. Blood Group Tracking
- Essential for medical emergencies
- Quick reference for school nurses
- Integrated into student profile

### 7. Student Aspirations (Teacher Feature)
- Teachers can document student career goals
- Helps in guidance and counseling
- Role-based access control
- Appears in student reports

### 8. ID Card Generation
- One-click ID card generation
- Professional PDF format
- Includes all essential student information
- Download and print ready

---

## Installation & Setup

### Step 1: Database Migration
```bash
mysql -u root -p school_management < backend/database/update_students_comprehensive_fields.sql
```

### Step 2: Create Upload Directories
```bash
cd backend/uploads
mkdir -p student_photos student_id_proofs student_address_proofs
chmod 755 student_photos student_id_proofs student_address_proofs
```

### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install react-barcode jspdf jspdf-autotable
```

### Step 4: Verify File Upload Permissions
Ensure the backend can write to upload directories:
```bash
chown -R www-data:www-data backend/uploads/
chmod -R 755 backend/uploads/
```

---

## Usage Guide

### Adding/Editing a Student

1. **Navigate to Student Management**
   - Go to Admin Dashboard → Student Management

2. **Click "Add New Student" or Edit existing student**

3. **Fill Basic Information**
   - Personal Information (Name, Grade, Division, Roll Number)
   - Academic Information
   - Government IDs
   - Address Information

4. **Emergency Contact**
   - Enter 10-digit emergency contact number
   - Select gender

5. **Blood Group**
   - Select from dropdown

6. **Travel Mode**
   - Select "School Bus" or "Own"
   - If "Own" selected:
     - Enter vehicle number
     - Enter driver name
     - Enter TTS ID
     - View generated barcode

7. **Medical Information**
   - Click to expand accordion
   - Select all applicable allergies
   - Toggle switches for chronic conditions
   - Enter lifestyle diseases if any

8. **Family Doctor**
   - Enter doctor name
   - Enter contact number
   - Enter clinic address

9. **Upload Documents**
   - Click "Choose File" for each document type
   - Wait for upload confirmation
   - Preview uploaded images

10. **Student Aspirations** (Teachers Only)
    - Enter student's career goals and aspirations
    - This field only visible to teachers

11. **Click "Create Student" or "Update Student"**

### Generating Student ID Card

1. **Locate Student** in the student list
2. **Click ID Card Icon** (📇) in the Actions column
3. **PDF downloads automatically**
4. **Print or save** as needed

### Viewing Student Documents

1. **Edit the student**
2. **Scroll to Documents section**
3. **View image previews** or **PDF indicators**
4. **Re-upload** if needed

---

## API Endpoints

### Upload Document
```
POST /api/admin/upload_student_document
Content-Type: multipart/form-data

Body:
- file: <binary>
- document_type: student_photo|id_proof|address_proof
```

### Create Student (Updated)
```
POST /api/admin/students

All previous fields plus:
- emergency_contact_number
- gender
- travel_mode
- vehicle_number
- parent_or_staff_name
- verified_tts_id
- allergies (JSON string)
- diabetic (0/1)
- lifestyle_diseases
- asthmatic (0/1)
- phobia (0/1)
- doctor_name
- doctor_contact
- clinic_address
- blood_group
- student_photo_url
- id_proof_url
- address_proof_url
- student_aspirations
```

### Update Student (Updated)
```
PUT /api/admin/students/{id}

Same fields as create
```

---

## Security Considerations

1. **File Upload Validation**
   - File type restrictions enforced
   - File size limits (2MB max)
   - Server-side validation

2. **Role-Based Access**
   - Student aspirations only visible/editable by teachers
   - Document upload restricted to authorized users

3. **Data Privacy**
   - Medical information stored securely
   - Emergency contacts protected
   - Document URLs not publicly accessible

---

## Troubleshooting

### Upload Errors
```
Issue: "Upload failed: Permission denied"
Solution: Check directory permissions
chmod 755 backend/uploads/student_*
```

### Barcode Not Displaying
```
Issue: Barcode component not rendering
Solution: Verify react-barcode installation
npm install react-barcode
```

### PDF Generation Fails
```
Issue: ID card PDF not downloading
Solution: Check jsPDF installation
npm install jspdf
```

### Allergies Not Saving
```
Issue: Allergies field empty after save
Solution: Ensure allergies are JSON stringified
Backend automatically converts string to JSON
```

---

## Future Enhancements

### Planned Features
1. **Bulk Document Upload** - Upload documents for multiple students
2. **Medical Alert Dashboard** - Quick view of students with medical conditions
3. **TTS Verification System** - Automated TTS ID verification
4. **QR Code Support** - Alternative to barcodes
5. **Digital Signature** - For consent forms
6. **Medical History Timeline** - Track medical changes over time

---

## Support

For issues or questions:
- Check the troubleshooting section
- Review API documentation
- Contact system administrator

---

## Version History

### v2.0.0 (Current)
- Added emergency contact fields
- Implemented travel mode tracking
- Created medical information section
- Added family doctor information
- Implemented document upload system
- Added blood group field
- Created student aspirations feature
- Implemented ID card generation
- Enhanced UI with accordions and conditional rendering

### v1.0.0
- Basic student management
- Fee management
- Attendance tracking

---

## Credits

Developed for School Management System
Date: November 2025

