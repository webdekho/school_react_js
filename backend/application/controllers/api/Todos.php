<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Todos extends CI_Controller {
    
    public $Todo_model;
    public $db;
    public $input;
    public $load;
    public $output;
    public $session;
    public $form_validation;
    
    public function __construct() {
        parent::__construct();
        $this->load->model('Todo_model');
        header('Content-Type: application/json');
        
        if ($this->input->method() === 'options') {
            exit();
        }
    }
    
    public function index() {
        try {
            if ($this->input->method() === 'get') {
                $this->get_todos();
            } elseif ($this->input->method() === 'post') {
                $this->create_todo();
            } else {
                $this->output->set_status_header(405);
                echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
            }
        } catch (Exception $e) {
            error_log("Todos error: " . $e->getMessage());
            $this->output->set_status_header(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'An error occurred',
                'debug' => $e->getMessage()
            ]);
        }
    }
    
    private function get_todos() {
        // Get user info from token (you might need to implement auth middleware)
        $user_id = 1; // For now, use a default user ID
        $user_type = 'admin'; // Default user type
        
        $todos = $this->Todo_model->get_user_todos($user_id, $user_type);
        
        echo json_encode([
            'status' => 'success',
            'data' => $todos
        ]);
    }
    
    private function create_todo() {
        $input = json_decode($this->input->raw_input_stream, true);
        
        if (!$input) {
            $this->output->set_status_header(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input']);
            return;
        }
        
        if (!isset($input['title']) || empty(trim($input['title']))) {
            $this->output->set_status_header(400);
            echo json_encode(['status' => 'error', 'message' => 'Title is required']);
            return;
        }
        
        // Get user info from token
        $user_id = 1; // For now, use a default user ID
        $user_type = 'admin'; // Default user type
        
        $todo_data = [
            'user_id' => $user_id,
            'user_type' => $user_type,
            'title' => trim($input['title']),
            'description' => isset($input['description']) ? trim($input['description']) : '',
            'priority' => isset($input['priority']) ? $input['priority'] : 'medium',
            'status' => 'pending',
            'due_date' => isset($input['due_date']) ? $input['due_date'] : date('Y-m-d H:i:s', strtotime('+1 day'))
        ];
        
        $todo_id = $this->Todo_model->create_todo($todo_data);
        
        if ($todo_id) {
            $todo = $this->Todo_model->get_todo_by_id($todo_id);
            echo json_encode([
                'status' => 'success',
                'message' => 'Todo created successfully',
                'data' => $todo
            ]);
        } else {
            $this->output->set_status_header(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to create todo']);
        }
    }
    
    public function update($todo_id) {
        try {
            if ($this->input->method() !== 'put') {
                $this->output->set_status_header(405);
                echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
                return;
            }
            
            $input = json_decode($this->input->raw_input_stream, true);
            
            if (!$input) {
                $this->output->set_status_header(400);
                echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input']);
                return;
            }
            
            // Get user info from token
            $user_id = 1; // For now, use a default user ID
            $user_type = 'admin'; // Default user type
            
            // Check if todo exists and belongs to user
            $existing_todo = $this->Todo_model->get_todo_by_id($todo_id);
            if (!$existing_todo || ($existing_todo['user_id'] != $user_id)) {
                $this->output->set_status_header(404);
                echo json_encode(['status' => 'error', 'message' => 'Todo not found']);
                return;
            }
            
            $update_data = [];
            if (isset($input['status'])) $update_data['status'] = $input['status'];
            if (isset($input['title'])) $update_data['title'] = trim($input['title']);
            if (isset($input['description'])) $update_data['description'] = trim($input['description']);
            if (isset($input['priority'])) $update_data['priority'] = $input['priority'];
            if (isset($input['due_date'])) $update_data['due_date'] = $input['due_date'];
            
            if (empty($update_data)) {
                $this->output->set_status_header(400);
                echo json_encode(['status' => 'error', 'message' => 'No valid fields to update']);
                return;
            }
            
            $success = $this->Todo_model->update_todo($todo_id, $update_data);
            
            if ($success) {
                $updated_todo = $this->Todo_model->get_todo_by_id($todo_id);
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Todo updated successfully',
                    'data' => $updated_todo
                ]);
            } else {
                $this->output->set_status_header(500);
                echo json_encode(['status' => 'error', 'message' => 'Failed to update todo']);
            }
            
        } catch (Exception $e) {
            error_log("Todo update error: " . $e->getMessage());
            $this->output->set_status_header(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'An error occurred',
                'debug' => $e->getMessage()
            ]);
        }
    }
    
    public function delete($todo_id) {
        try {
            if ($this->input->method() !== 'delete') {
                $this->output->set_status_header(405);
                echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
                return;
            }
            
            // Get user info from token
            $user_id = 1; // For now, use a default user ID
            
            // Check if todo exists and belongs to user
            $existing_todo = $this->Todo_model->get_todo_by_id($todo_id);
            if (!$existing_todo || ($existing_todo['user_id'] != $user_id)) {
                $this->output->set_status_header(404);
                echo json_encode(['status' => 'error', 'message' => 'Todo not found']);
                return;
            }
            
            $success = $this->Todo_model->delete_todo($todo_id);
            
            if ($success) {
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Todo deleted successfully'
                ]);
            } else {
                $this->output->set_status_header(500);
                echo json_encode(['status' => 'error', 'message' => 'Failed to delete todo']);
            }
            
        } catch (Exception $e) {
            error_log("Todo delete error: " . $e->getMessage());
            $this->output->set_status_header(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'An error occurred',
                'debug' => $e->getMessage()
            ]);
        }
    }
}
?>