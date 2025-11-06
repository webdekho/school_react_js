<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Attendance_model extends CI_Model {

    public function __construct() {
        parent::__construct();
    }

    /**
     * Mark attendance for a student
     */
    public function mark_attendance($data) {
        // Check if attendance already exists for this date
        $existing = $this->get_attendance_by_student_date($data['student_id'], $data['attendance_date']);
        
        if ($existing) {
            // Update existing attendance
            $this->db->where('id', $existing['id']);
            return $this->db->update('student_attendance', $data);
        } else {
            // Insert new attendance
            return $this->db->insert('student_attendance', $data);
        }
    }

    /**
     * Mark attendance for multiple students
     */
    public function mark_bulk_attendance($attendance_records) {
        $this->db->trans_start();
        
        foreach ($attendance_records as $record) {
            $this->mark_attendance($record);
        }
        
        $this->db->trans_complete();
        return $this->db->trans_status();
    }

    /**
     * Get attendance by student and date
     */
    public function get_attendance_by_student_date($student_id, $date) {
        return $this->db->get_where('student_attendance', [
            'student_id' => $student_id,
            'attendance_date' => $date
        ])->row_array();
    }

    /**
     * Get attendance for a student within date range
     */
    public function get_student_attendance($student_id, $start_date = null, $end_date = null) {
        $this->db->select('sa.*, s.student_name, s.roll_number');
        $this->db->from('student_attendance sa');
        $this->db->join('students s', 's.id = sa.student_id');
        $this->db->where('sa.student_id', $student_id);
        
        if ($start_date) {
            $this->db->where('sa.attendance_date >=', $start_date);
        }
        if ($end_date) {
            $this->db->where('sa.attendance_date <=', $end_date);
        }
        
        $this->db->order_by('sa.attendance_date', 'DESC');
        
        return $this->db->get()->result_array();
    }

    /**
     * Get attendance for a grade/division on a specific date
     */
    public function get_class_attendance($grade_id, $division_id, $date) {
        $this->db->select('s.id, s.student_name, s.roll_number, sa.status, sa.check_in_time, sa.check_out_time, sa.remarks, sa.id as attendance_id');
        $this->db->from('students s');
        $this->db->where('s.grade_id', $grade_id);
        $this->db->where('s.division_id', $division_id);
        $this->db->where('s.is_active', 1);
        $this->db->join('student_attendance sa', "sa.student_id = s.id AND sa.attendance_date = '$date'", 'left');
        $this->db->order_by('s.roll_number', 'ASC');
        
        return $this->db->get()->result_array();
    }

    /**
     * Get attendance statistics for a student
     */
    public function get_student_attendance_stats($student_id, $start_date = null, $end_date = null) {
        $this->db->select('
            COUNT(*) as total_days,
            SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present_days,
            SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) as absent_days,
            SUM(CASE WHEN status = "late" THEN 1 ELSE 0 END) as late_days,
            SUM(CASE WHEN status = "half_day" THEN 1 ELSE 0 END) as half_days
        ');
        $this->db->from('student_attendance');
        $this->db->where('student_id', $student_id);
        
        if ($start_date) {
            $this->db->where('attendance_date >=', $start_date);
        }
        if ($end_date) {
            $this->db->where('attendance_date <=', $end_date);
        }
        
        $result = $this->db->get()->row_array();
        
        // Calculate attendance percentage
        if ($result['total_days'] > 0) {
            $result['attendance_percentage'] = round(($result['present_days'] + ($result['half_days'] * 0.5)) / $result['total_days'] * 100, 2);
        } else {
            $result['attendance_percentage'] = 0;
        }
        
        return $result;
    }

    /**
     * Get attendance statistics for a class
     */
    public function get_class_attendance_stats($grade_id, $division_id, $start_date = null, $end_date = null) {
        $this->db->select('
            COUNT(DISTINCT sa.attendance_date) as total_days,
            COUNT(DISTINCT s.id) as total_students,
            SUM(CASE WHEN sa.status = "present" THEN 1 ELSE 0 END) as total_present,
            SUM(CASE WHEN sa.status = "absent" THEN 1 ELSE 0 END) as total_absent,
            SUM(CASE WHEN sa.status = "late" THEN 1 ELSE 0 END) as total_late,
            SUM(CASE WHEN sa.status = "half_day" THEN 1 ELSE 0 END) as total_half_day
        ');
        $this->db->from('students s');
        $this->db->join('student_attendance sa', 's.id = sa.student_id', 'left');
        $this->db->where('s.grade_id', $grade_id);
        $this->db->where('s.division_id', $division_id);
        $this->db->where('s.is_active', 1);
        
        if ($start_date) {
            $this->db->where('sa.attendance_date >=', $start_date);
        }
        if ($end_date) {
            $this->db->where('sa.attendance_date <=', $end_date);
        }
        
        $result = $this->db->get()->row_array();
        
        // Calculate overall attendance percentage
        $total_entries = $result['total_present'] + $result['total_absent'] + $result['total_late'] + $result['total_half_day'];
        if ($total_entries > 0) {
            $result['attendance_percentage'] = round(($result['total_present'] + ($result['total_half_day'] * 0.5)) / $total_entries * 100, 2);
        } else {
            $result['attendance_percentage'] = 0;
        }
        
        return $result;
    }

    /**
     * Get attendance report by date range
     */
    public function get_attendance_report($filters = []) {
        $this->db->select('
            sa.*,
            s.student_name,
            s.roll_number,
            g.name as grade_name,
            d.name as division_name,
            st.name as marked_by_name
        ');
        $this->db->from('student_attendance sa');
        $this->db->join('students s', 's.id = sa.student_id');
        $this->db->join('grades g', 'g.id = s.grade_id');
        $this->db->join('divisions d', 'd.id = s.division_id');
        $this->db->join('staff st', 'st.id = sa.marked_by_staff_id');
        
        if (isset($filters['student_id'])) {
            $this->db->where('sa.student_id', $filters['student_id']);
        }
        if (isset($filters['grade_id'])) {
            $this->db->where('s.grade_id', $filters['grade_id']);
        }
        if (isset($filters['division_id'])) {
            $this->db->where('s.division_id', $filters['division_id']);
        }
        if (isset($filters['start_date'])) {
            $this->db->where('sa.attendance_date >=', $filters['start_date']);
        }
        if (isset($filters['end_date'])) {
            $this->db->where('sa.attendance_date <=', $filters['end_date']);
        }
        if (isset($filters['status'])) {
            $this->db->where('sa.status', $filters['status']);
        }
        
        $this->db->order_by('sa.attendance_date', 'DESC');
        $this->db->order_by('s.roll_number', 'ASC');
        
        if (isset($filters['limit'])) {
            $this->db->limit($filters['limit'], $filters['offset'] ?? 0);
        }
        
        return $this->db->get()->result_array();
    }

    /**
     * Get attendance count for report filters
     */
    public function count_attendance_report($filters = []) {
        $this->db->select('COUNT(*) as total');
        $this->db->from('student_attendance sa');
        $this->db->join('students s', 's.id = sa.student_id');
        
        if (isset($filters['student_id'])) {
            $this->db->where('sa.student_id', $filters['student_id']);
        }
        if (isset($filters['grade_id'])) {
            $this->db->where('s.grade_id', $filters['grade_id']);
        }
        if (isset($filters['division_id'])) {
            $this->db->where('s.division_id', $filters['division_id']);
        }
        if (isset($filters['start_date'])) {
            $this->db->where('sa.attendance_date >=', $filters['start_date']);
        }
        if (isset($filters['end_date'])) {
            $this->db->where('sa.attendance_date <=', $filters['end_date']);
        }
        if (isset($filters['status'])) {
            $this->db->where('sa.status', $filters['status']);
        }
        
        $result = $this->db->get()->row_array();
        return $result['total'];
    }

    /**
     * Delete attendance record
     */
    public function delete_attendance($id) {
        return $this->db->delete('student_attendance', ['id' => $id]);
    }

    /**
     * Get students with low attendance
     */
    public function get_low_attendance_students($threshold = 75, $start_date = null, $end_date = null) {
        // Get all active students
        $this->db->select('s.id, s.student_name, s.roll_number, g.name as grade_name, d.name as division_name');
        $this->db->from('students s');
        $this->db->join('grades g', 'g.id = s.grade_id');
        $this->db->join('divisions d', 'd.id = s.division_id');
        $this->db->where('s.is_active', 1);
        $students = $this->db->get()->result_array();
        
        $low_attendance_students = [];
        
        foreach ($students as $student) {
            $stats = $this->get_student_attendance_stats($student['id'], $start_date, $end_date);
            if ($stats['attendance_percentage'] < $threshold && $stats['total_days'] > 0) {
                $student['attendance_stats'] = $stats;
                $low_attendance_students[] = $student;
            }
        }
        
        return $low_attendance_students;
    }
}


