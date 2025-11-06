<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Syllabus_model extends CI_Model {
    
    private $table = 'syllabus_daywise';
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    /**
     * Get syllabus with pagination and filters
     */
    public function get_syllabus_paginated($limit = 10, $offset = 0, $filters = []) {
        $this->db->select('
            syllabus_daywise.*,
            grades.name as grade_name,
            subject.subject_name,
            staff.name as created_by_name
        ');
        $this->db->from($this->table);
        $this->db->join('grades', 'grades.id = syllabus_daywise.grade_id', 'left');
        $this->db->join('subject', 'subject.id = syllabus_daywise.subject_id', 'left');
        $this->db->join('staff', 'staff.id = syllabus_daywise.created_by', 'left');
        
        // Apply filters
        if (isset($filters['grade_id']) && $filters['grade_id'] !== '') {
            $this->db->where('syllabus_daywise.grade_id', $filters['grade_id']);
        }
        
        if (isset($filters['subject_id']) && $filters['subject_id'] !== '') {
            $this->db->where('syllabus_daywise.subject_id', $filters['subject_id']);
        }
        
        if (isset($filters['start_date']) && $filters['start_date'] !== '') {
            $this->db->where('syllabus_daywise.syllabus_date >=', $filters['start_date']);
        }
        
        if (isset($filters['end_date']) && $filters['end_date'] !== '') {
            $this->db->where('syllabus_daywise.syllabus_date <=', $filters['end_date']);
        }
        
        if (isset($filters['search']) && $filters['search'] !== '') {
            $this->db->group_start();
            $this->db->like('syllabus_daywise.topic_title', $filters['search']);
            $this->db->or_like('syllabus_daywise.topic_description', $filters['search']);
            $this->db->group_end();
        }
        
        $this->db->order_by('syllabus_daywise.syllabus_date', 'DESC');
        $this->db->order_by('syllabus_daywise.day_number', 'ASC');
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    /**
     * Count syllabus records
     */
    public function count_syllabus($filters = []) {
        $this->db->from($this->table);
        
        if (isset($filters['grade_id']) && $filters['grade_id'] !== '') {
            $this->db->where('grade_id', $filters['grade_id']);
        }
        
        if (isset($filters['subject_id']) && $filters['subject_id'] !== '') {
            $this->db->where('subject_id', $filters['subject_id']);
        }
        
        if (isset($filters['start_date']) && $filters['start_date'] !== '') {
            $this->db->where('syllabus_date >=', $filters['start_date']);
        }
        
        if (isset($filters['end_date']) && $filters['end_date'] !== '') {
            $this->db->where('syllabus_date <=', $filters['end_date']);
        }
        
        if (isset($filters['search']) && $filters['search'] !== '') {
            $this->db->group_start();
            $this->db->like('topic_title', $filters['search']);
            $this->db->or_like('topic_description', $filters['search']);
            $this->db->group_end();
        }
        
        return $this->db->count_all_results();
    }
    
    /**
     * Get syllabus by ID
     */
    public function get_syllabus_by_id($id) {
        $this->db->select('
            syllabus_daywise.*,
            grades.name as grade_name,
            subject.subject_name,
            staff.name as created_by_name
        ');
        $this->db->from($this->table);
        $this->db->join('grades', 'grades.id = syllabus_daywise.grade_id', 'left');
        $this->db->join('subject', 'subject.id = syllabus_daywise.subject_id', 'left');
        $this->db->join('staff', 'staff.id = syllabus_daywise.created_by', 'left');
        $this->db->where('syllabus_daywise.id', $id);
        
        $query = $this->db->get();
        return $query->row_array();
    }
    
    /**
     * Get syllabus by grade and subject
     */
    public function get_syllabus_by_grade_subject($grade_id, $subject_id, $start_date = null, $end_date = null) {
        $this->db->select('syllabus_daywise.*, staff.name as created_by_name');
        $this->db->from($this->table);
        $this->db->join('staff', 'staff.id = syllabus_daywise.created_by', 'left');
        $this->db->where('grade_id', $grade_id);
        $this->db->where('subject_id', $subject_id);
        
        if ($start_date) {
            $this->db->where('syllabus_date >=', $start_date);
        }
        
        if ($end_date) {
            $this->db->where('syllabus_date <=', $end_date);
        }
        
        $this->db->order_by('syllabus_date', 'ASC');
        $this->db->order_by('day_number', 'ASC');
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    /**
     * Create syllabus
     */
    public function create_syllabus($data) {
        $insert_data = [
            'grade_id' => (int)$data['grade_id'],
            'subject_id' => (int)$data['subject_id'],
            'topic_title' => $data['topic_title'],
            'topic_description' => isset($data['topic_description']) ? $data['topic_description'] : null,
            'day_number' => (int)$data['day_number'],
            'video_link' => isset($data['video_link']) ? $data['video_link'] : null,
            'documents' => isset($data['documents']) ? $data['documents'] : null,
            'syllabus_date' => $data['syllabus_date'],
            'created_by' => isset($data['created_by']) ? (int)$data['created_by'] : null,
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        if ($this->db->insert($this->table, $insert_data)) {
            return $this->db->insert_id();
        }
        
        return false;
    }
    
    /**
     * Update syllabus
     */
    public function update_syllabus($id, $data) {
        $update_data = [];
        
        if (isset($data['grade_id'])) {
            $update_data['grade_id'] = (int)$data['grade_id'];
        }
        
        if (isset($data['subject_id'])) {
            $update_data['subject_id'] = (int)$data['subject_id'];
        }
        
        if (isset($data['topic_title'])) {
            $update_data['topic_title'] = $data['topic_title'];
        }
        
        if (isset($data['topic_description'])) {
            $update_data['topic_description'] = $data['topic_description'];
        }
        
        if (isset($data['day_number'])) {
            $update_data['day_number'] = (int)$data['day_number'];
        }
        
        if (isset($data['video_link'])) {
            $update_data['video_link'] = $data['video_link'];
        }
        
        if (isset($data['documents'])) {
            $update_data['documents'] = $data['documents'];
        }
        
        if (isset($data['syllabus_date'])) {
            $update_data['syllabus_date'] = $data['syllabus_date'];
        }
        
        $update_data['updated_at'] = date('Y-m-d H:i:s');
        
        $this->db->where('id', $id);
        return $this->db->update($this->table, $update_data);
    }
    
    /**
     * Delete syllabus
     */
    public function delete_syllabus($id) {
        $this->db->where('id', $id);
        return $this->db->delete($this->table);
    }
    
    /**
     * Get syllabus calendar for a grade/subject in a date range
     */
    public function get_syllabus_calendar($grade_id, $subject_id, $month, $year) {
        $this->db->select('syllabus_daywise.*, staff.name as created_by_name');
        $this->db->from($this->table);
        $this->db->join('staff', 'staff.id = syllabus_daywise.created_by', 'left');
        $this->db->where('grade_id', $grade_id);
        $this->db->where('subject_id', $subject_id);
        $this->db->where('MONTH(syllabus_date)', $month);
        $this->db->where('YEAR(syllabus_date)', $year);
        $this->db->order_by('syllabus_date', 'ASC');
        
        $query = $this->db->get();
        return $query->result_array();
    }
}

