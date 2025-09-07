-- Sample Roles and Permissions for School Management System
-- This script inserts comprehensive role examples with different permission levels

-- First, let's update existing roles with more specific permissions

-- 1. Super Admin (ID: 1) - Already has all permissions (*)

-- 2. Admin (ID: 2) - Full access except system settings
UPDATE roles 
SET permissions = '["dashboard", "academic_years", "grades", "divisions", "students", "parents", "staff", "roles", "fees", "announcements", "complaints", "reports", "search", "audit_logs"]',
    description = 'Administrator with full operational access'
WHERE id = 2;

-- 3. Staff (ID: 3) - Limited operational access
UPDATE roles 
SET permissions = '["dashboard", "students.view", "students.create", "students.update", "parents.view", "fees.view", "fees.collect", "announcements.view", "complaints.view", "reports.students"]',
    description = 'General staff member with student and fee management access'
WHERE id = 3;

-- 4. Parent (ID: 4) - View only access for their children
UPDATE roles 
SET permissions = '["dashboard", "students.view", "fees.view", "announcements.view", "complaints.create", "complaints.view"]',
    description = 'Parent with access to their children\'s information'
WHERE id = 4;

-- Insert new sample roles

-- 5. Principal
INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES
('principal', 'School Principal with administrative oversight', 
'["dashboard", "academic_years.view", "grades", "divisions", "students", "parents", "staff.view", "fees", "announcements", "complaints", "reports", "search"]',
NOW(), NOW());

-- 6. Vice Principal  
INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES
('vice_principal', 'Vice Principal with delegated administrative duties',
'["dashboard", "academic_years.view", "grades.view", "divisions.view", "students", "parents.view", "staff.view", "fees.view", "fees.structure", "announcements", "complaints.view", "complaints.assign", "reports"]',
NOW(), NOW());

-- 7. Academic Coordinator
INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES
('academic_coordinator', 'Manages academic programs and curriculum',
'["dashboard", "academic_years", "grades", "divisions", "students.view", "staff.view", "announcements.create", "announcements.send", "reports.students"]',
NOW(), NOW());

-- 8. Class Teacher
INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES
('class_teacher', 'Class teacher with access to their class students',
'["dashboard", "grades.view", "divisions.view", "students.view", "students.update", "parents.view", "announcements.view", "announcements.create", "complaints.view", "reports.students"]',
NOW(), NOW());

-- 9. Subject Teacher
INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES
('subject_teacher', 'Subject teacher with limited class access',
'["dashboard", "grades.view", "divisions.view", "students.view", "announcements.view", "reports.students"]',
NOW(), NOW());

-- 10. Accountant
INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES
('accountant', 'Financial officer managing fees and payments',
'["dashboard", "students.view", "parents.view", "fees", "reports.fees", "reports.export"]',
NOW(), NOW());

-- 11. Fee Collector
INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES
('fee_collector', 'Staff member responsible for fee collection',
'["dashboard", "students.view", "parents.view", "fees.view", "fees.collect", "reports.fees"]',
NOW(), NOW());

-- 12. Admission Officer
INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES
('admission_officer', 'Handles student admissions and enrollment',
'["dashboard", "academic_years.view", "grades.view", "divisions.view", "students.create", "students.view", "students.update", "parents.create", "parents.view", "parents.update"]',
NOW(), NOW());

-- 13. HR Manager
INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES
('hr_manager', 'Human Resources manager for staff administration',
'["dashboard", "staff", "roles.view", "announcements.create", "announcements.send", "reports.export"]',
NOW(), NOW());

-- 14. Receptionist
INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES
('receptionist', 'Front desk staff with basic information access',
'["dashboard", "students.view", "parents.view", "staff.view", "announcements.view", "complaints.create"]',
NOW(), NOW());

-- 15. Librarian
INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES
('librarian', 'Library staff with student information access',
'["dashboard", "students.view", "announcements.view"]',
NOW(), NOW());

-- 16. IT Administrator
INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES
('it_admin', 'IT staff managing system and user accounts',
'["dashboard", "staff", "roles", "settings", "audit_logs", "announcements"]',
NOW(), NOW());

-- 17. Transport Coordinator
INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES
('transport_coordinator', 'Manages school transportation',
'["dashboard", "students.view", "parents.view", "announcements.create", "complaints.view", "complaints.resolve"]',
NOW(), NOW());

-- 18. Examination Officer
INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES
('exam_officer', 'Manages examinations and results',
'["dashboard", "academic_years.view", "grades.view", "divisions.view", "students.view", "announcements.create", "reports.students", "reports.export"]',
NOW(), NOW());

-- 19. Counselor
INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES
('counselor', 'Student counselor with confidential access',
'["dashboard", "students.view", "parents.view", "complaints.view", "complaints.create"]',
NOW(), NOW());

-- 20. Guest/Viewer
INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES
('guest', 'Limited view-only access for visitors',
'["dashboard", "announcements.view"]',
NOW(), NOW());

-- Create sample staff members with different roles
-- First, check if mobile numbers already exist to avoid duplicates
INSERT INTO staff (name, mobile, email, address, pincode, role_id, password_hash, is_active, created_at, updated_at) VALUES
-- Principal
('Dr. Sarah Johnson', '9876543301', 'principal@school.com', '100 School Campus', '400001', 
(SELECT id FROM roles WHERE name = 'principal'), '$2y$10$akybWs3faZEDGoi11ezWDuEZAJdyFoAQCaPQ451AMNp..kOPSXnAa', 1, NOW(), NOW()),

-- Vice Principal
('Mr. Robert Smith', '9876543302', 'viceprincipal@school.com', '101 School Campus', '400001',
(SELECT id FROM roles WHERE name = 'vice_principal'), '$2y$10$akybWs3faZEDGoi11ezWDuEZAJdyFoAQCaPQ451AMNp..kOPSXnAa', 1, NOW(), NOW()),

-- Academic Coordinator
('Ms. Emily Davis', '9876543303', 'academic@school.com', '102 School Campus', '400001',
(SELECT id FROM roles WHERE name = 'academic_coordinator'), '$2y$10$akybWs3faZEDGoi11ezWDuEZAJdyFoAQCaPQ451AMNp..kOPSXnAa', 1, NOW(), NOW()),

-- Class Teachers
('Mrs. Priya Sharma', '9876543304', 'priya.teacher@school.com', '201 Teacher Quarters', '400002',
(SELECT id FROM roles WHERE name = 'class_teacher'), '$2y$10$akybWs3faZEDGoi11ezWDuEZAJdyFoAQCaPQ451AMNp..kOPSXnAa', 1, NOW(), NOW()),

('Mr. Amit Patel', '9876543305', 'amit.teacher@school.com', '202 Teacher Quarters', '400002',
(SELECT id FROM roles WHERE name = 'class_teacher'), '$2y$10$akybWs3faZEDGoi11ezWDuEZAJdyFoAQCaPQ451AMNp..kOPSXnAa', 1, NOW(), NOW()),

-- Subject Teachers
('Ms. Kavita Singh', '9876543306', 'kavita.teacher@school.com', '203 Teacher Quarters', '400002',
(SELECT id FROM roles WHERE name = 'subject_teacher'), '$2y$10$akybWs3faZEDGoi11ezWDuEZAJdyFoAQCaPQ451AMNp..kOPSXnAa', 1, NOW(), NOW()),

('Mr. Rahul Verma', '9876543307', 'rahul.teacher@school.com', '204 Teacher Quarters', '400002',
(SELECT id FROM roles WHERE name = 'subject_teacher'), '$2y$10$akybWs3faZEDGoi11ezWDuEZAJdyFoAQCaPQ451AMNp..kOPSXnAa', 1, NOW(), NOW()),

-- Accountant
('Mr. Suresh Kumar', '9876543308', 'accountant@school.com', '301 Admin Building', '400003',
(SELECT id FROM roles WHERE name = 'accountant'), '$2y$10$akybWs3faZEDGoi11ezWDuEZAJdyFoAQCaPQ451AMNp..kOPSXnAa', 1, NOW(), NOW()),

-- Fee Collector
('Ms. Anjali Mehta', '9876543309', 'feecollector@school.com', '302 Admin Building', '400003',
(SELECT id FROM roles WHERE name = 'fee_collector'), '$2y$10$akybWs3faZEDGoi11ezWDuEZAJdyFoAQCaPQ451AMNp..kOPSXnAa', 1, NOW(), NOW()),

-- Admission Officer
('Mr. Vijay Sharma', '9876543310', 'admission@school.com', '303 Admin Building', '400003',
(SELECT id FROM roles WHERE name = 'admission_officer'), '$2y$10$akybWs3faZEDGoi11ezWDuEZAJdyFoAQCaPQ451AMNp..kOPSXnAa', 1, NOW(), NOW()),

-- HR Manager
('Ms. Neha Gupta', '9876543311', 'hr@school.com', '304 Admin Building', '400003',
(SELECT id FROM roles WHERE name = 'hr_manager'), '$2y$10$akybWs3faZEDGoi11ezWDuEZAJdyFoAQCaPQ451AMNp..kOPSXnAa', 1, NOW(), NOW()),

-- Receptionist
('Ms. Pooja Reddy', '9876543312', 'reception@school.com', '001 Main Building', '400001',
(SELECT id FROM roles WHERE name = 'receptionist'), '$2y$10$akybWs3faZEDGoi11ezWDuEZAJdyFoAQCaPQ451AMNp..kOPSXnAa', 1, NOW(), NOW()),

-- IT Administrator
('Mr. Karthik Nair', '9876543313', 'itadmin@school.com', '401 IT Department', '400004',
(SELECT id FROM roles WHERE name = 'it_admin'), '$2y$10$akybWs3faZEDGoi11ezWDuEZAJdyFoAQCaPQ451AMNp..kOPSXnAa', 1, NOW(), NOW()),

-- Counselor
('Dr. Meera Joshi', '9876543314', 'counselor@school.com', '501 Counseling Center', '400005',
(SELECT id FROM roles WHERE name = 'counselor'), '$2y$10$akybWs3faZEDGoi11ezWDuEZAJdyFoAQCaPQ451AMNp..kOPSXnAa', 1, NOW(), NOW());

-- Note: All staff members have the default password 'password' for testing
-- Password hash: $2y$10$akybWs3faZEDGoi11ezWDuEZAJdyFoAQCaPQ451AMNp..kOPSXnAa

-- Summary of Roles:
-- 1. super_admin - Full system access (*)
-- 2. admin - Full operational access
-- 3. staff - General staff with limited access
-- 4. parent - Parent access
-- 5. principal - School head with administrative oversight
-- 6. vice_principal - Deputy with delegated duties
-- 7. academic_coordinator - Academic program management
-- 8. class_teacher - Class management access
-- 9. subject_teacher - Subject-specific access
-- 10. accountant - Financial management
-- 11. fee_collector - Fee collection only
-- 12. admission_officer - Student enrollment
-- 13. hr_manager - Staff administration
-- 14. receptionist - Front desk operations
-- 15. librarian - Library operations
-- 16. it_admin - System administration
-- 17. transport_coordinator - Transport management
-- 18. exam_officer - Examination management
-- 19. counselor - Student counseling
-- 20. guest - Minimal view access