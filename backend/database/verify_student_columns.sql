-- Verify which columns exist in students table
SELECT 
    COLUMN_NAME, 
    COLUMN_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'students'
    AND COLUMN_NAME IN (
        'emergency_contact_number',
        'gender',
        'travel_mode',
        'vehicle_number',
        'parent_or_staff_name',
        'verified_tts_id',
        'allergies',
        'diabetic',
        'lifestyle_diseases',
        'asthmatic',
        'phobia',
        'doctor_name',
        'doctor_contact',
        'clinic_address',
        'blood_group',
        'student_photo_url',
        'id_proof_url',
        'address_proof_url',
        'student_aspirations'
    )
ORDER BY ORDINAL_POSITION;

-- If no results, columns don't exist yet - run alter_students_table.sql first

