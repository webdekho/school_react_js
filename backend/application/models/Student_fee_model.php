<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Student_fee_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
    }
    
    /**
     * Get student's fee summary including mandatory and optional fees
     */
    public function get_student_fee_summary($student_id, $academic_year_id = null) {
        if (!$academic_year_id) {
            $academic_year_id = $this->get_current_academic_year_id();
        }
        
        $summary = [
            'mandatory' => [
                'semester_1' => ['total' => 0, 'paid' => 0, 'due' => 0, 'fees' => []],
                'semester_2' => ['total' => 0, 'paid' => 0, 'due' => 0, 'fees' => []]
            ],
            'optional' => [
                'semester_1' => ['total' => 0, 'paid' => 0, 'due' => 0, 'fees' => []],
                'semester_2' => ['total' => 0, 'paid' => 0, 'due' => 0, 'fees' => []]
            ],
            'total_due' => 0,
            'mandatory_due' => 0,
            'optional_due' => 0
        ];
        
        // Get all assigned fees for the student
        $this->db->select('sfa.*, fs.is_mandatory, fs.semester, fc.name as category_name');
        $this->db->from('student_fee_assignments sfa');
        $this->db->join('fee_structures fs', 'sfa.fee_structure_id = fs.id');
        $this->db->join('fee_categories fc', 'fs.fee_category_id = fc.id');
        $this->db->where('sfa.student_id', $student_id);
        $this->db->where('fs.academic_year_id', $academic_year_id);
        $this->db->where('sfa.status !=', 'cancelled');
        $query = $this->db->get();
        
        foreach ($query->result_array() as $fee) {
            $type = $fee['is_mandatory'] ? 'mandatory' : 'optional';
            $semester = strtolower(str_replace(' ', '_', $fee['semester']));
            
            $fee_detail = [
                'id' => $fee['id'],
                'category' => $fee['category_name'],
                'total' => floatval($fee['total_amount']),
                'paid' => floatval($fee['paid_amount']),
                'due' => floatval($fee['pending_amount']),
                'due_date' => $fee['due_date'],
                'status' => $fee['status']
            ];
            
            $summary[$type][$semester]['fees'][] = $fee_detail;
            $summary[$type][$semester]['total'] += $fee_detail['total'];
            $summary[$type][$semester]['paid'] += $fee_detail['paid'];
            $summary[$type][$semester]['due'] += $fee_detail['due'];
        }
        
        // Calculate totals
        $summary['mandatory_due'] = $summary['mandatory']['semester_1']['due'] + 
                                   $summary['mandatory']['semester_2']['due'];
        $summary['optional_due'] = $summary['optional']['semester_1']['due'] + 
                                  $summary['optional']['semester_2']['due'];
        $summary['total_due'] = $summary['mandatory_due'] + $summary['optional_due'];
        
        return $summary;
    }
    
    /**
     * Get mandatory fees due for a student
     */
    public function get_mandatory_fees_due($student_id, $semester = null) {
        $this->db->select('sfa.*, fs.semester, fc.name as category_name');
        $this->db->from('student_fee_assignments sfa');
        $this->db->join('fee_structures fs', 'sfa.fee_structure_id = fs.id');
        $this->db->join('fee_categories fc', 'fs.fee_category_id = fc.id');
        $this->db->where('sfa.student_id', $student_id);
        $this->db->where('fs.is_mandatory', 1);
        $this->db->where('sfa.pending_amount >', 0);
        $this->db->where('sfa.status !=', 'cancelled');
        
        if ($semester) {
            $this->db->where('fs.semester', $semester);
        }
        
        $this->db->order_by('sfa.due_date', 'ASC');
        $query = $this->db->get();
        
        return $query->result_array();
    }
    
    /**
     * Calculate total mandatory fees due
     */
    public function calculate_mandatory_due($student_id, $academic_year_id = null) {
        if (!$academic_year_id) {
            $academic_year_id = $this->get_current_academic_year_id();
        }
        
        $this->db->select('SUM(sfa.pending_amount) as total_due');
        $this->db->from('student_fee_assignments sfa');
        $this->db->join('fee_structures fs', 'sfa.fee_structure_id = fs.id');
        $this->db->where('sfa.student_id', $student_id);
        $this->db->where('fs.is_mandatory', 1);
        $this->db->where('fs.academic_year_id', $academic_year_id);
        $this->db->where('sfa.status !=', 'cancelled');
        $query = $this->db->get();
        
        $result = $query->row_array();
        return $result['total_due'] ? floatval($result['total_due']) : 0;
    }
    
    /**
     * Get overdue mandatory fees
     */
    public function get_overdue_mandatory_fees($student_id = null) {
        $this->db->select('sfa.*, s.name as student_name, s.roll_number, 
                          fs.semester, fc.name as category_name, 
                          g.name as grade_name, d.name as division_name');
        $this->db->from('student_fee_assignments sfa');
        $this->db->join('students s', 'sfa.student_id = s.id');
        $this->db->join('fee_structures fs', 'sfa.fee_structure_id = fs.id');
        $this->db->join('fee_categories fc', 'fs.fee_category_id = fc.id');
        $this->db->join('grades g', 's.grade_id = g.id');
        $this->db->join('divisions d', 's.division_id = d.id');
        $this->db->where('fs.is_mandatory', 1);
        $this->db->where('sfa.pending_amount >', 0);
        $this->db->where('sfa.due_date <', date('Y-m-d'));
        $this->db->where('sfa.status !=', 'cancelled');
        
        if ($student_id) {
            $this->db->where('sfa.student_id', $student_id);
        }
        
        $this->db->order_by('sfa.due_date', 'ASC');
        $query = $this->db->get();
        
        return $query->result_array();
    }
    
    /**
     * Record fee payment
     */
    public function record_payment($payment_data) {
        $this->db->trans_start();
        
        // Insert payment record
        $this->db->insert('fee_payments', $payment_data);
        $payment_id = $this->db->insert_id();
        
        // Update student fee assignment
        $this->db->where('id', $payment_data['fee_assignment_id']);
        $this->db->set('paid_amount', 'paid_amount + ' . $payment_data['amount'], FALSE);
        $this->db->set('pending_amount', 'pending_amount - ' . $payment_data['amount'], FALSE);
        $this->db->update('student_fee_assignments');
        
        // Check if fully paid
        $this->db->select('pending_amount');
        $this->db->where('id', $payment_data['fee_assignment_id']);
        $assignment = $this->db->get('student_fee_assignments')->row_array();
        
        if ($assignment['pending_amount'] <= 0) {
            $this->db->where('id', $payment_data['fee_assignment_id']);
            $this->db->update('student_fee_assignments', [
                'status' => 'paid',
                'paid_at' => date('Y-m-d H:i:s')
            ]);
        } else {
            $this->db->where('id', $payment_data['fee_assignment_id']);
            $this->db->update('student_fee_assignments', ['status' => 'partial']);
        }
        
        $this->db->trans_complete();
        
        return $this->db->trans_status() ? $payment_id : false;
    }
    
    /**
     * Get current academic year ID
     */
    private function get_current_academic_year_id() {
        $this->db->select('id');
        $this->db->where('is_active', 1);
        $this->db->limit(1);
        $query = $this->db->get('academic_years');
        $result = $query->row_array();
        return $result ? $result['id'] : null;
    }
}
?>