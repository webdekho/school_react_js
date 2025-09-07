<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Role_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    // Get all available permissions
    public function get_all_permissions() {
        return [
            // Dashboard
            'dashboard' => [
                'label' => 'Dashboard',
                'description' => 'View dashboard and analytics'
            ],
            
            // Academic Year Management
            'academic_years' => [
                'label' => 'Academic Years - Full Access',
                'description' => 'Create, read, update, delete academic years'
            ],
            'academic_years.view' => [
                'label' => 'Academic Years - View Only',
                'description' => 'View academic year information'
            ],
            
            // Grade Management
            'grades' => [
                'label' => 'Grades - Full Access',
                'description' => 'Create, read, update, delete grades'
            ],
            'grades.view' => [
                'label' => 'Grades - View Only',
                'description' => 'View grade information'
            ],
            
            // Division Management
            'divisions' => [
                'label' => 'Divisions - Full Access',
                'description' => 'Create, read, update, delete divisions'
            ],
            'divisions.view' => [
                'label' => 'Divisions - View Only',
                'description' => 'View division information'
            ],
            
            // Student Management
            'students' => [
                'label' => 'Students - Full Access',
                'description' => 'Create, read, update, delete students'
            ],
            'students.view' => [
                'label' => 'Students - View Only',
                'description' => 'View student information'
            ],
            'students.create' => [
                'label' => 'Students - Create',
                'description' => 'Add new students'
            ],
            'students.update' => [
                'label' => 'Students - Update',
                'description' => 'Edit student information'
            ],
            'students.delete' => [
                'label' => 'Students - Delete',
                'description' => 'Remove students'
            ],
            
            // Parent Management
            'parents' => [
                'label' => 'Parents - Full Access',
                'description' => 'Create, read, update, delete parents'
            ],
            'parents.view' => [
                'label' => 'Parents - View Only',
                'description' => 'View parent information'
            ],
            'parents.create' => [
                'label' => 'Parents - Create',
                'description' => 'Add new parents'
            ],
            'parents.update' => [
                'label' => 'Parents - Update',
                'description' => 'Edit parent information'
            ],
            'parents.delete' => [
                'label' => 'Parents - Delete',
                'description' => 'Remove parents'
            ],
            
            // Staff Management
            'staff' => [
                'label' => 'Staff - Full Access',
                'description' => 'Create, read, update, delete staff'
            ],
            'staff.view' => [
                'label' => 'Staff - View Only',
                'description' => 'View staff information'
            ],
            'staff.create' => [
                'label' => 'Staff - Create',
                'description' => 'Add new staff members'
            ],
            'staff.update' => [
                'label' => 'Staff - Update',
                'description' => 'Edit staff information'
            ],
            'staff.delete' => [
                'label' => 'Staff - Delete',
                'description' => 'Remove staff members'
            ],
            
            // Role Management
            'roles' => [
                'label' => 'Roles - Full Access',
                'description' => 'Create, read, update, delete roles and permissions'
            ],
            'roles.view' => [
                'label' => 'Roles - View Only',
                'description' => 'View roles and permissions'
            ],
            
            // Fee Management
            'fees' => [
                'label' => 'Fees - Full Access',
                'description' => 'Full access to fee management'
            ],
            'fees.view' => [
                'label' => 'Fees - View Only',
                'description' => 'View fee information'
            ],
            'fees.collect' => [
                'label' => 'Fees - Collect',
                'description' => 'Collect fee payments'
            ],
            'fees.structure' => [
                'label' => 'Fees - Manage Structure',
                'description' => 'Create and modify fee structures'
            ],
            'fees.verify' => [
                'label' => 'Fees - Verify Collections',
                'description' => 'Verify fee collections (Admin only)'
            ],
            
            // Announcement Management
            'announcements' => [
                'label' => 'Announcements - Full Access',
                'description' => 'Create, read, update, delete announcements'
            ],
            'announcements.view' => [
                'label' => 'Announcements - View Only',
                'description' => 'View announcements'
            ],
            'announcements.create' => [
                'label' => 'Announcements - Create',
                'description' => 'Create new announcements'
            ],
            'announcements.send' => [
                'label' => 'Announcements - Send',
                'description' => 'Send announcements to recipients'
            ],
            
            // Complaint Management
            'complaints' => [
                'label' => 'Complaints - Full Access',
                'description' => 'Manage all complaints'
            ],
            'complaints.view' => [
                'label' => 'Complaints - View',
                'description' => 'View complaints'
            ],
            'complaints.create' => [
                'label' => 'Complaints - Create',
                'description' => 'Submit new complaints'
            ],
            'complaints.assign' => [
                'label' => 'Complaints - Assign',
                'description' => 'Assign complaints to staff'
            ],
            'complaints.resolve' => [
                'label' => 'Complaints - Resolve',
                'description' => 'Resolve and close complaints'
            ],
            
            // Reports
            'reports' => [
                'label' => 'Reports - Full Access',
                'description' => 'Generate and view all reports'
            ],
            'reports.students' => [
                'label' => 'Reports - Student Reports',
                'description' => 'View student-related reports'
            ],
            'reports.fees' => [
                'label' => 'Reports - Fee Reports',
                'description' => 'View fee-related reports'
            ],
            'reports.export' => [
                'label' => 'Reports - Export',
                'description' => 'Export reports to various formats'
            ],
            
            // Search
            'search' => [
                'label' => 'Global Search',
                'description' => 'Use global search functionality'
            ],
            
            // System Settings
            'settings' => [
                'label' => 'System Settings',
                'description' => 'Manage system configuration'
            ],
            
            // Audit Logs
            'audit_logs' => [
                'label' => 'Audit Logs',
                'description' => 'View system audit logs'
            ]
        ];
    }
    
    // Get permission groups for organized display
    public function get_permission_groups() {
        return [
            'General' => ['dashboard', 'search'],
            'Academic Management' => ['academic_years', 'academic_years.view', 'grades', 'grades.view', 'divisions', 'divisions.view'],
            'User Management' => ['students', 'students.view', 'students.create', 'students.update', 'students.delete',
                                'parents', 'parents.view', 'parents.create', 'parents.update', 'parents.delete',
                                'staff', 'staff.view', 'staff.create', 'staff.update', 'staff.delete'],
            'Role & Permissions' => ['roles', 'roles.view'],
            'Fee Management' => ['fees', 'fees.view', 'fees.collect', 'fees.structure', 'fees.verify'],
            'Communication' => ['announcements', 'announcements.view', 'announcements.create', 'announcements.send',
                              'complaints', 'complaints.view', 'complaints.create', 'complaints.assign', 'complaints.resolve'],
            'Reports & Analytics' => ['reports', 'reports.students', 'reports.fees', 'reports.export'],
            'System' => ['settings', 'audit_logs']
        ];
    }
    
    // Get all roles
    public function get_all_roles() {
        $this->db->select('*');
        $this->db->from('roles');
        $this->db->order_by('id', 'ASC');
        $query = $this->db->get();
        
        $roles = $query->result_array();
        
        // Decode permissions JSON
        foreach ($roles as &$role) {
            $role['permissions'] = json_decode($role['permissions'], true) ?: [];
            $role['user_count'] = $this->count_users_by_role($role['id']);
        }
        
        return $roles;
    }
    
    // Get roles with pagination
    public function get_roles_paginated($limit, $offset, $search = null) {
        $this->db->select('*');
        $this->db->from('roles');
        
        if ($search) {
            $this->db->group_start();
            $this->db->like('name', $search);
            $this->db->or_like('description', $search);
            $this->db->group_end();
        }
        
        $this->db->order_by('id', 'ASC');
        $this->db->limit($limit, $offset);
        $query = $this->db->get();
        
        $roles = $query->result_array();
        
        // Decode permissions JSON
        foreach ($roles as &$role) {
            $role['permissions'] = json_decode($role['permissions'], true) ?: [];
            $role['user_count'] = $this->count_users_by_role($role['id']);
        }
        
        return $roles;
    }
    
    // Count total roles
    public function count_roles($search = null) {
        $this->db->from('roles');
        
        if ($search) {
            $this->db->group_start();
            $this->db->like('name', $search);
            $this->db->or_like('description', $search);
            $this->db->group_end();
        }
        
        return $this->db->count_all_results();
    }
    
    // Get role by ID
    public function get_role_by_id($id) {
        $this->db->where('id', $id);
        $query = $this->db->get('roles');
        $role = $query->row_array();
        
        if ($role) {
            $role['permissions'] = json_decode($role['permissions'], true) ?: [];
            $role['user_count'] = $this->count_users_by_role($role['id']);
        }
        
        return $role;
    }
    
    // Create new role
    public function create_role($data) {
        $insert_data = [
            'name' => $data['name'],
            'description' => $data['description'],
            'permissions' => json_encode($data['permissions'] ?: []),
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        if ($this->db->insert('roles', $insert_data)) {
            return $this->db->insert_id();
        }
        
        return false;
    }
    
    // Update role
    public function update_role($id, $data) {
        // Prevent updating super_admin role
        if ($id == 1) {
            return false;
        }
        
        $update_data = [
            'name' => $data['name'],
            'description' => $data['description'],
            'permissions' => json_encode($data['permissions'] ?: []),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        $this->db->where('id', $id);
        return $this->db->update('roles', $update_data);
    }
    
    // Delete role
    public function delete_role($id) {
        // Prevent deleting system roles
        if (in_array($id, [1, 2, 3, 4])) {
            return false;
        }
        
        // Check if role is in use
        if ($this->count_users_by_role($id) > 0) {
            return false;
        }
        
        $this->db->where('id', $id);
        return $this->db->delete('roles');
    }
    
    // Count users by role
    private function count_users_by_role($role_id) {
        $this->db->where('role_id', $role_id);
        $this->db->where('is_active', 1);
        return $this->db->count_all_results('staff');
    }
    
    // Check if role name exists
    public function role_exists($name, $exclude_id = null) {
        $this->db->where('name', $name);
        if ($exclude_id) {
            $this->db->where('id !=', $exclude_id);
        }
        return $this->db->count_all_results('roles') > 0;
    }
    
    // Get role permissions
    public function get_role_permissions($role_id) {
        $this->db->select('permissions');
        $this->db->where('id', $role_id);
        $query = $this->db->get('roles');
        $role = $query->row_array();
        
        if ($role) {
            return json_decode($role['permissions'], true) ?: [];
        }
        
        return [];
    }
    
    // Check if user has permission
    public function user_has_permission($user_id, $permission) {
        // Get user's role
        $this->db->select('role_id');
        $this->db->where('id', $user_id);
        $this->db->where('is_active', 1);
        $query = $this->db->get('staff');
        $user = $query->row_array();
        
        if (!$user) {
            return false;
        }
        
        $permissions = $this->get_role_permissions($user['role_id']);
        
        // Check for wildcard permission
        if (in_array('*', $permissions)) {
            return true;
        }
        
        // Check for specific permission
        return in_array($permission, $permissions);
    }
    
    // Get roles for dropdown
    public function get_roles_for_dropdown() {
        $this->db->select('id, name, description');
        $this->db->from('roles');
        $this->db->order_by('id', 'ASC');
        $query = $this->db->get();
        
        return $query->result_array();
    }
    
    // Duplicate role
    public function duplicate_role($id, $new_name) {
        $role = $this->get_role_by_id($id);
        if (!$role) {
            return false;
        }
        
        $data = [
            'name' => $new_name,
            'description' => $role['description'] . ' (Copy)',
            'permissions' => $role['permissions']
        ];
        
        return $this->create_role($data);
    }
}