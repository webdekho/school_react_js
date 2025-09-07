<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Fee_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    public function get_pending_fees_summary() {
        $this->db->select('COUNT(DISTINCT students.id) as student_count, SUM(fee_structures.amount) as total_amount');
        $this->db->from('students');
        $this->db->join('fee_structures', 'students.grade_id = fee_structures.grade_id');
        $this->db->join('fee_collections', 'students.id = fee_collections.student_id AND fee_structures.fee_type_id = fee_collections.fee_type_id', 'left');
        $this->db->where('students.is_active', 1);
        $this->db->where('fee_structures.is_active', 1);
        $this->db->where('fee_collections.id IS NULL');
        
        $query = $this->db->get();
        $result = $query->row_array();
        
        return [
            'pending_count' => $result['student_count'] ?: 0,
            'pending_amount' => $result['total_amount'] ?: 0
        ];
    }
    
    public function get_fee_types() {
        $this->db->select('*');
        $this->db->where('is_active', 1);
        $this->db->order_by('name');
        
        $query = $this->db->get('fee_types');
        return $query->result_array();
    }
    
    public function get_student_fees($student_id) {
        $this->db->select('fee_types.name as fee_type_name, fee_structures.amount, fee_collections.amount as paid_amount, fee_collections.collection_date, fee_collections.receipt_number');
        $this->db->from('students');
        $this->db->join('fee_structures', 'students.grade_id = fee_structures.grade_id');
        $this->db->join('fee_types', 'fee_structures.fee_type_id = fee_types.id');
        $this->db->join('fee_collections', 'students.id = fee_collections.student_id AND fee_structures.fee_type_id = fee_collections.fee_type_id', 'left');
        $this->db->where('students.id', $student_id);
        $this->db->where('fee_structures.is_active', 1);
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    public function collect_fee($data) {
        $data['collection_date'] = date('Y-m-d');
        $data['receipt_number'] = $this->generate_receipt_number();
        $data['created_at'] = date('Y-m-d H:i:s');
        
        if ($this->db->insert('fee_collections', $data)) {
            return $this->db->insert_id();
        }
        return false;
    }
    
    private function generate_receipt_number() {
        $prefix = 'RCP';
        $date = date('Ymd');
        
        $this->db->like('receipt_number', $prefix . $date, 'after');
        $this->db->order_by('id', 'DESC');
        $this->db->limit(1);
        
        $query = $this->db->get('fee_collections');
        $last_receipt = $query->row_array();
        
        if ($last_receipt) {
            $last_number = intval(substr($last_receipt['receipt_number'], -4));
            $new_number = $last_number + 1;
        } else {
            $new_number = 1;
        }
        
        return $prefix . $date . str_pad($new_number, 4, '0', STR_PAD_LEFT);
    }
}