import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import { useAuth } from '../../contexts/AuthContext';

const VisionStatementsManagement = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // State management
  const [showModal, setShowModal] = useState(false);
  const [editingVision, setEditingVision] = useState(null);
  const [formData, setFormData] = useState({
    staff_id: '',
    grade_id: 0,
    vision: ''
  });
  const [errors, setErrors] = useState({});
  
  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStaff, setFilterStaff] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterGrade, filterStaff, itemsPerPage]);

  // Fetch vision statements
  const { data: visionsResponse, isLoading } = useQuery({
    queryKey: ['vision_statements', currentPage, itemsPerPage, debouncedSearchTerm, filterGrade, filterStaff],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString()
      });
      
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (filterGrade) params.append('grade_id', filterGrade);
      if (filterStaff) params.append('staff_id', filterStaff);
      
      const response = await apiService.get(`/api/admin/vision_statements?${params}`);
      return response.data;
    }
  });

  const visions = visionsResponse?.data || [];
  const totalItems = visionsResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Fetch grades for dropdown
  const { data: grades = [] } = useQuery({
    queryKey: ['grades_dropdown'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/grades_dropdown');
      // Response structure: { status: 'success', data: [...] }
      return Array.isArray(response.data) ? response.data : 
             Array.isArray(response) ? response : [];
    }
  });

  // Fetch staff for dropdown
  const { data: staffList = [] } = useQuery({
    queryKey: ['staff_dropdown'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/staff_dropdown');
      // Response structure: { status: 'success', data: [...] }
      return Array.isArray(response.data) ? response.data : 
             Array.isArray(response) ? response : [];
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await apiService.post('/api/admin/vision_statements', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vision_statements']);
      toast.success('Vision statement created successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create vision statement');
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await apiService.put(`/api/admin/vision_statements/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vision_statements']);
      toast.success('Vision statement updated successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update vision statement');
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await apiService.delete(`/api/admin/vision_statements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vision_statements']);
      toast.success('Vision statement deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete vision statement');
    }
  });

  // Handlers
  const handleShowModal = (vision = null) => {
    if (vision) {
      setEditingVision(vision);
      setFormData({
        staff_id: vision.staff_id || '',
        grade_id: vision.grade_id || 0,
        vision: vision.vision || ''
      });
    } else {
      setEditingVision(null);
      setFormData({
        staff_id: user?.id || '',
        grade_id: 0,
        vision: ''
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVision(null);
    setFormData({ staff_id: '', grade_id: 0, vision: '' });
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.staff_id) {
      newErrors.staff_id = 'Staff is required';
    }
    
    if (!formData.vision || formData.vision.trim() === '') {
      newErrors.vision = 'Vision is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const submitData = {
      staff_id: parseInt(formData.staff_id),
      grade_id: parseInt(formData.grade_id),
      vision: formData.vision.trim()
    };

    if (editingVision) {
      updateMutation.mutate({ id: editingVision.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (vision) => {
    if (window.confirm(`Are you sure you want to delete this vision statement by ${vision.staff_name}?`)) {
      deleteMutation.mutate(vision.id);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterGrade('');
    setFilterStaff('');
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">
            <i className="bi bi-lightbulb me-2"></i>
            Vision Statements Management
          </h4>
          <p className="text-muted mb-0">Manage vision statements for staff and grades</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => handleShowModal()}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Add Vision Statement
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search vision statements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
              >
                <option value="">All Grades</option>
                <option value="0">Common</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
              >
                <option value="">All Staff</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button 
                variant="outline-secondary" 
                className="w-100"
                onClick={handleClearFilters}
              >
                <i className="bi bi-x-circle me-2"></i>
                Clear
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Vision Statements Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : visions.length === 0 ? (
            <Alert variant="secondary" className="text-center">
              <i className="bi bi-inbox display-4 text-muted d-block mb-3"></i>
              No vision statements found. Create your first vision statement!
            </Alert>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover>
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '5%' }}>ID</th>
                      <th style={{ width: '15%' }}>Staff</th>
                      <th style={{ width: '10%' }}>Grade</th>
                      <th style={{ width: '50%' }}>Vision</th>
                      <th style={{ width: '10%' }}>Created</th>
                      <th style={{ width: '10%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visions.map((vision) => (
                      <tr key={vision.id}>
                        <td>{vision.id}</td>
                        <td>
                          <div>
                            <div className="fw-medium">{vision.staff_name}</div>
                            <small className="text-muted">{vision.staff_email}</small>
                          </div>
                        </td>
                        <td>
                          {vision.grade_id == 0 ? (
                            <Badge bg="primary">Common</Badge>
                          ) : (
                            <Badge bg="info">{vision.grade_name}</Badge>
                          )}
                        </td>
                        <td>
                          <div 
                            style={{ 
                              maxHeight: '60px', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {vision.vision}
                          </div>
                        </td>
                        <td>
                          <small>{new Date(vision.created_date).toLocaleDateString()}</small>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Button
                              variant="outline-primary"
                              onClick={() => handleShowModal(vision)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              onClick={() => handleDelete(vision)}
                              title="Delete"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {totalItems > 0 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
          <Modal.Title>
            <i className="bi bi-lightbulb me-2"></i>
            {editingVision ? 'Edit Vision Statement' : 'Add Vision Statement'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <div className="form-floating mb-3">
                  <Form.Select
                    id="staff_id"
                    value={formData.staff_id}
                    onChange={(e) => handleInputChange('staff_id', e.target.value)}
                    isInvalid={!!errors.staff_id}
                  >
                    <option value="">Select Staff</option>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Label htmlFor="staff_id">
                    <i className="bi bi-person me-1"></i>Staff *
                  </Form.Label>
                  <Form.Control.Feedback type="invalid">
                    {errors.staff_id}
                  </Form.Control.Feedback>
                </div>
              </Col>
              <Col md={6}>
                <div className="form-floating mb-3">
                  <Form.Select
                    id="grade_id"
                    value={formData.grade_id}
                    onChange={(e) => handleInputChange('grade_id', e.target.value)}
                  >
                    <option value="0">Common (All Grades)</option>
                    {grades.map((grade) => (
                      <option key={grade.id} value={grade.id}>
                        {grade.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Label htmlFor="grade_id">
                    <i className="bi bi-bookmark me-1"></i>Grade
                  </Form.Label>
                </div>
              </Col>
            </Row>

            <div className="form-floating mb-3">
              <Form.Control
                as="textarea"
                id="vision"
                placeholder="Enter vision statement"
                value={formData.vision}
                onChange={(e) => handleInputChange('vision', e.target.value)}
                isInvalid={!!errors.vision}
                style={{ height: '150px' }}
              />
              <Form.Label htmlFor="vision">
                <i className="bi bi-lightbulb me-1"></i>Vision Statement *
              </Form.Label>
              <Form.Control.Feedback type="invalid">
                {errors.vision}
              </Form.Control.Feedback>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            <i className="bi bi-x-circle me-2"></i>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={createMutation.isLoading || updateMutation.isLoading}
          >
            {(createMutation.isLoading || updateMutation.isLoading) ? (
              <>
                <Spinner size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                {editingVision ? 'Update' : 'Create'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default VisionStatementsManagement;

