import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import { useAcademicYear } from '../../contexts/AcademicYearContext';

const ParentManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getFormattedAcademicYear } = useAcademicYear();
  const [showModal, setShowModal] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [highlightedParentId, setHighlightedParentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: 'password',
    address: '',
    pincode: ''
  });
  const [errors, setErrors] = useState({});

  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const searchInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Handle navigation state from Global Search
  useEffect(() => {
    if (location.state?.searchParent && location.state?.parentId) {
      const { searchParent, parentId } = location.state;
      
      setSearchTerm(searchParent);
      setHighlightedParentId(parentId);
      toast.success(`Found parent: ${searchParent}`);
      navigate(location.pathname, { replace: true, state: {} });
      
      setTimeout(() => {
        setHighlightedParentId(null);
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

  // Reset to first page when search term changes
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  // Maintain focus after re-renders
  useEffect(() => {
    if (searchInputRef.current && document.activeElement !== searchInputRef.current && searchTerm) {
      const cursorPosition = searchInputRef.current.selectionStart;
      searchInputRef.current.focus();
      searchInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  });

  // Fetch parents with pagination
  const { data: parentsResponse, isLoading, error } = useQuery({
    queryKey: ['parents', currentPage, itemsPerPage, debouncedSearchTerm],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      
      const response = await apiService.get(`/api/admin/parents?${params}`);
      return response.data;
    }
  });

  const parents = parentsResponse?.data || [];
  const totalItems = parentsResponse?.total || 0;

  // Create parent mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiService.post('/api/admin/parents', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parents']);
      toast.success('Parent created successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create parent');
    }
  });

  // Update parent mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiService.put(`/api/admin/parents/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parents']);
      toast.success('Parent updated successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update parent');
    }
  });

  // Delete parent mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiService.delete(`/api/admin/parents/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parents']);
      toast.success('Parent deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete parent');
    }
  });

  const handleShowModal = (parent = null) => {
    if (parent) {
      setEditingParent(parent);
      setFormData({
        name: parent.name,
        mobile: parent.mobile,
        email: parent.email || '',
        password: '', // Never pre-fill password when editing
        address: parent.address || '',
        pincode: parent.pincode || ''
      });
    } else {
      setEditingParent(null);
      setFormData({
        name: '',
        mobile: '',
        email: '',
        password: 'password',
        address: '',
        pincode: ''
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingParent(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      password: '',
      address: '',
      pincode: ''
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Parent name is required';
    }
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    }
    if (formData.mobile && !/^[0-9]{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Mobile number must be 10 digits';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!editingParent && !formData.password) {
      newErrors.password = 'Password is required for new parents';
    }
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = { ...formData };
    if (editingParent && !submitData.password) {
      delete submitData.password; // Don't update password if empty
    }

    if (editingParent) {
      updateMutation.mutate({ id: editingParent.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (parent) => {
    if (parent.student_count > 0) {
      toast.error('Cannot delete parent with active students');
      return;
    }
    if (window.confirm(`Are you sure you want to delete parent "${parent.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(parent.id);
    }
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleSearch = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
  }, []);

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
        Failed to load parents. Please try again.
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">
            <i className="bi bi-person-hearts me-2"></i>
            Parent Management
          </h4>
          <small className="text-muted">
            <i className="bi bi-calendar-range me-1"></i>
            {getFormattedAcademicYear()}
          </small>
        </div>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <i className="bi bi-plus-circle me-2"></i>
          Add New Parent
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by name, mobile, or email..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="text-end">
              <small className="text-muted">
                {totalItems} total parents
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {parents && parents.length > 0 ? (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Parent Details</th>
                  <th>Contact Information</th>
                  <th>Address</th>
                  <th>Students</th>
                  <th>Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parents.map((parent) => (
                  <tr 
                    key={parent.id}
                    className={highlightedParentId === parent.id ? 'table-warning' : ''}
                    style={highlightedParentId === parent.id ? {
                      animation: 'pulse 2s ease-in-out',
                      border: '2px solid #ffc107'
                    } : {}}
                  >
                    <td>
                      <div className="fw-medium">{parent.name}</div>
                    </td>
                    <td>
                      <div>{parent.mobile}</div>
                      {parent.email && (
                        <small className="text-muted">{parent.email}</small>
                      )}
                    </td>
                    <td>
                      {parent.address ? (
                        <div>
                          <div className="text-muted small">{parent.address}</div>
                          {parent.pincode && (
                            <Badge bg="light" text="dark">PIN: {parent.pincode}</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">Not provided</span>
                      )}
                    </td>
                    <td>
                      <Badge bg="info">{parent.student_count || 0} students</Badge>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(parent.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td className="text-center">
                      <div className="btn-group btn-group-sm">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleShowModal(parent)}
                          title="Edit Parent"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(parent)}
                          title="Delete Parent"
                          disabled={deleteMutation.isLoading || parent.student_count > 0}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-person-hearts display-1 text-muted mb-4"></i>
              <h5>No Parents Found</h5>
              <p className="text-muted mb-4">
                {searchTerm ? 'No parents match your search criteria.' : 'Start by adding your first parent.'}
              </p>
              <Button variant="primary" onClick={() => handleShowModal()}>
                <i className="bi bi-plus-circle me-2"></i>
                Add First Parent
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalItems > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Parent Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-parent text-white border-0" closeButton>
            <Modal.Title className="d-flex align-items-center fs-4">
              <div className="modal-icon-wrapper me-3">
                <i className="bi bi-person-hearts fs-3"></i>
              </div>
              <div>
                <h5 className="mb-0">{editingParent ? 'Edit Parent' : 'Add New Parent'}</h5>
                <small className="opacity-75">
                  {editingParent ? 'Update parent information' : 'Register a new parent to the system'}
                </small>
              </div>
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className="p-4">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Parent Name"
                      isInvalid={!!errors.name}
                      maxLength={100}
                      className="form-control-lg"
                      id="parentName"
                    />
                    <label htmlFor="parentName" className="text-muted">
                      <i className="bi bi-person me-2"></i>Parent Full Name *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="Mobile Number"
                      isInvalid={!!errors.mobile}
                      maxLength={10}
                      className="form-control-lg"
                      id="parentMobile"
                    />
                    <label htmlFor="parentMobile" className="text-muted">
                      <i className="bi bi-phone me-2"></i>Mobile Number *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.mobile}
                    </Form.Control.Feedback>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email Address"
                      isInvalid={!!errors.email}
                      className="form-control-lg"
                      id="parentEmail"
                    />
                    <label htmlFor="parentEmail" className="text-muted">
                      <i className="bi bi-envelope me-2"></i>Email Address (Optional)
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password"
                      isInvalid={!!errors.password}
                      className="form-control-lg"
                      id="parentPassword"
                    />
                    <label htmlFor="parentPassword" className="text-muted">
                      <i className="bi bi-lock me-2"></i>Password {editingParent ? '(Leave empty to keep current)' : '*'}
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </div>
                </div>
                <div className="col-md-8 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Address"
                      maxLength={500}
                      style={{ minHeight: '80px' }}
                      id="parentAddress"
                    />
                    <label htmlFor="parentAddress" className="text-muted">
                      <i className="bi bi-geo-alt me-2"></i>Residential Address
                    </label>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="Pincode"
                      maxLength={10}
                      className="form-control-lg"
                      id="parentPincode"
                    />
                    <label htmlFor="parentPincode" className="text-muted">
                      <i className="bi bi-mailbox me-2"></i>Pincode
                    </label>
                  </div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer className="bg-light border-0 p-4">
              <Button 
                variant="outline-secondary" 
                onClick={handleCloseModal}
                className="px-4 py-2"
              >
                <i className="bi bi-x-circle me-2"></i>Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="px-4 py-2 shadow-sm"
              >
                {createMutation.isLoading || updateMutation.isLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    <span>{editingParent ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <i className={`bi ${editingParent ? 'bi-arrow-repeat' : 'bi-plus-circle'} me-2`}></i>
                    <span>{editingParent ? 'Update Parent' : 'Create Parent'}</span>
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </div>

        <style jsx>{`
          .bg-gradient-parent {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
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
          .form-floating > .form-control:focus ~ label,
          .form-floating > .form-control:not(:placeholder-shown) ~ label {
            transform: scale(0.85) translateY(-0.5rem) translateX(0.15rem);
            color: #667eea !important;
          }
          .form-control:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 0.25rem rgba(102, 126, 234, 0.15);
          }
          .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            transition: all 0.3s ease;
          }
          .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }
          .modal-content {
            border-radius: 16px;
            overflow: hidden;
          }
          @keyframes pulse {
            0% { background-color: #fff3cd; }
            50% { background-color: #ffeaa7; }
            100% { background-color: #fff3cd; }
          }
        `}</style>
      </Modal>
    </div>
  );
};

export default ParentManagement;