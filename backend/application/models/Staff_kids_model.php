<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Staff_kids_model extends CI_Model {
    
    private $table = 'staff_kids';
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    /**
     * Get all kids for a staff member
     */
    public function get_kids_by_staff($staff_id) {
        $this->db->where('staff_id', $staff_id);
        $this->db->order_by('created_date', 'ASC');
        $query = $this->db->get($this->table);
        return $query->result_array();
    }
    
    /**
     * Get kid by ID
     */
    public function get_kid_by_id($id) {
        $this->db->where('id', $id);
        $query = $this->db->get($this->table);
        return $query->row_array();
    }
    
    /**
     * Create kid record
     */
    public function create_kid($data) {
        $insert_data = [
            'staff_id' => (int)$data['staff_id'],
            'name' => $data['name'],
            'gender' => $data['gender'],
            'age' => (int)$data['age'],
            'dob_date' => !empty($data['dob_date']) ? $data['dob_date'] : null,
            'grade' => isset($data['grade']) ? $data['grade'] : null,
            'school_name' => isset($data['school_name']) ? $data['school_name'] : null,
            'created_date' => date('Y-m-d H:i:s')
        ];
        
        if ($this->db->insert($this->table, $insert_data)) {
            return $this->db->insert_id();
        }
        
        return false;
    }
    
    /**
     * Update kid record
     */
    public function update_kid($id, $data) {
        $update_data = [];
        
        if (isset($data['name'])) {
            $update_data['name'] = $data['name'];
        }
        
        if (isset($data['gender'])) {
            $update_data['gender'] = $data['gender'];
        }
        
        if (isset($data['age'])) {
            $update_data['age'] = (int)$data['age'];
        }
        
        if (isset($data['dob_date'])) {
            $update_data['dob_date'] = !empty($data['dob_date']) ? $data['dob_date'] : null;
        }
        
        if (isset($data['grade'])) {
            $update_data['grade'] = $data['grade'];
        }
        
        if (isset($data['school_name'])) {
            $update_data['school_name'] = $data['school_name'];
        }
        
        $update_data['updated_at'] = date('Y-m-d H:i:s');
        
        $this->db->where('id', $id);
        return $this->db->update($this->table, $update_data);
    }
    
    /**
     * Delete kid record
     */
    public function delete_kid($id) {
        $this->db->where('id', $id);
        return $this->db->delete($this->table);
    }
    
    /**
     * Delete all kids for a staff member
     */
    public function delete_kids_by_staff($staff_id) {
        $this->db->where('staff_id', $staff_id);
        return $this->db->delete($this->table);
    }
    
    /**
     * Bulk insert kids for a staff member
     */
    public function bulk_insert_kids($staff_id, $kids_data) {
        if (empty($kids_data)) {
            return true;
        }
        
        $insert_batch = [];
        foreach ($kids_data as $kid) {
            $insert_batch[] = [
                'staff_id' => (int)$staff_id,
                'name' => $kid['name'],
                'gender' => $kid['gender'],
                'age' => (int)$kid['age'],
                'dob_date' => !empty($kid['dob_date']) ? $kid['dob_date'] : null,
                'grade' => isset($kid['grade']) ? $kid['grade'] : null,
                'school_name' => isset($kid['school_name']) ? $kid['school_name'] : null,
                'created_date' => date('Y-m-d H:i:s')
            ];
        }
        
        return $this->db->insert_batch($this->table, $insert_batch);
    }
    
    /**
     * Update kids for a staff member (delete old and insert new)
     */
    public function update_kids_for_staff($staff_id, $kids_data) {
        // Start transaction
        $this->db->trans_start();
        
        // Delete existing kids
        $this->delete_kids_by_staff($staff_id);
        
        // Insert new kids
        if (!empty($kids_data)) {
            $this->bulk_insert_kids($staff_id, $kids_data);
        }
        
        // Complete transaction
        $this->db->trans_complete();
        
        return $this->db->trans_status();
    }
    
    /**
     * Count kids by staff
     */
    public function count_kids_by_staff($staff_id) {
        $this->db->where('staff_id', $staff_id);
        return $this->db->count_all_results($this->table);
    }
}

