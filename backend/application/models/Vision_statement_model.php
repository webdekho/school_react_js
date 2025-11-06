<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Vision_statement_model extends CI_Model {
    
    private $table = 'vision_statements';
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    /**
     * Get all vision statements with filters
     */
    public function get_all_vision_statements($filters = []) {
        $this->db->select('
            vs.*,
            s.name as staff_name,
            s.email as staff_email,
            g.name as grade_name
        ');
        $this->db->from($this->table . ' vs');
        $this->db->join('staff s', 's.id = vs.staff_id', 'left');
        $this->db->join('grades g', 'g.id = vs.grade_id', 'left');
        
        // Apply filters
        if (isset($filters['grade_id']) && $filters['grade_id'] !== '') {
            $this->db->where('vs.grade_id', $filters['grade_id']);
        }
        
        if (isset($filters['staff_id']) && $filters['staff_id'] !== '') {
            $this->db->where('vs.staff_id', $filters['staff_id']);
        }
        
        if (isset($filters['search']) && $filters['search'] !== '') {
            $this->db->group_start();
            $this->db->like('vs.vision', $filters['search']);
            $this->db->or_like('s.name', $filters['search']);
            $this->db->group_end();
        }
        
        $this->db->order_by('vs.created_date', 'DESC');
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    /**
     * Get vision statements with pagination
     */
    public function get_vision_statements_paginated($limit = 10, $offset = 0, $filters = []) {
        $this->db->select('
            vs.*,
            s.name as staff_name,
            s.email as staff_email,
            g.name as grade_name
        ');
        $this->db->from($this->table . ' vs');
        $this->db->join('staff s', 's.id = vs.staff_id', 'left');
        $this->db->join('grades g', 'g.id = vs.grade_id', 'left');
        
        // Apply filters
        if (isset($filters['grade_id']) && $filters['grade_id'] !== '') {
            $this->db->where('vs.grade_id', $filters['grade_id']);
        }
        
        if (isset($filters['staff_id']) && $filters['staff_id'] !== '') {
            $this->db->where('vs.staff_id', $filters['staff_id']);
        }
        
        if (isset($filters['search']) && $filters['search'] !== '') {
            $this->db->group_start();
            $this->db->like('vs.vision', $filters['search']);
            $this->db->or_like('s.name', $filters['search']);
            $this->db->group_end();
        }
        
        $this->db->order_by('vs.created_date', 'DESC');
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    /**
     * Count vision statements with filters
     */
    public function count_vision_statements($filters = []) {
        $this->db->from($this->table . ' vs');
        $this->db->join('staff s', 's.id = vs.staff_id', 'left');
        
        // Apply filters
        if (isset($filters['grade_id']) && $filters['grade_id'] !== '') {
            $this->db->where('vs.grade_id', $filters['grade_id']);
        }
        
        if (isset($filters['staff_id']) && $filters['staff_id'] !== '') {
            $this->db->where('vs.staff_id', $filters['staff_id']);
        }
        
        if (isset($filters['search']) && $filters['search'] !== '') {
            $this->db->group_start();
            $this->db->like('vs.vision', $filters['search']);
            $this->db->or_like('s.name', $filters['search']);
            $this->db->group_end();
        }
        
        return $this->db->count_all_results();
    }
    
    /**
     * Get vision statement by ID
     */
    public function get_vision_statement_by_id($id) {
        $this->db->select('
            vs.*,
            s.name as staff_name,
            s.email as staff_email,
            g.name as grade_name
        ');
        $this->db->from($this->table . ' vs');
        $this->db->join('staff s', 's.id = vs.staff_id', 'left');
        $this->db->join('grades g', 'g.id = vs.grade_id', 'left');
        $this->db->where('vs.id', $id);
        
        $query = $this->db->get();
        return $query->row_array();
    }
    
    /**
     * Create vision statement
     */
    public function create_vision_statement($data) {
        $insert_data = [
            'grade_id' => isset($data['grade_id']) ? (int)$data['grade_id'] : 0,
            'staff_id' => (int)$data['staff_id'],
            'vision' => $data['vision'],
            'created_date' => date('Y-m-d H:i:s')
        ];
        
        if ($this->db->insert($this->table, $insert_data)) {
            return $this->db->insert_id();
        }
        
        return false;
    }
    
    /**
     * Update vision statement
     */
    public function update_vision_statement($id, $data) {
        $update_data = [];
        
        if (isset($data['grade_id'])) {
            $update_data['grade_id'] = (int)$data['grade_id'];
        }
        
        if (isset($data['staff_id'])) {
            $update_data['staff_id'] = (int)$data['staff_id'];
        }
        
        if (isset($data['vision'])) {
            $update_data['vision'] = $data['vision'];
        }
        
        $update_data['updated_at'] = date('Y-m-d H:i:s');
        
        $this->db->where('id', $id);
        return $this->db->update($this->table, $update_data);
    }
    
    /**
     * Delete vision statement
     */
    public function delete_vision_statement($id) {
        $this->db->where('id', $id);
        return $this->db->delete($this->table);
    }
    
    /**
     * Get vision statements by staff
     */
    public function get_by_staff($staff_id) {
        $this->db->select('
            vs.*,
            s.name as staff_name,
            g.name as grade_name
        ');
        $this->db->from($this->table . ' vs');
        $this->db->join('staff s', 's.id = vs.staff_id', 'left');
        $this->db->join('grades g', 'g.id = vs.grade_id', 'left');
        $this->db->where('vs.staff_id', $staff_id);
        $this->db->order_by('vs.created_date', 'DESC');
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    /**
     * Get vision statements by grade
     */
    public function get_by_grade($grade_id) {
        $this->db->select('
            vs.*,
            s.name as staff_name,
            s.email as staff_email
        ');
        $this->db->from($this->table . ' vs');
        $this->db->join('staff s', 's.id = vs.staff_id', 'left');
        $this->db->where('vs.grade_id', $grade_id);
        $this->db->order_by('vs.created_date', 'DESC');
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    /**
     * Get global vision statements (grade_id = 0)
     */
    public function get_global_visions() {
        $this->db->select('
            vs.*,
            s.name as staff_name,
            s.email as staff_email
        ');
        $this->db->from($this->table . ' vs');
        $this->db->join('staff s', 's.id = vs.staff_id', 'left');
        $this->db->where('vs.grade_id', 0);
        $this->db->order_by('vs.created_date', 'DESC');
        
        $query = $this->db->get();
        return $query->result_array();
    }
}
