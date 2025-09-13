<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Announcement_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    public function get_announcements_paginated($limit, $offset, $filters = []) {
        $this->db->select('a.*, s.name as created_by_name, a.content as message, a.notification_channels as channels, a.created_by as created_by_staff_id, a.attachment_filename, a.attachment_filepath, a.attachment_size, a.attachment_mime_type');
        $this->db->from('announcements a');
        $this->db->join('staff s', 'a.created_by = s.id', 'left');
        
        // Apply filters
        if (!empty($filters['status'])) {
            $this->db->where('a.status', $filters['status']);
        }
        
        if (!empty($filters['target_type'])) {
            $this->db->where('a.target_type', $filters['target_type']);
        }
        
        if (!empty($filters['start_date'])) {
            $this->db->where('a.created_at >=', $filters['start_date']);
        }
        
        if (!empty($filters['end_date'])) {
            $this->db->where('a.created_at <=', $filters['end_date'] . ' 23:59:59');
        }
        
        if (!empty($filters['search'])) {
            $this->db->group_start();
            $this->db->like('a.title', $filters['search']);
            $this->db->or_like('a.content', $filters['search']);
            $this->db->group_end();
        }
        
        $this->db->order_by('a.created_at', 'DESC');
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get();
        $results = $query->result_array();
        
        // Decode JSON fields and add missing fields for compatibility
        foreach ($results as &$row) {
            $row['target_ids'] = json_decode($row['target_ids'] ?: '[]', true);
            $row['channels'] = json_decode($row['notification_channels'] ?: '[]', true);
            $row['message'] = $row['content'];
            $row['created_by_staff_id'] = $row['created_by'];
            // Add default values for missing fields
            $row['total_recipients'] = 0;
            $row['sent_count'] = 0;
            $row['failed_count'] = 0;
        }
        
        return $results;
    }
    
    public function count_announcements($filters = []) {
        $this->db->from('announcements a');
        
        // Apply same filters as in paginated query
        if (!empty($filters['status'])) {
            $this->db->where('a.status', $filters['status']);
        }
        
        if (!empty($filters['target_type'])) {
            $this->db->where('a.target_type', $filters['target_type']);
        }
        
        if (!empty($filters['start_date'])) {
            $this->db->where('a.created_at >=', $filters['start_date']);
        }
        
        if (!empty($filters['end_date'])) {
            $this->db->where('a.created_at <=', $filters['end_date'] . ' 23:59:59');
        }
        
        if (!empty($filters['search'])) {
            $this->db->group_start();
            $this->db->like('a.title', $filters['search']);
            $this->db->or_like('a.content', $filters['search']);
            $this->db->group_end();
        }
        
        return $this->db->count_all_results();
    }
    
    public function get_announcement_by_id($id) {
        $this->db->select('a.*, s.name as created_by_name, a.content as message, a.notification_channels as channels, a.created_by as created_by_staff_id, a.attachment_filename, a.attachment_filepath, a.attachment_size, a.attachment_mime_type');
        $this->db->from('announcements a');
        $this->db->join('staff s', 'a.created_by = s.id', 'left');
        $this->db->where('a.id', $id);
        
        $query = $this->db->get();
        $result = $query->row_array();
        
        if ($result) {
            $result['target_ids'] = json_decode($result['target_ids'] ?: '[]', true);
            $result['channels'] = json_decode($result['notification_channels'] ?: '[]', true);
            $result['message'] = $result['content'];
            $result['created_by_staff_id'] = $result['created_by'];
            $result['total_recipients'] = 0;
            $result['sent_count'] = 0;
            $result['failed_count'] = 0;
        }
        
        return $result;
    }
    
    public function create_announcement($data) {
        // Encode JSON fields
        $data['target_ids'] = json_encode($data['target_ids'] ?: []);
        $data['notification_channels'] = json_encode($data['channels']);
        unset($data['channels']); // Remove the frontend field name
        $data['content'] = $data['message']; // Map message to content
        unset($data['message']); // Remove the frontend field name
        $data['created_by'] = $data['created_by_staff_id']; // Map field name
        unset($data['created_by_staff_id']); // Remove the frontend field name
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        if ($this->db->insert('announcements', $data)) {
            $announcement_id = $this->db->insert_id();
            
            // If announcement is to be sent immediately, process recipients
            if ($data['status'] === 'sending') {
                $this->process_announcement_recipients($announcement_id);
            }
            
            return $announcement_id;
        }
        return false;
    }
    
    public function update_announcement($id, $data) {
        // Encode JSON fields and map field names
        if (isset($data['target_ids'])) {
            $data['target_ids'] = json_encode($data['target_ids'] ?: []);
        }
        if (isset($data['channels'])) {
            $data['notification_channels'] = json_encode($data['channels']);
            unset($data['channels']); // Remove the frontend field name
        }
        if (isset($data['message'])) {
            $data['content'] = $data['message']; // Map message to content
            unset($data['message']); // Remove the frontend field name
        }
        if (isset($data['created_by_staff_id'])) {
            $data['created_by'] = $data['created_by_staff_id']; // Map field name
            unset($data['created_by_staff_id']); // Remove the frontend field name
        }
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        $this->db->where('id', $id);
        return $this->db->update('announcements', $data);
    }
    
    public function delete_announcement($id) {
        // Check if announcement is already sent
        $this->db->where('id', $id);
        $announcement = $this->db->get('announcements')->row_array();
        
        if ($announcement && in_array($announcement['status'], ['sent', 'sending'])) {
            return false; // Cannot delete sent/sending announcements
        }
        
        // Soft delete
        $this->db->where('id', $id);
        return $this->db->update('announcements', ['is_active' => 0, 'updated_at' => date('Y-m-d H:i:s')]);
    }
    
    public function send_announcement($id) {
        try {
            // Update status to sending
            $this->db->where('id', $id);
            $result = $this->db->update('announcements', [
                'status' => 'sending',
                'sent_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
            
            if (!$result) {
                log_message('error', 'Failed to update announcement status: ' . $this->db->error()['message']);
                return false;
            }
            
            // Process recipients
            return $this->process_announcement_recipients($id);
        } catch (Exception $e) {
            log_message('error', 'Send announcement error: ' . $e->getMessage());
            return false;
        }
    }
    
    private function process_announcement_recipients($announcement_id) {
        $announcement = $this->get_announcement_by_id($announcement_id);
        if (!$announcement) return false;
        
        $recipients = $this->get_announcement_recipients($announcement);
        $total_recipients = 0;
        
        foreach ($recipients as $recipient) {
            foreach ($announcement['channels'] as $channel) {
                // Check if recipient has required contact info for channel
                $contact_info = $this->get_recipient_contact_info($recipient, $channel);
                if (!$contact_info) continue;
                
                // Insert delivery status record
                $delivery_data = [
                    'announcement_id' => $announcement_id,
                    'recipient_type' => $recipient['type'],
                    'recipient_id' => $recipient['id'],
                    'recipient_contact' => $contact_info['mobile'] ?: $contact_info['email'],
                    'channel' => $channel,
                    'status' => 'pending',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ];
                
                $insert_result = $this->db->insert('announcement_delivery_status', $delivery_data);
                if (!$insert_result) {
                    log_message('error', 'Failed to insert delivery status: ' . json_encode($this->db->error()));
                    log_message('error', 'Delivery data: ' . json_encode($delivery_data));
                }
                $total_recipients++;
            }
        }
        
        // Update announcement with recipient count
        $this->db->where('id', $announcement_id);
        $this->db->update('announcements', [
            'total_recipients' => $total_recipients,
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        
        // In a real implementation, this would trigger background jobs for actual sending
        // For now, we'll mark as sent immediately
        $this->mark_announcement_as_sent($announcement_id);
        
        return true;
    }
    
    private function get_announcement_recipients($announcement) {
        $recipients = [];
        
        switch ($announcement['target_type']) {
            case 'all':
                // Get all parents
                $this->db->select('id, name, "parent" as type');
                $this->db->where('is_active', 1);
                $parents = $this->db->get('parents')->result_array();
                foreach ($parents as $parent) {
                    $recipients[] = ['id' => $parent['id'], 'type' => 'parent', 'name' => $parent['name']];
                }
                
                // Get all staff
                $this->db->select('id, name, "staff" as type');
                $this->db->where('is_active', 1);
                $staff = $this->db->get('staff')->result_array();
                foreach ($staff as $s) {
                    $recipients[] = ['id' => $s['id'], 'type' => 'staff', 'name' => $s['name']];
                }
                break;
                
            case 'grade':
                if (!empty($announcement['target_ids'])) {
                    $this->db->distinct();
                    $this->db->select('p.id, p.name, "parent" as type');
                    $this->db->from('parents p');
                    $this->db->join('students s', 'p.id = s.parent_id');
                    $this->db->where_in('s.grade_id', $announcement['target_ids']);
                    $this->db->where('p.is_active', 1);
                    $this->db->where('s.is_active', 1);
                    $parents = $this->db->get()->result_array();
                    foreach ($parents as $parent) {
                        $recipients[] = ['id' => $parent['id'], 'type' => 'parent', 'name' => $parent['name']];
                    }
                }
                break;
                
                
            case 'parent':
                if (!empty($announcement['target_ids'])) {
                    $this->db->select('id, name');
                    $this->db->where_in('id', $announcement['target_ids']);
                    $this->db->where('is_active', 1);
                    $parents = $this->db->get('parents')->result_array();
                    foreach ($parents as $parent) {
                        $recipients[] = ['id' => $parent['id'], 'type' => 'parent', 'name' => $parent['name']];
                    }
                }
                break;
                
            case 'staff':
                if (!empty($announcement['target_ids'])) {
                    $this->db->select('id, name');
                    $this->db->where_in('id', $announcement['target_ids']);
                    $this->db->where('is_active', 1);
                    $staff = $this->db->get('staff')->result_array();
                    foreach ($staff as $s) {
                        $recipients[] = ['id' => $s['id'], 'type' => 'staff', 'name' => $s['name']];
                    }
                }
                break;
                
            case 'fee_due':
                // Get parents with students having pending fees
                $this->db->distinct();
                $this->db->select('p.id, p.name, "parent" as type');
                $this->db->from('parents p');
                $this->db->join('students s', 'p.id = s.parent_id');
                $this->db->join('student_fee_assignments sfa', 's.id = sfa.student_id');
                $this->db->where('sfa.status', 'pending');
                $this->db->where('sfa.is_active', 1);
                $this->db->where('p.is_active', 1);
                $this->db->where('s.is_active', 1);
                $parents = $this->db->get()->result_array();
                foreach ($parents as $parent) {
                    $recipients[] = ['id' => $parent['id'], 'type' => 'parent', 'name' => $parent['name']];
                }
                break;
        }
        
        return $recipients;
    }
    
    private function get_recipient_contact_info($recipient, $channel) {
        $table = $recipient['type'] === 'parent' ? 'parents' : 'staff';
        
        $this->db->select('mobile, email');
        $this->db->where('id', $recipient['id']);
        $this->db->where('is_active', 1);
        $contact = $this->db->get($table)->row_array();
        
        if (!$contact) return null;
        
        // Check if recipient has required contact info for channel
        switch ($channel) {
            case 'whatsapp':
            case 'sms':
                return $contact['mobile'] ? $contact : null;
            case 'email':
                return $contact['email'] ? $contact : null;
        }
        
        return null;
    }
    
    private function mark_announcement_as_sent($announcement_id) {
        // Get pending delivery count
        $this->db->where('announcement_id', $announcement_id);
        $this->db->where('status', 'pending');
        $pending_count = $this->db->count_all_results('announcement_delivery_status');
        
        // Mark all pending deliveries as sent (in real implementation, this would be done by background jobs)
        $this->db->where('announcement_id', $announcement_id);
        $this->db->where('status', 'pending');
        $this->db->update('announcement_delivery_status', [
            'status' => 'sent',
            'sent_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        
        // Update announcement status
        $this->db->where('id', $announcement_id);
        $this->db->update('announcements', [
            'status' => 'sent',
            'sent_count' => $pending_count,
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    public function get_announcement_delivery_status($announcement_id, $limit = null, $offset = null) {
        $this->db->select('ads.*, 
                          CASE 
                            WHEN ads.recipient_type = "parent" THEN p.name 
                            WHEN ads.recipient_type = "staff" THEN s.name 
                          END as recipient_name');
        $this->db->from('announcement_delivery_status ads');
        $this->db->join('parents p', 'ads.recipient_id = p.id AND ads.recipient_type = "parent"', 'left');
        $this->db->join('staff s', 'ads.recipient_id = s.id AND ads.recipient_type = "staff"', 'left');
        $this->db->where('ads.announcement_id', $announcement_id);
        $this->db->order_by('ads.created_at', 'DESC');
        
        if ($limit) {
            $this->db->limit($limit, $offset);
        }
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    public function get_announcement_statistics($announcement_id) {
        $stats = [];
        
        // Total recipients by channel
        $this->db->select('channel, COUNT(*) as count');
        $this->db->where('announcement_id', $announcement_id);
        $this->db->group_by('channel');
        $query = $this->db->get('announcement_delivery_status');
        $channel_stats = $query->result_array();
        
        $stats['by_channel'] = [];
        foreach ($channel_stats as $stat) {
            $stats['by_channel'][$stat['channel']] = $stat['count'];
        }
        
        // Status counts
        $this->db->select('status, COUNT(*) as count');
        $this->db->where('announcement_id', $announcement_id);
        $this->db->group_by('status');
        $query = $this->db->get('announcement_delivery_status');
        $status_stats = $query->result_array();
        
        $stats['by_status'] = [];
        foreach ($status_stats as $stat) {
            $stats['by_status'][$stat['status']] = $stat['count'];
        }
        
        return $stats;
    }
    
    public function get_recent_announcements($limit = 5) {
        $this->db->select('a.*, s.name as created_by_name');
        $this->db->from('announcements a');
        $this->db->join('staff s', 'a.created_by_staff_id = s.id', 'left');
        $this->db->where('a.is_active', 1);
        $this->db->order_by('a.created_at', 'DESC');
        $this->db->limit($limit);
        
        $query = $this->db->get();
        $results = $query->result_array();
        
        // Decode JSON fields
        foreach ($results as &$row) {
            $row['target_ids'] = json_decode($row['target_ids'] ?: '[]', true);
            $row['channels'] = json_decode($row['channels'], true);
        }
        
        return $results;
    }
}