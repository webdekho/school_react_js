import React, { useState, useCallback } from 'react';
import { Card, Row, Col, Table, Button, Modal, Form, Badge, Alert, Spinner } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';

// Utility function for formatting currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount || 0);
};

const StaffWalletManagement = () => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    description: '',
    payment_method: 'cash'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch wallet data
  const { 
    data: walletsData, 
    isLoading: walletsLoading, 
    error: walletsError 
  } = useQuery({
    queryKey: ['staff_wallets', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      const response = await apiService.get(`/api/admin/staff-wallets?${params.toString()}`);
      return response.data;
    }
  });

  // Fetch wallet statistics
  const { 
    data: statsData, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ['wallet_statistics'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/wallet-statistics');
      return response.data;
    }
  });

  // Fetch ledger for selected staff
  const { 
    data: ledgerData, 
    isLoading: ledgerLoading 
  } = useQuery({
    queryKey: ['staff_ledger', selectedStaff?.staff_id],
    queryFn: async () => {
      if (!selectedStaff) return null;
      const response = await apiService.get(`/api/admin/staff-wallet-ledger/${selectedStaff.staff_id}`);
      return response.data;
    },
    enabled: !!selectedStaff
  });

  // Process withdrawal mutation
  const withdrawMutation = useMutation({
    mutationFn: async (data) => {
      return await apiService.post(`/api/admin/process-withdrawal/${selectedStaff.staff_id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff_wallets']);
      queryClient.invalidateQueries(['wallet_statistics']);
      toast.success('Withdrawal processed successfully!');
      setShowWithdrawModal(false);
      setWithdrawData({ amount: '', description: '', payment_method: 'cash' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to process withdrawal');
    }
  });

  // Clear balance mutation
  const clearBalanceMutation = useMutation({
    mutationFn: async (staffId) => {
      return await apiService.post(`/api/admin/clear-wallet-balance/${staffId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff_wallets']);
      queryClient.invalidateQueries(['wallet_statistics']);
      toast.success('Balance cleared successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to clear balance');
    }
  });

  const handleWithdraw = useCallback((staff) => {
    setSelectedStaff(staff);
    setShowWithdrawModal(true);
  }, []);

  const handleViewLedger = useCallback((staff) => {
    setSelectedStaff(staff);
    setShowLedgerModal(true);
  }, []);

  const handleClearBalance = useCallback((staff) => {
    if (window.confirm(`Are you sure you want to clear the entire balance of ₹${staff.current_balance} for ${staff.staff_name}?`)) {
      clearBalanceMutation.mutate(staff.staff_id);
    }
  }, [clearBalanceMutation]);

  const handleSubmitWithdrawal = (e) => {
    e.preventDefault();
    withdrawMutation.mutate(withdrawData);
  };

  if (walletsError) {
    return (
      <Alert variant="danger">
        Error loading wallet data: {walletsError.message}
      </Alert>
    );
  }

  const wallets = walletsData?.data || [];
  const statistics = statsData?.data || {};

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Staff Wallet Management</h2>
      </div>

      {/* Statistics Cards */}
      {!statsLoading && statistics.totals && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <i className="bi bi-wallet2 text-primary fs-1 mb-2"></i>
                <h4>{formatCurrency(statistics.totals.total_balance || 0)}</h4>
                <p className="text-muted mb-0">Total Balance</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <i className="bi bi-arrow-down-circle text-success fs-1 mb-2"></i>
                <h4>{formatCurrency(statistics.totals.total_collected || 0)}</h4>
                <p className="text-muted mb-0">Total Collected</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <i className="bi bi-arrow-up-circle text-warning fs-1 mb-2"></i>
                <h4>{formatCurrency(statistics.totals.total_withdrawn || 0)}</h4>
                <p className="text-muted mb-0">Total Withdrawn</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <i className="bi bi-people text-info fs-1 mb-2"></i>
                <h4>{statistics.totals.total_wallets || 0}</h4>
                <p className="text-muted mb-0">Active Wallets</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Search and Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Search Staff</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name, mobile, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Wallets Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Staff Wallets</h5>
        </Card.Header>
        <Card.Body>
          {walletsLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Contact</th>
                    <th>Current Balance</th>
                    <th>Total Collected</th>
                    <th>Total Withdrawn</th>
                    <th>Last Transaction</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No wallet data found
                      </td>
                    </tr>
                  ) : (
                    wallets.map((wallet) => (
                      <tr key={wallet.staff_id}>
                        <td>
                          <div>
                            <strong>{wallet.staff_name}</strong>
                          </div>
                        </td>
                        <td>
                          <div>
                            <small className="text-muted">{wallet.mobile}</small>
                            <br />
                            <small className="text-muted">{wallet.email}</small>
                          </div>
                        </td>
                        <td>
                          <Badge 
                            bg={wallet.current_balance > 0 ? 'success' : 'secondary'}
                            className="fs-6"
                          >
                            {formatCurrency(wallet.current_balance)}
                          </Badge>
                        </td>
                        <td>{formatCurrency(wallet.total_collected)}</td>
                        <td>{formatCurrency(wallet.total_withdrawn)}</td>
                        <td>
                          <small className="text-muted">
                            {wallet.last_transaction_at ? 
                              new Date(wallet.last_transaction_at).toLocaleString() : 
                              'No transactions'
                            }
                          </small>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handleViewLedger(wallet)}
                            >
                              <i className="bi bi-journal-text"></i>
                            </Button>
                            {wallet.current_balance > 0 && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline-warning"
                                  onClick={() => handleWithdraw(wallet)}
                                >
                                  <i className="bi bi-cash-stack"></i>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => handleClearBalance(wallet)}
                                  disabled={clearBalanceMutation.isLoading}
                                >
                                  <i className="bi bi-x-circle"></i>
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Withdrawal Modal */}
      <Modal show={showWithdrawModal} onHide={() => setShowWithdrawModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Process Withdrawal</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitWithdrawal}>
          <Modal.Body>
            {selectedStaff && (
              <div className="mb-3">
                <strong>Staff:</strong> {selectedStaff.staff_name}<br />
                <strong>Available Balance:</strong> {formatCurrency(selectedStaff.current_balance)}
              </div>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Amount *</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                max={selectedStaff?.current_balance}
                value={withdrawData.amount}
                onChange={(e) => setWithdrawData({...withdrawData, amount: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Payment Method</Form.Label>
              <Form.Select
                value={withdrawData.payment_method}
                onChange={(e) => setWithdrawData({...withdrawData, payment_method: e.target.value})}
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={withdrawData.description}
                onChange={(e) => setWithdrawData({...withdrawData, description: e.target.value})}
                placeholder="Optional description for this withdrawal..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowWithdrawModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="warning" 
              type="submit" 
              disabled={withdrawMutation.isLoading}
            >
              {withdrawMutation.isLoading ? 'Processing...' : 'Process Withdrawal'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Ledger Modal */}
      <Modal show={showLedgerModal} onHide={() => setShowLedgerModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Staff Ledger - {selectedStaff?.staff_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {ledgerLoading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover size="sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Balance</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData?.data?.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    ledgerData?.data?.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          <small>
                            {new Date(transaction.transaction_date).toLocaleDateString()}
                          </small>
                        </td>
                        <td>
                          <Badge bg={transaction.transaction_type === 'collection' ? 'success' : 'warning'}>
                            {transaction.transaction_type}
                          </Badge>
                        </td>
                        <td className={transaction.amount >= 0 ? 'text-success' : 'text-danger'}>
                          {transaction.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                        </td>
                        <td>{formatCurrency(transaction.balance)}</td>
                        <td>
                          <small>{transaction.description}</small>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLedgerModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StaffWalletManagement;