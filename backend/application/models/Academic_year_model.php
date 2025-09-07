<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Academic_year_model extends CI_Model {

    public function __construct() {
        parent::__construct();
        $this->load->database();
    }

    /**
     * Get all academic years with pagination
     */
    public function get_academic_years_paginated($limit = 10, $offset = 0, $search = '') {
        $this->db->select('*');
        $this->db->from('academic_years');
        
        if (!empty($search)) {
            $this->db->group_start();
            $this->db->like('name', $search);
            $this->db->or_like('description', $search);
            $this->db->group_end();
        }
        
        $this->db->order_by('is_default', 'DESC');
        $this->db->order_by('start_date', 'DESC');
        $this->db->limit($limit, $offset);
        
        return $this->db->get()->result_array();
    }

    /**
     * Count academic years for pagination
     */
    public function count_academic_years($search = '') {
        $this->db->from('academic_years');
        
        if (!empty($search)) {
            $this->db->group_start();
            $this->db->like('name', $search);
            $this->db->or_like('description', $search);
            $this->db->group_end();
        }
        
        return $this->db->count_all_results();
    }

    /**
     * Get academic year by ID
     */
    public function get_academic_year($id) {
        $this->db->where('id', $id);
        return $this->db->get('academic_years')->row_array();
    }

    /**
     * Get active academic years for dropdown
     */
    public function get_active_academic_years() {
        $this->db->select('id, name, start_date, end_date, is_default');
        $this->db->where('is_active', 1);
        $this->db->order_by('is_default', 'DESC');
        $this->db->order_by('start_date', 'DESC');
        return $this->db->get('academic_years')->result_array();
    }

    /**
     * Get default academic year
     */
    public function get_default_academic_year() {
        // Reset query builder to avoid conflicts with other queries
        $this->db->reset_query();
        $this->db->where('is_default', 1);
        $this->db->where('is_active', 1);
        return $this->db->get('academic_years')->row_array();
    }

    /**
     * Get current academic year (active and within date range)
     */
    public function get_current_academic_year() {
        $current_date = date('Y-m-d');
        
        $this->db->where('is_active', 1);
        $this->db->where('start_date <=', $current_date);
        $this->db->where('end_date >=', $current_date);
        $this->db->order_by('is_default', 'DESC');
        
        return $this->db->get('academic_years')->row_array();
    }

    /**
     * Create new academic year
     */
    public function create_academic_year($data) {
        // If this is being set as default, remove default from others
        if (isset($data['is_default']) && $data['is_default'] == 1) {
            $this->db->set('is_default', 0);
            $this->db->update('academic_years');
        }

        $this->db->insert('academic_years', $data);
        return $this->db->insert_id();
    }

    /**
     * Update academic year
     */
    public function update_academic_year($id, $data) {
        // If this is being set as default, remove default from others
        if (isset($data['is_default']) && $data['is_default'] == 1) {
            $this->db->set('is_default', 0);
            $this->db->update('academic_years');
        }

        $this->db->where('id', $id);
        return $this->db->update('academic_years', $data);
    }

    /**
     * Delete academic year (soft delete by deactivating)
     */
    public function delete_academic_year($id) {
        // Check if this is the default academic year
        $academic_year = $this->get_academic_year($id);
        if ($academic_year && $academic_year['is_default'] == 1) {
            return false; // Cannot delete default academic year
        }

        // Check if there are any related records
        $related_count = 0;
        
        // Check students
        $this->db->where('academic_year_id', $id);
        $related_count += $this->db->count_all_results('students');
        
        // Check grades
        $this->db->where('academic_year_id', $id);
        $related_count += $this->db->count_all_results('grades');
        
        // Check divisions
        $this->db->where('academic_year_id', $id);
        $related_count += $this->db->count_all_results('divisions');

        if ($related_count > 0) {
            // Soft delete by deactivating
            $this->db->where('id', $id);
            return $this->db->update('academic_years', ['is_active' => 0]);
        } else {
            // Hard delete if no related records
            $this->db->where('id', $id);
            return $this->db->delete('academic_years');
        }
    }

    /**
     * Set academic year as default
     */
    public function set_as_default($id) {
        // Remove default from all academic years
        $this->db->set('is_default', 0);
        $this->db->update('academic_years');
        
        // Set the specified academic year as default
        $this->db->where('id', $id);
        return $this->db->update('academic_years', ['is_default' => 1, 'is_active' => 1]);
    }

    /**
     * Check if academic year name exists (for validation)
     */
    public function name_exists($name, $exclude_id = null) {
        $this->db->where('name', $name);
        if ($exclude_id) {
            $this->db->where('id !=', $exclude_id);
        }
        return $this->db->count_all_results('academic_years') > 0;
    }

    /**
     * Get academic year statistics
     */
    public function get_academic_year_stats($academic_year_id) {
        $stats = [];
        
        // Get students count
        $this->db->where('academic_year_id', $academic_year_id);
        $stats['students_count'] = $this->db->count_all_results('students');
        
        // Get grades count
        $this->db->where('academic_year_id', $academic_year_id);
        $stats['grades_count'] = $this->db->count_all_results('grades');
        
        // Get divisions count
        $this->db->where('academic_year_id', $academic_year_id);
        $stats['divisions_count'] = $this->db->count_all_results('divisions');
        
        // Get fee collections total
        $this->db->select('SUM(amount) as total_collected');
        $this->db->where('academic_year_id', $academic_year_id);
        $fee_result = $this->db->get('fee_collections')->row_array();
        $stats['total_fees_collected'] = $fee_result['total_collected'] ?: 0;
        
        return $stats;
    }

    /**
     * Validate academic year dates
     */
    public function validate_dates($start_date, $end_date, $exclude_id = null) {
        // Check if end date is after start date
        if (strtotime($end_date) <= strtotime($start_date)) {
            return ['valid' => false, 'message' => 'End date must be after start date'];
        }
        
        // Check for overlapping academic years
        $this->db->group_start();
        $this->db->where('start_date <=', $end_date);
        $this->db->where('end_date >=', $start_date);
        $this->db->group_end();
        
        if ($exclude_id) {
            $this->db->where('id !=', $exclude_id);
        }
        
        $this->db->where('is_active', 1);
        $overlapping = $this->db->get('academic_years')->result_array();
        
        if (!empty($overlapping)) {
            return [
                'valid' => false, 
                'message' => 'Academic year dates overlap with existing academic year: ' . $overlapping[0]['name']
            ];
        }
        
        return ['valid' => true];
    }
}