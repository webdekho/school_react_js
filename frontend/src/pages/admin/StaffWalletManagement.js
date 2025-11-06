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
    payment_mode: 'cash'
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
      toast.success('Outstanding amount cleared successfully!');
      setShowWithdrawModal(false);
      setWithdrawData({ amount: '', description: '', payment_mode: 'cash' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to clear outstanding amount');
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

  const handleDownloadLedger = useCallback((staff) => {
    if (!ledgerData?.data || ledgerData.data.length === 0) {
      toast.error('No transaction data to download');
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = [];
      
      // Add header information
      excelData.push(['Staff Ledger Report']);
      excelData.push(['Generated on:', new Date().toLocaleString()]);
      excelData.push(['Staff Name:', staff.staff_name]);
      excelData.push(['Current Balance:', formatCurrency(staff.current_balance)]);
      excelData.push(['Total Collected:', formatCurrency(staff.total_collected)]);
      excelData.push(['Total Withdrawn:', formatCurrency(staff.total_withdrawn)]);
      excelData.push([]); // Empty row
      
      // Add table headers
      excelData.push(['Date', 'Type', 'Amount', 'Payment Mode', 'Balance', 'Description']);
      
      // Add transaction data
      ledgerData.data.forEach(transaction => {
        excelData.push([
          new Date(transaction.transaction_date).toLocaleDateString(),
          transaction.transaction_type,
          `₹${transaction.amount}`,
          transaction.payment_mode || '-',
          formatCurrency(transaction.balance),
          transaction.description || ''
        ]);
      });
      
      // Convert to CSV format
      const csvContent = excelData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Staff_Ledger_${staff.staff_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Staff ledger downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download staff ledger');
    }
  }, [ledgerData, formatCurrency]);

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
        <h5 className="mb-0 fw-semibold" style={{ fontSize: '1.1rem' }}>
          <i className="bi bi-wallet2 me-2" style={{ fontSize: '1rem' }}></i>
          Staff Wallet Management
        </h5>
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
                <Form.Label className="text-dark fw-medium">Search Staff</Form.Label>
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
      <Modal show={showWithdrawModal} onHide={() => setShowWithdrawModal(false)} size="lg" centered>
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-wallet text-white border-0" closeButton>
            <Modal.Title className="d-flex align-items-center fs-5">
              <div className="modal-icon-wrapper me-2">
                <i className="bi bi-cash-stack fs-4"></i>
              </div>
              <div>
                <h6 className="mb-0">Clear Outstanding</h6>
                <small className="opacity-75">Process staff wallet outstanding amount</small>
              </div>
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmitWithdrawal}>
            <Modal.Body className="p-4">
              {/* Staff Information Section */}
              {selectedStaff && (
                <div className="section-header mb-4">
                  <h6 className="text-primary mb-3">
                    <i className="bi bi-person-circle me-2"></i>Staff Information
                  </h6>
                  <hr className="section-divider" />
                  <div className="mb-3 p-3 bg-light rounded">
                    <div className="row">
                      <div className="col-md-6">
                        <strong>Staff Name:</strong> {selectedStaff.staff_name}
                      </div>
                      <div className="col-md-6">
                        <strong>Available Balance:</strong> 
                        <span className="text-success ms-2 fw-bold">
                          {formatCurrency(selectedStaff.current_balance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Details Section */}
              <div className="section-header mb-4">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-credit-card me-2"></i>Transaction Details
                </h6>
                <hr className="section-divider" />
              </div>

              <Row>
                <Col md={12} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="number"
                      step="0.01"
                      max={selectedStaff?.current_balance}
                      value={withdrawData.amount}
                      onChange={(e) => setWithdrawData({...withdrawData, amount: e.target.value})}
                      placeholder="Amount"
                      className="form-control-lg"
                      id="amount"
                      required
                    />
                    <label htmlFor="amount" className="text-muted">
                      <i className="bi bi-currency-rupee me-2"></i>Amount *
                    </label>
                  </div>
                </Col>
                <Col md={12} className="mb-3">
                  <div className="form-floating">
                    <Form.Select
                      value={withdrawData.payment_mode}
                      onChange={(e) => setWithdrawData({...withdrawData, payment_mode: e.target.value})}
                      className="form-control-lg"
                      id="paymentMode"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="upi">UPI</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="debit_card">Debit Card</option>
                    </Form.Select>
                    <label htmlFor="paymentMode" className="text-muted">
                      <i className="bi bi-credit-card me-2"></i>Payment Mode
                    </label>
                  </div>
                </Col>
                <Col md={12} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={withdrawData.description}
                      onChange={(e) => setWithdrawData({...withdrawData, description: e.target.value})}
                      placeholder="Optional description for clearing outstanding amount..."
                      style={{ minHeight: '120px' }}
                      id="description"
                    />
                    <label htmlFor="description" className="text-muted">
                      <i className="bi bi-text-paragraph me-2"></i>Description (Optional)
                    </label>
                  </div>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className="bg-light border-0 p-4">
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowWithdrawModal(false)}
                className="px-4 py-2"
              >
                <i className="bi bi-x-circle me-2"></i>Cancel
              </Button>
              <Button 
                type="submit" 
                variant="warning"
                disabled={withdrawMutation.isLoading}
                className="px-4 py-2"
              >
                {withdrawMutation.isLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-cash-stack me-2"></i>
                    Clear Outstanding
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </div>
      </Modal>

      {/* Ledger Modal */}
      <Modal show={showLedgerModal} onHide={() => setShowLedgerModal(false)} size="xl" centered>
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-ledger text-white border-0 py-3" closeButton>
            <Modal.Title className="d-flex align-items-center">
              <i className="bi bi-journal-text me-2"></i>
              <span>Staff Ledger{selectedStaff?.staff_name ? ` - ${selectedStaff.staff_name}` : ''}</span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {/* Staff Summary Section */}
            {selectedStaff && (
              <div className="section-header mb-4">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-person-circle me-2"></i>Staff Summary
                </h6>
                <hr className="section-divider" />
                <div className="mb-3 p-3 bg-light rounded">
                  <Row>
                    <Col md={3}>
                      <strong>Staff Name:</strong><br />
                      <span className="text-muted">{selectedStaff.staff_name}</span>
                    </Col>
                    <Col md={3}>
                      <strong>Current Balance:</strong><br />
                      <Badge bg="success" className="fs-6">
                        {formatCurrency(selectedStaff.current_balance)}
                      </Badge>
                    </Col>
                    <Col md={3}>
                      <strong>Total Collected:</strong><br />
                      <span className="text-success">{formatCurrency(selectedStaff.total_collected)}</span>
                    </Col>
                    <Col md={3}>
                      <strong>Total Withdrawn:</strong><br />
                      <span className="text-warning">{formatCurrency(selectedStaff.total_withdrawn)}</span>
                    </Col>
                  </Row>
                </div>
              </div>
            )}

            {/* Transaction History Section */}
            <div className="section-header mb-4">
              <h6 className="text-primary mb-3">
                <i className="bi bi-clock-history me-2"></i>Transaction History
              </h6>
              <hr className="section-divider" />
            </div>

            {ledgerLoading ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading transactions...</span>
                </Spinner>
                <p className="text-muted mt-3">Loading transaction history...</p>
              </div>
            ) : (
              <div className="table-responsive">
                {ledgerData?.data?.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-journal-x display-1 text-muted mb-4"></i>
                    <h5>No Transactions Found</h5>
                    <p className="text-muted">This staff member has no transaction history yet.</p>
                  </div>
                ) : (
                  <Table hover className="table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th className="text-center">Date</th>
                        <th className="text-center">Type</th>
                        <th className="text-center">Amount</th>
                        <th className="text-center">Payment Mode</th>
                        <th className="text-center">Balance</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerData?.data?.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="text-center">
                            <small className="fw-medium">
                              {new Date(transaction.transaction_date).toLocaleDateString()}
                            </small>
                          </td>
                          <td className="text-center">
                            <Badge bg={transaction.transaction_type === 'collection' ? 'success' : 'warning'}>
                              {transaction.transaction_type}
                            </Badge>
                          </td>
                          <td className={`text-center fw-bold ${transaction.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                            {transaction.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                          </td>
                          <td className="text-center">
                            {transaction.payment_mode ? (
                              <Badge bg="secondary" className="text-capitalize">
                                {transaction.payment_mode.replace('_', ' ')}
                              </Badge>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-center fw-medium">
                            {formatCurrency(transaction.balance)}
                          </td>
                          <td>
                            <small>{transaction.description}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="bg-light border-0 p-4">
            <Button 
              variant="outline-secondary" 
              onClick={() => setShowLedgerModal(false)}
              className="px-4 py-2"
            >
              <i className="bi bi-x-circle me-2"></i>Close
            </Button>
            {selectedStaff && ledgerData?.data?.length > 0 && (
              <Button 
                variant="outline-success"
                onClick={() => handleDownloadLedger(selectedStaff)}
                className="px-4 py-2"
              >
                <i className="bi bi-file-earmark-excel me-2"></i>Download Excel
              </Button>
            )}
            {selectedStaff && selectedStaff.current_balance > 0 && (
              <Button 
                variant="warning"
                onClick={() => {
                  setShowLedgerModal(false);
                  handleWithdraw(selectedStaff);
                }}
                className="px-4 py-2"
              >
                <i className="bi bi-cash-stack me-2"></i>Clear Outstanding
              </Button>
            )}
          </Modal.Footer>
        </div>
      </Modal>

      <style jsx>{`
        .bg-gradient-wallet {
          background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%) !important;
        }
        .bg-gradient-ledger {
          background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%) !important;
        }
        .modal-icon-wrapper {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }
        .section-header h6 {
          font-weight: 600;
          margin-bottom: 0;
        }
        .section-divider {
          height: 2px;
          background: linear-gradient(135deg, #007bff 0%, #6f42c1 100%);
          border: none;
          margin: 0;
          opacity: 0.3;
        }
        .table-bordered th,
        .table-bordered td {
          border-color: #dee2e6;
        }
        .table-light th {
          background-color: #f8f9fa !important;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default StaffWalletManagement;