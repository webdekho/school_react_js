<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Complaint_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    public function get_complaints_paginated($limit, $offset, $filters = []) {
        $this->db->select('c.*, p.name as parent_name, p.mobile as parent_mobile, 
                          s.student_name, s.roll_number, g.name as grade_name, d.name as division_name,
                          staff_assigned.name as assigned_to_name, staff_resolved.name as resolved_by_name,
                          COUNT(cc.id) as comment_count');
        $this->db->from('complaints c');
        $this->db->join('parents p', 'c.parent_id = p.id');
        $this->db->join('students s', 'c.student_id = s.id', 'left');
        $this->db->join('grades g', 's.grade_id = g.id', 'left');
        $this->db->join('divisions d', 's.division_id = d.id', 'left');
        $this->db->join('staff staff_assigned', 'c.assigned_to_staff_id = staff_assigned.id', 'left');
        $this->db->join('staff staff_resolved', 'c.resolved_by_staff_id = staff_resolved.id', 'left');
        $this->db->join('complaint_comments cc', 'c.id = cc.complaint_id', 'left');
        
        // Apply filters
        if (!empty($filters['status'])) {
            if (is_array($filters['status'])) {
                $this->db->where_in('c.status', $filters['status']);
            } else {
                $this->db->where('c.status', $filters['status']);
            }
        }
        
        if (!empty($filters['category'])) {
            $this->db->where('c.category', $filters['category']);
        }
        
        if (!empty($filters['priority'])) {
            $this->db->where('c.priority', $filters['priority']);
        }
        
        if (!empty($filters['assigned_to_staff_id'])) {
            $this->db->where('c.assigned_to_staff_id', $filters['assigned_to_staff_id']);
        }
        
        if (!empty($filters['start_date'])) {
            $this->db->where('c.created_at >=', $filters['start_date']);
        }
        
        if (!empty($filters['end_date'])) {
            $this->db->where('c.created_at <=', $filters['end_date'] . ' 23:59:59');
        }
        
        if (!empty($filters['search'])) {
            $this->db->group_start();
            $this->db->like('c.complaint_number', $filters['search']);
            $this->db->or_like('c.subject', $filters['search']);
            $this->db->or_like('c.description', $filters['search']);
            $this->db->or_like('p.name', $filters['search']);
            $this->db->or_like('s.student_name', $filters['search']);
            $this->db->group_end();
        }
        
        $this->db->group_by('c.id');
        $this->db->order_by('c.created_at', 'DESC');
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get();
        $results = $query->result_array();
        
        // Decode JSON fields
        foreach ($results as &$row) {
            $row['attachments'] = json_decode($row['attachments'], true) ?: [];
        }
        
        return $results;
    }
    
    public function count_complaints($filters = []) {
        $this->db->from('complaints c');
        $this->db->join('parents p', 'c.parent_id = p.id');
        $this->db->join('students s', 'c.student_id = s.id', 'left');
        
        // Apply same filters as in paginated query
        if (!empty($filters['status'])) {
            if (is_array($filters['status'])) {
                $this->db->where_in('c.status', $filters['status']);
            } else {
                $this->db->where('c.status', $filters['status']);
            }
        }
        
        if (!empty($filters['category'])) {
            $this->db->where('c.category', $filters['category']);
        }
        
        if (!empty($filters['priority'])) {
            $this->db->where('c.priority', $filters['priority']);
        }
        
        if (!empty($filters['assigned_to_staff_id'])) {
            $this->db->where('c.assigned_to_staff_id', $filters['assigned_to_staff_id']);
        }
        
        if (!empty($filters['start_date'])) {
            $this->db->where('c.created_at >=', $filters['start_date']);
        }
        
        if (!empty($filters['end_date'])) {
            $this->db->where('c.created_at <=', $filters['end_date'] . ' 23:59:59');
        }
        
        if (!empty($filters['search'])) {
            $this->db->group_start();
            $this->db->like('c.complaint_number', $filters['search']);
            $this->db->or_like('c.subject', $filters['search']);
            $this->db->or_like('c.description', $filters['search']);
            $this->db->or_like('p.name', $filters['search']);
            $this->db->or_like('s.student_name', $filters['search']);
            $this->db->group_end();
        }
        
        return $this->db->count_all_results();
    }
    
    public function get_complaint_by_id($id) {
        $this->db->select('c.*, p.name as parent_name, p.mobile as parent_mobile, p.email as parent_email,
                          s.student_name, s.roll_number, g.name as grade_name, d.name as division_name,
                          staff_assigned.name as assigned_to_name, staff_resolved.name as resolved_by_name');
        $this->db->from('complaints c');
        $this->db->join('parents p', 'c.parent_id = p.id');
        $this->db->join('students s', 'c.student_id = s.id', 'left');
        $this->db->join('grades g', 's.grade_id = g.id', 'left');
        $this->db->join('divisions d', 's.division_id = d.id', 'left');
        $this->db->join('staff staff_assigned', 'c.assigned_to_staff_id = staff_assigned.id', 'left');
        $this->db->join('staff staff_resolved', 'c.resolved_by_staff_id = staff_resolved.id', 'left');
        $this->db->where('c.id', $id);
        
        $query = $this->db->get();
        $result = $query->row_array();
        
        if ($result) {
            $result['attachments'] = json_decode($result['attachments'], true) ?: [];
        }
        
        return $result;
    }
    
    public function create_complaint($data) {
        // Generate complaint number
        $data['complaint_number'] = $this->generate_complaint_number();
        $data['attachments'] = json_encode($data['attachments'] ?: []);
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        if ($this->db->insert('complaints', $data)) {
            return $this->db->insert_id();
        }
        return false;
    }
    
    public function update_complaint($id, $data) {
        if (isset($data['attachments'])) {
            $data['attachments'] = json_encode($data['attachments'] ?: []);
        }
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        // If status is being changed to resolved, set resolution timestamp
        if (isset($data['status']) && $data['status'] === 'resolved' && isset($data['resolved_by_staff_id'])) {
            $data['resolved_at'] = date('Y-m-d H:i:s');
        }
        
        $this->db->where('id', $id);
        return $this->db->update('complaints', $data);
    }
    
    public function assign_complaint($id, $staff_id, $assigned_by_id) {
        $this->db->trans_start();
        
        // Update complaint assignment
        $this->db->where('id', $id);
        $result = $this->db->update('complaints', [
            'assigned_to_staff_id' => $staff_id,
            'status' => 'in_progress',
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        
        if ($result) {
            // Add assignment comment
            $this->add_comment($id, [
                'commented_by_type' => 'staff',
                'commented_by_id' => $assigned_by_id,
                'comment' => 'Complaint assigned to staff member.',
                'is_internal' => 1
            ]);
        }
        
        $this->db->trans_complete();
        return $this->db->trans_status() !== FALSE;
    }
    
    public function resolve_complaint($id, $resolution, $resolved_by_staff_id) {
        $this->db->trans_start();
        
        // Update complaint status
        $this->db->where('id', $id);
        $result = $this->db->update('complaints', [
            'status' => 'resolved',
            'resolution' => $resolution,
            'resolved_by_staff_id' => $resolved_by_staff_id,
            'resolved_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        
        if ($result) {
            // Add resolution comment
            $this->add_comment($id, [
                'commented_by_type' => 'staff',
                'commented_by_id' => $resolved_by_staff_id,
                'comment' => 'Complaint resolved: ' . $resolution,
                'is_internal' => 0
            ]);
        }
        
        $this->db->trans_complete();
        return $this->db->trans_status() !== FALSE;
    }
    
    public function close_complaint($id, $closed_by_staff_id) {
        $this->db->where('id', $id);
        $result = $this->db->update('complaints', [
            'status' => 'closed',
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        
        if ($result) {
            // Add closure comment
            $this->add_comment($id, [
                'commented_by_type' => 'staff',
                'commented_by_id' => $closed_by_staff_id,
                'comment' => 'Complaint closed.',
                'is_internal' => 1
            ]);
        }
        
        return $result;
    }
    
    public function add_comment($complaint_id, $comment_data) {
        $comment_data['complaint_id'] = $complaint_id;
        $comment_data['attachments'] = json_encode($comment_data['attachments'] ?: []);
        $comment_data['created_at'] = date('Y-m-d H:i:s');
        
        return $this->db->insert('complaint_comments', $comment_data);
    }
    
    public function get_complaint_comments($complaint_id, $include_internal = false) {
        $this->db->select('cc.*, 
                          CASE 
                            WHEN cc.commented_by_type = "parent" THEN p.name 
                            WHEN cc.commented_by_type = "staff" THEN s.name 
                            WHEN cc.commented_by_type = "admin" THEN s.name 
                          END as commented_by_name', FALSE);
        $this->db->from('complaint_comments cc');
        $this->db->join('parents p', 'cc.commented_by_id = p.id AND cc.commented_by_type = "parent"', 'left');
        $this->db->join('staff s', 'cc.commented_by_id = s.id AND cc.commented_by_type IN ("staff", "admin")', 'left');
        $this->db->where('cc.complaint_id', $complaint_id);
        
        if (!$include_internal) {
            $this->db->where('cc.is_internal', 0);
        }
        
        $this->db->order_by('cc.created_at', 'ASC');
        
        $query = $this->db->get();
        $results = $query->result_array();
        
        // Decode JSON fields
        foreach ($results as &$row) {
            $row['attachments'] = json_decode($row['attachments'], true) ?: [];
        }
        
        return $results;
    }
    
    private function generate_complaint_number() {
        $prefix = 'CMP' . date('Y');
        
        // Get the last complaint number for this year
        $this->db->like('complaint_number', $prefix, 'after');
        $this->db->order_by('id', 'DESC');
        $this->db->limit(1);
        $last_complaint = $this->db->get('complaints')->row_array();
        
        if ($last_complaint) {
            $last_number = substr($last_complaint['complaint_number'], -4);
            $next_number = str_pad((intval($last_number) + 1), 4, '0', STR_PAD_LEFT);
        } else {
            $next_number = '0001';
        }
        
        return $prefix . $next_number;
    }
    
    public function get_complaints_statistics() {
        $stats = [];
        
        // Total complaints
        $stats['total'] = $this->db->count_all('complaints');
        
        // By status
        $this->db->select('status, COUNT(*) as count');
        $this->db->group_by('status');
        $query = $this->db->get('complaints');
        $status_stats = $query->result_array();
        
        $stats['by_status'] = [];
        foreach ($status_stats as $stat) {
            $stats['by_status'][$stat['status']] = $stat['count'];
        }
        
        // By category
        $this->db->select('category, COUNT(*) as count');
        $this->db->group_by('category');
        $query = $this->db->get('complaints');
        $category_stats = $query->result_array();
        
        $stats['by_category'] = [];
        foreach ($category_stats as $stat) {
            $stats['by_category'][$stat['category']] = $stat['count'];
        }
        
        // By priority
        $this->db->select('priority, COUNT(*) as count');
        $this->db->group_by('priority');
        $query = $this->db->get('complaints');
        $priority_stats = $query->result_array();
        
        $stats['by_priority'] = [];
        foreach ($priority_stats as $stat) {
            $stats['by_priority'][$stat['priority']] = $stat['count'];
        }
        
        // Recent complaints (last 30 days)
        $this->db->where('created_at >=', date('Y-m-d', strtotime('-30 days')));
        $stats['recent'] = $this->db->count_all_results('complaints');
        
        // Average resolution time (in days)
        $this->db->select('AVG(DATEDIFF(resolved_at, created_at)) as avg_resolution_days');
        $this->db->where('status', 'resolved');
        $this->db->where('resolved_at IS NOT NULL');
        $query = $this->db->get('complaints');
        $resolution_time = $query->row_array();
        $stats['avg_resolution_days'] = round($resolution_time['avg_resolution_days'], 1) ?: 0;
        
        return $stats;
    }
    
    public function get_complaints_by_parent($parent_id, $limit = null, $offset = null) {
        $this->db->select('c.*, s.student_name, s.roll_number, 
                          staff_assigned.name as assigned_to_name, staff_resolved.name as resolved_by_name');
        $this->db->from('complaints c');
        $this->db->join('students s', 'c.student_id = s.id', 'left');
        $this->db->join('staff staff_assigned', 'c.assigned_to_staff_id = staff_assigned.id', 'left');
        $this->db->join('staff staff_resolved', 'c.resolved_by_staff_id = staff_resolved.id', 'left');
        $this->db->where('c.parent_id', $parent_id);
        $this->db->order_by('c.created_at', 'DESC');
        
        if ($limit) {
            $this->db->limit($limit, $offset);
        }
        
        $query = $this->db->get();
        $results = $query->result_array();
        
        // Decode JSON fields
        foreach ($results as &$row) {
            $row['attachments'] = json_decode($row['attachments'], true) ?: [];
        }
        
        return $results;
    }
    
    public function get_complaints_by_staff($staff_id, $limit = null, $offset = null) {
        $this->db->select('c.*, p.name as parent_name, s.student_name, s.roll_number,
                          COUNT(cc.id) as comment_count');
        $this->db->from('complaints c');
        $this->db->join('parents p', 'c.parent_id = p.id');
        $this->db->join('students s', 'c.student_id = s.id', 'left');
        $this->db->join('complaint_comments cc', 'c.id = cc.complaint_id', 'left');
        $this->db->where('c.assigned_to_staff_id', $staff_id);
        $this->db->group_by('c.id');
        $this->db->order_by('c.created_at', 'DESC');
        
        if ($limit) {
            $this->db->limit($limit, $offset);
        }
        
        $query = $this->db->get();
        $results = $query->result_array();
        
        // Decode JSON fields
        foreach ($results as &$row) {
            $row['attachments'] = json_decode($row['attachments'], true) ?: [];
        }
        
        return $results;
    }
}