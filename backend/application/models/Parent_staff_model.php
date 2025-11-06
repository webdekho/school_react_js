<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Parent_staff_model extends CI_Model {
    
    private $table = 'parent_staff';
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    /**
     * Get all staff for a parent
     */
    public function get_staff_by_parent($parent_id) {
        $this->db->where('parent_id', $parent_id);
        $this->db->order_by('created_at', 'ASC');
        $query = $this->db->get($this->table);
        return $query->result_array();
    }
    
    /**
     * Get staff by ID
     */
    public function get_staff_by_id($id) {
        $this->db->where('id', $id);
        $query = $this->db->get($this->table);
        return $query->row_array();
    }
    
    /**
     * Create staff record
     */
    public function create_staff($data) {
        $insert_data = [
            'parent_id' => (int)$data['parent_id'],
            'tss_id' => !empty($data['tss_id']) ? (int)$data['tss_id'] : $this->get_next_tss_id(),
            'name' => $data['name'],
            'mobile_number' => $data['mobile_number'],
            'photo' => !empty($data['photo']) ? $data['photo'] : null,
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        if ($this->db->insert($this->table, $insert_data)) {
            return $this->db->insert_id();
        }
        
        return false;
    }
    
    /**
     * Update staff record
     */
    public function update_staff($id, $data) {
        $update_data = [];
        
        if (isset($data['name'])) {
            $update_data['name'] = $data['name'];
        }
        
        if (isset($data['tss_id'])) {
            $update_data['tss_id'] = !empty($data['tss_id']) ? (int)$data['tss_id'] : null;
        }
        
        if (isset($data['mobile_number'])) {
            $update_data['mobile_number'] = $data['mobile_number'];
        }

        if (array_key_exists('photo', $data)) {
            $update_data['photo'] = !empty($data['photo']) ? $data['photo'] : null;
        }
        
        $update_data['updated_at'] = date('Y-m-d H:i:s');
        
        $this->db->where('id', $id);
        return $this->db->update($this->table, $update_data);
    }
    
    /**
     * Delete staff record
     */
    public function delete_staff($id) {
        $this->db->where('id', $id);
        return $this->db->delete($this->table);
    }
    
    /**
     * Delete all staff for a parent
     */
    public function delete_staff_by_parent($parent_id) {
        $this->db->where('parent_id', $parent_id);
        return $this->db->delete($this->table);
    }
    
    /**
     * Bulk insert staff for a parent
     */
    public function bulk_insert_staff($parent_id, $staff_data) {
        if (empty($staff_data)) {
            return true;
        }
        
        $existing_max_in_payload = 0;
        foreach ($staff_data as $staff) {
            if (!empty($staff['tss_id'])) {
                $existing_max_in_payload = max($existing_max_in_payload, (int)$staff['tss_id']);
            }
        }

        $next_tss_id = $this->get_next_tss_id($existing_max_in_payload);

        $insert_batch = [];
        foreach ($staff_data as $staff) {
            if (!empty($staff['tss_id'])) {
                $tss_id = (int)$staff['tss_id'];
            } else {
                $tss_id = $next_tss_id;
                $next_tss_id++;
            }
            $insert_batch[] = [
                'parent_id' => (int)$parent_id,
                'tss_id' => $tss_id,
                'name' => $staff['name'],
                'mobile_number' => $staff['mobile_number'],
                'photo' => isset($staff['photo']) && $staff['photo'] !== '' ? $staff['photo'] : null,
                'created_at' => date('Y-m-d H:i:s')
            ];
        }
        
        return $this->db->insert_batch($this->table, $insert_batch);
    }
    
    /**
     * Update staff for a parent (delete old and insert new)
     */
    public function update_staff_for_parent($parent_id, $staff_data) {
        // Start transaction
        $this->db->trans_start();
        
        // Delete existing staff
        $this->delete_staff_by_parent($parent_id);
        
        // Insert new staff
        if (!empty($staff_data)) {
            $this->bulk_insert_staff($parent_id, $staff_data);
        }
        
        // Complete transaction
        $this->db->trans_complete();
        
        return $this->db->trans_status();
    }
    
    /**
     * Count staff by parent
     */
    public function count_staff_by_parent($parent_id) {
        $this->db->where('parent_id', $parent_id);
        return $this->db->count_all_results($this->table);
    }
    
    /**
     * Replace staff for parent (alias for update_staff_for_parent)
     */
    public function replace_staff_for_parent($parent_id, $staff_data) {
        return $this->update_staff_for_parent($parent_id, $staff_data);
    }

    /**
     * Generate next available TSS ID
     */
    private function get_next_tss_id($current_max = null) {
        $max_in_db = $this->get_max_tss_id();
        $base = max($max_in_db, $current_max ?? 0);
        return $base + 1;
    }

    private function get_max_tss_id() {
        $this->db->select_max('tss_id');
        $query = $this->db->get($this->table);
        $row = $query->row();
        return $row && $row->tss_id ? (int)$row->tss_id : 999;
    }
}
