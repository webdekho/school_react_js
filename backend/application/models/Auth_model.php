<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Auth_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    public function authenticate_user($mobile, $password, $user_type) {
        $table = $this->get_user_table($user_type);
        
        if (!$table) {
            return false;
        }
        
        $this->db->where($table . '.mobile', $mobile);
        $this->db->where($table . '.is_active', 1);
        
        if ($user_type === 'staff' || $user_type === 'admin') {
            $this->db->select('staff.*, roles.name as role_name, roles.permissions');
            $this->db->join('roles', 'staff.role_id = roles.id');
        }
        
        $query = $this->db->get($table);
        $user = $query->row_array();
        
        if (!$user) {
            return false;
        }
        
        if (!password_verify($password, $user['password_hash'])) {
            return false;
        }
        
        // Log successful login
        $this->log_user_activity($user['id'], $user_type, 'login', 'User logged in successfully');
        
        return $user;
    }
    
    public function store_token($user_id, $user_type, $token) {
        $token_hash = hash('sha256', $token);
        
        $data = [
            'user_id' => $user_id,
            'user_type' => $user_type,
            'token_hash' => $token_hash,
            'expires_at' => date('Y-m-d H:i:s', time() + 7200), // 2 hours
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        return $this->db->insert('auth_tokens', $data);
    }
    
    public function revoke_token($token) {
        $token_hash = hash('sha256', $token);
        
        $this->db->where('token_hash', $token_hash);
        return $this->db->update('auth_tokens', ['is_revoked' => 1]);
    }
    
    public function is_token_valid($token) {
        $token_hash = hash('sha256', $token);
        
        $this->db->where('token_hash', $token_hash);
        $this->db->where('is_revoked', 0);
        $this->db->where('expires_at >', date('Y-m-d H:i:s'));
        
        $query = $this->db->get('auth_tokens');
        return $query->num_rows() > 0;
    }
    
    public function get_user_by_token($token) {
        $token_hash = hash('sha256', $token);
        
        $this->db->select('user_id, user_type');
        $this->db->where('token_hash', $token_hash);
        $this->db->where('is_revoked', 0);
        $this->db->where('expires_at >', date('Y-m-d H:i:s'));
        
        $query = $this->db->get('auth_tokens');
        $token_data = $query->row_array();
        
        if (!$token_data) {
            return false;
        }
        
        $table = $this->get_user_table($token_data['user_type']);
        
        if (!$table) {
            return false;
        }
        
        $this->db->where($table . '.id', $token_data['user_id']);
        $this->db->where($table . '.is_active', 1);
        
        if ($token_data['user_type'] === 'staff' || $token_data['user_type'] === 'admin') {
            $this->db->select($table . '.*, roles.name as role_name, roles.permissions');
            $this->db->join('roles', $table . '.role_id = roles.id');
        }
        
        $query = $this->db->get($table);
        $user = $query->row_array();
        
        if ($user) {
            $user['user_type'] = $token_data['user_type'];
        }
        
        return $user;
    }
    
    public function get_user_by_id($user_id, $user_type) {
        $table = $this->get_user_table($user_type);

        if (!$table) {
            return false;
        }

        $this->db->where($table . '.id', $user_id);

        if ($user_type === 'staff' || $user_type === 'admin') {
            $this->db->select('staff.*, roles.name as role_name, roles.permissions');
            $this->db->join('roles', 'staff.role_id = roles.id');
        }

        $query = $this->db->get($table);
        $user = $query->row_array();

        if ($user) {
            $user['user_type'] = $user_type;
            unset($user['password_hash']);
        }

        return $user;
    }

    public function create_user($user_data, $user_type) {
        $table = $this->get_user_table($user_type);
        
        if (!$table) {
            return false;
        }
        
        $user_data['password_hash'] = password_hash($user_data['password'], PASSWORD_DEFAULT);
        unset($user_data['password']);
        
        $user_data['created_at'] = date('Y-m-d H:i:s');
        
        if ($this->db->insert($table, $user_data)) {
            $user_id = $this->db->insert_id();
            $this->log_user_activity($user_id, $user_type, 'user_created', 'New user account created');
            return $user_id;
        }
        
        return false;
    }
    
    public function update_password($user_id, $user_type, $new_password) {
        $table = $this->get_user_table($user_type);
        
        if (!$table) {
            return false;
        }
        
        $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
        
        $this->db->where('id', $user_id);
        $result = $this->db->update($table, ['password_hash' => $password_hash]);
        
        if ($result) {
            $this->log_user_activity($user_id, $user_type, 'password_updated', 'User password updated');
        }
        
        return $result;
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
    
    private function log_user_activity($user_id, $user_type, $action, $description) {
        $log_data = [
            'user_id' => $user_id,
            'user_type' => $user_type,
            'action' => $action,
            'table_name' => $this->get_user_table($user_type),
            'record_id' => $user_id,
            'ip_address' => $this->input->ip_address(),
            'user_agent' => $this->input->user_agent(),
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        $this->db->insert('audit_logs', $log_data);
    }
    
    public function cleanup_expired_tokens() {
        $this->db->where('expires_at <', date('Y-m-d H:i:s'));
        return $this->db->delete('auth_tokens');
    }
}