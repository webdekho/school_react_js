<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

class Parents extends API_Controller {
    
    // Declare all model properties to fix PHP 8.2 dynamic property warnings
    public $Complaint_model;
    public $Student_model;
    public $Academic_year_model;
    public $Announcement_model;
    public $Fee_collection_model;
    public $Parent_model;
    
    // Declare library properties
    public $form_validation;
    
    public function __construct() {
        parent::__construct();
        $this->load->model(['Complaint_model', 'Student_model', 'Academic_year_model', 'Announcement_model', 'Fee_collection_model', 'Parent_model']);
        
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

    // ==================== PROFILE MANAGEMENT ====================

    /**
     * Get or Update parent profile information
     * GET/PUT /api/parent/profile
     */
    public function profile() {
        $method = $this->input->method();
        
        if ($method === 'get') {
            return $this->get_profile();
        } else if ($method === 'put') {
            return $this->update_profile();
        }
        
        $this->send_error('Method not allowed', 405);
    }

    /**
     * Get parent profile
     * GET /api/parent/profile
     */
    private function get_profile() {
        try {
            $parent_id = $this->user['id'];
            
            // Get parent information
            $parent = $this->Parent_model->get_parent_by_id($parent_id);
            
            if (!$parent) {
                $this->send_error('Parent not found', 404);
                return;
            }
            
            // Get parent's children
            $children = $this->Student_model->get_students_by_parent($parent_id);
            
            // Add children to response
            $parent['children'] = $children;
            
            // Remove sensitive data
            unset($parent['password']);
            
            $this->send_response($parent, 'Profile retrieved successfully');
            
        } catch (Exception $e) {
            log_message('error', 'Parent profile error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve profile', 500);
        }
    }

    /**
     * Update parent profile
     * PUT /api/parent/profile
     */
    private function update_profile() {
        try {
            $input = $this->get_input();
            $parent_id = $this->user['id'];
            
            // Validation rules
            $rules = [
                'name' => 'required|max_length[100]',
                'email' => 'required|valid_email|max_length[100]',
                'mobile' => 'required|max_length[20]',
                'phone' => 'max_length[20]',
                'address' => 'max_length[500]',
                'emergency_contact' => 'max_length[20]',
                'occupation' => 'max_length[100]',
                'relation' => 'in_list[Father,Mother,Guardian,Uncle,Aunt,Grandparent,Other]'
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
            
            // Check if email is unique (excluding current user)
            $existing_parent = $this->Parent_model->get_parent_by_email($input['email']);
            if ($existing_parent && $existing_parent['id'] != $parent_id) {
                $this->send_error('Email already in use', 400);
                return;
            }
            
            // Prepare update data
            $update_data = [
                'name' => $input['name'],
                'email' => $input['email'],
                'mobile' => $input['mobile'],
                'phone' => $input['phone'] ?? null,
                'address' => $input['address'] ?? null,
                'emergency_contact' => $input['emergency_contact'] ?? null,
                'occupation' => $input['occupation'] ?? null,
                'relation' => $input['relation'] ?? null,
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            if ($this->Parent_model->update_parent($parent_id, $update_data)) {
                // Log activity
                $this->log_activity('profile_updated', 'parents', $parent_id, null, $update_data);
                
                // Get updated profile
                $updated_parent = $this->Parent_model->get_parent_by_id($parent_id);
                unset($updated_parent['password']);
                
                $this->send_response($updated_parent, 'Profile updated successfully');
            } else {
                $this->send_error('Failed to update profile', 500);
            }
            
        } catch (Exception $e) {
            log_message('error', 'Update profile error: ' . $e->getMessage());
            $this->send_error('Failed to update profile', 500);
        }
    }

    /**
     * Change parent password
     * PUT /api/parent/change-password
     */
    public function change_password() {
        if ($this->input->method() !== 'put') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $input = $this->get_input();
            $parent_id = $this->user['id'];
            
            // Validation
            if (empty($input['current_password']) || empty($input['new_password'])) {
                $this->send_error('Current password and new password are required', 400);
                return;
            }
            
            if (strlen($input['new_password']) < 6) {
                $this->send_error('New password must be at least 6 characters', 400);
                return;
            }
            
            // Get parent
            $parent = $this->Parent_model->get_parent_by_id($parent_id);
            
            if (!$parent) {
                $this->send_error('Parent not found', 404);
                return;
            }
            
            // Verify current password
            if (!password_verify($input['current_password'], $parent['password'])) {
                $this->send_error('Current password is incorrect', 400);
                return;
            }
            
            // Update password
            $new_password_hash = password_hash($input['new_password'], PASSWORD_DEFAULT);
            
            if ($this->Parent_model->update_parent($parent_id, ['password' => $new_password_hash])) {
                // Log activity
                $this->log_activity('password_changed', 'parents', $parent_id);
                
                $this->send_response(null, 'Password changed successfully');
            } else {
                $this->send_error('Failed to change password', 500);
            }
            
        } catch (Exception $e) {
            log_message('error', 'Change password error: ' . $e->getMessage());
            $this->send_error('Failed to change password', 500);
        }
    }

    /**
     * Upload profile picture
     * POST /api/parent/upload-profile-picture
     */
    public function upload_profile_picture() {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $parent_id = $this->user['id'];
            
            // Check if file was uploaded
            if (empty($_FILES['profile_picture']['name'])) {
                $this->send_error('No file uploaded', 400);
                return;
            }
            
            // Configure upload
            $config['upload_path'] = './uploads/profiles/';
            $config['allowed_types'] = 'gif|jpg|jpeg|png';
            $config['max_size'] = 5120; // 5MB
            $config['file_name'] = 'parent_' . $parent_id . '_' . time();
            
            // Create directory if it doesn't exist
            if (!is_dir($config['upload_path'])) {
                mkdir($config['upload_path'], 0755, true);
            }
            
            $this->load->library('upload', $config);
            
            if (!$this->upload->do_upload('profile_picture')) {
                $error = $this->upload->display_errors('', '');
                $this->send_error($error, 400);
                return;
            }
            
            $upload_data = $this->upload->data();
            $file_path = 'uploads/profiles/' . $upload_data['file_name'];
            
            // Delete old profile picture if exists
            $parent = $this->Parent_model->get_parent_by_id($parent_id);
            if (!empty($parent['profile_picture']) && file_exists('./' . $parent['profile_picture'])) {
                unlink('./' . $parent['profile_picture']);
            }
            
            // Update parent record
            if ($this->Parent_model->update_parent($parent_id, ['profile_picture' => $file_path])) {
                // Log activity
                $this->log_activity('profile_picture_updated', 'parents', $parent_id);
                
                $this->send_response([
                    'profile_picture' => $file_path
                ], 'Profile picture uploaded successfully');
            } else {
                $this->send_error('Failed to update profile picture', 500);
            }
            
        } catch (Exception $e) {
            log_message('error', 'Upload profile picture error: ' . $e->getMessage());
            $this->send_error('Failed to upload profile picture', 500);
        }
    }

    /**
     * Get parent activity log
     * GET /api/parent/activity-log
     */
    public function activity_log() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $parent_id = $this->user['id'];
            $limit = (int) $this->input->get('limit', 20);
            
            // Get activity log from database
            if ($this->db->table_exists('activity_logs')) {
                $this->db->select('*');
                $this->db->from('activity_logs');
                $this->db->where('user_id', $parent_id);
                $this->db->where('user_type', 'parent');
                $this->db->order_by('created_at', 'DESC');
                $this->db->limit($limit);
                $query = $this->db->get();
                $activities = $query->result_array();
            } else {
                // Return empty array if table doesn't exist
                $activities = [];
            }
            
            $this->send_response($activities, 'Activity log retrieved successfully');
            
        } catch (Exception $e) {
            log_message('error', 'Activity log error: ' . $e->getMessage());
            // Return empty array on error
            $this->send_response([], 'Activity log retrieved successfully');
        }
    }

    // ==================== SUPPORT TICKETS ====================

    /**
     * Get support tickets for parent
     * GET /api/parent/support-tickets
     */
    public function support_tickets() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $parent_id = $this->user['id'];
            
            // Get tickets from database
            if ($this->db->table_exists('support_tickets')) {
                $this->db->select('*');
                $this->db->from('support_tickets');
                $this->db->where('user_id', $parent_id);
                $this->db->where('user_type', 'parent');
                $this->db->order_by('created_at', 'DESC');
                $query = $this->db->get();
                
                $tickets = $query->result_array();
            } else {
                // Return empty array if table doesn't exist
                $tickets = [];
            }
            
            $this->send_response($tickets, 'Support tickets retrieved successfully');
            
        } catch (Exception $e) {
            log_message('error', 'Support tickets error: ' . $e->getMessage());
            // Return empty array on error
            $this->send_response([], 'Support tickets retrieved successfully');
        }
    }

    /**
     * Create support ticket
     * POST /api/parent/support-ticket
     */
    public function support_ticket() {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $input = $this->get_input();
            $parent_id = $this->user['id'];
            
            // Validation
            if (empty($input['subject']) || empty($input['message'])) {
                $this->send_error('Subject and message are required', 400);
                return;
            }
            
            // Check if table exists
            if (!$this->db->table_exists('support_tickets')) {
                // Create the table
                $this->db->query("
                    CREATE TABLE IF NOT EXISTS support_tickets (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        user_type VARCHAR(20) NOT NULL,
                        subject VARCHAR(200) NOT NULL,
                        category VARCHAR(50) DEFAULT 'general',
                        priority VARCHAR(20) DEFAULT 'medium',
                        message TEXT NOT NULL,
                        status VARCHAR(20) DEFAULT 'open',
                        response TEXT,
                        responded_at DATETIME,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_user (user_id, user_type),
                        INDEX idx_status (status)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                ");
            }
            
            // Prepare ticket data
            $ticket_data = [
                'user_id' => $parent_id,
                'user_type' => 'parent',
                'subject' => $input['subject'],
                'category' => $input['category'] ?? 'general',
                'priority' => $input['priority'] ?? 'medium',
                'message' => $input['message'],
                'status' => 'open',
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            $this->db->insert('support_tickets', $ticket_data);
            $ticket_id = $this->db->insert_id();
            
            if ($ticket_id) {
                // Log activity
                $this->log_activity('support_ticket_created', 'support_tickets', $ticket_id);
                
                $this->send_response([
                    'id' => $ticket_id
                ], 'Support ticket submitted successfully', 201);
            } else {
                $this->send_error('Failed to create support ticket', 500);
            }
            
        } catch (Exception $e) {
            log_message('error', 'Create support ticket error: ' . $e->getMessage());
            $this->send_error('Failed to create support ticket', 500);
        }
    }
}