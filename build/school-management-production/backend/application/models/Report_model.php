<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Report_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    // Student Reports
    public function get_student_enrollment_report($filters = []) {
        $this->db->select('ay.name as academic_year, g.name as grade_name, d.name as division_name, 
                          COUNT(s.id) as total_students,
                          COUNT(CASE WHEN s.gender = "male" THEN 1 END) as male_students,
                          COUNT(CASE WHEN s.gender = "female" THEN 1 END) as female_students');
        $this->db->from('students s');
        $this->db->join('grades g', 's.grade_id = g.id');
        $this->db->join('divisions d', 's.division_id = d.id');
        $this->db->join('academic_years ay', 's.academic_year_id = ay.id');
        $this->db->where('s.is_active', 1);
        
        if (!empty($filters['academic_year_id'])) {
            $this->db->where('s.academic_year_id', $filters['academic_year_id']);
        }
        if (!empty($filters['grade_id'])) {
            $this->db->where('s.grade_id', $filters['grade_id']);
        }
        if (!empty($filters['division_id'])) {
            $this->db->where('s.division_id', $filters['division_id']);
        }
        
        $this->db->group_by('s.academic_year_id, s.grade_id, s.division_id');
        $this->db->order_by('g.name, d.name');
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    public function get_student_attendance_summary($filters = []) {
        // This would typically require an attendance table
        // For now, return mock data structure
        return [
            'total_students' => 450,
            'present_today' => 420,
            'absent_today' => 30,
            'attendance_percentage' => 93.33,
            'by_grade' => [
                ['grade_name' => 'Grade 1', 'present' => 45, 'total' => 50, 'percentage' => 90],
                ['grade_name' => 'Grade 2', 'present' => 48, 'total' => 52, 'percentage' => 92.3],
                // Add more grades as needed
            ]
        ];
    }
    
    // Fee Collection Reports
    public function get_fee_collection_report($filters = []) {
        // Updated query with proper joins and filtering
        $this->db->select('fc.collection_date, 
                          ft.name as category_name,
                          s.student_name,
                          s.roll_number,
                          g.name as grade_name,
                          d.name as division_name,
                          fc.amount as fee_amount,
                          fc.payment_method,
                          fc.receipt_number,
                          staff.name as collected_by_name,
                          fc.remarks');
        $this->db->from('fee_collections fc');
        $this->db->join('fee_types ft', 'fc.fee_type_id = ft.id', 'left');
        $this->db->join('students s', 'fc.student_id = s.id', 'left');
        $this->db->join('grades g', 's.grade_id = g.id', 'left');
        $this->db->join('divisions d', 's.division_id = d.id', 'left');
        $this->db->join('staff', 'fc.collected_by = staff.id', 'left');
        
        // Apply filters
        if (!empty($filters['academic_year_id'])) {
            $this->db->where('fc.academic_year_id', $filters['academic_year_id']);
        }
        if (!empty($filters['category_id'])) {
            $this->db->where('fc.fee_type_id', $filters['category_id']);
        }
        if (!empty($filters['start_date'])) {
            $this->db->where('fc.collection_date >=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $this->db->where('fc.collection_date <=', $filters['end_date']);
        }
        if (!empty($filters['staff_id'])) {
            $this->db->where('fc.collected_by', $filters['staff_id']);
        }
        
        // Only show collected fees
        $this->db->where('fc.status', 'collected');
        
        $this->db->order_by('fc.collection_date DESC, fc.id DESC');
        
        $query = $this->db->get();
        
        if (!$query) {
            throw new Exception('Database query failed: ' . $this->db->error()['message']);
        }
        
        return $query->result_array();
    }
    
    public function get_fee_dues_report($filters = []) {
        $this->db->select('s.student_name, s.roll_number, g.name as grade_name, d.name as division_name,
                          p.name as parent_name, p.mobile as parent_mobile,
                          fc.name as category_name, sfa.total_amount, sfa.paid_amount, sfa.pending_amount,
                          sfa.due_date, sfa.status,
                          DATEDIFF(CURDATE(), sfa.due_date) as days_overdue');
        $this->db->from('student_fee_assignments sfa');
        $this->db->join('students s', 'sfa.student_id = s.id');
        $this->db->join('grades g', 's.grade_id = g.id');
        $this->db->join('divisions d', 's.division_id = d.id');
        $this->db->join('parents p', 's.parent_id = p.id');
        $this->db->join('fee_structures fs', 'sfa.fee_structure_id = fs.id');
        $this->db->join('fee_categories fc', 'fs.fee_category_id = fc.id');
        $this->db->where('sfa.is_active', 1);
        $this->db->where('sfa.pending_amount >', 0);
        
        if (!empty($filters['academic_year_id'])) {
            $this->db->where('fs.academic_year_id', $filters['academic_year_id']);
        }
        if (!empty($filters['grade_id'])) {
            $this->db->where('s.grade_id', $filters['grade_id']);
        }
        if (!empty($filters['category_id'])) {
            $this->db->where('fs.fee_category_id', $filters['category_id']);
        }
        if (!empty($filters['status'])) {
            $this->db->where('sfa.status', $filters['status']);
        }
        if (!empty($filters['overdue_only'])) {
            $this->db->where('sfa.due_date <', date('Y-m-d'));
        }
        
        $this->db->order_by('sfa.due_date ASC, s.student_name');
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    public function get_staff_collection_report($filters = []) {
        // Updated query with proper joins and correct field names
        $this->db->select('fc.collected_by as staff_id,
                          s.name as staff_name,
                          s.email as staff_email,
                          r.name as role_name,
                          COUNT(fc.id) as transaction_count,
                          SUM(fc.amount) as total_collected,
                          SUM(CASE WHEN fc.payment_method = "cash" THEN fc.amount ELSE 0 END) as cash_amount,
                          SUM(CASE WHEN fc.payment_method = "online" THEN fc.amount ELSE 0 END) as online_amount,
                          SUM(CASE WHEN fc.payment_method = "cheque" THEN fc.amount ELSE 0 END) as cheque_amount,
                          MIN(fc.collection_date) as first_collection,
                          MAX(fc.collection_date) as last_collection');
        $this->db->from('fee_collections fc');
        $this->db->join('staff s', 'fc.collected_by = s.id', 'left');
        $this->db->join('roles r', 's.role_id = r.id', 'left');
        $this->db->where('fc.collected_by IS NOT NULL');
        $this->db->where('fc.status', 'collected');
        
        // Apply filters
        if (!empty($filters['academic_year_id'])) {
            $this->db->where('fc.academic_year_id', $filters['academic_year_id']);
        }
        if (!empty($filters['start_date'])) {
            $this->db->where('fc.collection_date >=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $this->db->where('fc.collection_date <=', $filters['end_date']);
        }
        if (!empty($filters['staff_id'])) {
            $this->db->where('fc.collected_by', $filters['staff_id']);
        }
        
        $this->db->group_by('fc.collected_by, s.name, s.email, r.name');
        $this->db->order_by('total_collected DESC');
        
        $query = $this->db->get();
        
        if (!$query) {
            throw new Exception('Database query failed: ' . $this->db->error()['message']);
        }
        
        return $query->result_array();
    }
    
    // Announcement Reports
    public function get_announcement_report($filters = []) {
        $this->db->select('a.title, a.target_type, a.status, a.total_recipients, a.sent_count, a.failed_count,
                          a.created_at, a.sent_at, s.name as created_by_name,
                          COUNT(DISTINCT ads.id) as delivery_records');
        $this->db->from('announcements a');
        $this->db->join('staff s', 'a.created_by_staff_id = s.id');
        $this->db->join('announcement_delivery_status ads', 'a.id = ads.announcement_id', 'left');
        $this->db->where('a.is_active', 1);
        
        if (!empty($filters['start_date'])) {
            $this->db->where('a.created_at >=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $this->db->where('a.created_at <=', $filters['end_date'] . ' 23:59:59');
        }
        if (!empty($filters['status'])) {
            $this->db->where('a.status', $filters['status']);
        }
        if (!empty($filters['target_type'])) {
            $this->db->where('a.target_type', $filters['target_type']);
        }
        
        $this->db->group_by('a.id');
        $this->db->order_by('a.created_at DESC');
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    // Complaint Reports
    public function get_complaint_report($filters = []) {
        // Simple query that works with basic complaints table
        $this->db->select('c.complaint_number, c.subject, c.category, c.priority, c.status,
                          c.created_at, c.resolved_at, c.updated_at, c.parent_id,
                          "Parent" as parent_name, "Student" as student_name,
                          "Staff Member" as assigned_to_name, "Staff Member" as resolved_by_name,
                          CASE 
                            WHEN c.resolved_at IS NOT NULL THEN DATEDIFF(c.resolved_at, c.created_at)
                            ELSE DATEDIFF(NOW(), c.created_at)
                          END as resolution_days,
                          0 as comment_count');
        $this->db->from('complaints c');
        
        if (!empty($filters['start_date'])) {
            $this->db->where('c.created_at >=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $this->db->where('c.created_at <=', $filters['end_date'] . ' 23:59:59');
        }
        if (!empty($filters['status'])) {
            $this->db->where('c.status', $filters['status']);
        }
        if (!empty($filters['category'])) {
            $this->db->where('c.category', $filters['category']);
        }
        if (!empty($filters['priority'])) {
            $this->db->where('c.priority', $filters['priority']);
        }
        if (!empty($filters['assigned_to'])) {
            $this->db->where('c.assigned_to_staff_id', $filters['assigned_to']);
        }
        
        $this->db->order_by('c.created_at DESC');
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    // Dashboard Analytics
    public function get_dashboard_analytics($filters = []) {
        $analytics = [];
        
        // Student Stats
        $this->db->where('is_active', 1);
        if (!empty($filters['academic_year_id'])) {
            $this->db->where('academic_year_id', $filters['academic_year_id']);
        }
        $analytics['total_students'] = $this->db->count_all_results('students');
        
        // Parent Stats
        $this->db->where('is_active', 1);
        $analytics['total_parents'] = $this->db->count_all_results('parents');
        
        // Staff Stats
        $this->db->where('is_active', 1);
        $analytics['total_staff'] = $this->db->count_all_results('staff');
        
        // Fee Collection Stats (Current Month)
        $start_of_month = date('Y-m-01');
        $end_of_month = date('Y-m-t');
        
        $this->db->select('COUNT(*) as transaction_count, SUM(amount) as total_amount');
        $this->db->where('collection_date >=', $start_of_month);
        $this->db->where('collection_date <=', $end_of_month);
        $fee_stats = $this->db->get('fee_collections')->row_array();
        
        $analytics['monthly_collections'] = [
            'transaction_count' => $fee_stats['transaction_count'] ?: 0,
            'total_amount' => $fee_stats['total_amount'] ?: 0
        ];
        
        // Pending Fees
        $this->db->select('COUNT(*) as pending_count, SUM(pending_amount) as pending_amount');
        $this->db->where('is_active', 1);
        $this->db->where('pending_amount >', 0);
        $pending_fees = $this->db->get('student_fee_assignments')->row_array();
        
        $analytics['pending_fees'] = [
            'count' => $pending_fees['pending_count'] ?: 0,
            'amount' => $pending_fees['pending_amount'] ?: 0
        ];
        
        // Recent Announcements
        $this->db->where('is_active', 1);
        $this->db->where('created_at >=', date('Y-m-d', strtotime('-7 days')));
        $analytics['recent_announcements'] = $this->db->count_all_results('announcements');
        
        // Active Complaints
        $this->db->where_in('status', ['new', 'in_progress']);
        $analytics['active_complaints'] = $this->db->count_all_results('complaints');
        
        // Grade-wise distribution
        $this->db->select('g.name as grade_name, COUNT(s.id) as student_count');
        $this->db->from('students s');
        $this->db->join('grades g', 's.grade_id = g.id');
        $this->db->where('s.is_active', 1);
        if (!empty($filters['academic_year_id'])) {
            $this->db->where('s.academic_year_id', $filters['academic_year_id']);
        }
        $this->db->group_by('s.grade_id');
        $this->db->order_by('g.name');
        $grade_distribution = $this->db->get()->result_array();
        
        $analytics['grade_distribution'] = $grade_distribution;
        
        return $analytics;
    }
    
    // Export helper functions
    public function format_report_for_export($data, $type = 'csv') {
        if (empty($data)) {
            return '';
        }
        
        if ($type === 'csv' || $type === 'excel') {
            $output = '';
            $headers = array_keys($data[0]);
            
            // Format headers for better readability
            $formatted_headers = array_map(function($header) {
                return ucwords(str_replace('_', ' ', $header));
            }, $headers);
            
            if ($type === 'excel') {
                // Add BOM for proper UTF-8 encoding in Excel
                $output .= "\xEF\xBB\xBF";
            }
            
            $output .= implode(',', array_map(function($header) {
                return '"' . str_replace('"', '""', $header) . '"';
            }, $formatted_headers)) . "\n";
            
            foreach ($data as $row) {
                $output .= implode(',', array_map(function($field) {
                    // Handle different data types
                    if (is_null($field)) {
                        return '""';
                    }
                    // Format currency fields
                    if (is_numeric($field) && (strpos($field, '.') !== false)) {
                        return '"' . number_format($field, 2) . '"';
                    }
                    return '"' . str_replace('"', '""', $field) . '"';
                }, $row)) . "\n";
            }
            
            return $output;
        }
        
        return $data;
    }
    
    // Global Search Functions
    public function global_search($query, $types = ['students', 'parents', 'staff'], $limit = 50) {
        $results = [];
        
        try {
            if (in_array('students', $types)) {
                $results['students'] = $this->search_students($query, $limit);
            }
        } catch (Exception $e) {
            error_log('Student search error: ' . $e->getMessage());
            $results['students'] = [];
        }
        
        try {
            if (in_array('parents', $types)) {
                $results['parents'] = $this->search_parents($query, $limit);
            }
        } catch (Exception $e) {
            error_log('Parent search error: ' . $e->getMessage());
            $results['parents'] = [];
        }
        
        try {
            if (in_array('staff', $types)) {
                $results['staff'] = $this->search_staff($query, $limit);
            }
        } catch (Exception $e) {
            error_log('Staff search error: ' . $e->getMessage());
            $results['staff'] = [];
        }
        
        try {
            if (in_array('complaints', $types)) {
                $results['complaints'] = $this->search_complaints($query, $limit);
            }
        } catch (Exception $e) {
            error_log('Complaints search error: ' . $e->getMessage());
            $results['complaints'] = [];
        }
        
        try {
            if (in_array('announcements', $types)) {
                $results['announcements'] = $this->search_announcements($query, $limit);
            }
        } catch (Exception $e) {
            error_log('Announcements search error: ' . $e->getMessage());
            $results['announcements'] = [];
        }
        
        return $results;
    }
    
    private function search_students($query, $limit) {
        $this->db->select('s.id, s.student_name as name, s.roll_number, p.mobile,
                          g.name as grade_name, d.name as division_name, "student" as type');
        $this->db->from('students s');
        $this->db->join('grades g', 's.grade_id = g.id');
        $this->db->join('divisions d', 's.division_id = d.id');
        $this->db->join('parents p', 's.parent_id = p.id', 'left');
        $this->db->where('s.is_active', 1);
        
        $this->db->group_start();
        $this->db->like('s.student_name', $query);
        $this->db->or_like('s.roll_number', $query);
        $this->db->or_like('s.sam_samagrah_id', $query);
        $this->db->or_like('s.aapar_id', $query);
        $this->db->or_like('p.mobile', $query);
        $this->db->group_end();
        
        $this->db->order_by('s.student_name');
        $this->db->limit($limit);
        
        return $this->db->get()->result_array();
    }
    
    private function search_parents($query, $limit) {
        $this->db->select('p.id, p.name, p.mobile, p.email, "parent" as type,
                          COUNT(s.id) as student_count');
        $this->db->from('parents p');
        $this->db->join('students s', 'p.id = s.parent_id AND s.is_active = 1', 'left');
        $this->db->where('p.is_active', 1);
        
        $this->db->group_start();
        $this->db->like('p.name', $query);
        $this->db->or_like('p.mobile', $query);
        $this->db->or_like('p.email', $query);
        $this->db->group_end();
        
        $this->db->group_by('p.id');
        $this->db->order_by('p.name');
        $this->db->limit($limit);
        
        return $this->db->get()->result_array();
    }
    
    private function search_staff($query, $limit) {
        $this->db->select('s.id, s.name, s.mobile, s.email, r.name as role_name, "staff" as type');
        $this->db->from('staff s');
        $this->db->join('roles r', 's.role_id = r.id', 'left');
        $this->db->where('s.is_active', 1);
        
        $this->db->group_start();
        $this->db->like('s.name', $query);
        $this->db->or_like('s.mobile', $query);
        $this->db->or_like('s.email', $query);
        $this->db->or_like('r.name', $query);
        $this->db->group_end();
        
        $this->db->order_by('s.name');
        $this->db->limit($limit);
        
        return $this->db->get()->result_array();
    }
    
    private function search_complaints($query, $limit) {
        $this->db->select('c.id, CONCAT("CMP-", c.id) as complaint_number, c.subject, c.status, c.created_at, "complaint" as type,
                          p.name as parent_name');
        $this->db->from('complaints c');
        $this->db->join('parents p', 'c.parent_id = p.id');
        
        $this->db->group_start();
        $this->db->like('c.subject', $query);
        $this->db->or_like('c.description', $query);
        $this->db->or_like('p.name', $query);
        $this->db->group_end();
        
        $this->db->order_by('c.created_at DESC');
        $this->db->limit($limit);
        
        return $this->db->get()->result_array();
    }
    
    private function search_announcements($query, $limit) {
        $this->db->select('a.id, a.title, a.status, a.created_at, "announcement" as type,
                          s.name as created_by_name');
        $this->db->from('announcements a');
        $this->db->join('staff s', 'a.created_by = s.id');
        
        $this->db->group_start();
        $this->db->like('a.title', $query);
        $this->db->or_like('a.content', $query);
        $this->db->group_end();
        
        $this->db->order_by('a.created_at DESC');
        $this->db->limit($limit);
        
        return $this->db->get()->result_array();
    }
}