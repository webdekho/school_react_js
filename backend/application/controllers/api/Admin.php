<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

class Admin extends API_Controller {
    
    // Declare all model properties to fix PHP 8.2 dynamic property warnings
    public $Grade_model;
    public $Division_model;
    public $Student_model;
    public $Parent_model;
    public $Staff_model;
    public $Fee_model;
    public $Academic_year_model;
    public $Fee_category_model;
    public $Fee_structure_model;
    public $Fee_collection_model;
    public $Announcement_model;
    public $Complaint_model;
    public $Report_model;
    public $Role_model;
    public $Staff_wallet_model;
    public $Attendance_model;
    public $Staff_attendance_model;
    public $Vision_statement_model;
    public $Staff_kids_model;
    public $Parent_staff_model;
    public $Subject_model;
    public $Syllabus_model;
    
    // Declare library properties to fix PHP 8.2 dynamic property warnings
    public $form_validation;
    public $upload;
    
    public function __construct() {
        parent::__construct();
        $this->load->model(['Grade_model', 'Division_model', 'Student_model', 'Parent_model', 'Staff_model', 'Fee_model', 'Academic_year_model', 'Fee_category_model', 'Fee_structure_model', 'Fee_collection_model', 'Announcement_model', 'Complaint_model', 'Report_model', 'Role_model', 'Staff_wallet_model', 'Attendance_model', 'Staff_attendance_model', 'Vision_statement_model', 'Staff_kids_model', 'Parent_staff_model', 'Subject_model', 'Syllabus_model']);
        
        // Skip authentication for public download endpoint
        if ($this->uri->segment(3) === 'public_download_attachment') {
            return;
        }
        
        // Ensure only admin users can access admin endpoints
        if (!$this->require_user_type(['admin'])) {
            return;
        }
    }
    
    // Test endpoint for debugging
    public function test() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        $this->send_response([
            'message' => 'Test endpoint working',
            'timestamp' => date('Y-m-d H:i:s'),
            'php_version' => phpversion(),
            'user_type' => $this->user_type,
            'permissions' => $this->permissions,
            'has_wildcard' => in_array('*', $this->permissions)
        ]);
    }

    // Debug endpoint to check permissions
    public function debug_permissions() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        $this->send_response([
            'user_id' => $this->user['id'] ?? null,
            'user_type' => $this->user_type,
            'raw_permissions' => $this->user['permissions'] ?? null,
            'parsed_permissions' => $this->permissions,
            'has_wildcard' => in_array('*', $this->permissions),
            'check_staff_permission' => $this->check_permission('staff'),
            'check_wildcard_permission' => $this->check_permission('*'),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
    
    // Debug endpoint for fee structures
    public function debug_fee_structures() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            // Check fee categories
            $this->db->select('COUNT(*) as count');
            $categories_count = $this->db->get('fee_categories')->row_array()['count'];
            
            // Check fee structures
            $this->db->select('COUNT(*) as count');
            $structures_count = $this->db->get('fee_structures')->row_array()['count'];
            
            // Get sample data with detailed join
            $this->db->select('fs.id, fs.fee_category_id, fs.amount, fc.id as cat_id, fc.name as category_name');
            $this->db->from('fee_structures fs');
            $this->db->join('fee_categories fc', 'fs.fee_category_id = fc.id', 'left');
            $this->db->where('fs.is_active', 1);
            $this->db->limit(5);
            $sample_data = $this->db->get()->result_array();
            
            // Get orphaned structures (no matching category)
            $this->db->select('fs.id, fs.fee_category_id');
            $this->db->from('fee_structures fs');
            $this->db->join('fee_categories fc', 'fs.fee_category_id = fc.id', 'left');
            $this->db->where('fs.is_active', 1);
            $this->db->where('fc.id IS NULL');
            $orphaned_structures = $this->db->get()->result_array();
            
            $this->send_response([
                'categories_count' => $categories_count,
                'structures_count' => $structures_count,
                'sample_structures' => $sample_data,
                'orphaned_structures' => $orphaned_structures,
                'last_query' => $this->db->last_query()
            ]);
        } catch (Exception $e) {
            $this->send_error('Debug failed: ' . $e->getMessage(), 500);
        }
    }
    
    // Debug endpoint for fee collections and receipts
    public function debug_fee_collections() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            // Check fee collections count
            $this->db->select('COUNT(*) as count');
            $collections_count = $this->db->get('fee_collections')->row_array()['count'];
            
            // Get sample collection with full join
            $this->db->select('fc.*, s.student_name, s.roll_number');
            $this->db->from('fee_collections fc');
            $this->db->join('students s', 'fc.student_id = s.id', 'left');
            $this->db->limit(1);
            $sample_collection = $this->db->get()->result_array();
            
            // Test the Fee_collection_model method
            $model_result = null;
            if (count($sample_collection) > 0) {
                $this->load->model('Fee_collection_model');
                $model_result = $this->Fee_collection_model->get_collection_by_id($sample_collection[0]['id']);
            }
            
            $this->send_response([
                'collections_count' => $collections_count,
                'sample_collection_raw' => $sample_collection,
                'sample_collection_model' => $model_result,
                'last_query' => $this->db->last_query()
            ]);
        } catch (Exception $e) {
            $this->send_error('Debug failed: ' . $e->getMessage(), 500);
        }
    }
    
    // Dashboard endpoint
    public function dashboard() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_permission('dashboard')) {
            return;
        }
        
        // Comprehensive dashboard data with safe database queries
        try {
            // Basic counts
            $total_students = $this->db->where('is_active', 1)->count_all_results('students');
            $total_staff = $this->db->where('is_active', 1)->count_all_results('staff');
            $total_grades = $this->db->where('is_active', 1)->count_all_results('grades');
            $total_divisions = $this->db->where('is_active', 1)->count_all_results('divisions');
            
            // Fees pending data - get from student_fee_assignments table
            $fees_pending = [
                'pending_count' => 0,
                'pending_amount' => 0
            ];
            
            // Try to get fees data from student_fee_assignments table
            if ($this->db->table_exists('student_fee_assignments')) {
                // Count of students with pending/partial fees
                $fees_pending['pending_count'] = $this->db->where_in('status', ['pending', 'partial', 'overdue'])
                    ->where('is_active', 1)
                    ->count_all_results('student_fee_assignments');
                
                // Total pending amount
                $pending_fees_query = $this->db->select_sum('pending_amount')
                    ->where_in('status', ['pending', 'partial', 'overdue'])
                    ->where('is_active', 1)
                    ->get('student_fee_assignments');
                
                $pending_fees_result = $pending_fees_query->row();
                $fees_pending['pending_amount'] = $pending_fees_result && $pending_fees_result->pending_amount 
                    ? (float)$pending_fees_result->pending_amount 
                    : 0;
                
                // Debug logging
                log_message('debug', 'Dashboard: Pending fees count = ' . $fees_pending['pending_count']);
                log_message('debug', 'Dashboard: Pending fees amount = ' . $fees_pending['pending_amount']);
                
                // If no pending amounts found in assignments, calculate from fee structures
                if ($fees_pending['pending_count'] == 0 && $this->db->table_exists('fee_structures')) {
                    // Get current academic year
                    $current_year_query = $this->db->where('is_current', 1)->get('academic_years');
                    $current_year = $current_year_query->row();
                    
                    if ($current_year) {
                        // Get active fee structures for current year
                        $fee_structures_count = $this->db->where('academic_year_id', $current_year->id)
                            ->where('is_active', 1)
                            ->count_all_results('fee_structures');
                            
                        $fee_structures_amount = $this->db->select_sum('amount')
                            ->where('academic_year_id', $current_year->id)
                            ->where('is_active', 1)
                            ->get('fee_structures')
                            ->row();
                        
                        if ($fee_structures_count > 0) {
                            $fees_pending['pending_count'] = $fee_structures_count;
                            $fees_pending['pending_amount'] = $fee_structures_amount && $fee_structures_amount->amount 
                                ? (float)$fee_structures_amount->amount 
                                : 0;
                            
                            log_message('debug', 'Dashboard: Using fee_structures - count = ' . $fees_pending['pending_count'] . ', amount = ' . $fees_pending['pending_amount']);
                        }
                    }
                }
            } else {
                // Fallback: If student_fee_assignments doesn't exist, check fee_collections
                if ($this->db->table_exists('fee_collections')) {
                    $fees_pending['pending_count'] = $this->db->where('status', 'pending')->count_all_results('fee_collections');
                    $pending_fees = $this->db->select_sum('amount')->where('status', 'pending')->get('fee_collections')->row();
                    $fees_pending['pending_amount'] = $pending_fees && $pending_fees->amount ? (float)$pending_fees->amount : 0;
                }
            }
            
            // Complaints summary
            $complaints_summary = [];
            if ($this->db->table_exists('complaints')) {
                $complaint_stats = $this->db->select('status, COUNT(*) as count')
                    ->group_by('status')
                    ->get('complaints')
                    ->result_array();
                
                foreach ($complaint_stats as $stat) {
                    $complaints_summary[$stat['status']] = (int)$stat['count'];
                }
            }
            
            // Recent activities - check both activity_logs and audit_logs tables
            $recent_activities = [];
            if ($this->db->table_exists('audit_logs')) {
                log_message('debug', 'Dashboard: audit_logs table exists, fetching activities');
                $activities = $this->db->select('action, user_type, user_id, table_name, record_id, created_at')
                    ->order_by('created_at', 'DESC')
                    ->limit(10)
                    ->get('audit_logs')
                    ->result_array();
                
                log_message('debug', 'Dashboard: Raw activities count: ' . count($activities));
                if (!empty($activities)) {
                    log_message('debug', 'Dashboard: First activity: ' . json_encode($activities[0]));
                }
                
                // Enrich activities with user names
                foreach ($activities as &$activity) {
                    $user_name = 'Unknown User';
                    log_message('debug', 'Dashboard: Processing activity - user_type: ' . $activity['user_type'] . ', user_id: ' . $activity['user_id']);
                    
                    if ($activity['user_id']) {
                        switch ($activity['user_type']) {
                            case 'staff':
                                if ($this->db->table_exists('staff')) {
                                    $user = $this->db->select('name')->where('id', $activity['user_id'])->get('staff')->row();
                                    $user_name = $user ? $user->name : 'Staff #' . $activity['user_id'];
                                    log_message('debug', 'Dashboard: Staff user found: ' . $user_name);
                                } else {
                                    log_message('debug', 'Dashboard: Staff table does not exist');
                                }
                                break;
                            case 'parent':
                                if ($this->db->table_exists('parents')) {
                                    $user = $this->db->select('name')->where('id', $activity['user_id'])->get('parents')->row();
                                    $user_name = $user ? $user->name : 'Parent #' . $activity['user_id'];
                                    log_message('debug', 'Dashboard: Parent user found: ' . $user_name);
                                } else {
                                    log_message('debug', 'Dashboard: Parents table does not exist');
                                }
                                break;
                            case 'student':
                                if ($this->db->table_exists('students')) {
                                    $user = $this->db->select('name')->where('id', $activity['user_id'])->get('students')->row();
                                    $user_name = $user ? $user->name : 'Student #' . $activity['user_id'];
                                    log_message('debug', 'Dashboard: Student user found: ' . $user_name);
                                } else {
                                    log_message('debug', 'Dashboard: Students table does not exist');
                                }
                                break;
                            case 'admin':
                                // Check if it's an admin user from staff table with admin role
                                if ($this->db->table_exists('staff')) {
                                    $user = $this->db->select('staff.name')
                                        ->from('staff')
                                        ->join('roles', 'roles.id = staff.role_id', 'left')
                                        ->where('staff.id', $activity['user_id'])
                                        ->get()->row();
                                    $user_name = $user ? $user->name : 'Admin #' . $activity['user_id'];
                                    log_message('debug', 'Dashboard: Admin user found: ' . $user_name);
                                } else {
                                    $user_name = 'Admin #' . $activity['user_id'];
                                }
                                break;
                            case 'system':
                                $user_name = 'System';
                                break;
                            default:
                                $user_name = ucfirst($activity['user_type']) . ' #' . $activity['user_id'];
                                log_message('debug', 'Dashboard: Unknown user type: ' . $activity['user_type']);
                                break;
                        }
                    } else {
                        $user_name = ucfirst($activity['user_type']) . ' (No ID)';
                        log_message('debug', 'Dashboard: No user_id provided for activity');
                    }
                    $activity['user_name'] = $user_name;
                    log_message('debug', 'Dashboard: Final user_name: ' . $user_name);
                }
                
                $recent_activities = $activities;
                log_message('debug', 'Dashboard: Found ' . count($recent_activities) . ' recent activities from audit_logs');
            } elseif ($this->db->table_exists('activity_logs')) {
                $activities = $this->db->select('action, user_type, user_id, created_at')
                    ->order_by('created_at', 'DESC')
                    ->limit(10)
                    ->get('activity_logs')
                    ->result_array();
                $recent_activities = $activities;
                log_message('debug', 'Dashboard: Found ' . count($recent_activities) . ' recent activities from activity_logs');
            }
            
            // If no activities found, create some sample data and log an activity for testing
            if (empty($recent_activities)) {
                log_message('debug', 'Dashboard: No activities found, generating sample data and logging dashboard access');
                
                // Log current dashboard access
                $this->log_activity('Dashboard Accessed', 'dashboard', null);
                
                // Generate sample data for display
                $recent_activities = [
                    [
                        'action' => 'Dashboard Accessed',
                        'user_type' => $this->user_type,
                        'user_id' => $this->user['id'],
                        'user_name' => 'Current User',
                        'created_at' => date('Y-m-d H:i:s')
                    ],
                    [
                        'action' => 'System Status Check',
                        'user_type' => 'system',
                        'user_id' => null,
                        'user_name' => 'System',
                        'created_at' => date('Y-m-d H:i:s', strtotime('-30 minutes'))
                    ]
                ];
            } else {
                // Log dashboard access for future
                $this->log_activity('Dashboard Accessed', 'dashboard', null);
            }
            
            $data = [
                'total_students' => $total_students,
                'total_staff' => $total_staff,
                'total_grades' => $total_grades,
                'total_divisions' => $total_divisions,
                'fees_pending' => $fees_pending,
                'complaints_summary' => $complaints_summary,
                'recent_activities' => $recent_activities,
                'user_info' => [
                    'name' => $this->user['name'],
                    'role' => $this->user['role_name'] ?? 'Admin',
                    'permissions' => json_decode($this->user['permissions'] ?? '[]', true)
                ]
            ];
        } catch (Exception $e) {
            log_message('error', 'Dashboard API Error: ' . $e->getMessage());
            // Return safe fallback data
            $data = [
                'total_students' => 0,
                'total_staff' => 0,
                'total_grades' => 0,
                'total_divisions' => 0,
                'fees_pending' => ['pending_count' => 0, 'pending_amount' => 0],
                'complaints_summary' => [],
                'recent_activities' => [],
                'user_info' => [
                    'name' => $this->user['name'] ?? 'Admin',
                    'role' => $this->user['role_name'] ?? 'Admin',
                    'permissions' => json_decode($this->user['permissions'] ?? '[]', true)
                ]
            ];
        }
        
        $this->send_response($data, 'Dashboard data retrieved successfully');
    }
    
    
    // Get grades for dropdown (no pagination)
    public function grades_dropdown() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['grades', 'grades.view', 'grades.create', 'grades.update', 'grades.delete'])) {
            return;
        }
        
        $grades = $this->Grade_model->get_grades_for_dropdown();
        $this->send_response($grades);
    }
    
    // Grade Management
    public function grades($id = null) {
        if (!$this->require_any_permission(['grades', 'grades.view', 'grades.create', 'grades.update', 'grades.delete'])) {
            return;
        }
        
        switch ($this->input->method()) {
            case 'get':
                if ($id) {
                    $grade = $this->Grade_model->get_grade_by_id($id);
                    if (!$grade) {
                        $this->send_error('Grade not found', 404);
                        return;
                    }
                    $this->send_response($grade);
                } else {
                    try {
                        $filters = [
                            'academic_year_id' => $this->input->get('academic_year_id'),
                            'search' => $this->input->get('search'),
                            'limit' => $this->input->get('limit') ?: 10,
                            'offset' => $this->input->get('offset') ?: 0
                        ];
                        
                        // Log for debugging
                        log_message('debug', 'Grades API - Filters: ' . json_encode($filters));
                        
                        $grades = $this->Grade_model->get_grades_paginated($filters['limit'], $filters['offset'], $filters['search'], $filters['academic_year_id']);
                        log_message('debug', 'Grades API - Got grades: ' . count($grades));
                        
                        $total = $this->Grade_model->count_grades($filters['search']);
                        log_message('debug', 'Grades API - Total count: ' . $total);
                        
                        $this->send_response([
                            'data' => $grades,
                            'total' => $total,
                            'limit' => $filters['limit'],
                            'offset' => $filters['offset'],
                            'has_next' => ($filters['offset'] + $filters['limit']) < $total,
                            'has_prev' => $filters['offset'] > 0
                        ]);
                    } catch (Exception $e) {
                        log_message('error', 'Grades API Error: ' . $e->getMessage());
                        $this->send_error('Database error occurred', 500);
                    }
                }
                break;
                
            case 'post':
                $input = $this->validate_input([
                    'name' => 'required|max_length[50]',
                    'description' => 'max_length[500]'
                ]);
                
                if (!$input) return;
                
                $grade_id = $this->Grade_model->create_grade($input);
                if ($grade_id) {
                    $this->log_activity('grade_created', 'grades', $grade_id, null, $input);
                    $this->send_response(['id' => $grade_id], 'Grade created successfully', 201);
                } else {
                    $this->send_error('Failed to create grade', 500);
                }
                break;
                
            case 'put':
                if (!$id) {
                    $this->send_error('Grade ID required', 400);
                    return;
                }
                
                $input = $this->validate_input([
                    'name' => 'required|max_length[50]',
                    'description' => 'max_length[500]'
                ]);
                
                if (!$input) return;
                
                $old_grade = $this->Grade_model->get_grade_by_id($id);
                if (!$old_grade) {
                    $this->send_error('Grade not found', 404);
                    return;
                }
                
                if ($this->Grade_model->update_grade($id, $input)) {
                    $this->log_activity('grade_updated', 'grades', $id, $old_grade, $input);
                    $this->send_response(null, 'Grade updated successfully');
                } else {
                    $this->send_error('Failed to update grade', 500);
                }
                break;
                
            case 'delete':
                if (!$id) {
                    $this->send_error('Grade ID required', 400);
                    return;
                }
                
                $grade = $this->Grade_model->get_grade_by_id($id);
                if (!$grade) {
                    $this->send_error('Grade not found', 404);
                    return;
                }
                
                if ($this->Grade_model->delete_grade($id)) {
                    $this->log_activity('grade_deleted', 'grades', $id, $grade, null);
                    $this->send_response(null, 'Grade deleted successfully');
                } else {
                    $this->send_error('Failed to delete grade', 500);
                }
                break;
                
            default:
                $this->send_error('Method not allowed', 405);
        }
    }
    
    // Division Management
    public function divisions($id = null) {
        if (!$this->require_any_permission(['divisions', 'divisions.view', 'divisions.create', 'divisions.update', 'divisions.delete'])) {
            return;
        }
        
        switch ($this->input->method()) {
            case 'get':
                if ($id) {
                    $division = $this->Division_model->get_division_by_id($id);
                    if (!$division) {
                        $this->send_error('Division not found', 404);
                        return;
                    }
                    $this->send_response($division);
                } else {
                    $filters = [
                        'academic_year_id' => $this->input->get('academic_year_id'),
                        'grade_id' => $this->input->get('grade_id'),
                        'search' => $this->input->get('search'),
                        'limit' => $this->input->get('limit') ?: 10,
                        'offset' => $this->input->get('offset') ?: 0
                    ];
                    
                    $divisions = $this->Division_model->get_divisions_paginated($filters);
                    $total = $this->Division_model->count_divisions($filters);
                    
                    $this->send_response([
                        'data' => $divisions,
                        'total' => $total,
                        'limit' => $filters['limit'],
                        'offset' => $filters['offset'],
                        'has_next' => ($filters['offset'] + $filters['limit']) < $total,
                        'has_prev' => $filters['offset'] > 0
                    ]);
                }
                break;
                
            case 'post':
                $input = $this->validate_input([
                    'grade_id' => 'required|integer',
                    'name' => 'required|max_length[10]',
                    'capacity' => 'integer'
                ]);
                
                if (!$input) return;
                
                $result = $this->Division_model->create_division($input);
                
                // Check if result is an error array
                if (is_array($result) && isset($result['error'])) {
                    $this->send_error($result['error'], 400);
                } elseif ($result) {
                    $this->log_activity('division_created', 'divisions', $result, null, $input);
                    $this->send_response(['id' => $result], 'Division created successfully', 201);
                } else {
                    $this->send_error('Failed to create division', 500);
                }
                break;
                
            case 'put':
                if (!$id) {
                    $this->send_error('Division ID required', 400);
                    return;
                }
                
                $input = $this->validate_input([
                    'grade_id' => 'required|integer',
                    'name' => 'required|max_length[10]',
                    'capacity' => 'integer'
                ]);
                
                if (!$input) return;
                
                $old_division = $this->Division_model->get_division_by_id($id);
                if (!$old_division) {
                    $this->send_error('Division not found', 404);
                    return;
                }
                
                if ($this->Division_model->update_division($id, $input)) {
                    $this->log_activity('division_updated', 'divisions', $id, $old_division, $input);
                    $this->send_response(null, 'Division updated successfully');
                } else {
                    $this->send_error('Failed to update division', 500);
                }
                break;
                
            case 'delete':
                if (!$id) {
                    $this->send_error('Division ID required', 400);
                    return;
                }
                
                $division = $this->Division_model->get_division_by_id($id);
                if (!$division) {
                    $this->send_error('Division not found', 404);
                    return;
                }
                
                if ($this->Division_model->delete_division($id)) {
                    $this->log_activity('division_deleted', 'divisions', $id, $division, null);
                    $this->send_response(null, 'Division deleted successfully');
                } else {
                    $this->send_error('Failed to delete division', 500);
                }
                break;
                
            default:
                $this->send_error('Method not allowed', 405);
        }
    }
    // Student Management
    public function students($id = null) {
        if (!$this->require_any_permission(['students', 'students.view', 'students.create', 'students.update', 'students.delete'])) {
            return;
        }
        
        switch ($this->input->method()) {
            case 'get':
                if ($id) {
                    $student = $this->Student_model->get_student_by_id($id);
                    if (!$student) {
                        $this->send_error('Student not found', 404);
                        return;
                    }
                    $this->send_response($student);
                } else {
                    $filters = [
                        'academic_year_id' => $this->input->get('academic_year_id'),
                        'grade_id' => $this->input->get('grade_id'),
                        'division_id' => $this->input->get('division_id'),
                        'search' => $this->input->get('search'),
                        'limit' => $this->input->get('limit') ?: 50,
                        'offset' => $this->input->get('offset') ?: 0
                    ];
                    
                    $students = $this->Student_model->get_students($filters);
                    $total = $this->Student_model->count_students($filters);
                    
                    $this->send_response([
                        'data' => $students,
                        'total' => $total,
                        'limit' => $filters['limit'],
                        'offset' => $filters['offset'],
                        'has_next' => ($filters['offset'] + $filters['limit']) < $total,
                        'has_prev' => $filters['offset'] > 0
                    ]);
                }
                break;
                
            case 'post':
                $input = $this->validate_input([
                    'student_name' => 'required|max_length[100]',
                    'academic_year_id' => 'integer',
                    'grade_id' => 'required|integer',
                    'division_id' => 'required|integer',
                    'roll_number' => 'required|max_length[20]',
                    'residential_address' => 'max_length[500]',
                    'pincode' => 'max_length[10]',
                    'sam_samagrah_id' => 'max_length[50]',
                    'aapar_id' => 'max_length[50]',
                    'admission_date' => 'required',
                    'total_fees' => 'numeric',
                    'parent_id' => 'required|integer',
                    // New fields
                    'emergency_contact_number' => 'max_length[15]',
                    'emergency_contact_name' => 'max_length[100]',
                    'emergency_contact_relationship' => 'max_length[50]',
                    'gender' => 'in_list[Male,Female,Other]',
                    'travel_mode' => 'in_list[School Bus,Own]',
                    'vehicle_number' => 'max_length[20]',
                    'parent_or_staff_name' => 'max_length[100]',
                    'verified_tts_id' => 'max_length[50]',
                    'allergies' => 'max_length[2000]',
                    'diabetic' => 'in_list[0,1]',
                    'lifestyle_diseases' => 'max_length[500]',
                    'asthmatic' => 'in_list[0,1]',
                    'phobia' => 'in_list[0,1]',
                    'doctor_name' => 'max_length[100]',
                    'doctor_contact' => 'max_length[15]',
                    'clinic_address' => 'max_length[500]',
                    'blood_group' => 'in_list[A+,A-,B+,B-,O+,O-,AB+,AB-]',
                    'student_photo_url' => 'max_length[255]',
                    'id_proof_url' => 'max_length[255]',
                    'address_proof_url' => 'max_length[255]',
                    'student_aspirations' => 'max_length[2000]',
                    'aadhaar' => 'max_length[12]',
                    'special_need' => 'max_length[500]'
                ]);
                
                if (!$input) return;
                
                // Enhanced logging for debugging
                log_message('info', 'Admin::students POST - Raw input received: ' . file_get_contents('php://input'));
                log_message('info', 'Admin::students POST - Validated input with file URLs: ' . json_encode([
                    'student_name' => $input['student_name'] ?? 'NOT_SET',
                    'student_photo_url' => $input['student_photo_url'] ?? 'NOT_SET',
                    'id_proof_url' => $input['id_proof_url'] ?? 'NOT_SET', 
                    'address_proof_url' => $input['address_proof_url'] ?? 'NOT_SET',
                    'student_aspirations' => $input['student_aspirations'] ?? 'NOT_SET'
                ]));
                
                // Check for duplicate roll number in the same academic year, grade, and division
                $this->db->where('roll_number', $input['roll_number']);
                $this->db->where('academic_year_id', $input['academic_year_id']);
                $this->db->where('grade_id', $input['grade_id']);
                $this->db->where('division_id', $input['division_id']);
                $this->db->where('is_active', 1);
                $existing_student = $this->db->get('students')->row();
                
                if ($existing_student) {
                    $this->send_error('Roll number already exists for this grade and division', 400);
                    return;
                }
                
                // Validate foreign key references
                if (!empty($input['parent_id'])) {
                    $parent_exists = $this->db->where('id', $input['parent_id'])->where('is_active', 1)->get('parents')->row();
                    if (!$parent_exists) {
                        $this->send_error('Invalid parent ID: Parent not found', 400);
                        return;
                    }
                }
                
                if (!empty($input['academic_year_id'])) {
                    $academic_year_exists = $this->db->where('id', $input['academic_year_id'])->get('academic_years')->row();
                    if (!$academic_year_exists) {
                        $this->send_error('Invalid academic year ID', 400);
                        return;
                    }
                }
                
                if (!empty($input['grade_id'])) {
                    $grade_exists = $this->db->where('id', $input['grade_id'])->where('is_active', 1)->get('grades')->row();
                    if (!$grade_exists) {
                        $this->send_error('Invalid grade ID', 400);
                        return;
                    }
                }
                
                if (!empty($input['division_id'])) {
                    $division_exists = $this->db->where('id', $input['division_id'])->where('is_active', 1)->get('divisions')->row();
                    if (!$division_exists) {
                        $this->send_error('Invalid division ID', 400);
                        return;
                    }
                }
                
                if (array_key_exists('special_need', $input)) {
                    $specialNeed = trim($input['special_need']) !== '' ? trim($input['special_need']) : null;
                    $input['special need'] = $specialNeed;
                    unset($input['special_need']);
                }
                
                // Encrypt Aadhaar if provided
                if (array_key_exists('aadhaar', $input)) {
                    $aadhaar = preg_replace('/\s+/', '', (string)$input['aadhaar']);
                    if ($aadhaar === '') {
                        $input['aadhaar_encrypted'] = null;
                    } else {
                        if (!preg_match('/^[0-9]{12}$/', $aadhaar)) {
                            $this->send_error('Aadhaar number must be 12 digits', 400);
                            return;
                        }
                        $input['aadhaar_encrypted'] = $this->encrypt_sensitive_data($aadhaar);
                    }
                    unset($input['aadhaar']);
                }
                
                // Log the validated input to debug file URLs
                log_message('info', 'Admin::students POST - Validated input with URLs: ' . json_encode([
                    'student_photo_url' => $input['student_photo_url'] ?? 'NOT_SET',
                    'id_proof_url' => $input['id_proof_url'] ?? 'NOT_SET', 
                    'address_proof_url' => $input['address_proof_url'] ?? 'NOT_SET',
                    'student_name' => $input['student_name'] ?? 'NO_NAME'
                ]));
                
                // Enable database debugging temporarily
                $this->db->save_queries = TRUE;
                
                try {
                    $student_id = $this->Student_model->create_student($input);
                    if ($student_id) {
                        $this->log_activity('student_created', 'students', $student_id, null, $input);
                        $this->send_response(['id' => $student_id], 'Student created successfully', 201);
                    } else {
                        // Get detailed database error information
                        $db_error = $this->db->error();
                        $last_query = $this->db->last_query();
                        
                        log_message('error', 'Student creation failed. DB Error: ' . json_encode($db_error));
                        log_message('error', 'Last query: ' . $last_query);
                        
                        // Return more specific error message
                        $error_message = 'Failed to create student';
                        if (!empty($db_error['message'])) {
                            $error_message .= ': ' . $db_error['message'];
                        }
                        
                        $this->send_error($error_message, 500);
                    }
                } catch (Exception $e) {
                    // Handle model validation exceptions (like duplicate roll number)
                    log_message('error', 'Student creation exception: ' . $e->getMessage());
                    $this->send_error($e->getMessage(), 400);
                }
                break;
                
            case 'put':
                if (!$id) {
                    $this->send_error('Student ID required', 400);
                    return;
                }
                
                $input = $this->validate_input([
                    'student_name' => 'required|max_length[100]',
                    'grade_id' => 'required|integer',
                    'division_id' => 'required|integer',
                    'roll_number' => 'required|max_length[20]',
                    'residential_address' => 'max_length[500]',
                    'pincode' => 'max_length[10]',
                    'sam_samagrah_id' => 'max_length[50]',
                    'aapar_id' => 'max_length[50]',
                    'admission_date' => 'required',
                    'total_fees' => 'numeric',
                    'parent_id' => 'required|integer',
                    // New fields
                    'emergency_contact_number' => 'max_length[15]',
                    'emergency_contact_name' => 'max_length[100]',
                    'emergency_contact_relationship' => 'max_length[50]',
                    'gender' => 'in_list[Male,Female,Other]',
                    'travel_mode' => 'in_list[School Bus,Own]',
                    'vehicle_number' => 'max_length[20]',
                    'parent_or_staff_name' => 'max_length[100]',
                    'verified_tts_id' => 'max_length[50]',
                    'allergies' => 'max_length[2000]',
                    'diabetic' => 'in_list[0,1]',
                    'lifestyle_diseases' => 'max_length[500]',
                    'asthmatic' => 'in_list[0,1]',
                    'phobia' => 'in_list[0,1]',
                    'doctor_name' => 'max_length[100]',
                    'doctor_contact' => 'max_length[15]',
                    'clinic_address' => 'max_length[500]',
                    'blood_group' => 'in_list[A+,A-,B+,B-,O+,O-,AB+,AB-]',
                    'student_photo_url' => 'max_length[255]',
                    'id_proof_url' => 'max_length[255]',
                    'address_proof_url' => 'max_length[255]',
                    'student_aspirations' => 'max_length[2000]',
                    'aadhaar' => 'max_length[12]',
                    'special_need' => 'max_length[500]'
                ]);
                
                if (!$input) return;
                
                // Enhanced logging for debugging PUT
                log_message('info', 'Admin::students PUT - Raw input received: ' . file_get_contents('php://input'));
                log_message('info', 'Admin::students PUT - Validated input with file URLs: ' . json_encode([
                    'student_name' => $input['student_name'] ?? 'NOT_SET',
                    'student_photo_url' => $input['student_photo_url'] ?? 'NOT_SET',
                    'id_proof_url' => $input['id_proof_url'] ?? 'NOT_SET', 
                    'address_proof_url' => $input['address_proof_url'] ?? 'NOT_SET',
                    'student_aspirations' => $input['student_aspirations'] ?? 'NOT_SET'
                ]));
                
                $old_student = $this->Student_model->get_student_by_id($id);
                if (!$old_student) {
                    $this->send_error('Student not found', 404);
                    return;
                }
                
                if (array_key_exists('special_need', $input)) {
                    $specialNeed = trim($input['special_need']) !== '' ? trim($input['special_need']) : null;
                    $input['special need'] = $specialNeed;
                    unset($input['special_need']);
                }
                
                // Encrypt Aadhaar if provided
                if (array_key_exists('aadhaar', $input)) {
                    $aadhaar = preg_replace('/\s+/', '', (string)$input['aadhaar']);
                    if ($aadhaar === '') {
                        $input['aadhaar_encrypted'] = null;
                    } else {
                        if (!preg_match('/^[0-9]{12}$/', $aadhaar)) {
                            $this->send_error('Aadhaar number must be 12 digits', 400);
                            return;
                        }
                        $input['aadhaar_encrypted'] = $this->encrypt_sensitive_data($aadhaar);
                    }
                    unset($input['aadhaar']);
                }
                
                // Check for duplicate roll number if roll_number is being updated
                if (isset($input['roll_number']) && $input['roll_number'] !== $old_student['roll_number']) {
                    $this->db->where('roll_number', $input['roll_number']);
                    $this->db->where('academic_year_id', $input['academic_year_id'] ?? $old_student['academic_year_id']);
                    $this->db->where('grade_id', $input['grade_id'] ?? $old_student['grade_id']);
                    $this->db->where('division_id', $input['division_id'] ?? $old_student['division_id']);
                    $this->db->where('id !=', $id); // Exclude current student
                    $this->db->where('is_active', 1);
                    $existing_student = $this->db->get('students')->row();
                    
                    if ($existing_student) {
                        $this->send_error('Roll number already exists for this grade and division', 400);
                        return;
                    }
                }
                
                // Log the validated input to debug file URLs
                log_message('info', 'Admin::students PUT - Student ID: ' . $id . ' - Validated input with URLs: ' . json_encode([
                    'student_photo_url' => $input['student_photo_url'] ?? 'NOT_SET',
                    'id_proof_url' => $input['id_proof_url'] ?? 'NOT_SET', 
                    'address_proof_url' => $input['address_proof_url'] ?? 'NOT_SET',
                    'student_name' => $input['student_name'] ?? 'NO_NAME'
                ]));

                try {
                    if ($this->Student_model->update_student($id, $input)) {
                        $this->log_activity('student_updated', 'students', $id, $old_student, $input);
                        $this->send_response(null, 'Student updated successfully');
                    } else {
                        $this->send_error('Failed to update student', 500);
                    }
                } catch (Exception $e) {
                    // Handle model validation exceptions
                    log_message('error', 'Student update exception: ' . $e->getMessage());
                    $this->send_error($e->getMessage(), 400);
                }
                break;
                
            case 'delete':
                if (!$id) {
                    $this->send_error('Student ID required', 400);
                    return;
                }
                
                $student = $this->Student_model->get_student_by_id($id);
                if (!$student) {
                    $this->send_error('Student not found', 404);
                    return;
                }
                
                if ($this->Student_model->delete_student($id)) {
                    $this->log_activity('student_deleted', 'students', $id, $student, null);
                    $this->send_response(null, 'Student deleted successfully');
                } else {
                    $this->send_error('Failed to delete student', 500);
                }
                break;
                
            default:
                $this->send_error('Method not allowed', 405);
        }
    }
    
    // Get semester fees for grade only
    public function semester_fees() {
        if (!$this->require_any_permission(['students', 'students.view', 'students.create', 'students.update', 'students.delete'])) {
            return;
        }
        
        $grade_id = $this->input->get('grade_id');
        
        // Debug: Log received parameters
        log_message('debug', 'Semester fees request - grade_id: ' . $grade_id);
        
        // Validation - only grade_id is required
        if (empty($grade_id)) {
            $this->send_error('grade_id is required', 400);
            return;
        }
        
        $this->load->model('Student_model');
        $semester_fees = $this->Student_model->get_semester_fees_for_grade($grade_id);
        
        $this->send_response($semester_fees);
    }
    
    /**
     * Upload student documents (photo, ID proof, address proof)
     * POST /api/admin/upload_student_document
     */
    public function upload_student_document() {
        if (!$this->require_any_permission(['students', 'students.create', 'students.update'])) {
            return;
        }
        
        // Get document type from request
        $document_type = $this->input->post('document_type');
        
        if (!in_array($document_type, ['student_photo', 'id_proof', 'address_proof'])) {
            $this->send_error('Invalid document type. Must be one of: student_photo, id_proof, address_proof', 400);
            return;
        }
        
        // Log request details for debugging
        log_message('debug', 'Upload request - document_type: ' . $document_type);
        log_message('debug', 'Files received: ' . json_encode(array_keys($_FILES)));
        
        // Configure upload settings - store all files in main uploads directory with prefixed names
        $upload_config = [
            'upload_path' => FCPATH . 'uploads/',
            'max_size' => 2048, // 2MB in KB
            'file_name' => $document_type . '_' . uniqid() . '_' . time(),
            'overwrite' => FALSE,
            'remove_spaces' => TRUE,
            'encrypt_name' => FALSE,
            'detect_mime' => TRUE,
            'mod_mime_fix' => TRUE
        ];
        
        // Set allowed types based on document type
        switch ($document_type) {
            case 'student_photo':
                $upload_config['allowed_types'] = 'gif|jpg|jpeg|png|GIF|JPG|JPEG|PNG';
                break;
            case 'id_proof':
            case 'address_proof':
                $upload_config['allowed_types'] = 'gif|jpg|jpeg|png|pdf|GIF|JPG|JPEG|PNG|PDF';
                break;
        }
        
        // Ensure directory exists with proper permissions
        if (!is_dir($upload_config['upload_path'])) {
            mkdir($upload_config['upload_path'], 0755, true);
            chmod($upload_config['upload_path'], 0755);
        }
        
        // Load and initialize upload library properly
        $this->load->library('upload', $upload_config);
        
        // Attempt upload
        if (!$this->upload->do_upload('file')) {
            $error = $this->upload->display_errors('', '');
            log_message('error', 'Student document upload failed: ' . $error);
            log_message('error', 'Upload config: ' . json_encode($upload_config));
            log_message('error', 'File info: ' . json_encode($_FILES));
            $this->send_error('Upload failed: ' . $error, 400);
            return;
        }
        
        // Get upload data
        $upload_data = $this->upload->data();
        
        // Generate relative URL for database storage (simple /uploads/filename format)
        $relative_url = '/uploads/' . $upload_data['file_name'];
        
        // Log successful upload
        log_message('info', "Student document uploaded successfully: {$relative_url}");
        
        $this->send_response([
            'url' => $relative_url,
            'file_name' => $upload_data['file_name'],
            'file_type' => $upload_data['file_type'],
            'file_size' => $upload_data['file_size'],
            'document_type' => $document_type
        ], 'Document uploaded successfully', 201);
    }

    /**
     * Upload parent document
     * POST /api/admin/upload_parent_document
     */
    public function upload_parent_document() {
        if (!$this->require_any_permission(['parents', 'parents.create', 'parents.update'])) {
            return;
        }

        $document_type = $this->input->post('document_type');

        $allowed_types = ['parent_photo', 'id_proof', 'address_proof', 'staff_photo'];
        if (!in_array($document_type, $allowed_types)) {
            $this->send_error('Invalid document type. Must be one of: parent_photo, id_proof, address_proof', 400);
            return;
        }

        log_message('debug', 'Parent document upload request - document_type: ' . $document_type);

        $upload_config = [
            'upload_path' => FCPATH . 'uploads/',
            'max_size' => 2048,
            'file_name' => $document_type . '_' . uniqid() . '_' . time(),
            'overwrite' => FALSE,
            'remove_spaces' => TRUE,
            'encrypt_name' => FALSE,
            'detect_mime' => TRUE,
            'mod_mime_fix' => TRUE
        ];

        switch ($document_type) {
            case 'parent_photo':
            case 'staff_photo':
                $upload_config['allowed_types'] = 'gif|jpg|jpeg|png|GIF|JPG|JPEG|PNG';
                break;
            case 'id_proof':
            case 'address_proof':
                $upload_config['allowed_types'] = 'gif|jpg|jpeg|png|pdf|GIF|JPG|JPEG|PNG|PDF';
                break;
        }

        if (!is_dir($upload_config['upload_path'])) {
            mkdir($upload_config['upload_path'], 0755, true);
            chmod($upload_config['upload_path'], 0755);
        }

        $this->load->library('upload', $upload_config);

        if (!$this->upload->do_upload('file')) {
            $error = $this->upload->display_errors('', '');
            log_message('error', 'Parent document upload failed: ' . $error);
            log_message('error', 'Upload config: ' . json_encode($upload_config));
            log_message('error', 'File info: ' . json_encode($_FILES));
            $this->send_error('Upload failed: ' . $error, 400);
            return;
        }

        $upload_data = $this->upload->data();
        $relative_url = '/uploads/' . $upload_data['file_name'];

        log_message('info', "Parent document uploaded successfully: {$relative_url}");

        $this->send_response([
            'url' => $relative_url,
            'file_name' => $upload_data['file_name'],
            'file_type' => $upload_data['file_type'],
            'file_size' => $upload_data['file_size'],
            'document_type' => $document_type
        ], 'Document uploaded successfully', 201);
    }
    
    /**
     * Serve uploaded file with CORS headers
     * GET /api/admin/serve_file?path=/uploads/filename.jpg
     */
    public function serve_file() {
        $file_path = $this->input->get('path');
        
        if (empty($file_path)) {
            $this->send_error('File path is required', 400);
            return;
        }
        
        // Security: Only allow files from uploads directory
        if (!preg_match('/^\/?uploads\//', $file_path)) {
            $this->send_error('Invalid file path', 403);
            return;
        }
        
        // Remove leading slash if present
        $file_path = ltrim($file_path, '/');
        
        // Full path to file
        $full_path = FCPATH . $file_path;
        
        if (!file_exists($full_path) || !is_file($full_path)) {
            $this->send_error('File not found', 404);
            return;
        }
        
        // Get file info
        $mime_type = mime_content_type($full_path);
        $file_size = filesize($full_path);
        
        // Set CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        header('Content-Type: ' . $mime_type);
        header('Content-Length: ' . $file_size);
        header('Cache-Control: public, max-age=31536000');
        
        // Output file
        readfile($full_path);
        exit;
    }
    
    /**
     * Upload syllabus document
     * POST /api/admin/upload_syllabus_document
     */
    public function upload_syllabus_document() {
        if (!$this->require_any_permission(['syllabus', 'syllabus.create', 'syllabus.update'])) {
            return;
        }

        log_message('debug', 'Syllabus document upload request');
        log_message('debug', 'Files received: ' . json_encode(array_keys($_FILES)));

        $upload_config = [
            'upload_path' => FCPATH . 'uploads/',
            'max_size' => 10240, // 10MB in KB
            'file_name' => 'syllabus_doc_' . uniqid() . '_' . time(),
            'allowed_types' => 'gif|jpg|jpeg|png|pdf|doc|docx|GIF|JPG|JPEG|PNG|PDF|DOC|DOCX',
            'overwrite' => FALSE,
            'remove_spaces' => TRUE,
            'encrypt_name' => FALSE,
            'detect_mime' => TRUE,
            'mod_mime_fix' => TRUE
        ];

        if (!is_dir($upload_config['upload_path'])) {
            mkdir($upload_config['upload_path'], 0755, true);
            chmod($upload_config['upload_path'], 0755);
        }

        $this->load->library('upload', $upload_config);

        if (!$this->upload->do_upload('file')) {
            $error = $this->upload->display_errors('', '');
            log_message('error', 'Syllabus document upload failed: ' . $error);
            log_message('error', 'Upload config: ' . json_encode($upload_config));
            log_message('error', 'File info: ' . json_encode($_FILES));
            $this->send_error('Upload failed: ' . $error, 400);
            return;
        }

        $upload_data = $this->upload->data();
        $relative_url = '/uploads/' . $upload_data['file_name'];

        log_message('info', "Syllabus document uploaded successfully: {$relative_url}");

        $this->send_response([
            'url' => $relative_url,
            'file_name' => $upload_data['file_name'],
            'file_type' => $upload_data['file_type'],
            'file_size' => $upload_data['file_size']
        ], 'Document uploaded successfully', 201);
    }
    
    /**
     * Upload staff photo
     * POST /api/admin/upload_staff_photo
     */
    public function upload_staff_photo() {
        if (!$this->require_any_permission(['staff', 'staff.create', 'staff.update'])) {
            return;
        }
        
        // Log request details for debugging
        log_message('debug', 'Staff photo upload request');
        log_message('debug', 'Files received: ' . json_encode(array_keys($_FILES)));
        
        // Configure upload settings for staff photos
        $upload_config = [
            'upload_path' => FCPATH . '/uploads/',
            'max_size' => 2048, // 2MB in KB
            'file_name' => 'staff_photo_' . uniqid() . '_' . time(),
            'allowed_types' => 'gif|jpg|jpeg|png|GIF|JPG|JPEG|PNG',
            'overwrite' => FALSE,
            'remove_spaces' => TRUE,
            'encrypt_name' => FALSE,
            'detect_mime' => TRUE,
            'mod_mime_fix' => TRUE
        ];
        
        // Ensure directory exists with proper permissions
        if (!is_dir($upload_config['upload_path'])) {
            mkdir($upload_config['upload_path'], 0755, true);
            chmod($upload_config['upload_path'], 0755);
        }
        
        // Load and initialize upload library properly
        $this->load->library('upload', $upload_config);
        
        // Attempt upload
        if (!$this->upload->do_upload('file')) {
            $error = $this->upload->display_errors('', '');
            log_message('error', 'Staff photo upload failed: ' . $error);
            log_message('error', 'Upload config: ' . json_encode($upload_config));
            log_message('error', 'File info: ' . json_encode($_FILES));
            $this->send_error('Upload failed: ' . $error, 400);
            return;
        }
        
        // Get upload data
        $upload_data = $this->upload->data();
        
        // Generate relative URL for database storage (simple /uploads/filename format)
        $relative_url = '/uploads/' . $upload_data['file_name'];
        
        // Log successful upload
        log_message('info', "Staff photo uploaded successfully: {$relative_url}");
        
        $this->send_response([
            'url' => $relative_url,
            'file_name' => $upload_data['file_name'],
            'file_type' => $upload_data['file_type'],
            'file_size' => $upload_data['file_size']
        ], 'Staff photo uploaded successfully', 201);
    }
    
    // Get student's assigned semester fees
    public function student_semester_fees($student_id = null) {
        if (!$this->require_any_permission(['students', 'students.view', 'students.create', 'students.update', 'students.delete'])) {
            return;
        }
        
        if (!$student_id) {
            $this->send_error('Student ID is required', 400);
            return;
        }
        
        $academic_year_id = $this->input->get('academic_year_id');
        
        $this->load->model('Student_model');
        $student_fees = $this->Student_model->get_student_semester_fees($student_id, $academic_year_id);
        
        // Get student details for context
        $student = $this->Student_model->get_student_by_id($student_id);
        if (!$student) {
            $this->send_error('Student not found', 404);
            return;
        }
        
        $response = [
            'student' => [
                'id' => $student['id'],
                'name' => $student['student_name'],
                'grade' => $student['grade_name'],
                'division' => $student['division_name'],
                'roll_number' => $student['roll_number']
            ],
            'fees' => $student_fees
        ];
        
        $this->send_response($response);
    }
    
    // Get student fee summary (mandatory vs optional)
    public function student_fee_summary($student_id = null) {
        if (!$this->require_any_permission(['students', 'students.view', 'students.create', 'students.update', 'students.delete'])) {
            return;
        }
        
        if (!$student_id) {
            $this->send_error('Student ID is required', 400);
            return;
        }
        
        $academic_year_id = $this->input->get('academic_year_id');
        
        $this->load->model('Student_fee_model');
        $fee_summary = $this->Student_fee_model->get_student_fee_summary($student_id, $academic_year_id);
        
        $this->send_response($fee_summary);
    }
    
    // Get mandatory fees due for a student
    public function mandatory_fees_due($student_id = null) {
        if (!$this->require_any_permission(['students', 'students.view', 'students.create', 'students.update', 'students.delete'])) {
            return;
        }
        
        if (!$student_id) {
            $this->send_error('Student ID is required', 400);
            return;
        }
        
        $semester = $this->input->get('semester');
        
        $this->load->model('Student_fee_model');
        $fees_due = $this->Student_fee_model->get_mandatory_fees_due($student_id, $semester);
        
        $this->send_response([
            'fees' => $fees_due,
            'total_due' => array_sum(array_column($fees_due, 'pending_amount'))
        ]);
    }
    
    // Get overdue mandatory fees
    public function overdue_mandatory_fees() {
        if (!$this->require_any_permission(['students', 'students.view', 'students.create', 'students.update', 'students.delete'])) {
            return;
        }
        
        $student_id = $this->input->get('student_id');
        
        $this->load->model('Student_fee_model');
        $overdue_fees = $this->Student_fee_model->get_overdue_mandatory_fees($student_id);
        
        $this->send_response([
            'overdue_fees' => $overdue_fees,
            'total_overdue' => array_sum(array_column($overdue_fees, 'pending_amount'))
        ]);
    }
    // Academic Year Management
    public function academic_years($id = null) {
        if (!$this->require_any_permission(['academic_years', 'academic_years.view', 'academic_years.create', 'academic_years.update', 'academic_years.delete'])) {
            return;
        }
        
        switch ($this->input->method()) {
            case 'get':
                if ($id) {
                    $academic_year = $this->Academic_year_model->get_academic_year($id);
                    if (!$academic_year) {
                        $this->send_error('Academic year not found', 404);
                        return;
                    }
                    
                    // Get statistics for this academic year
                    $stats = $this->Academic_year_model->get_academic_year_stats($id);
                    $academic_year['stats'] = $stats;
                    
                    $this->send_response($academic_year);
                } else {
                    $limit = $this->input->get('limit') ?: 10;
                    $offset = $this->input->get('offset') ?: 0;
                    $search = $this->input->get('search');
                    
                    $academic_years = $this->Academic_year_model->get_academic_years_paginated($limit, $offset, $search);
                    $total = $this->Academic_year_model->count_academic_years($search);
                    
                    // Add statistics for each academic year
                    foreach ($academic_years as &$year) {
                        $year['stats'] = $this->Academic_year_model->get_academic_year_stats($year['id']);
                    }
                    
                    $this->send_response([
                        'data' => $academic_years,
                        'total' => $total,
                        'limit' => $limit,
                        'offset' => $offset,
                        'has_next' => ($offset + $limit) < $total,
                        'has_prev' => $offset > 0
                    ]);
                }
                break;
                
            case 'post':
                $input = $this->validate_input([
                    'name' => 'required|max_length[50]',
                    'start_date' => 'required',
                    'end_date' => 'required',
                    'description' => 'max_length[500]'
                ]);
                
                if (!$input) return;
                
                // Set default value for is_default if not provided
                if (!isset($input['is_default'])) {
                    $input['is_default'] = 0;
                } else {
                    $input['is_default'] = (int)$input['is_default'];
                }
                
                // Validate dates
                $date_validation = $this->Academic_year_model->validate_dates($input['start_date'], $input['end_date']);
                if (!$date_validation['valid']) {
                    $this->send_error($date_validation['message'], 400);
                    return;
                }
                
                // Check if name already exists
                if ($this->Academic_year_model->name_exists($input['name'])) {
                    $this->send_error('Academic year with this name already exists', 400);
                    return;
                }
                
                $input['is_active'] = 1;
                $input['is_default'] = isset($input['is_default']) ? $input['is_default'] : 0;
                
                $academic_year_id = $this->Academic_year_model->create_academic_year($input);
                if ($academic_year_id) {
                    $this->log_activity('academic_year_created', 'academic_years', $academic_year_id, null, $input);
                    $this->send_response(['id' => $academic_year_id], 'Academic year created successfully', 201);
                } else {
                    $this->send_error('Failed to create academic year', 500);
                }
                break;
                
            case 'put':
                if (!$id) {
                    $this->send_error('Academic year ID required', 400);
                    return;
                }
                
                $input = $this->validate_input([
                    'name' => 'required|max_length[50]',
                    'start_date' => 'required',
                    'end_date' => 'required',
                    'description' => 'max_length[500]'
                ]);
                
                if (!$input) return;
                
                // Set default value for is_default if not provided
                if (!isset($input['is_default'])) {
                    $input['is_default'] = 0;
                } else {
                    $input['is_default'] = (int)$input['is_default'];
                }
                
                // Set default value for is_active if not provided
                if (!isset($input['is_active'])) {
                    $input['is_active'] = 1;
                } else {
                    $input['is_active'] = (int)$input['is_active'];
                }
                
                $old_academic_year = $this->Academic_year_model->get_academic_year($id);
                if (!$old_academic_year) {
                    $this->send_error('Academic year not found', 404);
                    return;
                }
                
                // Validate dates
                $date_validation = $this->Academic_year_model->validate_dates($input['start_date'], $input['end_date'], $id);
                if (!$date_validation['valid']) {
                    $this->send_error($date_validation['message'], 400);
                    return;
                }
                
                // Check if name already exists (excluding current record)
                if ($this->Academic_year_model->name_exists($input['name'], $id)) {
                    $this->send_error('Academic year with this name already exists', 400);
                    return;
                }
                
                if ($this->Academic_year_model->update_academic_year($id, $input)) {
                    $this->log_activity('academic_year_updated', 'academic_years', $id, $old_academic_year, $input);
                    $this->send_response(null, 'Academic year updated successfully');
                } else {
                    $this->send_error('Failed to update academic year', 500);
                }
                break;
                
            case 'delete':
                if (!$id) {
                    $this->send_error('Academic year ID required', 400);
                    return;
                }
                
                $academic_year = $this->Academic_year_model->get_academic_year($id);
                if (!$academic_year) {
                    $this->send_error('Academic year not found', 404);
                    return;
                }
                
                if ($academic_year['is_default'] == 1) {
                    $this->send_error('Cannot delete the default academic year', 400);
                    return;
                }
                
                $result = $this->Academic_year_model->delete_academic_year($id);
                if ($result) {
                    $this->log_activity('academic_year_deleted', 'academic_years', $id, $academic_year, null);
                    $this->send_response(null, 'Academic year deleted successfully');
                } else {
                    $this->send_error('Failed to delete academic year', 500);
                }
                break;
                
            default:
                $this->send_error('Method not allowed', 405);
        }
    }
    
    // Get academic years dropdown (active only)
    public function academic_years_dropdown() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        // Academic years should be available to all authenticated users
        // No permission check needed as this is fundamental system data
        
        $academic_years = $this->Academic_year_model->get_active_academic_years();
        $this->send_response($academic_years);
    }
    
    // Set academic year as default
    public function academic_years_set_default($id) {
        if ($this->input->method() !== 'put') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['academic_years', 'academic_years.view', 'academic_years.create', 'academic_years.update', 'academic_years.delete'])) {
            return;
        }
        
        if (!$id) {
            $this->send_error('Academic year ID required', 400);
            return;
        }
        
        $academic_year = $this->Academic_year_model->get_academic_year($id);
        if (!$academic_year) {
            $this->send_error('Academic year not found', 404);
            return;
        }
        
        if ($this->Academic_year_model->set_as_default($id)) {
            $this->log_activity('academic_year_set_default', 'academic_years', $id, null, ['is_default' => 1]);
            $this->send_response(null, 'Academic year set as default successfully');
        } else {
            $this->send_error('Failed to set academic year as default', 500);
        }
    }
    
    // Get current academic year
    public function academic_years_current() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        // Current academic year should be available to all authenticated users
        // No permission check needed as this is fundamental system data
        
        $current_year = $this->Academic_year_model->get_current_academic_year();
        if (!$current_year) {
            // Fallback to default academic year
            $current_year = $this->Academic_year_model->get_default_academic_year();
        }
        
        if ($current_year) {
            $current_year['stats'] = $this->Academic_year_model->get_academic_year_stats($current_year['id']);
            $this->send_response($current_year);
        } else {
            $this->send_error('No current academic year found', 404);
        }
    }
    
    // Parent Management
    public function parents($id = null) {
        if (!$this->require_any_permission(['parents', 'parents.view', 'parents.create', 'parents.update', 'parents.delete'])) {
            return;
        }
        
        switch ($this->input->method()) {
            case 'get':
                if ($id) {
                    $parent = $this->Parent_model->get_parent_by_id($id);
                    if (!$parent) {
                        $this->send_error('Parent not found', 404);
                        return;
                    }
                    $parent['staff_contacts'] = $this->Parent_staff_model->get_staff_by_parent($id);
                    $this->send_response($parent);
                } else {
                    $limit = $this->input->get('limit') ?: 10;
                    $offset = $this->input->get('offset') ?: 0;
                    $search = $this->input->get('search');
                    
                    $parents = $this->Parent_model->get_parents_paginated($limit, $offset, $search);
                    foreach ($parents as &$parent) {
                        $parent['staff_contact_count'] = $this->Parent_staff_model->count_staff_by_parent($parent['id']);
                    }
                    $total = $this->Parent_model->count_parents($search);
                    
                    $this->send_response([
                        'data' => $parents,
                        'total' => $total,
                        'limit' => $limit,
                        'offset' => $offset,
                        'has_next' => ($offset + $limit) < $total,
                        'has_prev' => $offset > 0
                    ]);
                }
                break;
                
            case 'post':
                $raw_input = $this->get_input();
                $staff_contacts = isset($raw_input['staff_contacts']) ? $raw_input['staff_contacts'] : [];

                $input = $this->validate_input([
                    'name' => 'required|max_length[100]',
                    'mobile' => 'required|max_length[10]|min_length[10]',
                    'email' => 'valid_email|max_length[100]',
                    'password' => 'required|min_length[6]',
                    'address' => 'max_length[500]',
                    'pincode' => 'max_length[10]',
                    'occupation' => 'max_length[150]',
                    'current_employment' => 'max_length[150]',
                    'company_name' => 'max_length[150]',
                    'how_know_kid' => 'max_length[2000]',
                    'best_contact_day' => 'max_length[50]',
                    'best_contact_time' => 'max_length[50]',
                    'kid_likes' => 'max_length[2000]',
                    'kid_dislikes' => 'max_length[2000]',
                    'kid_aspirations' => 'max_length[2000]',
                    'id_proof' => 'max_length[255]',
                    'address_proof' => 'max_length[255]',
                    'parent_photo' => 'max_length[255]'
                ]);
                
                if (!$input) return;

                // Remove staff contacts from parent data (handled separately)
                if (isset($input['staff_contacts'])) {
                    unset($input['staff_contacts']);
                }
                
                // Check if mobile already exists
                $existing_parent = $this->Parent_model->get_parent_by_mobile($input['mobile']);
                if ($existing_parent) {
                    $this->send_error('Mobile number already exists', 400);
                    return;
                }
                
                $input['is_active'] = 1;
                $parent_id = $this->Parent_model->create_parent($input);
                if ($parent_id) {
                    try {
                        $normalized_contacts = $this->normalize_parent_staff_contacts($staff_contacts);
                        if (!$this->Parent_staff_model->replace_staff_for_parent($parent_id, $normalized_contacts)) {
                            throw new Exception('Failed to save parent staff contacts');
                        }
                    } catch (Exception $e) {
                        log_message('error', 'Parent staff contacts save failed for parent ' . $parent_id . ': ' . $e->getMessage());
                        $this->send_error('Parent created but failed to save staff contacts: ' . $e->getMessage(), 500);
                        return;
                    }
                    $this->log_activity('parent_staff_updated', 'parent_staff', $parent_id, null, isset($normalized_contacts) ? $normalized_contacts : []);
                    $this->log_activity('parent_created', 'parents', $parent_id, null, $input);
                    $this->send_response(['id' => $parent_id], 'Parent created successfully', 201);
                } else {
                    $this->send_error('Failed to create parent', 500);
                }
                break;
                
            case 'put':
                if (!$id) {
                    $this->send_error('Parent ID required', 400);
                    return;
                }
                
                $raw_input = $this->get_input();
                $has_staff_contacts = array_key_exists('staff_contacts', $raw_input);
                $staff_contacts = $has_staff_contacts ? $raw_input['staff_contacts'] : [];
                
                $input = $this->validate_input([
                    'name' => 'required|max_length[100]',
                    'mobile' => 'required|max_length[10]|min_length[10]',
                    'email' => 'valid_email|max_length[100]',
                    'password' => 'min_length[6]',
                    'address' => 'max_length[500]',
                    'pincode' => 'max_length[10]',
                    'occupation' => 'max_length[150]',
                    'current_employment' => 'max_length[150]',
                    'company_name' => 'max_length[150]',
                    'how_know_kid' => 'max_length[2000]',
                    'best_contact_day' => 'max_length[50]',
                    'best_contact_time' => 'max_length[50]',
                    'kid_likes' => 'max_length[2000]',
                    'kid_dislikes' => 'max_length[2000]',
                    'kid_aspirations' => 'max_length[2000]',
                    'id_proof' => 'max_length[255]',
                    'address_proof' => 'max_length[255]',
                    'parent_photo' => 'max_length[255]'
                ]);
                
                if (!$input) return;

                // Ensure staff_contacts is not part of parent update payload
                if (isset($input['staff_contacts'])) {
                    unset($input['staff_contacts']);
                }
                
                $old_parent = $this->Parent_model->get_parent_by_id($id);
                if (!$old_parent) {
                    $this->send_error('Parent not found', 404);
                    return;
                }
                
                // Check if mobile already exists (excluding current parent)
                $this->db->where('mobile', $input['mobile']);
                $this->db->where('id !=', $id);
                $this->db->where('is_active', 1);
                $existing = $this->db->get('parents')->row_array();
                
                if ($existing) {
                    $this->send_error('Mobile number already exists', 400);
                    return;
                }
                
                if ($this->Parent_model->update_parent($id, $input)) {
                    if ($has_staff_contacts) {
                        try {
                            $normalized_contacts = $this->normalize_parent_staff_contacts($staff_contacts);
                            if (!$this->Parent_staff_model->replace_staff_for_parent($id, $normalized_contacts)) {
                                throw new Exception('Failed to save parent staff contacts');
                            }
                            $this->log_activity('parent_staff_updated', 'parent_staff', $id, null, $normalized_contacts);
                        } catch (Exception $e) {
                            log_message('error', 'Parent staff contacts save failed for parent ' . $id . ': ' . $e->getMessage());
                            $this->send_error('Parent updated but failed to save staff contacts: ' . $e->getMessage(), 500);
                            return;
                        }
                    }
                    $this->log_activity('parent_updated', 'parents', $id, $old_parent, $input);
                    $this->send_response(null, 'Parent updated successfully');
                } else {
                    $this->send_error('Failed to update parent', 500);
                }
                break;
                
            case 'delete':
                if (!$id) {
                    $this->send_error('Parent ID required', 400);
                    return;
                }
                
                $parent = $this->Parent_model->get_parent_by_id($id);
                if (!$parent) {
                    $this->send_error('Parent not found', 404);
                    return;
                }
                
                // Check if parent has active students
                if ($parent['student_count'] > 0) {
                    $this->send_error('Cannot delete parent with active students', 400);
                    return;
                }
                
                if ($this->Parent_model->delete_parent($id)) {
                    $this->log_activity('parent_deleted', 'parents', $id, $parent, null);
                    $this->send_response(null, 'Parent deleted successfully');
                } else {
                    $this->send_error('Failed to delete parent', 500);
                }
                break;
                
            default:
                $this->send_error('Method not allowed', 405);
        }
    }
    
    // Get parents for dropdown (no pagination)
    public function parents_dropdown() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['parents', 'parents.view', 'parents.create', 'parents.update', 'parents.delete'])) {
            return;
        }
        
        $this->db->select('id, name, mobile');
        $this->db->where('is_active', 1);
        $this->db->order_by('name');
        $query = $this->db->get('parents');
        $parents = $query->result_array();
        
        $this->send_response($parents);
    }
    
    // Staff Management
    public function staff($id = null) {
        // Check for staff management permissions or admin wildcard permission
        if (!$this->require_any_permission(['staff', 'staff.view', 'staff.create', 'staff.update', 'staff.delete', 'manage_staff', '*'])) {
            return;
        }
        
        switch ($this->input->method()) {
            case 'get':
                if ($id) {
                    $staff = $this->Staff_model->get_staff_by_id($id);
                    if (!$staff) {
                        $this->send_error('Staff member not found', 404);
                        return;
                    }
                    $this->send_response($staff);
                } else {
                    $limit = $this->input->get('limit') ?: 10;
                    $offset = $this->input->get('offset') ?: 0;
                    $search = $this->input->get('search');
                    $role_id = $this->input->get('role_id');
                    
                    $staff = $this->Staff_model->get_staff_paginated($limit, $offset, $search, $role_id);
                    $total = $this->Staff_model->count_staff($search, $role_id);
                    
                    $this->send_response([
                        'data' => $staff,
                        'total' => $total,
                        'limit' => $limit,
                        'offset' => $offset,
                        'has_next' => ($offset + $limit) < $total,
                        'has_prev' => $offset > 0
                    ]);
                }
                break;
                
            case 'post':
                $input = $this->validate_input([
                    'name' => 'required|max_length[100]',
                    'mobile' => 'required|max_length[10]|min_length[10]',
                    'email' => 'valid_email|max_length[100]',
                    'password' => 'required|min_length[6]',
                    'role_id' => 'required|integer',
                    'designation' => 'max_length[100]',
                    'address' => 'max_length[500]',
                    'pincode' => 'max_length[10]',
                    'medical_history' => 'max_length[2000]',
                    'qualification' => 'required|max_length[255]',
                    'experience' => 'max_length[2000]',
                    'achievements' => 'max_length[2000]',
                    'basic_salary' => 'required|numeric',
                    'allowances' => 'numeric',
                    'deductions' => 'numeric',
                    'pf_number' => 'max_length[50]',
                    'pf_contribution' => 'numeric',
                    'photo_url' => 'max_length[500]'
                ]);
                
                if (!$input) return;
                
                // Check if mobile already exists
                $existing_staff = $this->Staff_model->get_staff_by_mobile($input['mobile']);
                if ($existing_staff) {
                    $this->send_error('Mobile number already exists', 400);
                    return;
                }
                
                $input['is_active'] = 1;
                $staff_id = $this->Staff_model->create_staff($input);
                if ($staff_id) {
                    $this->log_activity('staff_created', 'staff', $staff_id, null, $input);
                    $this->send_response(['id' => $staff_id], 'Staff member created successfully', 201);
                } else {
                    $this->send_error('Failed to create staff member', 500);
                }
                break;
                
            case 'put':
                if (!$id) {
                    $this->send_error('Staff ID required', 400);
                    return;
                }
                
                $input = $this->validate_input([
                    'name' => 'required|max_length[100]',
                    'mobile' => 'required|max_length[10]|min_length[10]',
                    'email' => 'valid_email|max_length[100]',
                    'password' => 'min_length[6]',
                    'role_id' => 'required|integer',
                    'designation' => 'max_length[100]',
                    'address' => 'max_length[500]',
                    'pincode' => 'max_length[10]',
                    'medical_history' => 'max_length[2000]',
                    'qualification' => 'required|max_length[255]',
                    'experience' => 'max_length[2000]',
                    'achievements' => 'max_length[2000]',
                    'basic_salary' => 'required|numeric',
                    'allowances' => 'numeric',
                    'deductions' => 'numeric',
                    'pf_number' => 'max_length[50]',
                    'pf_contribution' => 'numeric',
                    'photo_url' => 'max_length[500]'
                ]);
                
                if (!$input) return;
                
                $old_staff = $this->Staff_model->get_staff_by_id($id);
                if (!$old_staff) {
                    $this->send_error('Staff member not found', 404);
                    return;
                }
                
                // Check if mobile already exists (excluding current staff)
                $this->db->where('mobile', $input['mobile']);
                $this->db->where('id !=', $id);
                $this->db->where('is_active', 1);
                $existing = $this->db->get('staff')->row_array();
                
                if ($existing) {
                    $this->send_error('Mobile number already exists', 400);
                    return;
                }
                
                if ($this->Staff_model->update_staff($id, $input)) {
                    $this->log_activity('staff_updated', 'staff', $id, $old_staff, $input);
                    $this->send_response(null, 'Staff member updated successfully');
                } else {
                    $this->send_error('Failed to update staff member', 500);
                }
                break;
                
            case 'delete':
                if (!$id) {
                    $this->send_error('Staff ID required', 400);
                    return;
                }
                
                $staff = $this->Staff_model->get_staff_by_id($id);
                if (!$staff) {
                    $this->send_error('Staff member not found', 404);
                    return;
                }
                
                if ($this->Staff_model->delete_staff($id)) {
                    $this->log_activity('staff_deleted', 'staff', $id, $staff, null);
                    $this->send_response(null, 'Staff member deleted successfully');
                } else {
                    $this->send_error('Failed to delete staff member', 500);
                }
                break;
                
            default:
                $this->send_error('Method not allowed', 405);
        }
    }
    
    // Get staff list for dropdown
    public function staff_dropdown() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['staff', 'staff.view', 'staff_attendance', '*'])) {
            return;
        }
        
        // Check if roles table exists
        $tables = $this->db->list_tables();
        $has_roles_table = in_array('roles', $tables);
        
        $this->db->select('staff.id, staff.name, staff.email, staff.mobile, staff.role_id');
        $this->db->from('staff');
        
        // Join with roles table and exclude super_admin
        if ($has_roles_table && $this->db->field_exists('role_id', 'staff')) {
            $this->db->join('roles', 'staff.role_id = roles.id', 'left');
            $this->db->where('roles.name !=', 'super_admin');
        } else if ($this->db->field_exists('role_name', 'staff')) {
            $this->db->where('staff.role_name !=', 'super_admin');
        }
        
        $this->db->where('staff.is_active', 1);
        $this->db->order_by('staff.name', 'ASC');
        $staff = $this->db->get()->result_array();
        
        $this->send_response($staff);
    }
    
    // Get roles for dropdown
    public function roles_dropdown() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['staff', 'staff.view', 'staff.create', 'staff.update', 'staff.delete'])) {
            return;
        }
        
        $roles = $this->Staff_model->get_roles_for_dropdown();
        $this->send_response($roles);
    }
    
    /**
     * Staff kids management
     * GET /api/admin/staff_kids/{staff_id}
     * GET /api/admin/staff_kids/kid/{id}
     */
    public function staff_kids($staff_id = null, $action = null, $id = null) {
        if (!$this->require_any_permission(['staff', 'staff.view', 'staff.create', 'staff.update', '*'])) {
            return;
        }

        if ($this->input->method() === 'get') {
            try {
                if ($action === 'kid' && $id) {
                    $kid = $this->Staff_kids_model->get_kid_by_id($id);
                    if (!$kid) {
                        $this->send_error('Kid record not found', 404);
                        return;
                    }
                    $this->send_response($kid);
                    return;
                }

                if (!$staff_id) {
                    $this->send_error('Staff ID required', 400);
                    return;
                }

                $kids = $this->Staff_kids_model->get_kids_by_staff($staff_id);
                $this->send_response($kids);
            } catch (Exception $e) {
                log_message('error', 'Get staff kids error: ' . $e->getMessage());
                $this->send_error('Failed to retrieve staff kids', 500);
            }
            return;
        }

        $this->send_error('Method not allowed', 405);
    }

    /**
     * Bulk update staff kids
     * POST /api/admin/staff_kids_bulk/{staff_id}
     */
    public function staff_kids_bulk($staff_id) {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        if (!$this->require_any_permission(['staff', 'staff.create', 'staff.update', '*'])) {
            return;
        }

        if (!$staff_id) {
            $this->send_error('Staff ID required', 400);
            return;
        }

        try {
            $input = $this->get_input();
            $kids_data = isset($input['kids']) && is_array($input['kids']) ? $input['kids'] : [];

            foreach ($kids_data as $index => &$kid) {
                if (empty($kid['name'])) {
                    $this->send_error("Kid name is required at index $index", 400);
                    return;
                }

                if (empty($kid['gender']) || !in_array($kid['gender'], ['Male', 'Female', 'Other'])) {
                    $this->send_error("Valid gender is required at index $index", 400);
                    return;
                }

                if (!empty($kid['dob_date'])) {
                    if (!$this->is_valid_dob_format($kid['dob_date'])) {
                        $this->send_error("Valid DOB Date is required at index $index", 400);
                        return;
                    }

                    $age = $this->calculate_age_from_dob($kid['dob_date']);
                    if ($age === null) {
                        $this->send_error("Valid DOB Date is required at index $index", 400);
                        return;
                    }

                    $kid['age'] = $age;
                } elseif (isset($kid['age'])) {
                    if ($kid['age'] < 0 || $kid['age'] > 120) {
                        $this->send_error("Valid age is required at index $index", 400);
                        return;
                    }
                } else {
                    $this->send_error("DOB Date is required at index $index", 400);
                    return;
                }

                $kid['dob_date'] = !empty($kid['dob_date']) ? $kid['dob_date'] : null;
                $kid['school_name'] = $kid['school_name'] ?? null;
                $kid['grade'] = $kid['grade'] ?? null;
            }
            unset($kid);

            if ($this->Staff_kids_model->update_kids_for_staff($staff_id, $kids_data)) {
                $updated_kids = $this->Staff_kids_model->get_kids_by_staff($staff_id);
                $this->log_activity('staff_kids_bulk_updated', 'staff_kids', $staff_id, null, $kids_data);
                $this->send_response($updated_kids, 'Staff kids updated successfully');
            } else {
                $this->send_error('Failed to update staff kids', 500);
            }
        } catch (Exception $e) {
            log_message('error', 'Bulk update staff kids error: ' . $e->getMessage());
            $this->send_error('Failed to update staff kids', 500);
        }
    }

    /**
     * Parent staff contacts management
     * GET /api/admin/parent_staff/{parent_id}
     * GET /api/admin/parent_staff/contact/{id}
     */
    public function parent_staff($parent_id = null, $action = null, $id = null) {
        if (!$this->require_any_permission(['parents', 'parents.view', 'parents.create', 'parents.update', '*'])) {
            return;
        }

        if ($this->input->method() === 'get') {
            try {
                if ($action === 'contact' && $id) {
                    $contact = $this->Parent_staff_model->get_staff_by_id($id);
                    if (!$contact) {
                        $this->send_error('Parent staff contact not found', 404);
                        return;
                    }
                    $this->send_response($contact);
                    return;
                }

                if (!$parent_id) {
                    $this->send_error('Parent ID required', 400);
                    return;
                }

                $contacts = $this->Parent_staff_model->get_staff_by_parent($parent_id);
                $this->send_response($contacts);
            } catch (Exception $e) {
                log_message('error', 'Get parent staff error: ' . $e->getMessage());
                $this->send_error('Failed to retrieve parent staff contacts', 500);
            }
            return;
        }

        $this->send_error('Method not allowed', 405);
    }

    /**
     * Bulk update parent staff contacts
     * POST /api/admin/parent_staff_bulk/{parent_id}
     */
    public function parent_staff_bulk($parent_id) {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        if (!$this->require_any_permission(['parents', 'parents.create', 'parents.update', '*'])) {
            return;
        }

        if (!$parent_id) {
            $this->send_error('Parent ID required', 400);
            return;
        }

        try {
            $input = $this->get_input();
            $staff_data = isset($input['staff_contacts']) && is_array($input['staff_contacts']) ? $input['staff_contacts'] : [];

            // Validate each staff record
            foreach ($staff_data as $index => &$staff) {
                if (empty($staff['name'])) {
                    $this->send_error("Staff name is required at index $index", 400);
                    return;
                }

                if (empty($staff['mobile_number'])) {
                    $this->send_error("Mobile number is required at index $index", 400);
                    return;
                }

                // Validate mobile number format (10 digits)
                if (!preg_match('/^[0-9]{10}$/', $staff['mobile_number'])) {
                    $this->send_error("Valid mobile number (10 digits) is required at index $index", 400);
                    return;
                }

                $staff['tss_id'] = !empty($staff['tss_id']) ? (int)$staff['tss_id'] : null;
                $staff['photo'] = isset($staff['photo']) && $staff['photo'] !== '' ? $staff['photo'] : null;
            }
            unset($staff);

            if ($this->Parent_staff_model->update_staff_for_parent($parent_id, $staff_data)) {
                $updated_staff = $this->Parent_staff_model->get_staff_by_parent($parent_id);
                $this->log_activity('parent_staff_bulk_updated', 'parent_staff', $parent_id, null, $staff_data);
                $this->send_response($updated_staff, 'Parent staff updated successfully');
            } else {
                $this->send_error('Failed to update parent staff', 500);
            }
        } catch (Exception $e) {
            log_message('error', 'Bulk update parent staff error: ' . $e->getMessage());
            $this->send_error('Failed to update parent staff', 500);
        }
    }
    
    // Get divisions for dropdown (with grade names)
    public function divisions_dropdown() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['divisions', 'divisions.view', 'divisions.create', 'divisions.update', 'divisions.delete'])) {
            return;
        }
        
        $this->db->select('divisions.id, divisions.name, grades.name as grade_name');
        $this->db->from('divisions');
        $this->db->join('grades', 'divisions.grade_id = grades.id');
        $this->db->where('divisions.is_active', 1);
        $this->db->where('grades.is_active', 1);
        $this->db->order_by('grades.name, divisions.name');
        $query = $this->db->get();
        $divisions = $query->result_array();
        
        $this->send_response($divisions);
    }
    
    // Debug endpoint to check user authentication details
    public function debug_auth() {
        $this->send_response([
            'status' => 'success',
            'message' => 'Authentication details',
            'data' => [
                'user_id' => $this->user['id'],
                'user_type' => $this->user_type,
                'user_name' => $this->user['name'] ?? 'Unknown',
                'permissions' => $this->permissions,
                'is_admin' => ($this->user_type === 'admin'),
                'role_id' => $this->user['role_id'] ?? null,
                'role_name' => $this->user['role_name'] ?? null,
                'expected_behavior' => $this->user_type === 'admin' 
                    ? 'Should see ALL fee collections'
                    : 'Should see only own fee collections (collected_by = ' . $this->user['id'] . ')',
                'user_data' => $this->user
            ]
        ]);
    }
    
    // Fee Categories Management
    public function fee_categories($id = null) {
        if (!$this->require_any_permission(['fees', 'fees.view', 'fees.create', 'fees.update', 'fees.delete', 'fees.structure'])) {
            return;
        }
        
        switch ($this->input->method()) {
            case 'get':
                if ($id) {
                    $category = $this->Fee_category_model->get_fee_category_by_id($id);
                    if (!$category) {
                        $this->send_error('Fee category not found', 404);
                        return;
                    }
                    
                    // Add statistics
                    $category['statistics'] = $this->Fee_category_model->get_category_statistics($id);
                    
                    $this->send_response($category);
                } else {
                    $limit = $this->input->get('limit') ?: 10;
                    $offset = $this->input->get('offset') ?: 0;
                    $search = $this->input->get('search');
                    
                    $categories = $this->Fee_category_model->get_fee_categories_paginated($limit, $offset, $search);
                    $total = $this->Fee_category_model->count_fee_categories($search);
                    
                    $this->send_response([
                        'data' => $categories,
                        'total' => $total,
                        'limit' => $limit,
                        'offset' => $offset,
                        'has_next' => ($offset + $limit) < $total,
                        'has_prev' => $offset > 0
                    ]);
                }
                break;
                
            case 'post':
                $input = $this->validate_input([
                    'name' => 'required|max_length[100]',
                    'description' => 'max_length[500]'
                ]);
                
                if (!$input) return;
                
                // Check if name already exists
                if ($this->Fee_category_model->name_exists($input['name'])) {
                    $this->send_error('Fee category with this name already exists', 400);
                    return;
                }
                
                $category_id = $this->Fee_category_model->create_fee_category($input);
                if ($category_id) {
                    $this->log_activity('fee_category_created', 'fee_categories', $category_id, null, $input);
                    $this->send_response(['id' => $category_id], 'Fee category created successfully', 201);
                } else {
                    $this->send_error('Failed to create fee category', 500);
                }
                break;
                
            case 'put':
                if (!$id) {
                    $this->send_error('Fee category ID required', 400);
                    return;
                }
                
                $input = $this->validate_input([
                    'name' => 'required|max_length[100]',
                    'description' => 'max_length[500]'
                ]);
                
                if (!$input) return;
                
                $old_category = $this->Fee_category_model->get_fee_category_by_id($id);
                if (!$old_category) {
                    $this->send_error('Fee category not found', 404);
                    return;
                }
                
                // Check if name already exists (excluding current)
                if ($this->Fee_category_model->name_exists($input['name'], $id)) {
                    $this->send_error('Fee category with this name already exists', 400);
                    return;
                }
                
                if ($this->Fee_category_model->update_fee_category($id, $input)) {
                    $this->log_activity('fee_category_updated', 'fee_categories', $id, $old_category, $input);
                    $this->send_response(null, 'Fee category updated successfully');
                } else {
                    $this->send_error('Failed to update fee category', 500);
                }
                break;
                
            case 'delete':
                if (!$id) {
                    $this->send_error('Fee category ID required', 400);
                    return;
                }
                
                $category = $this->Fee_category_model->get_fee_category_by_id($id);
                if (!$category) {
                    $this->send_error('Fee category not found', 404);
                    return;
                }
                
                if ($this->Fee_category_model->delete_fee_category($id)) {
                    $this->log_activity('fee_category_deleted', 'fee_categories', $id, $category, null);
                    $this->send_response(null, 'Fee category deleted successfully');
                } else {
                    $this->send_error('Cannot delete fee category. It may be in use by fee structures.', 400);
                }
                break;
                
            default:
                $this->send_error('Method not allowed', 405);
        }
    }
    // Fee Categories dropdown
    public function fee_categories_dropdown() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $this->load->model('Fee_category_model');
            $categories = $this->Fee_category_model->get_fee_categories_for_dropdown();
            
            // If no categories exist, create default ones
            if (!$categories || empty($categories)) {
                $this->create_default_fee_categories();
                $categories = $this->Fee_category_model->get_fee_categories_for_dropdown();
            }
            
            if (!$categories) {
                $categories = [];
            }
            
            $this->send_response($categories, 'Fee categories retrieved successfully');
        } catch (Exception $e) {
            $this->send_error('Failed to load categories: ' . $e->getMessage(), 500);
        }
    }
    
    // Fee Types (for fee collections reporting)
    public function fee_types() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $this->db->select('id, name, description, is_active');
            $this->db->from('fee_types');
            $this->db->where('is_active', 1);
            $this->db->order_by('name');
            
            $query = $this->db->get();
            $fee_types = $query->result_array();
            
            $this->send_response($fee_types, 'Fee types retrieved successfully');
        } catch (Exception $e) {
            $this->send_error('Failed to load fee types: ' . $e->getMessage(), 500);
        }
    }
    
    // Create default fee categories
    private function create_default_fee_categories() {
        $default_categories = [
            ['name' => 'Tuition Fee', 'description' => 'Monthly or semester tuition fee'],
            ['name' => 'Admission Fee', 'description' => 'One-time admission processing fee'],
            ['name' => 'Transportation', 'description' => 'Bus transportation fee'],
            ['name' => 'Library Fee', 'description' => 'Library access and maintenance fee'],
            ['name' => 'Laboratory Fee', 'description' => 'Science laboratory usage fee'],
            ['name' => 'Sports Fee', 'description' => 'Sports activities and equipment fee'],
            ['name' => 'Examination Fee', 'description' => 'Examination processing and evaluation fee'],
            ['name' => 'Activity Fee', 'description' => 'Extra-curricular activities fee'],
            ['name' => 'Uniform', 'description' => 'School uniform purchase'],
            ['name' => 'Books & Supplies', 'description' => 'Textbooks and school supplies'],
            ['name' => 'Security Deposit', 'description' => 'Refundable security deposit'],
            ['name' => 'Late Fee', 'description' => 'Late payment penalty'],
            ['name' => 'Other', 'description' => 'Miscellaneous fees']
        ];
        
        foreach ($default_categories as $category) {
            // Check if category already exists
            if (!$this->Fee_category_model->name_exists($category['name'])) {
                $this->Fee_category_model->create_fee_category($category);
            }
        }
    }
    
    // Get fee structure amount by category (for direct payments)
    public function fee_category_amount($category_id = null) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$category_id) {
            $this->send_error('Category ID is required', 400);
            return;
        }
        
        try {
            $this->load->model('Fee_structure_model');
            $this->load->model('Academic_year_model');
            
            // Get current academic year
            $current_year = $this->Academic_year_model->get_default_academic_year();
            if (!$current_year) {
                $this->send_error('No default academic year found', 400);
                return;
            }
            
            // Get fee structure for this category in current academic year
            // Look for non-semester fees (Direct Payment type)
            $this->db->select('amount');
            $this->db->from('fee_structures');
            $this->db->where('fee_category_id', $category_id);
            $this->db->where('academic_year_id', $current_year['id']);
            $this->db->where('is_active', 1);
            $this->db->where('is_mandatory', 0); // Non-mandatory fees are typically direct payment fees
            $this->db->where('grade_id IS NULL', null, false); // Universal fees
            $this->db->where('division_id IS NULL', null, false);
            $this->db->order_by('id', 'DESC');
            $this->db->limit(1);
            
            $query = $this->db->get();
            $fee_structure = $query->row_array();
            
            if ($fee_structure) {
                $this->send_response([
                    'amount' => floatval($fee_structure['amount'])
                ], 'Fee amount retrieved successfully');
            } else {
                // If no specific fee structure found, return null to allow manual entry
                $this->send_response([
                    'amount' => null
                ], 'No predefined amount found for this category');
            }
            
        } catch (Exception $e) {
            $this->send_error('Failed to get fee amount: ' . $e->getMessage(), 500);
        }
    }
    
    // Debug direct payment - temporary endpoint
    public function debug_direct_payment() {
        // Skip all auth checks for debugging
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $input = $this->get_input();
            log_message('debug', 'Debug input: ' . json_encode($input));
            
            // Test 1: Check academic year
            $this->load->model('Academic_year_model');
            $current_year = $this->Academic_year_model->get_default_academic_year();
            if (!$current_year) {
                $this->send_error('No default academic year found', 400);
                return;
            }
            
            // Test 2: Try minimal fee structure insert
            $fee_structure_data = [
                'fee_category_id' => $input['fee_category_id'],
                'academic_year_id' => $current_year['id'],
                'semester' => 'Direct Payment',
                'amount' => $input['amount'],
                'due_date' => date('Y-m-d'),
                'is_mandatory' => 0,
                'is_active' => 1,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            log_message('debug', 'Testing fee structure: ' . json_encode($fee_structure_data));
            
            if (!$this->db->insert('fee_structures', $fee_structure_data)) {
                $error = $this->db->error();
                log_message('error', 'Fee structure failed: ' . json_encode($error));
                $this->send_error('Fee structure failed: ' . $error['message'], 500);
                return;
            }
            
            $fee_structure_id = $this->db->insert_id();
            
            // Test 3: Try assignment insert
            $assignment_data = [
                'student_id' => $input['student_id'],
                'fee_structure_id' => $fee_structure_id,
                'total_amount' => $input['amount'],
                'pending_amount' => $input['amount'],
                'paid_amount' => 0.00,
                'due_date' => date('Y-m-d'),
                'status' => 'pending',
                'semester' => 'Direct Payment',
                'assigned_at' => date('Y-m-d H:i:s')
            ];
            
            log_message('debug', 'Testing assignment: ' . json_encode($assignment_data));
            
            if (!$this->db->insert('student_fee_assignments', $assignment_data)) {
                $error = $this->db->error();
                log_message('error', 'Assignment failed: ' . json_encode($error));
                $this->send_error('Assignment failed: ' . $error['message'], 500);
                return;
            }
            
            $assignment_id = $this->db->insert_id();
            
            // Test 4: Try fee collection insert
            $collection_data = [
                'student_id' => $input['student_id'],
                'student_fee_assignment_id' => $assignment_id,
                'amount' => $input['amount'],
                'payment_method' => $input['payment_method'],
                'reference_number' => $input['reference_number'] ?? null,
                'remarks' => $input['remarks'] ?? null,
                'collected_by_staff_id' => $this->user['id'],
                'receipt_number' => 'TEST' . time(),
                'collection_date' => date('Y-m-d'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            log_message('debug', 'Testing collection: ' . json_encode($collection_data));
            
            if (!$this->db->insert('fee_collections', $collection_data)) {
                $error = $this->db->error();
                log_message('error', 'Collection failed: ' . json_encode($error));
                $this->send_error('Collection failed: ' . $error['message'], 500);
                return;
            }
            
            $this->send_response([
                'fee_structure_id' => $fee_structure_id,
                'assignment_id' => $assignment_id,
                'collection_id' => $this->db->insert_id()
            ], 'All tests passed');
            
        } catch (Exception $e) {
            log_message('error', 'Debug test exception: ' . $e->getMessage());
            $this->send_error('Exception: ' . $e->getMessage(), 500);
        }
    }
    
    // Fee Structures Management
    public function fee_structures($id = null) {
        if (!$this->require_any_permission(['fees', 'fees.view', 'fees.create', 'fees.update', 'fees.delete', 'fees.structure'])) {
            return;
        }
        
        switch ($this->input->method()) {
            case 'get':
                if ($id) {
                    $structure = $this->Fee_structure_model->get_fee_structure_by_id($id);
                    if (!$structure) {
                        $this->send_error('Fee structure not found', 404);
                        return;
                    }
                    
                    // Add statistics
                    $structure['statistics'] = $this->Fee_structure_model->get_structure_statistics($id);
                    
                    $this->send_response($structure);
                } else {
                    $limit = $this->input->get('limit') ?: 10;
                    $offset = $this->input->get('offset') ?: 0;
                    $search = $this->input->get('search');
                    $academic_year_id = $this->input->get('academic_year_id');
                    $grade_id = $this->input->get('grade_id');
                    $category_id = $this->input->get('category_id');
                    $is_mandatory = $this->input->get('is_mandatory');
                    
                    $structures = $this->Fee_structure_model->get_fee_structures_paginated($limit, $offset, $search, $academic_year_id, $grade_id, $category_id, $is_mandatory);
                    $total = $this->Fee_structure_model->count_fee_structures($search, $academic_year_id, $grade_id, $category_id, $is_mandatory);
                    
                    $this->send_response([
                        'data' => $structures,
                        'total' => $total,
                        'limit' => $limit,
                        'offset' => $offset,
                        'has_next' => ($offset + $limit) < $total,
                        'has_prev' => $offset > 0
                    ]);
                }
                break;
                
            case 'post':
                $input = $this->validate_input([
                    'academic_year_id' => 'required|integer',
                    'grade_id' => 'integer',
                    'division_id' => 'integer',
                    'fee_category_id' => 'required|integer',
                    'amount' => 'required|numeric',
                    'due_date' => '',
                    'is_mandatory' => 'integer',
                    'installments_allowed' => 'integer',
                    'max_installments' => 'integer',
                    'late_fee_amount' => 'numeric',
                    'late_fee_days' => 'integer',
                    'item_size' => 'string'
                ]);
                
                if (!$input) return;
                
                // Force division_id to null for grade-only fee structures
                $input['division_id'] = null;
                
                // Handle Global option: when grade_id is null, it applies to all grades
                if (empty($input['grade_id'])) {
                    $input['grade_id'] = null;
                }
                
                // Handle file upload for item photo
                if (isset($_FILES['item_photo']) && $_FILES['item_photo']['error'] === UPLOAD_ERR_OK) {
                    $upload_result = $this->upload_item_photo($_FILES['item_photo']);
                    if ($upload_result['success']) {
                        $input['item_photo'] = $upload_result['file_path'];
                    } else {
                        $this->send_error('Failed to upload item photo: ' . $upload_result['error'], 400);
                        return;
                    }
                }
                
                // Duplicate checking is handled in the model
                
                $result = $this->Fee_structure_model->create_fee_structure($input);
                
                // Check if result is an error array
                if (is_array($result) && isset($result['error'])) {
                    $this->send_error($result['error'], 400);
                } elseif ($result) {
                    $this->log_activity('fee_structure_created', 'fee_structures', $result, null, $input);
                    $this->send_response(['id' => $result], 'Fee structure created successfully', 201);
                } else {
                    $this->send_error('Failed to create fee structure', 500);
                }
                break;
                
            case 'put':
                if (!$id) {
                    $this->send_error('Fee structure ID required', 400);
                    return;
                }
                
                $input = $this->validate_input([
                    'academic_year_id' => 'required|integer',
                    'grade_id' => 'integer',
                    'division_id' => 'integer',
                    'fee_category_id' => 'required|integer',
                    'amount' => 'required|numeric',
                    'due_date' => '',
                    'is_mandatory' => 'integer',
                    'installments_allowed' => 'integer',
                    'max_installments' => 'integer',
                    'late_fee_amount' => 'numeric',
                    'late_fee_days' => 'integer',
                    'item_size' => 'string'
                ]);
                
                if (!$input) return;
                
                // Force division_id to null for grade-only fee structures
                $input['division_id'] = null;
                
                // Handle Global option: when grade_id is null, it applies to all grades
                if (empty($input['grade_id'])) {
                    $input['grade_id'] = null;
                }
                
                // Handle file upload for item photo
                if (isset($_FILES['item_photo']) && $_FILES['item_photo']['error'] === UPLOAD_ERR_OK) {
                    $upload_result = $this->upload_item_photo($_FILES['item_photo']);
                    if ($upload_result['success']) {
                        $input['item_photo'] = $upload_result['file_path'];
                    } else {
                        $this->send_error('Failed to upload item photo: ' . $upload_result['error'], 400);
                        return;
                    }
                }
                
                $old_structure = $this->Fee_structure_model->get_fee_structure_by_id($id);
                if (!$old_structure) {
                    $this->send_error('Fee structure not found', 404);
                    return;
                }
                
                // Check for duplicate (excluding current) - division_id is always null now
                if ($this->Fee_structure_model->check_duplicate($input['academic_year_id'], $input['grade_id'], null, $input['fee_category_id'], $id)) {
                    $this->send_error('Fee structure already exists for this combination', 400);
                    return;
                }
                
                if ($this->Fee_structure_model->update_fee_structure($id, $input)) {
                    $this->log_activity('fee_structure_updated', 'fee_structures', $id, $old_structure, $input);
                    $this->send_response(null, 'Fee structure updated successfully');
                } else {
                    $this->send_error('Failed to update fee structure', 500);
                }
                break;
                
            case 'delete':
                if (!$id) {
                    $this->send_error('Fee structure ID required', 400);
                    return;
                }
                
                $structure = $this->Fee_structure_model->get_fee_structure_by_id($id);
                if (!$structure) {
                    $this->send_error('Fee structure not found', 404);
                    return;
                }
                
                // Check for force parameter
                $force = $this->input->get('force') === 'true';
                
                $result = $this->Fee_structure_model->delete_fee_structure($id, $force);
                
                if ($result === true) {
                    $this->log_activity('fee_structure_deleted', 'fee_structures', $id, $structure, ['force' => $force]);
                    $message = $force ? 'Fee structure and all active assignments deleted successfully' : 'Fee structure deleted successfully';
                    $this->send_response(null, $message);
                } else if (is_array($result) && isset($result['error'])) {
                    // Return detailed error with assignment count
                    $this->send_response([
                        'can_force_delete' => true,
                        'assignment_count' => $result['count']
                    ], $result['error'], 400);
                } else {
                    $this->send_error('Failed to delete fee structure', 500);
                }
                break;
                
            default:
                $this->send_error('Method not allowed', 405);
        }
    }
    
    // Get applicable fee structures for a student (including global fees)
    public function student_applicable_fees($student_id = null) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['fees', 'fees.view', 'fees.structure', 'students', 'students.view'])) {
            return;
        }
        
        if (!$student_id) {
            $this->send_error('Student ID is required', 400);
            return;
        }
        
        // Get student details first
        $student = $this->Student_model->get_student_by_id($student_id);
        if (!$student) {
            $this->send_error('Student not found', 404);
            return;
        }
        
        $academic_year_id = $this->input->get('academic_year_id') ?: $student['academic_year_id'];
        $mandatory_only = $this->input->get('mandatory_only') === 'true';
        
        // Get all applicable fee structures (including global ones)
        $applicable_fees = $this->Fee_structure_model->get_applicable_fee_structures(
            $student_id,
            $academic_year_id,
            $student['grade_id'],
            $student['division_id'],
            $mandatory_only
        );
        
        // Get student's current assignments to show status
        $this->db->select('sfa.*, fs.id as fee_structure_id');
        $this->db->from('student_fee_assignments sfa');
        $this->db->join('fee_structures fs', 'sfa.fee_structure_id = fs.id');
        $this->db->where('sfa.student_id', $student_id);
        $this->db->where('fs.academic_year_id', $academic_year_id);
        $this->db->where('sfa.is_active', 1);
        $assignments = $this->db->get()->result_array();
        
        // Create lookup for assignments by fee_structure_id
        $assignment_lookup = [];
        foreach ($assignments as $assignment) {
            $assignment_lookup[$assignment['fee_structure_id']] = $assignment;
        }
        
        // Add assignment status to each fee structure
        foreach ($applicable_fees as &$fee) {
            if (isset($assignment_lookup[$fee['id']])) {
                $assignment = $assignment_lookup[$fee['id']];
                $fee['assignment_status'] = $assignment['status'];
                $fee['total_amount'] = $assignment['total_amount'];
                $fee['paid_amount'] = $assignment['paid_amount'];
                $fee['pending_amount'] = $assignment['pending_amount'];
                $fee['due_date'] = $assignment['due_date'];
                $fee['is_assigned'] = true;
            } else {
                $fee['assignment_status'] = 'not_assigned';
                $fee['total_amount'] = $fee['amount'];
                $fee['paid_amount'] = 0;
                $fee['pending_amount'] = $fee['amount'];
                $fee['is_assigned'] = false;
            }
        }
        
        $response = [
            'student' => [
                'id' => $student['id'],
                'name' => $student['student_name'],
                'grade' => $student['grade_name'],
                'division' => $student['division_name'],
                'roll_number' => $student['roll_number']
            ],
            'academic_year_id' => $academic_year_id,
            'applicable_fees' => $applicable_fees,
            'summary' => [
                'total_structures' => count($applicable_fees),
                'global_structures' => count(array_filter($applicable_fees, function($fee) { return $fee['is_global']; })),
                'grade_specific_structures' => count(array_filter($applicable_fees, function($fee) { return !$fee['is_global']; })),
                'assigned_count' => count(array_filter($applicable_fees, function($fee) { return $fee['is_assigned']; })),
                'unassigned_count' => count(array_filter($applicable_fees, function($fee) { return !$fee['is_assigned']; }))
            ]
        ];
        
        $this->send_response($response);
    }
    
    // Fee Collections Management
    // DEBUG ENDPOINT - REMOVE IN PRODUCTION
    public function debug_user_info() {
        $debug_info = [
            'user' => $this->user,
            'user_type' => $this->user_type,
            'permissions' => $this->permissions,
            'token_from_header' => $this->get_token_from_header_debug(),
            'auth_headers' => $this->input->request_headers()
        ];
        
        log_message('debug', 'User debug info: ' . json_encode($debug_info));
        $this->send_response($debug_info, 'Debug info retrieved');
    }
    
    private function get_token_from_header_debug() {
        $headers = $this->input->request_headers();
        
        if (isset($headers['Authorization'])) {
            $auth_header = $headers['Authorization'];
            if (preg_match('/Bearer\\s+(.*)$/i', $auth_header, $matches)) {
                return $matches[1];
            }
        }
        
        return $this->input->get('token');
    }

    public function fee_collections($id = null) {
        // Admin-only endpoint - check permissions for viewing all fee collections
        if (!$this->require_any_permission(['fee_collections', 'fees', 'view_fee_collections', 'admin_fees', '*'])) {
            return;
        }
        
        switch ($this->input->method()) {
            case 'get':
                if ($id) {
                    try {
                        $collection = $this->Fee_collection_model->get_collection_by_id($id);
                        if (!$collection) {
                            $this->send_error('Fee collection not found', 404);
                            return;
                        }
                        
                        // Admin endpoint - no access restrictions needed
                        
                        $this->send_response($collection);
                    } catch (Exception $e) {
                        log_message('error', 'Error getting collection by ID: ' . $e->getMessage());
                        $this->send_error('Failed to retrieve collection: ' . $e->getMessage(), 500);
                    }
                } else {
                    $limit = $this->input->get('limit') ?: 10;
                    $offset = $this->input->get('offset') ?: 0;
                    
                    // Build base filters from URL parameters
                    $filters = [
                        'start_date' => $this->input->get('start_date'),
                        'end_date' => $this->input->get('end_date'),
                        'grade_id' => $this->input->get('grade_id'),
                        'division_id' => $this->input->get('division_id'),
                        'category_id' => $this->input->get('category_id'),
                        'payment_mode' => $this->input->get('payment_mode'),
                        'search' => $this->input->get('search')
                    ];
                    
                    // Apply role-based filtering based on user type
                    log_message('debug', 'Fee Collections API - User type: ' . $this->user_type);
                    log_message('debug', 'Fee Collections API - User ID: ' . $this->user['id']);
                    log_message('debug', 'Fee Collections API - Base filters: ' . json_encode($filters));
                    
                    if ($this->user_type === 'admin') {
                        // Admin users can see ALL collections
                        // Allow admin to optionally filter by staff_id via URL parameter
                        $optional_staff_filter = $this->input->get('staff_id') ?: $this->input->get('collected_id');
                        if ($optional_staff_filter) {
                            $filters['staff_id'] = $optional_staff_filter;
                            log_message('debug', 'ADMIN USER: Optional staff filter applied: ' . $optional_staff_filter);
                        } else {
                            log_message('debug', 'ADMIN USER: Showing all fee collections without filtering');
                        }
                    } else {
                        // Non-admin users (staff) can ONLY see their own collections
                        $filters['staff_id'] = $this->user['id'];
                        log_message('debug', 'NON-ADMIN USER: Filtering fee collections by staff_id = ' . $this->user['id']);
                    }
                    
                    log_message('debug', 'Final filters applied: ' . json_encode($filters));
                    
                    $collections = $this->Fee_collection_model->get_fee_collections_paginated($limit, $offset, $filters);
                    $total = $this->Fee_collection_model->count_fee_collections($filters);
                    
                    $this->send_response([
                        'data' => $collections,
                        'total' => $total,
                        'limit' => $limit,
                        'offset' => $offset,
                        'has_next' => ($offset + $limit) < $total,
                        'has_prev' => $offset > 0,
                        'user_role' => $this->user_type,
                        'endpoint_type' => 'admin',
                        'debug_info' => [
                            'user_id' => $this->user['id'],
                            'user_type' => $this->user_type,
                            'permissions' => $this->permissions,
                            'is_admin' => ($this->user_type === 'admin'),
                            'applied_filters' => $filters,
                            'staff_id_filter_applied' => !empty($filters['staff_id']),
                            'staff_id_filter_value' => isset($filters['staff_id']) ? $filters['staff_id'] : null,
                            'filtering_logic' => $this->user_type === 'admin' 
                                ? (isset($filters['staff_id']) ? 'Admin: Optional filter by staff ID ' . $filters['staff_id'] : 'Admin: No filtering - showing ALL records')
                                : 'Non-admin: Automatically filtered by user ID ' . $this->user['id'],
                            'query_will_return' => $this->user_type === 'admin' 
                                ? (isset($filters['staff_id']) ? 'Collections by staff ID ' . $filters['staff_id'] : 'ALL fee collections')
                                : 'Only collections by user ID ' . $this->user['id']
                        ]
                    ]);
                }
                break;
                
            case 'post':
                $input = $this->validate_input([
                    'student_id' => 'required|integer',
                    'student_fee_assignment_id' => 'integer', // Made optional for direct payments
                    'amount' => 'required|numeric',
                    'payment_mode' => 'required|in_list[cash,card,online,cheque,dd,upi,bank_transfer]',
                    'payment_method' => 'in_list[cash,card,online,cheque,dd,upi,bank_transfer]',
                    'payment_reference' => 'max_length[100]',
                    'transaction_id' => 'max_length[100]',
                    'remarks' => 'max_length[500]',
                    // Direct payment fields
                    'is_direct_payment' => 'integer',
                    'fee_category_id' => 'integer',
                    'direct_fee_description' => 'max_length[255]',
                    'direct_fee_due_date' => 'regex_match[/^\d{4}-\d{2}-\d{2}$/]',
                    // Optional fees
                    'optional_fees' => 'array'
                ]);
                
                if (!$input) return;
                
                // Map payment_mode to payment_method for database compatibility
                if (isset($input['payment_mode'])) {
                    $input['payment_method'] = $input['payment_mode'];
                }
                
                // Validate that either we have an assignment ID, optional fees, or it's a direct payment
                if (empty($input['student_fee_assignment_id']) && empty($input['is_direct_payment']) && empty($input['optional_fees'])) {
                    $this->send_error('Either student_fee_assignment_id, optional_fees, or is_direct_payment must be provided', 400);
                    return;
                }
                
                // For direct payments, validate required fields
                if (!empty($input['is_direct_payment']) && empty($input['fee_category_id'])) {
                    $this->send_error('fee_category_id is required for direct payments', 400);
                    return;
                }
                
                $input['collected_by_staff_id'] = $this->user['id'];
                
                try {
                    $collection_id = $this->Fee_collection_model->collect_fee($input);
                } catch (Exception $e) {
                    log_message('error', 'Controller caught exception: ' . $e->getMessage());
                    $this->send_error('Direct payment error: ' . $e->getMessage(), 500);
                    return;
                }
                
                if ($collection_id) {
                    $this->log_activity('fee_collected', 'fee_collections', $collection_id, null, $input);
                    
                    // Get the created collection with receipt details
                    $collection = $this->Fee_collection_model->get_collection_by_id($collection_id);
                    
                    $this->send_response([
                        'id' => $collection_id,
                        'receipt_number' => $collection['receipt_number']
                    ], 'Fee collected successfully', 201);
                } else {
                    $db_error = $this->db->error();
                    $model_error = $this->Fee_collection_model->get_last_error();
                    $last_query = $this->db->last_query();
                    
                    // Return detailed debug information
                    $this->output->set_status_header(500);
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Database error occurred',
                        'error_code' => 500,
                        'debug' => [
                            'db_error' => $db_error,
                            'model_error' => $model_error,
                            'last_query' => $last_query,
                            'input_data' => $input
                        ]
                    ]);
                    exit();
                }
                break;
                
            default:
                $this->send_error('Method not allowed', 405);
        }
    }
    
    // Verify fee collection (Admin only)
    public function verify_fee_collection($id) {
        if ($this->input->method() !== 'put') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['fees', 'fees.view', 'fees.create', 'fees.update', 'fees.delete']) || $this->user['user_type'] !== 'admin') {
            $this->send_error('Admin permission required', 403);
            return;
        }
        
        if (!$id) {
            $this->send_error('Collection ID required', 400);
            return;
        }
        
        if ($this->Fee_collection_model->verify_collection($id, $this->user['id'])) {
            $this->log_activity('fee_collection_verified', 'fee_collections', $id, null, ['verified_by' => $this->user['id']]);
            $this->send_response(null, 'Fee collection verified successfully');
        } else {
            $this->send_error('Failed to verify fee collection', 500);
        }
    }
    
    // Get student fee assignments
    public function student_fee_assignments($student_id) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['fees', 'fees.view', 'fees.create', 'fees.update', 'fees.delete', 'fees.structure'])) {
            return;
        }
        
        if (!$student_id) {
            $this->send_error('Student ID required', 400);
            return;
        }
        
        $academic_year_id = $this->input->get('academic_year_id');
        $assignments = $this->Fee_structure_model->get_student_fee_assignments($student_id, $academic_year_id);
        
        $this->send_response([
            'data' => $assignments,
            'total' => count($assignments)
        ]);
    }
    // Get available optional fees for a student
    public function available_optional_fees($student_id) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['fees', 'fees.view', 'fees.create', 'fees.update', 'fees.delete', 'fees.structure'])) {
            return;
        }
        
        if (!$student_id) {
            $this->send_error('Student ID required', 400);
            return;
        }
        
        $academic_year_id = $this->input->get('academic_year_id');
        $semester = $this->input->get('semester') ?: 'Semester 1';
        
        // New grade filtering parameters
        $student_grade_id = $this->input->get('student_grade_id');
        $grade_id = $this->input->get('grade_id');
        $include_global = $this->input->get('include_global') === 'true';
        $global_only = $this->input->get('global_only') === 'true';
        
        // Determine final grade_id for filtering
        $final_grade_id = null;
        if ($student_grade_id) {
            $final_grade_id = $student_grade_id;
        } elseif ($grade_id) {
            $final_grade_id = $grade_id;
        } else {
            // Get student's grade if not provided
            $this->load->model('Student_model');
            $student = $this->Student_model->get_student_by_id($student_id);
            if ($student) {
                $final_grade_id = $student['grade_id'];
            }
        }
        
        $this->load->model('Fee_structure_model');
        $available_fees = $this->Fee_structure_model->get_available_optional_fees(
            $student_id, 
            $academic_year_id, 
            $final_grade_id, 
            null, // division_id
            $semester,
            $include_global,
            $global_only
        );
        
        $this->send_response([
            'data' => $available_fees,
            'total' => count($available_fees),
            'debug' => [
                'student_id' => $student_id,
                'academic_year_id' => $academic_year_id,
                'semester' => $semester,
                'final_grade_id' => $final_grade_id,
                'include_global' => $include_global,
                'global_only' => $global_only
            ]
        ]);
    }
    
    // Get student payment history
    public function student_payment_history($student_id) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['fees', 'fees.view', 'fees.create', 'fees.update', 'fees.delete', 'fees.structure'])) {
            return;
        }
        
        if (!$student_id) {
            $this->send_error('Student ID required', 400);
            return;
        }
        
        $history = $this->Fee_collection_model->get_student_payment_history($student_id);
        $this->send_response($history);
    }
    
    // Get collection summary/reports
    public function collection_summary() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['fees', 'fees.view', 'fees.create', 'fees.update', 'fees.delete', 'fees.structure'])) {
            return;
        }
        
        $filters = [
            'start_date' => $this->input->get('start_date'),
            'end_date' => $this->input->get('end_date'),
            'staff_id' => $this->input->get('staff_id')
        ];
        
        $summary = $this->Fee_collection_model->get_collection_summary($filters);
        $this->send_response($summary);
    }
    
    // Search functionality
    public function search() {
        if (!$this->require_permission('search')) {
            return;
        }
        
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        $query = $this->input->get('q');
        $type = $this->input->get('type'); // student, parent, staff
        
        if (!$query) {
            $this->send_error('Search query required', 400);
            return;
        }
        
        $results = [];
        
        if (!$type || $type === 'student') {
            $students = $this->Student_model->search_students($query);
            $results['students'] = $students;
        }
        
        if (!$type || $type === 'parent') {
            $parents = $this->Parent_model->search_parents($query);
            $results['parents'] = $parents;
        }
        
        if (!$type || $type === 'staff') {
            $staff = $this->Staff_model->search_staff($query);
            $results['staff'] = $staff;
        }
        
        $this->send_response($results, 'Search completed successfully');
    }
    
    // Helper methods
    private function get_recent_activities() {
        $this->db->limit(10);
        $this->db->order_by('created_at', 'DESC');
        $query = $this->db->get('audit_logs');
        return $query->result_array();
    }
    
    private function get_complaints_summary() {
        $this->db->select('status, COUNT(*) as count');
        $this->db->group_by('status');
        $query = $this->db->get('complaints');
        
        $summary = [];
        foreach ($query->result_array() as $row) {
            $summary[$row['status']] = $row['count'];
        }
        
        return $summary;
    }
    
    private function encrypt_sensitive_data($data) {
        $key = 'school_encryption_key_2024';
        $iv = openssl_random_pseudo_bytes(16);
        $encrypted = openssl_encrypt($data, 'AES-256-CBC', $key, 0, $iv);
        return base64_encode($iv . $encrypted);
    }
    
    // Announcements Management
    public function announcements($id = null) {
        if (!$this->require_any_permission(['announcements', 'announcements.view', 'announcements.create', 'announcements.update', 'announcements.delete'])) {
            return;
        }
        
        $method = $this->input->method();
        
        switch ($method) {
            case 'get':
                if ($id) {
                    $announcement = $this->Announcement_model->get_announcement_by_id($id);
                    if (!$announcement) {
                        $this->send_error('Announcement not found', 404);
                        return;
                    }
                    $this->send_response($announcement);
                } else {
                    $limit = $this->input->get('limit') ?: 10;
                    $offset = $this->input->get('offset') ?: 0;
                    $filters = [
                        'status' => $this->input->get('status'),
                        'target_type' => $this->input->get('target_type'),
                        'start_date' => $this->input->get('start_date'),
                        'end_date' => $this->input->get('end_date'),
                        'search' => $this->input->get('search')
                    ];
                    
                    $announcements = $this->Announcement_model->get_announcements_paginated($limit, $offset, $filters);
                    $total = $this->Announcement_model->count_announcements($filters);
                    
                    $this->send_response([
                        'data' => $announcements,
                        'total' => $total,
                        'limit' => $limit,
                        'offset' => $offset,
                        'has_next' => ($offset + $limit) < $total,
                        'has_prev' => $offset > 0
                    ]);
                }
                break;
                
            case 'post':
                // Get input directly without CodeIgniter validation first
                $input = json_decode($this->input->raw_input_stream, true);
                
                if (!$input) {
                    $this->send_error('Invalid JSON input', 400);
                    return;
                }
                
                // Manual validation for required fields
                if (empty($input['title'])) {
                    $this->send_error('Validation failed', 400, ['title' => 'The title field is required.']);
                    return;
                }
                
                if (empty($input['message'])) {
                    $this->send_error('Validation failed', 400, ['message' => 'The message field is required.']);
                    return;
                }
                
                if (empty($input['target_type']) || !in_array($input['target_type'], ['all', 'grade', 'division', 'parent', 'staff', 'fee_due'])) {
                    $this->send_error('Validation failed', 400, ['target_type' => 'The target type field is required and must be valid.']);
                    return;
                }
                
                // Custom validation for channels
                if (!isset($input['channels']) || !is_array($input['channels']) || count($input['channels']) === 0) {
                    $this->send_error('Validation failed', 400, ['channels' => 'The channels field is required and must be an array with at least one channel.']);
                    return;
                }
                
                // Validate channels
                $valid_channels = ['whatsapp', 'sms', 'email'];
                foreach ($input['channels'] as $channel) {
                    if (!in_array($channel, $valid_channels)) {
                        $this->send_error('Invalid channel: ' . $channel, 400);
                        return;
                    }
                }
                
                // Custom validation for scheduled_at
                if (!empty($input['scheduled_at'])) {
                    $timestamp = strtotime($input['scheduled_at']);
                    if ($timestamp === false || $timestamp < strtotime('today')) {
                        $this->send_error('Validation failed', 400, ['scheduled_at' => 'The scheduled_at field must be a valid date (today or future).']);
                        return;
                    }
                }
                
                // Validate target_ids based on target_type
                if (in_array($input['target_type'], ['grade', 'division', 'parent', 'staff']) && empty($input['target_ids'])) {
                    $this->send_error('Target IDs required for target type: ' . $input['target_type'], 400);
                    return;
                }
                
                $input['created_by_staff_id'] = $this->user['id'];
                $input['status'] = isset($input['scheduled_at']) ? 'scheduled' : 'draft';
                
                $announcement_id = $this->Announcement_model->create_announcement($input);
                if ($announcement_id) {
                    $this->log_activity('announcement_created', 'announcements', $announcement_id, null, $input);
                    $this->send_response(['id' => $announcement_id], 'Announcement created successfully', 201);
                } else {
                    $this->send_error('Failed to create announcement', 500);
                }
                break;
                
            case 'put':
                if (!$id) {
                    $this->send_error('Announcement ID required', 400);
                    return;
                }
                
                // Get input directly without CodeIgniter validation first
                $input = json_decode($this->input->raw_input_stream, true);
                
                if (!$input) {
                    $this->send_error('Invalid JSON input', 400);
                    return;
                }
                
                // Manual validation for required fields
                if (empty($input['title'])) {
                    $this->send_error('Validation failed', 400, ['title' => 'The title field is required.']);
                    return;
                }
                
                if (empty($input['message'])) {
                    $this->send_error('Validation failed', 400, ['message' => 'The message field is required.']);
                    return;
                }
                
                if (empty($input['target_type']) || !in_array($input['target_type'], ['all', 'grade', 'division', 'parent', 'staff', 'fee_due'])) {
                    $this->send_error('Validation failed', 400, ['target_type' => 'The target type field is required and must be valid.']);
                    return;
                }
                
                // Custom validation for channels
                if (!isset($input['channels']) || !is_array($input['channels']) || count($input['channels']) === 0) {
                    $this->send_error('Validation failed', 400, ['channels' => 'The channels field is required and must be an array with at least one channel.']);
                    return;
                }
                
                // Validate channels
                $valid_channels = ['whatsapp', 'sms', 'email'];
                foreach ($input['channels'] as $channel) {
                    if (!in_array($channel, $valid_channels)) {
                        $this->send_error('Invalid channel: ' . $channel, 400);
                        return;
                    }
                }
                
                // Custom validation for scheduled_at
                if (!empty($input['scheduled_at'])) {
                    $timestamp = strtotime($input['scheduled_at']);
                    if ($timestamp === false || $timestamp < strtotime('today')) {
                        $this->send_error('Validation failed', 400, ['scheduled_at' => 'The scheduled_at field must be a valid date (today or future).']);
                        return;
                    }
                }
                
                // Validate target_ids based on target_type
                if (in_array($input['target_type'], ['grade', 'division', 'parent', 'staff']) && empty($input['target_ids'])) {
                    $this->send_error('Target IDs required for target type: ' . $input['target_type'], 400);
                    return;
                }
                
                $old_announcement = $this->Announcement_model->get_announcement_by_id($id);
                if (!$old_announcement) {
                    $this->send_error('Announcement not found', 404);
                    return;
                }
                
                // Cannot edit sent announcements
                if (in_array($old_announcement['status'], ['sent', 'sending'])) {
                    $this->send_error('Cannot edit sent or sending announcements', 400);
                    return;
                }
                
                if ($this->Announcement_model->update_announcement($id, $input)) {
                    $this->log_activity('announcement_updated', 'announcements', $id, $old_announcement, $input);
                    $this->send_response(null, 'Announcement updated successfully');
                } else {
                    $this->send_error('Failed to update announcement', 500);
                }
                break;
                
            case 'delete':
                if (!$id) {
                    $this->send_error('Announcement ID required', 400);
                    return;
                }
                
                $announcement = $this->Announcement_model->get_announcement_by_id($id);
                if (!$announcement) {
                    $this->send_error('Announcement not found', 404);
                    return;
                }
                
                if ($this->Announcement_model->delete_announcement($id)) {
                    $this->log_activity('announcement_deleted', 'announcements', $id, $announcement, null);
                    $this->send_response(null, 'Announcement deleted successfully');
                } else {
                    $this->send_error('Failed to delete announcement', 500);
                }
                break;
                
            default:
                $this->send_error('Method not allowed', 405);
        }
    }
    
    // Send announcement
    public function send_announcement($id) {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['announcements', 'announcements.view', 'announcements.create', 'announcements.update', 'announcements.delete'])) {
            return;
        }
        
        if (!$id) {
            $this->send_error('Announcement ID required', 400);
            return;
        }
        
        $announcement = $this->Announcement_model->get_announcement_by_id($id);
        if (!$announcement) {
            $this->send_error('Announcement not found', 404);
            return;
        }
        
        if ($announcement['status'] === 'sent') {
            $this->send_error('Announcement already sent', 400);
            return;
        }
        
        try {
            if ($this->Announcement_model->send_announcement($id)) {
                $this->log_activity('announcement_sent', 'announcements', $id, null, ['sent_by' => $this->user['id']]);
                $this->send_response(null, 'Announcement sent successfully');
            } else {
                // Check if there's a database error
                $db_error = $this->db->error();
                if (!empty($db_error['message'])) {
                    $this->send_error('Database error: ' . $db_error['message'], 500);
                } else {
                    $this->send_error('Failed to send announcement', 500);
                }
            }
        } catch (Exception $e) {
            $this->send_error('Error: ' . $e->getMessage(), 500);
        }
    }
    
    // Get announcement delivery status
    public function announcement_delivery_status($id) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['announcements', 'announcements.view', 'announcements.create', 'announcements.update', 'announcements.delete'])) {
            return;
        }
        
        if (!$id) {
            $this->send_error('Announcement ID required', 400);
            return;
        }
        
        $limit = $this->input->get('limit') ?: 50;
        $offset = $this->input->get('offset') ?: 0;
        
        $delivery_status = $this->Announcement_model->get_announcement_delivery_status($id, $limit, $offset);
        $statistics = $this->Announcement_model->get_announcement_statistics($id);
        
        $this->send_response([
            'delivery_status' => $delivery_status,
            'statistics' => $statistics
        ]);
    }
    
    // Get target options (grades, divisions, parents, staff)
    public function announcement_targets() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['announcements', 'announcements.view', 'announcements.create', 'announcements.update', 'announcements.delete'])) {
            return;
        }
        
        $type = $this->input->get('type');
        $data = [];
        
        switch ($type) {
            case 'grades':
                $this->db->select('id, name');
                $this->db->where('is_active', 1);
                $this->db->order_by('name');
                $data = $this->db->get('grades')->result_array();
                break;
                
                
            case 'parents':
                $search = $this->input->get('search');
                $this->db->select('p.id, p.name, p.mobile, COUNT(s.id) as student_count');
                $this->db->from('parents p');
                $this->db->join('students s', 'p.id = s.parent_id AND s.is_active = 1', 'left');
                $this->db->where('p.is_active', 1);
                
                if ($search) {
                    $this->db->group_start();
                    $this->db->like('p.name', $search);
                    $this->db->or_like('p.mobile', $search);
                    $this->db->group_end();
                }
                
                $this->db->group_by('p.id');
                $this->db->order_by('p.name');
                $this->db->limit(50);
                $data = $this->db->get()->result_array();
                break;
                
            case 'staff':
                $search = $this->input->get('search');
                $this->db->select('id, name, mobile, role_name');
                $this->db->where('is_active', 1);
                
                if ($search) {
                    $this->db->group_start();
                    $this->db->like('name', $search);
                    $this->db->or_like('mobile', $search);
                    $this->db->group_end();
                }
                
                $this->db->order_by('name');
                $this->db->limit(50);
                $data = $this->db->get('staff')->result_array();
                break;
                
            default:
                $this->send_error('Invalid target type', 400);
                return;
        }
        
        $this->send_response(['data' => $data]);
    }
    
    // Upload announcement attachment
    public function upload_announcement_attachment() {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['announcements', 'announcements.view', 'announcements.create', 'announcements.update', 'announcements.delete'])) {
            return;
        }
        
        if (empty($_FILES['attachment'])) {
            $this->send_error('No file uploaded', 400);
            return;
        }
        
        $file = $_FILES['attachment'];
        
        // Validate file
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $this->send_error('File upload error', 400);
            return;
        }
        
        // Check file size (max 10MB)
        $max_size = 10 * 1024 * 1024; // 10MB in bytes
        if ($file['size'] > $max_size) {
            $this->send_error('File size exceeds 10MB limit', 400);
            return;
        }
        
        // Allowed file types
        $allowed_types = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain'
        ];
        
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!in_array($mime_type, $allowed_types)) {
            $this->send_error('File type not allowed', 400);
            return;
        }
        
        // Generate unique filename
        $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $unique_name = uniqid('announcement_') . '.' . $file_extension;
        $upload_path = FCPATH . 'uploads/announcements/';
        $file_path = $upload_path . $unique_name;
        
        // Create upload directory if it doesn't exist
        if (!is_dir($upload_path)) {
            mkdir($upload_path, 0777, true);
        }
        
        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $file_path)) {
            $this->send_response([
                'filename' => $file['name'],
                'filepath' => 'uploads/announcements/' . $unique_name,
                'size' => $file['size'],
                'mime_type' => $mime_type
            ], 'File uploaded successfully');
        } else {
            $this->send_error('Failed to upload file', 500);
        }
    }
    
    // Delete announcement attachment
    public function delete_announcement_attachment() {
        if ($this->input->method() !== 'delete') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['announcements', 'announcements.view', 'announcements.create', 'announcements.update', 'announcements.delete'])) {
            return;
        }
        
        $input = json_decode($this->input->raw_input_stream, true);
        $filepath = $input['filepath'] ?? '';
        
        if (!$filepath) {
            $this->send_error('File path required', 400);
            return;
        }
        
        $full_path = FCPATH . $filepath;
        
        if (file_exists($full_path)) {
            if (unlink($full_path)) {
                $this->send_response(null, 'File deleted successfully');
            } else {
                $this->send_error('Failed to delete file', 500);
            }
        } else {
            $this->send_response(null, 'File not found (may already be deleted)');
        }
    }
    
    // Download announcement attachment
    public function download_announcement_attachment($filename) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_any_permission(['announcements', 'announcements.view', 'announcements.create', 'announcements.update', 'announcements.delete'])) {
            return;
        }
        
        $file_path = FCPATH . 'uploads/announcements/' . $filename;
        
        if (!file_exists($file_path)) {
            $this->send_error('File not found', 404);
            return;
        }
        
        // Get original filename from database
        $this->db->select('attachment_filename, attachment_mime_type');
        $this->db->where('attachment_filepath', 'uploads/announcements/' . $filename);
        $attachment_info = $this->db->get('announcements')->row_array();
        
        $original_name = $attachment_info['attachment_filename'] ?? $filename;
        $mime_type = $attachment_info['attachment_mime_type'] ?? 'application/octet-stream';
        
        // Set headers for file download
        header('Content-Type: ' . $mime_type);
        header('Content-Disposition: attachment; filename="' . $original_name . '"');
        header('Content-Length: ' . filesize($file_path));
        header('Cache-Control: no-cache');
        
        // Output file
        readfile($file_path);
        exit;
    }
    
    // Public download for announcement attachments (no authentication required)
    public function public_download_attachment($filename) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        // Security: Only allow files from announcements directory
        if (strpos($filename, '/') !== false || strpos($filename, '..') !== false) {
            $this->send_error('Invalid filename', 400);
            return;
        }
        
        $file_path = FCPATH . 'uploads/announcements/' . $filename;
        
        if (!file_exists($file_path)) {
            $this->send_error('File not found', 404);
            return;
        }
        
        // Verify file is associated with an announcement for security
        $this->db->select('attachment_filename, attachment_mime_type');
        $this->db->where('attachment_filepath', 'uploads/announcements/' . $filename);
        $this->db->where('attachment_filename IS NOT NULL');
        $attachment_info = $this->db->get('announcements')->row_array();
        
        if (!$attachment_info) {
            $this->send_error('File not found or not associated with any announcement', 404);
            return;
        }
        
        $original_name = $attachment_info['attachment_filename'];
        $mime_type = $attachment_info['attachment_mime_type'];
        
        // Set headers for file download
        header('Content-Type: ' . $mime_type);
        header('Content-Disposition: attachment; filename="' . $original_name . '"');
        header('Content-Length: ' . filesize($file_path));
        header('Cache-Control: public, max-age=3600'); // Cache for 1 hour
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET');
        header('Access-Control-Allow-Headers: Content-Type');
        
        // Output file
        readfile($file_path);
        exit;
    }
    // Complaints Management
    public function complaints($id = null) {
        if (!$this->require_permission('complaints')) {
            return;
        }
        
        $method = $this->input->method();
        
        switch ($method) {
            case 'get':
                if ($id) {
                    $complaint = $this->Complaint_model->get_complaint_by_id($id);
                    if (!$complaint) {
                        $this->send_error('Complaint not found', 404);
                        return;
                    }
                    
                    // Get complaint comments
                    $complaint['comments'] = $this->Complaint_model->get_complaint_comments($id, true);
                    
                    $this->send_response($complaint);
                } else {
                    $limit = $this->input->get('limit') ?: 10;
                    $offset = $this->input->get('offset') ?: 0;
                    $filters = [
                        'status' => $this->input->get('status'),
                        'category' => $this->input->get('category'),
                        'priority' => $this->input->get('priority'),
                        'assigned_to_staff_id' => $this->input->get('assigned_to'),
                        'start_date' => $this->input->get('start_date'),
                        'end_date' => $this->input->get('end_date'),
                        'search' => $this->input->get('search')
                    ];
                    
                    $complaints = $this->Complaint_model->get_complaints_paginated($limit, $offset, $filters);
                    $total = $this->Complaint_model->count_complaints($filters);
                    
                    $this->send_response([
                        'data' => $complaints,
                        'total' => $total,
                        'limit' => $limit,
                        'offset' => $offset,
                        'has_next' => ($offset + $limit) < $total,
                        'has_prev' => $offset > 0
                    ]);
                }
                break;
                
            case 'post':
                $input = $this->validate_input([
                    'parent_id' => 'required|integer',
                    'student_id' => 'integer',
                    'subject' => 'required|max_length[200]',
                    'description' => 'required',
                    'category' => 'required|in_list[academic,transport,facility,staff,fee,other]',
                    'priority' => 'in_list[low,medium,high,urgent]',
                    'is_anonymous' => 'integer'
                ]);
                
                if (!$input) return;
                
                // Set defaults
                $input['priority'] = $input['priority'] ?: 'medium';
                $input['is_anonymous'] = $input['is_anonymous'] ? 1 : 0; // Convert boolean to integer
                $input['attachments'] = []; // TODO: Handle file uploads
                
                // Handle empty student_id
                if (empty($input['student_id'])) {
                    $input['student_id'] = null;
                }
                
                try {
                    $complaint_id = $this->Complaint_model->create_complaint($input);
                    if ($complaint_id) {
                        $this->log_activity('complaint_created', 'complaints', $complaint_id, null, $input);
                        $this->send_response(['id' => $complaint_id], 'Complaint created successfully', 201);
                    } else {
                        // Get database error if any
                        $db_error = $this->db->error();
                        if (!empty($db_error['message'])) {
                            $this->send_error('Database error: ' . $db_error['message'], 500);
                        } else {
                            $this->send_error('Failed to create complaint', 500);
                        }
                    }
                } catch (Exception $e) {
                    $this->send_error('Error: ' . $e->getMessage(), 500);
                }
                break;
                
            case 'put':
                if (!$id) {
                    $this->send_error('Complaint ID required', 400);
                    return;
                }
                
                $input = $this->validate_input([
                    'subject' => 'required|max_length[200]',
                    'description' => 'required',
                    'category' => 'required|in_list[academic,transport,facility,staff,fee,other]',
                    'priority' => 'in_list[low,medium,high,urgent]',
                    'status' => 'in_list[new,in_progress,resolved,closed]'
                ]);
                
                if (!$input) return;
                
                $old_complaint = $this->Complaint_model->get_complaint_by_id($id);
                if (!$old_complaint) {
                    $this->send_error('Complaint not found', 404);
                    return;
                }
                
                // Only allow certain status transitions
                if (isset($input['status'])) {
                    $valid_transitions = [
                        'new' => ['in_progress', 'resolved'],
                        'in_progress' => ['resolved', 'closed'],
                        'resolved' => ['closed'],
                        'closed' => [] // Cannot transition from closed
                    ];
                    
                    $current_status = $old_complaint['status'];
                    if (!in_array($input['status'], $valid_transitions[$current_status])) {
                        $this->send_error('Invalid status transition', 400);
                        return;
                    }
                }
                
                if ($this->Complaint_model->update_complaint($id, $input)) {
                    $this->log_activity('complaint_updated', 'complaints', $id, $old_complaint, $input);
                    $this->send_response(null, 'Complaint updated successfully');
                } else {
                    $this->send_error('Failed to update complaint', 500);
                }
                break;
                
            default:
                $this->send_error('Method not allowed', 405);
        }
    }
    
    // Assign complaint to staff
    public function assign_complaint($id) {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_permission('complaints')) {
            return;
        }
        
        if (!$id) {
            $this->send_error('Complaint ID required', 400);
            return;
        }
        
        $input = $this->validate_input([
            'staff_id' => 'required|integer'
        ]);
        
        if (!$input) return;
        
        // Check if complaint exists
        $complaint = $this->Complaint_model->get_complaint_by_id($id);
        if (!$complaint) {
            $this->send_error('Complaint not found', 404);
            return;
        }
        
        // Check if staff exists
        $this->db->where('id', $input['staff_id']);
        $this->db->where('is_active', 1);
        $staff = $this->db->get('staff')->row_array();
        if (!$staff) {
            $this->send_error('Staff member not found', 404);
            return;
        }
        
        if ($this->Complaint_model->assign_complaint($id, $input['staff_id'], $this->user['id'])) {
            $this->log_activity('complaint_assigned', 'complaints', $id, null, [
                'assigned_to' => $input['staff_id'],
                'assigned_by' => $this->user['id']
            ]);
            $this->send_response(null, 'Complaint assigned successfully');
        } else {
            $this->send_error('Failed to assign complaint', 500);
        }
    }
    
    // Resolve complaint
    public function resolve_complaint($id) {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_permission('complaints')) {
            return;
        }
        
        if (!$id) {
            $this->send_error('Complaint ID required', 400);
            return;
        }
        
        $input = $this->validate_input([
            'resolution' => 'required'
        ]);
        
        if (!$input) return;
        
        $complaint = $this->Complaint_model->get_complaint_by_id($id);
        if (!$complaint) {
            $this->send_error('Complaint not found', 404);
            return;
        }
        
        if (!in_array($complaint['status'], ['new', 'in_progress'])) {
            $this->send_error('Complaint cannot be resolved from current status', 400);
            return;
        }
        
        if ($this->Complaint_model->resolve_complaint($id, $input['resolution'], $this->user['id'])) {
            $this->log_activity('complaint_resolved', 'complaints', $id, null, [
                'resolution' => $input['resolution'],
                'resolved_by' => $this->user['id']
            ]);
            $this->send_response(null, 'Complaint resolved successfully');
        } else {
            $this->send_error('Failed to resolve complaint', 500);
        }
    }
    
    // Close complaint
    public function close_complaint($id) {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_permission('complaints')) {
            return;
        }
        
        if (!$id) {
            $this->send_error('Complaint ID required', 400);
            return;
        }
        
        $complaint = $this->Complaint_model->get_complaint_by_id($id);
        if (!$complaint) {
            $this->send_error('Complaint not found', 404);
            return;
        }
        
        if (!in_array($complaint['status'], ['resolved'])) {
            $this->send_error('Only resolved complaints can be closed', 400);
            return;
        }
        
        if ($this->Complaint_model->close_complaint($id, $this->user['id'])) {
            $this->log_activity('complaint_closed', 'complaints', $id, null, [
                'closed_by' => $this->user['id']
            ]);
            $this->send_response(null, 'Complaint closed successfully');
        } else {
            $this->send_error('Failed to close complaint', 500);
        }
    }
    
    // Add comment to complaint
    public function complaint_comments($complaint_id) {
        if (!$this->require_permission('complaints')) {
            return;
        }
        
        $method = $this->input->method();
        
        switch ($method) {
            case 'get':
                $include_internal = $this->input->get('include_internal') === '1';
                $comments = $this->Complaint_model->get_complaint_comments($complaint_id, $include_internal);
                $this->send_response(['data' => $comments]);
                break;
                
            case 'post':
                $input = $this->validate_input([
                    'comment' => 'required',
                    'is_internal' => 'integer'
                ]);
                
                if (!$input) return;
                
                // Check if complaint exists
                $complaint = $this->Complaint_model->get_complaint_by_id($complaint_id);
                if (!$complaint) {
                    $this->send_error('Complaint not found', 404);
                    return;
                }
                
                $comment_data = [
                    'commented_by_type' => $this->user['role'] === 'admin' ? 'admin' : 'staff',
                    'commented_by_id' => $this->user['id'],
                    'comment' => $input['comment'],
                    'is_internal' => $input['is_internal'] ?: 0,
                    'attachments' => [] // TODO: Handle file uploads
                ];
                
                if ($this->Complaint_model->add_comment($complaint_id, $comment_data)) {
                    $this->log_activity('complaint_comment_added', 'complaint_comments', null, null, $comment_data);
                    $this->send_response(null, 'Comment added successfully', 201);
                } else {
                    $this->send_error('Failed to add comment', 500);
                }
                break;
                
            default:
                $this->send_error('Method not allowed', 405);
        }
    }
    
    // Get complaints statistics
    public function complaints_statistics() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_permission('complaints')) {
            return;
        }
        
        $statistics = $this->Complaint_model->get_complaints_statistics();
        $this->send_response($statistics);
    }
    
    // Reports Management
    public function reports($report_type = null) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_permission('reports')) {
            return;
        }
        
        if (!$report_type) {
            $this->send_error('Report type is required', 400);
            return;
        }
        
        $filters = [
            'academic_year_id' => $this->input->get('academic_year_id'),
            'grade_id' => $this->input->get('grade_id'),
            'division_id' => $this->input->get('division_id'),
            'category_id' => $this->input->get('category_id'),
            'staff_id' => $this->input->get('staff_id'),
            'start_date' => $this->input->get('start_date'),
            'end_date' => $this->input->get('end_date'),
            'status' => $this->input->get('status'),
            'priority' => $this->input->get('priority'),
            'assigned_to' => $this->input->get('assigned_to'),
            'target_type' => $this->input->get('target_type'),
            'overdue_only' => $this->input->get('overdue_only')
        ];
        
        // Remove null values
        $filters = array_filter($filters, function($value) {
            return $value !== null && $value !== '';
        });
        
        $export_format = $this->input->get('export');
        
        try {
            switch ($report_type) {
                case 'fee_collection':
                    $data = $this->Report_model->get_fee_collection_report($filters);
                    $report_title = 'Fee Collection Report';
                    break;
                    
                case 'fee_dues':
                    $data = $this->Report_model->get_fee_dues_report($filters);
                    $report_title = 'Fee Dues Report';
                    break;
                    
                case 'staff_collection':
                    $data = $this->Report_model->get_staff_collection_report($filters);
                    $report_title = 'Staff Collection Report';
                    break;
                    
                case 'complaints':
                    $data = $this->Report_model->get_complaint_report($filters);
                    $report_title = 'Complaints Report';
                    break;
                    
                default:
                    $this->send_error('Invalid report type', 400);
                    return;
            }
            
            if (($export_format === 'csv' || $export_format === 'excel') && is_array($data) && !empty($data)) {
                // Handle CSV and Excel export
                if ($export_format === 'excel') {
                    $filename = strtolower(str_replace(' ', '_', $report_title)) . '_' . date('Y-m-d_H-i-s') . '.xlsx';
                    
                    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    header('Content-Disposition: attachment; filename="' . $filename . '"');
                    header('Cache-Control: max-age=0');
                    
                    echo $this->Report_model->format_report_for_export($data, 'excel');
                } else {
                    $filename = strtolower(str_replace(' ', '_', $report_title)) . '_' . date('Y-m-d_H-i-s') . '.csv';
                    
                    header('Content-Type: text/csv');
                    header('Content-Disposition: attachment; filename="' . $filename . '"');
                    
                    echo $this->Report_model->format_report_for_export($data, 'csv');
                }
                return;
            }
            
            // Log report generation
            $this->log_activity('report_generated', 'reports', null, null, [
                'report_type' => $report_type,
                'filters' => $filters,
                'generated_by' => $this->user['id']
            ]);
            
            $this->send_response([
                'report_type' => $report_type,
                'title' => $report_title,
                'data' => $data,
                'filters_applied' => $filters,
                'generated_at' => date('Y-m-d H:i:s'),
                'generated_by' => $this->user['name']
            ]);
            
        } catch (Exception $e) {
            $this->send_error('Failed to generate report: ' . $e->getMessage(), 500);
        }
    }
    
    // Global Search
    public function global_search() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_permission('search')) {
            return;
        }
        
        $query = $this->input->get('q');
        if (!$query || strlen(trim($query)) < 2) {
            $this->send_error('Search query must be at least 2 characters long', 400);
            return;
        }
        
        $types = $this->input->get('types');
        if ($types) {
            $types = explode(',', $types);
        } else {
            $types = ['students', 'parents', 'staff', 'complaints'];
        }
        
        $limit = min($this->input->get('limit') ?: 10, 50); // Max 50 results per type
        
        try {
            $results = $this->Report_model->global_search(trim($query), $types, $limit);
            
            // Count total results
            $total_results = 0;
            foreach ($results as $type => $items) {
                $total_results += count($items);
            }
            
            // Log search activity
            $this->log_activity('global_search', 'search', null, null, [
                'query' => $query,
                'types' => $types,
                'total_results' => $total_results,
                'searched_by' => $this->user['id']
            ]);
            
            $this->send_response([
                'query' => $query,
                'results' => $results,
                'total_results' => $total_results,
                'searched_at' => date('Y-m-d H:i:s')
            ]);
            
        } catch (Exception $e) {
            // Log the full error for debugging
            error_log('Global Search Error: ' . $e->getMessage());
            error_log('Database Error: ' . $this->db->last_query());
            error_log('Database Error Details: ' . $this->db->error()['message']);
            $this->send_error('Search failed: ' . $e->getMessage() . ' | DB: ' . $this->db->error()['message'], 500);
        }
    }
    
    // Quick Search (for autocomplete/suggestions)
    public function quick_search() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_permission('search')) {
            return;
        }
        
        $query = $this->input->get('q');
        $type = $this->input->get('type', 'students'); // Default to students
        
        if (!$query || strlen(trim($query)) < 2) {
            $this->send_response(['results' => []]);
            return;
        }
        
        $limit = 10; // Quick search limit
        
        try {
            $results = $this->Report_model->global_search(trim($query), [$type], $limit);
            
            $this->send_response([
                'query' => $query,
                'type' => $type,
                'results' => $results[$type] ?? []
            ]);
            
        } catch (Exception $e) {
            $this->send_error('Quick search failed: ' . $e->getMessage(), 500);
        }
    }
    
    // Get available report types
    public function report_types() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_permission('reports')) {
            return;
        }
        
        $report_types = [
            [
                'id' => 'fee_collection',
                'name' => 'Fee Collection Report',
                'description' => 'Fee collection details by date and category',
                'category' => 'fees',
                'filters' => ['start_date', 'end_date', 'category_id', 'staff_id']
            ],
            [
                'id' => 'fee_dues',
                'name' => 'Fee Dues Report',
                'description' => 'Outstanding fees and overdue payments',
                'category' => 'fees',
                'filters' => ['academic_year_id', 'grade_id', 'category_id', 'status', 'overdue_only']
            ],
            [
                'id' => 'staff_collection',
                'name' => 'Staff Collection Report',
                'description' => 'Fee collection performance by staff members',
                'category' => 'fees',
                'filters' => ['start_date', 'end_date', 'staff_id']
            ],
            [
                'id' => 'complaints',
                'name' => 'Complaints Report',
                'description' => 'Complaint tracking and resolution statistics',
                'category' => 'communication',
                'filters' => ['start_date', 'end_date', 'status', 'category', 'priority', 'assigned_to']
            ]
        ];
        
        $this->send_response(['report_types' => $report_types]);
    }
    
    // Role Management
    public function roles($id = null) {
        if (!$this->require_permission('roles')) {
            return;
        }
        
        switch ($this->input->method()) {
            case 'get':
                if ($id) {
                    $role = $this->Role_model->get_role_by_id($id);
                    if (!$role) {
                        $this->send_error('Role not found', 404);
                        return;
                    }
                    $this->send_response($role);
                } else {
                    // Check if pagination is requested
                    $limit = $this->input->get('limit');
                    $offset = $this->input->get('offset');
                    
                    if ($limit !== null && $offset !== null) {
                        // Paginated response
                        $search = $this->input->get('search');
                        $roles = $this->Role_model->get_roles_paginated($limit, $offset, $search);
                        $total = $this->Role_model->count_roles($search);
                        
                        $this->send_response([
                            'data' => $roles,
                            'total' => $total,
                            'limit' => (int)$limit,
                            'offset' => (int)$offset,
                            'has_next' => ((int)$offset + (int)$limit) < $total,
                            'has_prev' => (int)$offset > 0
                        ]);
                    } else {
                        // Non-paginated response (for dropdown, etc.)
                        $roles = $this->Role_model->get_all_roles();
                        $this->send_response($roles);
                    }
                }
                break;
                
            case 'post':
                $input = $this->validate_input([
                    'name' => 'required|max_length[50]',
                    'description' => 'required|max_length[500]',
                    'permissions' => 'array'
                ]);
                
                if (!$input) return;
                
                // Check if role name already exists
                if ($this->Role_model->role_exists($input['name'])) {
                    $this->send_error('Role name already exists', 400);
                    return;
                }
                
                $role_id = $this->Role_model->create_role($input);
                if ($role_id) {
                    $this->log_activity('role_created', 'roles', $role_id, null, $input);
                    $this->send_response(['id' => $role_id], 'Role created successfully', 201);
                } else {
                    $this->send_error('Failed to create role', 500);
                }
                break;
                
            case 'put':
                if (!$id) {
                    $this->send_error('Role ID required', 400);
                    return;
                }
                
                // Prevent editing super_admin role
                if ($id == 1) {
                    $this->send_error('Cannot edit super admin role', 403);
                    return;
                }
                
                $input = $this->validate_input([
                    'name' => 'required|max_length[50]',
                    'description' => 'required|max_length[500]',
                    'permissions' => 'array'
                ]);
                
                if (!$input) return;
                
                $old_role = $this->Role_model->get_role_by_id($id);
                if (!$old_role) {
                    $this->send_error('Role not found', 404);
                    return;
                }
                
                // Check if role name already exists (excluding current)
                if ($this->Role_model->role_exists($input['name'], $id)) {
                    $this->send_error('Role name already exists', 400);
                    return;
                }
                
                if ($this->Role_model->update_role($id, $input)) {
                    $this->log_activity('role_updated', 'roles', $id, $old_role, $input);
                    $this->send_response(null, 'Role updated successfully');
                } else {
                    $this->send_error('Failed to update role', 500);
                }
                break;
                
            case 'delete':
                if (!$id) {
                    $this->send_error('Role ID required', 400);
                    return;
                }
                
                // Prevent deleting system roles
                if (in_array($id, [1, 2, 3, 4])) {
                    $this->send_error('Cannot delete system roles', 403);
                    return;
                }
                
                $role = $this->Role_model->get_role_by_id($id);
                if (!$role) {
                    $this->send_error('Role not found', 404);
                    return;
                }
                
                if ($role['user_count'] > 0) {
                    $this->send_error('Cannot delete role with assigned users', 400);
                    return;
                }
                
                if ($this->Role_model->delete_role($id)) {
                    $this->log_activity('role_deleted', 'roles', $id, $role, null);
                    $this->send_response(null, 'Role deleted successfully');
                } else {
                    $this->send_error('Failed to delete role', 500);
                }
                break;
                
            default:
                $this->send_error('Method not allowed', 405);
        }
    }
    
    // Get all available permissions
    public function permissions() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_permission('roles')) {
            return;
        }
        
        $permissions = $this->Role_model->get_all_permissions();
        $groups = $this->Role_model->get_permission_groups();
        
        $this->send_response([
            'permissions' => $permissions,
            'groups' => $groups
        ]);
    }
    
    // Duplicate a role
    public function duplicate_role($id) {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$this->require_permission('roles')) {
            return;
        }
        
        $input = $this->validate_input([
            'name' => 'required|max_length[50]'
        ]);
        
        if (!$input) return;
        
        // Check if new name already exists
        if ($this->Role_model->role_exists($input['name'])) {
            $this->send_error('Role name already exists', 400);
            return;
        }
        
        $new_role_id = $this->Role_model->duplicate_role($id, $input['name']);
        if ($new_role_id) {
            $this->log_activity('role_duplicated', 'roles', $new_role_id, null, ['source_role_id' => $id]);
            $this->send_response(['id' => $new_role_id], 'Role duplicated successfully', 201);
        } else {
            $this->send_error('Failed to duplicate role', 500);
        }
    }
    /**
     * Upload item photo for fee structures
     */
    private function upload_item_photo($file) {
        // Validate file type
        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!in_array($file['type'], $allowed_types)) {
            return ['success' => false, 'error' => 'Only JPG, PNG, and GIF files are allowed'];
        }

        // Validate file size (5MB max)
        $max_size = 5 * 1024 * 1024; // 5MB
        if ($file['size'] > $max_size) {
            return ['success' => false, 'error' => 'File size must not exceed 5MB'];
        }

        // Create upload directory if it doesn't exist
        $upload_dir = FCPATH . 'uploads/fee_items/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }

        // Generate unique filename
        $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'item_' . time() . '_' . uniqid() . '.' . $file_extension;
        $file_path = $upload_dir . $filename;
        $relative_path = 'uploads/fee_items/' . $filename;

        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $file_path)) {
            return ['success' => true, 'file_path' => $relative_path];
        } else {
            return ['success' => false, 'error' => 'Failed to move uploaded file'];
        }
    }

    // ==================== VISION STATEMENT MANAGEMENT ====================

    public function vision_statements($id = null) {
        $method = strtolower($this->input->method());

        switch ($method) {
            case 'get':
                if (!$this->require_any_permission(['vision_statements', 'vision_statements.view', '*'])) {
                    return;
                }

                try {
                    if ($id) {
                        $vision = $this->Vision_statement_model->get_vision_statement_by_id($id);
                        if (!$vision) {
                            $this->send_error('Vision statement not found', 404);
                            return;
                        }

                        $this->send_response($vision);
                        return;
                    }

                    $limit = (int) $this->input->get('limit');
                    $offset = (int) $this->input->get('offset');

                    if ($limit <= 0) {
                        $limit = 10;
                    }

                    if ($offset < 0) {
                        $offset = 0;
                    }

                    $filters = [];
                    $grade_id = $this->input->get('grade_id');
                    $staff_id = $this->input->get('staff_id');
                    $search = $this->input->get('search');

                    if ($grade_id !== null && $grade_id !== '') {
                        $filters['grade_id'] = (int) $grade_id;
                    }

                    if ($staff_id !== null && $staff_id !== '') {
                        $filters['staff_id'] = (int) $staff_id;
                    }

                    if ($search !== null && $search !== '') {
                        $filters['search'] = $search;
                    }

                    $visions = $this->Vision_statement_model->get_vision_statements_paginated($limit, $offset, $filters);
                    $total = $this->Vision_statement_model->count_vision_statements($filters);

                    $this->send_response([
                        'data' => $visions,
                        'total' => $total,
                        'limit' => $limit,
                        'offset' => $offset,
                        'has_next' => ($offset + $limit) < $total,
                        'has_prev' => $offset > 0
                    ]);
                } catch (Exception $e) {
                    log_message('error', 'Get vision statements error: ' . $e->getMessage());
                    $this->send_error('Failed to retrieve vision statements', 500);
                }
                return;

            case 'post':
                if (!$this->require_any_permission(['vision_statements', 'vision_statements.create', '*'])) {
                    return;
                }

                try {
                    $input = $this->get_input();

                    $this->load->library('form_validation');
                    $this->form_validation->set_data($input);
                    $this->form_validation->set_rules('staff_id', 'Staff Member', 'required|integer');
                    $this->form_validation->set_rules('grade_id', 'Grade', 'integer');
                    $this->form_validation->set_rules('vision', 'Vision Statement', 'required|max_length[5000]');

                    if (!$this->form_validation->run()) {
                        $this->send_error('Validation failed', 400, $this->form_validation->error_array());
                        return;
                    }

                    $staff_id = (int) $input['staff_id'];
                    $grade_id = isset($input['grade_id']) && $input['grade_id'] !== '' ? (int) $input['grade_id'] : 0;
                    $vision_text = trim($input['vision']);

                    $staff = $this->Staff_model->get_staff_by_id($staff_id);
                    if (!$staff) {
                        $this->send_error('Staff member not found', 404);
                        return;
                    }

                    if ($grade_id > 0) {
                        $grade = $this->Grade_model->get_grade_by_id($grade_id);
                        if (!$grade) {
                            $this->send_error('Grade not found', 404);
                            return;
                        }
                    }

                    $payload = [
                        'staff_id' => $staff_id,
                        'grade_id' => $grade_id,
                        'vision' => $vision_text
                    ];

                    $vision_id = $this->Vision_statement_model->create_vision_statement($payload);

                    if ($vision_id) {
                        $vision = $this->Vision_statement_model->get_vision_statement_by_id($vision_id);
                        $this->log_activity('vision_statement_created', 'vision_statements', $vision_id, null, $payload);
                        $this->send_response($vision, 'Vision statement created successfully', 201);
                    } else {
                        $this->send_error('Failed to create vision statement', 500);
                    }
                } catch (Exception $e) {
                    log_message('error', 'Create vision statement error: ' . $e->getMessage());
                    $this->send_error('Failed to create vision statement', 500);
                }
                return;

            case 'put':
                if (!$this->require_any_permission(['vision_statements', 'vision_statements.update', '*'])) {
                    return;
                }

                if (!$id) {
                    $this->send_error('Vision statement ID required', 400);
                    return;
                }

                try {
                    $existing = $this->Vision_statement_model->get_vision_statement_by_id($id);
                    if (!$existing) {
                        $this->send_error('Vision statement not found', 404);
                        return;
                    }

                    $input = $this->get_input();

                    if (empty($input)) {
                        $this->send_error('No data provided for update', 400);
                        return;
                    }

                    $this->load->library('form_validation');
                    $this->form_validation->set_data($input);
                    $this->form_validation->set_rules('staff_id', 'Staff Member', 'integer');
                    $this->form_validation->set_rules('grade_id', 'Grade', 'integer');
                    $this->form_validation->set_rules('vision', 'Vision Statement', 'max_length[5000]');

                    if (!$this->form_validation->run()) {
                        $this->send_error('Validation failed', 400, $this->form_validation->error_array());
                        return;
                    }

                    $update_data = [];

                    if (array_key_exists('staff_id', $input)) {
                        $staff_id = $input['staff_id'] !== '' ? (int) $input['staff_id'] : null;
                        if ($staff_id === null) {
                            $this->send_error('Staff member is required', 400);
                            return;
                        }

                        $staff = $this->Staff_model->get_staff_by_id($staff_id);
                        if (!$staff) {
                            $this->send_error('Staff member not found', 404);
                            return;
                        }

                        $update_data['staff_id'] = $staff_id;
                    }

                    if (array_key_exists('grade_id', $input)) {
                        $grade_id = $input['grade_id'] !== '' ? (int) $input['grade_id'] : 0;
                        if ($grade_id > 0) {
                            $grade = $this->Grade_model->get_grade_by_id($grade_id);
                            if (!$grade) {
                                $this->send_error('Grade not found', 404);
                                return;
                            }
                        }

                        $update_data['grade_id'] = $grade_id;
                    }

                    if (array_key_exists('vision', $input)) {
                        $update_data['vision'] = trim($input['vision']);
                    }

                    if (empty($update_data)) {
                        $this->send_error('No changes detected', 400);
                        return;
                    }

                    if ($this->Vision_statement_model->update_vision_statement($id, $update_data)) {
                        $updated = $this->Vision_statement_model->get_vision_statement_by_id($id);
                        $this->log_activity('vision_statement_updated', 'vision_statements', $id, $existing, $update_data);
                        $this->send_response($updated, 'Vision statement updated successfully');
                    } else {
                        $this->send_error('Failed to update vision statement', 500);
                    }
                } catch (Exception $e) {
                    log_message('error', 'Update vision statement error: ' . $e->getMessage());
                    $this->send_error('Failed to update vision statement', 500);
                }
                return;

            case 'delete':
                if (!$this->require_any_permission(['vision_statements', 'vision_statements.delete', '*'])) {
                    return;
                }

                if (!$id) {
                    $this->send_error('Vision statement ID required', 400);
                    return;
                }

                try {
                    $existing = $this->Vision_statement_model->get_vision_statement_by_id($id);
                    if (!$existing) {
                        $this->send_error('Vision statement not found', 404);
                        return;
                    }

                    if ($this->Vision_statement_model->delete_vision_statement($id)) {
                        $this->log_activity('vision_statement_deleted', 'vision_statements', $id, $existing, null);
                        $this->send_response(null, 'Vision statement deleted successfully');
                    } else {
                        $this->send_error('Failed to delete vision statement', 500);
                    }
                } catch (Exception $e) {
                    log_message('error', 'Delete vision statement error: ' . $e->getMessage());
                    $this->send_error('Failed to delete vision statement', 500);
                }
                return;

            default:
                $this->send_error('Method not allowed', 405);
        }
    }

    // ==================== STAFF WALLET MANAGEMENT METHODS ====================
    
    /**
     * Get all staff wallets
     */
    public function staff_wallets() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            $search = $this->input->get('search');
            $limit = (int) $this->input->get('limit', 50);
            $offset = (int) $this->input->get('offset', 0);

            $wallets = $this->Staff_wallet_model->get_all_wallets($limit, $offset, $search);
            $total = $this->Staff_wallet_model->count_wallets($search);

            $this->send_response([
                'data' => $wallets,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ]);
        } catch (Exception $e) {
            log_message('error', 'Staff wallets error: ' . $e->getMessage());
            $this->send_error('Failed to fetch staff wallets', 500);
        }
    }

    /**
     * Get wallet statistics
     */
    public function wallet_statistics() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            $statistics = $this->Staff_wallet_model->get_wallet_statistics();
            $this->send_response($statistics);
        } catch (Exception $e) {
            log_message('error', 'Wallet statistics error: ' . $e->getMessage());
            $this->send_error('Failed to fetch wallet statistics', 500);
        }
    }

    /**
     * Get staff ledger
     */
    public function staff_ledger($staff_id) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        if (!$staff_id || !is_numeric($staff_id)) {
            $this->send_error('Invalid staff ID', 400);
            return;
        }

        try {
            $limit = (int) ($this->input->get('limit') ?: 50);
            $offset = (int) ($this->input->get('offset') ?: 0);
            $start_date = $this->input->get('start_date');
            $end_date = $this->input->get('end_date');

            $ledger = $this->Staff_wallet_model->get_ledger($staff_id, $limit, $offset, $start_date, $end_date);
            $total = $this->Staff_wallet_model->count_ledger($staff_id, $start_date, $end_date);

            $this->send_response([
                'data' => $ledger,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ]);
        } catch (Exception $e) {
            log_message('error', 'Staff ledger error: ' . $e->getMessage());
            $this->send_error('Failed to fetch staff ledger', 500);
        }
    }

    /**
     * Process withdrawal from staff wallet
     */
    public function process_withdrawal($staff_id) {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        if (!$staff_id || !is_numeric($staff_id)) {
            $this->send_error('Invalid staff ID', 400);
            return;
        }

        $input = json_decode($this->input->raw_input_stream, true);
        if (!$input) {
            $this->send_error('Invalid JSON input', 400);
            return;
        }

        // Validation
        if (empty($input['amount']) || !is_numeric($input['amount']) || $input['amount'] <= 0) {
            $this->send_error('Valid amount is required', 400);
            return;
        }

        try {
            $admin_id = $this->user_data['id'];
            $amount = (float) $input['amount'];
            $description = $input['description'] ?? null;
            $payment_mode = $input['payment_mode'] ?? 'cash';

            $result = $this->Staff_wallet_model->process_withdrawal(
                $staff_id, 
                $amount, 
                $admin_id, 
                $description, 
                $payment_mode
            );

            if ($result['success']) {
                $this->send_response([
                    'message' => 'Withdrawal processed successfully',
                    'ledger_id' => $result['ledger_id']
                ]);
            } else {
                $this->send_error($result['message'], 400);
            }
        } catch (Exception $e) {
            log_message('error', 'Process withdrawal error: ' . $e->getMessage());
            $this->send_error('Failed to process withdrawal', 500);
        }
    }

    /**
     * Clear staff wallet balance
     */
    public function clear_wallet_balance($staff_id) {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        if (!$staff_id || !is_numeric($staff_id)) {
            $this->send_error('Invalid staff ID', 400);
            return;
        }

        try {
            $admin_id = $this->user_data['id'];
            $input = json_decode($this->input->raw_input_stream, true);
            $description = $input['description'] ?? 'Balance cleared by admin';

            $result = $this->Staff_wallet_model->clear_balance($staff_id, $admin_id, $description);

            if ($result['success']) {
                $this->send_response([
                    'message' => 'Balance cleared successfully',
                    'ledger_id' => $result['ledger_id']
                ]);
            } else {
                $this->send_error($result['message'], 400);
            }
        } catch (Exception $e) {
            log_message('error', 'Clear wallet balance error: ' . $e->getMessage());
            $this->send_error('Failed to clear wallet balance', 500);
        }
    }
    
    // Profile Management
    public function profile() {
        switch ($this->input->method()) {
            case 'get':
                try {
                    $user_id = $this->user['id'];
                    $user_type = $this->user['user_type'];
                    
                    // Get user profile based on user type
                    if ($user_type === 'admin' || $user_type === 'staff') {
                        $this->db->select('id, name, email, phone, address, emergency_contact, bio, created_at, last_login');
                        $this->db->from('staff');
                        $this->db->where('id', $user_id);
                        $profile = $this->db->get()->row_array();
                    } else {
                        $this->send_error('Invalid user type', 400);
                        return;
                    }
                    
                    if (!$profile) {
                        $this->send_error('Profile not found', 404);
                        return;
                    }
                    
                    $profile['user_type'] = $user_type;
                    $this->send_response($profile);
                    
                } catch (Exception $e) {
                    $this->send_error('Failed to fetch profile: ' . $e->getMessage(), 500);
                }
                break;
                
            case 'put':
                try {
                    $user_id = $this->user['id'];
                    $user_type = $this->user['user_type'];
                    
                    $input = json_decode($this->input->raw_input_stream, true);
                    
                    // Validate required fields
                    if (empty($input['name']) || empty($input['email'])) {
                        $this->send_error('Name and email are required', 400);
                        return;
                    }
                    
                    // Check if email is already taken by another user
                    $this->db->where('email', $input['email']);
                    $this->db->where('id !=', $user_id);
                    $existing = $this->db->get('staff')->row();
                    
                    if ($existing) {
                        $this->send_error('Email already exists', 400);
                        return;
                    }
                    
                    $update_data = [
                        'name' => $input['name'],
                        'email' => $input['email'],
                        'phone' => $input['phone'] ?? null,
                        'address' => $input['address'] ?? null,
                        'emergency_contact' => $input['emergency_contact'] ?? null,
                        'bio' => $input['bio'] ?? null,
                        'updated_at' => date('Y-m-d H:i:s')
                    ];
                    
                    $this->db->where('id', $user_id);
                    $this->db->update('staff', $update_data);
                    
                    if ($this->db->affected_rows() > 0) {
                        $this->send_response(['message' => 'Profile updated successfully', 'data' => $update_data]);
                    } else {
                        $this->send_error('No changes made to profile', 400);
                    }
                    
                } catch (Exception $e) {
                    $this->send_error('Failed to update profile: ' . $e->getMessage(), 500);
                }
                break;
                
            default:
                $this->send_error('Method not allowed', 405);
        }
    }
    
    // Change Password
    public function change_password() {
        if ($this->input->method() !== 'put') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $user_id = $this->user['id'];
            $input = json_decode($this->input->raw_input_stream, true);
            
            if (empty($input['current_password']) || empty($input['new_password'])) {
                $this->send_error('Current password and new password are required', 400);
                return;
            }
            
            // Get current password hash
            $this->db->select('password');
            $this->db->where('id', $user_id);
            $user_data = $this->db->get('staff')->row_array();
            
            if (!$user_data) {
                $this->send_error('User not found', 404);
                return;
            }
            
            // Verify current password
            if (!password_verify($input['current_password'], $user_data['password'])) {
                $this->send_error('Current password is incorrect', 400);
                return;
            }
            
            // Update password
            $new_password_hash = password_hash($input['new_password'], PASSWORD_DEFAULT);
            
            $this->db->where('id', $user_id);
            $this->db->update('staff', ['password' => $new_password_hash, 'updated_at' => date('Y-m-d H:i:s')]);
            
            $this->send_response(['message' => 'Password changed successfully']);
            
        } catch (Exception $e) {
            $this->send_error('Failed to change password: ' . $e->getMessage(), 500);
        }
    }
    
    // System Settings
    public function system_settings($category = null) {
        switch ($this->input->method()) {
            case 'get':
                try {
                    if ($category) {
                        // Get specific category settings - use LIKE to match category prefix
                        $this->db->like('setting_key', $category . '_', 'after');
                        $settings = $this->db->get('system_settings')->result_array();
                        
                        $formatted_settings = [];
                        foreach ($settings as $setting) {
                            // Remove category prefix from key (e.g., 'whatsapp_type' becomes 'type')
                            $key = str_replace($category . '_', '', $setting['setting_key']);
                            $formatted_settings[$key] = $setting['setting_value'];
                        }
                        
                        $this->send_response($formatted_settings);
                    } else {
                        // Get all settings grouped by category
                        $all_settings = $this->db->get('system_settings')->result_array();
                        
                        $grouped_settings = [];
                        foreach ($all_settings as $setting) {
                            // Extract category from setting_key (e.g., 'whatsapp_type' -> 'whatsapp')
                            $parts = explode('_', $setting['setting_key'], 2);
                            if (count($parts) >= 2) {
                                $category_name = $parts[0];
                                $key = $parts[1];
                                $grouped_settings[$category_name][$key] = $setting['setting_value'];
                            }
                        }
                        
                        $this->send_response($grouped_settings);
                    }
                    
                } catch (Exception $e) {
                    $this->send_error('Failed to fetch settings: ' . $e->getMessage(), 500);
                }
                break;
                
            case 'put':
                if (!$category) {
                    $this->send_error('Category is required for updating settings', 400);
                    return;
                }
                
                try {
                    $input = json_decode($this->input->raw_input_stream, true);
                    
                    foreach ($input as $key => $value) {
                        $setting_key = $category . '_' . $key;
                        
                        $existing = $this->db->get_where('system_settings', [
                            'setting_key' => $setting_key
                        ])->row();
                        
                        $data = [
                            'setting_key' => $setting_key,
                            'setting_value' => $value,
                            'setting_type' => is_bool($value) ? 'boolean' : (is_numeric($value) ? 'number' : 'string'),
                            'updated_by' => $this->user['id'],
                            'updated_at' => date('Y-m-d H:i:s')
                        ];
                        
                        if ($existing) {
                            $this->db->where('id', $existing->id);
                            $this->db->update('system_settings', $data);
                        } else {
                            $this->db->insert('system_settings', $data);
                        }
                    }
                    
                    $this->send_response(['message' => 'Settings updated successfully']);
                    
                } catch (Exception $e) {
                    $this->send_error('Failed to update settings: ' . $e->getMessage(), 500);
                }
                break;
                
            default:
                $this->send_error('Method not allowed', 405);
        }
    }
    
    // Test Email Configuration
    public function test_email() {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            // Load email library and send test email
            $this->load->library('email');
            
            $config = [
                'mailtype' => 'html',
                'charset' => 'utf-8'
            ];
            
            $this->email->initialize($config);
            $this->email->from('noreply@school.com', 'School Management System');
            $this->email->to($this->user['email']);
            $this->email->subject('Test Email from School Management System');
            $this->email->message('This is a test email to verify your email configuration is working correctly.');
            
            if ($this->email->send()) {
                $this->send_response(['message' => 'Test email sent successfully']);
            } else {
                $this->send_error('Failed to send test email: ' . $this->email->print_debugger(), 500);
            }
            
        } catch (Exception $e) {
            $this->send_error('Failed to send test email: ' . $e->getMessage(), 500);
        }
    }
    
    // Test WhatsApp Configuration
    public function test_whatsapp() {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            // Get input data
            $input = json_decode($this->input->raw_input_stream, true);
            $number = $input['number'] ?? null;
            $message = $input['message'] ?? 'This is a test message from your school management system. WhatsApp configuration is working correctly!';
            
            if (!$number) {
                $this->send_error('Phone number is required', 400);
                return;
            }
            
            // Get WhatsApp settings from database
            $this->db->like('setting_key', 'whatsapp_', 'after');
            $settings = $this->db->get('system_settings')->result_array();
            
            $whatsapp_config = [];
            foreach ($settings as $setting) {
                $key = str_replace('whatsapp_', '', $setting['setting_key']);
                $whatsapp_config[$key] = $setting['setting_value'];
            }
            
            // Check if WhatsApp is enabled
            if (!isset($whatsapp_config['enabled']) || !in_array($whatsapp_config['enabled'], ['true', '1', 1, true], true)) {
                $this->send_error('WhatsApp is not enabled in system settings', 400);
                return;
            }
            
            // Check required settings
            $required_fields = ['baseUrl', 'instance_id', 'access_token', 'type'];
            foreach ($required_fields as $field) {
                if (!isset($whatsapp_config[$field]) || empty($whatsapp_config[$field])) {
                    $this->send_error("WhatsApp configuration missing: {$field}", 400);
                    return;
                }
            }
            
            // Build WhatsApp API URL
            $params = [
                'number' => $number,
                'type' => $whatsapp_config['type'],
                'message' => $message,
                'instance_id' => $whatsapp_config['instance_id'],
                'access_token' => $whatsapp_config['access_token']
            ];
            
            $url = $whatsapp_config['baseUrl'] . '?' . http_build_query($params);
            
            // Send the request
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            if ($error) {
                $this->send_error('WhatsApp API request failed: ' . $error, 500);
                return;
            }
            
            if ($httpCode !== 200) {
                $this->send_error('WhatsApp API returned HTTP ' . $httpCode . ': ' . $response, 500);
                return;
            }
            
            // Parse response
            $responseData = json_decode($response, true);
            
            // Check if response indicates success
            if ($responseData && isset($responseData['status']) && $responseData['status'] === 'success') {
                $this->send_response([
                    'message' => 'Test WhatsApp message sent successfully',
                    'response' => $responseData
                ]);
            } else {
                // Some APIs might return different success indicators
                $this->send_response([
                    'message' => 'WhatsApp message sent (please check the recipient device to verify)',
                    'response' => $responseData ?: $response,
                    'status' => 'sent'
                ]);
            }
            
        } catch (Exception $e) {
            $this->send_error('Failed to send test WhatsApp message: ' . $e->getMessage(), 500);
        }
    }
    
    // Test SMS Configuration
    public function test_sms() {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            // Get input data
            $input = json_decode($this->input->raw_input_stream, true);
            $number = $input['number'] ?? null;
            $message = $input['message'] ?? 'This is a test SMS from your school management system. SMS configuration is working correctly!';
            
            if (!$number) {
                $this->send_error('Phone number is required', 400);
                return;
            }
            
            // Get SMS settings from database
            $this->db->like('setting_key', 'sms_', 'after');
            $settings = $this->db->get('system_settings')->result_array();
            
            $sms_config = [];
            foreach ($settings as $setting) {
                $key = str_replace('sms_', '', $setting['setting_key']);
                $sms_config[$key] = $setting['setting_value'];
            }
            
            // Check if SMS is enabled
            if (!isset($sms_config['enabled']) || $sms_config['enabled'] !== 'true') {
                $this->send_error('SMS is not enabled in system settings', 400);
                return;
            }
            
            // Check required settings based on provider
            $provider = $sms_config['provider'] ?? 'twilio';
            $required_fields = ['api_key', 'api_secret'];
            
            if ($provider === 'twilio') {
                $required_fields[] = 'sender_id'; // Phone number for Twilio
            }
            
            foreach ($required_fields as $field) {
                if (!isset($sms_config[$field]) || empty($sms_config[$field])) {
                    $this->send_error("SMS configuration missing: {$field}", 400);
                    return;
                }
            }
            
            // Send SMS based on provider
            $result = $this->send_sms_by_provider($provider, $sms_config, $number, $message);
            
            if ($result['success']) {
                $this->send_response([
                    'message' => 'Test SMS sent successfully',
                    'response' => $result['response']
                ]);
            } else {
                $this->send_error('Failed to send SMS: ' . $result['error'], 500);
            }
            
        } catch (Exception $e) {
            $this->send_error('Failed to send test SMS: ' . $e->getMessage(), 500);
        }
    }
    
    // Helper method to send SMS based on provider
    private function send_sms_by_provider($provider, $config, $number, $message) {
        try {
            switch ($provider) {
                case 'twilio':
                    return $this->send_twilio_sms($config, $number, $message);
                
                case 'textlocal':
                    return $this->send_textlocal_sms($config, $number, $message);
                
                case 'msg91':
                    return $this->send_msg91_sms($config, $number, $message);
                
                case 'custom':
                    return $this->send_custom_sms($config, $number, $message);
                
                default:
                    return ['success' => false, 'error' => 'Unsupported SMS provider: ' . $provider];
            }
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    // Twilio SMS implementation
    private function send_twilio_sms($config, $number, $message) {
        $account_sid = $config['api_key'];
        $auth_token = $config['api_secret'];
        $from_number = $config['sender_id'];
        
        $url = "https://api.twilio.com/2010-04-01/Accounts/{$account_sid}/Messages.json";
        
        $data = [
            'From' => $from_number,
            'To' => $number,
            'Body' => $message
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERPWD, "{$account_sid}:{$auth_token}");
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            return ['success' => false, 'error' => $error];
        }
        
        if ($httpCode === 201) {
            return ['success' => true, 'response' => json_decode($response, true)];
        } else {
            return ['success' => false, 'error' => 'HTTP ' . $httpCode . ': ' . $response];
        }
    }
    
    // TextLocal SMS implementation
    private function send_textlocal_sms($config, $number, $message) {
        $api_key = $config['api_key'];
        $sender = $config['sender_id'] ?? 'TXTLCL';
        
        $data = [
            'apikey' => $api_key,
            'numbers' => $number,
            'message' => $message,
            'sender' => $sender
        ];
        
        $url = 'https://api.textlocal.in/send/';
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            return ['success' => false, 'error' => $error];
        }
        
        $responseData = json_decode($response, true);
        if ($responseData && $responseData['status'] === 'success') {
            return ['success' => true, 'response' => $responseData];
        } else {
            return ['success' => false, 'error' => $response];
        }
    }
    
    // MSG91 SMS implementation
    private function send_msg91_sms($config, $number, $message) {
        $api_key = $config['api_key'];
        $sender_id = $config['sender_id'] ?? 'MSGIND';
        $route = '4'; // Transactional route
        
        $url = "https://api.msg91.com/api/sendhttp.php";
        
        $data = [
            'authkey' => $api_key,
            'mobiles' => $number,
            'message' => $message,
            'sender' => $sender_id,
            'route' => $route
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url . '?' . http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            return ['success' => false, 'error' => $error];
        }
        
        if ($httpCode === 200 && strpos($response, 'error') === false) {
            return ['success' => true, 'response' => $response];
        } else {
            return ['success' => false, 'error' => $response];
        }
    }
    
    // Custom SMS API implementation
    private function send_custom_sms($config, $number, $message) {
        $api_url = $config['api_url'] ?? '';
        
        if (empty($api_url)) {
            return ['success' => false, 'error' => 'Custom API URL not configured'];
        }
        
        // Replace placeholders in URL
        $url = str_replace(['{number}', '{message}', '{api_key}'], 
                          [$number, urlencode($message), $config['api_key']], 
                          $api_url);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            return ['success' => false, 'error' => $error];
        }
        
        if ($httpCode === 200) {
            return ['success' => true, 'response' => $response];
        } else {
            return ['success' => false, 'error' => 'HTTP ' . $httpCode . ': ' . $response];
        }
    }
    // Support Ticket
    public function support_ticket() {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        try {
            $input = json_decode($this->input->raw_input_stream, true);
            
            if (empty($input['subject']) || empty($input['message'])) {
                $this->send_error('Subject and message are required', 400);
                return;
            }
            
            $ticket_data = [
                'user_id' => $this->user['id'],
                'user_name' => $this->user['name'],
                'user_email' => $this->user['email'],
                'subject' => $input['subject'],
                'category' => $input['category'] ?? 'general',
                'priority' => $input['priority'] ?? 'medium',
                'message' => $input['message'],
                'status' => 'open',
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            $this->db->insert('support_tickets', $ticket_data);
            $ticket_id = $this->db->insert_id();
            
            // Send email notification to support team (optional)
            $this->send_response([
                'message' => 'Support ticket submitted successfully',
                'ticket_id' => $ticket_id
            ]);
            
        } catch (Exception $e) {
            $this->send_error('Failed to submit support ticket: ' . $e->getMessage(), 500);
        }
    }
    
    // Test endpoint for debugging student creation
    public function test_student_creation() {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        // Skip authentication for debugging
        // if (!$this->require_permission('students_create')) {
        //     return;
        // }
        
        // Test with minimal data
        $test_data = [
            'student_name' => 'Test Student Debug',
            'grade_id' => 1,
            'division_id' => 1,
            'roll_number' => 'TEST_' . time(),
            'admission_date' => '2025-08-18',
            'parent_id' => 1,
            'academic_year_id' => 1,
            'is_active' => 1,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        log_message('debug', 'Test student creation with data: ' . json_encode($test_data));
        
        // Test using the Student_model's create_student method
        $this->load->model('Student_model');
        
        try {
            $student_id = $this->Student_model->create_student($test_data);
            
            if ($student_id) {
                $this->send_response([
                    'success' => true, 
                    'student_id' => $student_id,
                    'message' => 'Test student created successfully using model method'
                ]);
            } else {
                $db_error = $this->db->error();
                log_message('error', 'Model create_student returned false. DB Error: ' . json_encode($db_error));
                $this->send_error('Model create_student failed: ' . ($db_error['message'] ?? 'Unknown error'), 500);
            }
        } catch (Exception $e) {
            log_message('error', 'Exception during model test: ' . $e->getMessage());
            $this->send_error('Exception: ' . $e->getMessage(), 500);
        }
    }

    // Debug endpoint to manually assign fees to all students
    public function assign_fees_to_all_students() {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        // Skip authentication for debugging
        // if (!$this->require_permission('students')) {
        //     return;
        // }
        
        $this->load->model('Student_model');
        $this->load->model('Fee_structure_model');
        
        // Get all active students
        $students = $this->Student_model->get_students_for_fee_assignment();
        $assigned_count = 0;
        $error_count = 0;
        $errors = [];
        
        foreach ($students as $student) {
            try {
                // Get applicable fee structures for this student
                $fee_structures = $this->Fee_structure_model->get_applicable_fee_structures(
                    $student['id'], 
                    $student['academic_year_id'], 
                    $student['grade_id'], 
                    $student['division_id'], 
                    true // mandatory_only = true
                );
                
                log_message('debug', 'Found ' . count($fee_structures) . ' fee structures for student ' . $student['id']);
                
                if (count($fee_structures) > 0) {
                    // Call the private method through a public wrapper
                    $this->Student_model->assign_fees_to_student_public($student['id'], $student['grade_id'], $student['division_id'], $student['academic_year_id']);
                    $assigned_count++;
                } else {
                    log_message('debug', 'No mandatory fee structures found for student ' . $student['id'] . ' (Grade: ' . $student['grade_id'] . ', Division: ' . $student['division_id'] . ')');
                }
                
            } catch (Exception $e) {
                $error_count++;
                $errors[] = 'Student ' . $student['id'] . ': ' . $e->getMessage();
                log_message('error', 'Failed to assign fees to student ' . $student['id'] . ': ' . $e->getMessage());
            }
        }
        
        $this->send_response([
            'success' => true,
            'total_students' => count($students),
            'assigned_count' => $assigned_count,
            'error_count' => $error_count,
            'errors' => $errors,
            'message' => "Fee assignment completed. Assigned to {$assigned_count} students, {$error_count} errors."
        ]);
    }

    // Debug endpoint to check fee structures and students
    public function debug_fee_assignment_info() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        $this->load->model('Student_model');
        $this->load->model('Fee_structure_model');
        
        // Get current academic year
        $this->load->model('Academic_year_model');
        $current_year = $this->Academic_year_model->get_default_academic_year();
        
        // Count students
        $this->db->where('is_active', 1);
        $student_count = $this->db->count_all_results('students');
        
        // Count mandatory fee structures
        $this->db->where('is_active', 1);
        $this->db->where('is_mandatory', 1);
        if ($current_year) {
            $this->db->where('academic_year_id', $current_year['id']);
        }
        $mandatory_fee_count = $this->db->count_all_results('fee_structures');
        
        // Count existing fee assignments
        $this->db->where('is_active', 1);
        $assignment_count = $this->db->count_all_results('student_fee_assignments');
        
        // Get a sample of mandatory fee structures
        $this->db->select('fs.id, fs.amount, fs.is_mandatory, fs.grade_id, fs.division_id, fc.name as category_name');
        $this->db->from('fee_structures fs');
        $this->db->join('fee_categories fc', 'fs.fee_category_id = fc.id');
        $this->db->where('fs.is_active', 1);
        $this->db->where('fs.is_mandatory', 1);
        if ($current_year) {
            $this->db->where('fs.academic_year_id', $current_year['id']);
        }
        $this->db->limit(5);
        $sample_fees = $this->db->get()->result_array();
        
        // Get a sample of students
        $this->db->select('id, student_name, grade_id, division_id, academic_year_id');
        $this->db->from('students');
        $this->db->where('is_active', 1);
        $this->db->limit(5);
        $sample_students = $this->db->get()->result_array();
        
        $this->send_response([
            'current_academic_year' => $current_year,
            'student_count' => $student_count,
            'mandatory_fee_count' => $mandatory_fee_count,
            'assignment_count' => $assignment_count,
            'sample_mandatory_fees' => $sample_fees,
            'sample_students' => $sample_students
        ]);
    }

    // Assign fees to a specific student (useful for fixing missing assignments)
    public function assign_fees_to_student($student_id = null) {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }
        
        if (!$student_id) {
            $this->send_error('Student ID required', 400);
            return;
        }
        
        // Skip authentication for debugging
        // if (!$this->require_permission('students')) {
        //     return;
        // }
        
        $this->load->model('Student_model');
        
        // Get student details
        $student = $this->Student_model->get_student_by_id($student_id);
        if (!$student) {
            $this->send_error('Student not found', 404);
            return;
        }
        
        try {
            // Force fee assignment for this student
            $this->Student_model->assign_fees_to_student_public(
                $student['id'], 
                $student['grade_id'], 
                $student['division_id'], 
                $student['academic_year_id']
            );
            
            // Get updated fee totals
            $updated_student = $this->Student_model->get_student_by_id($student_id);
            
            $this->send_response([
                'success' => true,
                'message' => 'Fees assigned successfully',
                'student' => [
                    'id' => $updated_student['id'],
                    'name' => $updated_student['student_name'],
                    'total_fees' => $updated_student['total_fees'],
                    'total_paid' => $updated_student['total_paid'],
                    'mandatory_fees' => $updated_student['mandatory_fees']
                ]
            ]);
            
        } catch (Exception $e) {
            log_message('error', 'Failed to assign fees to student ' . $student_id . ': ' . $e->getMessage());
            $this->send_error('Failed to assign fees: ' . $e->getMessage(), 500);
        }
    }

    // ==================== ATTENDANCE MANAGEMENT ====================

    /**
     * Get attendance records with filters
     * GET /api/admin/attendance
     */
    public function attendance() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            // Check permission
            if (!$this->require_any_permission(['attendance', 'attendance.view', '*'])) {
                return;
            }

            $filters = [
                'student_id' => $this->input->get('student_id'),
                'grade_id' => $this->input->get('grade_id'),
                'division_id' => $this->input->get('division_id'),
                'start_date' => $this->input->get('start_date'),
                'end_date' => $this->input->get('end_date'),
                'status' => $this->input->get('status'),
                'limit' => (int) $this->input->get('limit', 50),
                'offset' => (int) $this->input->get('offset', 0)
            ];

            // Remove null values
            $filters = array_filter($filters, function($value) {
                return $value !== null && $value !== '';
            });

            $attendance = $this->Attendance_model->get_attendance_report($filters);
            $total = $this->Attendance_model->count_attendance_report($filters);

            $this->send_response([
                'data' => $attendance,
                'total' => $total,
                'limit' => $filters['limit'] ?? 50,
                'offset' => $filters['offset'] ?? 0
            ], 'Attendance records retrieved successfully');

        } catch (Exception $e) {
            log_message('error', 'Get attendance error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve attendance records', 500);
        }
    }

    /**
     * Get class attendance for a specific date
     * GET /api/admin/class_attendance/{grade_id}/{division_id}/{date}
     */
    public function class_attendance($grade_id, $division_id, $date) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            // Check permission
            if (!$this->require_any_permission(['attendance', 'attendance.view', '*'])) {
                return;
            }

            $attendance = $this->Attendance_model->get_class_attendance($grade_id, $division_id, $date);

            $this->send_response($attendance, 'Class attendance retrieved successfully');

        } catch (Exception $e) {
            log_message('error', 'Get class attendance error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve class attendance', 500);
        }
    }

    /**
     * Mark attendance (bulk or single)
     * POST /api/admin/mark_attendance
     */
    public function mark_attendance() {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            // Check permission
            if (!$this->require_any_permission(['attendance', 'attendance.create', 'attendance.update', '*'])) {
                return;
            }

            $input = $this->get_input();

            // Check if bulk attendance
            if (isset($input['attendance_records']) && is_array($input['attendance_records'])) {
                // Bulk attendance marking
                $attendance_records = [];
                
                foreach ($input['attendance_records'] as $record) {
                    $attendance_records[] = [
                        'student_id' => $record['student_id'],
                        'attendance_date' => $input['attendance_date'],
                        'status' => $record['status'] ?? 'present',
                        'check_in_time' => $record['check_in_time'] ?? null,
                        'check_out_time' => $record['check_out_time'] ?? null,
                        'remarks' => $record['remarks'] ?? null,
                        'marked_by_staff_id' => $this->user['id']
                    ];
                }

                if ($this->Attendance_model->mark_bulk_attendance($attendance_records)) {
                    $this->log_activity('bulk_attendance_marked', 'attendance', null, null, [
                        'date' => $input['attendance_date'],
                        'count' => count($attendance_records)
                    ]);

                    $this->send_response(null, 'Attendance marked successfully', 201);
                } else {
                    $this->send_error('Failed to mark attendance', 500);
                }
            } else {
                // Single student attendance
                $this->load->library('form_validation');
                $this->form_validation->set_data($input);
                $this->form_validation->set_rules('student_id', 'Student', 'required|numeric');
                $this->form_validation->set_rules('attendance_date', 'Date', 'required');
                $this->form_validation->set_rules('status', 'Status', 'required|in_list[present,absent,late,half_day]');

                if (!$this->form_validation->run()) {
                    $this->send_error('Validation failed', 400, $this->form_validation->error_array());
                    return;
                }

                $attendance_data = [
                    'student_id' => $input['student_id'],
                    'attendance_date' => $input['attendance_date'],
                    'status' => $input['status'],
                    'check_in_time' => $input['check_in_time'] ?? null,
                    'check_out_time' => $input['check_out_time'] ?? null,
                    'remarks' => $input['remarks'] ?? null,
                    'marked_by_staff_id' => $this->user['id']
                ];

                if ($this->Attendance_model->mark_attendance($attendance_data)) {
                    $this->log_activity('attendance_marked', 'attendance', null, null, $attendance_data);
                    $this->send_response(null, 'Attendance marked successfully', 201);
                } else {
                    $this->send_error('Failed to mark attendance', 500);
                }
            }

        } catch (Exception $e) {
            log_message('error', 'Mark attendance error: ' . $e->getMessage());
            $this->send_error('Failed to mark attendance: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get attendance statistics
     * GET /api/admin/attendance_stats
     */
    public function attendance_stats() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            // Check permission
            if (!$this->require_any_permission(['attendance', 'attendance.view', '*'])) {
                return;
            }

            $student_id = $this->input->get('student_id');
            $grade_id = $this->input->get('grade_id');
            $division_id = $this->input->get('division_id');
            $start_date = $this->input->get('start_date');
            $end_date = $this->input->get('end_date');

            if ($student_id) {
                // Get stats for specific student
                $stats = $this->Attendance_model->get_student_attendance_stats($student_id, $start_date, $end_date);
            } else if ($grade_id && $division_id) {
                // Get stats for a class
                $stats = $this->Attendance_model->get_class_attendance_stats($grade_id, $division_id, $start_date, $end_date);
            } else {
                $this->send_error('Either student_id or both grade_id and division_id are required', 400);
                return;
            }

            $this->send_response($stats, 'Attendance statistics retrieved successfully');

        } catch (Exception $e) {
            log_message('error', 'Get attendance stats error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve attendance statistics', 500);
        }
    }

    /**
     * Get low attendance students
     * GET /api/admin/low_attendance_students
     */
    public function low_attendance_students() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            // Check permission
            if (!$this->require_any_permission(['attendance', 'attendance.view', 'reports', '*'])) {
                return;
            }

            $threshold = (int) $this->input->get('threshold', 75);
            $start_date = $this->input->get('start_date');
            $end_date = $this->input->get('end_date');

            $students = $this->Attendance_model->get_low_attendance_students($threshold, $start_date, $end_date);

            $this->send_response($students, 'Low attendance students retrieved successfully');

        } catch (Exception $e) {
            log_message('error', 'Get low attendance students error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve low attendance students', 500);
        }
    }

    /**
     * Delete attendance record
     * DELETE /api/admin/attendance/{id}
     */
    public function delete_attendance($id) {
        if ($this->input->method() !== 'delete') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            // Check permission
            if (!$this->require_any_permission(['attendance', 'attendance.delete', '*'])) {
                return;
            }

            if ($this->Attendance_model->delete_attendance($id)) {
                $this->log_activity('attendance_deleted', 'attendance', $id);
                $this->send_response(null, 'Attendance record deleted successfully');
            } else {
                $this->send_error('Failed to delete attendance record', 500);
            }

        } catch (Exception $e) {
            log_message('error', 'Delete attendance error: ' . $e->getMessage());
            $this->send_error('Failed to delete attendance record', 500);
        }
    }

    // ==================== STAFF ATTENDANCE MANAGEMENT ====================

    /**
     * Get daily staff attendance with all staff listed
     * GET /api/admin/staff_attendance_daily
     */
    public function staff_attendance_daily() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            if (!$this->require_any_permission(['staff_attendance', 'staff_attendance.view', '*'])) {
                return;
            }

            $date = $this->input->get('date') ?: date('Y-m-d');
            $attendance = $this->Staff_attendance_model->get_daily_attendance($date);

            $this->send_response($attendance);

        } catch (Exception $e) {
            log_message('error', 'Get daily staff attendance error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve staff attendance', 500);
        }
    }

    /**
     * Get staff attendance history
     * GET /api/admin/staff_attendance_history
     */
    public function staff_attendance_history() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            if (!$this->require_any_permission(['staff_attendance', 'staff_attendance.view', '*'])) {
                return;
            }

            $month = $this->input->get('month');
            $staff_id = $this->input->get('staff_id');
            $status = $this->input->get('status');

            $history = $this->Staff_attendance_model->get_all_staff_history($month, $staff_id, $status);

            $this->send_response($history);

        } catch (Exception $e) {
            log_message('error', 'Get staff attendance history error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve attendance history', 500);
        }
    }

    /**
     * Get staff attendance records with filters
     * GET /api/admin/staff-attendance
     * GET /api/admin/staff-attendance/{date} - Get all staff attendance for a specific date
     */
    public function staff_attendance($date = null) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            // Check permission
            if (!$this->require_any_permission(['staff_attendance', 'staff_attendance.view', 'staff', 'staff.view', 'attendance', 'attendance.view', '*'])) {
                return;
            }

            if ($date) {
                // Get all staff attendance for a specific date
                $attendance = $this->Staff_attendance_model->get_all_staff_attendance($date);
                $this->send_response($attendance, 'Staff attendance retrieved successfully');
            } else {
                // Get staff attendance with filters
                $filters = [
                    'staff_id' => $this->input->get('staff_id'),
                    'role_name' => $this->input->get('role_name'),
                    'department' => $this->input->get('department'),
                    'start_date' => $this->input->get('start_date'),
                    'end_date' => $this->input->get('end_date'),
                    'status' => $this->input->get('status'),
                    'limit' => (int) $this->input->get('limit', 50),
                    'offset' => (int) $this->input->get('offset', 0)
                ];

                // Remove null values
                $filters = array_filter($filters, function($value) {
                    return $value !== null && $value !== '';
                });

                $attendance = $this->Staff_attendance_model->get_attendance_report($filters);
                $total = $this->Staff_attendance_model->count_attendance_report($filters);

                $this->send_response([
                    'data' => $attendance,
                    'total' => $total,
                    'limit' => $filters['limit'] ?? 50,
                    'offset' => $filters['offset'] ?? 0
                ], 'Staff attendance records retrieved successfully');
            }

        } catch (Exception $e) {
            log_message('error', 'Get staff attendance error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve staff attendance records', 500);
        }
    }

    /**
     * Mark staff attendance (bulk or single)
     * POST /api/admin/mark-staff-attendance
     */
    public function mark_staff_attendance() {
        if ($this->input->method() !== 'post') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            // Check permission
            if (!$this->require_any_permission(['staff_attendance', 'staff_attendance.create', 'staff_attendance.update', 'staff', 'staff.update', 'attendance', 'attendance.create', 'attendance.update', '*'])) {
                return;
            }

            $input = $this->get_input();

            // Check if bulk attendance
            if (isset($input['attendance_records']) && is_array($input['attendance_records'])) {
                // Bulk attendance marking
                $attendance_records = [];
                
                foreach ($input['attendance_records'] as $record) {
                    $attendance_records[] = [
                        'staff_id' => $record['staff_id'],
                        'attendance_date' => $input['attendance_date'],
                        'status' => $record['status'] ?? 'present',
                        'check_in_time' => $record['check_in_time'] ?? null,
                        'check_out_time' => $record['check_out_time'] ?? null,
                        'remarks' => $record['remarks'] ?? null
                    ];
                }

                if ($this->Staff_attendance_model->mark_bulk_attendance($attendance_records, $this->user_id)) {
                    $this->log_activity('bulk_staff_attendance_marked', 'staff_attendance', null, null, [
                        'date' => $input['attendance_date'],
                        'count' => count($attendance_records)
                    ]);

                    $this->send_response(null, 'Staff attendance marked successfully', 201);
                } else {
                    $this->send_error('Failed to mark staff attendance', 500);
                }
            } else {
                // Single staff attendance
                $this->load->library('form_validation');
                $this->form_validation->set_data($input);
                $this->form_validation->set_rules('staff_id', 'Staff', 'required|numeric');
                $this->form_validation->set_rules('attendance_date', 'Date', 'required');
                $this->form_validation->set_rules('status', 'Status', 'required|in_list[present,absent,late,half_day,on_leave]');

                if (!$this->form_validation->run()) {
                    $this->send_error('Validation failed', 400, $this->form_validation->error_array());
                    return;
                }

                $attendance_data = [
                    'staff_id' => $input['staff_id'],
                    'attendance_date' => $input['attendance_date'],
                    'status' => $input['status'],
                    'check_in_time' => $input['check_in_time'] ?? null,
                    'check_out_time' => $input['check_out_time'] ?? null,
                    'total_hours' => $input['total_hours'] ?? null,
                    'overtime_hours' => $input['overtime_hours'] ?? null,
                    'remarks' => $input['remarks'] ?? null
                ];

                if ($this->Staff_attendance_model->mark_attendance($attendance_data)) {
                    $this->log_activity('staff_attendance_marked', 'staff_attendance', null, null, $attendance_data);
                    $this->send_response(null, 'Staff attendance marked successfully', 201);
                } else {
                    $this->send_error('Failed to mark staff attendance', 500);
                }
            }

        } catch (Exception $e) {
            log_message('error', 'Mark staff attendance error: ' . $e->getMessage());
            $this->send_error('Failed to mark staff attendance: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get staff attendance statistics
     * GET /api/admin/staff-attendance-stats
     */
    public function staff_attendance_stats() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            // Check permission
            if (!$this->require_any_permission(['staff_attendance', 'staff_attendance.view', 'staff', 'staff.view', 'attendance', 'attendance.view', '*'])) {
                return;
            }

            $staff_id = $this->input->get('staff_id');
            $month = $this->input->get('month');

            if (!$staff_id) {
                $this->send_error('Staff ID is required', 400);
                return;
            }

            $stats = $this->Staff_attendance_model->get_staff_stats($staff_id, $month);

            if (!$stats) {
                $this->send_response([
                    'total_days' => 0,
                    'present_days' => 0,
                    'absent_days' => 0,
                    'late_days' => 0,
                    'half_days' => 0,
                    'leave_days' => 0,
                    'avg_work_hours' => 0,
                    'attendance_rate' => 0
                ], 'No attendance records found');
                return;
            }

            $this->send_response($stats, 'Staff attendance statistics retrieved successfully');

        } catch (Exception $e) {
            log_message('error', 'Get staff attendance stats error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve staff attendance statistics', 500);
        }
    }

    /**
     * Get low attendance staff
     * GET /api/admin/low-attendance-staff
     */
    public function low_attendance_staff() {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            // Check permission
            if (!$this->require_any_permission(['staff_attendance', 'staff_attendance.view', 'staff', 'staff.view', 'attendance', 'attendance.view', 'reports', '*'])) {
                return;
            }

            $threshold = (int) $this->input->get('threshold', 75);
            $start_date = $this->input->get('start_date');
            $end_date = $this->input->get('end_date');

            $staff = $this->Staff_attendance_model->get_low_attendance_staff($threshold, $start_date, $end_date);

            $this->send_response($staff, 'Low attendance staff retrieved successfully');

        } catch (Exception $e) {
            log_message('error', 'Get low attendance staff error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve low attendance staff', 500);
        }
    }
    /**
     * Delete staff attendance record
     * DELETE /api/admin/staff-attendance/{id}
     */
    public function delete_staff_attendance($id) {
        if ($this->input->method() !== 'delete') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        try {
            // Check permission
            if (!$this->require_any_permission(['staff_attendance', 'staff_attendance.delete', 'staff', 'staff.delete', 'attendance', 'attendance.delete', '*'])) {
                return;
            }

            if ($this->Staff_attendance_model->delete_attendance($id)) {
                $this->log_activity('staff_attendance_deleted', 'staff_attendance', $id);
                $this->send_response(null, 'Staff attendance record deleted successfully');
            } else {
                $this->send_error('Failed to delete staff attendance record', 500);
            }

        } catch (Exception $e) {
            log_message('error', 'Delete staff attendance error: ' . $e->getMessage());
            $this->send_error('Failed to delete staff attendance record', 500);
        }
    }

    private function is_valid_dob_format($dob)
    {
        if (empty($dob)) {
            return false;
        }

        $date = DateTime::createFromFormat('Y-m-d', $dob);
        return $date && $date->format('Y-m-d') === $dob;
    }

    private function calculate_age_from_dob($dob)
    {
        try {
            $dobDate = new DateTime($dob);
            $today = new DateTime('today');

            if ($dobDate > $today) {
                return null;
            }

            $age = $dobDate->diff($today)->y;
            if ($age < 0 || $age > 120) {
                return null;
            }

            return $age;
            } catch (Exception $e) {
            return null;
        }
    }

    private function normalize_parent_staff_contacts($contacts)
    {
        if ($contacts === null) {
            return [];
        }

        if (!is_array($contacts)) {
            throw new Exception('Parent staff contacts must be provided as an array');
        }

        $normalized = [];

        foreach ($contacts as $index => $contact) {
            if (!is_array($contact)) {
                throw new Exception("Invalid staff contact payload at index {$index}");
            }

            $name = isset($contact['name']) ? trim($contact['name']) : '';
            $mobile = isset($contact['mobile_number']) ? preg_replace('/\s+/', '', $contact['mobile_number']) : '';
            $tssId = isset($contact['tss_id']) && $contact['tss_id'] !== '' ? $contact['tss_id'] : null;

            if ($name === '') {
                throw new Exception("Staff contact name is required at index {$index}");
            }

            if (strlen($name) > 100) {
                throw new Exception("Staff contact name exceeds maximum length at index {$index}");
            }

            if ($mobile === '') {
                throw new Exception("Staff contact mobile number is required at index {$index}");
            }

            if (!preg_match('/^\+?[0-9]{6,15}$/', $mobile)) {
                throw new Exception("Invalid mobile number for staff contact at index {$index}");
            }

            if ($tssId !== null && !is_numeric($tssId)) {
                throw new Exception("Invalid TSS ID for staff contact at index {$index}");
            }

            $normalized[] = [
                'name' => $name,
                'mobile_number' => $mobile,
                'tss_id' => $tssId !== null ? (int)$tssId : null,
                'photo' => isset($contact['photo']) && $contact['photo'] !== '' ? $contact['photo'] : null
            ];
        }

        return $normalized;
    }

    // ==================== SUBJECT MANAGEMENT ====================

    /**
     * Subject CRUD operations
     * GET /api/admin/subjects - Get all subjects with pagination
     * GET /api/admin/subjects/{id} - Get specific subject
     * POST /api/admin/subjects - Create subject
     * PUT /api/admin/subjects/{id} - Update subject
     * DELETE /api/admin/subjects/{id} - Delete subject
     */
    public function subjects($id = null) {
        if ($this->input->method() === 'get') {
            if (!$this->require_any_permission(['subjects', 'subjects.view', 'syllabus', '*'])) {
                return;
            }

            try {
                if ($id) {
                    $subject = $this->Subject_model->get_subject_by_id($id);
                    if (!$subject) {
                        $this->send_error('Subject not found', 404);
                        return;
                    }
                    $this->send_response($subject);
                } else {
                    $limit = (int) $this->input->get('limit', 10);
                    $offset = (int) $this->input->get('offset', 0);
                    
                    $filters = [
                        'grade_id' => $this->input->get('grade_id'),
                        'search' => $this->input->get('search')
                    ];
                    
                    $subjects = $this->Subject_model->get_subjects_paginated($limit, $offset, $filters);
                    $total = $this->Subject_model->count_subjects($filters);
                    
                    $this->send_response([
                        'data' => $subjects,
                        'total' => $total,
                        'limit' => $limit,
                        'offset' => $offset
                    ]);
                }
            } catch (Exception $e) {
                log_message('error', 'Get subjects error: ' . $e->getMessage());
                $this->send_error('Failed to retrieve subjects', 500);
            }
            return;
        }

        if ($this->input->method() === 'post') {
            if (!$this->require_any_permission(['subjects', 'subjects.create', 'syllabus', '*'])) {
                return;
            }

            try {
                $input = $this->get_input();
                
                $this->load->library('form_validation');
                $this->form_validation->set_data($input);
                $this->form_validation->set_rules('subject_name', 'Subject Name', 'required|max_length[100]');
                $this->form_validation->set_rules('grade_id', 'Grade', 'required|integer');
                
                if (!$this->form_validation->run()) {
                    $this->send_error('Validation failed', 400, $this->form_validation->error_array());
                    return;
                }
                
                // Check if subject already exists for this grade
                if ($this->Subject_model->subject_exists($input['subject_name'], $input['grade_id'])) {
                    $this->send_error('Subject already exists for this grade', 400);
                    return;
                }
                
                $subject_id = $this->Subject_model->create_subject($input);
                
                if ($subject_id) {
                    $subject = $this->Subject_model->get_subject_by_id($subject_id);
                    $this->log_activity('subject_created', 'subject', $subject_id, null, $input);
                    $this->send_response($subject, 'Subject created successfully', 201);
                } else {
                    $this->send_error('Failed to create subject', 500);
                }
            } catch (Exception $e) {
                log_message('error', 'Create subject error: ' . $e->getMessage());
                $this->send_error('Failed to create subject', 500);
            }
            return;
        }

        if ($this->input->method() === 'put') {
            if (!$this->require_any_permission(['subjects', 'subjects.update', 'syllabus', '*'])) {
                return;
            }

            if (!$id) {
                $this->send_error('Subject ID required', 400);
                return;
            }

            try {
                $existing = $this->Subject_model->get_subject_by_id($id);
                if (!$existing) {
                    $this->send_error('Subject not found', 404);
                    return;
                }
                
                $input = $this->get_input();
                
                $this->load->library('form_validation');
                $this->form_validation->set_data($input);
                $this->form_validation->set_rules('subject_name', 'Subject Name', 'max_length[100]');
                $this->form_validation->set_rules('grade_id', 'Grade', 'integer');
                
                if (!$this->form_validation->run()) {
                    $this->send_error('Validation failed', 400, $this->form_validation->error_array());
                    return;
                }
                
                // Check if subject already exists for this grade (excluding current)
                if (isset($input['subject_name']) && isset($input['grade_id'])) {
                    if ($this->Subject_model->subject_exists($input['subject_name'], $input['grade_id'], $id)) {
                        $this->send_error('Subject already exists for this grade', 400);
                        return;
                    }
                }
                
                if ($this->Subject_model->update_subject($id, $input)) {
                    $subject = $this->Subject_model->get_subject_by_id($id);
                    $this->log_activity('subject_updated', 'subject', $id, $existing, $input);
                    $this->send_response($subject, 'Subject updated successfully');
                } else {
                    $this->send_error('Failed to update subject', 500);
                }
            } catch (Exception $e) {
                log_message('error', 'Update subject error: ' . $e->getMessage());
                $this->send_error('Failed to update subject', 500);
            }
            return;
        }

        if ($this->input->method() === 'delete') {
            if (!$this->require_any_permission(['subjects', 'subjects.delete', 'syllabus', '*'])) {
                return;
            }

            if (!$id) {
                $this->send_error('Subject ID required', 400);
                return;
            }

            try {
                $existing = $this->Subject_model->get_subject_by_id($id);
                if (!$existing) {
                    $this->send_error('Subject not found', 404);
                    return;
                }
                
                if ($this->Subject_model->delete_subject($id)) {
                    $this->log_activity('subject_deleted', 'subject', $id, $existing, null);
                    $this->send_response(null, 'Subject deleted successfully');
                } else {
                    $this->send_error('Failed to delete subject', 500);
                }
            } catch (Exception $e) {
                log_message('error', 'Delete subject error: ' . $e->getMessage());
                $this->send_error('Failed to delete subject', 500);
            }
            return;
        }

        $this->send_error('Method not allowed', 405);
    }

    /**
     * Get subjects dropdown by grade
     * GET /api/admin/subjects_dropdown/{grade_id}
     */
    public function subjects_dropdown($grade_id = null) {
        if ($this->input->method() !== 'get') {
            $this->send_error('Method not allowed', 405);
            return;
        }

        if (!$this->require_any_permission(['subjects', 'subjects.view', 'syllabus', '*'])) {
            return;
        }

        try {
            $subjects = $this->Subject_model->get_subjects_dropdown($grade_id);
            $this->send_response($subjects);
        } catch (Exception $e) {
            log_message('error', 'Get subjects dropdown error: ' . $e->getMessage());
            $this->send_error('Failed to retrieve subjects', 500);
        }
    }

    /**
     * Syllabus CRUD operations
     */
    public function syllabus($id = null) {
        if ($this->input->method() === 'get') {
            if (!$this->require_any_permission(['syllabus', 'syllabus.view', '*'])) {
                return;
            }

            try {
                if ($id) {
                    $syllabus = $this->Syllabus_model->get_syllabus_by_id($id);
                    if (!$syllabus) {
                        $this->send_error('Syllabus not found', 404);
                        return;
                    }
                    $this->send_response($syllabus);
                } else {
                    $limit = (int) $this->input->get('limit', 10);
                    $offset = (int) $this->input->get('offset', 0);
                    
                    $filters = [
                        'grade_id' => $this->input->get('grade_id'),
                        'subject_id' => $this->input->get('subject_id'),
                        'start_date' => $this->input->get('start_date'),
                        'end_date' => $this->input->get('end_date'),
                        'search' => $this->input->get('search')
                    ];
                    
                    $syllabus = $this->Syllabus_model->get_syllabus_paginated($limit, $offset, $filters);
                    $total = $this->Syllabus_model->count_syllabus($filters);
                    
                    $this->send_response([
                        'data' => $syllabus,
                        'total' => $total,
                        'limit' => $limit,
                        'offset' => $offset
                    ]);
                }
            } catch (Exception $e) {
                log_message('error', 'Get syllabus error: ' . $e->getMessage());
                $this->send_error('Failed to retrieve syllabus', 500);
            }
            return;
        }

        if ($this->input->method() === 'post') {
            if (!$this->require_any_permission(['syllabus', 'syllabus.create', '*'])) {
                return;
            }

            try {
                $input = $this->get_input();
                
                $this->load->library('form_validation');
                $this->form_validation->set_data($input);
                $this->form_validation->set_rules('grade_id', 'Grade', 'required|integer');
                $this->form_validation->set_rules('subject_id', 'Subject', 'required|integer');
                $this->form_validation->set_rules('topic_title', 'Topic Title', 'required|max_length[150]');
                $this->form_validation->set_rules('day_number', 'Day Number', 'required|integer');
                $this->form_validation->set_rules('syllabus_date', 'Date', 'required');
                $this->form_validation->set_rules('video_link', 'Video Link', 'max_length[225]');
                $this->form_validation->set_rules('documents', 'Documents', 'max_length[225]');
                
                if (!$this->form_validation->run()) {
                    $this->send_error('Validation failed', 400, $this->form_validation->error_array());
                    return;
                }
                
                $input['created_by'] = $this->user['id'];
                $syllabus_id = $this->Syllabus_model->create_syllabus($input);
                
                if ($syllabus_id) {
                    $syllabus = $this->Syllabus_model->get_syllabus_by_id($syllabus_id);
                    $this->log_activity('syllabus_created', 'syllabus_daywise', $syllabus_id, null, $input);
                    $this->send_response($syllabus, 'Syllabus created successfully', 201);
                } else {
                    $this->send_error('Failed to create syllabus', 500);
                }
            } catch (Exception $e) {
                log_message('error', 'Create syllabus error: ' . $e->getMessage());
                $this->send_error('Failed to create syllabus', 500);
            }
            return;
        }

        if ($this->input->method() === 'put') {
            if (!$this->require_any_permission(['syllabus', 'syllabus.update', '*'])) {
                return;
            }

            if (!$id) {
                $this->send_error('Syllabus ID required', 400);
                return;
            }

            try {
                $existing = $this->Syllabus_model->get_syllabus_by_id($id);
                if (!$existing) {
                    $this->send_error('Syllabus not found', 404);
                    return;
                }
                
                $input = $this->get_input();
                
                if ($this->Syllabus_model->update_syllabus($id, $input)) {
                    $syllabus = $this->Syllabus_model->get_syllabus_by_id($id);
                    $this->log_activity('syllabus_updated', 'syllabus_daywise', $id, $existing, $input);
                    $this->send_response($syllabus, 'Syllabus updated successfully');
                } else {
                    // Get database error
                    $db_error = $this->db->error();
                    log_message('error', 'Update syllabus DB error: ' . json_encode($db_error));
                    $error_msg = !empty($db_error['message']) ? $db_error['message'] : 'Failed to update syllabus';
                    $this->send_error($error_msg, 500);
                }
            } catch (Exception $e) {
                log_message('error', 'Update syllabus error: ' . $e->getMessage());
                $this->send_error('Failed to update syllabus: ' . $e->getMessage(), 500);
            }
            return;
        }

        if ($this->input->method() === 'delete') {
            if (!$this->require_any_permission(['syllabus', 'syllabus.delete', '*'])) {
                return;
            }

            if (!$id) {
                $this->send_error('Syllabus ID required', 400);
                return;
            }

            try {
                $existing = $this->Syllabus_model->get_syllabus_by_id($id);
                if (!$existing) {
                    $this->send_error('Syllabus not found', 404);
                    return;
                }
                
                if ($this->Syllabus_model->delete_syllabus($id)) {
                    $this->log_activity('syllabus_deleted', 'syllabus_daywise', $id, $existing, null);
                    $this->send_response(null, 'Syllabus deleted successfully');
                } else {
                    $this->send_error('Failed to delete syllabus', 500);
                }
            } catch (Exception $e) {
                log_message('error', 'Delete syllabus error: ' . $e->getMessage());
                $this->send_error('Failed to delete syllabus', 500);
            }
            return;
        }

        $this->send_error('Method not allowed', 405);
    }

    // ==================== BACKUP MANAGEMENT ====================

    /**
     * Get backup information
     */
    public function backup_info() {
        if (!$this->require_any_permission(['settings', '*'])) {
            return;
        }

        try {
            // Get database size
            $query = $this->db->query("
                SELECT 
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
                FROM information_schema.TABLES 
                WHERE table_schema = DATABASE()
            ");
            $size = $query->row_array();
            
            // Get table count
            $tables = $this->db->list_tables();
            
            $this->send_response([
                'database_size' => ($size['size_mb'] ?? 0) . ' MB',
                'total_tables' => count($tables),
                'last_backup' => null // Could be stored in settings table if needed
            ]);
        } catch (Exception $e) {
            log_message('error', 'Backup info error: ' . $e->getMessage());
            $this->send_error('Failed to get backup info', 500);
        }
    }

    /**
     * Download database backup
     */
    public function database_backup() {
        if (!$this->require_any_permission(['settings', '*'])) {
            return;
        }

        try {
            $table = $this->input->get('table');
            
            // Get database configuration
            $db_host = $this->db->hostname;
            $db_user = $this->db->username;
            $db_pass = $this->db->password;
            $db_name = $this->db->database;
            
            // Create backup filename
            $timestamp = date('Y-m-d_H-i-s');
            $filename = $table ? "backup_{$table}_{$timestamp}.back" : "backup_full_{$timestamp}.back";
            
            // Try XAMPP path first, then system path
            $mysqldump_paths = [
                '/Applications/XAMPP/xamppfiles/bin/mysqldump',
                '/usr/local/bin/mysqldump',
                'mysqldump'
            ];
            
            $mysqldump_cmd = null;
            foreach ($mysqldump_paths as $path) {
                if (@is_executable($path) || $path === 'mysqldump') {
                    $mysqldump_cmd = $path;
                    break;
                }
            }
            
            $backup_content = '';
            
            if ($mysqldump_cmd) {
                // Try mysqldump command
                $backup_command = "{$mysqldump_cmd} -h {$db_host} -u {$db_user}";
                if (!empty($db_pass)) {
                    $backup_command .= " -p{$db_pass}";
                }
                $backup_command .= " {$db_name}";
                
                if ($table) {
                    $backup_command .= " {$table}";
                }
                
                $backup_command .= " 2>&1";
                $backup_content = shell_exec($backup_command);
            }
            
            // If mysqldump failed or not available, use PHP-based backup
            if (empty($backup_content) || strpos($backup_content, 'error') !== false || strpos($backup_content, 'command not found') !== false) {
                $backup_content = $this->create_php_backup($db_name, $table);
            }
            
            if (empty($backup_content)) {
                $this->send_error('Failed to create backup', 500);
                return;
            }
            
            // Log activity
            $this->log_activity('database_backup', 'system', null, null, [
                'table' => $table ?? 'all',
                'size' => strlen($backup_content)
            ]);
            
            // Send file for download
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Content-Length: ' . strlen($backup_content));
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            
            echo $backup_content;
            exit;
        } catch (Exception $e) {
            log_message('error', 'Database backup error: ' . $e->getMessage());
            $this->send_error('Failed to create backup: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Create database backup using PHP (fallback method)
     */
    private function create_php_backup($db_name, $specific_table = null) {
        $backup = "-- Database Backup\n";
        $backup .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
        $backup .= "-- Database: {$db_name}\n\n";
        $backup .= "SET FOREIGN_KEY_CHECKS=0;\n\n";
        
        // Get tables to backup
        if ($specific_table) {
            $tables = [$specific_table];
        } else {
            $tables = $this->db->list_tables();
        }
        
        foreach ($tables as $table) {
            // Get table structure
            $create_table = $this->db->query("SHOW CREATE TABLE `{$table}`")->row_array();
            $backup .= "\n-- Table structure for `{$table}`\n";
            $backup .= "DROP TABLE IF EXISTS `{$table}`;\n";
            $backup .= $create_table['Create Table'] . ";\n\n";
            
            // Get table data
            $query = $this->db->get($table);
            $rows = $query->result_array();
            
            if (count($rows) > 0) {
                $backup .= "-- Dumping data for table `{$table}`\n";
                
                foreach ($rows as $row) {
                    $values = [];
                    foreach ($row as $value) {
                        if ($value === null) {
                            $values[] = 'NULL';
                        } else {
                            $values[] = "'" . $this->db->escape_str($value) . "'";
                        }
                    }
                    $backup .= "INSERT INTO `{$table}` VALUES (" . implode(', ', $values) . ");\n";
                }
                $backup .= "\n";
            }
        }
        
        $backup .= "SET FOREIGN_KEY_CHECKS=1;\n";
        return $backup;
    }

}