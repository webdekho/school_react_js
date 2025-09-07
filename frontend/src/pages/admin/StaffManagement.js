import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typeahead } from 'react-bootstrap-typeahead';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import { useAcademicYear } from '../../contexts/AcademicYearContext';

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
    grades: [],
    divisions: []
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
        return response.data || [];
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

  const handleShowModal = (staffMember = null) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        name: staffMember.name,
        mobile: staffMember.mobile,
        email: staffMember.email || '',
        password: '',
        role_id: staffMember.role_id ? staffMember.role_id.toString() : '',
        address: staffMember.address || '',
        pincode: staffMember.pincode || '',
        grades: staffMember.assigned_grades || [],
        divisions: staffMember.assigned_divisions || []
      });
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
        grades: [],
        divisions: []
      });
    }
    setErrors({});
    setShowModal(true);
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
      grades: [],
      divisions: []
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
      grades: formData.grades.map(g => g.id || g),
      divisions: formData.divisions.map(d => d.id || d)
    };
    
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
                      <Typeahead
                        id="staff-role"
                        options={roles}
                        labelKey="name"
                        placeholder="Search role..."
                        clearButton={true}
                        size="lg"
                        onChange={(selected) => {
                          const roleId = selected.length > 0 ? selected[0].id.toString() : '';
                          setFormData(prev => ({ ...prev, role_id: roleId }));
                          if (errors.role_id) {
                            setErrors(prev => ({ ...prev, role_id: '' }));
                          }
                        }}
                        selected={roles.filter(role => role.id.toString() === formData.role_id.toString())}
                        isInvalid={!!errors.role_id}
                        className={`typeahead-modal ${!!errors.role_id ? 'is-invalid' : ''}`}
                        multiple={false}
                      />
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
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted">
                    <i className="bi bi-bookmark me-2"></i>Assigned Grades
                  </label>
                  <Typeahead
                    id="grades-typeahead"
                    labelKey="name"
                    multiple
                    onChange={(selected) => setFormData(prev => ({ ...prev, grades: selected }))}
                    options={grades}
                    placeholder="Select grades to assign..."
                    selected={formData.grades}
                    className="typeahead-filter"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted">
                    <i className="bi bi-grid me-2"></i>Assigned Divisions
                  </label>
                  <Typeahead
                    id="divisions-typeahead"
                    labelKey={(option) => `${option.name} (${option.grade_name || 'Grade'})`}
                    multiple
                    onChange={(selected) => setFormData(prev => ({ ...prev, divisions: selected }))}
                    options={divisions}
                    placeholder="Select divisions to assign..."
                    selected={formData.divisions}
                    className="typeahead-filter"
                  />
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
          
          /* Typeahead Styling */
          .typeahead-filter .rbt-input-main {
            border-radius: 8px;
            border: 1px solid #dee2e6;
            padding: 8px 12px;
            font-size: 14px;
          }
          .typeahead-filter .rbt-input-main:focus {
            border-color: #28a745;
            box-shadow: 0 0 0 0.25rem rgba(40, 167, 69, 0.15);
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
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
          }
          .rbt-token {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            border: none;
            color: white;
            border-radius: 12px;
          }
          .rbt-close {
            color: rgba(255, 255, 255, 0.8);
          }
          .rbt-close:hover {
            color: white;
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