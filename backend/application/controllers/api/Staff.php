<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

class Staff extends API_Controller {
    
    // Declare all model properties to fix PHP 8.2 dynamic property warnings
    public $Complaint_model;
    public $Student_model;
    public $Parent_model;
    public $Academic_year_model;
    public $Staff_wallet_model;
    
    // Declare library properties
    public $form_validation;
    
    public function __construct() {
        parent::__construct();
        $this->load->model(['Complaint_model', 'Student_model', 'Parent_model', 'Academic_year_model', 'Staff_wallet_model']);
        
        // Ensure only staff can access
        if (!$this->require_user_type(['staff'])) {
            return;
        }
    }
    
    /**
     * Get complaints assigned to this staff member
     * GET /api/staff/assigned_complaints
     */
    public function assigned_complaints($id = null) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $staff_id = $this->user['id'];
            
            if ($id) {
                // Get specific complaint
                $complaint = $this->Complaint_model->get_complaint_by_id($id);
                
                if (!$complaint || $complaint['assigned_to_staff_id'] != $staff_id) {
                    $this->send_error('Complaint not found or not assigned to you', 404);
                    return;
                }
                
                // Get all comments (including internal ones for staff)
                $complaint['comments'] = $this->Complaint_model->get_complaint_comments($id, true);
                
                $this->send_response($complaint, 'Complaint retrieved successfully');
            } else {
                // Get all assigned complaints
                $limit = $this->input->get('limit') ?: 10;
                $offset = $this->input->get('offset') ?: 0;
                
                $complaints = $this->Complaint_model->get_complaints_by_staff($staff_id, $limit, $offset);
                $total = count($this->Complaint_model->get_complaints_by_staff($staff_id));
                
                $this->send_response([
                    'data' => $complaints,
                    'total' => $total,
                    'limit' => (int)$limit,
                    'offset' => (int)$offset
                ], 'Assigned complaints retrieved successfully');
            }
        } catch (Exception $e) {
            log_message('error', 'Staff assigned complaints error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve complaints', 500);
        }
    }
    
    /**
     * Create new complaint (staff can raise complaints too)
     * POST /api/staff/complaints
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
                'parent_id' => 'required|numeric',
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
            
            // Verify parent exists
            $parent = $this->Parent_model->get_parent_by_id($input['parent_id']);
            if (!$parent) {
                $this->send_error('Invalid parent selection', 400);
                return;
            }
            
            // Verify student belongs to parent if student_id is provided
            if (!empty($input['student_id'])) {
                $student = $this->Student_model->get_student_by_id($input['student_id']);
                if (!$student || $student['parent_id'] != $input['parent_id']) {
                    $this->send_error('Invalid student selection', 400);
                    return;
                }
            }
            
            // Prepare complaint data
            $complaint_data = [
                'parent_id' => $input['parent_id'],
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
                // Add a comment indicating this was created by staff
                $this->Complaint_model->add_comment($complaint_id, [
                    'commented_by_type' => 'staff',
                    'commented_by_id' => $this->user['id'],
                    'comment' => 'Complaint filed by staff member on behalf of parent.',
                    'is_internal' => 1
                ]);
                
                // Log activity
                $this->log_activity('complaint_created_by_staff', 'complaints', $complaint_id, null, $complaint_data);
                
                $this->send_response([
                    'id' => $complaint_id,
                    'complaint_number' => $this->Complaint_model->get_complaint_by_id($complaint_id)['complaint_number']
                ], 'Complaint submitted successfully', 201);
            } else {
                $this->send_error('Failed to create complaint', 500);
            }
            
        } catch (Exception $e) {
            log_message('error', 'Staff create complaint error: ' . $e->getMessage());
            $this->send_error('Failed to create complaint', 500);
        }
    }
    
    /**
     * Update complaint status (for assigned complaints)
     * PUT /api/staff/complaints/{id}/status
     */
    public function update_complaint_status($complaint_id) {
        if ($this->input->method() !== 'put') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $input = $this->get_input();
            
            // Validate input
            if (empty($input['status']) || !in_array($input['status'], ['in_progress', 'resolved'])) {
                $this->send_error('Valid status is required (in_progress, resolved)', 400);
                return;
            }
            
            // Verify complaint is assigned to this staff member
            $complaint = $this->Complaint_model->get_complaint_by_id($complaint_id);
            if (!$complaint || $complaint['assigned_to_staff_id'] != $this->user['id']) {
                $this->send_error('Complaint not found or not assigned to you', 404);
                return;
            }
            
            if ($input['status'] === 'resolved') {
                if (empty($input['resolution'])) {
                    $this->send_error('Resolution notes are required', 400);
                    return;
                }
                
                if ($this->Complaint_model->resolve_complaint($complaint_id, $input['resolution'], $this->user['id'])) {
                    $this->send_response(null, 'Complaint resolved successfully');
                } else {
                    $this->send_error('Failed to resolve complaint', 500);
                }
            } else {
                // Update to in_progress
                $update_data = ['status' => 'in_progress'];
                if ($this->Complaint_model->update_complaint($complaint_id, $update_data)) {
                    // Add comment
                    $this->Complaint_model->add_comment($complaint_id, [
                        'commented_by_type' => 'staff',
                        'commented_by_id' => $this->user['id'],
                        'comment' => 'Complaint status updated to in progress.',
                        'is_internal' => 0
                    ]);
                    
                    $this->send_response(null, 'Complaint status updated successfully');
                } else {
                    $this->send_error('Failed to update complaint status', 500);
                }
            }
            
        } catch (Exception $e) {
            log_message('error', 'Update complaint status error: ' . $e->getMessage());
            $this->send_error('Failed to update complaint status', 500);
        }
    }
    
    /**
     * Add comment to complaint
     * POST /api/staff/complaints/{id}/comments
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
            
            // Verify complaint is assigned to this staff member
            $complaint = $this->Complaint_model->get_complaint_by_id($complaint_id);
            if (!$complaint || $complaint['assigned_to_staff_id'] != $this->user['id']) {
                $this->send_error('Complaint not found or not assigned to you', 404);
                return;
            }
            
            // Don't allow comments on closed complaints
            if ($complaint['status'] === 'closed') {
                $this->send_error('Cannot comment on closed complaint', 400);
                return;
            }
            
            $comment_data = [
                'commented_by_type' => 'staff',
                'commented_by_id' => $this->user['id'],
                'comment' => $input['comment'],
                'attachments' => $input['attachments'] ?: [],
                'is_internal' => isset($input['is_internal']) ? (bool)$input['is_internal'] : false
            ];
            
            if ($this->Complaint_model->add_comment($complaint_id, $comment_data)) {
                $this->send_response(null, 'Comment added successfully', 201);
            } else {
                $this->send_error('Failed to add comment', 500);
            }
            
        } catch (Exception $e) {
            log_message('error', 'Staff add comment error: ' . $e->getMessage());
            $this->send_error('Failed to add comment', 500);
        }
    }
    
    /**
     * Get assigned complaint statistics
     * GET /api/staff/complaints_stats
     */
    public function complaints_stats() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $staff_id = $this->user['id'];
            
            // Get all assigned complaints
            $all_complaints = $this->Complaint_model->get_complaints_by_staff($staff_id);
            
            $stats = [
                'total_assigned' => count($all_complaints),
                'by_status' => [],
                'by_category' => [],
                'by_priority' => [],
                'recent' => 0,
                'avg_resolution_days' => 0
            ];
            
            $recent_date = date('Y-m-d', strtotime('-30 days'));
            $resolution_times = [];
            
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
                
                // Calculate resolution time
                if ($complaint['status'] === 'resolved' && $complaint['resolved_at']) {
                    $created = new DateTime($complaint['created_at']);
                    $resolved = new DateTime($complaint['resolved_at']);
                    $diff = $created->diff($resolved);
                    $resolution_times[] = $diff->days;
                }
            }
            
            // Calculate average resolution time
            if (!empty($resolution_times)) {
                $stats['avg_resolution_days'] = round(array_sum($resolution_times) / count($resolution_times), 1);
            }
            
            $this->send_response($stats, 'Statistics retrieved successfully');
            
        } catch (Exception $e) {
            log_message('error', 'Staff complaint stats error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve statistics', 500);
        }
    }
    
    /**
     * Get parents list for complaint creation
     * GET /api/staff/parents
     */
    public function parents() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $search = $this->input->get('search');
            $limit = $this->input->get('limit') ?: 50;
            
            $parents = $this->Parent_model->get_parents_dropdown($search, $limit);
            
            $this->send_response($parents, 'Parents retrieved successfully');
            
        } catch (Exception $e) {
            log_message('error', 'Staff get parents error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve parents', 500);
        }
    }
    
    /**
     * Get students for selected parent
     * GET /api/staff/parent/{parent_id}/students
     */
    public function parent_students($parent_id) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $students = $this->Student_model->get_students_by_parent($parent_id);
            
            $this->send_response($students, 'Students retrieved successfully');
            
        } catch (Exception $e) {
            log_message('error', 'Staff get parent students error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve students', 500);
        }
    }

    // ==================== STAFF WALLET METHODS ====================
    
    /**
     * Get current staff's wallet information
     * GET /api/staff/wallet
     */
    public function wallet() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            $staff_id = $this->user['id'];
            $wallet = $this->Staff_wallet_model->get_wallet_by_staff_id($staff_id);
            
            if (!$wallet) {
                // Create wallet if it doesn't exist
                $this->Staff_wallet_model->create_wallet($staff_id);
                $wallet = $this->Staff_wallet_model->get_wallet_by_staff_id($staff_id);
            }
            
            $this->send_response($wallet, 'Wallet information retrieved successfully');
            
        } catch (Exception $e) {
            log_message('error', 'Staff wallet error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve wallet information', 500);
        }
    }

    /**
     * Get current staff's ledger (transaction history)
     * GET /api/staff/ledger
     */
    public function ledger() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            $staff_id = $this->user['id'];
            $limit = (int) $this->input->get('limit', 50);
            $offset = (int) $this->input->get('offset', 0);
            $start_date = $this->input->get('start_date');
            $end_date = $this->input->get('end_date');

            $ledger = $this->Staff_wallet_model->get_ledger($staff_id, $limit, $offset, $start_date, $end_date);
            $total = $this->Staff_wallet_model->count_ledger($staff_id, $start_date, $end_date);

            $this->send_response([
                'data' => $ledger,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ], 'Ledger retrieved successfully');
            
        } catch (Exception $e) {
            log_message('error', 'Staff ledger error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve ledger', 500);
        }
    }
}