import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';

const AcademicYearManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_default: false,
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

  // Fetch academic years with pagination
  const { data: yearsResponse, isLoading, error } = useQuery({
    queryKey: ['academic-years', currentPage, itemsPerPage, debouncedSearchTerm],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      
      const response = await apiService.get(`/api/admin/academic_years?${params}`);
      return response.data;
    }
  });

  const academicYears = yearsResponse?.data || [];
  const totalItems = yearsResponse?.total || 0;

  // Create academic year mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Sending data:', data);
      const response = await apiService.post('/api/admin/academic_years', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['academic-years']);
      toast.success('Academic year created successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create academic year');
    }
  });

  // Update academic year mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      console.log('Updating data:', data);
      const response = await apiService.put(`/api/admin/academic_years/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['academic-years']);
      toast.success('Academic year updated successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update academic year');
    }
  });

  // Delete academic year mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiService.delete(`/api/admin/academic_years/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['academic-years']);
      toast.success('Academic year deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete academic year');
    }
  });

  // Set as default mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiService.put(`/api/admin/academic_years_set_default/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['academic-years']);
      toast.success('Academic year set as default successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to set as default');
    }
  });

  const handleShowModal = (year = null) => {
    if (year) {
      setEditingYear(year);
      setFormData({
        name: year.name,
        start_date: year.start_date,
        end_date: year.end_date,
        is_default: year.is_default == 1,
        description: year.description || ''
      });
    } else {
      setEditingYear(null);
      setFormData({
        name: '',
        start_date: '',
        end_date: '',
        is_default: false,
        description: ''
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingYear(null);
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      is_default: false,
      description: ''
    });
    setErrors({});
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
    if (!formData.name.trim()) {
      newErrors.name = 'Academic year name is required';
    }
    if (formData.name.length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }
    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) <= new Date(formData.start_date)) {
        newErrors.end_date = 'End date must be after start date';
      }
    }
    if (formData.description && formData.description.length > 500) {
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
      is_default: formData.is_default ? 1 : 0
    };
    
    // Ensure is_default is always an integer
    submitData.is_default = parseInt(submitData.is_default, 10);

    if (editingYear) {
      updateMutation.mutate({ id: editingYear.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (year) => {
    if (year.is_default == 1) {
      toast.error('Cannot delete the default academic year');
      return;
    }
    if (window.confirm(`Are you sure you want to delete academic year "${year.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(year.id);
    }
  };

  const handleSetDefault = (year) => {
    if (year.is_default == 1) {
      toast.info('This academic year is already set as default');
      return;
    }
    if (window.confirm(`Set "${year.name}" as the default academic year?`)) {
      setDefaultMutation.mutate(year.id);
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
        <i className="bi bi-exclamation-triangle me-2" style={{ fontSize: "1rem" }}></i>
        Failed to load academic years. Please try again.
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0 fw-semibold" style={{ fontSize: "1.1rem" }}>
          <i className="bi bi-calendar-range me-2" style={{ fontSize: "1rem" }}></i>
          Academic Year Management
        </h5>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <i className="bi bi-plus-circle me-2" style={{ fontSize: "1rem" }}></i>
          Add New Academic Year
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
                  placeholder="Search academic years by name..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="text-end">
              <small className="text-muted">
                {totalItems} total academic years
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {academicYears && academicYears.length > 0 ? (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Academic Year</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Statistics</th>
                  <th>Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {academicYears.map((year) => (
                  <tr key={year.id}>
                    <td>
                      <div className="fw-medium d-flex align-items-center">
                        {year.name}
                        {year.is_default == 1 && (
                          <Badge bg="warning" className="ms-2">
                            <i className="bi bi-star-fill me-1"></i>Default
                          </Badge>
                        )}
                      </div>
                      {year.description && (
                        <small className="text-muted">{year.description}</small>
                      )}
                    </td>
                    <td>
                      <div>
                        <small className="text-muted">
                          {new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="text-primary small">
                        {Math.ceil((new Date(year.end_date) - new Date(year.start_date)) / (1000 * 60 * 60 * 24 * 365.25))} year(s)
                      </div>
                    </td>
                    <td>
                      <Badge bg={year.is_active ? 'success' : 'secondary'}>
                        {year.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="small">
                        <div><i className="bi bi-people me-1"></i>{year.stats?.students_count || 0} Students</div>
                        <div><i className="bi bi-bookmark me-1"></i>{year.stats?.grades_count || 0} Grades</div>
                        <div><i className="bi bi-grid me-1"></i>{year.stats?.divisions_count || 0} Divisions</div>
                        {year.stats?.total_fees_collected > 0 && (
                          <div><i className="bi bi-currency-rupee me-1"></i>₹{year.stats.total_fees_collected}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(year.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td className="text-center">
                      <div className="btn-group btn-group-sm">
                        {year.is_default != 1 && (
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleSetDefault(year)}
                            title="Set as Default"
                          >
                            <i className="bi bi-star"></i>
                          </Button>
                        )}
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleShowModal(year)}
                          title="Edit Academic Year"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(year)}
                          title="Delete Academic Year"
                          disabled={deleteMutation.isLoading || year.is_default == 1}
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
              <i className="bi bi-calendar-range display-1 text-muted mb-4"></i>
              <h5>No Academic Years Found</h5>
              <p className="text-muted mb-4">
                Start by creating your first academic year.
              </p>
              <Button variant="primary" onClick={() => handleShowModal()}>
                <i className="bi bi-plus-circle me-2" style={{ fontSize: "1rem" }}></i>
                Add First Academic Year
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

      {/* Add/Edit Academic Year Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-academic text-white border-0 py-3" closeButton>
            <Modal.Title className="d-flex align-items-center">
              <i className="bi bi-calendar-range me-2"></i>
              <span>{editingYear ? 'Edit Academic Year' : 'Add New Academic Year'}</span>
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className="p-4">
              <div className="row">
                <div className="col-md-6 mb-4">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Academic Year Name"
                      isInvalid={!!errors.name}
                      maxLength={50}
                      className="form-control-lg"
                      id="yearName"
                    />
                    <label htmlFor="yearName" className="text-muted">
                      <i className="bi bi-calendar me-2" style={{ fontSize: "1rem" }}></i>Academic Year Name *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                  </div>
                  <div className="form-text text-muted mt-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Examples: 2025-2026, Academic Year 2025
                  </div>
                </div>

                <div className="col-md-6 mb-4">
                  <Form.Check
                    type="checkbox"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleInputChange}
                    label="Set as Default Academic Year"
                    className="form-check-lg"
                    id="isDefault"
                  />
                  <div className="form-text text-muted mt-2">
                    <i className="bi bi-star me-1"></i>
                    Default academic year is used when no specific year is selected
                  </div>
                </div>

                <div className="col-md-6 mb-4">
                  <div className="form-floating">
                    <Form.Control
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      isInvalid={!!errors.start_date}
                      className="form-control-lg"
                      id="startDate"
                    />
                    <label htmlFor="startDate" className="text-muted">
                      <i className="bi bi-calendar-event me-2" style={{ fontSize: "1rem" }}></i>Start Date *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.start_date}
                    </Form.Control.Feedback>
                  </div>
                </div>

                <div className="col-md-6 mb-4">
                  <div className="form-floating">
                    <Form.Control
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      isInvalid={!!errors.end_date}
                      className="form-control-lg"
                      id="endDate"
                    />
                    <label htmlFor="endDate" className="text-muted">
                      <i className="bi bi-calendar-x me-2" style={{ fontSize: "1rem" }}></i>End Date *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.end_date}
                    </Form.Control.Feedback>
                  </div>
                </div>

                <div className="col-12">
                  <div className="form-floating">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Description"
                      isInvalid={!!errors.description}
                      maxLength={500}
                      style={{ minHeight: '100px' }}
                      id="yearDescription"
                    />
                    <label htmlFor="yearDescription" className="text-muted">
                      <i className="bi bi-text-paragraph me-2" style={{ fontSize: "1rem" }}></i>Description (Optional)
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.description}
                    </Form.Control.Feedback>
                  </div>
                  <div className="form-text text-muted mt-2 d-flex justify-content-between">
                    <span>
                      <i className="bi bi-lightbulb me-1"></i>
                      Add notes about special features or changes for this academic year
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
                <i className="bi bi-x-circle me-2" style={{ fontSize: "1rem" }}></i>Cancel
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
                    <span>{editingYear ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <i className={`bi ${editingYear ? 'bi-arrow-repeat' : 'bi-plus-circle'} me-2`}></i>
                    <span>{editingYear ? 'Update Academic Year' : 'Create Academic Year'}</span>
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </div>

        <style jsx>{`
          .bg-gradient-academic {
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
          .form-control:focus, .form-select:focus {
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
          .form-check-lg .form-check-input {
            width: 1.5em;
            height: 1.5em;
          }
          .form-check-lg .form-check-label {
            font-size: 1.1em;
            margin-left: 0.5em;
          }
        `}</style>
      </Modal>
    </div>
  );
};

export default AcademicYearManagement;