<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Debug extends CI_Controller {
    
    public function __construct() {
        parent::__construct();
        $this->load->model('Auth_model');
        header('Content-Type: application/json');
    }
    
    public function test_auth() {
        try {
            $mobile = '1111111111';
            $password = 'password';
            $user_type = 'admin';
            
            echo json_encode([
                'status' => 'debug',
                'testing' => [
                    'mobile' => $mobile,
                    'password' => $password,
                    'user_type' => $user_type
                ]
            ]);
            
            // Test database connection
            if (!$this->db->initialize()) {
                echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
                return;
            }
            
            // Check what table we're using
            $table = $this->get_user_table($user_type);
            echo json_encode(['debug' => 'Using table: ' . $table]);
            
            // Check if user exists
            $this->db->where($table . '.mobile', $mobile);
            $this->db->where($table . '.is_active', 1);
            
            if ($user_type === 'staff' || $user_type === 'admin') {
                $this->db->select('staff.*, roles.name as role_name, roles.permissions');
                $this->db->join('roles', 'staff.role_id = roles.id');
            }
            
            $query = $this->db->get($table);
            $user = $query->row_array();
            
            if (!$user) {
                echo json_encode([
                    'status' => 'debug_error', 
                    'message' => 'No user found',
                    'query' => $this->db->last_query()
                ]);
                return;
            }
            
            echo json_encode([
                'status' => 'debug_success',
                'message' => 'User found',
                'user_data' => [
                    'id' => $user['id'],
                    'name' => isset($user['name']) ? $user['name'] : 'N/A',
                    'mobile' => $user['mobile'],
                    'email' => $user['email'],
                    'is_active' => $user['is_active'],
                    'has_password_hash' => !empty($user['password_hash']),
                    'password_verify' => password_verify($password, $user['password_hash'])
                ]
            ]);
            
        } catch (Exception $e) {
            echo json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
    }
    
    private function get_user_table($user_type) {
        switch ($user_type) {
            case 'staff':
            case 'admin':
                return 'staff';
            case 'parent':
                return 'parents';
            default:
                return false;
        }
    }
    
    public function check_db() {
        try {
            // Check staff table
            $this->db->where('mobile', '1111111111');
            $admin = $this->db->get('staff')->row_array();
            
            $this->db->where('mobile', '2222222222');
            $staff = $this->db->get('staff')->row_array();
            
            $this->db->where('mobile', '3333333333');
            $parent = $this->db->get('parents')->row_array();
            
            echo json_encode([
                'status' => 'success',
                'demo_accounts' => [
                    'admin_exists' => !empty($admin),
                    'staff_exists' => !empty($staff),
                    'parent_exists' => !empty($parent),
                    'admin_active' => isset($admin['is_active']) ? $admin['is_active'] : 'field_missing',
                    'staff_active' => isset($staff['is_active']) ? $staff['is_active'] : 'field_missing',
                    'parent_active' => isset($parent['is_active']) ? $parent['is_active'] : 'field_missing'
                ]
            ]);
            
        } catch (Exception $e) {
            echo json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
    }
}