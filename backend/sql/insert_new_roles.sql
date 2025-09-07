-- Insert only new roles that don't already exist

-- Update existing roles with better permissions
UPDATE roles 
SET permissions = '["dashboard", "academic_years", "grades", "divisions", "students", "parents", "staff", "roles", "fees", "announcements", "complaints", "reports", "search", "audit_logs"]',
    description = 'Administrator with full operational access'
WHERE id = 2;

UPDATE roles 
SET permissions = '["dashboard", "students.view", "students.create", "students.update", "parents.view", "fees.view", "fees.collect", "announcements.view", "complaints.view", "reports.students"]',
    description = 'General staff member with student and fee management access'
WHERE id = 3;

UPDATE roles 
SET permissions = '["dashboard", "students.view", "fees.view", "announcements.view", "complaints.create", "complaints.view"]',
    description = 'Parent with access to their children\'s information'
WHERE id = 4;

-- Insert new roles only if they don't exist
INSERT INTO roles (name, description, permissions, created_at, updated_at) 
SELECT * FROM (
    SELECT 'principal' as name, 'School Principal with administrative oversight' as description, 
    '["dashboard", "academic_years.view", "grades", "divisions", "students", "parents", "staff.view", "fees", "announcements", "complaints", "reports", "search"]' as permissions,
    NOW() as created_at, NOW() as updated_at
) AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'principal');

INSERT INTO roles (name, description, permissions, created_at, updated_at) 
SELECT * FROM (
    SELECT 'vice_principal' as name, 'Vice Principal with delegated administrative duties' as description,
    '["dashboard", "academic_years.view", "grades.view", "divisions.view", "students", "parents.view", "staff.view", "fees.view", "fees.structure", "announcements", "complaints.view", "complaints.assign", "reports"]' as permissions,
    NOW() as created_at, NOW() as updated_at
) AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'vice_principal');

INSERT INTO roles (name, description, permissions, created_at, updated_at) 
SELECT * FROM (
    SELECT 'academic_coordinator' as name, 'Manages academic programs and curriculum' as description,
    '["dashboard", "academic_years", "grades", "divisions", "students.view", "staff.view", "announcements.create", "announcements.send", "reports.students"]' as permissions,
    NOW() as created_at, NOW() as updated_at
) AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'academic_coordinator');

INSERT INTO roles (name, description, permissions, created_at, updated_at) 
SELECT * FROM (
    SELECT 'class_teacher' as name, 'Class teacher with access to their class students' as description,
    '["dashboard", "grades.view", "divisions.view", "students.view", "students.update", "parents.view", "announcements.view", "announcements.create", "complaints.view", "reports.students"]' as permissions,
    NOW() as created_at, NOW() as updated_at
) AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'class_teacher');

INSERT INTO roles (name, description, permissions, created_at, updated_at) 
SELECT * FROM (
    SELECT 'subject_teacher' as name, 'Subject teacher with limited class access' as description,
    '["dashboard", "grades.view", "divisions.view", "students.view", "announcements.view", "reports.students"]' as permissions,
    NOW() as created_at, NOW() as updated_at
) AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'subject_teacher');

INSERT INTO roles (name, description, permissions, created_at, updated_at) 
SELECT * FROM (
    SELECT 'accountant' as name, 'Financial officer managing fees and payments' as description,
    '["dashboard", "students.view", "parents.view", "fees", "reports.fees", "reports.export"]' as permissions,
    NOW() as created_at, NOW() as updated_at
) AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'accountant');

INSERT INTO roles (name, description, permissions, created_at, updated_at) 
SELECT * FROM (
    SELECT 'fee_collector' as name, 'Staff member responsible for fee collection' as description,
    '["dashboard", "students.view", "parents.view", "fees.view", "fees.collect", "reports.fees"]' as permissions,
    NOW() as created_at, NOW() as updated_at
) AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'fee_collector');

INSERT INTO roles (name, description, permissions, created_at, updated_at) 
SELECT * FROM (
    SELECT 'admission_officer' as name, 'Handles student admissions and enrollment' as description,
    '["dashboard", "academic_years.view", "grades.view", "divisions.view", "students.create", "students.view", "students.update", "parents.create", "parents.view", "parents.update"]' as permissions,
    NOW() as created_at, NOW() as updated_at
) AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'admission_officer');

INSERT INTO roles (name, description, permissions, created_at, updated_at) 
SELECT * FROM (
    SELECT 'hr_manager' as name, 'Human Resources manager for staff administration' as description,
    '["dashboard", "staff", "roles.view", "announcements.create", "announcements.send", "reports.export"]' as permissions,
    NOW() as created_at, NOW() as updated_at
) AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'hr_manager');

INSERT INTO roles (name, description, permissions, created_at, updated_at) 
SELECT * FROM (
    SELECT 'receptionist' as name, 'Front desk staff with basic information access' as description,
    '["dashboard", "students.view", "parents.view", "staff.view", "announcements.view", "complaints.create"]' as permissions,
    NOW() as created_at, NOW() as updated_at
) AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'receptionist');

INSERT INTO roles (name, description, permissions, created_at, updated_at) 
SELECT * FROM (
    SELECT 'librarian' as name, 'Library staff with student information access' as description,
    '["dashboard", "students.view", "announcements.view"]' as permissions,
    NOW() as created_at, NOW() as updated_at
) AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'librarian');

INSERT INTO roles (name, description, permissions, created_at, updated_at) 
SELECT * FROM (
    SELECT 'it_admin' as name, 'IT staff managing system and user accounts' as description,
    '["dashboard", "staff", "roles", "settings", "audit_logs", "announcements"]' as permissions,
    NOW() as created_at, NOW() as updated_at
) AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'it_admin');

INSERT INTO roles (name, description, permissions, created_at, updated_at) 
SELECT * FROM (
    SELECT 'transport_coordinator' as name, 'Manages school transportation' as description,
    '["dashboard", "students.view", "parents.view", "announcements.create", "complaints.view", "complaints.resolve"]' as permissions,
    NOW() as created_at, NOW() as updated_at
) AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'transport_coordinator');

INSERT INTO roles (name, description, permissions, created_at, updated_at) 
SELECT * FROM (
    SELECT 'exam_officer' as name, 'Manages examinations and results' as description,
    '["dashboard", "academic_years.view", "grades.view", "divisions.view", "students.view", "announcements.create", "reports.students", "reports.export"]' as permissions,
    NOW() as created_at, NOW() as updated_at
) AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'exam_officer');

INSERT INTO roles (name, description, permissions, created_at, updated_at) 
SELECT * FROM (
    SELECT 'counselor' as name, 'Student counselor with confidential access' as description,
    '["dashboard", "students.view", "parents.view", "complaints.view", "complaints.create"]' as permissions,
    NOW() as created_at, NOW() as updated_at
) AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'counselor');

INSERT INTO roles (name, description, permissions, created_at, updated_at) 
SELECT * FROM (
    SELECT 'guest' as name, 'Limited view-only access for visitors' as description,
    '["dashboard", "announcements.view"]' as permissions,
    NOW() as created_at, NOW() as updated_at
) AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'guest');

-- Display summary of roles
SELECT id, name, description, 
       CASE 
         WHEN permissions = '["*"]' THEN 'All Permissions'
         ELSE CONCAT(JSON_LENGTH(permissions), ' permissions')
       END as permission_count
FROM roles 
ORDER BY id;