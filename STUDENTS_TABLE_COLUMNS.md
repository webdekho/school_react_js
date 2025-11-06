# Students Table - Complete Column List

## All Column Names (Original + New Fields)

### Original Fields
1. `id` - Primary Key (INT)
2. `student_name` - Student's full name (VARCHAR 100)
3. `roll_number` - Roll number (VARCHAR 20)
4. `admission_number` - Admission number (VARCHAR 20)
5. `academic_year_id` - Foreign key to academic_years (INT)
6. `grade_id` - Foreign key to grades (INT)
7. `division_id` - Foreign key to divisions (INT)
8. `parent_id` - Foreign key to parents (INT)
9. `date_of_birth` - Date of birth (DATE)
10. `address` - Student address (TEXT)
11. `mobile` - Mobile number (VARCHAR 15)
12. `email` - Email address (VARCHAR 100)
13. `admission_date` - Date of admission (DATE)
14. `previous_school` - Previous school name (VARCHAR 200)
15. `medical_conditions` - Medical conditions (TEXT)
16. `bus_route_id` - Bus route ID (INT)
17. `residential_address` - Residential address (TEXT)
18. `pincode` - Pincode (VARCHAR 10)
19. `sam_samagrah_id` - Sam Samagrah ID (VARCHAR 50)
20. `aapar_id` - AAPAR ID (VARCHAR 50)
21. `is_active` - Active status (TINYINT)
22. `created_at` - Creation timestamp (TIMESTAMP)
23. `updated_at` - Update timestamp (TIMESTAMP)

### NEW Fields Added

#### Emergency Contact Section
24. `emergency_contact_number` - Emergency contact (VARCHAR 15)
25. `gender` - Gender (ENUM: 'Male', 'Female', 'Other')

#### Travel Mode Section
26. `travel_mode` - Mode of travel (ENUM: 'School Bus', 'Own')
27. `vehicle_number` - Vehicle registration number (VARCHAR 20)
28. `parent_or_staff_name` - Driver name (VARCHAR 100)
29. `verified_tts_id` - TTS ID for barcode (VARCHAR 50)

#### Medical Information Section
30. `allergies` - JSON array of allergies (TEXT)
31. `diabetic` - Is diabetic (TINYINT: 0=No, 1=Yes)
32. `lifestyle_diseases` - Lifestyle diseases (TEXT)
33. `asthmatic` - Is asthmatic (TINYINT: 0=No, 1=Yes)
34. `phobia` - Has phobia (TINYINT: 0=No, 1=Yes)

#### Family Doctor Section
35. `doctor_name` - Family doctor name (VARCHAR 100)
36. `doctor_contact` - Doctor contact number (VARCHAR 15)
37. `clinic_address` - Clinic address (TEXT)

#### Blood Group
38. `blood_group` - Blood group (ENUM: 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-')

#### Documents Upload
39. `student_photo_url` - Student photo URL (VARCHAR 255)
40. `id_proof_url` - ID proof document URL (VARCHAR 255)
41. `address_proof_url` - Address proof URL (VARCHAR 255)

#### Student Aspirations
42. `student_aspirations` - Student aspirations (TEXT)

---

## SQL Query to View All Columns

```sql
DESCRIBE students;
```

OR

```sql
SELECT 
    COLUMN_NAME, 
    COLUMN_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT, 
    COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'school_management' 
    AND TABLE_NAME = 'students' 
ORDER BY ORDINAL_POSITION;
```

---

## Total Fields: 42 columns

### Breakdown:
- **Original fields:** 23
- **New fields added:** 19
- **Total:** 42 columns

---

## For API/Form Usage:

### Required Fields (Cannot be NULL):
- `student_name`
- `grade_id`
- `division_id`
- `parent_id`
- `roll_number`
- `admission_date`
- `academic_year_id`

### Optional Fields (Can be NULL):
All new fields (24-42) are optional

---

## Frontend Form Field Names (React State):

```javascript
{
  // Basic Info
  student_name: '',
  grade_id: '',
  division_id: '',
  roll_number: '',
  residential_address: '',
  pincode: '',
  sam_samagrah_id: '',
  aapar_id: '',
  admission_date: '',
  parent_id: '',
  
  // Emergency Contact
  emergency_contact_number: '',
  gender: '',
  
  // Travel Mode
  travel_mode: '',
  vehicle_number: '',
  parent_or_staff_name: '',
  verified_tts_id: '',
  
  // Medical Information
  allergies: [],
  diabetic: false,
  lifestyle_diseases: '',
  asthmatic: false,
  phobia: false,
  
  // Family Doctor
  doctor_name: '',
  doctor_contact: '',
  clinic_address: '',
  
  // Blood Group
  blood_group: '',
  
  // Documents
  student_photo_url: '',
  id_proof_url: '',
  address_proof_url: '',
  
  // Student Aspirations
  student_aspirations: ''
}
```

---

## Database Migration File:
`/backend/database/update_students_comprehensive_fields.sql`

Run this SQL file to add all new columns to your existing students table.

