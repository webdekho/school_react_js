# Role and Permission System Documentation

## Overview

The School Management System features a comprehensive role-based access control (RBAC) system that allows fine-grained permission management for different types of users.

## System Components

### 1. Roles
Roles define a collection of permissions that can be assigned to users. Each role has:
- **ID**: Unique identifier
- **Name**: Role name (must be unique)
- **Description**: Human-readable description
- **Permissions**: Array of permission strings
- **User Count**: Number of users assigned to this role

### 2. Permissions
Permissions control access to specific system features. They follow a hierarchical naming convention:
- `module` - Full access to a module
- `module.action` - Specific action within a module

## Available Permissions

### General
- `dashboard` - View dashboard and analytics
- `search` - Use global search functionality

### Academic Management
- `academic_years` - Full access to academic year management
- `academic_years.view` - View academic year information only
- `grades` - Full access to grade management
- `grades.view` - View grade information only
- `divisions` - Full access to division management
- `divisions.view` - View division information only

### User Management
- `students` - Full access to student management
- `students.view` - View student information
- `students.create` - Create new students
- `students.update` - Edit student information
- `students.delete` - Delete students
- `parents` - Full access to parent management
- `parents.view` - View parent information
- `parents.create` - Create new parents
- `parents.update` - Edit parent information
- `parents.delete` - Delete parents
- `staff` - Full access to staff management
- `staff.view` - View staff information
- `staff.create` - Create new staff members
- `staff.update` - Edit staff information
- `staff.delete` - Delete staff members

### Role & Permissions
- `roles` - Full access to role and permission management
- `roles.view` - View roles and permissions only

### Fee Management
- `fees` - Full access to fee management
- `fees.view` - View fee information
- `fees.collect` - Collect fee payments
- `fees.structure` - Create and modify fee structures
- `fees.verify` - Verify fee collections (Admin only)

### Communication
- `announcements` - Full access to announcement management
- `announcements.view` - View announcements
- `announcements.create` - Create new announcements
- `announcements.send` - Send announcements to recipients
- `complaints` - Full access to complaint management
- `complaints.view` - View complaints
- `complaints.create` - Submit new complaints
- `complaints.assign` - Assign complaints to staff
- `complaints.resolve` - Resolve and close complaints

### Reports & Analytics
- `reports` - Full access to all reports
- `reports.students` - View student-related reports
- `reports.fees` - View fee-related reports
- `reports.export` - Export reports to various formats

### System
- `settings` - Manage system configuration
- `audit_logs` - View system audit logs

## Predefined Roles

### System Roles (Cannot be deleted)

1. **Super Admin** (`super_admin`)
   - Permissions: `["*"]` (All permissions)
   - Description: Super Administrator with full system access
   - Users: System administrators

2. **Admin** (`admin`) 
   - Permissions: All operational permissions except system settings
   - Description: Administrator with full operational access
   - Users: School administrators

3. **Staff** (`staff`)
   - Permissions: Limited operational access
   - Description: General staff member with student and fee management access
   - Users: General staff members

4. **Parent** (`parent`)
   - Permissions: View-only access for student information
   - Description: Parent with access to their children's information
   - Users: Student parents

### Educational Staff Roles

5. **Principal** (`principal`)
   - Permissions: Administrative oversight with full student, parent, and fee access
   - Users: School principal

6. **Vice Principal** (`vice_principal`)
   - Permissions: Delegated administrative duties
   - Users: Vice principal, assistant principal

7. **Academic Coordinator** (`academic_coordinator`)
   - Permissions: Academic program and curriculum management
   - Users: Academic coordinators, department heads

8. **Class Teacher** (`class_teacher`)
   - Permissions: Access to their class students with update capabilities
   - Users: Class teachers, homeroom teachers

9. **Subject Teacher** (`subject_teacher`)
   - Permissions: Limited class access for subject teaching
   - Users: Subject-specific teachers

### Administrative Staff Roles

10. **Accountant** (`accountant`)
    - Permissions: Full fee management and financial reports
    - Users: School accountant, finance manager

11. **Fee Collector** (`fee_collector`)
    - Permissions: Fee collection and basic fee reports
    - Users: Fee collection staff

12. **Admission Officer** (`admission_officer`)
    - Permissions: Student enrollment and parent management
    - Users: Admission staff

13. **HR Manager** (`hr_manager`)
    - Permissions: Staff management and role viewing
    - Users: HR personnel

14. **Receptionist** (`receptionist`)
    - Permissions: Basic information access and complaint handling
    - Users: Front desk staff

### Support Staff Roles

15. **Librarian** (`librarian`)
    - Permissions: Basic student information access
    - Users: Library staff

16. **IT Admin** (`it_admin`)
    - Permissions: System administration and user management
    - Users: IT support staff

17. **Transport Coordinator** (`transport_coordinator`)
    - Permissions: Student information and transport-related complaints
    - Users: Transport management staff

18. **Exam Officer** (`exam_officer`)
    - Permissions: Student information and examination reports
    - Users: Examination staff

19. **Counselor** (`counselor`)
    - Permissions: Student and parent information with complaint access
    - Users: Student counselors

20. **Guest** (`guest`)
    - Permissions: Minimal view-only access
    - Users: Temporary access, observers

## API Endpoints

### Role Management
- `GET /api/admin/roles` - Get all roles
- `GET /api/admin/roles/{id}` - Get specific role
- `POST /api/admin/roles` - Create new role
- `PUT /api/admin/roles/{id}` - Update role
- `DELETE /api/admin/roles/{id}` - Delete role
- `POST /api/admin/duplicate_role/{id}` - Duplicate existing role

### Permission Management
- `GET /api/admin/permissions` - Get all permissions and groups

### Dropdown APIs
- `GET /api/admin/roles_dropdown` - Get roles for dropdown selection

## Frontend Interface

### Role Management Page (`/admin/roles`)
- View all roles in a table format
- Create new roles with permission assignment
- Edit existing roles (except super_admin)
- Duplicate roles for similar configurations
- Delete roles (with safety checks)

### Permission Assignment Interface
- Organized permission groups (tabs)
- Checkbox interface for permission selection
- "Select All" / "Deselect All" functionality per group
- Visual permission badges with color coding
- Wildcard permission option (`*`)

## Implementation Details

### Database Structure
```sql
CREATE TABLE roles (
    id int(11) PRIMARY KEY AUTO_INCREMENT,
    name varchar(50) UNIQUE NOT NULL,
    description text,
    permissions longtext, -- JSON array
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Permission Checking
The system uses the `require_permission()` method in controllers to check user permissions:
```php
if (!$this->require_permission('students.create')) {
    return; // Access denied
}
```

### Security Features
- System roles (1-4) cannot be deleted
- Super admin role cannot be edited
- Roles with assigned users cannot be deleted
- Audit logging for all role changes
- Permission validation on API calls

## Usage Examples

### Creating a Custom Role
```json
{
    "name": "custom_teacher",
    "description": "Custom teacher role with specific permissions",
    "permissions": [
        "dashboard",
        "students.view",
        "grades.view",
        "announcements.create"
    ]
}
```

### Checking Permissions in Frontend
```javascript
import { useAuth } from '../contexts/AuthContext';

const { hasPermission } = useAuth();

if (hasPermission('students.create')) {
    // Show create student button
}
```

## Best Practices

1. **Principle of Least Privilege**: Grant only necessary permissions
2. **Role Inheritance**: Use role duplication for similar roles
3. **Regular Auditing**: Review role assignments periodically
4. **Clear Naming**: Use descriptive role names and descriptions
5. **Permission Granularity**: Use specific permissions over broad access
6. **Documentation**: Keep role descriptions updated

## Testing Credentials

All sample staff members have been created with the password: `password`

Example logins:
- Principal: `9876543301` / `password`
- Accountant: `9876543308` / `password`
- Class Teacher: `9876543304` / `password`

## Troubleshooting

### Common Issues
1. **403 Forbidden**: User lacks required permission
2. **Role not found**: Role may have been deleted
3. **Permission denied**: Check user's role assignments

### Debug Commands
```bash
# Check user permissions
curl -H "Authorization: Bearer {token}" /api/admin/permissions

# View user roles
curl -H "Authorization: Bearer {token}" /api/admin/roles
```