import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Tab, Tabs, Table, Modal, Form, Badge, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';

// Utility function for formatting currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount || 0);
};

const StaffDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Students state
  const [studentsCurrentPage, setStudentsCurrentPage] = useState(1);
  const [studentsItemsPerPage, setStudentsItemsPerPage] = useState(15);
  const [studentsSearchTerm, setStudentsSearchTerm] = useState('');
  
  // Form data
  const [complaintForm, setComplaintForm] = useState({
    parent_id: '',
    student_id: '',
    subject: '',
    description: '',
    category: 'other',
    priority: 'medium',
    is_anonymous: false
  });
  const [commentForm, setCommentForm] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [statusUpdateForm, setStatusUpdateForm] = useState('');
  const [resolutionForm, setResolutionForm] = useState('');
  const [errors, setErrors] = useState({});
  const [selectedParentStudents, setSelectedParentStudents] = useState([]);
  
  // Wallet state
  const [walletCurrentPage, setWalletCurrentPage] = useState(1);
  const [walletItemsPerPage, setWalletItemsPerPage] = useState(20);

  // Reset form
  const resetComplaintForm = () => {
    setComplaintForm({
      parent_id: '',
      student_id: '',
      subject: '',
      description: '',
      category: 'other',
      priority: 'medium',
      is_anonymous: false
    });
    setErrors({});
    setSelectedParentStudents([]);
  };

  // Fetch assigned complaints
  const { data: complaintsResponse, isLoading: complaintsLoading } = useQuery({
    queryKey: ['staff_assigned_complaints', currentPage, itemsPerPage, searchTerm],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString()
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      try {
        const response = await apiService.get(`/api/staff/assigned_complaints?${params}`);
        return response.data;
      } catch (error) {
        if (error.response?.status === 403) {
          toast.error('Insufficient permissions to view complaints');
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Failed to load complaints. Please try again.');
        }
        throw error;
      }
    },
    enabled: activeTab === 'assigned'
  });
  const complaints = complaintsResponse?.data || [];
  const totalComplaints = complaintsResponse?.total || 0;

  // Fetch complaint statistics
  const { data: statsResponse } = useQuery({
    queryKey: ['staff_complaints_stats'],
    queryFn: async () => {
      const response = await apiService.get('/api/staff/complaints_stats');
      return response.data;
    }
  });
  const stats = statsResponse || {};

  // Fetch parents for complaint creation
  const { data: parentsResponse } = useQuery({
    queryKey: ['staff_parents'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/api/staff/parents');
        return response.data;
      } catch (error) {
        if (error.response?.status === 403) {
          toast.error('Insufficient permissions to view parent data');
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Failed to load parents. Please try again.');
        }
        throw error;
      }
    },
    enabled: showComplaintModal
  });
  const parents = parentsResponse || [];

  // Get staff wallet information
  const { data: walletResponse, isLoading: walletLoading } = useQuery({
    queryKey: ['staff_wallet'],
    queryFn: async () => {
      const response = await apiService.get('/api/staff/wallet');
      return response.data;
    },
    enabled: activeTab === 'wallet'
  });

  // Get staff ledger/transaction history
  const { data: ledgerResponse, isLoading: ledgerLoading } = useQuery({
    queryKey: ['staff_ledger', walletCurrentPage, walletItemsPerPage],
    queryFn: async () => {
      const offset = (walletCurrentPage - 1) * walletItemsPerPage;
      const response = await apiService.get(`/api/staff/ledger?limit=${walletItemsPerPage}&offset=${offset}`);
      return response.data;
    },
    enabled: activeTab === 'wallet'
  });

  const wallet = walletResponse?.data || {};
  const transactions = ledgerResponse?.data?.data || [];
  const transactionTotal = ledgerResponse?.data?.total || 0;

  // Fetch assigned students
  const { data: studentsResponse, isLoading: studentsLoading } = useQuery({
    queryKey: ['staff_students'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/api/staff/students');
        return response.data;
      } catch (error) {
        if (error.response?.status === 403) {
          toast.error('Insufficient permissions to view student data');
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Failed to load students. Please try again.');
        }
        throw error;
      }
    },
    enabled: activeTab === 'students'
  });

  const allStudents = studentsResponse || [];
  
  // Filter students based on search term
  const filteredStudents = allStudents.filter(student => {
    if (!studentsSearchTerm) return true;
    const searchLower = studentsSearchTerm.toLowerCase();
    return (
      student.student_name?.toLowerCase().includes(searchLower) ||
      student.roll_number?.toLowerCase().includes(searchLower) ||
      student.parent_name?.toLowerCase().includes(searchLower) ||
      student.grade_name?.toLowerCase().includes(searchLower) ||
      student.division_name?.toLowerCase().includes(searchLower)
    );
  });

  // Paginate filtered students
  const totalStudents = filteredStudents.length;
  const startIndex = (studentsCurrentPage - 1) * studentsItemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + studentsItemsPerPage);

  // Fetch students for selected parent
  const { data: parentStudentsResponse, error: studentsError } = useQuery({
    queryKey: ['staff_parent_students', complaintForm.parent_id],
    queryFn: async () => {
      if (!complaintForm.parent_id) return [];
      try {
        const response = await apiService.get(`/api/staff/parent/${complaintForm.parent_id}/students`);
        return response.data;
      } catch (error) {
        // Handle different types of errors
        if (error.response?.status === 403) {
          throw new Error('Insufficient permissions to view student data');
        } else if (error.response?.status === 404) {
          throw new Error('No students found for this parent');
        } else if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        } else {
          throw new Error('Failed to load students. Please try again.');
        }
      }
    },
    enabled: !!complaintForm.parent_id,
    onError: (error) => {
      console.error('Students loading error:', error);
      toast.error(error.message || 'Failed to load students');
    }
  });

  useEffect(() => {
    if (parentStudentsResponse) {
      setSelectedParentStudents(parentStudentsResponse);
      setComplaintForm(prev => ({ ...prev, student_id: '' }));
    }
  }, [parentStudentsResponse]);

  // Create complaint mutation
  const createComplaintMutation = useMutation({
    mutationFn: async (data) => {
      return await apiService.post('/api/staff/complaints', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff_assigned_complaints']);
      queryClient.invalidateQueries(['staff_complaints_stats']);
      toast.success('Complaint submitted successfully!');
      setShowComplaintModal(false);
      resetComplaintForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit complaint');
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  });

  // Update complaint status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ complaintId, status, resolution }) => {
      return await apiService.put(`/api/staff/complaints/${complaintId}/status`, { status, resolution });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff_assigned_complaints']);
      queryClient.invalidateQueries(['staff_complaints_stats']);
      toast.success('Complaint status updated successfully!');
      setStatusUpdateForm('');
      setResolutionForm('');
      if (selectedComplaint) {
        handleViewDetails(selectedComplaint.id);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update complaint status');
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ complaintId, comment, is_internal }) => {
      return await apiService.post(`/api/staff/complaints/${complaintId}/comments`, { comment, is_internal });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff_assigned_complaints']);
      toast.success('Comment added successfully!');
      setCommentForm('');
      setIsInternalComment(false);
      if (selectedComplaint) {
        handleViewDetails(selectedComplaint.id);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setComplaintForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    if (!complaintForm.parent_id) newErrors.parent_id = 'Parent selection is required';
    if (!complaintForm.subject.trim()) newErrors.subject = 'Subject is required';
    if (!complaintForm.description.trim()) newErrors.description = 'Description is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createComplaintMutation.mutate(complaintForm);
  };

  // View complaint details
  const handleViewDetails = async (complaintId) => {
    try {
      const response = await apiService.get(`/api/staff/assigned_complaints/${complaintId}`);
      setSelectedComplaint(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to load complaint details');
    }
  };

  // Update complaint status
  const handleUpdateStatus = (status) => {
    if (status === 'resolved' && !resolutionForm.trim()) {
      toast.error('Resolution notes are required');
      return;
    }

    updateStatusMutation.mutate({
      complaintId: selectedComplaint.id,
      status,
      resolution: status === 'resolved' ? resolutionForm : null
    });
  };

  // Add comment to complaint
  const handleAddComment = () => {
    if (!commentForm.trim()) return;
    
    addCommentMutation.mutate({
      complaintId: selectedComplaint.id,
      comment: commentForm,
      is_internal: isInternalComment
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const variants = {
      'new': 'primary',
      'in_progress': 'warning',
      'resolved': 'success',
      'closed': 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    const variants = {
      'low': 'secondary',
      'medium': 'info',
      'high': 'warning',
      'urgent': 'danger'
    };
    return <Badge bg={variants[priority] || 'secondary'}>{priority}</Badge>;
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      'academic': 'bi-book',
      'transport': 'bi-bus-front',
      'facility': 'bi-building',
      'staff': 'bi-person-badge',
      'fee': 'bi-currency-rupee',
      'other': 'bi-chat-dots'
    };
    return icons[category] || 'bi-chat-dots';
  };

  return (
    <Container fluid className="px-4 py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="bi bi-person-badge me-2"></i>
          Staff Portal
        </h2>
        <span className="text-muted">Welcome, {user?.name}</span>
      </div>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="nav-tabs-custom mb-4">
        <Tab eventKey="overview" title="Overview">
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body>
                  <div className="display-6 text-primary">{stats.total_assigned || 0}</div>
                  <small className="text-muted">Assigned Complaints</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body>
                  <div className="display-6 text-warning">{stats.by_status?.new || 0}</div>
                  <small className="text-muted">New Cases</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body>
                  <div className="display-6 text-info">{stats.by_status?.in_progress || 0}</div>
                  <small className="text-muted">In Progress</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body>
                  <div className="display-6 text-success">{stats.by_status?.resolved || 0}</div>
                  <small className="text-muted">Resolved</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center py-4">
                  <div className="display-1 text-muted mb-3">
                    <i className="bi bi-chat-dots"></i>
                  </div>
                  <h5 className="mb-3">Create Complaint on Behalf of Parent</h5>
                  <p className="text-muted mb-3">
                    Help parents submit complaints for their children.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setShowComplaintModal(true)}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    New Complaint
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h6 className="mb-3">Quick Stats</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Recent (30 days):</span>
                    <Badge bg="info">{stats.recent || 0}</Badge>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Avg Resolution:</span>
                    <Badge bg="secondary">{stats.avg_resolution_days || 0} days</Badge>
                  </div>
                  <hr />
                  <h6 className="mb-2">By Priority</h6>
                  {stats.by_priority && Object.entries(stats.by_priority).map(([priority, count]) => (
                    <div key={priority} className="d-flex justify-content-between mb-1">
                      <span className="text-capitalize">{priority}:</span>
                      <Badge bg="outline-secondary">{count}</Badge>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="assigned" title="Assigned Complaints">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="mb-0">Assigned Complaints</h5>
              <small className="text-muted">{totalComplaints} assigned to you</small>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowComplaintModal(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              New Complaint
            </Button>
          </div>

          {/* Search */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search complaints..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              {complaintsLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                </div>
              ) : complaints.length > 0 ? (
                <>
                  <Table responsive hover>
                    <thead className="table-light">
                      <tr>
                        <th>Complaint #</th>
                        <th>Subject</th>
                        <th>Parent</th>
                        <th>Student</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map((complaint) => (
                        <tr key={complaint.id}>
                          <td>
                            <div className="fw-medium">{complaint.complaint_number}</div>
                          </td>
                          <td>
                            <div>
                              <div className="fw-medium">{complaint.subject}</div>
                              <small className="text-muted">
                                {complaint.description.substring(0, 50)}...
                              </small>
                            </div>
                          </td>
                          <td>
                            <div className="fw-medium">{complaint.parent_name}</div>
                            <small className="text-muted">{complaint.parent_mobile}</small>
                          </td>
                          <td>
                            {complaint.student_name ? (
                              <div>
                                <div className="fw-medium">{complaint.student_name}</div>
                                <small className="text-muted">{complaint.roll_number}</small>
                              </div>
                            ) : (
                              <span className="text-muted">General</span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className={`${getCategoryIcon(complaint.category)} me-2`}></i>
                              {complaint.category}
                            </div>
                          </td>
                          <td>{getPriorityBadge(complaint.priority)}</td>
                          <td>{getStatusBadge(complaint.status)}</td>
                          <td>
                            <small>{new Date(complaint.created_at).toLocaleDateString()}</small>
                          </td>
                          <td>
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => handleViewDetails(complaint.id)}
                            >
                              <i className="bi bi-eye"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {totalComplaints > 0 && (
                    <div className="mt-4">
                      <Pagination
                        currentPage={currentPage}
                        totalItems={totalComplaints}
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
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-chat-dots display-1 text-muted mb-4"></i>
                  <h5>No Assigned Complaints</h5>
                  <p className="text-muted mb-4">
                    You don't have any complaints assigned to you yet.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="students" title={
          <span>
            <i className="bi bi-people me-1"></i>
            My Students
          </span>
        }>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="mb-0">Assigned Students</h5>
              <small className="text-muted">{totalStudents} students assigned to your grades/divisions</small>
            </div>
          </div>

          {/* Search */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search students by name, roll number, parent, grade, or division..."
                      value={studentsSearchTerm}
                      onChange={(e) => {
                        setStudentsSearchTerm(e.target.value);
                        setStudentsCurrentPage(1);
                      }}
                    />
                  </InputGroup>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              {studentsLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                </div>
              ) : paginatedStudents.length > 0 ? (
                <>
                  <Table responsive hover>
                    <thead className="table-light">
                      <tr>
                        <th>Student Details</th>
                        <th>Grade & Division</th>
                        <th>Parent Details</th>
                        <th>Roll Number</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStudents.map((student) => (
                        <tr key={student.id}>
                          <td>
                            <div className="fw-medium">{student.student_name}</div>
                            <small className="text-muted">ID: {student.id}</small>
                          </td>
                          <td>
                            <div>
                              <Badge bg="primary" className="me-1">{student.grade_name}</Badge>
                              <Badge bg="secondary">{student.division_name}</Badge>
                            </div>
                          </td>
                          <td>
                            <div className="fw-medium">{student.parent_name}</div>
                            <small className="text-muted">{student.parent_mobile}</small>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">{student.roll_number}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {totalStudents > studentsItemsPerPage && (
                    <div className="mt-4">
                      <Pagination
                        currentPage={studentsCurrentPage}
                        totalItems={totalStudents}
                        itemsPerPage={studentsItemsPerPage}
                        onPageChange={setStudentsCurrentPage}
                        onItemsPerPageChange={(newSize) => {
                          setStudentsItemsPerPage(newSize);
                          setStudentsCurrentPage(1);
                        }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-people display-1 text-muted mb-4"></i>
                  <h5>No Students Assigned</h5>
                  <p className="text-muted mb-4">
                    {studentsSearchTerm ? 'No students match your search criteria.' : 'You don\'t have any students assigned to your grades or divisions yet.'}
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="wallet" title={
          <span>
            <i className="bi bi-wallet2 me-1"></i>
            Wallet
          </span>
        }>
          <Row className="mb-4">
            <Col md={4}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body>
                  <i className="bi bi-wallet2 text-success display-6 mb-2"></i>
                  <div className="h4 text-success">{formatCurrency(wallet.current_balance)}</div>
                  <small className="text-muted">Current Balance</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body>
                  <i className="bi bi-arrow-down-circle text-primary display-6 mb-2"></i>
                  <div className="h4 text-primary">{formatCurrency(wallet.total_collected)}</div>
                  <small className="text-muted">Total Collected</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body>
                  <i className="bi bi-arrow-up-circle text-warning display-6 mb-2"></i>
                  <div className="h4 text-warning">{formatCurrency(wallet.total_withdrawn)}</div>
                  <small className="text-muted">Total Withdrawn</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-journal-text me-2"></i>
                Transaction History
              </h5>
              {wallet.last_transaction_at && (
                <small className="text-muted">
                  Last transaction: {new Date(wallet.last_transaction_at).toLocaleString()}
                </small>
              )}
            </Card.Header>
            <Card.Body>
              {ledgerLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox display-4 text-muted"></i>
                  <p className="text-muted mb-0 mt-3">No transactions yet</p>
                  <p className="text-muted">Transactions will appear here when you collect fees</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table striped hover>
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
                        {transactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td>
                              <div>
                                {new Date(transaction.transaction_date).toLocaleDateString()}
                              </div>
                              <small className="text-muted">
                                {new Date(transaction.created_at).toLocaleTimeString()}
                              </small>
                            </td>
                            <td>
                              <Badge 
                                bg={transaction.transaction_type === 'collection' ? 'success' : 'warning'}
                                className="text-uppercase"
                              >
                                <i className={`bi ${transaction.transaction_type === 'collection' ? 'bi-arrow-down' : 'bi-arrow-up'} me-1`}></i>
                                {transaction.transaction_type}
                              </Badge>
                            </td>
                            <td className={transaction.amount >= 0 ? 'text-success' : 'text-danger'}>
                              <strong>
                                {transaction.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                              </strong>
                            </td>
                            <td>
                              <strong>{formatCurrency(transaction.balance)}</strong>
                            </td>
                            <td>
                              <small>{transaction.description}</small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  
                  {transactionTotal > walletItemsPerPage && (
                    <div className="mt-4">
                      <Pagination
                        currentPage={walletCurrentPage}
                        totalPages={Math.ceil(transactionTotal / walletItemsPerPage)}
                        onPageChange={setWalletCurrentPage}
                      />
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Create Complaint Modal */}
      <Modal show={showComplaintModal} onHide={() => setShowComplaintModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="bi bi-chat-dots me-2"></i>
            Create Complaint on Behalf of Parent
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Parent *</Form.Label>
                  <Form.Select
                    name="parent_id"
                    value={complaintForm.parent_id}
                    onChange={handleInputChange}
                    isInvalid={!!errors.parent_id}
                    required
                  >
                    <option value="">Select Parent</option>
                    {parents.map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.name} - {parent.mobile}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.parent_id}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Student (Optional)</Form.Label>
                  <Form.Select
                    name="student_id"
                    value={complaintForm.student_id}
                    onChange={handleInputChange}
                    disabled={!complaintForm.parent_id}
                  >
                    <option value="">General Complaint</option>
                    {selectedParentStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.student_name} ({student.roll_number})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    name="category"
                    value={complaintForm.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="academic">Academic</option>
                    <option value="transport">Transport</option>
                    <option value="facility">Facility</option>
                    <option value="staff">Staff</option>
                    <option value="fee">Fee</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    name="priority"
                    value={complaintForm.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="is_anonymous"
                    checked={complaintForm.is_anonymous}
                    onChange={handleInputChange}
                    label="Anonymous Complaint"
                  />
                </Form.Group>
              </Col>
              
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject *</Form.Label>
                  <Form.Control
                    type="text"
                    name="subject"
                    value={complaintForm.subject}
                    onChange={handleInputChange}
                    isInvalid={!!errors.subject}
                    maxLength={200}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.subject}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={complaintForm.description}
                    onChange={handleInputChange}
                    isInvalid={!!errors.description}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.description}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowComplaintModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createComplaintMutation.isLoading}
            >
              {createComplaintMutation.isLoading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <i className="bi bi-send me-2"></i>
                  Submit Complaint
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Complaint Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Complaint Details - {selectedComplaint?.complaint_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedComplaint && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Status:</strong> {getStatusBadge(selectedComplaint.status)}
                  {selectedComplaint.status === 'new' && (
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="ms-2"
                      onClick={() => handleUpdateStatus('in_progress')}
                      disabled={updateStatusMutation.isLoading}
                    >
                      Mark In Progress
                    </Button>
                  )}
                </Col>
                <Col md={6}>
                  <strong>Priority:</strong> {getPriorityBadge(selectedComplaint.priority)}
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Category:</strong> 
                  <span className="ms-2">
                    <i className={`${getCategoryIcon(selectedComplaint.category)} me-1`}></i>
                    {selectedComplaint.category}
                  </span>
                </Col>
                <Col md={6}>
                  <strong>Created:</strong> {new Date(selectedComplaint.created_at).toLocaleString()}
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Parent:</strong> {selectedComplaint.parent_name}
                  <br />
                  <small className="text-muted">{selectedComplaint.parent_mobile}</small>
                </Col>
                <Col md={6}>
                  {selectedComplaint.student_name && (
                    <>
                      <strong>Student:</strong> {selectedComplaint.student_name} ({selectedComplaint.roll_number})
                    </>
                  )}
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={12}>
                  <strong>Subject:</strong>
                  <div className="mt-1">{selectedComplaint.subject}</div>
                </Col>
              </Row>
              
              <Row className="mb-4">
                <Col md={12}>
                  <strong>Description:</strong>
                  <div className="mt-2 p-3 bg-light rounded">
                    {selectedComplaint.description}
                  </div>
                </Col>
              </Row>

              {/* Status Actions */}
              {selectedComplaint.status === 'in_progress' && (
                <Row className="mb-4">
                  <Col md={12}>
                    <Card className="bg-light border-0">
                      <Card.Body>
                        <h6>Resolve Complaint</h6>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={resolutionForm}
                          onChange={(e) => setResolutionForm(e.target.value)}
                          placeholder="Describe how this complaint was resolved..."
                          className="mb-2"
                        />
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleUpdateStatus('resolved')}
                          disabled={updateStatusMutation.isLoading || !resolutionForm.trim()}
                        >
                          {updateStatusMutation.isLoading ? (
                            <Spinner size="sm" className="me-2" />
                          ) : (
                            <i className="bi bi-check-circle me-2"></i>
                          )}
                          Mark as Resolved
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Comments Section */}
              {selectedComplaint.comments && selectedComplaint.comments.length > 0 && (
                <div className="mb-4">
                  <h6>Comments & Updates</h6>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {selectedComplaint.comments.map((comment) => (
                      <div key={comment.id} className={`border-start border-3 ps-3 mb-3 ${comment.is_internal ? 'border-warning' : 'border-primary'}`}>
                        <div className="d-flex justify-content-between">
                          <div>
                            <strong>{comment.commented_by_name}</strong>
                            {comment.is_internal && (
                              <Badge bg="warning" className="ms-2">Internal</Badge>
                            )}
                          </div>
                          <small className="text-muted">
                            {new Date(comment.created_at).toLocaleString()}
                          </small>
                        </div>
                        <div className="mt-1">{comment.comment}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Comment */}
              {selectedComplaint.status !== 'closed' && (
                <div>
                  <h6>Add Comment</h6>
                  <div className="mb-2">
                    <Form.Check
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      label="Internal comment (not visible to parent)"
                    />
                  </div>
                  <div className="d-flex">
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={commentForm}
                      onChange={(e) => setCommentForm(e.target.value)}
                      placeholder="Add your comment..."
                      className="me-2"
                    />
                    <Button
                      variant="primary"
                      onClick={handleAddComment}
                      disabled={addCommentMutation.isLoading || !commentForm.trim()}
                    >
                      {addCommentMutation.isLoading ? (
                        <Spinner size="sm" />
                      ) : (
                        <i className="bi bi-send"></i>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .nav-tabs-custom {
          border-bottom: 2px solid #dee2e6;
        }
        .nav-tabs-custom .nav-link {
          border: none;
          border-bottom: 2px solid transparent;
          color: #6c757d;
          font-weight: 500;
        }
        .nav-tabs-custom .nav-link.active {
          background: none;
          border-bottom-color: #0d6efd;
          color: #0d6efd;
        }
      `}</style>
    </Container>
  );
};

export default StaffDashboard;