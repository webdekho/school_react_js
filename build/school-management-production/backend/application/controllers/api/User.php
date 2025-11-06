<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class User extends CI_Controller {
    
    public $Announcement_model;
    public $User_announcement_model;
    public $db;
    public $input;
    public $load;
    public $output;
    public $session;
    public $form_validation;
    
    public function __construct() {
        parent::__construct();
        $this->load->model('Announcement_model');
        $this->load->model('User_announcement_model');
        header('Content-Type: application/json');
        
        if ($this->input->method() === 'options') {
            exit();
        }
    }
    
    /**
     * Get announcements for the current user
     */
    public function announcements() {
        try {
            if ($this->input->method() !== 'get') {
                $this->output->set_status_header(405);
                echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
                return;
            }
            
            // For demo purposes, use default user data
            // In real implementation, get from JWT token
            $user_id = 1;
            $user_type = $this->input->get('user_type') ?: 'admin';
            
            $limit = (int)($this->input->get('limit') ?: 10);
            $offset = (int)($this->input->get('offset') ?: 0);
            
            // Get announcements for the user
            $announcements = $this->get_user_announcements($user_id, $user_type, $limit, $offset);
            
            echo json_encode([
                'status' => 'success',
                'data' => $announcements
            ]);
            
        } catch (Exception $e) {
            error_log("User announcements error: " . $e->getMessage());
            $this->output->set_status_header(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'An error occurred',
                'debug' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Mark announcement as read for the current user
     */
    public function mark_announcement_read($announcement_id) {
        try {
            if ($this->input->method() !== 'post') {
                $this->output->set_status_header(405);
                echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
                return;
            }
            
            if (!$announcement_id) {
                $this->output->set_status_header(400);
                echo json_encode(['status' => 'error', 'message' => 'Announcement ID required']);
                return;
            }
            
            // For demo purposes, use default user data
            // In real implementation, get from JWT token
            $user_id = 1;
            $user_type = 'admin';
            
            // Mark as read
            $success = $this->User_announcement_model->mark_as_read($user_id, $user_type, $announcement_id);
            
            if ($success) {
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Announcement marked as read'
                ]);
            } else {
                $this->output->set_status_header(500);
                echo json_encode(['status' => 'error', 'message' => 'Failed to mark as read']);
            }
            
        } catch (Exception $e) {
            error_log("Mark announcement read error: " . $e->getMessage());
            $this->output->set_status_header(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'An error occurred',
                'debug' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get announcements relevant to the user based on their type and targeting
     */
    private function get_user_announcements($user_id, $user_type, $limit = 10, $offset = 0) {
        // Get all sent announcements that target this user type or all users
        $this->db->select('a.*, s.name as created_by_name, a.content as message, a.notification_channels as channels, 
                          a.created_by as created_by_staff_id, a.attachment_filename, a.attachment_filepath, 
                          a.attachment_size, a.attachment_mime_type, uar.is_read, uar.read_at');
        $this->db->from('announcements a');
        $this->db->join('staff s', 'a.created_by = s.id', 'left');
        $this->db->join('user_announcement_reads uar', 
                       "uar.announcement_id = a.id AND uar.user_id = {$user_id} AND uar.user_type = '{$user_type}'", 'left');
        
        // Filter by status - only show sent announcements
        $this->db->where('a.status', 'sent');
        
        // Filter by target type
        $this->db->group_start();
        $this->db->where('a.target_type', 'all');
        if ($user_type !== 'admin') {
            $this->db->or_where('a.target_type', $user_type);
        }
        $this->db->group_end();
        
        // Order by creation date (newest first)
        $this->db->order_by('a.created_at', 'DESC');
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get();
        $results = $query->result_array();
        
        // Process results
        foreach ($results as &$row) {
            $row['target_ids'] = json_decode($row['target_ids'] ?: '[]', true);
            $row['channels'] = json_decode($row['notification_channels'] ?: '[]', true);
            $row['is_read'] = (bool)$row['is_read'];
            $row['read_at'] = $row['read_at'] ?: null;
            
            // Determine priority based on target type and content
            if ($row['target_type'] === 'all') {
                $row['priority'] = 'high';
            } elseif (stripos($row['message'], 'urgent') !== false || stripos($row['title'], 'urgent') !== false) {
                $row['priority'] = 'high';
            } elseif (stripos($row['message'], 'reminder') !== false || stripos($row['title'], 'reminder') !== false) {
                $row['priority'] = 'medium';
            } else {
                $row['priority'] = 'medium';
            }
        }
        
        return $results;
    }
}
?>