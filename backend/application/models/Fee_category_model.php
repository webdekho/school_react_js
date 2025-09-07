<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Fee_category_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    public function get_fee_categories_paginated($limit, $offset, $search = null) {
        $this->db->select('fee_categories.*, COUNT(fee_structures.id) as structure_count');
        $this->db->from('fee_categories');
        $this->db->join('fee_structures', 'fee_categories.id = fee_structures.fee_category_id AND fee_structures.is_active = 1', 'left');
        $this->db->where('fee_categories.is_active', 1);
        
        if ($search) {
            $this->db->group_start();
            $this->db->like('fee_categories.name', $search);
            $this->db->or_like('fee_categories.description', $search);
            $this->db->group_end();
        }
        
        $this->db->group_by('fee_categories.id');
        $this->db->order_by('fee_categories.name');
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    public function count_fee_categories($search = null) {
        $this->db->from('fee_categories');
        $this->db->where('is_active', 1);
        
        if ($search) {
            $this->db->group_start();
            $this->db->like('name', $search);
            $this->db->or_like('description', $search);
            $this->db->group_end();
        }
        
        return $this->db->count_all_results();
    }
    
    public function get_fee_category_by_id($id) {
        $this->db->select('fee_categories.*, COUNT(fee_structures.id) as structure_count');
        $this->db->from('fee_categories');
        $this->db->join('fee_structures', 'fee_categories.id = fee_structures.fee_category_id AND fee_structures.is_active = 1', 'left');
        $this->db->where('fee_categories.id', $id);
        $this->db->where('fee_categories.is_active', 1);
        $this->db->group_by('fee_categories.id');
        
        $query = $this->db->get();
        return $query->row_array();
    }
    
    public function create_fee_category($data) {
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        if ($this->db->insert('fee_categories', $data)) {
            return $this->db->insert_id();
        }
        return false;
    }
    
    public function update_fee_category($id, $data) {
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        $this->db->where('id', $id);
        return $this->db->update('fee_categories', $data);
    }
    
    public function delete_fee_category($id) {
        // Check if category is used in fee structures
        $this->db->where('fee_category_id', $id);
        $this->db->where('is_active', 1);
        $count = $this->db->count_all_results('fee_structures');
        
        if ($count > 0) {
            return false; // Cannot delete category with active fee structures
        }
        
        // Soft delete
        $this->db->where('id', $id);
        return $this->db->update('fee_categories', ['is_active' => 0, 'updated_at' => date('Y-m-d H:i:s')]);
    }
    
    public function get_fee_categories_for_dropdown() {
        $this->db->select('id, name');
        $this->db->where('is_active', 1);
        $this->db->order_by('name');
        
        $query = $this->db->get('fee_categories');
        return $query->result_array();
    }
    
    public function name_exists($name, $exclude_id = null) {
        $this->db->where('name', $name);
        $this->db->where('is_active', 1);
        if ($exclude_id) {
            $this->db->where('id !=', $exclude_id);
        }
        
        return $this->db->count_all_results('fee_categories') > 0;
    }
    
    public function get_category_statistics($id) {
        $stats = [];
        
        // Total fee structures using this category
        $this->db->where('fee_category_id', $id);
        $this->db->where('is_active', 1);
        $stats['total_structures'] = $this->db->count_all_results('fee_structures');
        
        // Total amount configured for this category
        $this->db->select('SUM(amount) as total_amount');
        $this->db->where('fee_category_id', $id);
        $this->db->where('is_active', 1);
        $query = $this->db->get('fee_structures');
        $result = $query->row_array();
        $stats['total_amount'] = $result['total_amount'] ?: 0;
        
        // Total collections for this category (current academic year)
        $this->db->select('SUM(fc.amount) as collected_amount');
        $this->db->from('fee_collections fc');
        $this->db->join('student_fee_assignments sfa', 'fc.student_fee_assignment_id = sfa.id');
        $this->db->join('fee_structures fs', 'sfa.fee_structure_id = fs.id');
        $this->db->where('fs.fee_category_id', $id);
        $this->db->where('YEAR(fc.collection_date)', date('Y'));
        $query = $this->db->get();
        $result = $query->row_array();
        $stats['collected_amount'] = $result['collected_amount'] ?: 0;
        
        return $stats;
    }
}