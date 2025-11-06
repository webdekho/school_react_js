<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

class Parents extends API_Controller {
    
    // Declare all model properties to fix PHP 8.2 dynamic property warnings
    public $Complaint_model;
    public $Student_model;
    public $Academic_year_model;
    
    // Declare library properties
    public $form_validation;
    
    public function __construct() {
        parent::__construct();
        $this->load->model(['Complaint_model', 'Student_model', 'Academic_year_model', 'Announcement_model', 'Fee_collection_model']);
        
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
            // Check permission for viewing children
            if (!$this->check_permission('view_children') && !$this->check_permission('*')) {
                $this->send_error('Insufficient permissions to view children', 403);
                return;
            }

            $parent_id = $this->user['id'];
            $students = $this->Student_model->get_students_by_parent($parent_id);
            
            $this->send_response($students, 'Students retrieved successfully');
        } catch (Exception $e) {
            log_message('error', 'Parent students error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve students', 500);
        }
    }
    
    /**
     * Handle complaints (GET and POST)
     * GET /api/parent/complaints - List complaints
     * GET /api/parent/complaints/:id - Get specific complaint
     * POST /api/parent/complaints - Create new complaint
     */
    public function complaints($id = null) {
        $method = $this->input->method();
        
        // Handle POST - Create new complaint
        if ($method === 'post') {
            return $this->create_complaint();
        }
        
        // Handle GET
        if ($method !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            // Check permission for viewing complaints
            if (!$this->check_permission('view_complaints') && !$this->check_permission('*')) {
                $this->send_error('Insufficient permissions to view complaints', 403);
                return;
            }

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
     * Create new complaint (called internally by complaints() for POST)
     * POST /api/parent/complaints
     */
    private function create_complaint() {
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

    // ==================== ANNOUNCEMENT METHODS ====================

    /**
     * Get announcements visible to parents
     * GET /api/parent/announcements
     */
    public function announcements() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            // Check permission for viewing announcements
            if (!$this->check_permission('view_announcements') && !$this->check_permission('*')) {
                $this->send_error('Insufficient permissions to view announcements', 403);
                return;
            }

            $limit = (int) $this->input->get('limit', 20);
            $offset = (int) $this->input->get('offset', 0);
            $search = $this->input->get('search');

            // Parents can view announcements targeted to parents or all
            $announcements = $this->Announcement_model->get_announcements_for_parent($this->user['id'], $limit, $offset, $search);
            $total = $this->Announcement_model->count_announcements_for_parent($this->user['id'], $search);

            $this->send_response([
                'data' => $announcements,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ], 'Announcements retrieved successfully');

        } catch (Exception $e) {
            log_message('error', 'Parent announcements error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve announcements', 500);
        }
    }

    /**
     * Mark announcement as read
     * POST /api/parent/announcements/{id}/read
     */
    public function mark_announcement_read($announcement_id) {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            // Check permission
            if (!$this->check_permission('view_announcements') && !$this->check_permission('*')) {
                $this->send_error('Insufficient permissions', 403);
                return;
            }

            $result = $this->Announcement_model->mark_as_read($announcement_id, $this->user['id'], 'parent');
            
            if ($result) {
                $this->send_response(null, 'Announcement marked as read successfully');
            } else {
                $this->send_error('Failed to mark announcement as read', 500);
            }

        } catch (Exception $e) {
            log_message('error', 'Mark announcement read error: ' . $e->getMessage());
            $this->send_error('Failed to mark announcement as read', 500);
        }
    }

    // ==================== FEE TRACKING METHODS ====================

    /**
     * Get fee payment history for parent's children
     * GET /api/parent/fee_payments
     */
    public function fee_payments($student_id = null) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            // Check permission
            if (!$this->check_permission('view_fee_payments') && !$this->check_permission('*')) {
                $this->send_error('Insufficient permissions to view fee payments', 403);
                return;
            }

            $parent_id = $this->user['id'];
            $limit = (int) $this->input->get('limit', 20);
            $offset = (int) $this->input->get('offset', 0);
            $start_date = $this->input->get('start_date');
            $end_date = $this->input->get('end_date');

            if ($student_id) {
                // Verify student belongs to this parent
                $student = $this->Student_model->get_student_by_id($student_id);
                if (!$student || $student['parent_id'] != $parent_id) {
                    $this->send_error('Student not found or access denied', 404);
                    return;
                }
                
                $payments = $this->Fee_collection_model->get_collections_by_student($student_id, $limit, $offset, $start_date, $end_date);
                $total = $this->Fee_collection_model->count_collections_by_student($student_id, $start_date, $end_date);
            } else {
                // Get all payments for parent's children
                $payments = $this->Fee_collection_model->get_collections_by_parent($parent_id, $limit, $offset, $start_date, $end_date);
                $total = $this->Fee_collection_model->count_collections_by_parent($parent_id, $start_date, $end_date);
            }

            $this->send_response([
                'data' => $payments,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ], 'Fee payments retrieved successfully');

        } catch (Exception $e) {
            log_message('error', 'Parent fee payments error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve fee payments', 500);
        }
    }

    /**
     * Get outstanding fees for parent's children
     * GET /api/parent/outstanding_fees
     */
    public function outstanding_fees($student_id = null) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            // Check permission
            if (!$this->check_permission('view_outstanding_fees') && !$this->check_permission('*')) {
                $this->send_error('Insufficient permissions to view outstanding fees', 403);
                return;
            }

            $parent_id = $this->user['id'];

            if ($student_id) {
                // Verify student belongs to this parent
                $student = $this->Student_model->get_student_by_id($student_id);
                if (!$student || $student['parent_id'] != $parent_id) {
                    $this->send_error('Student not found or access denied', 404);
                    return;
                }
                
                $outstanding_fees = $this->Fee_collection_model->get_outstanding_fees_by_student($student_id);
            } else {
                // Get outstanding fees for all children
                $outstanding_fees = $this->Fee_collection_model->get_outstanding_fees_by_parent($parent_id);
            }

            $this->send_response($outstanding_fees, 'Outstanding fees retrieved successfully');

        } catch (Exception $e) {
            log_message('error', 'Parent outstanding fees error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve outstanding fees', 500);
        }
    }

    /**
     * Get fee summary for parent's children
     * GET /api/parent/fee_summary
     */
    public function fee_summary() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            // Check permission
            if (!$this->check_permission('view_fee_summary') && !$this->check_permission('*')) {
                $this->send_error('Insufficient permissions to view fee summary', 403);
                return;
            }

            $parent_id = $this->user['id'];
            $summary = $this->Fee_collection_model->get_fee_summary_by_parent($parent_id);

            $this->send_response($summary, 'Fee summary retrieved successfully');

        } catch (Exception $e) {
            log_message('error', 'Parent fee summary error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve fee summary', 500);
        }
    }

    // ==================== ACADEMIC YEAR METHODS ====================

    /**
     * Get current academic year
     * GET /api/parent/academic_year
     */
    public function academic_year() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            $academic_year = $this->Academic_year_model->get_default_academic_year();
            
            if ($academic_year) {
                $this->send_response($academic_year, 'Academic year retrieved successfully');
            } else {
                $this->send_error('No active academic year found', 404);
            }

        } catch (Exception $e) {
            log_message('error', 'Parent academic year error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve academic year', 500);
        }
    }

    // ==================== ENHANCED STUDENT INFORMATION ====================

    /**
     * Get detailed student information for parent
     * GET /api/parent/students/{student_id}/details
     */
    public function student_details($student_id) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            // Check permission
            if (!$this->check_permission('view_student_details') && !$this->check_permission('*')) {
                $this->send_error('Insufficient permissions to view student details', 403);
                return;
            }

            $parent_id = $this->user['id'];
            
            // Verify student belongs to this parent
            $student = $this->Student_model->get_detailed_student_info($student_id);
            if (!$student || $student['parent_id'] != $parent_id) {
                $this->send_error('Student not found or access denied', 404);
                return;
            }

            $this->send_response($student, 'Student details retrieved successfully');

        } catch (Exception $e) {
            log_message('error', 'Parent student details error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve student details', 500);
        }
    }
}