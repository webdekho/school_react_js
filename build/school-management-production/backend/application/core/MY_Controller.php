<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class API_Controller extends CI_Controller {
    
    protected $user;
    protected $user_type;
    protected $permissions = [];
    
    // Declare properties to fix PHP 8.2 dynamic property warnings
    public $JWT_lib;
    public $jwt_lib;  // Add lowercase version as well
    public $Auth_model;
    public $db;
    public $session;
    public $form_validation;
    public $input;
    public $load;
    public $uri;
    public $output;
    
    public function __construct() {
        parent::__construct();
        $this->load->library('JWT_lib');
        $this->load->model('Auth_model');
        
        // Fix for PHP 8.2 dynamic property warning
        $this->jwt_lib = $this->jwt_lib;
        
        header('Content-Type: application/json');
        
        if ($this->input->method() === 'options') {
            exit();
        }
        
        $this->authenticate();
    }
    
    private function authenticate() {
        // Allow public access to announcement attachment downloads
        if ($this->uri->segment(3) === 'public_download_attachment') {
            return; // Skip authentication for public file downloads
        }
        
        
        
        
        
        $token = $this->get_token_from_header();
        
        if (!$token) {
            $this->send_error('Token required', 401);
            return;
        }
        
        $decoded = $this->jwt_lib->verify_token($token);
        
        if (!$decoded) {
            $this->send_error('Invalid or expired token', 401);
            return;
        }
        
        // Verify token exists in database and is not revoked
        if (!$this->Auth_model->is_token_valid($token)) {
            $this->send_error('Token has been revoked', 401);
            return;
        }
        
        $this->user = $this->Auth_model->get_user_by_token($token);
        
        if (!$this->user) {
            $this->send_error('User not found', 401);
            return;
        }
        
        // Never default to admin; if user_type is missing, treat as non-admin (staff)
        $this->user_type = isset($this->user['user_type']) && $this->user['user_type']
            ? $this->user['user_type']
            : 'staff';
        
        if (isset($this->user['permissions'])) {
            $permissions_data = json_decode($this->user['permissions'], true);
            $this->permissions = is_array($permissions_data) ? $permissions_data : ['*'];
        } else {
            // For admin users or debug mode, give all permissions
            if ($this->user_type === 'admin' || !isset($this->user['permissions'])) {
                $this->permissions = ['*']; // Give all permissions for admin/debug
            } else {
                $this->permissions = [];
            }
        }
    }
    
    protected function check_permission($permission) {
        if (in_array('*', $this->permissions)) {
            return true;
        }
        
        return in_array($permission, $this->permissions);
    }
    
    protected function require_permission($permission) {
        if (!$this->check_permission($permission)) {
            $this->send_error('Insufficient permissions', 403);
            return false;
        }
        return true;
    }
    
    protected function require_any_permission($permissions) {
        if (!is_array($permissions)) {
            $permissions = [$permissions];
        }
        
        foreach ($permissions as $permission) {
            if ($this->check_permission($permission)) {
                return true;
            }
        }
        
        $this->send_error('Insufficient permissions', 403);
        return false;
    }
    
    protected function require_user_type($allowed_types) {
        if (!is_array($allowed_types)) {
            $allowed_types = [$allowed_types];
        }
        
        if (!in_array($this->user_type, $allowed_types)) {
            $this->send_error('Access denied for user type', 403);
            return false;
        }
        return true;
    }
    
    protected function send_response($data, $message = 'Success', $status_code = 200) {
        $this->output->set_status_header($status_code);
        echo json_encode([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ]);
    }
    
    protected function send_error($message, $status_code = 400, $errors = null) {
        $this->output->set_status_header($status_code);
        $response = [
            'status' => 'error',
            'message' => $message
        ];
        
        if ($errors) {
            $response['errors'] = $errors;
        }
        
        echo json_encode($response);
        exit();
    }
    
    protected function validate_input($rules) {
        $this->load->library('form_validation');
        
        $input = json_decode($this->input->raw_input_stream, true);
        
        if (!$input) {
            $this->send_error('Invalid JSON input', 400);
            return false;
        }
        
        foreach ($rules as $field => $rule) {
            $this->form_validation->set_data($input);
            $this->form_validation->set_rules($field, $field, $rule);
        }
        
        if (!$this->form_validation->run()) {
            $errors = $this->form_validation->error_array();
            $this->send_error('Validation failed', 400, $errors);
            return false;
        }
        
        return $input;
    }
    
    protected function get_input() {
        return json_decode($this->input->raw_input_stream, true);
    }
    
    protected function log_activity($action, $table_name = null, $record_id = null, $old_values = null, $new_values = null) {
        $log_data = [
            'user_id' => $this->user['id'],
            'user_type' => $this->user_type,
            'action' => $action,
            'table_name' => $table_name,
            'record_id' => $record_id,
            'old_values' => $old_values ? json_encode($old_values) : null,
            'new_values' => $new_values ? json_encode($new_values) : null,
            'ip_address' => $this->input->ip_address(),
            'user_agent' => $this->input->user_agent(),
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        $this->db->insert('audit_logs', $log_data);
    }
    
    private function get_token_from_header() {
        // First try to get token from Authorization header
        $headers = $this->input->request_headers();
        
        if (isset($headers['Authorization'])) {
            $auth_header = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
                return $matches[1];
            }
        }
        
        // For downloads, also check URL parameter
        $token_param = $this->input->get('token');
        if ($token_param) {
            return $token_param;
        }
        
        return false;
    }
}