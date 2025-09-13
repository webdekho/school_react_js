<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Fee_collection_model extends CI_Model {
    
    public $last_error = null;
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    public function get_last_error() {
        return $this->last_error;
    }
    
    public function collect_fee($data) {
        $this->db->trans_start();
        
        log_message('debug', 'Fee_collection_model::collect_fee called with data: ' . json_encode($data));
        
        try {
            // Generate receipt number and add required fields
            $data['receipt_number'] = $this->generate_receipt_number();
            $data['collection_date'] = date('Y-m-d');
            
            // Ensure required fields exist
            if (!isset($data['payment_reference'])) {
                $data['payment_reference'] = $data['reference_number'] ?? null;
            }
            if (!isset($data['transaction_id'])) {
                $data['transaction_id'] = null;
            }
            
            // Handle optional fees - create assignments for them
            if (!empty($data['optional_fees']) && is_array($data['optional_fees'])) {
                $this->load->model('Fee_structure_model');
                
                foreach ($data['optional_fees'] as $optional_fee) {
                    // Create assignment for optional fee
                    $assignment_id = $this->Fee_structure_model->assign_fee_to_student($data['student_id'], $optional_fee['fee_structure_id']);
                    
                    if ($assignment_id) {
                        log_message('debug', 'Created optional fee assignment: ' . $assignment_id . ' for student: ' . $data['student_id']);
                    }
                }
            }
            
            // For direct payments, create a minimal fee structure first
            if (!empty($data['is_direct_payment']) && !empty($data['fee_category_id'])) {
                log_message('debug', 'Processing direct payment');
                
                $this->load->model('Academic_year_model');
                $current_year = $this->Academic_year_model->get_default_academic_year();
                
                // Create minimal fee structure - handle NULL values properly
                $fee_structure_data = [
                    'fee_category_id' => $data['fee_category_id'],
                    'academic_year_id' => $current_year ? $current_year['id'] : 1,
                    'semester' => 'Semester 1', // Use valid ENUM value
                    'amount' => $data['amount'],
                    'due_date' => isset($data['direct_fee_due_date']) ? $data['direct_fee_due_date'] : date('Y-m-d'),
                    'is_mandatory' => 0,
                    'is_active' => 1,
                    'grade_id' => 0, // Use 0 instead of NULL
                    'division_id' => 0, // Use 0 instead of NULL
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ];
                
                // Add description only if field exists
                if (isset($data['direct_fee_description'])) {
                    $fee_structure_data['description'] = $data['direct_fee_description'];
                }
                
                if (!$this->db->insert('fee_structures', $fee_structure_data)) {
                    $error = $this->db->error();
                    log_message('error', 'Fee structure insert failed: ' . json_encode($error));
                    throw new Exception('Failed to create fee structure: ' . $error['message']);
                }
                $fee_structure_id = $this->db->insert_id();
                
                // Create assignment with only existing fields
                $assignment_data = [
                    'student_id' => $data['student_id'],
                    'fee_structure_id' => $fee_structure_id,
                    'total_amount' => $data['amount'],
                    'pending_amount' => $data['amount'],
                    'paid_amount' => 0.00,
                    'due_date' => isset($data['direct_fee_due_date']) ? $data['direct_fee_due_date'] : date('Y-m-d'),
                    'status' => 'pending',
                    'semester' => 'Semester 1', // Use valid ENUM value
                    'assigned_at' => date('Y-m-d H:i:s')
                    // Removed: created_at, updated_at, is_active (columns don't exist)
                ];
                
                if (!$this->db->insert('student_fee_assignments', $assignment_data)) {
                    $error = $this->db->error();
                    log_message('error', 'Assignment insert failed: ' . json_encode($error));
                    throw new Exception('Failed to create assignment: ' . $error['message']);
                }
                $data['student_fee_assignment_id'] = $this->db->insert_id();
            }
            
            // Store selected fee information in remarks for receipt breakdown
            $selected_fee_info = [];
            if (!empty($data['student_fee_assignment_id'])) {
                $selected_fee_info[] = 'mandatory:' . $data['student_fee_assignment_id'];
            }
            if (!empty($data['optional_fees']) && is_array($data['optional_fees'])) {
                foreach ($data['optional_fees'] as $optional_fee) {
                    $selected_fee_info[] = 'optional:' . $optional_fee['fee_structure_id'];
                }
            }
            
            // Clean up fields that don't belong in fee_collections table
            $clean_data = $data;
            unset($clean_data['is_direct_payment']);
            unset($clean_data['fee_category_id']);
            unset($clean_data['direct_fee_due_date']);
            unset($clean_data['direct_fee_description']);
            unset($clean_data['reference_number']); 
            unset($clean_data['collected_by_staff_id']); 
            unset($clean_data['payment_reference']); // This field doesn't exist
            unset($clean_data['transaction_id']); // This field doesn't exist
            
            // Store selected fee information in remarks
            if (!empty($selected_fee_info)) {
                $clean_data['remarks'] = 'SELECTED_FEES:' . implode(',', $selected_fee_info) . ($clean_data['remarks'] ? '|' . $clean_data['remarks'] : '');
            }
            
            // Keep only the most basic fields that should exist
            $basic_fields = [
                'student_id',
                'amount',
                'payment_method',
                'remarks',
                'receipt_number',
                'collection_date',
                'fee_type_id', // Required for foreign key constraint
                'collected_by' // Required for foreign key constraint
            ];
            
            // Add required foreign key fields
            $clean_data['fee_type_id'] = 1; // Use a safe default
            $clean_data['collected_by'] = $data['collected_by_staff_id'] ?? 1; // Staff ID who collected
            
            $clean_data = array_intersect_key($clean_data, array_flip($basic_fields));
            
            // Insert fee collection record
            if (!$this->db->insert('fee_collections', $clean_data)) {
                $error = $this->db->error();
                log_message('error', 'Fee collection insert failed: ' . json_encode($error));
                throw new Exception('Failed to create fee collection: ' . $error['message']);
            }
            $collection_id = $this->db->insert_id();
            
            // Update student fee assignments
            if (!empty($data['student_fee_assignment_id'])) {
                $this->update_fee_assignment_after_payment($data['student_fee_assignment_id'], $data['amount']);
            }
            
            // Update optional fee assignments
            if (!empty($data['optional_fees']) && is_array($data['optional_fees'])) {
                $this->load->model('Fee_structure_model');
                
                // Get the latest assignments for the student (the ones we just created)
                $this->db->select('id, fee_structure_id');
                $this->db->from('student_fee_assignments');
                $this->db->where('student_id', $data['student_id']);
                $this->db->where_in('fee_structure_id', array_column($data['optional_fees'], 'fee_structure_id'));
                $this->db->order_by('id', 'DESC');
                $this->db->limit(count($data['optional_fees']));
                $recent_assignments = $this->db->get()->result_array();
                
                // Update each optional fee assignment
                foreach ($recent_assignments as $assignment) {
                    $optional_fee = array_filter($data['optional_fees'], function($fee) use ($assignment) {
                        return $fee['fee_structure_id'] == $assignment['fee_structure_id'];
                    });
                    
                    if (!empty($optional_fee)) {
                        $optional_fee = array_values($optional_fee)[0];
                        $this->update_fee_assignment_after_payment($assignment['id'], $optional_fee['amount']);
                    }
                }
            }
            
            // Update staff wallet when collection is made
            try {
                if (isset($data['collected_by_staff_id']) || isset($clean_data['collected_by'])) {
                    $staff_id = $data['collected_by_staff_id'] ?? $clean_data['collected_by'];
                    $this->update_staff_wallet($staff_id, $clean_data['amount'], $collection_id, $clean_data['receipt_number']);
                }
            } catch (Exception $wallet_error) {
                log_message('error', 'Staff wallet update failed: ' . $wallet_error->getMessage());
                // Don't fail the entire transaction for wallet update errors
            }
            
            $this->db->trans_complete();
            
            if ($this->db->trans_status() === FALSE) {
                return false;
            }
            
            return $collection_id;
            
        } catch (Exception $e) {
            $this->db->trans_rollback();
            log_message('error', 'Fee collection error: ' . $e->getMessage());
            log_message('error', 'Last query: ' . $this->db->last_query());
            
            // Store detailed error information for the controller to access
            $this->last_error = $e->getMessage() . ' | Last query: ' . $this->db->last_query();
            return false;
        }
    }
    
    private function generate_receipt_number() {
        $prefix = 'RCP' . date('Ymd');
        
        // Get the last receipt number for today
        $this->db->like('receipt_number', $prefix, 'after');
        $this->db->order_by('id', 'DESC');
        $this->db->limit(1);
        $last_receipt = $this->db->get('fee_collections')->row_array();
        
        if ($last_receipt) {
            $last_number = substr($last_receipt['receipt_number'], -4);
            $next_number = str_pad((intval($last_number) + 1), 4, '0', STR_PAD_LEFT);
        } else {
            $next_number = '0001';
        }
        
        return $prefix . $next_number;
    }
    
    private function update_fee_assignment_after_payment($assignment_id, $amount) {
        // Get current assignment details
        $this->db->where('id', $assignment_id);
        $assignment = $this->db->get('student_fee_assignments')->row_array();
        
        if (!$assignment) {
            throw new Exception('Fee assignment not found');
        }
        
        $new_paid_amount = $assignment['paid_amount'] + $amount;
        $new_pending_amount = $assignment['total_amount'] - $new_paid_amount;
        
        // Determine new status
        $status = 'pending';
        if ($new_pending_amount <= 0) {
            $status = 'paid';
            $new_pending_amount = 0;
        } else if ($new_paid_amount > 0) {
            $status = 'partial';
        }
        
        // Check if overdue
        if ($status !== 'paid' && $assignment['due_date'] && $assignment['due_date'] < date('Y-m-d')) {
            $status = 'overdue';
        }
        
        $update_data = [
            'paid_amount' => $new_paid_amount,
            'pending_amount' => $new_pending_amount,
            'status' => $status
            // Removed updated_at as it might not exist in the table
        ];
        
        $this->db->where('id', $assignment_id);
        $this->db->update('student_fee_assignments', $update_data);
    }
    
    private function update_staff_ledger($staff_id, $amount, $payment_method) {
        $date = date('Y-m-d');
        
        // Check if ledger entry exists for today
        $this->db->where('staff_id', $staff_id);
        $this->db->where('collection_date', $date);
        $ledger = $this->db->get('staff_ledger')->row_array();
        
        if ($ledger) {
            // Update existing entry
            $update_data = [
                'total_collections' => $ledger['total_collections'] + $amount,
                $payment_method . '_amount' => $ledger[$payment_method . '_amount'] + $amount,
                'pending_verification' => $ledger['pending_verification'] + $amount,
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            $this->db->where('id', $ledger['id']);
            $this->db->update('staff_ledger', $update_data);
        } else {
            // Create new entry
            $ledger_data = [
                'staff_id' => $staff_id,
                'collection_date' => $date,
                'total_collections' => $amount,
                'cash_amount' => $payment_method === 'cash' ? $amount : 0,
                'card_amount' => $payment_method === 'card' ? $amount : 0,
                'online_amount' => $payment_method === 'online' ? $amount : 0,
                'cheque_amount' => $payment_method === 'cheque' ? $amount : 0,
                'dd_amount' => $payment_method === 'dd' ? $amount : 0,
                'pending_verification' => $amount,
                'verified_amount' => 0,
                'transferred_amount' => 0,
                'pending_transfer' => 0,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            $this->db->insert('staff_ledger', $ledger_data);
        }
    }
    
    public function get_fee_collections_paginated($limit, $offset, $filters = []) {
        // Include staff details who collected the fee
        // Check if employee_id column exists in staff table and fee-related columns
        $staff_columns = $this->db->list_fields('staff');
        $fc_columns = $this->db->list_fields('fee_collections');
        $employee_id_exists = in_array('employee_id', $staff_columns);
        $has_assignment_id = in_array('student_fee_assignment_id', $fc_columns);
        $has_fee_type_id = in_array('fee_type_id', $fc_columns);
        
        // Build the base SELECT statement
        $select_parts = [
            'fc.*',
            's.student_name',
            's.roll_number', 
            'g.name as grade_name',
            'd.name as division_name',
            'staff.name as collected_by_staff_name'
        ];
        
        // Add staff ID based on available column
        if ($employee_id_exists) {
            $select_parts[] = 'staff.employee_id as collected_by_staff_employee_id';
        } else {
            $select_parts[] = 'staff.id as collected_by_staff_id';
        }
        
        // Add category name based on available joins
        if ($has_assignment_id && $has_fee_type_id) {
            $select_parts[] = 'COALESCE(fc_cat.name, ft.name, "Direct Payment") as category_name';
        } elseif ($has_assignment_id) {
            $select_parts[] = 'COALESCE(fc_cat.name, "Direct Payment") as category_name';
        } elseif ($has_fee_type_id) {
            $select_parts[] = 'COALESCE(ft.name, "Direct Payment") as category_name';
        } else {
            $select_parts[] = '"Direct Payment" as category_name';
        }
        
        $this->db->select(implode(', ', $select_parts));
        $this->db->from('fee_collections fc');
        $this->db->join('students s', 'fc.student_id = s.id');
        $this->db->join('grades g', 's.grade_id = g.id');
        $this->db->join('divisions d', 's.division_id = d.id');
        $this->db->join('staff', 'fc.collected_by = staff.id', 'left');
        
        // Add conditional joins based on available columns
        if ($has_assignment_id) {
            // Join fee categories through student_fee_assignments and fee_structures (for regular fees)
            $this->db->join('student_fee_assignments sfa', 'fc.student_fee_assignment_id = sfa.id', 'left');
            $this->db->join('fee_structures fs', 'sfa.fee_structure_id = fs.id', 'left');
            $this->db->join('fee_categories fc_cat', 'fs.fee_category_id = fc_cat.id', 'left');
        }
        
        // Join fee types for direct payments if fee_type_id exists
        if ($has_fee_type_id) {
            $this->db->join('fee_types ft', 'fc.fee_type_id = ft.id', 'left');
        }
        
        // Apply filters
        if (!empty($filters['start_date'])) {
            $this->db->where('fc.collection_date >=', $filters['start_date']);
        }
        
        if (!empty($filters['end_date'])) {
            $this->db->where('fc.collection_date <=', $filters['end_date']);
        }
        
        if (!empty($filters['grade_id'])) {
            $this->db->where('s.grade_id', $filters['grade_id']);
        }
        
        if (!empty($filters['division_id'])) {
            $this->db->where('s.division_id', $filters['division_id']);
        }
        
        // Category filter removed - no longer available without fee_structures join
        // if (!empty($filters['category_id'])) {
        //     $this->db->where('fs.fee_category_id', $filters['category_id']);
        // }
        
        if (!empty($filters['staff_id'])) {
            $this->db->where('fc.collected_by', $filters['staff_id']);
        }
        
        if (!empty($filters['payment_method'])) {
            $this->db->where('fc.payment_method', $filters['payment_method']);
        }
        
        if (!empty($filters['search'])) {
            $this->db->group_start();
            $this->db->like('s.student_name', $filters['search']);
            $this->db->or_like('s.roll_number', $filters['search']);
            $this->db->or_like('fc.receipt_number', $filters['search']);
            $this->db->group_end();
        }
        
        $this->db->order_by('fc.collection_date', 'DESC');
        $this->db->order_by('fc.id', 'DESC'); // Use ID instead of created_at
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    public function count_fee_collections($filters = []) {
        $this->db->from('fee_collections fc');
        $this->db->join('students s', 'fc.student_id = s.id');
        
        // Apply same filters as in paginated query
        if (!empty($filters['start_date'])) {
            $this->db->where('fc.collection_date >=', $filters['start_date']);
        }
        
        if (!empty($filters['end_date'])) {
            $this->db->where('fc.collection_date <=', $filters['end_date']);
        }
        
        if (!empty($filters['grade_id'])) {
            $this->db->where('s.grade_id', $filters['grade_id']);
        }
        
        if (!empty($filters['division_id'])) {
            $this->db->where('s.division_id', $filters['division_id']);
        }
        
        // Category filter removed - no longer available without fee_structures join
        // if (!empty($filters['category_id'])) {
        //     $this->db->where('fs.fee_category_id', $filters['category_id']);
        // }
        
        if (!empty($filters['staff_id'])) {
            $this->db->where('fc.collected_by', $filters['staff_id']);
        }
        
        if (!empty($filters['payment_method'])) {
            $this->db->where('fc.payment_method', $filters['payment_method']);
        }
        
        if (!empty($filters['search'])) {
            $this->db->group_start();
            $this->db->like('s.student_name', $filters['search']);
            $this->db->or_like('s.roll_number', $filters['search']);
            $this->db->or_like('fc.receipt_number', $filters['search']);
            $this->db->group_end();
        }
        
        return $this->db->count_all_results();
    }
    
    public function get_collection_by_id($id) {
        // Check if student_fee_assignment_id column exists first
        $fc_columns = $this->db->list_fields('fee_collections');
        $has_assignment_id = in_array('student_fee_assignment_id', $fc_columns);
        
        // Build SELECT statement based on available joins
        if ($has_assignment_id) {
            $this->db->select('
                fc.*,
                s.student_name,
                s.roll_number,
                g.name as grade_name,
                d.name as division_name,
                staff.name as collected_by_staff_name,
                COALESCE(fc_cat.name, ft.name, "Direct Payment") as category_name,
                p.name as parent_name,
                p.mobile as parent_mobile,
                "1" as is_verified,
                "" as verified_by_admin_name,
                fc.created_at
            ');
        } else {
            $this->db->select('
                fc.*,
                s.student_name,
                s.roll_number,
                g.name as grade_name,
                d.name as division_name,
                staff.name as collected_by_staff_name,
                COALESCE(ft.name, "Direct Payment") as category_name,
                p.name as parent_name,
                p.mobile as parent_mobile,
                "1" as is_verified,
                "" as verified_by_admin_name,
                fc.created_at
            ');
        }
        
        $this->db->from('fee_collections fc');
        $this->db->join('students s', 'fc.student_id = s.id', 'left');
        $this->db->join('grades g', 's.grade_id = g.id', 'left');
        $this->db->join('divisions d', 's.division_id = d.id', 'left');
        $this->db->join('staff', 'fc.collected_by = staff.id', 'left');
        $this->db->join('parents p', 's.parent_id = p.id', 'left');
        $this->db->join('fee_types ft', 'fc.fee_type_id = ft.id', 'left');
        
        // Only join fee_categories if student_fee_assignment_id column exists
        if ($has_assignment_id) {
            $this->db->join('student_fee_assignments sfa', 'fc.student_fee_assignment_id = sfa.id', 'left');
            $this->db->join('fee_structures fs', 'sfa.fee_structure_id = fs.id', 'left');
            $this->db->join('fee_categories fc_cat', 'fs.fee_category_id = fc_cat.id', 'left');
        }
        
        $this->db->where('fc.id', $id);
        
        $query = $this->db->get();
        $result = $query->row_array();
        
        // Add some default/calculated fields that the receipt expects
        if ($result) {
            $result['reference_number'] = $result['payment_reference'] ?? null;
            $result['payment_reference'] = $result['payment_reference'] ?? null;
            
            // Get detailed fee breakdown for this collection
            $result['fee_breakdown'] = $this->get_fee_breakdown_for_collection($id);
        }
        
        return $result;
    }
    
    /**
     * Get detailed fee breakdown for a collection
     */
    public function get_fee_breakdown_for_collection($collection_id) {
        $breakdown = [];
        
        // Get the collection details
        $this->db->select('student_id, amount, collection_date, fee_type_id, created_at, remarks');
        $this->db->from('fee_collections');
        $this->db->where('id', $collection_id);
        $collection = $this->db->get()->row_array();
        
        if (!$collection) {
            return $breakdown;
        }
        
        // Check if this is a direct payment (no specific fee type)
        if (empty($collection['fee_type_id'])) {
            // For direct payments, create a generic breakdown
            $breakdown[] = [
                'id' => 'direct',
                'name' => 'Fee Payment',
                'description' => 'Direct fee payment',
                'amount' => $collection['amount'],
                'is_mandatory' => 1,
                'type' => 'Payment'
            ];
            return $breakdown;
        }
        
        // Parse selected fees from remarks
        $selected_fees = [];
        if (!empty($collection['remarks']) && strpos($collection['remarks'], 'SELECTED_FEES:') === 0) {
            $parts = explode('|', $collection['remarks']);
            $selected_fees_part = $parts[0];
            $selected_fees_part = str_replace('SELECTED_FEES:', '', $selected_fees_part);
            $selected_fees = explode(',', $selected_fees_part);
        }
        
        if (empty($selected_fees)) {
            // Fallback: create a generic breakdown
            $breakdown[] = [
                'id' => 'collection_' . $collection_id,
                'name' => 'Fee Payment',
                'description' => 'Fee collection payment',
                'amount' => $collection['amount'],
                'is_mandatory' => 1,
                'type' => 'Payment'
            ];
            return $breakdown;
        }
        
        // Get specific fee assignments that were selected
        $assignment_ids = [];
        $fee_structure_ids = [];
        
        foreach ($selected_fees as $fee_info) {
            $parts = explode(':', $fee_info);
            if (count($parts) === 2) {
                $type = $parts[0];
                $id = $parts[1];
                
                if ($type === 'mandatory') {
                    $assignment_ids[] = $id;
                } elseif ($type === 'optional') {
                    $fee_structure_ids[] = $id;
                }
            }
        }
        
        // Get mandatory fee assignments
        if (!empty($assignment_ids)) {
            $this->db->select('
                sfa.id as assignment_id,
                sfa.total_amount,
                sfa.paid_amount,
                sfa.pending_amount,
                fs.amount as fee_amount,
                fs.description,
                fc.name as category_name,
                fc.description as category_description,
                fs.is_mandatory,
                sfa.status
            ');
            $this->db->from('student_fee_assignments sfa');
            $this->db->join('fee_structures fs', 'sfa.fee_structure_id = fs.id');
            $this->db->join('fee_categories fc', 'fs.fee_category_id = fc.id');
            $this->db->where_in('sfa.id', $assignment_ids);
            
            $assignments = $this->db->get()->result_array();
            
            foreach ($assignments as $assignment) {
                $breakdown[] = [
                    'id' => $assignment['assignment_id'],
                    'name' => $assignment['category_name'],
                    'description' => $assignment['description'] ?: $assignment['category_description'],
                    'amount' => $assignment['paid_amount'],
                    'is_mandatory' => $assignment['is_mandatory'],
                    'type' => $assignment['is_mandatory'] ? 'Mandatory' : 'Optional'
                ];
            }
        }
        
        // Get optional fee structures
        if (!empty($fee_structure_ids)) {
            $this->db->select('
                fs.id as fee_structure_id,
                fs.amount as fee_amount,
                fs.description,
                fc.name as category_name,
                fc.description as category_description,
                fs.is_mandatory
            ');
            $this->db->from('fee_structures fs');
            $this->db->join('fee_categories fc', 'fs.fee_category_id = fc.id');
            $this->db->where_in('fs.id', $fee_structure_ids);
            
            $fee_structures = $this->db->get()->result_array();
            
            foreach ($fee_structures as $fee_structure) {
                $breakdown[] = [
                    'id' => 'optional_' . $fee_structure['fee_structure_id'],
                    'name' => $fee_structure['category_name'],
                    'description' => $fee_structure['description'] ?: $fee_structure['category_description'],
                    'amount' => $fee_structure['fee_amount'],
                    'is_mandatory' => $fee_structure['is_mandatory'],
                    'type' => $fee_structure['is_mandatory'] ? 'Mandatory' : 'Optional'
                ];
            }
        }
        
        return $breakdown;
    }
    
    public function verify_collection($collection_id, $admin_id) {
        $update_data = [
            'is_verified' => 1,
            'verified_by_admin_id' => $admin_id,
            'verification_date' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        $this->db->where('id', $collection_id);
        $result = $this->db->update('fee_collections', $update_data);
        
        if ($result) {
            // Update staff ledger
            $collection = $this->get_collection_by_id($collection_id);
            if ($collection && $collection['collected_by_staff_id']) {
                $this->update_staff_ledger_verification($collection['collected_by_staff_id'], $collection['amount'], $collection['collection_date']);
            }
        }
        
        return $result;
    }
    
    private function update_staff_ledger_verification($staff_id, $amount, $date) {
        $this->db->where('staff_id', $staff_id);
        $this->db->where('collection_date', $date);
        $ledger = $this->db->get('staff_ledger')->row_array();
        
        if ($ledger) {
            $update_data = [
                'verified_amount' => $ledger['verified_amount'] + $amount,
                'pending_verification' => $ledger['pending_verification'] - $amount,
                'pending_transfer' => $ledger['pending_transfer'] + $amount,
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            $this->db->where('id', $ledger['id']);
            $this->db->update('staff_ledger', $update_data);
        }
    }
    
    public function get_student_payment_history($student_id) {
        $this->db->select('fc.*, fc_cat.name as category_name, staff.name as collected_by_name');
        $this->db->from('fee_collections fc');
        $this->db->join('student_fee_assignments sfa', 'fc.student_fee_assignment_id = sfa.id');
        $this->db->join('fee_structures fs', 'sfa.fee_structure_id = fs.id');
        $this->db->join('fee_categories fc_cat', 'fs.fee_category_id = fc_cat.id');
        $this->db->join('staff', 'fc.collected_by_staff_id = staff.id', 'left');
        $this->db->where('fc.student_id', $student_id);
        $this->db->order_by('fc.collection_date', 'DESC');
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    public function get_collection_summary($filters = []) {
        $this->db->select('
            COUNT(*) as total_transactions,
            SUM(amount) as total_amount,
            SUM(CASE WHEN payment_method = "cash" THEN amount ELSE 0 END) as cash_amount,
            SUM(CASE WHEN payment_method = "card" THEN amount ELSE 0 END) as card_amount,
            SUM(CASE WHEN payment_method = "online" THEN amount ELSE 0 END) as online_amount,
            SUM(CASE WHEN payment_method = "cheque" THEN amount ELSE 0 END) as cheque_amount,
            SUM(CASE WHEN payment_method = "dd" THEN amount ELSE 0 END) as dd_amount,
            SUM(CASE WHEN is_verified = 1 THEN amount ELSE 0 END) as verified_amount,
            SUM(CASE WHEN is_verified = 0 THEN amount ELSE 0 END) as pending_verification
        ');
        $this->db->from('fee_collections fc');
        
        if (!empty($filters['start_date'])) {
            $this->db->where('collection_date >=', $filters['start_date']);
        }
        
        if (!empty($filters['end_date'])) {
            $this->db->where('collection_date <=', $filters['end_date']);
        }
        
        if (!empty($filters['staff_id'])) {
            $this->db->where('collected_by_staff_id', $filters['staff_id']);
        }
        
        $query = $this->db->get();
        return $query->row_array();
    }
    
    /**
     * Update staff wallet when fee is collected
     */
    private function update_staff_wallet($staff_id, $amount, $collection_id, $receipt_number) {
        $this->load->model('Staff_wallet_model');
        
        $description = "Fee collection - Receipt: $receipt_number";
        $result = $this->Staff_wallet_model->add_collection($staff_id, $amount, $collection_id, $description, $receipt_number);
        
        if (!$result) {
            log_message('error', "Failed to update staff wallet for staff_id: $staff_id, amount: $amount, collection_id: $collection_id");
        }
        
        return $result;
    }
}