import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup, Accordion } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { ENV_CONFIG } from '../../config/environment';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import SimpleRichTextEditor from '../../components/common/SimpleRichTextEditor';

const SyllabusManagement = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Helper to construct absolute URLs for uploaded documents
  const getDocumentUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    if (path.startsWith('/uploads/')) {
      return `${ENV_CONFIG.API_BASE_URL}${path.substring(1)}`;
    }
    if (path.startsWith('uploads/')) {
      return `${ENV_CONFIG.API_BASE_URL}${path}`;
    }
    return `${ENV_CONFIG.API_BASE_URL}uploads/${path.replace(/^\//, '')}`;
  };

  // Helper to strip HTML tags from rich text for preview
  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };
  
  // State management
  const [showModal, setShowModal] = useState(false);
  const [editingSyllabus, setEditingSyllabus] = useState(null);
  const [formData, setFormData] = useState({
    grade_id: '',
    subject_id: '',
    topic_title: '',
    topic_description: '',
    day_number: '',
    video_link: '',
    documents: '',
    syllabus_date: ''
  });
  const [errors, setErrors] = useState({});
  
  // File upload states
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentPreview, setDocumentPreview] = useState(null);
  const uploadedDocumentUrl = useRef('');
  
  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [dateFilter, setDateFilter] = useState({ start_date: '', end_date: '' });

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
  }, [debouncedSearchTerm, filterGrade, filterSubject, dateFilter, itemsPerPage]);

  // Fetch syllabus
  const { data: syllabusResponse, isLoading } = useQuery({
    queryKey: ['syllabus', currentPage, itemsPerPage, debouncedSearchTerm, filterGrade, filterSubject, dateFilter],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString()
      });
      
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (filterGrade) params.append('grade_id', filterGrade);
      if (filterSubject) params.append('subject_id', filterSubject);
      if (dateFilter.start_date) params.append('start_date', dateFilter.start_date);
      if (dateFilter.end_date) params.append('end_date', dateFilter.end_date);
      
      const response = await apiService.get(`/api/admin/syllabus?${params}`);
      return response.data;
    }
  });

  const syllabusList = syllabusResponse?.data || [];
  const totalItems = syllabusResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Fetch grades
  const { data: grades = [] } = useQuery({
    queryKey: ['grades_dropdown'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/grades_dropdown');
      return Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [];
    }
  });

  // Fetch subjects based on selected grade
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects_dropdown', formData.grade_id || filterGrade],
    queryFn: async () => {
      const gradeId = formData.grade_id || filterGrade;
      if (!gradeId) return [];
      const response = await apiService.get(`/api/admin/subjects_dropdown/${gradeId}`);
      return Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [];
    },
    enabled: !!(formData.grade_id || filterGrade)
  });

  // Create syllabus mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await apiService.post('/api/admin/syllabus', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['syllabus']);
      toast.success('Syllabus created successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create syllabus');
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  });

  // Update syllabus mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await apiService.put(`/api/admin/syllabus/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['syllabus']);
      toast.success('Syllabus updated successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update syllabus');
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  });

  // Delete syllabus mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await apiService.delete(`/api/admin/syllabus/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['syllabus']);
      toast.success('Syllabus deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete syllabus');
    }
  });

  // Handlers
  const handleShowModal = (syllabus = null) => {
    if (syllabus) {
      setEditingSyllabus(syllabus);
      setFormData({
        grade_id: syllabus.grade_id ? syllabus.grade_id.toString() : '',
        subject_id: syllabus.subject_id ? syllabus.subject_id.toString() : '',
        topic_title: syllabus.topic_title || '',
        topic_description: syllabus.topic_description || '',
        day_number: syllabus.day_number ? syllabus.day_number.toString() : '',
        video_link: syllabus.video_link || '',
        documents: syllabus.documents || '',
        syllabus_date: syllabus.syllabus_date || ''
      });
      uploadedDocumentUrl.current = syllabus.documents || '';
      setDocumentPreview(syllabus.documents ? getDocumentUrl(syllabus.documents) : null);
    } else {
      setEditingSyllabus(null);
      setFormData({
        grade_id: '',
        subject_id: '',
        topic_title: '',
        topic_description: '',
        day_number: '',
        video_link: '',
        documents: '',
        syllabus_date: ''
      });
      uploadedDocumentUrl.current = '';
      setDocumentPreview(null);
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSyllabus(null);
    setFormData({
      grade_id: '',
      subject_id: '',
      topic_title: '',
      topic_description: '',
      day_number: '',
      video_link: '',
      documents: '',
      syllabus_date: ''
    });
    setErrors({});
    uploadedDocumentUrl.current = '';
    setDocumentPreview(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    
    // Reset subject when grade changes
    if (field === 'grade_id') {
      setFormData(prev => ({ ...prev, subject_id: '' }));
    }
  };

  // File upload handler for documents
  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 
                          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: JPG, PNG, PDF, DOC, DOCX');
      return;
    }

    setUploadingDocument(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await apiService.uploadSyllabusDocument(uploadFormData);

      const fileUrl = response.data?.url || response.url;

      if (!fileUrl) {
        throw new Error('No file URL returned from upload');
      }

      uploadedDocumentUrl.current = fileUrl;

      setFormData(prev => ({
        ...prev,
        documents: fileUrl
      }));

      // Set preview
      setDocumentPreview(file.type.includes('pdf') || file.type.includes('doc') ? fileUrl : URL.createObjectURL(file));

      toast.success('Document uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.grade_id) {
      newErrors.grade_id = 'Grade is required';
    }
    
    if (!formData.subject_id) {
      newErrors.subject_id = 'Subject is required';
    }
    
    if (!formData.topic_title || formData.topic_title.trim() === '') {
      newErrors.topic_title = 'Topic title is required';
    }
    
    if (!formData.day_number || formData.day_number <= 0) {
      newErrors.day_number = 'Valid day number is required';
    }
    
    if (!formData.syllabus_date) {
      newErrors.syllabus_date = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const submitData = {
      grade_id: parseInt(formData.grade_id),
      subject_id: parseInt(formData.subject_id),
      topic_title: formData.topic_title.trim(),
      topic_description: formData.topic_description || '',
      day_number: parseInt(formData.day_number),
      video_link: formData.video_link.trim(),
      documents: uploadedDocumentUrl.current || formData.documents || '',
      syllabus_date: formData.syllabus_date
    };

    if (editingSyllabus) {
      updateMutation.mutate({ id: editingSyllabus.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (syllabus) => {
    if (window.confirm(`Are you sure you want to delete "${syllabus.topic_title}"?`)) {
      deleteMutation.mutate(syllabus.id);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterGrade('');
    setFilterSubject('');
    setDateFilter({ start_date: '', end_date: '' });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">
            <i className="bi bi-calendar-week me-2"></i>
            Syllabus Management
          </h4>
          <p className="text-muted mb-0">Manage day-wise syllabus and learning materials</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => handleShowModal()}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Add Syllabus
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
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
              <Form.Select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                disabled={!filterGrade}
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subject_name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                value={dateFilter.start_date}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start_date: e.target.value }))}
                placeholder="Start Date"
              />
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

      {/* Syllabus Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : syllabusList.length === 0 ? (
            <Alert variant="secondary" className="text-center">
              <i className="bi bi-inbox display-4 text-muted d-block mb-3"></i>
              No syllabus found. Create your first syllabus entry!
            </Alert>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover>
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '8%' }}>Day #</th>
                      <th style={{ width: '12%' }}>Date</th>
                      <th style={{ width: '12%' }}>Grade</th>
                      <th style={{ width: '15%' }}>Subject</th>
                      <th style={{ width: '40%' }}>Topic</th>
                      <th style={{ width: '13%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syllabusList.map((syllabus) => (
                      <tr key={syllabus.id}>
                        <td>
                          <Badge bg="secondary">Day {syllabus.day_number}</Badge>
                        </td>
                        <td>
                          <small>{new Date(syllabus.syllabus_date).toLocaleDateString()}</small>
                        </td>
                        <td>
                          <Badge bg="info">{syllabus.grade_name}</Badge>
                        </td>
                        <td className="fw-medium">{syllabus.subject_name}</td>
                        <td>
                          <div className="fw-medium">
                            {syllabus.video_link ? (
                              <a 
                                href={syllabus.video_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-decoration-none text-primary"
                                title="Click to watch video"
                              >
                                {syllabus.topic_title} <i className="bi bi-box-arrow-up-right ms-1"></i>
                              </a>
                            ) : (
                              syllabus.topic_title
                            )}
                          </div>
                          {syllabus.topic_description && (
                            <small className="text-muted d-block">
                              {stripHtml(syllabus.topic_description).substring(0, 50)}
                              {stripHtml(syllabus.topic_description).length > 50 ? '...' : ''}
                            </small>
                          )}
                          <div className="mt-1">
                            {syllabus.video_link && (
                              <a 
                                href={syllabus.video_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-decoration-none"
                                title="Watch video"
                              >
                                <Badge bg="danger" className="me-1" style={{ cursor: 'pointer' }}>
                                  <i className="bi bi-play-circle me-1"></i>Video
                                </Badge>
                              </a>
                            )}
                            {syllabus.documents && (
                              <a 
                                href={getDocumentUrl(syllabus.documents)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-decoration-none"
                                title="View document"
                              >
                                <Badge bg="warning" text="dark" style={{ cursor: 'pointer' }}>
                                  <i className="bi bi-file-earmark me-1"></i>Doc
                                </Badge>
                              </a>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Button
                              variant="outline-primary"
                              onClick={() => handleShowModal(syllabus)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              onClick={() => handleDelete(syllabus)}
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

      {/* Add/Edit Syllabus Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton className="bg-primary text-white" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
          <Modal.Title>
            <i className="bi bi-calendar-week me-2"></i>
            {editingSyllabus ? 'Edit Syllabus' : 'Add Syllabus'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
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
              </Col>

              <Col md={6}>
                <div className="form-floating mb-3">
                  <Form.Select
                    id="subject_id"
                    value={formData.subject_id}
                    onChange={(e) => handleInputChange('subject_id', e.target.value)}
                    isInvalid={!!errors.subject_id}
                    disabled={!formData.grade_id}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.subject_name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Label htmlFor="subject_id">
                    <i className="bi bi-book me-1"></i>Subject *
                  </Form.Label>
                  <Form.Control.Feedback type="invalid">
                    {errors.subject_id}
                  </Form.Control.Feedback>
                </div>
              </Col>
            </Row>

            <Row>
              <Col md={8}>
                <div className="form-floating mb-3">
                  <Form.Control
                    type="text"
                    id="topic_title"
                    placeholder="Topic Title"
                    value={formData.topic_title}
                    onChange={(e) => handleInputChange('topic_title', e.target.value)}
                    isInvalid={!!errors.topic_title}
                  />
                  <Form.Label htmlFor="topic_title">
                    <i className="bi bi-card-text me-1"></i>Topic Title *
                  </Form.Label>
                  <Form.Control.Feedback type="invalid">
                    {errors.topic_title}
                  </Form.Control.Feedback>
                </div>
              </Col>

              <Col md={4}>
                <div className="form-floating mb-3">
                  <Form.Control
                    type="number"
                    id="day_number"
                    placeholder="Day Number"
                    value={formData.day_number}
                    onChange={(e) => handleInputChange('day_number', e.target.value)}
                    isInvalid={!!errors.day_number}
                    min="1"
                  />
                  <Form.Label htmlFor="day_number">
                    <i className="bi bi-hash me-1"></i>Day # *
                  </Form.Label>
                  <Form.Control.Feedback type="invalid">
                    {errors.day_number}
                  </Form.Control.Feedback>
                </div>
              </Col>
            </Row>

            <div className="form-floating mb-3">
              <Form.Control
                type="date"
                id="syllabus_date"
                value={formData.syllabus_date}
                onChange={(e) => handleInputChange('syllabus_date', e.target.value)}
                isInvalid={!!errors.syllabus_date}
              />
              <Form.Label htmlFor="syllabus_date">
                <i className="bi bi-calendar me-1"></i>Syllabus Date *
              </Form.Label>
              <Form.Control.Feedback type="invalid">
                {errors.syllabus_date}
              </Form.Control.Feedback>
            </div>

            <div className="mb-3">
              <Form.Label className="text-dark fw-medium">
                <i className="bi bi-file-text me-1"></i>Topic Description
              </Form.Label>
              <SimpleRichTextEditor
                value={formData.topic_description}
                onChange={(value) => handleInputChange('topic_description', value)}
                placeholder="Enter detailed topic description with formatting..."
              />
            </div>

            {/* Video Link */}
            <div className="form-floating mb-3">
              <Form.Control
                type="text"
                id="video_link"
                placeholder="Video Link"
                value={formData.video_link}
                onChange={(e) => handleInputChange('video_link', e.target.value)}
              />
              <Form.Label htmlFor="video_link">
                <i className="bi bi-play-circle me-1"></i>Video Link (YouTube, etc.)
              </Form.Label>
              <small className="text-muted">Optional: Add YouTube or other video URL</small>
            </div>

            {/* Documents Upload */}
            <div className="mb-3">
              <label className="form-label text-muted">
                <i className="bi bi-file-earmark-arrow-up me-2"></i>Upload Document
              </label>
              <Form.Control
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                onChange={handleDocumentUpload}
                disabled={uploadingDocument}
              />
              <small className="text-muted d-block">Max 10MB, JPG/PNG/PDF/DOC/DOCX</small>
              
              {(documentPreview || formData.documents) && (
                <div className="mt-2">
                  {(documentPreview || formData.documents)?.endsWith('.pdf') || 
                   (documentPreview || formData.documents)?.includes('.doc') ? (
                    <div>
                      <Badge bg="success" className="mb-2">
                        <i className="bi bi-file-pdf me-1"></i>
                        {(documentPreview || formData.documents)?.endsWith('.pdf') ? 'PDF Document' : 'Word Document'}
                      </Badge>
                      <br />
                      <a
                        href={documentPreview || getDocumentUrl(formData.documents)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        <i className="bi bi-eye me-1"></i>View Document
                      </a>
                    </div>
                  ) : (
                    <img
                      src={documentPreview || getDocumentUrl(formData.documents)}
                      alt="Document"
                      className="img-thumbnail"
                      style={{ maxHeight: '120px', width: 'auto' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="mt-2 w-100"
                    onClick={() => {
                      uploadedDocumentUrl.current = '';
                      setFormData(prev => ({ ...prev, documents: '' }));
                      setDocumentPreview(null);
                    }}
                  >
                    <i className="bi bi-trash me-1"></i>Remove
                  </Button>
                </div>
              )}
              
              {uploadingDocument && (
                <div className="mt-2">
                  <Spinner size="sm" className="me-2" />
                  <small>Uploading...</small>
                </div>
              )}
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
                {editingSyllabus ? 'Update' : 'Create'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SyllabusManagement;

