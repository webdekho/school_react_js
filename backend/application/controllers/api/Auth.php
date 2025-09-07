<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Auth extends CI_Controller {
    
    // Declare properties to fix PHP 8.2 dynamic property warnings
    public $JWT_lib;
    public $jwt_lib;  // Add lowercase version as well
    public $Auth_model;
    public $db;
    public $session;
    public $form_validation;
    public $input;
    public $load;
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
    }
    
    public function test() {
        echo json_encode([
            'status' => 'success',
            'message' => 'Test endpoint working',
            'data' => [
                'timestamp' => date('Y-m-d H:i:s'),
                'method' => $this->input->method(),
                'php_version' => PHP_VERSION
            ]
        ]);
    }
    
    public function login() {
        try {
            error_log("Login attempt started");
            
            if ($this->input->method() !== 'post') {
                $this->output->set_status_header(405);
                echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
                return;
            }
            
            error_log("Method is POST, getting input");
            $input = json_decode($this->input->raw_input_stream, true);
            error_log("Input received: " . print_r($input, true));
            
            if (!$input) {
                error_log("Invalid JSON input");
                $this->output->set_status_header(400);
                echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input', 'error_code' => 500]);
                return;
            }
            
            if (!isset($input['mobile']) || !isset($input['password'])) {
                $this->output->set_status_header(400);
                echo json_encode(['status' => 'error', 'message' => 'Mobile and password are required']);
                return;
            }
            
            $mobile = $input['mobile'];
            $password = $input['password'];
            $user_type = isset($input['user_type']) ? $input['user_type'] : 'parent';
            
            // Test database connection
            if (!$this->db->initialize()) {
                $this->output->set_status_header(500);
                echo json_encode(['status' => 'error', 'message' => 'Database connection failed', 'error_code' => 500]);
                return;
            }
            
            $user = $this->Auth_model->authenticate_user($mobile, $password, $user_type);
            
            if (!$user) {
                $this->output->set_status_header(401);
                echo json_encode(['status' => 'error', 'message' => 'Invalid credentials']);
                return;
            }
            
            $token_data = [
                'id' => $user['id'],
                'user_type' => $user_type,
                'role_id' => isset($user['role_id']) ? $user['role_id'] : null
            ];
            
            $token = $this->jwt_lib->generate_token($token_data);
            
            // Store token in database
            $this->Auth_model->store_token($user['id'], $user_type, $token);
            
            $response = [
                'status' => 'success',
                'message' => 'Login successful',
                'data' => [
                    'token' => $token,
                    'user' => [
                        'id' => $user['id'],
                        'name' => $user['name'],
                        'mobile' => $user['mobile'],
                        'user_type' => $user_type,
                        'role_id' => isset($user['role_id']) ? $user['role_id'] : null
                    ]
                ]
            ];
            
            echo json_encode($response);
            
        } catch (Exception $e) {
            error_log("Login exception: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            
            $this->output->set_status_header(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'An exception occurred',
                'error_code' => 500,
                'debug' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
    
    public function logout() {
        if ($this->input->method() !== 'post') {
            $this->output->set_status_header(405);
            echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
            return;
        }
        
        $token = $this->get_token_from_header();
        
        if (!$token) {
            $this->output->set_status_header(401);
            echo json_encode(['status' => 'error', 'message' => 'Token required']);
            return;
        }
        
        $decoded = $this->jwt_lib->verify_token($token);
        
        if (!$decoded) {
            $this->output->set_status_header(401);
            echo json_encode(['status' => 'error', 'message' => 'Invalid token']);
            return;
        }
        
        // Revoke token
        $this->Auth_model->revoke_token($token);
        
        echo json_encode(['status' => 'success', 'message' => 'Logout successful']);
    }
    
    public function refresh_token() {
        if ($this->input->method() !== 'post') {
            $this->output->set_status_header(405);
            echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
            return;
        }
        
        $token = $this->get_token_from_header();
        
        if (!$token) {
            $this->output->set_status_header(401);
            echo json_encode(['status' => 'error', 'message' => 'Token required']);
            return;
        }
        
        $decoded = $this->jwt_lib->verify_token($token);
        
        if (!$decoded) {
            $this->output->set_status_header(401);
            echo json_encode(['status' => 'error', 'message' => 'Invalid token']);
            return;
        }
        
        // Generate new token
        $token_data = [
            'id' => $decoded['user_id'],
            'user_type' => $decoded['user_type'],
            'role_id' => $decoded['role_id']
        ];
        
        $new_token = $this->jwt_lib->generate_token($token_data);
        
        // Revoke old token and store new one
        $this->Auth_model->revoke_token($token);
        $this->Auth_model->store_token($decoded['user_id'], $decoded['user_type'], $new_token);
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Token refreshed',
            'data' => ['token' => $new_token]
        ]);
    }
    
    public function me() {
        if ($this->input->method() !== 'get') {
            $this->output->set_status_header(405);
            echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
            return;
        }

        $token = $this->get_token_from_header();

        if (!$token) {
            $this->output->set_status_header(401);
            echo json_encode(['status' => 'error', 'message' => 'Token required']);
            return;
        }

        $decoded = $this->jwt_lib->verify_token($token);

        if (!$decoded) {
            $this->output->set_status_header(401);
            echo json_encode(['status' => 'error', 'message' => 'Invalid token']);
            return;
        }

        $user = $this->Auth_model->get_user_by_id($decoded['user_id'], $decoded['user_type']);

        if (!$user) {
            $this->output->set_status_header(404);
            echo json_encode(['status' => 'error', 'message' => 'User not found']);
            return;
        }

        echo json_encode(['status' => 'success', 'data' => $user]);
    }

    private function get_token_from_header() {
        $headers = $this->input->request_headers();
        
        if (isset($headers['Authorization'])) {
            $auth_header = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
                return $matches[1];
            }
        }
        
        return false;
    }
}