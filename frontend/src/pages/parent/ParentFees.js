import React, { useState } from 'react';
import { Card, Row, Col, Badge, Table, Spinner, Form, Button, Accordion } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import Pagination from '../../components/common/Pagination';

const ParentFees = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedStudent, setSelectedStudent] = useState('all');

  // Fetch students
  const { data: studentsResponse } = useQuery({
    queryKey: ['parent_students'],
    queryFn: async () => {
      const response = await apiService.get('/api/parent/students');
      return response.data;
    }
  });
  const students = studentsResponse || [];

  // Fetch fee payments
  const { data: paymentsResponse, isLoading: paymentsLoading } = useQuery({
    queryKey: ['parent_fee_payments', selectedStudent, currentPage, itemsPerPage],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const endpoint = selectedStudent === 'all' 
        ? `/api/parent/fee_payments?limit=${itemsPerPage}&offset=${offset}`
        : `/api/parent/fee_payments/${selectedStudent}?limit=${itemsPerPage}&offset=${offset}`;
      const response = await apiService.get(endpoint);
      return response.data;
    }
  });

  const payments = paymentsResponse?.data || [];
  const totalPayments = paymentsResponse?.total || 0;

  // Fetch outstanding fees
  const { data: outstandingResponse } = useQuery({
    queryKey: ['parent_outstanding_fees', selectedStudent],
    queryFn: async () => {
      const endpoint = selectedStudent === 'all'
        ? '/api/parent/outstanding_fees'
        : `/api/parent/outstanding_fees/${selectedStudent}`;
      const response = await apiService.get(endpoint);
      return response.data;
    }
  });

  const outstandingFees = outstandingResponse || [];

  // Fetch fee summary
  const { data: summaryResponse } = useQuery({
    queryKey: ['parent_fee_summary'],
    queryFn: async () => {
      const response = await apiService.get('/api/parent/fee_summary');
      return response.data;
    }
  });

  const summary = summaryResponse || { total_paid: 0, total_outstanding: 0, total_transactions: 0 };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  // Get payment method badge color
  const getPaymentMethodBadge = (method) => {
    const colors = {
      'cash': 'success',
      'online': 'primary',
      'check': 'info',
      'card': 'warning'
    };
    return colors[method?.toLowerCase()] || 'secondary';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Fee Information</h4>
          <p className="text-muted mb-0">Track fee payments and outstanding amounts</p>
        </div>
      </div>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="display-6 text-success">{formatCurrency(summary.total_paid)}</div>
              <small className="text-muted">Total Paid</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="display-6 text-warning">{formatCurrency(summary.total_outstanding)}</div>
              <small className="text-muted">Outstanding</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="display-6 text-info">{summary.total_transactions}</div>
              <small className="text-muted">Transactions</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Outstanding Fees Section */}
      {outstandingFees.length > 0 && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Header className="bg-warning bg-opacity-10 border-0">
            <h5 className="mb-0">
              <i className="bi bi-exclamation-triangle text-warning me-2"></i>
              Outstanding Fees
            </h5>
          </Card.Header>
          <Card.Body>
            <Accordion>
              {outstandingFees.map((student, index) => (
                <Accordion.Item eventKey={index.toString()} key={student.student_id}>
                  <Accordion.Header>
                    <div className="d-flex justify-content-between align-items-center w-100 me-3">
                      <div>
                        <strong>{student.student_name}</strong>
                        <span className="text-muted ms-2">({student.roll_number})</span>
                      </div>
                      <Badge bg="warning">{formatCurrency(student.total_outstanding)}</Badge>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Table responsive hover size="sm">
                      <thead className="table-light">
                        <tr>
                          <th>Fee Category</th>
                          <th>Amount</th>
                          <th>Due Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.fees?.map((fee, feeIdx) => (
                          <tr key={feeIdx}>
                            <td>{fee.fee_category_name}</td>
                            <td>{formatCurrency(fee.amount)}</td>
                            <td>
                              {fee.due_date ? new Date(fee.due_date).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </Card.Body>
        </Card>
      )}

      {/* Payment History Section */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-clock-history me-2"></i>
              Payment History
            </h5>
            <Form.Select 
              style={{ width: '200px' }}
              value={selectedStudent}
              onChange={(e) => {
                setSelectedStudent(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Students</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.student_name}
                </option>
              ))}
            </Form.Select>
          </div>
        </Card.Header>
        <Card.Body>
          {paymentsLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-receipt display-1 text-muted mb-4"></i>
              <h5>No Payment History</h5>
              <p className="text-muted">
                No fee payments have been recorded yet.
              </p>
            </div>
          ) : (
            <>
              <Table responsive hover>
                <thead className="table-light">
                  <tr>
                    <th>Receipt #</th>
                    <th>Date</th>
                    <th>Student</th>
                    <th>Fee Category</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <span className="badge bg-secondary">{payment.receipt_number}</span>
                      </td>
                      <td>
                        <small>{new Date(payment.payment_date).toLocaleDateString()}</small>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">{payment.student_name}</div>
                          <small className="text-muted">{payment.roll_number}</small>
                        </div>
                      </td>
                      <td>{payment.fee_category_name}</td>
                      <td>
                        <strong className="text-success">{formatCurrency(payment.amount)}</strong>
                      </td>
                      <td>
                        <Badge bg={getPaymentMethodBadge(payment.payment_method)}>
                          {payment.payment_method}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="success">
                          <i className="bi bi-check-circle me-1"></i>
                          Paid
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {totalPayments > 0 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalPayments}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(newSize) => {
                      setItemsPerPage(newSize);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ParentFees;

