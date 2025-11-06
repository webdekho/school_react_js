<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class User_announcement_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    /**
     * Mark an announcement as read for a user
     */
    public function mark_as_read($user_id, $user_type, $announcement_id) {
        // Check if already marked as read
        $this->db->where('user_id', $user_id);
        $this->db->where('user_type', $user_type);
        $this->db->where('announcement_id', $announcement_id);
        $existing = $this->db->get('user_announcement_reads')->row_array();
        
        if ($existing) {
            // Already marked as read, update the timestamp
            $this->db->where('id', $existing['id']);
            $this->db->update('user_announcement_reads', [
                'read_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
            return true;
        } else {
            // Mark as read for the first time
            $data = [
                'user_id' => $user_id,
                'user_type' => $user_type,
                'announcement_id' => $announcement_id,
                'is_read' => 1,
                'read_at' => date('Y-m-d H:i:s'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            $this->db->insert('user_announcement_reads', $data);
            return $this->db->affected_rows() > 0;
        }
    }
    
    /**
     * Get read status for multiple announcements for a user
     */
    public function get_read_status($user_id, $user_type, $announcement_ids) {
        if (empty($announcement_ids)) {
            return [];
        }
        
        $this->db->select('announcement_id, is_read, read_at');
        $this->db->where('user_id', $user_id);
        $this->db->where('user_type', $user_type);
        $this->db->where_in('announcement_id', $announcement_ids);
        
        $query = $this->db->get('user_announcement_reads');
        $results = $query->result_array();
        
        // Convert to associative array for easy lookup
        $read_status = [];
        foreach ($results as $row) {
            $read_status[$row['announcement_id']] = [
                'is_read' => (bool)$row['is_read'],
                'read_at' => $row['read_at']
            ];
        }
        
        return $read_status;
    }
    
    /**
     * Get unread announcement count for a user
     */
    public function get_unread_count($user_id, $user_type) {
        // Get all announcements that target this user
        $this->db->select('a.id');
        $this->db->from('announcements a');
        $this->db->where('a.status', 'sent');
        $this->db->group_start();
        $this->db->where('a.target_type', 'all');
        if ($user_type !== 'admin') {
            $this->db->or_where('a.target_type', $user_type);
        }
        $this->db->group_end();
        
        // Exclude announcements that have been read
        $this->db->where('a.id NOT IN (
            SELECT announcement_id 
            FROM user_announcement_reads 
            WHERE user_id = ' . (int)$user_id . ' 
            AND user_type = "' . $this->db->escape_str($user_type) . '" 
            AND is_read = 1
        )');
        
        return $this->db->count_all_results();
    }
    
    /**
     * Mark all announcements as read for a user
     */
    public function mark_all_as_read($user_id, $user_type) {
        // Get all announcements that target this user
        $this->db->select('id');
        $this->db->from('announcements');
        $this->db->where('status', 'sent');
        $this->db->group_start();
        $this->db->where('target_type', 'all');
        if ($user_type !== 'admin') {
            $this->db->or_where('target_type', $user_type);
        }
        $this->db->group_end();
        
        $announcements = $this->db->get()->result_array();
        
        $success = true;
        foreach ($announcements as $announcement) {
            if (!$this->mark_as_read($user_id, $user_type, $announcement['id'])) {
                $success = false;
            }
        }
        
        return $success;
    }
}
?>