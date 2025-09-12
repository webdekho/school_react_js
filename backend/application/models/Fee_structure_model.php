<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Fee_structure_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    public function get_fee_structures_paginated($limit, $offset, $search = null, $academic_year_id = null, $grade_id = null, $category_id = null) {
        $this->db->select('fs.*, ay.name as academic_year_name, g.name as grade_name, d.name as division_name, fc.name as category_name, COALESCE(fc.name, "Unknown Category") as category_display_name');
        $this->db->from('fee_structures fs');
        $this->db->join('academic_years ay', 'fs.academic_year_id = ay.id');
        $this->db->join('grades g', 'fs.grade_id = g.id', 'left');
        $this->db->join('divisions d', 'fs.division_id = d.id', 'left');
        $this->db->join('fee_categories fc', 'fs.fee_category_id = fc.id', 'left');
        $this->db->where('fs.is_active', 1);
        
        if ($academic_year_id) {
            $this->db->where('fs.academic_year_id', $academic_year_id);
        }
        
        if ($grade_id) {
            $this->db->where('fs.grade_id', $grade_id);
        }
        
        if ($category_id) {
            $this->db->where('fs.fee_category_id', $category_id);
        }
        
        
        if ($search) {
            $this->db->group_start();
            $this->db->like('fc.name', $search);
            $this->db->or_like('g.name', $search);
            $this->db->or_like('d.name', $search);
            $this->db->group_end();
        }
        
        $this->db->order_by('fc.name, g.name, d.name');
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    public function count_fee_structures($search = null, $academic_year_id = null, $grade_id = null, $category_id = null) {
        $this->db->from('fee_structures fs');
        $this->db->join('grades g', 'fs.grade_id = g.id', 'left');
        $this->db->join('divisions d', 'fs.division_id = d.id', 'left');
        $this->db->join('fee_categories fc', 'fs.fee_category_id = fc.id', 'left');
        $this->db->where('fs.is_active', 1);
        
        if ($academic_year_id) {
            $this->db->where('fs.academic_year_id', $academic_year_id);
        }
        
        if ($grade_id) {
            $this->db->where('fs.grade_id', $grade_id);
        }
        
        if ($category_id) {
            $this->db->where('fs.fee_category_id', $category_id);
        }
        
        
        if ($search) {
            $this->db->group_start();
            $this->db->like('fc.name', $search);
            $this->db->or_like('g.name', $search);
            $this->db->or_like('d.name', $search);
            $this->db->group_end();
        }
        
        return $this->db->count_all_results();
    }
    
    public function get_fee_structure_by_id($id) {
        $this->db->select('fs.*, ay.name as academic_year_name, g.name as grade_name, d.name as division_name, fc.name as category_name, COALESCE(fc.name, "Unknown Category") as category_display_name');
        $this->db->from('fee_structures fs');
        $this->db->join('academic_years ay', 'fs.academic_year_id = ay.id');
        $this->db->join('grades g', 'fs.grade_id = g.id', 'left');
        $this->db->join('divisions d', 'fs.division_id = d.id', 'left');
        $this->db->join('fee_categories fc', 'fs.fee_category_id = fc.id', 'left');
        $this->db->where('fs.id', $id);
        $this->db->where('fs.is_active', 1);
        
        $query = $this->db->get();
        return $query->row_array();
    }
    
    public function create_fee_structure($data) {
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        // Debug logging
        error_log("create_fee_structure called with data: " . json_encode($data));
        
        // Log database queries for debugging
        $this->db->save_queries = TRUE;
        
        $this->db->trans_start();
        
        // Check if a specific semester is provided in the data
        $create_both_semesters = !isset($data['semester']) || empty($data['semester']);
        
        // Create single fee structure record (applies to both semesters by default)
        if (!isset($data['semester']) || empty($data['semester']) || $data['semester'] === '') {
            $data['semester'] = null; // NULL means applies to both semesters
        }
        
        // Check for duplicate structure (division_id is always null now)
        if ($this->check_duplicate($data['academic_year_id'], $data['grade_id'], null, $data['fee_category_id'])) {
            $this->db->trans_rollback();
            return ['error' => 'A fee structure already exists for this combination'];
        }
        
        // Log the data being inserted
        error_log("Inserting fee structure with data: " . json_encode($data));
        
        if ($this->db->insert('fee_structures', $data)) {
            $fee_structure_id = $this->db->insert_id();
            error_log("Fee structure created with ID: " . $fee_structure_id);
            
            // Auto-assign to existing students if applicable
            $this->auto_assign_to_students($fee_structure_id);
            
            $this->db->trans_complete();
            
            if ($this->db->trans_status() === FALSE) {
                error_log("Transaction failed during fee structure creation");
                return false;
            }
            
            return $fee_structure_id;
        } else {
            // Log database error
            $db_error = $this->db->error();
            error_log("Database insert failed: " . json_encode($db_error));
            error_log("Last query: " . $this->db->last_query());
        }
        
        $this->db->trans_complete();
        return false;
    }
    
    public function update_fee_structure($id, $data) {
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        $this->db->where('id', $id);
        return $this->db->update('fee_structures', $data);
    }
    
    public function delete_fee_structure($id, $force = false) {
        // Check if structure has active assignments
        $this->db->where('fee_structure_id', $id);
        $this->db->where('is_active', 1);
        $count = $this->db->count_all_results('student_fee_assignments');
        
        if ($count > 0 && !$force) {
            return ['error' => 'Cannot delete fee structure. It has ' . $count . ' active assignments.', 'count' => $count];
        }
        
        $this->db->trans_start();
        
        if ($count > 0 && $force) {
            // Cancel all active assignments for this fee structure
            $this->db->where('fee_structure_id', $id);
            $this->db->where('is_active', 1);
            $this->db->update('student_fee_assignments', [
                'status' => 'cancelled',
                'is_active' => 0,
                'updated_at' => date('Y-m-d H:i:s'),
                'cancellation_reason' => 'Fee structure deleted by admin'
            ]);
            
            log_message('info', 'Force deleted fee structure ' . $id . ' and cancelled ' . $count . ' active assignments');
        }
        
        // Soft delete the fee structure
        $this->db->where('id', $id);
        $result = $this->db->update('fee_structures', [
            'is_active' => 0, 
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        
        $this->db->trans_complete();
        
        if ($this->db->trans_status() === FALSE) {
            return false;
        }
        
        return true;
    }
    
    private function auto_assign_to_students($fee_structure_id) {
        $structure = $this->get_fee_structure_by_id($fee_structure_id);
        if (!$structure) return;
        
        // Build query to get applicable students
        $this->db->select('s.id as student_id');
        $this->db->from('students s');
        $this->db->where('s.is_active', 1);
        
        // Filter by grade if specified
        if ($structure['grade_id']) {
            $this->db->where('s.grade_id', $structure['grade_id']);
        }
        
        // Division filtering removed - fee structures now apply to entire grade
        
        $students = $this->db->get()->result_array();
        
        // Create assignments for each student
        foreach ($students as $student) {
            // Check if assignment already exists for this fee structure
            $this->db->where('student_id', $student['student_id']);
            $this->db->where('fee_structure_id', $fee_structure_id);
            $this->db->where('is_active', 1);
            $existing = $this->db->get('student_fee_assignments')->row_array();
            
            if (!$existing) {
                // Create assignment - use 'Semester 1' as default for both-semester fees
                $semester = $structure['semester'] ?: 'Semester 1';
                
                $assignment_data = [
                    'student_id' => $student['student_id'],
                    'fee_structure_id' => $fee_structure_id,
                    'semester' => $semester,
                    'total_amount' => $structure['amount'],
                    'paid_amount' => 0.00,
                    'pending_amount' => $structure['amount'],
                    'due_date' => $structure['due_date'],
                    'late_fee_applied' => 0.00,
                    'status' => 'pending',
                    'is_active' => 1,
                    'assigned_at' => date('Y-m-d H:i:s')
                ];
                
                // Try to insert, ignore if duplicate
                if (!$this->db->insert('student_fee_assignments', $assignment_data)) {
                    $error = $this->db->error();
                    if ($error['code'] !== 1062) { // Only log non-duplicate errors
                        log_message('error', 'Failed to auto-assign fee structure ' . $fee_structure_id . ' to student ' . $student['student_id'] . ': ' . $error['message']);
                    }
                }
            }
        }
    }
    
    public function assign_fee_to_student($student_id, $fee_structure_id) {
        $structure = $this->get_fee_structure_by_id($fee_structure_id);
        if (!$structure) return false;
        
        // Check if assignment already exists
        $this->db->where('student_id', $student_id);
        $this->db->where('fee_structure_id', $fee_structure_id);
        $this->db->where('is_active', 1);
        $existing = $this->db->get('student_fee_assignments')->row_array();
        
        if ($existing) {
            return $existing['id']; // Already assigned
        }
        
        $assignment_data = [
            'student_id' => $student_id,
            'fee_structure_id' => $fee_structure_id,
            'semester' => $structure['semester'] ?: 'Semester 1',
            'total_amount' => $structure['amount'],
            'paid_amount' => 0.00,
            'pending_amount' => $structure['amount'],
            'due_date' => $structure['due_date'],
            'late_fee_applied' => 0.00,
            'status' => 'pending',
            'is_active' => 1,
            'assigned_at' => date('Y-m-d H:i:s')
        ];
        
        if ($this->db->insert('student_fee_assignments', $assignment_data)) {
            return $this->db->insert_id();
        }
        
        return false;
    }
    
    public function get_student_fee_assignments($student_id, $academic_year_id = null) {
        $this->db->select('sfa.*, fs.fee_category_id, fc.name as category_name, fs.amount as original_amount, fs.due_date as original_due_date');
        $this->db->from('student_fee_assignments sfa');
        $this->db->join('fee_structures fs', 'sfa.fee_structure_id = fs.id');
        $this->db->join('fee_categories fc', 'fs.fee_category_id = fc.id');
        $this->db->where('sfa.student_id', $student_id);
        $this->db->where('sfa.is_active', 1);
        $this->db->where('sfa.status !=', 'cancelled');
        
        if ($academic_year_id) {
            $this->db->where('fs.academic_year_id', $academic_year_id);
        }
        
        $this->db->order_by('fc.name, sfa.due_date');
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    public function get_structure_statistics($id) {
        $stats = [];
        
        // Total students assigned
        $this->db->where('fee_structure_id', $id);
        $this->db->where('is_active', 1);
        $stats['total_students'] = $this->db->count_all_results('student_fee_assignments');
        
        // Total amount expected
        $structure = $this->get_fee_structure_by_id($id);
        $stats['expected_amount'] = $structure['amount'] * $stats['total_students'];
        
        // Total collected
        $this->db->select('SUM(sfa.paid_amount) as collected_amount');
        $this->db->from('student_fee_assignments sfa');
        $this->db->where('sfa.fee_structure_id', $id);
        $this->db->where('sfa.is_active', 1);
        $query = $this->db->get();
        $result = $query->row_array();
        $stats['collected_amount'] = $result['collected_amount'] ?: 0;
        
        // Pending amount
        $stats['pending_amount'] = $stats['expected_amount'] - $stats['collected_amount'];
        
        // Students by status
        $this->db->select('status, COUNT(*) as count');
        $this->db->from('student_fee_assignments');
        $this->db->where('fee_structure_id', $id);
        $this->db->where('is_active', 1);
        $this->db->group_by('status');
        $query = $this->db->get();
        
        $status_counts = [];
        foreach ($query->result_array() as $row) {
            $status_counts[$row['status']] = $row['count'];
        }
        $stats['status_counts'] = $status_counts;
        
        return $stats;
    }
    
    public function check_duplicate($academic_year_id, $grade_id, $division_id, $fee_category_id, $exclude_id = null) {
        $this->db->where('academic_year_id', $academic_year_id);
        $this->db->where('fee_category_id', $fee_category_id);
        $this->db->where('is_active', 1);
        
        if ($grade_id) {
            $this->db->where('grade_id', $grade_id);
        } else {
            $this->db->where('grade_id IS NULL');
        }
        
        // Division is always NULL for grade-only fee structures
        $this->db->where('division_id IS NULL');
        
        if ($exclude_id) {
            $this->db->where('id !=', $exclude_id);
        }
        
        return $this->db->count_all_results('fee_structures') > 0;
    }
    
    // Check if mandatory fee exists for specific semester
    public function check_mandatory_fee_exists($academic_year_id, $grade_id, $division_id, $fee_category_id, $semester) {
        $this->db->where('academic_year_id', $academic_year_id);
        $this->db->where('fee_category_id', $fee_category_id);
        $this->db->where('is_mandatory', 1);
        $this->db->where('semester', $semester);
        $this->db->where('is_active', 1);
        
        // Check for grade-specific or universal fees
        if ($grade_id) {
            $this->db->where('grade_id', $grade_id);
        } else {
            $this->db->where('grade_id IS NULL');
        }
        
        // Division is always NULL for grade-only fee structures
        $this->db->where('division_id IS NULL');
        
        $query = $this->db->get('fee_structures');
        return $query->num_rows() > 0;
    }
}