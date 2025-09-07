import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import { useAcademicYear } from '../../contexts/AcademicYearContext';

const GradeManagement = () => {
  const { getAcademicYearId, getFormattedAcademicYear } = useAcademicYear();
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  
  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const searchInputRef = useRef(null);
  const queryClient = useQueryClient();

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

  // Fetch grades with pagination
  const { data: gradesResponse, isLoading, error } = useQuery({
    queryKey: ['grades', currentPage, itemsPerPage, debouncedSearchTerm, getAcademicYearId()],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
        academic_year_id: getAcademicYearId().toString(),
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      
      const response = await apiService.get(`/api/admin/grades?${params}`);
      return response.data; // Extract the data from the response
    }
  });

  const grades = gradesResponse?.data || [];
  const totalItems = gradesResponse?.total || 0;

  // Create grade mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiService.post('/api/admin/grades', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['grades']);
      toast.success('Grade created successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create grade');
    }
  });

  // Update grade mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiService.put(`/api/admin/grades/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['grades']);
      toast.success('Grade updated successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update grade');
    }
  });

  // Delete grade mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiService.delete(`/api/admin/grades/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['grades']);
      toast.success('Grade deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete grade');
    }
  });

  const handleShowModal = (grade = null) => {
    if (grade) {
      setEditingGrade(grade);
      setFormData({
        name: grade.name,
        description: grade.description || ''
      });
    } else {
      setEditingGrade(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGrade(null);
    setFormData({
      name: '',
      description: ''
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Grade name is required';
    }
    if (formData.name.length > 50) {
      newErrors.name = 'Grade name must be less than 50 characters';
    }
    if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      academic_year_id: getAcademicYearId()
    };

    if (editingGrade) {
      updateMutation.mutate({ id: editingGrade.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (grade) => {
    if (window.confirm(`Are you sure you want to delete "${grade.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(grade.id);
    }
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
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
        Failed to load grades. Please try again.
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-0 fw-semibold" style={{ fontSize: '1.1rem' }}>
            <i className="bi bi-bookmark me-2" style={{ fontSize: '1rem' }}></i>
            Grade Management
          </h5>
          <small className="text-muted" style={{ fontSize: '0.8rem' }}>
            <i className="bi bi-calendar-range me-1"></i>
            {getFormattedAcademicYear()}
          </small>
        </div>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <i className="bi bi-plus-circle me-2"></i>
          Add New Grade
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
                  placeholder="Search grades by name or description..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="text-end">
              <small className="text-muted">
                {totalItems} total grades
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {grades && grades.length > 0 ? (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Grade Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade) => (
                  <tr key={grade.id}>
                    <td>
                      <div className="fw-medium">{grade.name}</div>
                    </td>
                    <td>
                      <div className="text-muted">
                        {grade.description || 'No description'}
                      </div>
                    </td>
                    <td>
                      <Badge bg={grade.is_active ? 'success' : 'secondary'}>
                        {grade.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(grade.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td className="text-center">
                      <div className="btn-group btn-group-sm">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleShowModal(grade)}
                          title="Edit Grade"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(grade)}
                          title="Delete Grade"
                          disabled={deleteMutation.isLoading}
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
              <i className="bi bi-bookmark display-1 text-muted mb-4"></i>
              <h5>No Grades Found</h5>
              <p className="text-muted mb-4">Start by creating your first grade level.</p>
              <Button variant="primary" onClick={() => handleShowModal()}>
                <i className="bi bi-plus-circle me-2"></i>
                Add First Grade
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

      {/* Add/Edit Grade Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-primary text-white border-0" closeButton>
            <Modal.Title className="d-flex align-items-center fs-4">
              <div className="modal-icon-wrapper me-3">
                <i className="bi bi-bookmark fs-3"></i>
              </div>
              <div>
                <h5 className="mb-0">{editingGrade ? 'Edit Grade' : 'Add New Grade'}</h5>
                <small className="opacity-75">
                  {editingGrade ? 'Update grade information' : 'Create a new grade level'}
                </small>
              </div>
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className="p-4">
              <div className="row">
                <div className="col-12 mb-4">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Grade Name"
                      isInvalid={!!errors.name}
                      maxLength={50}
                      className="form-control-lg"
                      id="gradeName"
                    />
                    <label htmlFor="gradeName" className="text-muted">
                      <i className="bi bi-tag me-2"></i>Grade Name *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                  </div>
                  <div className="form-text text-muted mt-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Examples: Class 1, Nursery, LKG, UKG, Grade 10
                  </div>
                </div>

                <div className="col-12">
                  <div className="form-floating">
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Description"
                      isInvalid={!!errors.description}
                      maxLength={500}
                      style={{ minHeight: '120px' }}
                      id="gradeDescription"
                    />
                    <label htmlFor="gradeDescription" className="text-muted">
                      <i className="bi bi-text-paragraph me-2"></i>Description (Optional)
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.description}
                    </Form.Control.Feedback>
                  </div>
                  <div className="form-text text-muted mt-2 d-flex justify-content-between">
                    <span>
                      <i className="bi bi-lightbulb me-1"></i>
                      Add details about curriculum, age group, or special features
                    </span>
                    <span className="text-primary fw-medium">
                      {formData.description.length}/500
                    </span>
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
                    <span>{editingGrade ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <i className={`bi ${editingGrade ? 'bi-arrow-repeat' : 'bi-plus-circle'} me-2`}></i>
                    <span>{editingGrade ? 'Update Grade' : 'Create Grade'}</span>
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </div>

        <style jsx>{`
          .bg-gradient-primary {
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
          
          /* Typeahead Autocomplete Styling */
          .typeahead-filter .rbt-input-main {
            border-radius: 8px;
            border: 1px solid #dee2e6;
            padding: 8px 12px;
            font-size: 14px;
          }
          .typeahead-filter .rbt-input-main:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 0.25rem rgba(102, 126, 234, 0.15);
          }
          .rbt-menu {
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border: 1px solid #e9ecef;
            max-height: 200px;
            overflow-y: auto;
          }
          .rbt-menu-item {
            padding: 10px 16px;
            border-bottom: 1px solid #f8f9fa;
          }
          .rbt-menu-item:last-child {
            border-bottom: none;
          }
          .rbt-menu-item.active, .rbt-menu-item:hover {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .rbt-close {
            color: #6c757d;
          }
          .rbt-close:hover {
            color: #667eea;
          }
        `}</style>
      </Modal>
    </div>
  );
};

export default GradeManagement;