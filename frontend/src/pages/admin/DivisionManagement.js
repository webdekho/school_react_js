import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Typeahead } from 'react-bootstrap-typeahead';
import { apiService } from '../../services/api';
import { useAcademicYear } from '../../contexts/AcademicYearContext';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import AcademicYearSelector from '../../components/common/AcademicYearSelector';
import 'react-bootstrap-typeahead/css/Typeahead.css';

const DivisionManagement = () => {
  const { selectedAcademicYear, getAcademicYearId } = useAcademicYear();
  const [showModal, setShowModal] = useState(false);
  const [editingDivision, setEditingDivision] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [formData, setFormData] = useState({
    grade_id: '',
    name: '',
    capacity: ''
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

  // Fetch grades for dropdown
  const { data: gradesResponse } = useQuery({
    queryKey: ['grades-dropdown'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/grades_dropdown');
      return response.data || [];
    }
  });

  const grades = Array.isArray(gradesResponse) ? gradesResponse : [];

  // Fetch divisions with pagination
  const { data: divisionsResponse, isLoading, error } = useQuery({
    queryKey: ['divisions', currentPage, itemsPerPage, debouncedSearchTerm, selectedGrade, getAcademicYearId()],
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
      
      if (selectedGrade) {
        params.append('grade_id', selectedGrade);
      }
      
      const response = await apiService.get(`/api/admin/divisions?${params}`);
      return response.data; // Extract the data from the response
    }
  });

  const divisions = divisionsResponse?.data || [];
  const totalItems = divisionsResponse?.total || 0;

  // Create division mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiService.post('/api/admin/divisions', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['divisions']);
      toast.success('Division created successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create division');
    }
  });

  // Update division mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiService.put(`/api/admin/divisions/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['divisions']);
      toast.success('Division updated successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update division');
    }
  });

  // Delete division mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiService.delete(`/api/admin/divisions/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['divisions']);
      toast.success('Division deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete division');
    }
  });

  const handleShowModal = (division = null) => {
    if (division) {
      setEditingDivision(division);
      setFormData({
        grade_id: division.grade_id,
        name: division.name,
        capacity: division.capacity || ''
      });
    } else {
      setEditingDivision(null);
      setFormData({
        grade_id: selectedGrade || '',
        name: '',
        capacity: ''
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDivision(null);
    setFormData({
      grade_id: '',
      name: '',
      capacity: ''
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
    if (!formData.grade_id) {
      newErrors.grade_id = 'Grade is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Division name is required';
    }
    if (formData.name.length > 10) {
      newErrors.name = 'Division name must be less than 10 characters';
    }
    if (formData.capacity && (isNaN(formData.capacity) || formData.capacity < 1)) {
      newErrors.capacity = 'Capacity must be a positive number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      capacity: formData.capacity ? parseInt(formData.capacity) : null
    };

    if (editingDivision) {
      updateMutation.mutate({ id: editingDivision.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (division) => {
    if (window.confirm(`Are you sure you want to delete division "${division.name}" from ${division.grade_name}? This action cannot be undone.`)) {
      deleteMutation.mutate(division.id);
    }
  };

  const getGradeName = (gradeId) => {
    const grade = grades?.find(g => g.id === gradeId);
    return grade ? grade.name : 'Unknown Grade';
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

  const handleGradeFilter = (gradeId) => {
    setSelectedGrade(gradeId);
    setCurrentPage(1);
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
        <i className="bi bi-exclamation-triangle me-2" style={{ fontSize: "1rem" }}></i>
        Failed to load divisions. Please try again.
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0 fw-semibold" style={{ fontSize: "1.1rem" }}>
          <i className="bi bi-grid me-2" style={{ fontSize: "1rem" }}></i>
          Division Management
        </h5>
        <div className="d-flex gap-3 align-items-center">
          <AcademicYearSelector />
          <Button variant="primary" onClick={() => handleShowModal()}>
            <i className="bi bi-plus-circle me-2" style={{ fontSize: "1rem" }}></i>
            Add New Division
          </Button>
        </div>
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
                  placeholder="Search divisions by name or grade..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Typeahead
                id="grade-filter"
                options={grades}
                labelKey="name"
                placeholder="All Grades"
                clearButton={true}
                onChange={(selected) => {
                  const gradeId = selected.length > 0 ? selected[0].id : '';
                  handleGradeFilter(gradeId);
                }}
                selected={grades.filter(grade => grade.id === selectedGrade)}
                className="typeahead-filter"
                renderToken={() => null}
              />
            </Col>
            <Col md={3} className="text-end">
              <small className="text-muted">
                {totalItems} total divisions
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {divisions && divisions.length > 0 ? (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Division Name</th>
                  <th>Grade</th>
                  <th>Capacity</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {divisions.map((division) => (
                  <tr key={division.id}>
                    <td>
                      <div className="fw-medium">{division.name}</div>
                    </td>
                    <td>
                      <Badge bg="info">{division.grade_name || getGradeName(division.grade_id)}</Badge>
                    </td>
                    <td>
                      {division.capacity ? `${division.capacity} students` : 'No limit'}
                    </td>
                    <td>
                      <span className="text-muted">{division.student_count || 0} enrolled</span>
                    </td>
                    <td>
                      <Badge bg={division.is_active ? 'success' : 'secondary'}>
                        {division.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(division.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td className="text-center">
                      <div className="btn-group btn-group-sm">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleShowModal(division)}
                          title="Edit Division"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(division)}
                          title="Delete Division"
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
              <i className="bi bi-grid display-1 text-muted mb-4"></i>
              <h5>No Divisions Found</h5>
              <p className="text-muted mb-4">
                {selectedGrade ? 'No divisions found for the selected grade.' : 'Start by creating your first division.'}
              </p>
              <Button variant="primary" onClick={() => handleShowModal()}>
                <i className="bi bi-plus-circle me-2" style={{ fontSize: "1rem" }}></i>
                Add First Division
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

      {/* Add/Edit Division Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-secondary text-white border-0 py-3" closeButton>
            <Modal.Title className="d-flex align-items-center">
              <i className="bi bi-grid me-2"></i>
              <span>{editingDivision ? 'Edit Division' : 'Add New Division'}</span>
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className="p-4">
              <div className="row">
                <div className="col-md-6 mb-4">
                  <div className="form-group">
                    <label className="form-label text-muted mb-2">
                      <i className="bi bi-bookmark me-2" style={{ fontSize: "1rem" }}></i>Grade *
                    </label>
                    <Typeahead
                      id="division-grade"
                      options={grades}
                      labelKey="name"
                      placeholder="Search and select a grade..."
                      clearButton={true}
                      size="lg"
                      onChange={(selected) => {
                        const gradeId = selected.length > 0 ? selected[0].id : '';
                        setFormData(prev => ({ ...prev, grade_id: gradeId }));
                        if (errors.grade_id) {
                          setErrors(prev => ({ ...prev, grade_id: '' }));
                        }
                      }}
                      selected={grades.filter(grade => grade.id === formData.grade_id)}
                      isInvalid={!!errors.grade_id}
                      className={`typeahead-modal ${!!errors.grade_id ? 'is-invalid' : ''}`}
                      renderToken={() => null}
                    />
                    {!!errors.grade_id && (
                      <div className="invalid-feedback d-block">
                        {errors.grade_id}
                      </div>
                    )}
                    <div className="form-text text-muted mt-2">
                      <i className="bi bi-info-circle me-1"></i>
                      Search by typing grade name or select from dropdown
                    </div>
                  </div>
                </div>

                <div className="col-md-6 mb-4">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Division Name"
                      isInvalid={!!errors.name}
                      maxLength={10}
                      className="form-control-lg"
                      id="divisionName"
                    />
                    <label htmlFor="divisionName" className="text-muted">
                      <i className="bi bi-grid-3x3 me-2" style={{ fontSize: "1rem" }}></i>Division Name *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                  </div>
                  <div className="form-text text-muted mt-2">
                    <i className="bi bi-lightbulb me-1"></i>
                    Usually A, B, C or Alpha, Beta, Gamma
                  </div>
                </div>

                <div className="col-12">
                  <div className="form-floating">
                    <Form.Control
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      placeholder="Capacity"
                      isInvalid={!!errors.capacity}
                      min={1}
                      className="form-control-lg"
                      id="divisionCapacity"
                    />
                    <label htmlFor="divisionCapacity" className="text-muted">
                      <i className="bi bi-people me-2" style={{ fontSize: "1rem" }}></i>Student Capacity (Optional)
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.capacity}
                    </Form.Control.Feedback>
                  </div>
                  <div className="form-text text-muted mt-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Maximum number of students allowed in this division. Leave empty for unlimited capacity.
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
                    <span>{editingDivision ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <i className={`bi ${editingDivision ? 'bi-arrow-repeat' : 'bi-plus-circle'} me-2`}></i>
                    <span>{editingDivision ? 'Update Division' : 'Create Division'}</span>
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </div>

        <style jsx>{`
          .bg-gradient-secondary {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
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
            color: #f5576c !important;
          }
          .form-control:focus, .form-select:focus {
            border-color: #f5576c;
            box-shadow: 0 0 0 0.25rem rgba(245, 87, 108, 0.15);
          }
          .btn-primary {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            border: none;
            transition: all 0.3s ease;
          }
          .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(245, 87, 108, 0.3);
          }
          .modal-content {
            border-radius: 16px;
            overflow: hidden;
          }
          .form-select option {
            padding: 8px 12px;
          }
          
          /* Typeahead Autocomplete Styling */
          .typeahead-filter .rbt-input-main {
            border-radius: 8px;
            border: 1px solid #dee2e6;
            padding: 8px 12px;
            font-size: 14px;
          }
          .typeahead-filter .rbt-input-main:focus {
            border-color: #f5576c;
            box-shadow: 0 0 0 0.25rem rgba(245, 87, 108, 0.15);
          }
          .typeahead-modal .rbt-input-main {
            border-radius: 12px;
            border: 1px solid #dee2e6;
            padding: 12px 16px;
            font-size: 16px;
            min-height: 50px;
          }
          .typeahead-modal .rbt-input-main:focus {
            border-color: #f5576c;
            box-shadow: 0 0 0 0.25rem rgba(245, 87, 108, 0.15);
          }
          .typeahead-modal.is-invalid .rbt-input-main {
            border-color: #dc3545;
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
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
          }
          .rbt-close {
            color: #6c757d;
          }
          .rbt-close:hover {
            color: #f5576c;
          }
          
          /* Hide duplicate clear buttons */
          .rbt-token-removeable {
            display: none !important;
          }
          .rbt-close-lg {
            width: 20px;
            height: 20px;
            opacity: 0.7;
          }
          .rbt-close-lg:hover {
            opacity: 1;
          }
        `}</style>
      </Modal>
    </div>
  );
};

export default DivisionManagement;