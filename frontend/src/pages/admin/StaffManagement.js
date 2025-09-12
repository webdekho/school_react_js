import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import { useAcademicYear } from '../../contexts/AcademicYearContext';
import $ from 'jquery';
import 'select2';
import 'select2/dist/css/select2.min.css';

const StaffManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getFormattedAcademicYear } = useAcademicYear();
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [highlightedStaffId, setHighlightedStaffId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: 'password',
    role_id: '',
    address: '',
    pincode: '',
    selectedGradeIds: [],
    selectedDivisionIds: []
  });
  const [errors, setErrors] = useState({});

  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const searchInputRef = useRef(null);
  const queryClient = useQueryClient();
  const gradesSelectRef = useRef(null);
  const divisionsSelectRef = useRef(null);

  // Handle navigation state from Global Search
  useEffect(() => {
    if (location.state?.searchStaff && location.state?.staffId) {
      const { searchStaff, staffId } = location.state;
      
      setSearchTerm(searchStaff);
      setHighlightedStaffId(staffId);
      toast.success(`Found staff: ${searchStaff}`);
      navigate(location.pathname, { replace: true, state: {} });
      
      setTimeout(() => {
        setHighlightedStaffId(null);
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

  // Fetch staff with pagination
  const { data: staffResponse, isLoading, error } = useQuery({
    queryKey: ['staff', currentPage, itemsPerPage, debouncedSearchTerm, selectedRole],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      
      if (selectedRole) {
        params.append('role_id', selectedRole);
      }
      
      const response = await apiService.get(`/api/admin/staff?${params}`);
      return response.data;
    }
  });

  // Fetch roles for dropdown
  const { data: roles = [], isLoading: rolesLoading, error: rolesError } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/api/admin/roles_dropdown');
        console.log('Roles API response:', response);
        // Filter out super_admin role
        const filteredRoles = (response.data || []).filter(role => 
          role.name && role.name.toLowerCase() !== 'super_admin'
        );
        return filteredRoles;
      } catch (error) {
        console.error('Error fetching roles:', error);
        throw error;
      }
    }
  });

  // Fetch grades for assignment
  const { data: grades = [] } = useQuery({
    queryKey: ['grades-dropdown'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/grades_dropdown');
      return response.data;
    }
  });

  // Fetch divisions for assignment
  const { data: divisions = [] } = useQuery({
    queryKey: ['divisions-dropdown'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/divisions_dropdown');
      return response.data;
    }
  });

  const staff = staffResponse?.data || [];
  const totalItems = staffResponse?.total || 0;

  // Initialize Select2 when modal opens
  useEffect(() => {
    if (showModal && gradesSelectRef.current && divisionsSelectRef.current && grades.length > 0 && divisions.length > 0) {
      // Initialize Grades Select2
      const $gradesSelect = $(gradesSelectRef.current);
      $gradesSelect.select2({
        placeholder: 'Select grades...',
        allowClear: true,
        closeOnSelect: false,
        width: '100%',
        theme: 'bootstrap-5',
        tags: true,
        tokenSeparators: [',', ' '],
        templateSelection: function (data) {
          if (!data.id) return data.text;
          
          const $selection = $(
            '<span class="select2-selection__choice__custom">' +
              '<span class="select2-selection__choice__remove-custom" role="presentation">×</span>' +
              data.text +
            '</span>'
          );
          
          return $selection;
        }
      });

      // Initialize Divisions Select2
      const $divisionsSelect = $(divisionsSelectRef.current);
      $divisionsSelect.select2({
        placeholder: 'Select divisions...',
        allowClear: true,
        closeOnSelect: false,
        width: '100%',
        theme: 'bootstrap-5',
        tags: true,
        tokenSeparators: [',', ' '],
        templateSelection: function (data) {
          if (!data.id) return data.text;
          
          const $selection = $(
            '<span class="select2-selection__choice__custom">' +
              '<span class="select2-selection__choice__remove-custom" role="presentation">×</span>' +
              data.text +
            '</span>'
          );
          
          return $selection;
        }
      });

      // Handle grade selection changes
      $gradesSelect.on('change', function() {
        const selectedValues = $(this).val() || [];
        setFormData(prev => ({
          ...prev,
          selectedGradeIds: selectedValues.map(val => val.toString())
        }));
      });

      // Handle division selection changes
      $divisionsSelect.on('change', function() {
        const selectedValues = $(this).val() || [];
        setFormData(prev => ({
          ...prev,
          selectedDivisionIds: selectedValues.map(val => val.toString())
        }));
      });

      // Set initial values if editing
      if (formData.selectedGradeIds.length > 0) {
        $gradesSelect.val(formData.selectedGradeIds).trigger('change');
      }
      if (formData.selectedDivisionIds.length > 0) {
        $divisionsSelect.val(formData.selectedDivisionIds).trigger('change');
      }

      // Cleanup function
      return () => {
        if ($gradesSelect.data('select2')) {
          $gradesSelect.select2('destroy');
        }
        if ($divisionsSelect.data('select2')) {
          $divisionsSelect.select2('destroy');
        }
      };
    }
  }, [showModal, grades, divisions, editingStaff]);

  // Update Select2 values when formData changes (for editing)
  useEffect(() => {
    if (showModal && editingStaff && gradesSelectRef.current && divisionsSelectRef.current) {
      const $gradesSelect = $(gradesSelectRef.current);
      const $divisionsSelect = $(divisionsSelectRef.current);

      if ($gradesSelect.data('select2')) {
        $gradesSelect.val(formData.selectedGradeIds).trigger('change');
      }
      if ($divisionsSelect.data('select2')) {
        $divisionsSelect.val(formData.selectedDivisionIds).trigger('change');
      }
    }
  }, [formData.selectedGradeIds, formData.selectedDivisionIds, showModal, editingStaff]);

  // Create staff mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiService.post('/api/admin/staff', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      toast.success('Staff member created successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create staff member');
    }
  });

  // Update staff mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiService.put(`/api/admin/staff/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      toast.success('Staff member updated successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update staff member');
    }
  });

  // Delete staff mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiService.delete(`/api/admin/staff/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      toast.success('Staff member deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete staff member');
    }
  });

  const handleShowModal = async (staffMember = null) => {
    setErrors({});
    setShowModal(true);
    
    if (staffMember) {
      try {
        // Fetch full staff details including assignments
        const response = await apiService.get(`/api/admin/staff/${staffMember.id}`);
        const fullStaffData = response.data;
        
        console.log('Loading staff assignments for editing');
        
        setEditingStaff(fullStaffData);
        
        // Set basic form data with IDs for multi-select
        setFormData({
          name: fullStaffData.name,
          mobile: fullStaffData.mobile,
          email: fullStaffData.email || '',
          password: '',
          role_id: fullStaffData.role_id ? fullStaffData.role_id.toString() : '',
          address: fullStaffData.address || '',
          pincode: fullStaffData.pincode || '',
          selectedGradeIds: (fullStaffData.assigned_grades || []).map(g => g.id.toString()),
          selectedDivisionIds: (fullStaffData.assigned_divisions || []).map(d => d.id.toString())
        });
        
      } catch (error) {
        toast.error('Failed to load staff details');
        console.error('Error loading staff details:', error);
      }
    } else {
      setEditingStaff(null);
      setFormData({
        name: '',
        mobile: '',
        email: '',
        password: 'password',
        role_id: '',
        address: '',
        pincode: '',
        selectedGradeIds: [],
        selectedDivisionIds: []
      });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      password: 'password',
      role_id: '',
      address: '',
      pincode: '',
      selectedGradeIds: [],
      selectedDivisionIds: []
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
      newErrors.name = 'Staff name is required';
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
    if (!formData.role_id) {
      newErrors.role_id = 'Role is required';
    }
    if (!editingStaff && !formData.password) {
      newErrors.password = 'Password is required for new staff';
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

    const submitData = { 
      ...formData,
      grades: formData.selectedGradeIds,
      divisions: formData.selectedDivisionIds
    };
    
    // Remove the ID arrays from the final data
    delete submitData.selectedGradeIds;
    delete submitData.selectedDivisionIds;
    
    console.log('Submitting staff data:', submitData);
    
    if (editingStaff && !submitData.password) {
      delete submitData.password;
    }

    if (editingStaff) {
      updateMutation.mutate({ id: editingStaff.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (staffMember) => {
    if (window.confirm(`Are you sure you want to delete staff member "${staffMember.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(staffMember.id);
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

  const handleRoleFilter = (e) => {
    setSelectedRole(e.target.value);
    setCurrentPage(1);
  };

  const getRoleBadgeColor = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'teacher':
        return 'primary';
      case 'principal':
        return 'success';
      case 'vice principal':
        return 'info';
      case 'admin':
        return 'danger';
      default:
        return 'secondary';
    }
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
        Failed to load staff. Please try again.
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">
            <i className="bi bi-people me-2"></i>
            Staff Management
          </h4>
          <small className="text-muted">
            <i className="bi bi-calendar-range me-1"></i>
            {getFormattedAcademicYear()}
          </small>
        </div>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <i className="bi bi-plus-circle me-2"></i>
          Add New Staff
        </Button>
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
                  placeholder="Search by name, mobile, or email..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={selectedRole} onChange={handleRoleFilter}>
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={5} className="text-end">
              <small className="text-muted">
                {totalItems} total staff members
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {staff && staff.length > 0 ? (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Staff Details</th>
                  <th>Contact Information</th>
                  <th>Role</th>
                  <th>Assignments</th>
                  <th>Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((staffMember) => (
                  <tr 
                    key={staffMember.id}
                    className={highlightedStaffId === staffMember.id ? 'table-warning' : ''}
                    style={highlightedStaffId === staffMember.id ? {
                      animation: 'pulse 2s ease-in-out',
                      border: '2px solid #ffc107'
                    } : {}}
                  >
                    <td>
                      <div className="fw-medium">{staffMember.name}</div>
                      {staffMember.address && (
                        <small className="text-muted">{staffMember.address}</small>
                      )}
                    </td>
                    <td>
                      <div>{staffMember.mobile}</div>
                      {staffMember.email && (
                        <small className="text-muted">{staffMember.email}</small>
                      )}
                    </td>
                    <td>
                      <Badge bg={getRoleBadgeColor(staffMember.role_name)}>
                        {staffMember.role_name}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Badge bg="info" text="dark">
                          {staffMember.grade_count || 0} Grades
                        </Badge>
                        <Badge bg="warning" text="dark">
                          {staffMember.division_count || 0} Divisions
                        </Badge>
                      </div>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(staffMember.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td className="text-center">
                      <div className="btn-group btn-group-sm">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleShowModal(staffMember)}
                          title="Edit Staff"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(staffMember)}
                          title="Delete Staff"
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
              <h5>No Staff Found</h5>
              <p className="text-muted mb-4">
                {searchTerm || selectedRole ? 'No staff match your search criteria.' : 'Start by adding your first staff member.'}
              </p>
              <Button variant="primary" onClick={() => handleShowModal()}>
                <i className="bi bi-plus-circle me-2"></i>
                Add First Staff Member
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

      {/* Add/Edit Staff Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="xl">
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-staff text-white border-0" closeButton>
            <Modal.Title className="d-flex align-items-center fs-4">
              <div className="modal-icon-wrapper me-3">
                <i className="bi bi-people fs-3"></i>
              </div>
              <div>
                <h5 className="mb-0">{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</h5>
                <small className="opacity-75">
                  {editingStaff ? 'Update staff information and assignments' : 'Register a new staff member to the system'}
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
                      placeholder="Staff Name"
                      isInvalid={!!errors.name}
                      maxLength={100}
                      className="form-control-lg"
                      id="staffName"
                    />
                    <label htmlFor="staffName" className="text-muted">
                      <i className="bi bi-person me-2"></i>Full Name *
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
                      id="staffMobile"
                    />
                    <label htmlFor="staffMobile" className="text-muted">
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
                      id="staffEmail"
                    />
                    <label htmlFor="staffEmail" className="text-muted">
                      <i className="bi bi-envelope me-2"></i>Email Address
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-group">
                    <label className="form-label text-muted mb-2">
                      <i className="bi bi-shield me-2"></i>Role *
                    </label>
                    {rolesLoading ? (
                      <Form.Select
                        disabled
                        size="lg"
                        className="form-control-lg"
                      >
                        <option>Loading roles...</option>
                      </Form.Select>
                    ) : rolesError || roles.length === 0 ? (
                      <Form.Select
                        value={formData.role_id}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, role_id: e.target.value }));
                          if (errors.role_id) {
                            setErrors(prev => ({ ...prev, role_id: '' }));
                          }
                        }}
                        isInvalid={!!errors.role_id}
                        size="lg"
                        className="form-control-lg"
                      >
                        <option value="">Select Role</option>
                        <option value="2">Admin</option>
                        <option value="3">Staff</option>
                        <option value="5">Teacher</option>
                      </Form.Select>
                    ) : (
                      <Form.Select
                        value={formData.role_id}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, role_id: e.target.value }));
                          if (errors.role_id) {
                            setErrors(prev => ({ ...prev, role_id: '' }));
                          }
                        }}
                        isInvalid={!!errors.role_id}
                        size="lg"
                        className="form-control-lg"
                      >
                        <option value="">Select Role</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </Form.Select>
                    )}
                    {!!errors.role_id && (
                      <div className="invalid-feedback d-block">
                        {errors.role_id}
                      </div>
                    )}
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
                      id="staffPassword"
                    />
                    <label htmlFor="staffPassword" className="text-muted">
                      <i className="bi bi-lock me-2"></i>Password {editingStaff ? '(Leave empty to keep current)' : '*'}
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="Pincode"
                      maxLength={10}
                      className="form-control-lg"
                      id="staffPincode"
                    />
                    <label htmlFor="staffPincode" className="text-muted">
                      <i className="bi bi-mailbox me-2"></i>Pincode
                    </label>
                  </div>
                </div>
                <div className="col-12 mb-3">
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
                      id="staffAddress"
                    />
                    <label htmlFor="staffAddress" className="text-muted">
                      <i className="bi bi-geo-alt me-2"></i>Address
                    </label>
                  </div>
                </div>

                {/* Assignments Section */}
                <div className="col-12 mb-3">
                  <hr />
                  <h6 className="text-muted mb-3">
                    <i className="bi bi-bookmark-check me-2"></i>Grade & Division Assignments
                  </h6>
                </div>
                
                {/* Grades Multi-Select */}
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted">
                    <i className="bi bi-bookmark me-2"></i>Assigned Grades
                  </label>
                  
                  <select
                    ref={gradesSelectRef}
                    multiple
                    className="form-control"
                    style={{ width: '100%' }}
                  >
                    {grades.map(grade => (
                      <option key={grade.id} value={grade.id}>
                        {grade.name}
                      </option>
                    ))}
                  </select>
                  
                </div>

                {/* Divisions Multi-Select */}
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted">
                    <i className="bi bi-grid me-2"></i>Assigned Divisions
                  </label>
                  
                  <select
                    ref={divisionsSelectRef}
                    multiple
                    className="form-control"
                    style={{ width: '100%' }}
                  >
                    {divisions.map(division => (
                      <option key={division.id} value={division.id}>
                        {division.name} ({division.grade_name || 'Grade'})
                      </option>
                    ))}
                  </select>
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
                    <span>{editingStaff ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <i className={`bi ${editingStaff ? 'bi-arrow-repeat' : 'bi-plus-circle'} me-2`}></i>
                    <span>{editingStaff ? 'Update Staff' : 'Create Staff'}</span>
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </div>

        <style jsx>{`
          .bg-gradient-staff {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
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
          .form-floating > .form-control:not(:placeholder-shown) ~ label,
          .form-floating > .form-select:focus ~ label,
          .form-floating > .form-select:not([value=""]) ~ label {
            transform: scale(0.85) translateY(-0.5rem) translateX(0.15rem);
            color: #28a745 !important;
          }
          .form-control:focus,
          .form-select:focus {
            border-color: #28a745;
            box-shadow: 0 0 0 0.25rem rgba(40, 167, 69, 0.15);
          }
          .btn-primary {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            border: none;
            transition: all 0.3s ease;
          }
          .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
          }
          .modal-content {
            border-radius: 16px;
            overflow: hidden;
          }
          
          /* Multi-select styling */
          details summary {
            cursor: pointer;
          }
          details summary:hover {
            background-color: #f8f9fa;
          }
          
          /* Tag styling */
          .badge-tag:hover {
            background-color: #dee2e6 !important;
          }
          .btn-close-tag:hover {
            color: #212529 !important;
            background-color: rgba(0, 0, 0, 0.1);
            border-radius: 50%;
          }
          
          /* Form control styling for tag container */
          .form-control:focus-within {
            border-color: #86b7fe;
            box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
          }
          
          /* Select2 Custom Tag Styling */
          .select2-container--bootstrap-5 .select2-selection--multiple .select2-selection__choice {
            background-color: #e9ecef !important;
            border: 1px solid #dee2e6 !important;
            border-radius: 6px !important;
            color: #495057 !important;
            font-size: 0.875rem !important;
            padding: 4px 8px !important;
            margin: 2px 4px 2px 0 !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
          }
          
          .select2-container--bootstrap-5 .select2-selection--multiple .select2-selection__choice__remove {
            color: #6c757d !important;
            cursor: pointer !important;
            font-size: 14px !important;
            font-weight: bold !important;
            line-height: 1 !important;
            margin-left: 6px !important;
            order: 2 !important;
            padding: 0 !important;
            background: none !important;
            border: none !important;
          }
          
          .select2-container--bootstrap-5 .select2-selection--multiple .select2-selection__choice__remove:hover {
            color: #212529 !important;
            background-color: rgba(0, 0, 0, 0.1) !important;
            border-radius: 50% !important;
          }
          
          .select2-container--bootstrap-5 .select2-selection--multiple .select2-selection__choice:hover {
            background-color: #dee2e6 !important;
            border-color: #c6ccd2 !important;
          }
          
          .select2-container--bootstrap-5 .select2-selection--multiple {
            border: 1px solid #ced4da !important;
            border-radius: 6px !important;
            min-height: 45px !important;
            padding: 4px 8px !important;
          }
          
          .select2-container--bootstrap-5.select2-container--focus .select2-selection--multiple {
            border-color: #28a745 !important;
            box-shadow: 0 0 0 0.25rem rgba(40, 167, 69, 0.15) !important;
          }
          
          .select2-dropdown {
            border: 1px solid #ced4da !important;
            border-radius: 6px !important;
            box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
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

export default StaffManagement;