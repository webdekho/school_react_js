import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup, Tab, Tabs, Timeline } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import { useAuth } from '../../contexts/AuthContext';

const ComplaintsManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [highlightedComplaintId, setHighlightedComplaintId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [formData, setFormData] = useState({
    parent_id: '',
    student_id: '',
    subject: '',
    description: '',
    category: 'other',
    priority: 'medium',
    is_anonymous: false
  });
  const [assignData, setAssignData] = useState({ staff_id: '' });
  const [resolveData, setResolveData] = useState({ resolution: '' });
  const [commentData, setCommentData] = useState({ comment: '', is_internal: false });
  const [errors, setErrors] = useState({});

  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');

  const searchInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Handle navigation state from Global Search
  useEffect(() => {
    if (location.state?.searchComplaint && location.state?.complaintId) {
      const { searchComplaint, complaintId } = location.state;
      
      setSearchTerm(searchComplaint);
      setHighlightedComplaintId(complaintId);
      toast.success(`Found complaint: ${searchComplaint}`);
      navigate(location.pathname, { replace: true, state: {} });
      
      setTimeout(() => {
        setHighlightedComplaintId(null);
      }, 5000);
      
      setTimeout(() => {
        const highlightedRow = document.querySelector('.table-warning');
        if (highlightedRow) {
          highlightedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 1000);
    }
  }, [location.state, navigate, location.pathname]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, categoryFilter, priorityFilter, assignedToFilter]);

  // Fetch complaints with pagination
  const { data: complaintsResponse, isLoading, error } = useQuery({
    queryKey: ['complaints', currentPage, itemsPerPage, debouncedSearchTerm, statusFilter, categoryFilter, priorityFilter, assignedToFilter],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString()
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      if (categoryFilter) {
        params.append('category', categoryFilter);
      }
      if (priorityFilter) {
        params.append('priority', priorityFilter);
      }
      if (assignedToFilter) {
        params.append('assigned_to', assignedToFilter);
      }
      
      const response = await apiService.get(`/api/admin/complaints?${params}`);
      return response.data;
    }
  });

  const complaints = complaintsResponse?.data || [];
  const totalItems = complaintsResponse?.total || 0;

  // Fetch staff for assignment dropdown
  const { data: staffResponse } = useQuery({
    queryKey: ['staff_dropdown'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/staff?limit=100');
      return response.data;
    }
  });

  // Fetch parents for complaint creation
  const { data: parentsResponse } = useQuery({
    queryKey: ['parents_dropdown'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/parents?limit=100');
      return response.data;
    }
  });

  // Fetch complaint statistics
  const { data: statisticsResponse } = useQuery({
    queryKey: ['complaints_statistics'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/complaints_statistics');
      return response.data;
    }
  });

  // Create complaint mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiService.post('/api/admin/complaints', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['complaints']);
      queryClient.invalidateQueries(['complaints_statistics']);
      toast.success('Complaint created successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create complaint');
    }
  });

  // Assign complaint mutation
  const assignMutation = useMutation({
    mutationFn: async ({ id, staff_id }) => {
      const response = await apiService.post(`/api/admin/assign_complaint/${id}`, { staff_id });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['complaints']);
      const isReassignment = selectedComplaint?.assigned_to_staff_id;
      toast.success(isReassignment ? 'Complaint reassigned successfully!' : 'Complaint assigned successfully!');
      setShowAssignModal(false);
      setAssignData({ staff_id: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign complaint');
    }
  });

  // Resolve complaint mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ id, resolution }) => {
      const response = await apiService.post(`/api/admin/resolve_complaint/${id}`, { resolution });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['complaints']);
      queryClient.invalidateQueries(['complaints_statistics']);
      toast.success('Complaint resolved successfully!');
      setShowResolveModal(false);
      setResolveData({ resolution: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to resolve complaint');
    }
  });

  // Close complaint mutation
  const closeMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiService.post(`/api/admin/close_complaint/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['complaints']);
      queryClient.invalidateQueries(['complaints_statistics']);
      toast.success('Complaint closed successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to close complaint');
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ complaint_id, comment, is_internal }) => {
      const response = await apiService.post(`/api/admin/complaint_comments/${complaint_id}`, { 
        comment, 
        is_internal: is_internal ? 1 : 0 
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['complaints']);
      toast.success('Comment added successfully!');
      setShowCommentModal(false);
      setCommentData({ comment: '', is_internal: false });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  });

  const handleShowModal = () => {
    setFormData({
      parent_id: '',
      student_id: '',
      subject: '',
      description: '',
      category: 'other',
      priority: 'medium',
      is_anonymous: false
    });
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setErrors({});
  };

  const handleViewDetails = async (complaint) => {
    try {
      const response = await apiService.get(`/api/admin/complaints/${complaint.id}`);
      setSelectedComplaint(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to load complaint details');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.parent_id) {
      newErrors.parent_id = 'Parent is required';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    createMutation.mutate(formData);
  };

  const handleAssignComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setAssignData({ staff_id: complaint.assigned_to_staff_id || '' });
    setShowAssignModal(true);
  };

  const handleResolveComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setResolveData({ resolution: '' });
    setShowResolveModal(true);
  };

  const handleCloseComplaint = (complaint) => {
    if (window.confirm(`Are you sure you want to close complaint ${complaint.complaint_number}?`)) {
      closeMutation.mutate(complaint.id);
    }
  };

  const handleAddComment = (complaint) => {
    setSelectedComplaint(complaint);
    setCommentData({ comment: '', is_internal: false });
    setShowCommentModal(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'new': 'primary',
      'in_progress': 'warning',
      'resolved': 'success',
      'closed': 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      'low': 'secondary',
      'medium': 'info',
      'high': 'warning',
      'urgent': 'danger'
    };
    return <Badge bg={variants[priority] || 'secondary'}>{priority}</Badge>;
  };

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

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Failed to load complaints. Please try again.
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-0 fw-semibold" style={{ fontSize: '1.1rem' }}>
            <i className="bi bi-chat-dots me-2" style={{ fontSize: '1rem' }}></i>
            Complaints Management
          </h5>
          <small className="text-muted">
            Track and resolve parent complaints and concerns
          </small>
        </div>
        <Button variant="primary" onClick={handleShowModal}>
          <i className="bi bi-plus-circle me-2"></i>
          New Complaint
        </Button>
      </div>

      {/* Statistics Cards */}
      {statisticsResponse && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <div className="display-6 text-primary">{statisticsResponse.total}</div>
                <small className="text-muted">Total Complaints</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <div className="display-6 text-warning">{statisticsResponse.by_status?.new || 0}</div>
                <small className="text-muted">New Complaints</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <div className="display-6 text-info">{statisticsResponse.by_status?.in_progress || 0}</div>
                <small className="text-muted">In Progress</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <div className="display-6 text-success">{statisticsResponse.avg_resolution_days}</div>
                <small className="text-muted">Avg. Resolution (Days)</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Search and Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="academic">Academic</option>
                <option value="transport">Transport</option>
                <option value="facility">Facility</option>
                <option value="staff">Staff</option>
                <option value="fee">Fee</option>
                <option value="other">Other</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
              >
                <option value="">All Staff</option>
                {staffResponse?.data?.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={1} className="text-end">
              <small className="text-muted">
                {totalItems} total
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {complaints && complaints.length > 0 ? (
            <>
              <Table responsive hover>
                <thead className="table-light">
                  <tr>
                    <th>Complaint #</th>
                    <th>Subject</th>
                    <th>Parent/Student</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((complaint) => (
                    <tr 
                      key={complaint.id}
                      className={highlightedComplaintId === complaint.id ? 'table-warning' : ''}
                      style={highlightedComplaintId === complaint.id ? {
                        animation: 'pulse 2s ease-in-out',
                        border: '2px solid #ffc107'
                      } : {}}
                    >
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
                        <div>
                          <div className="fw-medium">{complaint.parent_name}</div>
                          {complaint.student_name && (
                            <small className="text-muted">
                              {complaint.student_name} ({complaint.roll_number})
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className={`${getCategoryIcon(complaint.category)} me-2`}></i>
                          {complaint.category}
                        </div>
                      </td>
                      <td>
                        {getPriorityBadge(complaint.priority)}
                      </td>
                      <td>
                        {getStatusBadge(complaint.status)}
                      </td>
                      <td>
                        {complaint.assigned_to_name ? (
                          <small>{complaint.assigned_to_name}</small>
                        ) : (
                          <span className="text-muted">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </small>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleViewDetails(complaint)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          
                          {complaint.status === 'new' && !complaint.assigned_to_staff_id && (
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleAssignComplaint(complaint)}
                              title="Assign to Staff"
                            >
                              <i className="bi bi-person-plus"></i>
                            </Button>
                          )}
                          
                          {complaint.assigned_to_staff_id && ['new', 'in_progress'].includes(complaint.status) && (
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => handleAssignComplaint(complaint)}
                              title="Reassign to Different Staff"
                            >
                              <i className="bi bi-arrow-repeat"></i>
                            </Button>
                          )}
                          
                          {['new', 'in_progress'].includes(complaint.status) && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleResolveComplaint(complaint)}
                              title="Resolve Complaint"
                            >
                              <i className="bi bi-check-circle"></i>
                            </Button>
                          )}
                          
                          {complaint.status === 'resolved' && (
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleCloseComplaint(complaint)}
                              title="Close Complaint"
                            >
                              <i className="bi bi-x-circle"></i>
                            </Button>
                          )}
                          
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleAddComment(complaint)}
                            title="Add Comment"
                          >
                            <i className="bi bi-chat-plus"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {totalItems > 0 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
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
              <h5>No Complaints Found</h5>
              <p className="text-muted mb-4">
                {searchTerm || statusFilter || categoryFilter || priorityFilter
                  ? 'No complaints match your search criteria.'
                  : 'No complaints have been filed yet.'
                }
              </p>
              <Button variant="primary" onClick={handleShowModal}>
                <i className="bi bi-plus-circle me-2"></i>
                Create First Complaint
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Create Complaint Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-complaint text-white border-0 py-3" closeButton>
            <Modal.Title className="d-flex align-items-center">
              <i className="bi bi-chat-dots me-2"></i>
              <span>Create New Complaint</span>
            </Modal.Title>
          </Modal.Header>

          <Form onSubmit={handleSubmit}>
            <Modal.Body className="p-4">
              <Row>
                <Col md={6} className="mb-3">
                  <div className="form-floating">
                    <Form.Select
                      name="parent_id"
                      value={formData.parent_id}
                      onChange={handleInputChange}
                      isInvalid={!!errors.parent_id}
                      className="form-control-lg"
                      id="parentId"
                    >
                      <option value="">Select Parent</option>
                      {parentsResponse?.data?.map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {parent.name} - {parent.mobile}
                        </option>
                      ))}
                    </Form.Select>
                    <label htmlFor="parentId" className="text-muted">
                      <i className="bi bi-person me-2"></i>Parent *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.parent_id}
                    </Form.Control.Feedback>
                  </div>
                </Col>

                <Col md={6} className="mb-3">
                  <div className="form-floating">
                    <Form.Select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="form-control-lg"
                      id="category"
                    >
                      <option value="academic">Academic</option>
                      <option value="transport">Transport</option>
                      <option value="facility">Facility</option>
                      <option value="staff">Staff</option>
                      <option value="fee">Fee</option>
                      <option value="other">Other</option>
                    </Form.Select>
                    <label htmlFor="category" className="text-muted">
                      <i className="bi bi-tag me-2"></i>Category *
                    </label>
                  </div>
                </Col>

                <Col md={6} className="mb-3">
                  <div className="form-floating">
                    <Form.Select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="form-control-lg"
                      id="priority"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </Form.Select>
                    <label htmlFor="priority" className="text-muted">
                      <i className="bi bi-exclamation-triangle me-2"></i>Priority *
                    </label>
                  </div>
                </Col>

                <Col md={6} className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="is_anonymous"
                    checked={formData.is_anonymous}
                    onChange={handleInputChange}
                    label="Anonymous Complaint"
                    className="mt-4"
                  />
                </Col>

                <Col md={12} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Subject"
                      isInvalid={!!errors.subject}
                      maxLength={200}
                      className="form-control-lg"
                      id="subject"
                    />
                    <label htmlFor="subject" className="text-muted">
                      <i className="bi bi-card-text me-2"></i>Subject *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.subject}
                    </Form.Control.Feedback>
                  </div>
                </Col>

                <Col md={12} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Description"
                      isInvalid={!!errors.description}
                      style={{ minHeight: '120px' }}
                      id="description"
                    />
                    <label htmlFor="description" className="text-muted">
                      <i className="bi bi-text-paragraph me-2"></i>Description *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.description}
                    </Form.Control.Feedback>
                  </div>
                </Col>
              </Row>
            </Modal.Body>

            <Modal.Footer className="bg-light border-0 p-4">
              <Button variant="outline-secondary" onClick={handleCloseModal}>
                <i className="bi bi-x-circle me-2"></i>Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={createMutation.isLoading}
              >
                {createMutation.isLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-circle me-2"></i>
                    Create Complaint
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </div>

        <style jsx>{`
          .bg-gradient-complaint {
            background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%) !important;
          }
          .modal-icon-wrapper {
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
          }
          @keyframes pulse {
            0% { background-color: #fff3cd; }
            50% { background-color: #ffeaa7; }
            100% { background-color: #fff3cd; }
          }
        `}</style>
      </Modal>

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-eye me-2"></i>
            Complaint Details - {selectedComplaint?.complaint_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedComplaint && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Parent:</strong> {selectedComplaint.parent_name}
                </Col>
                <Col md={6}>
                  <strong>Category:</strong> {selectedComplaint.category}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Priority:</strong> {getPriorityBadge(selectedComplaint.priority)}
                </Col>
                <Col md={6}>
                  <strong>Status:</strong> {getStatusBadge(selectedComplaint.status)}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <strong>Subject:</strong> {selectedComplaint.subject}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <strong>Description:</strong>
                  <div className="mt-2 p-3 bg-light rounded">
                    {selectedComplaint.description}
                  </div>
                </Col>
              </Row>

              {/* Comments/Timeline */}
              {selectedComplaint.comments && selectedComplaint.comments.length > 0 && (
                <div>
                  <h6>Comments & Updates</h6>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {selectedComplaint.comments.map((comment) => (
                      <div key={comment.id} className="border-start border-3 border-primary ps-3 mb-3">
                        <div className="d-flex justify-content-between">
                          <strong>{comment.commented_by_name}</strong>
                          <small className="text-muted">
                            {new Date(comment.created_at).toLocaleString()}
                          </small>
                        </div>
                        <div className="mt-1">{comment.comment}</div>
                        {comment.is_internal && (
                          <Badge bg="warning" text="dark" className="mt-1">Internal Note</Badge>
                        )}
                      </div>
                    ))}
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

      {/* Assign Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedComplaint?.assigned_to_staff_id ? 'Reassign Complaint' : 'Assign Complaint'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedComplaint?.assigned_to_staff_id && (
            <div className="mb-3 p-3 bg-light rounded">
              <small className="text-muted">Currently assigned to:</small>
              <div className="fw-medium">{selectedComplaint.assigned_to_name}</div>
            </div>
          )}
          <Form.Select
            value={assignData.staff_id}
            onChange={(e) => setAssignData({ staff_id: e.target.value })}
          >
            <option value="">Select Staff Member</option>
            {staffResponse?.data?.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name} - {staff.role_name}
              </option>
            ))}
          </Form.Select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={() => assignMutation.mutate({ id: selectedComplaint?.id, staff_id: assignData.staff_id })}
            disabled={!assignData.staff_id || assignMutation.isLoading}
          >
            {assignMutation.isLoading ? <Spinner size="sm" /> : (selectedComplaint?.assigned_to_staff_id ? 'Reassign' : 'Assign')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Resolve Modal */}
      <Modal show={showResolveModal} onHide={() => setShowResolveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Resolve Complaint</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            as="textarea"
            rows={4}
            placeholder="Enter resolution details..."
            value={resolveData.resolution}
            onChange={(e) => setResolveData({ resolution: e.target.value })}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResolveModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success"
            onClick={() => resolveMutation.mutate({ id: selectedComplaint?.id, resolution: resolveData.resolution })}
            disabled={!resolveData.resolution.trim() || resolveMutation.isLoading}
          >
            {resolveMutation.isLoading ? <Spinner size="sm" /> : 'Resolve'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Comment Modal */}
      <Modal show={showCommentModal} onHide={() => setShowCommentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Comment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Enter your comment..."
            value={commentData.comment}
            onChange={(e) => setCommentData(prev => ({ ...prev, comment: e.target.value }))}
            className="mb-3"
          />
          <Form.Check
            type="checkbox"
            label="Internal Note (Not visible to parent)"
            checked={commentData.is_internal}
            onChange={(e) => setCommentData(prev => ({ ...prev, is_internal: e.target.checked }))}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCommentModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={() => addCommentMutation.mutate({ 
              complaint_id: selectedComplaint?.id, 
              comment: commentData.comment,
              is_internal: commentData.is_internal
            })}
            disabled={!commentData.comment.trim() || addCommentMutation.isLoading}
          >
            {addCommentMutation.isLoading ? <Spinner size="sm" /> : 'Add Comment'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ComplaintsManagement;