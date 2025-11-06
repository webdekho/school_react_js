<?php
defined('BASEPATH') OR exit('No direct script access allowed');


class Student_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    public function get_students($filters = []) {
        // Use raw SQL to avoid ActiveRecord conflicts
        $sql = "SELECT students.*, 
                       students.special_need AS special_need,
                       grades.name as grade_name, 
                       divisions.name as division_name, 
                       parents.name as parent_name, 
                       parents.mobile as parent_mobile, 
                       ay.name as academic_year_name
                FROM students 
                JOIN grades ON students.grade_id = grades.id
                JOIN divisions ON students.division_id = divisions.id
                JOIN parents ON students.parent_id = parents.id
                JOIN academic_years ay ON students.academic_year_id = ay.id
                WHERE students.is_active = 1";
        
        $params = array();
        
        // Filter by academic year
        if (!empty($filters['academic_year_id'])) {
            $sql .= " AND students.academic_year_id = ?";
            $params[] = $filters['academic_year_id'];
        } else {
            // Get current academic year if not specified
            $this->load->model('Academic_year_model');
            $current_year = $this->Academic_year_model->get_default_academic_year();
            if ($current_year) {
                $sql .= " AND students.academic_year_id = ?";
                $params[] = $current_year['id'];
            }
        }
        
        if (!empty($filters['grade_id'])) {
            $sql .= " AND students.grade_id = ?";
            $params[] = $filters['grade_id'];
        }
        
        if (!empty($filters['division_id'])) {
            $sql .= " AND students.division_id = ?";
            $params[] = $filters['division_id'];
        }
        
        if (!empty($filters['search'])) {
            $sql .= " AND (students.student_name LIKE ? OR students.roll_number LIKE ? OR parents.mobile LIKE ?)";
            $search_term = '%' . $filters['search'] . '%';
            $params[] = $search_term;
            $params[] = $search_term;
            $params[] = $search_term;
        }
        
        $sql .= " ORDER BY grades.name, divisions.name, students.roll_number";
        
        if (isset($filters['limit'])) {
            $sql .= " LIMIT " . (int)$filters['limit'] . " OFFSET " . (int)$filters['offset'];
        }
        
        $query = $this->db->query($sql, $params);
        $students = $query->result_array();
        
        // Add fee calculations for each student
        foreach ($students as &$student) {
            if (array_key_exists('special need', $student)) {
                $student['special_need'] = $student['special_need'] ?? $student['special need'];
                unset($student['special need']);
            }
            if (!array_key_exists('special need', $student) && array_key_exists('special_need', $student)) {
                $student['special need'] = $student['special_need'];
            }
            // Decrypt sensitive data for display (masked)
            if ($student['aadhaar_encrypted']) {
                $student['aadhaar_masked'] = $this->mask_aadhaar($this->decrypt_sensitive_data($student['aadhaar_encrypted']));
            }
            unset($student['aadhaar_encrypted']);
            
            // Calculate fee totals for this student
            $fee_sql = "SELECT 
                            COALESCE(SUM(CASE WHEN fs.is_mandatory = 1 THEN sfa.pending_amount ELSE 0 END), 0) as mandatory_fees,
                            COALESCE(SUM(CASE WHEN fs.is_mandatory = 0 THEN sfa.pending_amount ELSE 0 END), 0) as optional_fees,
                            COALESCE(SUM(sfa.pending_amount), 0) as total_fees,
                            COALESCE(SUM(sfa.paid_amount), 0) as total_paid
                        FROM student_fee_assignments sfa
                        JOIN fee_structures fs ON sfa.fee_structure_id = fs.id
                        WHERE sfa.student_id = ? AND sfa.status != 'cancelled'";
            
            $fee_query = $this->db->query($fee_sql, array($student['id']));
            $fee_data = $fee_query->row_array();
            
            if ($fee_data) {
                $student['mandatory_fees'] = $fee_data['mandatory_fees'];
                $student['optional_fees'] = $fee_data['optional_fees'];
                $student['total_fees'] = $fee_data['total_fees'];
                $student['total_paid'] = $fee_data['total_paid'];
            } else {
                $student['mandatory_fees'] = '0.00';
                $student['optional_fees'] = '0.00';
                $student['total_fees'] = '0.00';
                $student['total_paid'] = '0.00';
            }
        }
        
        return $students;
    }
    
    public function get_student_by_id($id) {
        $this->db->select('students.*, students.special_need as special_need, grades.name as grade_name, divisions.name as division_name, parents.name as parent_name, parents.mobile as parent_mobile, parents.email as parent_email');
        $this->db->from('students');
        $this->db->join('grades', 'students.grade_id = grades.id');
        $this->db->join('divisions', 'students.division_id = divisions.id');
        $this->db->join('parents', 'students.parent_id = parents.id');
        $this->db->where('students.id', $id);
        $this->db->where('students.is_active', 1);
        
        $query = $this->db->get();
        $student = $query->row_array();
        
        if ($student) {
            if (array_key_exists('special need', $student)) {
                $student['special_need'] = $student['special_need'] ?? $student['special need'];
                unset($student['special need']);
            }
            if (!array_key_exists('special need', $student) && array_key_exists('special_need', $student)) {
                $student['special need'] = $student['special_need'];
            }

            if ($student['aadhaar_encrypted']) {
            $student['aadhaar_masked'] = $this->mask_aadhaar($this->decrypt_sensitive_data($student['aadhaar_encrypted']));
            unset($student['aadhaar_encrypted']);
            }
        }
        
        return $student;
    }
    
    public function create_student($data) {
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        // Log the incoming data to debug file upload URLs
        log_message('info', 'Student_model::create_student - Incoming data with URLs: ' . json_encode([
            'student_photo_url' => $data['student_photo_url'] ?? 'NOT_SET',
            'id_proof_url' => $data['id_proof_url'] ?? 'NOT_SET', 
            'address_proof_url' => $data['address_proof_url'] ?? 'NOT_SET',
            'student_name' => $data['student_name'] ?? 'NO_NAME'
        ]));
        
        // Set default values for required fields
        if (!isset($data['is_active'])) {
            $data['is_active'] = 1;
        }

        // Normalize emergency contact fields
        if (!array_key_exists('emergency_contact_name', $data)) {
            $data['emergency_contact_name'] = null;
        }
        if (!array_key_exists('emergency_contact_relationship', $data)) {
            $data['emergency_contact_relationship'] = null;
        }

        // Normalize special need field and handle column with space safely
        $special_need_is_set = false;
        $special_need_value = null;
        if (array_key_exists('special need', $data)) {
            $special_need_value = trim($data['special need']) !== '' ? $data['special need'] : null;
            unset($data['special need']);
            $special_need_is_set = true;
        } elseif (array_key_exists('special_need', $data)) {
            $special_need_value = trim($data['special_need']) !== '' ? $data['special_need'] : null;
            unset($data['special_need']);
            $special_need_is_set = true;
        }

        if ($special_need_is_set) {
            $data['special_need'] = $special_need_value;
        } elseif (!array_key_exists('special_need', $data)) {
            $data['special_need'] = null;
        }
 
        // If academic_year_id is not provided, use current academic year
        if (empty($data['academic_year_id'])) {
            $this->load->model('Academic_year_model');
            $current_year = $this->Academic_year_model->get_default_academic_year();
            if ($current_year) {
                $data['academic_year_id'] = $current_year['id'];
            }
        }
        
        // Check for duplicate roll number in same grade and division
        if (!empty($data['roll_number'])) {
            $this->db->where('roll_number', $data['roll_number']);
            $this->db->where('grade_id', $data['grade_id']);
            $this->db->where('division_id', $data['division_id']);
            $this->db->where('academic_year_id', $data['academic_year_id']);
            $this->db->where('is_active', 1);
            $existing_student = $this->db->get('students')->row_array();
            
            if ($existing_student) {
                throw new Exception('Roll number "' . $data['roll_number'] . '" already exists in this grade and division for the current academic year.');
            }
        }
        
        // Debug: Log the data being inserted
        log_message('debug', 'Creating student with data: ' . json_encode($data));
        
        // Temporarily disable db_debug to handle errors gracefully
        $original_db_debug = $this->db->db_debug;
        $this->db->db_debug = FALSE;
        
        // First, try to create student without transaction to isolate the issue
        $insert_result = $this->db->insert('students', $data);
        
        // Check for database errors after insert attempt
        $db_error = $this->db->error();
        
        // Restore original db_debug setting
        $this->db->db_debug = $original_db_debug;
        
        if ($db_error['code'] !== 0) {
            // Handle specific error codes
            if ($db_error['code'] == 1062) { // Duplicate entry
                // Extract the duplicate value from the error message
                if (strpos($db_error['message'], 'unique_roll_grade_division') !== false) {
                    throw new Exception('Roll number "' . $data['roll_number'] . '" already exists in this grade and division for the current academic year.');
                } else {
                    throw new Exception('Duplicate entry detected. Please check your data and try again.');
                }
            } else {
                throw new Exception('Database error: ' . $db_error['message']);
            }
        }
        
        if ($insert_result) {
            $student_id = $this->db->insert_id();
            
            log_message('debug', 'Student created with ID: ' . $student_id);
            
            // Verify the URLs were saved correctly
            $this->db->select('student_photo_url, id_proof_url, address_proof_url');
            $this->db->where('id', $student_id);
            $saved_urls = $this->db->get('students')->row_array();
            log_message('info', 'Student_model::create_student - Verification - URLs saved in DB: ' . json_encode($saved_urls));
            
            // Start transaction for fee assignment only
            $this->db->trans_start();
            
            // Automatically assign fees based on grade and division
            try {
                $this->assign_fees_to_student($student_id, $data['grade_id'], $data['division_id'], $data['academic_year_id']);
                log_message('debug', 'Fees assigned successfully for student ID: ' . $student_id);
                
                $this->db->trans_complete();
                
                if ($this->db->trans_status() === FALSE) {
                    $db_error = $this->db->error();
                    log_message('error', 'Fee assignment transaction failed: ' . json_encode($db_error));
                    // Student was created but fee assignment failed - this is not critical
                    // Return the student ID anyway
                }
                
            } catch (Exception $e) {
                log_message('error', 'Fee assignment failed for student ID ' . $student_id . ': ' . $e->getMessage());
                $this->db->trans_rollback();
                // Student was created but fee assignment failed - this is not critical
                // Return the student ID anyway
            }
            
            return $student_id;
        } else {
            $db_error = $this->db->error();
            log_message('error', 'Student insertion failed: ' . json_encode($db_error));
            return false;
        }
    }
    
    public function update_student($id, $data) {
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        // Log the incoming data to debug file upload URLs  
        log_message('info', 'Student_model::update_student - ID: ' . $id . ' - Incoming data with URLs: ' . json_encode([
            'student_photo_url' => $data['student_photo_url'] ?? 'NOT_SET',
            'id_proof_url' => $data['id_proof_url'] ?? 'NOT_SET', 
            'address_proof_url' => $data['address_proof_url'] ?? 'NOT_SET',
            'student_name' => $data['student_name'] ?? 'NO_NAME'
        ]));
        
        // Check for duplicate roll number if roll_number is being updated
        if (!empty($data['roll_number'])) {
            // Get current student data
            $current_student = $this->get_student_by_id($id);
            if ($current_student && $data['roll_number'] !== $current_student['roll_number']) {
                $check_grade_id = isset($data['grade_id']) ? $data['grade_id'] : $current_student['grade_id'];
                $check_division_id = isset($data['division_id']) ? $data['division_id'] : $current_student['division_id'];
                $check_academic_year_id = isset($data['academic_year_id']) ? $data['academic_year_id'] : $current_student['academic_year_id'];
                
                $this->db->where('roll_number', $data['roll_number']);
                $this->db->where('grade_id', $check_grade_id);
                $this->db->where('division_id', $check_division_id);
                $this->db->where('academic_year_id', $check_academic_year_id);
                $this->db->where('id !=', $id);
                $this->db->where('is_active', 1);
                $existing_student = $this->db->get('students')->row_array();
                
                if ($existing_student) {
                    throw new Exception('Roll number "' . $data['roll_number'] . '" already exists in this grade and division for the current academic year.');
                }
            }
        }
        
        // Check if grade or division is being updated
        $grade_or_division_changed = isset($data['grade_id']) || isset($data['division_id']);
 
        // Normalize emergency contact fields for updates
        if (!array_key_exists('emergency_contact_name', $data)) {
            $data['emergency_contact_name'] = null;
        }
        if (!array_key_exists('emergency_contact_relationship', $data)) {
            $data['emergency_contact_relationship'] = null;
        }

        $special_need_is_set = false;
        $special_need_value = null;
        if (array_key_exists('special need', $data)) {
            $special_need_value = trim($data['special need']) !== '' ? $data['special need'] : null;
            unset($data['special need']);
            $special_need_is_set = true;
        } elseif (array_key_exists('special_need', $data)) {
            $special_need_value = trim($data['special_need']) !== '' ? $data['special_need'] : null;
            unset($data['special_need']);
            $special_need_is_set = true;
        }

        if ($special_need_is_set) {
            $data['special_need'] = $special_need_value;
        }

        if ($grade_or_division_changed) {
            // Get current student data to check what changed
            $current_student = $this->get_student_by_id($id);
            if ($current_student) {
                $new_grade_id = isset($data['grade_id']) ? $data['grade_id'] : $current_student['grade_id'];
                $new_division_id = isset($data['division_id']) ? $data['division_id'] : $current_student['division_id'];
                
                log_message('info', "Student {$id} grade/division change detected: Grade {$current_student['grade_id']} -> {$new_grade_id}, Division {$current_student['division_id']} -> {$new_division_id}");
                
                // If grade or division actually changed, reassign fees
                if ($new_grade_id != $current_student['grade_id'] || $new_division_id != $current_student['division_id']) {
                    $this->db->trans_start();
                    
                    // Update student data with error handling
                    $original_db_debug = $this->db->db_debug;
                    $this->db->db_debug = FALSE;
                    
                    $this->db->where('id', $id);
                    $update_result = $this->db->update('students', $data);
                    
                    $db_error = $this->db->error();
                    $this->db->db_debug = $original_db_debug;
                    
                    if ($db_error['code'] !== 0) {
                        $this->db->trans_rollback();
                        if ($db_error['code'] == 1062 && strpos($db_error['message'], 'unique_roll_grade_division') !== false) {
                            throw new Exception('Roll number "' . $data['roll_number'] . '" already exists in this grade and division for the current academic year.');
                        } else {
                            throw new Exception('Database error: ' . $db_error['message']);
                        }
                    }
                    
                    // Reassign fees for the new grade/division
                    $this->reassign_fees_to_student($id, $new_grade_id, $new_division_id, $current_student['academic_year_id']);
                    
                    $this->db->trans_complete();
                    return $this->db->trans_status() !== FALSE;
                }
            }
        }
        
        // Normal update without fee reassignment
        // Temporarily disable db_debug to handle errors gracefully
        $original_db_debug = $this->db->db_debug;
        $this->db->db_debug = FALSE;
        
        $this->db->where('id', $id);
        $update_result = $this->db->update('students', $data);
        
        // Check for database errors after update attempt
        $db_error = $this->db->error();
        
        // Restore original db_debug setting
        $this->db->db_debug = $original_db_debug;
        
        if ($db_error['code'] !== 0) {
            // Handle specific error codes
            if ($db_error['code'] == 1062) { // Duplicate entry
                if (strpos($db_error['message'], 'unique_roll_grade_division') !== false) {
                    throw new Exception('Roll number "' . $data['roll_number'] . '" already exists in this grade and division for the current academic year.');
                } else {
                    throw new Exception('Duplicate entry detected. Please check your data and try again.');
                }
            } else {
                throw new Exception('Database error: ' . $db_error['message']);
            }
        }
        
        if ($update_result) {
            // Verify the URLs were saved correctly
            $this->db->select('student_photo_url, id_proof_url, address_proof_url');
            $this->db->where('id', $id);
            $saved_urls = $this->db->get('students')->row_array();
            log_message('info', 'Student_model::update_student - Verification - URLs saved in DB: ' . json_encode($saved_urls));
        }
        
        return $update_result;
    }
    
    public function delete_student($id) {
        // Soft delete - set is_active to 0
        $this->db->where('id', $id);
        return $this->db->update('students', ['is_active' => 0, 'updated_at' => date('Y-m-d H:i:s')]);
    }
    
    public function count_students($filters = []) {
        // Use raw SQL to avoid ActiveRecord conflicts
        $sql = "SELECT COUNT(*) as total
                FROM students 
                JOIN parents ON students.parent_id = parents.id
                WHERE students.is_active = 1";
        
        $params = array();
        
        // Filter by academic year
        if (!empty($filters['academic_year_id'])) {
            $sql .= " AND students.academic_year_id = ?";
            $params[] = $filters['academic_year_id'];
        } else {
            // Get current academic year if not specified
            $this->load->model('Academic_year_model');
            $current_year = $this->Academic_year_model->get_default_academic_year();
            if ($current_year) {
                $sql .= " AND students.academic_year_id = ?";
                $params[] = $current_year['id'];
            }
        }
        
        if (!empty($filters['grade_id'])) {
            $sql .= " AND students.grade_id = ?";
            $params[] = $filters['grade_id'];
        }
        
        if (!empty($filters['division_id'])) {
            $sql .= " AND students.division_id = ?";
            $params[] = $filters['division_id'];
        }
        
        if (!empty($filters['search'])) {
            $sql .= " AND (students.student_name LIKE ? OR students.roll_number LIKE ? OR parents.mobile LIKE ?)";
            $search_term = '%' . $filters['search'] . '%';
            $params[] = $search_term;
            $params[] = $search_term;
            $params[] = $search_term;
        }
        
        $query = $this->db->query($sql, $params);
        $result = $query->row_array();
        return $result['total'];
    }
    
    public function count_active_students() {
        $this->db->where('is_active', 1);
        return $this->db->count_all_results('students');
    }
    
    public function search_students($query) {
        $this->db->select('students.id, students.student_name, students.roll_number, grades.name as grade_name, divisions.name as division_name, parents.mobile as parent_mobile');
        $this->db->from('students');
        $this->db->join('grades', 'students.grade_id = grades.id');
        $this->db->join('divisions', 'students.division_id = divisions.id');
        $this->db->join('parents', 'students.parent_id = parents.id');
        $this->db->where('students.is_active', 1);
        
        $this->db->group_start();
        $this->db->like('students.student_name', $query);
        $this->db->or_like('students.roll_number', $query);
        $this->db->or_like('parents.mobile', $query);
        $this->db->group_end();
        
        $this->db->limit(20);
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    public function get_students_by_parent($parent_id) {
        $this->db->select('students.*, students.special_need as special_need, grades.name as grade_name, divisions.name as division_name');
        $this->db->from('students');
        $this->db->join('grades', 'students.grade_id = grades.id');
        $this->db->join('divisions', 'students.division_id = divisions.id');
        $this->db->where('students.parent_id', $parent_id);
        $this->db->where('students.is_active', 1);
        $this->db->order_by('grades.name, divisions.name');
        
        $query = $this->db->get();
        $students = $query->result_array();

        foreach ($students as &$student) {
            if (array_key_exists('special need', $student)) {
                $student['special_need'] = $student['special_need'] ?? $student['special need'];
                unset($student['special need']);
            }
            if (!array_key_exists('special need', $student) && array_key_exists('special_need', $student)) {
                $student['special need'] = $student['special_need'];
            }
        }

        return $students;
    }
    
    public function get_students_by_staff_assignment($staff_id, $parent_id = null) {
        $sql = "SELECT DISTINCT students.*, 
                       students.special_need AS special_need,
                       grades.name as grade_name, 
                       divisions.name as division_name, 
                       parents.name as parent_name, 
                       parents.mobile as parent_mobile,
                       students.student_name,
                       students.roll_number
                FROM students 
                JOIN grades ON students.grade_id = grades.id
                JOIN divisions ON students.division_id = divisions.id
                JOIN parents ON students.parent_id = parents.id
                WHERE students.is_active = 1
                AND parents.is_active = 1";
        
        if ($parent_id) {
            $sql .= " AND students.parent_id = " . intval($parent_id);
        }
        
        $sql .= " AND (
                    students.grade_id IN (SELECT grade_id FROM staff_grades WHERE staff_id = ?)
                    OR 
                    students.division_id IN (SELECT division_id FROM staff_divisions WHERE staff_id = ?)
                  )
                  ORDER BY grades.name, divisions.name, students.student_name";
        
        $query = $this->db->query($sql, [$staff_id, $staff_id]);
        $students = $query->result_array();

        foreach ($students as &$student) {
            if (array_key_exists('special need', $student)) {
                $student['special_need'] = $student['special_need'] ?? $student['special need'];
                unset($student['special need']);
            }
            if (!array_key_exists('special need', $student) && array_key_exists('special_need', $student)) {
                $student['special need'] = $student['special_need'];
            }
        }

        return $students;
    }
    
    public function bulk_import_students($students_data) {
        $success_count = 0;
        $errors = [];
        
        foreach ($students_data as $index => $student) {
            try {
                if ($this->create_student($student)) {
                    $success_count++;
                } else {
                    $errors[] = "Row " . ($index + 1) . ": Failed to insert student";
                }
            } catch (Exception $e) {
                $errors[] = "Row " . ($index + 1) . ": " . $e->getMessage();
            }
        }
        
        return [
            'success_count' => $success_count,
            'error_count' => count($errors),
            'errors' => $errors
        ];
    }
    
    private function decrypt_sensitive_data($encrypted_data) {
        $key = 'school_encryption_key_2024';
        $data = base64_decode($encrypted_data);
        $iv = substr($data, 0, 16);
        $encrypted = substr($data, 16);
        return openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
    }
    
    private function mask_aadhaar($aadhaar) {
        if (strlen($aadhaar) === 12) {
            return str_repeat('*', 8) . substr($aadhaar, -4);
        }
        return str_repeat('*', strlen($aadhaar) - 4) . substr($aadhaar, -4);
    }
    
    /**
     * Automatically assign fees to student based on their grade and division
     * Handles both semester-specific and general fees
     */
    private function assign_fees_to_student($student_id, $grade_id, $division_id, $academic_year_id) {
        log_message('info', "Starting fee assignment for student {$student_id}, grade {$grade_id}, division {$division_id}, academic year {$academic_year_id}");
        
        // Load the Fee_structure_model to use the new method
        $this->load->model('Fee_structure_model');
        
        // Get all applicable mandatory fee structures for this student (including global ones)
        $fee_structures = $this->Fee_structure_model->get_applicable_fee_structures(
            $student_id, 
            $academic_year_id, 
            $grade_id, 
            $division_id, 
            true // mandatory_only = true
        );

        print_r($fee_structures);
        
        log_message('info', 'Found ' . count($fee_structures) . ' applicable mandatory fee structures for student ' . $student_id);
        
        if (count($fee_structures) > 0) {
            log_message('debug', 'Fee structures details: ' . json_encode($fee_structures));
        }
        
        // If no fee structures found, log this for debugging
        if (count($fee_structures) === 0) {
            log_message('debug', 'No mandatory fee structures found for grade_id=' . $grade_id . ', division_id=' . $division_id . ', academic_year_id=' . $academic_year_id);
            return true;
        }
        
        // Assign each applicable fee structure to the student
        $assigned_count = 0;
        $skipped_count = 0;
        
        foreach ($fee_structures as $fee_structure) {
            log_message('debug', "Processing fee structure {$fee_structure['id']} ({$fee_structure['category_name']}) - Amount: {$fee_structure['amount']}");
            
            // Check if assignment already exists for this fee structure
            $this->db->where('student_id', $student_id);
            $this->db->where('fee_structure_id', $fee_structure['id']);
            $this->db->where('is_active', 1);
            $existing = $this->db->get('student_fee_assignments')->row_array();
            
            if (!$existing) {
                // Create assignment - determine semester from category name or fee structure semester field
                $semester = 'Semester 1'; // Default
                if (!empty($fee_structure['semester'])) {
                    $semester = $fee_structure['semester'];
                } elseif (!empty($fee_structure['category_name'])) {
                    // Extract semester from category name if it contains "Semester"
                    if (stripos($fee_structure['category_name'], 'Semester 2') !== false) {
                        $semester = 'Semester 2';
                    } elseif (stripos($fee_structure['category_name'], 'Semester 1') !== false) {
                        $semester = 'Semester 1';
                    } else {
                        // For non-semester fees, use the category name as semester or default
                        $semester = $fee_structure['category_name'];
                    }
                }
                
                $assignment_data = [
                    'student_id' => $student_id,
                    'fee_structure_id' => $fee_structure['id'],
                    'semester' => $semester,
                    'total_amount' => $fee_structure['amount'],
                    'paid_amount' => 0.00,
                    'pending_amount' => $fee_structure['amount'],
                    'due_date' => $fee_structure['due_date'],
                    'status' => 'pending',
                    'is_active' => 1,
                    'assigned_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ];
                
                log_message('debug', 'Inserting assignment: ' . json_encode($assignment_data));
                
                if ($this->db->insert('student_fee_assignments', $assignment_data)) {
                    $assigned_count++;
                    $assignment_id = $this->db->insert_id();
                    $global_status = isset($fee_structure['is_global']) && $fee_structure['is_global'] ? ' (GLOBAL)' : '';
                    log_message('info', "✓ Successfully assigned fee structure {$fee_structure['id']} ({$fee_structure['category_name']}) to student {$student_id}{$global_status} - Assignment ID: {$assignment_id}");
                } else {
                    $error = $this->db->error();
                    log_message('error', 'Failed to insert assignment: ' . json_encode($error));
                    // Don't throw exception for duplicates, just log the warning
                    if ($error['code'] !== 1062) {
                        throw new Exception('Failed to assign fee: ' . $error['message']);
                    } else {
                        log_message('debug', 'Duplicate assignment detected (constraint) for student ' . $student_id . ' and fee structure ' . $fee_structure['id']);
                        $skipped_count++;
                    }
                }
            } else {
                $skipped_count++;
                $global_status = isset($fee_structure['is_global']) && $fee_structure['is_global'] ? ' (GLOBAL)' : '';
                log_message('debug', "→ Assignment already exists for student {$student_id} and fee structure {$fee_structure['id']}{$global_status}");
            }
        }
        
        log_message('info', "Fee assignment completed for student {$student_id}: {$assigned_count} assigned, {$skipped_count} skipped");
        return true;
    }
    
    /**
     * Assign fees for a specific semester
     */
    private function assign_semester_fees($student_id, $grade_id, $division_id, $academic_year_id, $semester) {
        // Get only MANDATORY fee structures for the student's grade, division, academic year, and semester
        $this->db->select('id, amount, due_date, fee_category_id, semester, is_mandatory');
        $this->db->from('fee_structures');
        $this->db->where('academic_year_id', $academic_year_id);
        $this->db->where('semester', $semester);
        $this->db->where('is_active', 1);
        $this->db->where('is_mandatory', 1); // Only assign mandatory fees automatically
        
        // Fee structures can be:
        // 1. Specific to grade and division
        // 2. Specific to grade only (division_id is NULL)
        // 3. General for all (both grade_id and division_id are NULL) - but these are usually optional
        $this->db->group_start();
        $this->db->where('grade_id', $grade_id);
        $this->db->where('division_id', $division_id);
        $this->db->group_end();
        
        $this->db->or_group_start();
        $this->db->where('grade_id', $grade_id);
        $this->db->where('division_id IS NULL', null, false);
        $this->db->group_end();
        
        $query = $this->db->get();
        $fee_structures = $query->result_array();
        
        // Assign each applicable fee structure to the student
        foreach ($fee_structures as $fee_structure) {
            $assignment_data = [
                'student_id' => $student_id,
                'fee_structure_id' => $fee_structure['id'],
                'semester' => $fee_structure['semester'],
                'total_amount' => $fee_structure['amount'],
                'paid_amount' => 0.00,
                'pending_amount' => $fee_structure['amount'],
                'due_date' => $fee_structure['due_date'],
                'status' => 'pending',
                'assigned_at' => date('Y-m-d H:i:s')
            ];
            
            // Insert fee assignment (ignore if already exists due to unique constraint)
            $this->db->insert('student_fee_assignments', $assignment_data);
        }
        
        return true;
    }
    
    /**
     * Reassign fees to student when grade or division changes
     */
    private function reassign_fees_to_student($student_id, $grade_id, $division_id, $academic_year_id) {
        // First, mark existing fee assignments as inactive/cancelled
        $this->db->where('student_id', $student_id);
        $this->db->where('status', 'pending');
        $this->db->update('student_fee_assignments', [
            'status' => 'cancelled',
            'updated_at' => date('Y-m-d H:i:s'),
            'cancellation_reason' => 'Grade/Division changed'
        ]);
        
        // Now assign new fees based on the updated grade and division
        $this->assign_fees_to_student($student_id, $grade_id, $division_id, $academic_year_id);
        
        return true;
    }
    
    /**
     * Get semester fees for a specific grade and division
     * Returns fees for both Semester 1 and Semester 2 with clear status messages
     */
    public function get_semester_fees_for_grade($grade_id) {
        // Get all mandatory fees for this grade
        $all_fees = $this->get_all_fees_for_grade($grade_id);
        $mandatory_fees = array_filter($all_fees, function($fee) { return $fee['is_mandatory'] == 1; });
        
        // Debug logging
        log_message('debug', 'Grade ' . $grade_id . ' mandatory fees: ' . json_encode($mandatory_fees));
        
        // Separate by semester
        $semester_1_specific = array_filter($mandatory_fees, function($fee) { 
            return $fee['semester'] === 'Semester 1'; 
        });
        $semester_2_specific = array_filter($mandatory_fees, function($fee) { 
            return $fee['semester'] === 'Semester 2'; 
        });
        $both_semester_fees = array_filter($mandatory_fees, function($fee) { 
            return $fee['semester'] === null; 
        });
        
        // Calculate amounts per semester
        $semester_1_amount = array_sum(array_column($semester_1_specific, 'amount'));
        $semester_2_amount = array_sum(array_column($semester_2_specific, 'amount'));
        
        // If no semester-specific fees but both-semester fees exist, split them based on categories
        if ($semester_1_amount == 0 && $semester_2_amount == 0 && !empty($both_semester_fees)) {
            // Split based on fee categories
            foreach ($both_semester_fees as $fee) {
                if ($fee['category_id'] == 19) { // Semester 1 category
                    $semester_1_amount += $fee['amount'];
                } else if ($fee['category_id'] == 20) { // Semester 2 category  
                    $semester_2_amount += $fee['amount'];
                } else {
                    // For other categories, split equally
                    $semester_1_amount += $fee['amount'] / 2;
                    $semester_2_amount += $fee['amount'] / 2;
                }
            }
        }
        
        // Total amount is sum of unique fees (both-semester fees counted once)
        $total_amount = array_sum(array_column($semester_1_specific, 'amount')) + 
                       array_sum(array_column($semester_2_specific, 'amount')) + 
                       array_sum(array_column($both_semester_fees, 'amount'));
        
        log_message('debug', 'Amounts - S1: ' . $semester_1_amount . ', S2: ' . $semester_2_amount . ', Total: ' . $total_amount);
        
        $result = [
            'semester_1' => [
                'is_mandatory' => '1',
                'amount' => number_format($semester_1_amount, 2, '.', '')
            ],
            'semester_2' => [
                'is_mandatory' => '1', 
                'amount' => number_format($semester_2_amount, 2, '.', '')
            ],
            'total_amount' => $total_amount,
            'status' => 'found'
        ];
        
        return $result;
    }

    public function get_semester_fees_for_grade_division($grade_id, $division_id, $academic_year_id) {
        $result = [
            'semester_1' => [
                'mandatory_fees' => [],
                'optional_fees' => [],
                'mandatory_total' => 0,
                'optional_total' => 0,
                'total_amount' => 0,
                'status' => 'no_record',
                'message' => 'No fee record found for Semester 1'
            ],
            'semester_2' => [
                'mandatory_fees' => [],
                'optional_fees' => [],
                'mandatory_total' => 0,
                'optional_total' => 0,
                'total_amount' => 0,
                'status' => 'no_record', 
                'message' => 'No fee record found for Semester 2'
            ]
        ];
        
        // Get all fees (semester-specific and both-semester fees)
        $all_fees = $this->get_all_fees_for_grade_division($grade_id, $division_id, $academic_year_id);
        
        // Separate fees by type and semester
        $semester_1_specific = array_filter($all_fees, function($fee) { return $fee['semester'] === 'Semester 1'; });
        $semester_2_specific = array_filter($all_fees, function($fee) { return $fee['semester'] === 'Semester 2'; });
        $both_semester_fees = array_filter($all_fees, function($fee) { return $fee['semester'] === null; });
        
        // Process Semester 1 (specific + both semester fees)
        $semester_1_all = array_merge($semester_1_specific, $both_semester_fees);
        if (!empty($semester_1_all)) {
            $mandatory_s1 = array_filter($semester_1_all, function($fee) { return $fee['is_mandatory'] == 1; });
            $optional_s1 = array_filter($semester_1_all, function($fee) { return $fee['is_mandatory'] == 0; });
            
            $mandatory_total_s1 = array_sum(array_column($mandatory_s1, 'amount'));
            $optional_total_s1 = array_sum(array_column($optional_s1, 'amount'));
            
            $result['semester_1'] = [
                'mandatory_fees' => array_values($mandatory_s1),
                'optional_fees' => array_values($optional_s1),
                'mandatory_total' => $mandatory_total_s1,
                'optional_total' => $optional_total_s1,
                'total_amount' => $mandatory_total_s1 + $optional_total_s1,
                'status' => 'found',
                'message' => 'Mandatory: ' . count($mandatory_s1) . ' fees (₹' . number_format($mandatory_total_s1) . '), Optional: ' . count($optional_s1) . ' fees'
            ];
        }
        
        // Process Semester 2 (specific + both semester fees)
        $semester_2_all = array_merge($semester_2_specific, $both_semester_fees);
        if (!empty($semester_2_all)) {
            $mandatory_s2 = array_filter($semester_2_all, function($fee) { return $fee['is_mandatory'] == 1; });
            $optional_s2 = array_filter($semester_2_all, function($fee) { return $fee['is_mandatory'] == 0; });
            
            $mandatory_total_s2 = array_sum(array_column($mandatory_s2, 'amount'));
            $optional_total_s2 = array_sum(array_column($optional_s2, 'amount'));
            
            $result['semester_2'] = [
                'mandatory_fees' => array_values($mandatory_s2),
                'optional_fees' => array_values($optional_s2),
                'mandatory_total' => $mandatory_total_s2,
                'optional_total' => $optional_total_s2,
                'total_amount' => $mandatory_total_s2 + $optional_total_s2,
                'status' => 'found',
                'message' => 'Mandatory: ' . count($mandatory_s2) . ' fees (₹' . number_format($mandatory_total_s2) . '), Optional: ' . count($optional_s2) . ' fees'
            ];
        }
        
        return $result;
    }
    
    /**
     * Process semester fees for a specific semester result array
     * @param array &$semester_result Reference to semester result array to populate
     * @param array $semester_specific_fees Fees specific to this semester
     * @param array $both_semester_fees Fees that apply to both semesters
     */
    private function process_semester_fees(&$semester_result, $semester_specific_fees, $both_semester_fees) {
        // Combine semester-specific fees with both-semester fees
        $all_semester_fees = array_merge($semester_specific_fees, $both_semester_fees);
        
        if (!empty($all_semester_fees)) {
            $mandatory_fees = array_filter($all_semester_fees, function($fee) { return $fee['is_mandatory'] == 1; });
            $optional_fees = array_filter($all_semester_fees, function($fee) { return $fee['is_mandatory'] == 0; });
            
            $mandatory_total = array_sum(array_column($mandatory_fees, 'amount'));
            $optional_total = array_sum(array_column($optional_fees, 'amount'));
            
            $semester_result = [
                'mandatory_fees' => array_values($mandatory_fees),
                'optional_fees' => array_values($optional_fees),
                'mandatory_total' => $mandatory_total,
                'optional_total' => $optional_total,
                'total_amount' => $mandatory_total + $optional_total,
                'status' => 'found',
                'message' => 'Mandatory: ' . count($mandatory_fees) . ' fees (₹' . number_format($mandatory_total) . '), Optional: ' . count($optional_fees) . ' fees'
            ];
        }
    }
    
    /**
     * Get all fees for a specific grade only (all semesters, all academic years)
     */
    private function get_all_fees_for_grade($grade_id) {
        $this->db->select('fs.id, fs.amount, fs.due_date, fs.semester, fs.description, fs.is_mandatory, fc.name as category_name, fc.id as category_id');
        $this->db->from('fee_structures fs');
        $this->db->join('fee_categories fc', 'fs.fee_category_id = fc.id');
        $this->db->where('fs.is_active', 1);
        
        // Filter by grade or universal fees
        $this->db->group_start();
        $this->db->where('fs.grade_id', $grade_id);  // Fees for this specific grade
        $this->db->or_where('fs.grade_id IS NULL');  // Universal fees (all grades)
        $this->db->group_end();
        
        $this->db->order_by('fc.name, fs.amount');
        
        $query = $this->db->get();
        return $query->result_array();
    }

    /**
     * Get all fees for a specific grade and division (all semesters)
     */
    private function get_all_fees_for_grade_division($grade_id, $division_id, $academic_year_id) {
        $this->db->select('fs.id, fs.amount, fs.due_date, fs.semester, fs.description, fs.is_mandatory, fc.name as category_name, fc.id as category_id');
        $this->db->from('fee_structures fs');
        $this->db->join('fee_categories fc', 'fs.fee_category_id = fc.id');
        $this->db->where('fs.academic_year_id', $academic_year_id);
        $this->db->where('fs.is_active', 1);
        
        // Priority order: Specific grade+division > Grade only > Universal
        $this->db->group_start();
        
        // 1. Specific to grade and division
        $this->db->group_start();
        $this->db->where('fs.grade_id', $grade_id);
        $this->db->where('fs.division_id', $division_id);
        $this->db->group_end();
        
        // 2. Specific to grade only (all divisions)
        $this->db->or_group_start();
        $this->db->where('fs.grade_id', $grade_id);
        $this->db->where('fs.division_id IS NULL', null, false);
        $this->db->group_end();
        
        // 3. Universal fees (all grades and divisions)
        $this->db->or_group_start();
        $this->db->where('fs.grade_id IS NULL', null, false);
        $this->db->where('fs.division_id IS NULL', null, false);
        $this->db->group_end();
        
        $this->db->group_end();
        
        $this->db->order_by('fc.name');
        
        $query = $this->db->get();
        return $query->result_array();
    }

    /**
     * Get fees for a specific semester, grade, and division
     */
    private function get_fees_for_semester($grade_id, $division_id, $academic_year_id, $semester) {
        $this->db->select('fs.id, fs.amount, fs.due_date, fs.semester, fs.description, fs.is_mandatory, fc.name as category_name, fc.id as category_id');
        $this->db->from('fee_structures fs');
        $this->db->join('fee_categories fc', 'fs.fee_category_id = fc.id');
        $this->db->where('fs.academic_year_id', $academic_year_id);
        
        // Include fees for specific semester OR fees that apply to both semesters (NULL)
        $this->db->group_start();
        $this->db->where('fs.semester', $semester);
        $this->db->or_where('fs.semester IS NULL', null, false);
        $this->db->group_end();
        
        $this->db->where('fs.is_active', 1);
        
        // Priority order: Specific grade+division > Grade only > Universal
        $this->db->group_start();
        
        // 1. Specific to grade and division
        $this->db->group_start();
        $this->db->where('fs.grade_id', $grade_id);
        $this->db->where('fs.division_id', $division_id);
        $this->db->group_end();
        
        // 2. Specific to grade only (all divisions)
        $this->db->or_group_start();
        $this->db->where('fs.grade_id', $grade_id);
        $this->db->where('fs.division_id IS NULL', null, false);
        $this->db->group_end();
        
        // 3. Universal fees (all grades and divisions)
        $this->db->or_group_start();
        $this->db->where('fs.grade_id IS NULL', null, false);
        $this->db->where('fs.division_id IS NULL', null, false);
        $this->db->group_end();
        
        $this->db->group_end();
        
        $this->db->order_by('fc.name');
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    /**
     * Get student's assigned semester fees with payment status
     */
    public function get_student_semester_fees($student_id, $academic_year_id = null) {
        if (!$academic_year_id) {
            $this->load->model('Academic_year_model');
            $current_year = $this->Academic_year_model->get_default_academic_year();
            $academic_year_id = $current_year ? $current_year['id'] : null;
        }
        
        if (!$academic_year_id) {
            return ['semester_1' => [], 'semester_2' => []];
        }
        
        $this->db->select('sfa.*, fs.semester, fc.name as category_name');
        $this->db->from('student_fee_assignments sfa');
        $this->db->join('fee_structures fs', 'sfa.fee_structure_id = fs.id');
        $this->db->join('fee_categories fc', 'fs.fee_category_id = fc.id');
        $this->db->where('sfa.student_id', $student_id);
        $this->db->where('fs.academic_year_id', $academic_year_id);
        $this->db->where('sfa.is_active', 1);
        $this->db->order_by('fs.semester, fc.name');
        
        $query = $this->db->get();
        $fees = $query->result_array();
        
        $result = [
            'semester_1' => [],
            'semester_2' => []
        ];
        
        foreach ($fees as $fee) {
            if ($fee['semester'] == 'Semester 1') {
                $result['semester_1'][] = $fee;
            } else if ($fee['semester'] == 'Semester 2') {
                $result['semester_2'][] = $fee;
            }
        }
        
        return $result;
    }

    // Public wrapper for assign_fees_to_student (for debugging)
    public function assign_fees_to_student_public($student_id, $grade_id, $division_id, $academic_year_id) {
        return $this->assign_fees_to_student($student_id, $grade_id, $division_id, $academic_year_id);
    }

    // Get students for fee assignment (simpler query)
    public function get_students_for_fee_assignment() {
        $this->db->select('id, student_name, grade_id, division_id, academic_year_id');
        $this->db->from('students');
        $this->db->where('is_active', 1);
        $this->db->order_by('id');
        
        $query = $this->db->get();
        return $query->result_array();
    }
}