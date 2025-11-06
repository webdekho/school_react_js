import React, { useState } from 'react';
import { Card, Table, Button, Modal, Form, Badge, Spinner, InputGroup, Row, Col } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';

const ParentComplaints = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form data
  const [complaintForm, setComplaintForm] = useState({
    student_id: '',
    subject: '',
    description: '',
    category: 'other',
    priority: 'medium',
    is_anonymous: false
  });
  const [commentForm, setCommentForm] = useState('');
  const [errors, setErrors] = useState({});

  // Reset form
  const resetComplaintForm = () => {
    setComplaintForm({
      student_id: '',
      subject: '',
      description: '',
      category: 'other',
      priority: 'medium',
      is_anonymous: false
    });
    setErrors({});
  };

  // Fetch parent's students
  const { data: studentsResponse } = useQuery({
    queryKey: ['parent_students'],
    queryFn: async () => {
      const response = await apiService.get('/api/parent/students');
      return response.data;
    }
  });
  const students = studentsResponse || [];

  // Fetch parent's complaints
  const { data: complaintsResponse, isLoading: complaintsLoading } = useQuery({
    queryKey: ['parent_complaints', currentPage, itemsPerPage, searchTerm],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString()
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await apiService.get(`/api/parent/complaints?${params}`);
      return response.data;
    }
  });
  const complaints = complaintsResponse?.data || [];
  const totalComplaints = complaintsResponse?.total || 0;

  // Create complaint mutation
  const createComplaintMutation = useMutation({
    mutationFn: async (data) => {
      return await apiService.post('/api/parent/complaints', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parent_complaints']);
      queryClient.invalidateQueries(['parent_complaints_stats']);
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

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ complaintId, comment }) => {
      return await apiService.post(`/api/parent/complaints/${complaintId}/comments`, { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parent_complaints']);
      toast.success('Comment added successfully!');
      setCommentForm('');
      // Refresh the details modal
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
      const response = await apiService.get(`/api/parent/complaints/${complaintId}`);
      setSelectedComplaint(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to load complaint details');
    }
  };

  // Add comment to complaint
  const handleAddComment = () => {
    if (!commentForm.trim()) return;
    
    addCommentMutation.mutate({
      complaintId: selectedComplaint.id,
      comment: commentForm
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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">My Complaints</h4>
          <p className="text-muted mb-0">{totalComplaints} total complaints</p>
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
              <h5>No Complaints Found</h5>
              <p className="text-muted mb-4">
                You haven't submitted any complaints yet.
              </p>
              <Button
                variant="primary"
                onClick={() => setShowComplaintModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Submit First Complaint
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Create Complaint Modal */}
      <Modal show={showComplaintModal} onHide={() => setShowComplaintModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="bi bi-chat-dots me-2"></i>
            Submit New Complaint
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Student (Optional)</Form.Label>
                  <Form.Select
                    name="student_id"
                    value={complaintForm.student_id}
                    onChange={handleInputChange}
                  >
                    <option value="">General Complaint</option>
                    {students.map((student) => (
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
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="is_anonymous"
                    checked={complaintForm.is_anonymous}
                    onChange={handleInputChange}
                    label="Anonymous Complaint"
                    className="mt-4"
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
              
              {selectedComplaint.student_name && (
                <Row className="mb-3">
                  <Col md={12}>
                    <strong>Student:</strong> {selectedComplaint.student_name} ({selectedComplaint.roll_number})
                  </Col>
                </Row>
              )}
              
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

              {/* Comments Section */}
              {selectedComplaint.comments && selectedComplaint.comments.length > 0 && (
                <div className="mb-4">
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Comment */}
              {selectedComplaint.status !== 'closed' && (
                <div>
                  <h6>Add Comment</h6>
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
    </div>
  );
};

export default ParentComplaints;

