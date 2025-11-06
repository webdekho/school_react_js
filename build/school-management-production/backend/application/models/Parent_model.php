<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Parent_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    public function get_parents_paginated($limit, $offset, $search = null) {
        $this->db->select('parents.*, COUNT(students.id) as student_count');
        $this->db->from('parents');
        $this->db->join('students', 'parents.id = students.parent_id AND students.is_active = 1', 'left');
        $this->db->where('parents.is_active', 1);
        
        if ($search) {
            $this->db->group_start();
            $this->db->like('parents.name', $search);
            $this->db->or_like('parents.mobile', $search);
            $this->db->or_like('parents.email', $search);
            $this->db->group_end();
        }
        
        $this->db->group_by('parents.id');
        $this->db->order_by('parents.name');
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    public function get_all_parents($filters = []) {
        $this->db->select('parents.*, COUNT(students.id) as student_count');
        $this->db->from('parents');
        $this->db->join('students', 'parents.id = students.parent_id AND students.is_active = 1', 'left');
        $this->db->where('parents.is_active', 1);
        
        if (!empty($filters['search'])) {
            $this->db->group_start();
            $this->db->like('parents.name', $filters['search']);
            $this->db->or_like('parents.mobile', $filters['search']);
            $this->db->or_like('parents.email', $filters['search']);
            $this->db->group_end();
        }
        
        $this->db->group_by('parents.id');
        $this->db->order_by('parents.name');
        
        if (isset($filters['limit'])) {
            $this->db->limit($filters['limit'], $filters['offset']);
        }
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    public function get_parent_by_id($id) {
        $this->db->select('parents.*, COUNT(students.id) as student_count');
        $this->db->from('parents');
        $this->db->join('students', 'parents.id = students.parent_id AND students.is_active = 1', 'left');
        $this->db->where('parents.id', $id);
        $this->db->where('parents.is_active', 1);
        $this->db->group_by('parents.id');
        
        $query = $this->db->get();
        return $query->row_array();
    }
    
    public function create_parent($data) {
        $data['password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
        unset($data['password']);
        
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        if ($this->db->insert('parents', $data)) {
            return $this->db->insert_id();
        }
        return false;
    }
    
    public function update_parent($id, $data) {
        if (isset($data['password'])) {
            $data['password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
            unset($data['password']);
        }
        
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        $this->db->where('id', $id);
        return $this->db->update('parents', $data);
    }
    
    public function delete_parent($id) {
        // Soft delete - set is_active to 0
        $this->db->where('id', $id);
        return $this->db->update('parents', ['is_active' => 0, 'updated_at' => date('Y-m-d H:i:s')]);
    }
    
    public function search_parents($query) {
        $this->db->select('parents.id, parents.name, parents.mobile, parents.email, COUNT(students.id) as student_count');
        $this->db->from('parents');
        $this->db->join('students', 'parents.id = students.parent_id AND students.is_active = 1', 'left');
        $this->db->where('parents.is_active', 1);
        
        $this->db->group_start();
        $this->db->like('parents.name', $query);
        $this->db->or_like('parents.mobile', $query);
        $this->db->or_like('parents.email', $query);
        $this->db->group_end();
        
        $this->db->group_by('parents.id');
        $this->db->limit(20);
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    public function get_parent_by_mobile($mobile) {
        $this->db->where('mobile', $mobile);
        $this->db->where('is_active', 1);
        
        $query = $this->db->get('parents');
        return $query->row_array();
    }
    
    public function count_parents($search = null) {
        $this->db->from('parents');
        $this->db->where('is_active', 1);
        
        if ($search) {
            $this->db->group_start();
            $this->db->like('name', $search);
            $this->db->or_like('mobile', $search);
            $this->db->or_like('email', $search);
            $this->db->group_end();
        }
        
        return $this->db->count_all_results();
    }
    
    public function get_parents_dropdown($search = null, $limit = 50) {
        $this->db->select('id, name, mobile, email');
        $this->db->from('parents');
        $this->db->where('is_active', 1);
        
        if ($search) {
            $this->db->group_start();
            $this->db->like('name', $search);
            $this->db->or_like('mobile', $search);
            $this->db->or_like('email', $search);
            $this->db->group_end();
        }
        
        $this->db->order_by('name', 'ASC');
        $this->db->limit($limit);
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    public function get_parents_by_staff_assignment($staff_id, $search = null, $limit = 50) {
        $sql = "SELECT DISTINCT parents.id, parents.name, parents.mobile, parents.email
                FROM parents 
                JOIN students ON parents.id = students.parent_id
                JOIN grades ON students.grade_id = grades.id
                JOIN divisions ON students.division_id = divisions.id
                WHERE parents.is_active = 1
                AND students.is_active = 1
                AND (
                    students.grade_id IN (SELECT grade_id FROM staff_grades WHERE staff_id = ?)
                    OR 
                    students.division_id IN (SELECT division_id FROM staff_divisions WHERE staff_id = ?)
                )";
        
        $params = [$staff_id, $staff_id];
        
        if ($search) {
            $sql .= " AND (parents.name LIKE ? OR parents.mobile LIKE ? OR parents.email LIKE ?)";
            $search_param = "%{$search}%";
            $params[] = $search_param;
            $params[] = $search_param;
            $params[] = $search_param;
        }
        
        $sql .= " ORDER BY parents.name ASC LIMIT ?";
        $params[] = intval($limit);
        
        $query = $this->db->query($sql, $params);
        return $query->result_array();
    }
}