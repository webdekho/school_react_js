<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Division_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    public function get_divisions($filters = []) {
        $academic_year_id = !empty($filters['academic_year_id']) ? $filters['academic_year_id'] : null;
        
        // If no academic year specified, get current one for counting students
        if (!$academic_year_id) {
            $this->load->model('Academic_year_model');
            $current_year = $this->Academic_year_model->get_default_academic_year();
            $academic_year_id = $current_year ? $current_year['id'] : null;
        }
        
        $this->db->select('divisions.*, grades.name as grade_name');
        $this->db->from('divisions');
        $this->db->join('grades', 'divisions.grade_id = grades.id');
        $this->db->where('divisions.is_active', 1);
        
        if (!empty($filters['grade_id'])) {
            $this->db->where('divisions.grade_id', $filters['grade_id']);
        }
        
        $this->db->order_by('grades.display_order, grades.name, divisions.display_order, divisions.name');
        
        $query = $this->db->get();
        $divisions = $query->result_array();
        
        // Add student count for specific academic year
        if ($academic_year_id) {
            foreach ($divisions as &$division) {
                $this->db->where('division_id', $division['id']);
                $this->db->where('academic_year_id', $academic_year_id);
                $this->db->where('is_active', 1);
                $division['student_count'] = $this->db->count_all_results('students');
            }
        } else {
            foreach ($divisions as &$division) {
                $division['student_count'] = 0;
            }
        }
        
        return $divisions;
    }
    
    public function get_division_by_id($id) {
        $this->db->select('divisions.*, grades.name as grade_name');
        $this->db->from('divisions');
        $this->db->join('grades', 'divisions.grade_id = grades.id');
        $this->db->where('divisions.id', $id);
        $this->db->where('divisions.is_active', 1);
        
        $query = $this->db->get();
        $division = $query->row_array();
        
        if ($division) {
            // Count students for current academic year
            $this->load->model('Academic_year_model');
            $current_year = $this->Academic_year_model->get_default_academic_year();
            if ($current_year) {
                $this->db->where('division_id', $division['id']);
                $this->db->where('academic_year_id', $current_year['id']);
                $this->db->where('is_active', 1);
                $division['student_count'] = $this->db->count_all_results('students');
            } else {
                $division['student_count'] = 0;
            }
        }
        
        return $division;
    }
    
    public function create_division($data) {
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        // Check if division already exists for this grade
        $this->db->where('grade_id', $data['grade_id']);
        $this->db->where('name', $data['name']);
        $this->db->where('is_active', 1);
        $existing = $this->db->get('divisions')->row();
        
        if ($existing) {
            return ['error' => 'Division already exist in selected grade'];
        }
        
        if ($this->db->insert('divisions', $data)) {
            return $this->db->insert_id();
        }
        return false;
    }
    
    public function update_division($id, $data) {
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        $this->db->where('id', $id);
        return $this->db->update('divisions', $data);
    }
    
    public function delete_division($id) {
        // Soft delete - set is_active to 0
        $this->db->where('id', $id);
        return $this->db->update('divisions', ['is_active' => 0, 'updated_at' => date('Y-m-d H:i:s')]);
    }
    
    public function get_divisions_by_grade($grade_id) {
        $this->db->select('id, name, capacity');
        $this->db->where('grade_id', $grade_id);
        $this->db->where('is_active', 1);
        $this->db->order_by('name');
        
        $query = $this->db->get('divisions');
        return $query->result_array();
    }
    
    public function check_capacity($division_id) {
        $this->db->select('divisions.capacity, COUNT(students.id) as current_count');
        $this->db->from('divisions');
        $this->db->join('students', 'divisions.id = students.division_id AND students.is_active = 1', 'left');
        $this->db->where('divisions.id', $division_id);
        $this->db->group_by('divisions.id');
        
        $query = $this->db->get();
        $result = $query->row_array();
        
        if (!$result) {
            return false;
        }
        
        return [
            'capacity' => $result['capacity'],
            'current_count' => $result['current_count'],
            'available' => $result['capacity'] - $result['current_count']
        ];
    }
    
    public function get_divisions_paginated($filters) {
        $academic_year_id = !empty($filters['academic_year_id']) ? $filters['academic_year_id'] : null;
        
        // If no academic year specified, get current one for counting students
        if (!$academic_year_id) {
            $this->load->model('Academic_year_model');
            $current_year = $this->Academic_year_model->get_default_academic_year();
            $academic_year_id = $current_year ? $current_year['id'] : null;
        }
        
        $this->db->select('divisions.*, grades.name as grade_name');
        $this->db->from('divisions');
        $this->db->join('grades', 'divisions.grade_id = grades.id');
        $this->db->where('divisions.is_active', 1);
        
        if (!empty($filters['grade_id'])) {
            $this->db->where('divisions.grade_id', $filters['grade_id']);
        }
        
        if (!empty($filters['search'])) {
            $this->db->group_start();
            $this->db->like('divisions.name', $filters['search']);
            $this->db->or_like('grades.name', $filters['search']);
            $this->db->group_end();
        }
        
        $this->db->order_by('grades.display_order, grades.name, divisions.display_order, divisions.name');
        $this->db->limit($filters['limit'], $filters['offset']);
        
        $query = $this->db->get();
        $divisions = $query->result_array();
        
        // Add student count for specific academic year
        if ($academic_year_id) {
            foreach ($divisions as &$division) {
                $this->db->where('division_id', $division['id']);
                $this->db->where('academic_year_id', $academic_year_id);
                $this->db->where('is_active', 1);
                $division['student_count'] = $this->db->count_all_results('students');
            }
        } else {
            foreach ($divisions as &$division) {
                $division['student_count'] = 0;
            }
        }
        
        return $divisions;
    }
    
    public function count_divisions($filters) {
        $this->db->from('divisions');
        $this->db->join('grades', 'divisions.grade_id = grades.id');
        $this->db->where('divisions.is_active', 1);
        
        if (!empty($filters['grade_id'])) {
            $this->db->where('divisions.grade_id', $filters['grade_id']);
        }
        
        if (!empty($filters['search'])) {
            $this->db->group_start();
            $this->db->like('divisions.name', $filters['search']);
            $this->db->or_like('grades.name', $filters['search']);
            $this->db->group_end();
        }
        
        return $this->db->count_all_results();
    }
}