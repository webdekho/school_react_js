<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Staff_wallet_model extends CI_Model {
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    /**
     * Get staff wallet by staff ID
     */
    public function get_wallet_by_staff_id($staff_id) {
        $this->db->select('sw.*, s.name as staff_name');
        $this->db->from('staff_wallets sw');
        $this->db->join('staff s', 'sw.staff_id = s.id', 'left');
        $this->db->where('sw.staff_id', $staff_id);
        
        $query = $this->db->get();
        return $query->row_array();
    }
    
    /**
     * Get all staff wallets for admin view
     */
    public function get_all_wallets($limit = null, $offset = null, $search = null) {
        $this->db->select('sw.*, s.name as staff_name, s.mobile, s.email');
        $this->db->from('staff_wallets sw');
        $this->db->join('staff s', 'sw.staff_id = s.id');
        $this->db->where('s.is_active', 1);
        
        if ($search) {
            $this->db->group_start();
            $this->db->like('s.name', $search);
            $this->db->or_like('s.mobile', $search);
            $this->db->or_like('s.email', $search);
            $this->db->group_end();
        }
        
        $this->db->order_by('sw.current_balance', 'DESC');
        
        if ($limit) {
            $this->db->limit($limit, $offset);
        }
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    /**
     * Count all wallets for pagination
     */
    public function count_wallets($search = null) {
        $this->db->from('staff_wallets sw');
        $this->db->join('staff s', 'sw.staff_id = s.id');
        $this->db->where('s.is_active', 1);
        
        if ($search) {
            $this->db->group_start();
            $this->db->like('s.name', $search);
            $this->db->or_like('s.mobile', $search);
            $this->db->or_like('s.email', $search);
            $this->db->group_end();
        }
        
        return $this->db->count_all_results();
    }
    
    /**
     * Add amount to staff wallet (when fee is collected)
     */
    public function add_collection($staff_id, $amount, $reference_id, $description = null, $receipt_number = null) {
        $this->db->trans_start();
        
        try {
            // Get current balance
            $current_wallet = $this->get_wallet_by_staff_id($staff_id);
            if (!$current_wallet) {
                // Create wallet if doesn't exist
                $this->create_wallet($staff_id);
                $current_wallet = $this->get_wallet_by_staff_id($staff_id);
            }
            
            $balance_before = $current_wallet['current_balance'];
            $balance_after = $balance_before + $amount;
            
            // Update wallet
            $update_data = [
                'current_balance' => $balance_after,
                'total_collected' => $current_wallet['total_collected'] + $amount,
                'last_transaction_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            $this->db->where('staff_id', $staff_id);
            $this->db->update('staff_wallets', $update_data);
            
            // Add ledger entry
            $ledger_data = [
                'staff_id' => $staff_id,
                'transaction_type' => 'collection',
                'amount' => $amount,
                'balance' => $balance_after,
                'reference_id' => $reference_id,
                'reference_type' => 'fee_collection',
                'description' => $description ?: "Fee collection - Receipt: $receipt_number",
                'transaction_date' => date('Y-m-d'),
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            $this->db->insert('staff_ledger', $ledger_data);
            
            $this->db->trans_complete();
            
            if ($this->db->trans_status() === FALSE) {
                return false;
            }
            
            return $this->db->insert_id();
            
        } catch (Exception $e) {
            $this->db->trans_rollback();
            log_message('error', 'Staff wallet add_collection error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Process withdrawal from staff wallet (admin action)
     */
    public function process_withdrawal($staff_id, $amount, $admin_id, $description = null, $payment_method = 'cash') {
        $this->db->trans_start();
        
        try {
            // Get current balance
            $current_wallet = $this->get_wallet_by_staff_id($staff_id);
            if (!$current_wallet || $current_wallet['current_balance'] < $amount) {
                return ['success' => false, 'message' => 'Insufficient balance'];
            }
            
            $balance_before = $current_wallet['current_balance'];
            $balance_after = $balance_before - $amount;
            
            // Update wallet
            $update_data = [
                'current_balance' => $balance_after,
                'total_withdrawn' => $current_wallet['total_withdrawn'] + $amount,
                'last_transaction_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            $this->db->where('staff_id', $staff_id);
            $this->db->update('staff_wallets', $update_data);
            
            // Add ledger entry
            $ledger_data = [
                'staff_id' => $staff_id,
                'transaction_type' => 'withdrawal',
                'amount' => -$amount, // Negative for withdrawal
                'balance' => $balance_after,
                'reference_id' => $admin_id,
                'reference_type' => 'admin_withdrawal',
                'description' => $description ?: "Withdrawal processed by admin - $payment_method",
                'transaction_date' => date('Y-m-d'),
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            $this->db->insert('staff_ledger', $ledger_data);
            
            $this->db->trans_complete();
            
            if ($this->db->trans_status() === FALSE) {
                return ['success' => false, 'message' => 'Transaction failed'];
            }
            
            return ['success' => true, 'ledger_id' => $this->db->insert_id()];
            
        } catch (Exception $e) {
            $this->db->trans_rollback();
            log_message('error', 'Staff wallet process_withdrawal error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'System error: ' . $e->getMessage()];
        }
    }
    
    /**
     * Clear staff wallet balance (admin action)
     */
    public function clear_balance($staff_id, $admin_id, $description = null) {
        $current_wallet = $this->get_wallet_by_staff_id($staff_id);
        if (!$current_wallet || $current_wallet['current_balance'] <= 0) {
            return ['success' => false, 'message' => 'No balance to clear'];
        }
        
        $amount = $current_wallet['current_balance'];
        return $this->process_withdrawal($staff_id, $amount, $admin_id, $description ?: 'Balance cleared by admin', 'admin_clear');
    }
    
    /**
     * Get staff ledger transactions
     */
    public function get_ledger($staff_id, $limit = 50, $offset = 0, $start_date = null, $end_date = null) {
        $this->db->select('sl.*, s.name as staff_name');
        $this->db->from('staff_ledger sl');
        $this->db->join('staff s', 'sl.staff_id = s.id', 'left');
        $this->db->where('sl.staff_id', $staff_id);
        
        if ($start_date) {
            $this->db->where('sl.transaction_date >=', $start_date);
        }
        if ($end_date) {
            $this->db->where('sl.transaction_date <=', $end_date);
        }
        
        $this->db->order_by('sl.created_at', 'DESC');
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get();
        return $query->result_array();
    }
    
    /**
     * Count ledger transactions for pagination
     */
    public function count_ledger($staff_id, $start_date = null, $end_date = null) {
        $this->db->from('staff_ledger');
        $this->db->where('staff_id', $staff_id);
        
        if ($start_date) {
            $this->db->where('transaction_date >=', $start_date);
        }
        if ($end_date) {
            $this->db->where('transaction_date <=', $end_date);
        }
        
        return $this->db->count_all_results();
    }
    
    /**
     * Get wallet statistics
     */
    public function get_wallet_statistics() {
        // Total balances
        $this->db->select('SUM(current_balance) as total_balance, SUM(total_collected) as total_collected, SUM(total_withdrawn) as total_withdrawn, COUNT(*) as total_wallets');
        $this->db->from('staff_wallets');
        $totals = $this->db->get()->row_array();
        
        // Top collectors this month
        $this->db->select('sw.staff_id, s.name as staff_name, SUM(sl.amount) as monthly_collection');
        $this->db->from('staff_ledger sl');
        $this->db->join('staff_wallets sw', 'sl.staff_id = sw.staff_id');
        $this->db->join('staff s', 'sw.staff_id = s.id');
        $this->db->where('sl.transaction_type', 'collection');
        $this->db->where('sl.transaction_date >=', date('Y-m-01'));
        $this->db->group_by('sl.staff_id');
        $this->db->order_by('monthly_collection', 'DESC');
        $this->db->limit(5);
        $top_collectors = $this->db->get()->result_array();
        
        return [
            'totals' => $totals,
            'top_collectors' => $top_collectors
        ];
    }
    
    /**
     * Create wallet for new staff member
     */
    public function create_wallet($staff_id) {
        $wallet_data = [
            'staff_id' => $staff_id,
            'current_balance' => 0.00,
            'total_collected' => 0.00,
            'total_withdrawn' => 0.00,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        return $this->db->insert('staff_wallets', $wallet_data);
    }
}
?>