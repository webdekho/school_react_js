<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Staff_attendance_model extends CI_Model {

    public function __construct() {
        parent::__construct();
    }

    /**
     * Create staff_attendance table if it doesn't exist
     */
    public function create_table_if_not_exists() {
        $table = 'staff_attendance';
        
        if (!$this->db->table_exists($table)) {
            $this->db->query("
                CREATE TABLE IF NOT EXISTS `staff_attendance` (
                    `id` int(11) NOT NULL AUTO_INCREMENT,
                    `staff_id` int(11) NOT NULL,
                    `attendance_date` date NOT NULL,
                    `status` enum('present','absent','late','half_day','leave') NOT NULL DEFAULT 'present',
                    `check_in_time` time DEFAULT NULL,
                    `check_out_time` time DEFAULT NULL,
                    `work_hours` decimal(5,2) DEFAULT NULL,
                    `remarks` text DEFAULT NULL,
                    `marked_by_staff_id` int(11) DEFAULT NULL,
                    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    UNIQUE KEY `unique_staff_date` (`staff_id`, `attendance_date`),
                    KEY `idx_staff_id` (`staff_id`),
                    KEY `idx_attendance_date` (`attendance_date`),
                    KEY `idx_status` (`status`),
                    CONSTRAINT `fk_staff_attendance_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE,
                    CONSTRAINT `fk_staff_attendance_marked_by` FOREIGN KEY (`marked_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
        }
    }

    /**
     * Check in - Create or update attendance record
     */
    public function check_in($staff_id, $check_in_time = null) {
        $this->create_table_if_not_exists();
        
        $date = date('Y-m-d');
        $time = $check_in_time ?: date('H:i:s');
        
        // Check if already checked in today
        $existing = $this->db->get_where('staff_attendance', [
            'staff_id' => $staff_id,
            'attendance_date' => $date
        ])->row_array();
        
        if ($existing) {
            return ['success' => false, 'message' => 'Already checked in today'];
        }
        
        // Determine status based on time (late if after 9:30 AM)
        $status = 'present';
        if (strtotime($time) > strtotime('09:30:00')) {
            $status = 'late';
        }
        
        $data = [
            'staff_id' => $staff_id,
            'attendance_date' => $date,
            'status' => $status,
            'check_in_time' => $time,
            'marked_by_staff_id' => $staff_id
        ];
        
        return $this->db->insert('staff_attendance', $data);
    }

    /**
     * Check out - Update attendance record
     */
    public function check_out($staff_id, $check_out_time = null) {
        $this->create_table_if_not_exists();
        
        $date = date('Y-m-d');
        $time = $check_out_time ?: date('H:i:s');
        
        $record = $this->db->get_where('staff_attendance', [
            'staff_id' => $staff_id,
            'attendance_date' => $date
        ])->row_array();
        
        if (!$record) {
            return ['success' => false, 'message' => 'No check-in record found for today'];
        }
        
        if ($record['check_out_time']) {
            return ['success' => false, 'message' => 'Already checked out today'];
        }
        
        // Calculate work hours
        $check_in = strtotime($record['check_in_time']);
        $check_out = strtotime($time);
        $work_hours = ($check_out - $check_in) / 3600; // Convert to hours
        
        $data = [
            'check_out_time' => $time,
            'work_hours' => round($work_hours, 2)
        ];
        
        $this->db->where('id', $record['id']);
        return $this->db->update('staff_attendance', $data);
    }

    /**
     * Get staff attendance for a specific date
     */
    public function get_attendance_by_date($staff_id, $date) {
        $this->create_table_if_not_exists();
        
        return $this->db->get_where('staff_attendance', [
            'staff_id' => $staff_id,
            'attendance_date' => $date
        ])->row_array();
    }

    /**
     * Get all staff with their attendance status for a specific date
     */
    public function get_daily_attendance($date) {
        $this->create_table_if_not_exists();
        
        $this->db->select('
            s.id as staff_id,
            s.name as staff_name,
            s.email,
            s.mobile,
            s.role_id,
            r.name as role_name,
            sa.id as attendance_id,
            sa.status,
            sa.check_in_time,
            sa.check_out_time,
            sa.work_hours,
            sa.remarks
        ');
        $this->db->from('staff s');
        $this->db->join('roles r', 'r.id = s.role_id', 'left');
        $this->db->join('staff_attendance sa', "sa.staff_id = s.id AND sa.attendance_date = '{$date}'", 'left');
        $this->db->where('s.is_active', 1);
        $this->db->order_by('s.name', 'ASC');
        
        return $this->db->get()->result_array();
    }

    /**
     * Mark bulk attendance
     */
    public function mark_bulk_attendance($attendance_records, $marked_by_staff_id = null) {
        $this->create_table_if_not_exists();
        
        $this->db->trans_start();
        
        foreach ($attendance_records as $record) {
            // Calculate work hours if check-in and check-out times are provided
            $work_hours = null;
            if (!empty($record['check_in_time']) && !empty($record['check_out_time'])) {
                $check_in = strtotime($record['check_in_time']);
                $check_out = strtotime($record['check_out_time']);
                $work_hours = round(($check_out - $check_in) / 3600, 2);
            }
            
            // Prepare sanitized data with only valid columns
            $data = [
                'staff_id' => $record['staff_id'],
                'attendance_date' => $record['attendance_date'],
                'status' => $record['status'],
                'check_in_time' => !empty($record['check_in_time']) ? $record['check_in_time'] : null,
                'check_out_time' => !empty($record['check_out_time']) ? $record['check_out_time'] : null,
                'work_hours' => $work_hours,
                'remarks' => isset($record['remarks']) ? $record['remarks'] : null,
                'marked_by_staff_id' => $marked_by_staff_id
            ];
            
            // Check if record already exists
            $existing = $this->db->get_where('staff_attendance', [
                'staff_id' => $record['staff_id'],
                'attendance_date' => $record['attendance_date']
            ])->row_array();
            
            if ($existing) {
                // Update existing record
                $this->db->where('id', $existing['id']);
                $this->db->update('staff_attendance', $data);
            } else {
                // Insert new record
                $this->db->insert('staff_attendance', $data);
            }
        }
        
        $this->db->trans_complete();
        
        return $this->db->trans_status();
    }

    /**
     * Get attendance history for a staff member
     */
    public function get_staff_history($staff_id, $month = null) {
        $this->create_table_if_not_exists();
        
        $this->db->select('*');
        $this->db->from('staff_attendance');
        $this->db->where('staff_id', $staff_id);
        
        if ($month) {
            $this->db->where("DATE_FORMAT(attendance_date, '%Y-%m') =", $month);
        }
        
        $this->db->order_by('attendance_date', 'DESC');
        
        return $this->db->get()->result_array();
    }

    /**
     * Get attendance history for all staff
     */
    public function get_all_staff_history($month = null, $staff_id = null, $status = null) {
        $this->create_table_if_not_exists();
        
        $this->db->select('
            sa.*,
            s.name as staff_name,
            s.email,
            r.name as role_name
        ');
        $this->db->from('staff_attendance sa');
        $this->db->join('staff s', 's.id = sa.staff_id');
        $this->db->join('roles r', 'r.id = s.role_id', 'left');
        
        if ($month) {
            $this->db->where("DATE_FORMAT(sa.attendance_date, '%Y-%m') =", $month);
        }
        
        if ($staff_id) {
            $this->db->where('sa.staff_id', $staff_id);
        }
        
        if ($status) {
            $this->db->where('sa.status', $status);
        }
        
        $this->db->order_by('sa.attendance_date', 'DESC');
        $this->db->order_by('s.name', 'ASC');
        
        return $this->db->get()->result_array();
    }

    /**
     * Get attendance statistics for a staff member
     */
    public function get_staff_stats($staff_id, $month = null) {
        $this->create_table_if_not_exists();
        
        $this->db->select("
            COUNT(*) as total_days,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
            SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
            SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as half_days,
            SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_days,
            AVG(work_hours) as avg_work_hours,
            ROUND((SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_rate
        ");
        $this->db->from('staff_attendance');
        $this->db->where('staff_id', $staff_id);
        
        if ($month) {
            $this->db->where("DATE_FORMAT(attendance_date, '%Y-%m') =", $month);
        }
        
        return $this->db->get()->row_array();
    }

    /**
     * Get low attendance staff
     */
    public function get_low_attendance_staff($threshold = 75, $month = null) {
        $this->create_table_if_not_exists();
        
        // Build subquery to get attendance stats
        $subquery = "(
            SELECT 
                s.id,
                s.name as staff_name,
                s.email,
                s.role_id,
                COUNT(sa.id) as total_days,
                SUM(CASE WHEN sa.status IN ('present', 'late') THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN sa.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                ROUND((SUM(CASE WHEN sa.status IN ('present', 'late') THEN 1 ELSE 0 END) / COUNT(sa.id)) * 100, 2) as attendance_rate
            FROM staff s
            INNER JOIN staff_attendance sa ON sa.staff_id = s.id
            WHERE s.is_active = 1
            " . ($month ? "AND DATE_FORMAT(sa.attendance_date, '%Y-%m') = " . $this->db->escape($month) : "") . "
            GROUP BY s.id, s.name, s.email, s.role_id
            HAVING attendance_rate < " . floatval($threshold) . "
        ) stats";
        
        $sql = "
            SELECT 
                stats.id as staff_id,
                stats.staff_name,
                stats.email,
                r.name as role_name,
                stats.total_days,
                stats.present_days,
                stats.absent_days,
                stats.attendance_rate
            FROM $subquery
            LEFT JOIN roles r ON r.id = stats.role_id
            ORDER BY stats.attendance_rate ASC
        ";
        
        $query = $this->db->query($sql);
        return $query->result_array();
    }

    /**
     * Delete attendance record
     */
    public function delete_attendance($id) {
        $this->create_table_if_not_exists();
        
        $this->db->where('id', $id);
        return $this->db->delete('staff_attendance');
    }

    /**
     * Get attendance count for staff
     */
    public function count_attendance($filters = []) {
        $this->create_table_if_not_exists();
        
        $this->db->from('staff_attendance');
        
        if (!empty($filters['staff_id'])) {
            $this->db->where('staff_id', $filters['staff_id']);
        }
        
        if (!empty($filters['start_date'])) {
            $this->db->where('attendance_date >=', $filters['start_date']);
        }
        
        if (!empty($filters['end_date'])) {
            $this->db->where('attendance_date <=', $filters['end_date']);
        }
        
        if (!empty($filters['status'])) {
            $this->db->where('status', $filters['status']);
        }
        
        return $this->db->count_all_results();
    }
}
