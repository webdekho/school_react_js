<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

class Parent extends API_Controller {
    
    // Declare all model properties to fix PHP 8.2 dynamic property warnings
    public $Complaint_model;
    public $Student_model;
    public $Academic_year_model;
    
    // Declare library properties
    public $form_validation;
    
    public function __construct() {
        parent::__construct();
        $this->load->model(['Complaint_model', 'Student_model', 'Academic_year_model']);
        
        // Ensure only parents can access
        if (!$this->require_user_type(['parent'])) {
            return;
        }
    }
    
    /**
     * Get parent's children (students)
     * GET /api/parent/students
     */
    public function students() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $parent_id = $this->user['id'];
            $students = $this->Student_model->get_students_by_parent($parent_id);
            
            $this->send_response($students, 'Students retrieved successfully');
        } catch (Exception $e) {
            log_message('error', 'Parent students error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve students', 500);
        }
    }
    
    /**
     * Get parent's complaints
     * GET /api/parent/complaints
     */
    public function complaints($id = null) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $parent_id = $this->user['id'];
            
            if ($id) {
                // Get specific complaint
                $complaint = $this->Complaint_model->get_complaint_by_id($id);
                
                if (!$complaint || $complaint['parent_id'] != $parent_id) {
                    $this->send_error('Complaint not found', 404);
                    return;
                }
                
                // Get comments (only non-internal ones for parents)
                $complaint['comments'] = $this->Complaint_model->get_complaint_comments($id, false);
                
                $this->send_response($complaint, 'Complaint retrieved successfully');
            } else {
                // Get all complaints for parent
                $limit = $this->input->get('limit') ?: 10;
                $offset = $this->input->get('offset') ?: 0;
                
                $complaints = $this->Complaint_model->get_complaints_by_parent($parent_id, $limit, $offset);
                $total = count($this->Complaint_model->get_complaints_by_parent($parent_id));
                
                $this->send_response([
                    'data' => $complaints,
                    'total' => $total,
                    'limit' => (int)$limit,
                    'offset' => (int)$offset
                ], 'Complaints retrieved successfully');
            }
        } catch (Exception $e) {
            log_message('error', 'Parent complaints error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve complaints', 500);
        }
    }
    
    /**
     * Create new complaint
     * POST /api/parent/complaints
     */
    public function create_complaint() {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $input = $this->get_input();
            
            // Validation rules
            $rules = [
                'subject' => 'required|max_length[200]',
                'description' => 'required',
                'category' => 'required|in_list[academic,transport,facility,staff,fee,other]',
                'priority' => 'in_list[low,medium,high,urgent]',
                'student_id' => 'numeric'
            ];
            
            // Validate input
            $this->load->library('form_validation');
            $this->form_validation->set_data($input);
            
            foreach ($rules as $field => $rule) {
                $this->form_validation->set_rules($field, $field, $rule);
            }
            
            if (!$this->form_validation->run()) {
                $errors = $this->form_validation->error_array();
                $this->send_error('Validation failed', 400, $errors);
                return;
            }
            
            // Verify student belongs to parent if student_id is provided
            if (!empty($input['student_id'])) {
                $student = $this->Student_model->get_student_by_id($input['student_id']);
                if (!$student || $student['parent_id'] != $this->user['id']) {
                    $this->send_error('Invalid student selection', 400);
                    return;
                }
            }
            
            // Get current academic year
            $current_year = $this->Academic_year_model->get_default_academic_year();
            
            // Prepare complaint data
            $complaint_data = [
                'parent_id' => $this->user['id'],
                'student_id' => $input['student_id'] ?: null,
                'subject' => $input['subject'],
                'description' => $input['description'],
                'category' => $input['category'],
                'priority' => $input['priority'] ?: 'medium',
                'status' => 'new',
                'is_anonymous' => isset($input['is_anonymous']) ? (bool)$input['is_anonymous'] : false,
                'attachments' => $input['attachments'] ?: []
            ];
            
            $complaint_id = $this->Complaint_model->create_complaint($complaint_data);
            
            if ($complaint_id) {
                // Log activity
                $this->log_activity('complaint_created', 'complaints', $complaint_id, null, $complaint_data);
                
                $this->send_response([
                    'id' => $complaint_id,
                    'complaint_number' => $this->Complaint_model->get_complaint_by_id($complaint_id)['complaint_number']
                ], 'Complaint submitted successfully', 201);
            } else {
                $this->send_error('Failed to create complaint', 500);
            }
            
        } catch (Exception $e) {
            log_message('error', 'Create complaint error: ' . $e->getMessage());
            $this->send_error('Failed to create complaint', 500);
        }
    }
    
    /**
     * Add comment to complaint
     * POST /api/parent/complaints/{id}/comments
     */
    public function add_comment($complaint_id) {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $input = $this->get_input();
            
            // Validate input
            if (empty($input['comment'])) {
                $this->send_error('Comment is required', 400);
                return;
            }
            
            // Verify complaint belongs to parent
            $complaint = $this->Complaint_model->get_complaint_by_id($complaint_id);
            if (!$complaint || $complaint['parent_id'] != $this->user['id']) {
                $this->send_error('Complaint not found', 404);
                return;
            }
            
            // Don't allow comments on closed complaints
            if ($complaint['status'] === 'closed') {
                $this->send_error('Cannot comment on closed complaint', 400);
                return;
            }
            
            $comment_data = [
                'commented_by_type' => 'parent',
                'commented_by_id' => $this->user['id'],
                'comment' => $input['comment'],
                'attachments' => $input['attachments'] ?: [],
                'is_internal' => 0 // Parent comments are never internal
            ];
            
            if ($this->Complaint_model->add_comment($complaint_id, $comment_data)) {
                $this->send_response(null, 'Comment added successfully', 201);
            } else {
                $this->send_error('Failed to add comment', 500);
            }
            
        } catch (Exception $e) {
            log_message('error', 'Add comment error: ' . $e->getMessage());
            $this->send_error('Failed to add comment', 500);
        }
    }
    
    /**
     * Get complaint statistics for parent
     * GET /api/parent/complaints_stats
     */
    public function complaints_stats() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $parent_id = $this->user['id'];
            
            // Get all complaints for parent
            $all_complaints = $this->Complaint_model->get_complaints_by_parent($parent_id);
            
            $stats = [
                'total' => count($all_complaints),
                'by_status' => [],
                'by_category' => [],
                'by_priority' => [],
                'recent' => 0
            ];
            
            $recent_date = date('Y-m-d', strtotime('-30 days'));
            
            foreach ($all_complaints as $complaint) {
                // Count by status
                $status = $complaint['status'];
                $stats['by_status'][$status] = ($stats['by_status'][$status] ?? 0) + 1;
                
                // Count by category
                $category = $complaint['category'];
                $stats['by_category'][$category] = ($stats['by_category'][$category] ?? 0) + 1;
                
                // Count by priority
                $priority = $complaint['priority'];
                $stats['by_priority'][$priority] = ($stats['by_priority'][$priority] ?? 0) + 1;
                
                // Count recent complaints
                if ($complaint['created_at'] >= $recent_date) {
                    $stats['recent']++;
                }
            }
            
            $this->send_response($stats, 'Statistics retrieved successfully');
            
        } catch (Exception $e) {
            log_message('error', 'Parent complaint stats error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve statistics', 500);
        }
    }
}