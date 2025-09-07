<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Todo_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    public function get_user_todos($user_id, $user_type, $status = null) {
        $this->db->select('*');
        $this->db->from('todos');
        $this->db->where('user_id', $user_id);
        $this->db->where('user_type', $user_type);
        
        if ($status !== null) {
            $this->db->where('status', $status);
        }
        
        $this->db->order_by('created_at', 'DESC');
        $query = $this->db->get();
        
        return $query->result_array();
    }
    
    public function get_todo_by_id($todo_id) {
        $this->db->where('id', $todo_id);
        $query = $this->db->get('todos');
        
        return $query->row_array();
    }
    
    public function create_todo($data) {
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        $this->db->insert('todos', $data);
        
        if ($this->db->affected_rows() > 0) {
            return $this->db->insert_id();
        }
        
        return false;
    }
    
    public function update_todo($todo_id, $data) {
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        $this->db->where('id', $todo_id);
        $this->db->update('todos', $data);
        
        return $this->db->affected_rows() > 0;
    }
    
    public function delete_todo($todo_id) {
        $this->db->where('id', $todo_id);
        $this->db->delete('todos');
        
        return $this->db->affected_rows() > 0;
    }
    
    public function get_pending_todos_count($user_id, $user_type) {
        $this->db->where('user_id', $user_id);
        $this->db->where('user_type', $user_type);
        $this->db->where('status', 'pending');
        
        return $this->db->count_all_results('todos');
    }
    
    public function get_overdue_todos($user_id, $user_type) {
        $this->db->where('user_id', $user_id);
        $this->db->where('user_type', $user_type);
        $this->db->where('status', 'pending');
        $this->db->where('due_date <', date('Y-m-d H:i:s'));
        
        $query = $this->db->get('todos');
        return $query->result_array();
    }
}
?>