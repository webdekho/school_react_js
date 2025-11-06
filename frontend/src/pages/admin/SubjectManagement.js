import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';

const SubjectManagement = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    subject_name: '',
    grade_id: ''
  });
  const [errors, setErrors] = useState({});
  
  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');

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
  }, [debouncedSearchTerm, filterGrade, itemsPerPage]);

  // Fetch subjects
  const { data: subjectsResponse, isLoading } = useQuery({
    queryKey: ['subjects', currentPage, itemsPerPage, debouncedSearchTerm, filterGrade],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString()
      });
      
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (filterGrade) params.append('grade_id', filterGrade);
      
      const response = await apiService.get(`/api/admin/subjects?${params}`);
      return response.data;
    }
  });

  const subjects = subjectsResponse?.data || [];
  const totalItems = subjectsResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Fetch grades for dropdown
  const { data: grades = [] } = useQuery({
    queryKey: ['grades_dropdown'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/grades_dropdown');
      return Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [];
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await apiService.post('/api/admin/subjects', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subjects']);
      toast.success('Subject created successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create subject');
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await apiService.put(`/api/admin/subjects/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subjects']);
      toast.success('Subject updated successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update subject');
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await apiService.delete(`/api/admin/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subjects']);
      toast.success('Subject deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete subject');
    }
  });

  // Handlers
  const handleShowModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        subject_name: subject.subject_name || '',
        grade_id: subject.grade_id ? subject.grade_id.toString() : ''
      });
    } else {
      setEditingSubject(null);
      setFormData({
        subject_name: '',
        grade_id: ''
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSubject(null);
    setFormData({ subject_name: '', grade_id: '' });
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.subject_name || formData.subject_name.trim() === '') {
      newErrors.subject_name = 'Subject name is required';
    }
    
    if (!formData.grade_id) {
      newErrors.grade_id = 'Grade is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const submitData = {
      subject_name: formData.subject_name.trim(),
      grade_id: parseInt(formData.grade_id)
    };

    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (subject) => {
    if (window.confirm(`Are you sure you want to delete "${subject.subject_name}"? This will also delete all related syllabus and tutorials.`)) {
      deleteMutation.mutate(subject.id);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterGrade('');
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">
            <i className="bi bi-book me-2"></i>
            Subject Management
          </h4>
          <p className="text-muted mb-0">Manage subjects for different grades</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => handleShowModal()}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Add Subject
        </Button>
      </div>

      {/* Filters */}
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
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
              >
                <option value="">All Grades</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
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

      {/* Subjects Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : subjects.length === 0 ? (
            <Alert variant="secondary" className="text-center">
              <i className="bi bi-inbox display-4 text-muted d-block mb-3"></i>
              No subjects found. Create your first subject!
            </Alert>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover>
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '10%' }}>ID</th>
                      <th style={{ width: '40%' }}>Subject Name</th>
                      <th style={{ width: '30%' }}>Grade</th>
                      <th style={{ width: '20%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject) => (
                      <tr key={subject.id}>
                        <td>{subject.id}</td>
                        <td className="fw-medium">{subject.subject_name}</td>
                        <td>
                          <Badge bg="info">{subject.grade_name}</Badge>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Button
                              variant="outline-primary"
                              onClick={() => handleShowModal(subject)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              onClick={() => handleDelete(subject)}
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
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton className="bg-primary text-white" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
          <Modal.Title>
            <i className="bi bi-book me-2"></i>
            {editingSubject ? 'Edit Subject' : 'Add Subject'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="form-floating mb-3">
              <Form.Control
                type="text"
                id="subject_name"
                placeholder="Subject Name"
                value={formData.subject_name}
                onChange={(e) => handleInputChange('subject_name', e.target.value)}
                isInvalid={!!errors.subject_name}
              />
              <Form.Label htmlFor="subject_name">
                <i className="bi bi-book me-1"></i>Subject Name *
              </Form.Label>
              <Form.Control.Feedback type="invalid">
                {errors.subject_name}
              </Form.Control.Feedback>
            </div>

            <div className="form-floating mb-3">
              <Form.Select
                id="grade_id"
                value={formData.grade_id}
                onChange={(e) => handleInputChange('grade_id', e.target.value)}
                isInvalid={!!errors.grade_id}
              >
                <option value="">Select Grade</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Label htmlFor="grade_id">
                <i className="bi bi-bookmark me-1"></i>Grade *
              </Form.Label>
              <Form.Control.Feedback type="invalid">
                {errors.grade_id}
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
                {editingSubject ? 'Update' : 'Create'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SubjectManagement;

