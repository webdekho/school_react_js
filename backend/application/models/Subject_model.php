<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Subject_model extends CI_Model {
    
    private $table = 'subject';
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    /**
     * Get all subjects with pagination and filters
     */
    public function get_subjects_paginated($limit = 10, $offset = 0, $filters = []) {
        $this->db->select('
            subject.*,
            grades.name as grade_name
        ');
        $this->db->from($this->table);
        $this->db->join('grades', 'grades.id = subject.grade_id', 'left');
        
        // Apply filters
        if (isset($filters['grade_id']) && $filters['grade_id'] !== '') {
            $this->db->where('subject.grade_id', $filters['grade_id']);
        }
        
        if (isset($filters['search']) && $filters['search'] !== '') {
            $this->db->like('subject.subject_name', $filters['search']);
        }
        
        $this->db->order_by('grades.name', 'ASC');
        $this->db->order_by('subject.subject_name', 'ASC');
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    /**
     * Count subjects with filters
     */
    public function count_subjects($filters = []) {
        $this->db->from($this->table);
        
        if (isset($filters['grade_id']) && $filters['grade_id'] !== '') {
            $this->db->where('grade_id', $filters['grade_id']);
        }
        
        if (isset($filters['search']) && $filters['search'] !== '') {
            $this->db->like('subject_name', $filters['search']);
        }
        
        return $this->db->count_all_results();
    }
    
    /**
     * Get subject by ID
     */
    public function get_subject_by_id($id) {
        $this->db->select('
            subject.*,
            grades.name as grade_name
        ');
        $this->db->from($this->table);
        $this->db->join('grades', 'grades.id = subject.grade_id', 'left');
        $this->db->where('subject.id', $id);
        
        $query = $this->db->get();
        return $query->row_array();
    }
    
    /**
     * Get subjects by grade
     */
    public function get_subjects_by_grade($grade_id) {
        $this->db->where('grade_id', $grade_id);
        $this->db->order_by('subject_name', 'ASC');
        $query = $this->db->get($this->table);
        return $query->result_array();
    }
    
    /**
     * Get subjects for dropdown
     */
    public function get_subjects_dropdown($grade_id = null) {
        $this->db->select('id, subject_name, grade_id');
        $this->db->from($this->table);
        
        if ($grade_id) {
            $this->db->where('grade_id', $grade_id);
        }
        
        $this->db->order_by('subject_name', 'ASC');
        $query = $this->db->get();
        return $query->result_array();
    }
    
    /**
     * Create subject
     */
    public function create_subject($data) {
        $insert_data = [
            'subject_name' => $data['subject_name'],
            'grade_id' => (int)$data['grade_id'],
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        if ($this->db->insert($this->table, $insert_data)) {
            return $this->db->insert_id();
        }
        
        return false;
    }
    
    /**
     * Update subject
     */
    public function update_subject($id, $data) {
        $update_data = [];
        
        if (isset($data['subject_name'])) {
            $update_data['subject_name'] = $data['subject_name'];
        }
        
        if (isset($data['grade_id'])) {
            $update_data['grade_id'] = (int)$data['grade_id'];
        }
        
        $update_data['updated_at'] = date('Y-m-d H:i:s');
        
        $this->db->where('id', $id);
        return $this->db->update($this->table, $update_data);
    }
    
    /**
     * Delete subject
     */
    public function delete_subject($id) {
        $this->db->where('id', $id);
        return $this->db->delete($this->table);
    }
    
    /**
     * Check if subject name exists for grade
     */
    public function subject_exists($subject_name, $grade_id, $exclude_id = null) {
        $this->db->where('subject_name', $subject_name);
        $this->db->where('grade_id', $grade_id);
        
        if ($exclude_id) {
            $this->db->where('id !=', $exclude_id);
        }
        
        return $this->db->count_all_results($this->table) > 0;
    }
}

