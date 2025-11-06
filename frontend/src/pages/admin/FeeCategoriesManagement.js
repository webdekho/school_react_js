import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import { useAcademicYear } from '../../contexts/AcademicYearContext';

const FeeCategoriesManagement = () => {
  const { getFormattedAcademicYear } = useAcademicYear();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
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

  // Fetch fee categories with pagination
  const { data: categoriesResponse, isLoading, error } = useQuery({
    queryKey: ['fee_categories', currentPage, itemsPerPage, debouncedSearchTerm],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      
      const response = await apiService.get(`/api/admin/fee_categories?${params}`);
      return response.data;
    }
  });

  const categories = categoriesResponse?.data || [];
  const totalItems = categoriesResponse?.total || 0;

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiService.post('/api/admin/fee_categories', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fee_categories']);
      toast.success('Fee category created successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create fee category');
    }
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiService.put(`/api/admin/fee_categories/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fee_categories']);
      toast.success('Fee category updated successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update fee category');
    }
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiService.delete(`/api/admin/fee_categories/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fee_categories']);
      toast.success('Fee category deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete fee category');
    }
  });

  const handleShowModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || ''
      });
    } else {
      setEditingCategory(null);
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
    setEditingCategory(null);
    setFormData({
      name: '',
      description: ''
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
      newErrors.name = 'Category name is required';
    }
    if (formData.name.length > 100) {
      newErrors.name = 'Category name must be less than 100 characters';
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

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (category) => {
    if (category.structure_count > 0) {
      toast.error('Cannot delete category that is used in fee structures');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(category.id);
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
        Failed to load fee categories. Please try again.
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-0 fw-semibold" style={{ fontSize: '1.1rem' }}>
            <i className="bi bi-tags me-2" style={{ fontSize: '1rem' }}></i>
            Fee Categories Management
          </h5>
          <small className="text-muted">
            <i className="bi bi-calendar-range me-1"></i>
            {getFormattedAcademicYear()}
          </small>
        </div>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <i className="bi bi-plus-circle me-2"></i>
          Add New Category
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
                  placeholder="Search categories by name or description..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="text-end">
              <small className="text-muted">
                {totalItems} total categories
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {categories && categories.length > 0 ? (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Usage</th>
                  <th>Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="fw-medium d-flex align-items-center">
                        <i className="bi bi-tag-fill me-2 text-primary"></i>
                        {category.name}
                      </div>
                    </td>
                    <td>
                      <div className="text-muted">
                        {category.description || 'No description provided'}
                      </div>
                    </td>
                    <td>
                      <Badge bg={category.structure_count > 0 ? 'success' : 'light'} text={category.structure_count > 0 ? 'white' : 'dark'}>
                        {category.structure_count || 0} structures
                      </Badge>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(category.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td className="text-center">
                      <div className="btn-group btn-group-sm">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleShowModal(category)}
                          title="Edit Category"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(category)}
                          title="Delete Category"
                          disabled={deleteMutation.isLoading || category.structure_count > 0}
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
              <i className="bi bi-tags display-1 text-muted mb-4"></i>
              <h5>No Categories Found</h5>
              <p className="text-muted mb-4">
                {searchTerm ? 'No categories match your search criteria.' : 'Start by creating your first fee category.'}
              </p>
              <Button variant="primary" onClick={() => handleShowModal()}>
                <i className="bi bi-plus-circle me-2"></i>
                Add First Category
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

      {/* Add/Edit Category Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-category text-white border-0 py-3" closeButton>
            <Modal.Title className="d-flex align-items-center">
              <i className="bi bi-tags me-2"></i>
              <span>{editingCategory ? 'Edit Fee Category' : 'Add New Fee Category'}</span>
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
                      placeholder="Category Name"
                      isInvalid={!!errors.name}
                      maxLength={100}
                      className="form-control-lg"
                      id="categoryName"
                    />
                    <label htmlFor="categoryName" className="text-muted">
                      <i className="bi bi-tag me-2"></i>Category Name *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                  </div>
                  <div className="form-text text-muted mt-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Examples: Bag, Book, Uniform/Shoes, General Payment, Bus Payment
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
                      id="categoryDescription"
                    />
                    <label htmlFor="categoryDescription" className="text-muted">
                      <i className="bi bi-text-paragraph me-2"></i>Description (Optional)
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.description}
                    </Form.Control.Feedback>
                  </div>
                  <div className="form-text text-muted mt-2 d-flex justify-content-between">
                    <span>
                      <i className="bi bi-lightbulb me-1"></i>
                      Describe what this category covers and when it's used
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
                    <span>{editingCategory ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <i className={`bi ${editingCategory ? 'bi-arrow-repeat' : 'bi-plus-circle'} me-2`}></i>
                    <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </div>

        <style jsx>{`
          .bg-gradient-category {
            background: linear-gradient(135deg, #fd7e14 0%, #e55d87 100%) !important;
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
            color: #fd7e14 !important;
          }
          .form-control:focus {
            border-color: #fd7e14;
            box-shadow: 0 0 0 0.25rem rgba(253, 126, 20, 0.15);
          }
          .btn-primary {
            background: linear-gradient(135deg, #fd7e14 0%, #e55d87 100%);
            border: none;
            transition: all 0.3s ease;
          }
          .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(253, 126, 20, 0.3);
          }
          .modal-content {
            border-radius: 16px;
            overflow: hidden;
          }
        `}</style>
      </Modal>
    </div>
  );
};

export default FeeCategoriesManagement;