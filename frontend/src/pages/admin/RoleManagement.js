import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Form, Badge, Tabs, Tab, Row, Col, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/common/Pagination';

const RoleManagement = () => {
  const [permissions, setPermissions] = useState({});
  const [permissionGroups, setPermissionGroups] = useState({});
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });
  
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

  useEffect(() => {
    fetchPermissions();
  }, []);

  // Fetch roles with pagination
  const { data: rolesResponse, isLoading, error } = useQuery({
    queryKey: ['roles', currentPage, itemsPerPage, debouncedSearchTerm],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      
      const response = await apiService.get(`/api/admin/roles?${params}`);
      return response.data; // Extract the data from the response
    }
  });

  const roles = rolesResponse?.data || [];
  const totalItems = rolesResponse?.total || 0;

  const fetchPermissions = async () => {
    try {
      const response = await apiService.get('/api/admin/permissions');
      setPermissions(response.data.permissions);
      setPermissionGroups(response.data.groups);
    } catch (error) {
      toast.error('Failed to fetch permissions');
    }
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setFormData({ name: '', description: '', permissions: [] });
    setShowRoleModal(true);
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    setShowRoleModal(true);
  };

  // Delete role mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiService.delete(`/api/admin/roles/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Role deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete role');
    }
  });

  const handleDeleteRole = (role) => {
    if (window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      deleteMutation.mutate(role.id);
    }
  };

  // Duplicate role mutation
  const duplicateMutation = useMutation({
    mutationFn: async ({ id, name }) => {
      const response = await apiService.post(`/api/admin/duplicate_role/${id}`, { name });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Role duplicated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to duplicate role');
    }
  });

  const handleDuplicateRole = (role) => {
    const newName = prompt(`Enter name for the duplicate of "${role.name}":`);
    if (newName) {
      duplicateMutation.mutate({ id: role.id, name: newName });
    }
  };

  // Create role mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiService.post('/api/admin/roles', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Role created successfully!');
      setShowRoleModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create role');
    }
  });

  // Update role mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiService.put(`/api/admin/roles/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Role updated successfully!');
      setShowRoleModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  });

  const handleSaveRole = (e) => {
    e.preventDefault();
    if (selectedRole) {
      updateMutation.mutate({ id: selectedRole.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handlePermissionToggle = (permission) => {
    const updatedPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter(p => p !== permission)
      : [...formData.permissions, permission];
    
    setFormData({ ...formData, permissions: updatedPermissions });
  };

  const handleSelectAllInGroup = (groupPermissions) => {
    const allSelected = groupPermissions.every(p => formData.permissions.includes(p));
    
    if (allSelected) {
      // Deselect all in group
      const updatedPermissions = formData.permissions.filter(p => !groupPermissions.includes(p));
      setFormData({ ...formData, permissions: updatedPermissions });
    } else {
      // Select all in group
      const newPermissions = [...new Set([...formData.permissions, ...groupPermissions])];
      setFormData({ ...formData, permissions: newPermissions });
    }
  };

  const isSystemRole = (roleId) => {
    return [1, 2, 3, 4].includes(roleId);
  };

  const getPermissionBadgeVariant = (permission) => {
    if (permission.includes('.view')) return 'info';
    if (permission.includes('.create')) return 'success';
    if (permission.includes('.update')) return 'warning';
    if (permission.includes('.delete')) return 'danger';
    if (permission === '*') return 'dark';
    return 'primary';
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
        Failed to load roles. Please try again.
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-0 fw-semibold" style={{ fontSize: '1.1rem' }}>
            <i className="bi bi-shield-lock me-2" style={{ fontSize: '1rem' }}></i>
            Role Management
          </h5>
          <small className="text-muted" style={{ fontSize: '0.8rem' }}>
            Manage user roles and permissions
          </small>
        </div>
        <Button 
          variant="primary" 
          onClick={handleCreateRole}
          className="bg-gradient-primary"
        >
          <i className="bi bi-plus-circle me-2"></i>
          Create New Role
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
                  placeholder="Search roles by name or description..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="text-end">
              <small className="text-muted">
                {totalItems} total roles
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {roles && roles.length > 0 ? (
            <Table responsive hover>
            <thead className="table-light">
              <tr>
                <th>Role Name</th>
                <th>Description</th>
                <th>Users</th>
                <th>Permissions</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id}>
                  <td>
                    <strong>{role.name}</strong>
                    {isSystemRole(role.id) && (
                      <Badge bg="secondary" className="ms-2">System</Badge>
                    )}
                  </td>
                  <td>{role.description}</td>
                  <td>
                    <Badge bg="info">{role.user_count} users</Badge>
                  </td>
                  <td>
                    {role.permissions.includes('*') ? (
                      <Badge bg="dark">All Permissions</Badge>
                    ) : (
                      <span>{role.permissions.length} permissions</span>
                    )}
                  </td>
                  <td className="text-center">
                    <div className="btn-group btn-group-sm">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEditRole(role)}
                        disabled={role.id === 1}
                        title="Edit Role"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => handleDuplicateRole(role)}
                        title="Duplicate Role"
                        disabled={duplicateMutation.isLoading}
                      >
                        <i className="bi bi-files"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteRole(role)}
                        disabled={isSystemRole(role.id) || role.user_count > 0 || deleteMutation.isLoading}
                        title="Delete Role"
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
              <i className="bi bi-shield-lock display-1 text-muted mb-4"></i>
              <h5>No Roles Found</h5>
              <p className="text-muted mb-4">Start by creating your first role.</p>
              <Button variant="primary" onClick={handleCreateRole}>
                <i className="bi bi-plus-circle me-2"></i>
                Add First Role
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

      {/* Role Modal */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedRole ? 'Edit Role' : 'Create New Role'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveRole}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={selectedRole?.id === 1}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <h5 className="mb-3">Permissions</h5>
            {selectedRole?.id === 1 ? (
              <Alert variant="info">
                Super Admin has all permissions by default and cannot be modified.
              </Alert>
            ) : (
              <div>
                <Form.Check
                  type="checkbox"
                  label="Grant All Permissions (*)"
                  checked={formData.permissions.includes('*')}
                  onChange={() => {
                    if (formData.permissions.includes('*')) {
                      setFormData({ ...formData, permissions: [] });
                    } else {
                      setFormData({ ...formData, permissions: ['*'] });
                    }
                  }}
                  className="mb-3"
                />
                
                {!formData.permissions.includes('*') && (
                  <Tabs defaultActiveKey={Object.keys(permissionGroups)[0]} className="mb-3">
                    {Object.entries(permissionGroups).map(([group, groupPermissions]) => (
                      <Tab key={group} eventKey={group} title={group}>
                        <div className="mb-2">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => handleSelectAllInGroup(groupPermissions)}
                          >
                            {groupPermissions.every(p => formData.permissions.includes(p)) 
                              ? 'Deselect All' 
                              : 'Select All'}
                          </Button>
                        </div>
                        <Row>
                          {groupPermissions.map(permission => (
                            <Col md={6} key={permission} className="mb-2">
                              <Form.Check
                                type="checkbox"
                                id={`perm-${permission}`}
                                label={
                                  <span>
                                    <Badge bg={getPermissionBadgeVariant(permission)} className="me-2">
                                      {permission}
                                    </Badge>
                                    {permissions[permission]?.label}
                                    <small className="d-block text-muted">
                                      {permissions[permission]?.description}
                                    </small>
                                  </span>
                                }
                                checked={formData.permissions.includes(permission)}
                                onChange={() => handlePermissionToggle(permission)}
                              />
                            </Col>
                          ))}
                        </Row>
                      </Tab>
                    ))}
                  </Tabs>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              className="bg-gradient-primary"
              disabled={selectedRole?.id === 1 || createMutation.isLoading || updateMutation.isLoading}
            >
              {createMutation.isLoading || updateMutation.isLoading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  <span>{selectedRole ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <span>{selectedRole ? 'Update Role' : 'Create Role'}</span>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      <style jsx>{`
        .bg-gradient-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
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
      `}</style>
    </div>
  );
};

export default RoleManagement;