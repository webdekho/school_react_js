<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Grade_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    public function get_all_grades($filters = []) {
        $academic_year_id = !empty($filters['academic_year_id']) ? $filters['academic_year_id'] : null;
        
        // If no academic year specified, get current one for counting students
        if (!$academic_year_id) {
            $this->load->model('Academic_year_model');
            $current_year = $this->Academic_year_model->get_default_academic_year();
            $academic_year_id = $current_year ? $current_year['id'] : null;
        }
        
        $this->db->select('grades.*, COUNT(divisions.id) as division_count');
        $this->db->from('grades');
        $this->db->join('divisions', 'grades.id = divisions.grade_id', 'left');
        $this->db->where('grades.is_active', 1);
        $this->db->group_by('grades.id');
        $this->db->order_by('grades.display_order, grades.name');
        
        $query = $this->db->get();
        $grades = $query->result_array();
        
        // Add student count for specific academic year
        if ($academic_year_id) {
            foreach ($grades as &$grade) {
                $this->db->reset_query();
                $this->db->from('students');
                $this->db->where('grade_id', $grade['id']);
                $this->db->where('academic_year_id', $academic_year_id);
                $this->db->where('is_active', 1);
                $grade['student_count'] = $this->db->count_all_results();
            }
        } else {
            foreach ($grades as &$grade) {
                $grade['student_count'] = 0;
            }
        }
        
        return $grades;
    }
    
    public function get_grade_by_id($id) {
        $this->db->select('grades.*, COUNT(divisions.id) as division_count');
        $this->db->from('grades');
        $this->db->join('divisions', 'grades.id = divisions.grade_id', 'left');
        $this->db->where('grades.id', $id);
        $this->db->where('grades.is_active', 1);
        $this->db->group_by('grades.id');
        
        $query = $this->db->get();
        $grade = $query->row_array();
        
        if ($grade) {
            // Count students for current academic year
            $this->load->model('Academic_year_model');
            $current_year = $this->Academic_year_model->get_default_academic_year();
            if ($current_year) {
                $this->db->reset_query();
                $this->db->from('students');
                $this->db->where('grade_id', $grade['id']);
                $this->db->where('academic_year_id', $current_year['id']);
                $this->db->where('is_active', 1);
                $grade['student_count'] = $this->db->count_all_results();
            } else {
                $grade['student_count'] = 0;
            }
        }
        
        return $grade;
    }
    
    public function create_grade($data) {
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        if ($this->db->insert('grades', $data)) {
            return $this->db->insert_id();
        }
        return false;
    }
    
    public function update_grade($id, $data) {
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        $this->db->where('id', $id);
        return $this->db->update('grades', $data);
    }
    
    public function delete_grade($id) {
        // Soft delete - set is_active to 0
        $this->db->where('id', $id);
        return $this->db->update('grades', ['is_active' => 0, 'updated_at' => date('Y-m-d H:i:s')]);
    }
    
    public function get_grades_for_dropdown() {
        $this->db->select('id, name');
        $this->db->where('is_active', 1);
        $this->db->order_by('display_order, name');
        
        $query = $this->db->get('grades');
        return $query->result_array();
    }
    
    public function get_grades_paginated($limit, $offset, $search = null, $academic_year_id = null) {
        $this->db->select('grades.*, COUNT(divisions.id) as division_count');
        $this->db->from('grades');
        $this->db->join('divisions', 'grades.id = divisions.grade_id', 'left');
        $this->db->where('grades.is_active', 1);
        
        if ($search) {
            $this->db->like('grades.name', $search);
        }
        
        $this->db->group_by('grades.id');
        $this->db->order_by('grades.display_order, grades.name');
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get();
        $grades = $query->result_array();
        
        // Add student count for specific academic year if provided
        if ($academic_year_id) {
            foreach ($grades as &$grade) {
                $this->db->reset_query();
                $this->db->from('students');
                $this->db->where('grade_id', $grade['id']);
                $this->db->where('academic_year_id', $academic_year_id);
                $this->db->where('is_active', 1);
                $grade['student_count'] = $this->db->count_all_results();
            }
        } else {
            foreach ($grades as &$grade) {
                $grade['student_count'] = 0;
            }
        }
        
        return $grades;
    }
    
    public function count_grades($search = null, $academic_year_id = null) {
        $this->db->from('grades');
        $this->db->where('is_active', 1);
        
        if ($search) {
            $this->db->like('name', $search);
        }
        
        return $this->db->count_all_results();
    }
}