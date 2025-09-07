import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typeahead } from 'react-bootstrap-typeahead';
import { apiService } from '../../services/api';
import { useAcademicYear } from '../../contexts/AcademicYearContext';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import AcademicYearSelector from '../../components/common/AcademicYearSelector';
import useWindowsModalFix from '../../hooks/useWindowsModalFix';
import 'react-bootstrap-typeahead/css/Typeahead.css';

const StudentManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getAcademicYearId } = useAcademicYear();
  const [showModal, setShowModal] = useState(false);
  const safeCloseModal = useWindowsModalFix(showModal);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [highlightedStudentId, setHighlightedStudentId] = useState(null);
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentFormData, setParentFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: 'password',
    address: '',
    pincode: ''
  });
  const [parentErrors, setParentErrors] = useState({});
  const [formData, setFormData] = useState({
    student_name: '',
    grade_id: '',
    division_id: '',
    roll_number: '',
    residential_address: '',
    pincode: '',
    sam_samagrah_id: '',
    aapar_id: '',
    admission_date: '',
    parent_id: ''
  });
  const [errors, setErrors] = useState({});
  const [semesterFees, setSemesterFees] = useState(null);
  const [, setShowSemesterFees] = useState(false);
  
  // Payment history modal states
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState(null);

  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const searchInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Handle navigation state from Global Search
  useEffect(() => {
    if (location.state?.searchStudent && location.state?.studentId) {
      const { searchStudent, studentId } = location.state;
      
      // Set search term to find the student
      setSearchTerm(searchStudent);
      setHighlightedStudentId(studentId);
      
      // Show toast notification
      toast.success(`Found student: ${searchStudent}`);
      
      // Clear the navigation state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
      
      // Auto-clear highlight after 5 seconds
      setTimeout(() => {
        setHighlightedStudentId(null);
      }, 5000);
      
      // Scroll to highlighted student after data loads
      setTimeout(() => {
        const highlightedRow = document.querySelector('.table-warning');
        if (highlightedRow) {
          highlightedRow.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
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
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedGrade, selectedDivision]);

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

  // Fetch divisions based on selected grade
  const { data: divisionsResponse, isLoading: divisionsLoading, error: divisionsError } = useQuery({
    queryKey: ['divisions-dropdown', formData.grade_id, getAcademicYearId()],
    queryFn: async () => {
      if (!formData.grade_id) return [];
      const academicYearId = getAcademicYearId();
      const params = new URLSearchParams({
        grade_id: formData.grade_id,
        academic_year_id: academicYearId ? academicYearId.toString() : '',
        limit: '100',
        offset: '0'
      });
      try {
        const response = await apiService.get(`/api/admin/divisions?${params}`);
        // Temporary debug
        if (!response.data?.data || response.data.data.length === 0) {
          console.log('No divisions found for grade:', formData.grade_id, 'academic year:', academicYearId);
          console.log('Full response:', response.data);
        }
        return response.data?.data || [];
      } catch (error) {
        console.error('Error fetching divisions:', error);
        return [];
      }
    },
    enabled: !!formData.grade_id,
    staleTime: 60000 // Cache for 1 minute
  });

  const divisions = Array.isArray(divisionsResponse) ? divisionsResponse : [];

  // Fetch divisions for filter based on selected grade in filter
  const { data: filterDivisionsResponse } = useQuery({
    queryKey: ['filter-divisions', selectedGrade, getAcademicYearId()],
    queryFn: async () => {
      if (!selectedGrade) return [];
      const params = new URLSearchParams({
        grade_id: selectedGrade,
        academic_year_id: getAcademicYearId().toString(),
        limit: '100',
        offset: '0'
      });
      const response = await apiService.get(`/api/admin/divisions?${params}`);
      if (response.data?.data) {
        return response.data.data;
      }
      return [];
    },
    enabled: !!selectedGrade
  });

  const filterDivisions = Array.isArray(filterDivisionsResponse) ? filterDivisionsResponse : [];

  // Fetch parents for dropdown
  const { data: parentsResponse } = useQuery({
    queryKey: ['parents-dropdown'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/parents_dropdown');
      return response.data || [];
    }
  });

  const parents = Array.isArray(parentsResponse) ? parentsResponse : [];

  // Fetch semester fees for selected grade and division
  const { data: semesterFeesData, isLoading: feesLoading } = useQuery({
    queryKey: ['semester-fees', formData.grade_id, formData.division_id, getAcademicYearId()],
    queryFn: async () => {
      if (!formData.grade_id || !formData.division_id || !getAcademicYearId()) return null;
      const params = new URLSearchParams({
        grade_id: formData.grade_id,
        division_id: formData.division_id,
        academic_year_id: getAcademicYearId()
      });
      const response = await apiService.get(`/api/admin/semester_fees?${params}`);
      return response.data;
    },
    enabled: !!(formData.grade_id && formData.division_id && getAcademicYearId())
  });

  // Update semester fees state when data changes
  useEffect(() => {
    if (semesterFeesData) {
      setSemesterFees(semesterFeesData);
      setShowSemesterFees(true);
    } else {
      setSemesterFees(null);
      setShowSemesterFees(false);
    }
  }, [semesterFeesData]);

  // Fetch students with pagination
  const { data: studentsResponse, isLoading, error } = useQuery({
    queryKey: ['students', currentPage, itemsPerPage, debouncedSearchTerm, selectedGrade, selectedDivision, getAcademicYearId()],
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
      
      if (selectedDivision) {
        params.append('division_id', selectedDivision);
      }
      
      try {
        const response = await apiService.get(`/api/admin/students?${params}`);
        return response.data;
      } catch (error) {
        // Handle different types of errors and preserve the original error for proper display
        if (error.response?.status === 403) {
          const permissionError = new Error('Insufficient permissions to view student data');
          permissionError.response = error.response;
          throw permissionError;
        } else if (error.response?.status === 404) {
          const notFoundError = new Error('No students found for the selected criteria');
          notFoundError.response = error.response;
          throw notFoundError;
        } else if (error.response?.data?.message) {
          const apiError = new Error(error.response.data.message);
          apiError.response = error.response;
          throw apiError;
        } else {
          const genericError = new Error('Failed to load students. Please try again.');
          genericError.response = error.response;
          throw genericError;
        }
      }
    }
  });

  const students = studentsResponse?.data || [];
  const totalItems = studentsResponse?.total || 0;

  // Payment history query
  const { data: paymentHistoryData, isLoading: historyLoading } = useQuery({
    queryKey: ['payment-history', selectedStudentForHistory?.id],
    queryFn: async () => {
      if (!selectedStudentForHistory?.id) return [];
      const response = await apiService.get(`/api/admin/student_payment_history/${selectedStudentForHistory.id}`);
      return response.data || [];
    },
    enabled: !!selectedStudentForHistory?.id
  });

  // Create student mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiService.post('/api/admin/students', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      toast.success('Student created successfully!');
      // Use safe close modal helper for Windows compatibility
      safeCloseModal(() => handleCloseModal());
    },
    onError: (error) => {
      if (error.response?.status === 403) {
        toast.error('Insufficient permissions to create students');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create student');
      }
    }
  });

  // Update student mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiService.put(`/api/admin/students/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      toast.success('Student updated successfully!');
      // Use safe close modal helper for Windows compatibility
      safeCloseModal(() => handleCloseModal());
    },
    onError: (error) => {
      if (error.response?.status === 403) {
        toast.error('Insufficient permissions to update students');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update student');
      }
    }
  });

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiService.delete(`/api/admin/students/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      toast.success('Student deleted successfully!');
    },
    onError: (error) => {
      if (error.response?.status === 403) {
        toast.error('Insufficient permissions to delete students');
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete student');
      }
    }
  });

  // Create parent mutation
  const createParentMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiService.post('/api/admin/parents', data);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['parents-dropdown']);
      toast.success('Parent created successfully!');
      // Set the newly created parent as selected
      const newParentId = response.data?.id;
      if (newParentId) {
        setFormData(prev => ({ ...prev, parent_id: newParentId.toString() }));
      }
      handleCloseParentModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create parent');
    }
  });

  const handleShowModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        student_name: student.student_name,
        grade_id: student.grade_id ? student.grade_id.toString() : '',
        division_id: student.division_id ? student.division_id.toString() : '',
        roll_number: student.roll_number,
        residential_address: student.residential_address || '',
        pincode: student.pincode || '',
        sam_samagrah_id: student.sam_samagrah_id || '',
        aapar_id: student.aapar_id || '',
        admission_date: student.admission_date ? student.admission_date.split(' ')[0] : '',
        parent_id: student.parent_id ? student.parent_id.toString() : ''
      });
    } else {
      setEditingStudent(null);
      setFormData({
        student_name: '',
        grade_id: selectedGrade || '',
        division_id: selectedDivision || '',
        roll_number: '',
        residential_address: '',
        pincode: '',
        sam_samagrah_id: '',
        aapar_id: '',
        admission_date: '',
        parent_id: ''
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setFormData({
      student_name: '',
      grade_id: '',
      division_id: '',
      roll_number: '',
      residential_address: '',
      pincode: '',
      sam_samagrah_id: '',
      aapar_id: '',
      admission_date: '',
      parent_id: ''
    });
    setErrors({});
    setSemesterFees(null);
    setShowSemesterFees(false);
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
    if (!formData.student_name.trim()) {
      newErrors.student_name = 'Student name is required';
    }
    if (!formData.grade_id) {
      newErrors.grade_id = 'Grade is required';
    }
    if (!formData.division_id) {
      newErrors.division_id = 'Division is required';
    }
    if (!formData.roll_number.trim()) {
      newErrors.roll_number = 'Roll number is required';
    }
    if (!formData.admission_date) {
      newErrors.admission_date = 'Admission date is required';
    }
    if (!formData.parent_id) {
      newErrors.parent_id = 'Parent ID is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      parent_id: parseInt(formData.parent_id),
      academic_year_id: getAcademicYearId() // Add academic year ID
    };

    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (student) => {
    if (window.confirm(`Are you sure you want to delete student "${student.student_name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(student.id);
    }
  };

  const handleShowParentModal = () => {
    setParentFormData({
      name: '',
      mobile: '',
      email: '',
      password: 'password',
      address: '',
      pincode: ''
    });
    setParentErrors({});
    setShowParentModal(true);
  };

  const handleCloseParentModal = () => {
    setShowParentModal(false);
    setParentFormData({
      name: '',
      mobile: '',
      email: '',
      password: 'password',
      address: '',
      pincode: ''
    });
    setParentErrors({});
  };

  const handleParentInputChange = (e) => {
    const { name, value } = e.target;
    setParentFormData(prev => ({ ...prev, [name]: value }));
    if (parentErrors[name]) {
      setParentErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateParentForm = () => {
    const newErrors = {};
    if (!parentFormData.name.trim()) {
      newErrors.name = 'Parent name is required';
    }
    if (!parentFormData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (parentFormData.mobile.length !== 10) {
      newErrors.mobile = 'Mobile number must be 10 digits';
    }
    if (parentFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentFormData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!parentFormData.password || parentFormData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setParentErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleParentSubmit = (e) => {
    e.preventDefault();
    if (!validateParentForm()) return;
    createParentMutation.mutate(parentFormData);
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
    setSelectedDivision('');
    setCurrentPage(1);
  };

  const handleDivisionFilter = (divisionId) => {
    setSelectedDivision(divisionId);
    setCurrentPage(1);
  };

  // Payment history handlers
  const handleShowPaymentHistory = (student) => {
    setSelectedStudentForHistory(student);
    setShowPaymentHistoryModal(true);
  };

  const handleClosePaymentHistory = () => {
    setShowPaymentHistoryModal(false);
    setSelectedStudentForHistory(null);
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
        {error.message || 'Failed to load students. Please try again.'}
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0 fw-semibold" style={{ fontSize: '1.1rem' }}>
          <i className="bi bi-people me-2" style={{ fontSize: '1rem' }}></i>
          Student Management
        </h5>
        <div className="d-flex gap-3 align-items-center">
          <AcademicYearSelector />
          <Button variant="primary" onClick={() => handleShowModal()}>
            <i className="bi bi-plus-circle me-2"></i>
            Add New Student
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by name, roll number, or parent mobile..."
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
                multiple={false}
              />
            </Col>
            <Col md={3}>
              <Typeahead
                id="division-filter"
                options={filterDivisions}
                labelKey="name"
                placeholder="All Divisions"
                clearButton={true}
                disabled={!selectedGrade}
                onChange={(selected) => {
                  const divisionId = selected.length > 0 ? selected[0].id : '';
                  handleDivisionFilter(divisionId);
                }}
                selected={filterDivisions.filter(division => division.id === selectedDivision)}
                className="typeahead-filter"
                multiple={false}
              />
            </Col>
            <Col md={2} className="text-end">
              <small className="text-muted">
                {totalItems} total students
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {students && students.length > 0 ? (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Student Details</th>
                  <th>Grade & Division</th>
                  <th>Roll Number</th>
                  <th>Parent Info</th>
                  <th>Fee Status</th>
                  <th>Admission Date</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr 
                    key={student.id} 
                    className={highlightedStudentId === student.id ? 'table-warning' : ''}
                    style={highlightedStudentId === student.id ? {
                      animation: 'pulse 2s ease-in-out',
                      border: '2px solid #ffc107'
                    } : {}}
                  >
                    <td>
                      <div className="fw-medium">{student.student_name}</div>
                      {student.sam_samagrah_id && (
                        <small className="text-muted">
                          Sam ID: {student.sam_samagrah_id}
                        </small>
                      )}
                    </td>
                    <td>
                      <Badge bg="info" className="me-1">{student.grade_name}</Badge>
                      <Badge bg="secondary">{student.division_name}</Badge>
                    </td>
                    <td>
                      <span className="fw-medium">{student.roll_number}</span>
                    </td>
                    <td>
                      <div>{student.parent_name}</div>
                      <small className="text-muted">{student.parent_mobile}</small>
                    </td>
                    <td>
                      <div className="fw-bold text-danger">
                        ₹{(student.total_fees || 0).toLocaleString()}
                      </div>
                      <small className="text-success d-block">
                        Paid: ₹{(student.total_paid || 0).toLocaleString()}
                      </small>
                      {student.mandatory_fees && student.optional_fees && (
                        <div>
                          <small className="text-danger d-block">
                            Mandatory Due: ₹{(student.mandatory_fees || 0).toLocaleString()}
                          </small>
                          <small className="text-muted">
                            Optional Due: ₹{(student.optional_fees || 0).toLocaleString()}
                          </small>
                        </div>
                      )}
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(student.admission_date).toLocaleDateString()}
                      </small>
                    </td>
                    <td className="text-center">
                      <div className="btn-group btn-group-sm">
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleShowPaymentHistory(student)}
                          title="View Payment History"
                        >
                          <i className="bi bi-receipt"></i>
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleShowModal(student)}
                          title="Edit Student"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(student)}
                          title="Delete Student"
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
              <i className="bi bi-people display-1 text-muted mb-4"></i>
              <h5>No Students Found</h5>
              <p className="text-muted mb-4">
                {searchTerm || selectedGrade || selectedDivision 
                  ? 'No students match your current filters.' 
                  : 'Start by adding your first student.'}
              </p>
              <Button variant="primary" onClick={() => handleShowModal()}>
                <i className="bi bi-plus-circle me-2"></i>
                Add First Student
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

      {/* Add/Edit Student Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="xl" centered>
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-success text-white border-0" closeButton>
            <Modal.Title className="d-flex align-items-center fs-4">
              <div className="modal-icon-wrapper me-3">
                <i className="bi bi-people fs-3"></i>
              </div>
              <div>
                <h5 className="mb-0">{editingStudent ? 'Edit Student' : 'Add New Student'}</h5>
                <small className="opacity-75">
                  {editingStudent ? 'Update student information' : 'Register a new student to the system'}
                </small>
              </div>
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className="p-4">
              {/* Personal Information Section */}
              <div className="section-header mb-4">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-person-circle me-2"></i>Personal Information
                </h6>
                <hr className="section-divider" />
              </div>
              
              <div className="row mb-4">
                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="student_name"
                      value={formData.student_name}
                      onChange={handleInputChange}
                      placeholder="Student Name"
                      isInvalid={!!errors.student_name}
                      maxLength={100}
                      className="form-control-lg"
                      id="studentName"
                    />
                    <label htmlFor="studentName" className="text-muted">
                      <i className="bi bi-person me-2"></i>Student Full Name *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.student_name}
                    </Form.Control.Feedback>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="form-group">
                    <label className="form-label text-muted mb-2">
                      <i className="bi bi-bookmark me-2"></i>Grade *
                    </label>
                    <Typeahead
                      id="student-grade"
                      options={grades}
                      labelKey="name"
                      placeholder="Search grade..."
                      clearButton={true}
                      size="lg"
                      onChange={(selected) => {
                        const gradeId = selected.length > 0 ? selected[0].id.toString() : '';
                        setFormData(prev => ({ ...prev, grade_id: gradeId, division_id: '' }));
                        if (errors.grade_id) {
                          setErrors(prev => ({ ...prev, grade_id: '' }));
                        }
                      }}
                      selected={grades.filter(grade => grade.id === formData.grade_id)}
                      isInvalid={!!errors.grade_id}
                      className={`typeahead-modal ${!!errors.grade_id ? 'is-invalid' : ''}`}
                      multiple={false}
                    />
                    {!!errors.grade_id && (
                      <div className="invalid-feedback d-block">
                        {errors.grade_id}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="form-group">
                    <label className="form-label text-muted mb-2">
                      <i className="bi bi-grid me-2"></i>Division *
                    </label>
                    <Typeahead
                      id="student-division"
                      options={divisions}
                      labelKey="name"
                      placeholder={
                        divisionsLoading ? "Loading divisions..." : 
                        divisionsError ? "Error loading divisions" :
                        divisions.length > 0 ? "Search division..." : 
                        formData.grade_id ? "No divisions available for this grade" : "Select a grade first"
                      }
                      clearButton={true}
                      size="lg"
                      disabled={!formData.grade_id}
                      onChange={(selected) => {
                        const divisionId = selected.length > 0 ? selected[0].id.toString() : '';
                        setFormData(prev => ({ ...prev, division_id: divisionId }));
                        if (errors.division_id) {
                          setErrors(prev => ({ ...prev, division_id: '' }));
                        }
                      }}
                      selected={divisions.filter(division => division.id === formData.division_id)}
                      isInvalid={!!errors.division_id}
                      className={`typeahead-modal ${!!errors.division_id ? 'is-invalid' : ''}`}
                      multiple={false}
                    />
                    {!!errors.division_id && (
                      <div className="invalid-feedback d-block">
                        {errors.division_id}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Information Section */}
              <div className="section-header mb-4">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-mortarboard me-2"></i>Academic Information
                </h6>
                <hr className="section-divider" />
              </div>

              <div className="row mb-4">
                <div className="col-md-4 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="roll_number"
                      value={formData.roll_number}
                      onChange={handleInputChange}
                      placeholder="Roll Number"
                      isInvalid={!!errors.roll_number}
                      maxLength={20}
                      className="form-control-lg"
                      id="rollNumber"
                    />
                    <label htmlFor="rollNumber" className="text-muted">
                      <i className="bi bi-hash me-2"></i>Roll Number *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.roll_number}
                    </Form.Control.Feedback>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="date"
                      name="admission_date"
                      value={formData.admission_date}
                      onChange={handleInputChange}
                      isInvalid={!!errors.admission_date}
                      className="form-control-lg"
                      id="admissionDate"
                    />
                    <label htmlFor="admissionDate" className="text-muted">
                      <i className="bi bi-calendar-event me-2"></i>Admission Date *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.admission_date}
                    </Form.Control.Feedback>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="form-group">
                    <label className="form-label text-muted mb-2">
                      <i className="bi bi-people-fill me-2"></i>Parent *
                    </label>
                    <div className="d-flex gap-2">
                      <div className="flex-grow-1">
                        <Typeahead
                          id="student-parent"
                          options={parents}
                          labelKey={(option) => `${option.name} - ${option.mobile}`}
                          placeholder="Search parent by name or mobile..."
                          clearButton={true}
                          size="lg"
                          onChange={(selected) => {
                            const parentId = selected.length > 0 ? selected[0].id.toString() : '';
                            setFormData(prev => ({ ...prev, parent_id: parentId }));
                            if (errors.parent_id) {
                              setErrors(prev => ({ ...prev, parent_id: '' }));
                            }
                          }}
                          selected={parents.filter(parent => parent.id === formData.parent_id)}
                          isInvalid={!!errors.parent_id}
                          className={`typeahead-modal ${!!errors.parent_id ? 'is-invalid' : ''}`}
                          multiple={false}
                          filterBy={['name', 'mobile']}
                        />
                      </div>
                      <Button
                        variant="outline-primary"
                        size="lg"
                        onClick={handleShowParentModal}
                        title="Add New Parent"
                        style={{ height: '50px', width: '50px' }}
                      >
                        <i className="bi bi-plus-lg"></i>
                      </Button>
                    </div>
                    {!!errors.parent_id && (
                      <div className="invalid-feedback d-block">
                        {errors.parent_id}
                      </div>
                    )}
                    <div className="form-text text-muted mt-2">
                      <i className="bi bi-info-circle me-1"></i>
                      Select existing parent or click + to add new
                    </div>
                  </div>
                </div>
              </div>

              {/* Government IDs Section */}
              <div className="section-header mb-4">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-card-text me-2"></i>Government IDs (Optional)
                </h6>
                <hr className="section-divider" />
              </div>

              <div className="row mb-4">
                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="sam_samagrah_id"
                      value={formData.sam_samagrah_id}
                      onChange={handleInputChange}
                      placeholder="Sam Samagrah ID"
                      maxLength={50}
                      className="form-control-lg"
                      id="samSamagrahId"
                    />
                    <label htmlFor="samSamagrahId" className="text-muted">
                      <i className="bi bi-card-list me-2"></i>Sam Samagrah ID
                    </label>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="aapar_id"
                      value={formData.aapar_id}
                      onChange={handleInputChange}
                      placeholder="AAPAR ID"
                      maxLength={50}
                      className="form-control-lg"
                      id="aaparId"
                    />
                    <label htmlFor="aaparId" className="text-muted">
                      <i className="bi bi-card-heading me-2"></i>AAPAR ID
                    </label>
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className="section-header mb-4">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-geo-alt me-2"></i>Address Information
                </h6>
                <hr className="section-divider" />
              </div>

              <div className="row mb-4">
                <div className="col-md-8 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="residential_address"
                      value={formData.residential_address}
                      onChange={handleInputChange}
                      placeholder="Residential Address"
                      maxLength={500}
                      style={{ minHeight: '100px' }}
                      id="residentialAddress"
                    />
                    <label htmlFor="residentialAddress" className="text-muted">
                      <i className="bi bi-house me-2"></i>Residential Address
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
                      id="pincode"
                    />
                    <label htmlFor="pincode" className="text-muted">
                      <i className="bi bi-mailbox me-2"></i>Pincode
                    </label>
                  </div>
                </div>
              </div>

              {/* Semester Fees Information */}
              <div className="section-header mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="text-muted mb-0">
                    <i className="bi bi-currency-rupee me-2"></i>
                    Fee Information
                  </h6>
                  {formData.grade_id && formData.division_id && (
                    <small className="text-muted">
                      Based on Grade & Division selection
                    </small>
                  )}
                </div>

                {!formData.grade_id || !formData.division_id ? (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Please select Grade and Division to view applicable fees.
                  </div>
                ) : feesLoading ? (
                  <div className="alert alert-light d-flex align-items-center">
                    <Spinner size="sm" className="me-2" />
                    Loading fee information...
                  </div>
                ) : semesterFees ? (
                  <div className="card border-primary">
                    <div className="card-header bg-primary bg-gradient text-white py-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-0 fw-bold">
                            <i className="bi bi-currency-rupee me-2"></i>
                            Fee Information
                          </h6>
                          <small className="opacity-75">Based on Grade & Division selection</small>
                        </div>
                      </div>
                    </div>
                    <div className="card-body p-4">
                      {(() => {
                        // Calculate combined totals
                        const s1Found = semesterFees.semester_1.status === 'found';
                        const s2Found = semesterFees.semester_2.status === 'found';
                        
                        if (!s1Found && !s2Found) {
                          return (
                            <div className="text-center py-4">
                              <i className="bi bi-exclamation-triangle text-warning fs-1 mb-3 d-block"></i>
                              <h6 className="text-muted">No fee structure found</h6>
                              <small className="text-muted">
                                No fee records found for the selected grade and division combination.
                              </small>
                            </div>
                          );
                        }

                        // Combine mandatory fees, avoiding duplicates for NULL semester fees
                        const seenFeeIds = new Set();
                        const allMandatoryFees = [];
                        
                        // Add Semester 1 fees
                        (semesterFees.semester_1.mandatory_fees || []).forEach(fee => {
                          if (!seenFeeIds.has(fee.id)) {
                            allMandatoryFees.push({...fee});
                            seenFeeIds.add(fee.id);
                          }
                        });
                        
                        // Add Semester 2 fees (only if not already added)
                        (semesterFees.semester_2.mandatory_fees || []).forEach(fee => {
                          if (!seenFeeIds.has(fee.id)) {
                            allMandatoryFees.push({...fee});
                            seenFeeIds.add(fee.id);
                          }
                        });
                        
                        // Combine optional fees, avoiding duplicates
                        const seenOptionalIds = new Set();
                        const allOptionalFees = [];
                        
                        // Add Semester 1 optional fees
                        (semesterFees.semester_1.optional_fees || []).forEach(fee => {
                          if (!seenOptionalIds.has(fee.id)) {
                            allOptionalFees.push({...fee});
                            seenOptionalIds.add(fee.id);
                          }
                        });
                        
                        // Add Semester 2 optional fees (only if not already added)
                        (semesterFees.semester_2.optional_fees || []).forEach(fee => {
                          if (!seenOptionalIds.has(fee.id)) {
                            allOptionalFees.push({...fee});
                            seenOptionalIds.add(fee.id);
                          }
                        });

                        // Calculate corrected totals (both-semester fees appear in both lists but should only be counted once)
                        const bothSemesterMandatory = allMandatoryFees.filter(fee => fee.semester === null);
                        const bothSemesterOptional = allOptionalFees.filter(fee => fee.semester === null);
                        
                        const bothSemesterMandatoryTotal = bothSemesterMandatory.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
                        const bothSemesterOptionalTotal = bothSemesterOptional.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
                        
                        // Calculate actual totals (subtract one instance of both-semester fees to avoid double counting)
                        const totalMandatory = (semesterFees.semester_1.mandatory_total || 0) + (semesterFees.semester_2.mandatory_total || 0) - bothSemesterMandatoryTotal;
                        const totalOptional = (semesterFees.semester_1.optional_total || 0) + (semesterFees.semester_2.optional_total || 0) - bothSemesterOptionalTotal;

                        return (
                          <>
                            {/* Mandatory Fees Section - Individual Cards */}
                            {allMandatoryFees.length > 0 && (
                              <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <span className="fw-bold text-danger fs-5">
                                    <i className="bi bi-asterisk text-danger me-2" style={{fontSize: '12px'}}></i>
                                    Mandatory Fees
                                  </span>
                                  <Badge bg="danger" className="py-2 px-3">
                                    {allMandatoryFees.length} fees
                                  </Badge>
                                </div>
                                <div className="row">
                                  {allMandatoryFees.map((fee, index) => (
                                    <div key={`mandatory-${index}`} className="col-md-6 mb-3">
                                      <div className="card border-danger shadow-sm">
                                        <div className="card-body p-3">
                                          <div className="d-flex justify-content-between align-items-start">
                                            <div className="flex-grow-1">
                                              <h6 className="card-title text-danger mb-1 fw-bold">
                                                {fee.category_name}
                                              </h6>
                                              {fee.description && (
                                                <p className="card-text text-muted small mb-2">
                                                  {fee.description}
                                                </p>
                                              )}
                                              {fee.due_date && (
                                                <small className="text-muted">
                                                  <i className="bi bi-calendar me-1"></i>
                                                  Due: {new Date(fee.due_date).toLocaleDateString()}
                                                </small>
                                              )}
                                            </div>
                                            <div className="text-end">
                                              <span className="fw-bold text-danger fs-5">
                                                ₹{parseFloat(fee.amount).toLocaleString()}
                                              </span>
                                              <br />
                                              <Badge bg="danger" pill className="mt-1">
                                                Required
                                              </Badge>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="alert alert-danger alert-dismissible">
                                  <i className="bi bi-info-circle me-2"></i>
                                  <strong>Total Mandatory: ₹{totalMandatory.toLocaleString()}</strong>
                                  <small className="d-block mt-1">These fees will be automatically assigned to the student.</small>
                                </div>
                              </div>
                            )}

                            {/* Optional Fees Section - Individual Cards */}
                            {allOptionalFees.length > 0 && (
                              <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <span className="fw-bold text-secondary fs-6">
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Optional Fees
                                  </span>
                                  <Badge bg="secondary" className="py-1 px-2">
                                    {allOptionalFees.length} fees
                                  </Badge>
                                </div>
                                <div className="row">
                                  {allOptionalFees.slice(0, 3).map((fee, index) => (
                                    <div key={`optional-${index}`} className="col-md-4 mb-2">
                                      <div className="card border-secondary" style={{opacity: 0.7}}>
                                        <div className="card-body p-2">
                                          <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                              <small className="text-muted fw-bold">{fee.category_name}</small>
                                              <br />
                                              <Badge bg="secondary" pill size="sm">Optional</Badge>
                                            </div>
                                            <small className="text-muted">₹{parseFloat(fee.amount).toLocaleString()}</small>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {allOptionalFees.length > 3 && (
                                    <div className="col-12">
                                      <small className="text-muted">
                                        <i className="bi bi-three-dots me-1"></i>
                                        +{allOptionalFees.length - 3} more optional fees (₹{(totalOptional - allOptionalFees.slice(0, 3).reduce((sum, fee) => sum + parseFloat(fee.amount), 0)).toLocaleString()})
                                      </small>
                                    </div>
                                  )}
                                </div>
                                <div className="alert alert-info">
                                  <i className="bi bi-info-circle me-2"></i>
                                  <small>Optional fees (₹{totalOptional.toLocaleString()}) can be added later if needed.</small>
                                </div>
                              </div>
                            )}

                            {/* No Fees Message */}
                            {allMandatoryFees.length === 0 && allOptionalFees.length === 0 && (
                              <div className="alert alert-warning">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                No fee structures found for this grade and division combination.
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Unable to load fee information. Please try again.
                  </div>
                )}

                {semesterFees && (semesterFees.semester_1.status === 'found' || semesterFees.semester_2.status === 'found') && (
                  <div className="alert alert-info mt-3 mb-0">
                    <small>
                      <i className="bi bi-lightbulb me-2"></i>
                      <strong>Only mandatory fees (marked with <i className="bi bi-asterisk text-danger" style={{fontSize: '8px'}}></i>) will be automatically assigned.</strong> Optional fees can be added later if needed.
                    </small>
                  </div>
                )}
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
                    <span>{editingStudent ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <i className={`bi ${editingStudent ? 'bi-arrow-repeat' : 'bi-plus-circle'} me-2`}></i>
                    <span>{editingStudent ? 'Update Student' : 'Create Student'}</span>
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </div>

        <style jsx>{`
          .bg-gradient-success {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%) !important;
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
          .section-header h6 {
            font-weight: 600;
            margin-bottom: 0;
          }
          .section-divider {
            height: 2px;
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            border: none;
            margin: 0;
            opacity: 0.3;
          }
          .form-floating > .form-control:focus ~ label,
          .form-floating > .form-control:not(:placeholder-shown) ~ label {
            transform: scale(0.85) translateY(-0.5rem) translateX(0.15rem);
            color: #11998e !important;
          }
          .form-control:focus, .form-select:focus {
            border-color: #11998e;
            box-shadow: 0 0 0 0.25rem rgba(17, 153, 142, 0.15);
          }
          .btn-primary {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            border: none;
            transition: all 0.3s ease;
          }
          .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(17, 153, 142, 0.3);
          }
          .modal-content {
            border-radius: 16px;
            overflow: hidden;
          }
          .text-primary {
            color: #11998e !important;
          }
          .form-select option {
            padding: 8px 12px;
          }
          .form-select:disabled {
            background-color: #f8f9fa;
            opacity: 0.6;
          }
          
          /* Typeahead Autocomplete Styling */
          .typeahead-filter {
            position: relative;
            z-index: 10;
          }
          .typeahead-filter .rbt {
            position: relative;
          }
          .typeahead-filter .rbt-input-main {
            border-radius: 8px;
            border: 1px solid #dee2e6;
            padding: 8px 12px;
            font-size: 14px;
          }
          .typeahead-filter .rbt-input-main:focus {
            border-color: #11998e;
            box-shadow: 0 0 0 0.25rem rgba(17, 153, 142, 0.15);
          }
          .typeahead-modal .rbt-input-main {
            border-radius: 12px;
            border: 1px solid #dee2e6;
            padding: 12px 16px;
            font-size: 16px;
            min-height: 50px;
          }
          .typeahead-modal .rbt-input-main:focus {
            border-color: #11998e;
            box-shadow: 0 0 0 0.25rem rgba(17, 153, 142, 0.15);
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
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
          }
          .rbt-close {
            color: #6c757d;
          }
          .rbt-close:hover {
            color: #11998e;
          }
          .rbt-input:disabled .rbt-input-main {
            background-color: #f8f9fa;
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          
          
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(255, 193, 7, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
          }
        `}</style>
      </Modal>

      {/* Add Parent Modal */}
      <Modal show={showParentModal} onHide={handleCloseParentModal} size="lg" centered>
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-primary text-white border-0" closeButton>
            <Modal.Title className="d-flex align-items-center fs-4">
              <div className="modal-icon-wrapper me-3">
                <i className="bi bi-person-plus fs-3"></i>
              </div>
              <div>
                <h5 className="mb-0">Add New Parent</h5>
                <small className="opacity-75">Create a new parent account</small>
              </div>
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleParentSubmit}>
            <Modal.Body className="p-4">
              <Row>
                <Col md={6} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="name"
                      value={parentFormData.name}
                      onChange={handleParentInputChange}
                      placeholder="Parent Name"
                      isInvalid={!!parentErrors.name}
                      maxLength={100}
                      className="form-control-lg"
                      id="parentName"
                    />
                    <label htmlFor="parentName" className="text-muted">
                      <i className="bi bi-person me-2"></i>Parent Full Name *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {parentErrors.name}
                    </Form.Control.Feedback>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="tel"
                      name="mobile"
                      value={parentFormData.mobile}
                      onChange={handleParentInputChange}
                      placeholder="Mobile Number"
                      isInvalid={!!parentErrors.mobile}
                      maxLength={10}
                      className="form-control-lg"
                      id="parentMobile"
                    />
                    <label htmlFor="parentMobile" className="text-muted">
                      <i className="bi bi-telephone me-2"></i>Mobile Number *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {parentErrors.mobile}
                    </Form.Control.Feedback>
                  </div>
                </Col>
              </Row>
              
              <Row>
                <Col md={6} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="email"
                      name="email"
                      value={parentFormData.email}
                      onChange={handleParentInputChange}
                      placeholder="Email"
                      isInvalid={!!parentErrors.email}
                      maxLength={100}
                      className="form-control-lg"
                      id="parentEmail"
                    />
                    <label htmlFor="parentEmail" className="text-muted">
                      <i className="bi bi-envelope me-2"></i>Email Address
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {parentErrors.email}
                    </Form.Control.Feedback>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="password"
                      name="password"
                      value={parentFormData.password}
                      onChange={handleParentInputChange}
                      placeholder="Password"
                      isInvalid={!!parentErrors.password}
                      className="form-control-lg"
                      id="parentPassword"
                    />
                    <label htmlFor="parentPassword" className="text-muted">
                      <i className="bi bi-key me-2"></i>Password *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {parentErrors.password}
                    </Form.Control.Feedback>
                  </div>
                </Col>
              </Row>
              
              <Row>
                <Col md={8} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="address"
                      value={parentFormData.address}
                      onChange={handleParentInputChange}
                      placeholder="Address"
                      maxLength={500}
                      style={{ minHeight: '100px' }}
                      id="parentAddress"
                    />
                    <label htmlFor="parentAddress" className="text-muted">
                      <i className="bi bi-house me-2"></i>Residential Address
                    </label>
                  </div>
                </Col>
                <Col md={4} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="pincode"
                      value={parentFormData.pincode}
                      onChange={handleParentInputChange}
                      placeholder="Pincode"
                      maxLength={10}
                      className="form-control-lg"
                      id="parentPincode"
                    />
                    <label htmlFor="parentPincode" className="text-muted">
                      <i className="bi bi-mailbox me-2"></i>Pincode
                    </label>
                  </div>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className="bg-light border-0 p-4">
              <Button 
                variant="outline-secondary" 
                onClick={handleCloseParentModal}
                className="px-4 py-2"
              >
                <i className="bi bi-x-circle me-2"></i>Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={createParentMutation.isLoading}
                className="px-4 py-2 shadow-sm"
              >
                {createParentMutation.isLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    <span>Create Parent</span>
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
        `}</style>
      </Modal>

      {/* Payment History Modal */}
      <Modal show={showPaymentHistoryModal} onHide={handleClosePaymentHistory} size="xl" centered>
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-success text-white border-0" closeButton>
            <Modal.Title className="d-flex align-items-center fs-4">
              <div className="modal-icon-wrapper me-3">
                <i className="bi bi-receipt fs-3"></i>
              </div>
              <div>
                <h5 className="mb-0">Payment History</h5>
                {selectedStudentForHistory && (
                  <small className="opacity-75">
                    {selectedStudentForHistory.student_name} - Roll: {selectedStudentForHistory.roll_number}
                  </small>
                )}
              </div>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {historyLoading ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading payment history...</span>
                </Spinner>
                <p className="text-muted mt-3">Loading payment history...</p>
              </div>
            ) : (
              <>
                {paymentHistoryData && paymentHistoryData.length > 0 ? (
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead className="table-dark">
                        <tr>
                          <th>Receipt #</th>
                          <th>Date</th>
                          <th>Category</th>
                          <th>Amount</th>
                          <th>Payment Method</th>
                          <th>Collected By</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistoryData.map((payment) => (
                          <tr key={payment.id}>
                            <td>
                              <code className="bg-light px-2 py-1 rounded">{payment.receipt_number}</code>
                            </td>
                            <td>
                              <small>{new Date(payment.collection_date).toLocaleDateString()}</small>
                            </td>
                            <td>{payment.category_name}</td>
                            <td>
                              <span className="fw-bold text-success">
                                ₹{parseFloat(payment.amount).toLocaleString()}
                              </span>
                            </td>
                            <td>
                              <Badge bg={
                                payment.payment_method === 'cash' ? 'success' :
                                payment.payment_method === 'card' ? 'primary' :
                                payment.payment_method === 'online' ? 'info' :
                                payment.payment_method === 'cheque' ? 'warning' :
                                'secondary'
                              }>
                                {payment.payment_method.toUpperCase()}
                              </Badge>
                            </td>
                            <td>
                              <small>{payment.collected_by_name || 'N/A'}</small>
                            </td>
                            <td>
                              <Badge bg={payment.is_verified ? 'success' : 'warning'}>
                                {payment.is_verified ? 'Verified' : 'Pending'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    
                    {/* Payment Summary */}
                    <div className="mt-4 p-3 bg-light rounded">
                      <h6 className="text-muted mb-3">Payment Summary</h6>
                      <Row>
                        <Col md={3}>
                          <div className="text-center">
                            <div className="h4 text-success mb-0">
                              ₹{paymentHistoryData.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toLocaleString()}
                            </div>
                            <small className="text-muted">Total Paid</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="text-center">
                            <div className="h4 text-primary mb-0">{paymentHistoryData.length}</div>
                            <small className="text-muted">Transactions</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="text-center">
                            <div className="h4 text-success mb-0">
                              {paymentHistoryData.filter(p => p.is_verified).length}
                            </div>
                            <small className="text-muted">Verified</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="text-center">
                            <div className="h4 text-warning mb-0">
                              {paymentHistoryData.filter(p => !p.is_verified).length}
                            </div>
                            <small className="text-muted">Pending</small>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-receipt display-1 text-muted mb-4"></i>
                    <h5 className="text-muted">No Payment History</h5>
                    <p className="text-muted">
                      No fee payments have been recorded for this student yet.
                    </p>
                  </div>
                )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={handleClosePaymentHistory}>
              Close
            </Button>
            {selectedStudentForHistory && (
              <Button 
                variant="primary" 
                onClick={() => {
                  handleClosePaymentHistory();
                  navigate('/admin/fee-collection', { 
                    state: { 
                      preSelectedStudent: selectedStudentForHistory,
                      openCollectModal: true 
                    } 
                  });
                }}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Collect Fee
              </Button>
            )}
          </Modal.Footer>
        </div>

        <style jsx>{`
          .bg-gradient-success {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
          }
        `}</style>
      </Modal>
    </div>
  );
};

export default StudentManagement;