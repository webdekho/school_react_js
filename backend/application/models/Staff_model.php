<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Staff_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    public function get_all_staff($filters = []) {
        // Check if roles table and role_id column exist
        $tables = $this->db->list_tables();
        $has_roles_table = in_array('roles', $tables);
        
        if ($has_roles_table && $this->db->field_exists('role_id', 'staff')) {
            $this->db->select('staff.*, roles.name as role_name');
            $this->db->from('staff');
            $this->db->join('roles', 'staff.role_id = roles.id', 'left');
        } else {
            $this->db->select('staff.*, staff.role_name');
            $this->db->from('staff');
        }
        $this->db->where('staff.is_active', 1);
        
        if (!empty($filters['search'])) {
            $this->db->group_start();
            $this->db->like('staff.name', $filters['search']);
            $this->db->or_like('staff.mobile', $filters['search']);
            $this->db->or_like('staff.email', $filters['search']);
            $this->db->group_end();
        }
        
        if (!empty($filters['role_id'])) {
            $this->db->where('staff.role_id', $filters['role_id']);
        }
        
        $this->db->order_by('staff.name');
        
        if (isset($filters['limit'])) {
            $this->db->limit($filters['limit'], $filters['offset']);
        }
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    public function get_staff_paginated($limit, $offset, $search = null, $role_id = null) {
        // Check if roles table and role_id column exist
        $tables = $this->db->list_tables();
        $has_roles_table = in_array('roles', $tables);
        
        if ($has_roles_table && $this->db->field_exists('role_id', 'staff')) {
            $this->db->select('staff.*, roles.name as role_name');
            $this->db->from('staff');
            $this->db->join('roles', 'staff.role_id = roles.id', 'left');
            // Exclude super_admin role from the list
            $this->db->where('roles.name !=', 'super_admin');
        } else {
            $this->db->select('staff.*, staff.role_name');
            $this->db->from('staff');
            // If no roles table, exclude by role_name column
            if ($this->db->field_exists('role_name', 'staff')) {
                $this->db->where('staff.role_name !=', 'super_admin');
            }
        }
        $this->db->where('staff.is_active', 1);
        
        if ($search) {
            $this->db->group_start();
            $this->db->like('staff.name', $search);
            $this->db->or_like('staff.mobile', $search);
            $this->db->or_like('staff.email', $search);
            $this->db->group_end();
        }
        
        if ($role_id && $has_roles_table && $this->db->field_exists('role_id', 'staff')) {
            $this->db->where('staff.role_id', $role_id);
        }
        
        $this->db->order_by('staff.name');
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get();
        $staff = $query->result_array();
        
        // Add assignment counts for each staff member
        foreach ($staff as &$member) {
            $member['grade_count'] = $this->count_staff_grades($member['id']);
            $member['division_count'] = $this->count_staff_divisions($member['id']);
        }
        
        return $staff;
    }
    
    public function get_staff_by_id($id) {
        // Check if roles table and role_id column exist
        $tables = $this->db->list_tables();
        $has_roles_table = in_array('roles', $tables);
        
        if ($has_roles_table && $this->db->field_exists('role_id', 'staff')) {
            $this->db->select('staff.*, roles.name as role_name, roles.permissions');
            $this->db->from('staff');
            $this->db->join('roles', 'staff.role_id = roles.id', 'left');
        } else {
            $this->db->select('staff.*, staff.role_name, "" as permissions');
            $this->db->from('staff');
        }
        $this->db->where('staff.id', $id);
        $this->db->where('staff.is_active', 1);
        
        $query = $this->db->get();
        $staff = $query->row_array();
        
        if ($staff) {
            // Get assigned grades and divisions
            $staff['assigned_grades'] = $this->get_staff_grades($id);
            $staff['assigned_divisions'] = $this->get_staff_divisions($id);
        }
        
        return $staff;
    }
    
    public function create_staff($data) {
        $grades = isset($data['grades']) ? $data['grades'] : [];
        $divisions = isset($data['divisions']) ? $data['divisions'] : [];
        
        unset($data['grades'], $data['divisions']);
        
        $data['password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
        unset($data['password']);
        
        // Ensure numeric fields are properly formatted
        if (isset($data['basic_salary'])) {
            $data['basic_salary'] = (float) $data['basic_salary'];
        }
        if (isset($data['allowances'])) {
            $data['allowances'] = (float) $data['allowances'];
        }
        if (isset($data['deductions'])) {
            $data['deductions'] = (float) $data['deductions'];
        }
        if (isset($data['pf_contribution'])) {
            $data['pf_contribution'] = (float) $data['pf_contribution'];
        }
        
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        $this->db->trans_start();
        
        if ($this->db->insert('staff', $data)) {
            $staff_id = $this->db->insert_id();
            
            // Assign grades
            if (!empty($grades)) {
                $this->assign_grades_to_staff($staff_id, $grades);
            }
            
            // Assign divisions
            if (!empty($divisions)) {
                $this->assign_divisions_to_staff($staff_id, $divisions);
            }
            
            $this->db->trans_complete();
            
            if ($this->db->trans_status() === FALSE) {
                return false;
            }
            
            return $staff_id;
        }
        
        $this->db->trans_complete();
        return false;
    }
    
    public function update_staff($id, $data) {
        $grades = isset($data['grades']) ? $data['grades'] : null;
        $divisions = isset($data['divisions']) ? $data['divisions'] : null;
        
        unset($data['grades'], $data['divisions']);
        
        if (isset($data['password'])) {
            $data['password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
            unset($data['password']);
        }
        
        // Ensure numeric fields are properly formatted
        if (isset($data['basic_salary'])) {
            $data['basic_salary'] = (float) $data['basic_salary'];
        }
        if (isset($data['allowances'])) {
            $data['allowances'] = (float) $data['allowances'];
        }
        if (isset($data['deductions'])) {
            $data['deductions'] = (float) $data['deductions'];
        }
        if (isset($data['pf_contribution'])) {
            $data['pf_contribution'] = (float) $data['pf_contribution'];
        }
        
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        $this->db->trans_start();
        
        $this->db->where('id', $id);
        $this->db->update('staff', $data);
        
        // Update grade assignments if provided
        if ($grades !== null) {
            $this->db->delete('staff_grades', ['staff_id' => $id]);
            if (!empty($grades)) {
                $this->assign_grades_to_staff($id, $grades);
            }
        }
        
        // Update division assignments if provided
        if ($divisions !== null) {
            $this->db->delete('staff_divisions', ['staff_id' => $id]);
            if (!empty($divisions)) {
                $this->assign_divisions_to_staff($id, $divisions);
            }
        }
        
        $this->db->trans_complete();
        
        return $this->db->trans_status() !== FALSE;
    }
    
    public function delete_staff($id) {
        $this->db->trans_start();
        
        // Remove grade and division assignments
        $this->db->delete('staff_grades', ['staff_id' => $id]);
        $this->db->delete('staff_divisions', ['staff_id' => $id]);
        
        // Soft delete staff
        $this->db->where('id', $id);
        $this->db->update('staff', ['is_active' => 0, 'updated_at' => date('Y-m-d H:i:s')]);
        
        $this->db->trans_complete();
        
        return $this->db->trans_status() !== FALSE;
    }
    
    public function search_staff($query) {
        // Check if roles table and role_id column exist
        $tables = $this->db->list_tables();
        $has_roles_table = in_array('roles', $tables);
        
        if ($has_roles_table && $this->db->field_exists('role_id', 'staff')) {
            $this->db->select('staff.id, staff.name, staff.mobile, staff.email, roles.name as role_name');
            $this->db->from('staff');
            $this->db->join('roles', 'staff.role_id = roles.id', 'left');
        } else {
            $this->db->select('staff.id, staff.name, staff.mobile, staff.email, staff.role_name');
            $this->db->from('staff');
        }
        $this->db->where('staff.is_active', 1);
        
        $this->db->group_start();
        $this->db->like('staff.name', $query);
        $this->db->or_like('staff.mobile', $query);
        $this->db->or_like('staff.email', $query);
        $this->db->group_end();
        
        $this->db->limit(20);
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    public function count_active_staff() {
        $this->db->where('is_active', 1);
        return $this->db->count_all_results('staff');
    }
    
    public function count_staff($search = null, $role_id = null) {
        // Check if roles table exists
        $tables = $this->db->list_tables();
        $has_roles_table = in_array('roles', $tables);
        
        if ($has_roles_table && $this->db->field_exists('role_id', 'staff')) {
            $this->db->from('staff');
            $this->db->join('roles', 'staff.role_id = roles.id', 'left');
            // Exclude super_admin role from count
            $this->db->where('roles.name !=', 'super_admin');
        } else {
            $this->db->from('staff');
            // If no roles table, exclude by role_name column
            if ($this->db->field_exists('role_name', 'staff')) {
                $this->db->where('staff.role_name !=', 'super_admin');
            }
        }
        $this->db->where('staff.is_active', 1);
        
        if ($search) {
            $this->db->group_start();
            $this->db->like('staff.name', $search);
            $this->db->or_like('staff.mobile', $search);
            $this->db->or_like('staff.email', $search);
            $this->db->group_end();
        }
        
        if ($role_id) {
            $this->db->where('staff.role_id', $role_id);
        }
        
        return $this->db->count_all_results();
    }
    
    public function get_staff_by_mobile($mobile) {
        $this->db->select('staff.*, roles.name as role_name, roles.permissions');
        $this->db->from('staff');
        $this->db->join('roles', 'staff.role_id = roles.id');
        $this->db->where('staff.mobile', $mobile);
        $this->db->where('staff.is_active', 1);
        
        $query = $this->db->get();
        return $query->row_array();
    }
    
    private function assign_grades_to_staff($staff_id, $grades) {
        foreach ($grades as $grade_id) {
            $this->db->insert('staff_grades', [
                'staff_id' => $staff_id,
                'grade_id' => $grade_id,
                'created_at' => date('Y-m-d H:i:s')
            ]);
        }
    }
    
    private function assign_divisions_to_staff($staff_id, $divisions) {
        foreach ($divisions as $division_id) {
            $this->db->insert('staff_divisions', [
                'staff_id' => $staff_id,
                'division_id' => $division_id,
                'created_at' => date('Y-m-d H:i:s')
            ]);
        }
    }
    
    private function get_staff_grades($staff_id) {
        $this->db->select('grades.id, grades.name');
        $this->db->from('staff_grades');
        $this->db->join('grades', 'staff_grades.grade_id = grades.id');
        $this->db->where('staff_grades.staff_id', $staff_id);
        $this->db->where('grades.is_active', 1);
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    private function get_staff_divisions($staff_id) {
        $this->db->select('divisions.id, divisions.name, grades.name as grade_name');
        $this->db->from('staff_divisions');
        $this->db->join('divisions', 'staff_divisions.division_id = divisions.id');
        $this->db->join('grades', 'divisions.grade_id = grades.id');
        $this->db->where('staff_divisions.staff_id', $staff_id);
        $this->db->where('divisions.is_active', 1);
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    private function count_staff_grades($staff_id) {
        $this->db->where('staff_id', $staff_id);
        return $this->db->count_all_results('staff_grades');
    }
    
    private function count_staff_divisions($staff_id) {
        $this->db->where('staff_id', $staff_id);
        return $this->db->count_all_results('staff_divisions');
    }
    
    public function get_roles_for_dropdown() {
        $this->db->select('id, name');
        $this->db->from('roles');
        $this->db->order_by('name');
        
        $query = $this->db->get();
        return $query->result_array();
    }
}