import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import { useAcademicYear } from '../../contexts/AcademicYearContext';

const FeeStructuresManagement = () => {
  const { selectedAcademicYear, getFormattedAcademicYear } = useAcademicYear();
  const [showModal, setShowModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [formData, setFormData] = useState({
    fee_category_id: '',
    grade_id: '',
    amount: '',
    is_mandatory: false,
    due_date: '',
    late_fee_amount: '',
    late_fee_days: '',
    description: '',
    item_size: '',
    semester: ''  // Both Semesters by default (empty string)
  });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [errors, setErrors] = useState({});

  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

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

  // Fetch fee categories for dropdown
  const { data: categoriesData, error: categoriesError, isLoading: categoriesLoading } = useQuery({
    queryKey: ['fee_categories_dropdown'],
    queryFn: async () => {
      try {
        // Try the dropdown endpoint
        const response = await apiService.get('/api/admin/fee_categories/dropdown');
        console.log('Categories API response:', response);
        
        // Handle different response formats
        if (response && response.status === 'success' && response.data && Array.isArray(response.data)) {
          return { data: response.data };
        }
        
        if (response && response.data && Array.isArray(response.data)) {
          return { data: response.data };
        }
        
        if (response && Array.isArray(response)) {
          return { data: response };
        }
        
        return { data: [] };
      } catch (dropdownError) {
        // Fallback to main endpoint
        try {
          const response = await apiService.get('/api/admin/fee_categories?limit=100&offset=0');
          
          if (response && response.data && response.data.data) {
            return { data: response.data.data.map(cat => ({ id: cat.id, name: cat.name })) };
          }
          
          return { data: [] };
        } catch (mainError) {
          // Last fallback - try direct fetch
          try {
            const directResponse = await fetch('http://localhost/School/backend/api/admin/fee_categories/dropdown', {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
            const directData = await directResponse.json();
            
            if (directData && directData.data && Array.isArray(directData.data)) {
              return { data: directData.data };
            }
          } catch (directError) {
            console.error('Failed to load categories from all endpoints');
          }
          
          return { data: [] };
        }
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });

  // Update selected categories when editing and categories data becomes available
  useEffect(() => {
    if (editingStructure && categoriesData?.data && formData.fee_category_id && selectedCategories.length === 0) {
      const category = categoriesData.data.find(cat => cat.id == formData.fee_category_id);
      if (category) {
        setSelectedCategories([category]);
      }
    }
  }, [categoriesData, editingStructure, formData.fee_category_id, selectedCategories.length]);

  // Fetch grades for dropdown
  const { data: gradesData } = useQuery({
    queryKey: ['grades_dropdown'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/grades?limit=100&offset=0');
      console.log('Grades API response:', response);
      return response.data;
    }
  });

  // Remove divisions query - no longer needed

  // Update selected grades when data becomes available
  useEffect(() => {
    if (editingStructure && gradesData?.data && formData.grade_id && selectedGrades.length === 0) {
      const grade = gradesData.data.find(g => g.id == formData.grade_id);
      if (grade) {
        setSelectedGrades([grade]);
      }
    }
  }, [gradesData, editingStructure, formData.grade_id, selectedGrades.length]);

  // Remove divisions useEffect - no longer needed

  // Fetch fee structures with pagination
  const { data: structuresResponse, isLoading, error } = useQuery({
    queryKey: ['fee_structures', currentPage, itemsPerPage, debouncedSearchTerm, filterGrade, filterCategory, selectedAcademicYear?.id],
    queryFn: async () => {
      if (!selectedAcademicYear?.id) return { data: [], total: 0 };
      
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
        academic_year_id: selectedAcademicYear.id.toString()
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      if (filterGrade) {
        params.append('grade_id', filterGrade);
      }
      if (filterCategory) {
        params.append('category_id', filterCategory);
      }
      
      const response = await apiService.get(`/api/admin/fee_structures?${params}`);
      console.log('Fee structures API response:', response.data);
      if (response.data?.data?.length > 0) {
        console.log('First structure sample:', response.data.data[0]);
        
        // Check for missing categories and debug if needed
        const missingCategories = response.data.data.filter(s => !s.category_name && !s.category_display_name);
        if (missingCategories.length > 0) {
          console.warn(`Found ${missingCategories.length} structures with missing categories:`, missingCategories);
          
          // Call debug endpoint
          try {
            const debugResponse = await apiService.get('/api/admin/debug_fee_structures');
            console.log('Debug info:', debugResponse.data);
          } catch (debugError) {
            console.log('Debug endpoint failed:', debugError);
          }
        }
      }
      return response.data;
    }
  });

  const structures = structuresResponse?.data || [];
  const totalItems = structuresResponse?.total || 0;

  // Create structure mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Creating fee structure with data:', data);
      const response = await apiService.post('/api/admin/fee_structures', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fee_structures']);
      toast.success('Fee structure created successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create fee structure');
    }
  });

  // Update structure mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiService.put(`/api/admin/fee_structures/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fee_structures']);
      toast.success('Fee structure updated successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update fee structure');
    }
  });

  // Delete structure mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, force = false }) => {
      const url = `/api/admin/fee_structures/${id}${force ? '?force=true' : ''}`;
      const response = await apiService.delete(url);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['fee_structures']);
      toast.success(response.data?.message || 'Fee structure deleted successfully!');
    },
    onError: (error) => {
      // Handle specific error cases
      const errorData = error.response?.data;
      
      if (errorData?.data?.can_force_delete) {
        // Show force delete option
        const count = errorData.data.assignment_count;
        const message = `This fee structure has ${count} active student assignment${count > 1 ? 's' : ''}.\n\nDo you want to force delete it? This will:\n• Delete the fee structure\n• Cancel all ${count} active assignment${count > 1 ? 's' : ''}\n• This action cannot be undone`;
        
        if (window.confirm(message)) {
          // Extract ID from the error and retry with force
          const urlParts = error.config.url.split('/');
          const id = urlParts[urlParts.length - 1].split('?')[0];
          deleteMutation.mutate({ id, force: true });
        }
      } else {
        toast.error(errorData?.message || 'Failed to delete fee structure');
      }
    }
  });

  const handleShowModal = (structure = null) => {
    if (structure) {
      setEditingStructure(structure);
      // Convert is_mandatory to boolean - backend returns "0" or "1" as strings
      const isMandatory = structure.is_mandatory === "1" || structure.is_mandatory === 1;
      
      setFormData({
        fee_category_id: structure.fee_category_id || '',
        grade_id: structure.grade_id || '',
        amount: structure.amount || '',
        is_mandatory: isMandatory,
        due_date: structure.due_date || '',
        late_fee_amount: structure.late_fee_amount || '',
        late_fee_days: structure.late_fee_days || '',
        description: structure.description || '',
        item_size: structure.item_size || '',
        semester: ''  // Always default to both semesters
      });
      
      // Reset selections first
      setSelectedCategories([]);
      setSelectedGrades([]);
      
      // Set selected category for typeahead (will be set by useEffect if data is not loaded yet)
      if (structure.fee_category_id && categoriesData?.data) {
        const category = categoriesData.data.find(cat => cat.id == structure.fee_category_id);
        if (category) {
          setSelectedCategories([category]);
        }
      }
      
      // Set selected grade for typeahead (will be set by useEffect if data is not loaded yet)
      if (structure.grade_id && gradesData?.data) {
        const grade = gradesData.data.find(g => g.id == structure.grade_id);
        if (grade) {
          setSelectedGrades([grade]);
        }
      }
      
      // Remove division selection logic - no longer needed
    } else {
      setEditingStructure(null);
      setFormData({
        fee_category_id: '',
        grade_id: '',
        amount: '',
        is_mandatory: false,
        due_date: '',
        late_fee_amount: '',
        late_fee_days: '',
        description: '',
        item_size: '',
        semester: ''  // Both semesters by default
      });
      setSelectedCategories([]);
      setSelectedGrades([]);
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStructure(null);
    setFormData({
      fee_category_id: '',
      grade_id: '',
      amount: '',
      due_date: '',
      late_fee_amount: '',
      late_fee_days: '',
      description: '',
      item_size: '',
      semester: ''  // Both semesters by default
    });
    setSelectedCategories([]);
    setSelectedGrades([]);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Remove division clearing logic - no longer needed
    
    // Clear item-specific fields when category changes
    if (name === 'fee_category_id') {
      setFormData(prev => ({ ...prev, item_size: '' }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle category selection
  const handleCategoryChange = (selected) => {
    setSelectedCategories(selected);
    const categoryId = selected.length > 0 ? selected[0].id : '';
    setFormData(prev => ({ ...prev, fee_category_id: categoryId }));
    
    // Clear item-specific fields when category changes
    setFormData(prev => ({ ...prev, item_size: '' }));
    
    if (errors.fee_category_id) {
      setErrors(prev => ({ ...prev, fee_category_id: '' }));
    }
  };

  // Handle grade selection
  const handleGradeChange = (selected) => {
    setSelectedGrades(selected);
    const gradeId = selected.length > 0 ? selected[0].id : '';
    setFormData(prev => ({ ...prev, grade_id: gradeId }));
    
    if (errors.grade_id) {
      setErrors(prev => ({ ...prev, grade_id: '' }));
    }
  };

  // Helper function to get selected category name
  const getSelectedCategoryName = () => {
    if (selectedCategories.length > 0) {
      return selectedCategories[0].name;
    }
    const category = categoriesData?.data?.find(cat => cat.id == formData.fee_category_id);
    return category?.name || '';
  };

  // Helper functions to determine which fields to show
  const shouldShowSizeField = () => {
    const categoryName = getSelectedCategoryName().toLowerCase();
    return categoryName.includes('shoes') || categoryName.includes('uniform');
  };

  const getSizeOptions = () => {
    const categoryName = getSelectedCategoryName().toLowerCase();
    if (categoryName.includes('shoes')) {
      return [
        { value: '5', label: 'Size 5' },
        { value: '6', label: 'Size 6' },
        { value: '7', label: 'Size 7' },
        { value: '8', label: 'Size 8' },
        { value: '9', label: 'Size 9' },
        { value: '10', label: 'Size 10' },
        { value: '11', label: 'Size 11' },
        { value: '12', label: 'Size 12' }
      ];
    } else if (categoryName.includes('uniform')) {
      return [
        { value: 'XS', label: 'Extra Small (XS)' },
        { value: 'S', label: 'Small (S)' },
        { value: 'M', label: 'Medium (M)' },
        { value: 'L', label: 'Large (L)' },
        { value: 'XL', label: 'Extra Large (XL)' },
        { value: 'XXL', label: 'Double Extra Large (XXL)' }
      ];
    }
    return [];
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fee_category_id) {
      newErrors.fee_category_id = 'Fee category is required';
    }
    if (!formData.grade_id) {
      newErrors.grade_id = 'Grade is required';
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    // Due date is now optional
    if (formData.late_fee_amount && formData.late_fee_amount < 0) {
      newErrors.late_fee_amount = 'Late fee amount cannot be negative';
    }
    if (formData.late_fee_days && formData.late_fee_days < 1) {
      newErrors.late_fee_days = 'Late fee days must be at least 1';
    }
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Prepare form data for submission as JSON object
    const submitData = {
      ...formData,
      academic_year_id: selectedAcademicYear.id,
      is_mandatory: formData.is_mandatory ? 1 : 0,
      // grade_id is now mandatory - keep its value as is
      // Convert empty strings to null only for optional fields
      late_fee_amount: formData.late_fee_amount || null,
      late_fee_days: formData.late_fee_days || null,
      semester: formData.semester || null,  // Include semester field
      division_id: null  // Always set division_id to null since we're removing it
    };
    
    
    console.log('Submitting data:', submitData);

    if (editingStructure) {
      updateMutation.mutate({ id: editingStructure.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (structure) => {
    if (window.confirm(`Are you sure you want to delete the fee structure "${structure.category_display_name}"?\n\nThis action cannot be undone.`)) {
      deleteMutation.mutate({ id: structure.id, force: false });
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
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
        Failed to load fee structures. Please try again.
      </Alert>
    );
  }

  if (!selectedAcademicYear) {
    return (
      <Alert variant="warning">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Please select an academic year to manage fee structures.
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">
            <i className="bi bi-currency-rupee me-2"></i>
            Fee Structures Management
          </h4>
          <small className="text-muted">
            <i className="bi bi-calendar-range me-1"></i>
            {getFormattedAcademicYear()}
          </small>
        </div>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <i className="bi bi-plus-circle me-2"></i>
          Add New Structure
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
                  placeholder="Search by category or grade..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
              >
                <option value="">All Grades</option>
                {gradesData?.data?.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categoriesData?.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2} className="text-end">
              <small className="text-muted">
                {totalItems} total structures
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {structures && structures.length > 0 ? (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Category</th>
                  <th>Grade</th>
                  <th>Amount</th>
                  <th>Mandatory (Yes/No)</th>
                  <th>Due Date</th>
                  <th>Late Fee</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {structures.map((structure) => (
                  <tr key={structure.id}>
                    <td>
                      <div className="fw-medium d-flex align-items-center">
                        <i className="bi bi-tag-fill me-2 text-primary"></i>
                        {structure.category_display_name || structure.category_name || structure.fee_category_name || 'Unknown Category'}
                      </div>
                      {structure.item_size && (
                        <small className="text-muted">
                          <i className="bi bi-rulers me-1"></i>Size: {structure.item_size}
                        </small>
                      )}
                    </td>
                    <td>
                      <div>
                        {structure.grade_name ? (
                          <div className="fw-medium">{structure.grade_name}</div>
                        ) : (
                          <span className="text-muted fst-italic">All Grades</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="fw-medium text-success">
                        {formatCurrency(structure.amount)}
                      </div>
                    </td>
                    <td>
                      <Badge 
                        bg={(structure.is_mandatory === "1" || structure.is_mandatory === 1) ? 'success' : 'secondary'} 
                        className="py-1"
                      >
                        {(structure.is_mandatory === "1" || structure.is_mandatory === 1) ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td>
                      <small className="text-muted">
                        {structure.due_date ? new Date(structure.due_date).toLocaleDateString() : 'No due date'}
                      </small>
                    </td>
                    <td>
                      {structure.late_fee_amount ? (
                        <div>
                          <div className="fw-medium text-warning">
                            {formatCurrency(structure.late_fee_amount)}
                          </div>
                          <small className="text-muted">
                            after {structure.late_fee_days} days
                          </small>
                        </div>
                      ) : (
                        <span className="text-muted">No late fee</span>
                      )}
                    </td>
                    <td>
                      <Badge bg="success">Active</Badge>
                    </td>
                    <td className="text-center">
                      <div className="btn-group btn-group-sm">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleShowModal(structure)}
                          title="Edit Structure"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(structure)}
                          title="Delete Structure"
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
              <i className="bi bi-currency-rupee display-1 text-muted mb-4"></i>
              <h5>No Fee Structures Found</h5>
              <p className="text-muted mb-4">
                {searchTerm || filterGrade || filterCategory
                  ? 'No structures match your search criteria.'
                  : 'Start by creating your first fee structure.'
                }
              </p>
              <Button variant="primary" onClick={() => handleShowModal()}>
                <i className="bi bi-plus-circle me-2"></i>
                Add First Structure
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

      {/* Add/Edit Structure Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-structure text-white border-0" closeButton>
            <Modal.Title className="d-flex align-items-center fs-4">
              <div className="modal-icon-wrapper me-3">
                <i className="bi bi-currency-rupee fs-3"></i>
              </div>
              <div>
                <h5 className="mb-0">{editingStructure ? 'Edit Fee Structure' : 'Add New Fee Structure'}</h5>
                <small className="opacity-75">
                  {editingStructure ? 'Update structure information' : 'Create a new fee structure for collecting fees'}
                </small>
              </div>
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className="p-4">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <Form.Group>
                    <Form.Label className="text-muted mb-2">
                      <i className="bi bi-tag me-2"></i>Fee Category *
                    </Form.Label>
                    <Typeahead
                      id="category-typeahead"
                      labelKey="name"
                      options={categoriesData?.data || []}
                      placeholder={categoriesLoading ? 'Loading categories...' : 
                                 categoriesError ? 'Error loading categories - trying again...' : 
                                 !categoriesData?.data?.length ? 'No categories available' :
                                 'Search and select a category...'}
                      selected={selectedCategories}
                      onChange={handleCategoryChange}
                      disabled={categoriesLoading}
                      className={errors.fee_category_id ? 'is-invalid' : ''}
                      emptyLabel={!categoriesData?.data?.length ? 'No categories available' : 'No matches found'}
                      filterBy={['name', 'description']}
                      highlightOnlyResult
                      selectHintOnEnter
                      renderMenuItemChildren={(option) => (
                        <div>
                          <strong>{option.name}</strong>
                          {option.description && (
                            <div><small className="text-muted">{option.description}</small></div>
                          )}
                        </div>
                      )}
                    />
                    {errors.fee_category_id && (
                      <div className="invalid-feedback d-block">
                        {errors.fee_category_id}
                      </div>
                    )}
                    <Form.Text className="text-muted">
                      {categoriesLoading ? (
                        <>
                          <i className="bi bi-arrow-clockwise spin me-1"></i>
                          Loading categories...
                        </>
                      ) : categoriesError ? (
                        <>
                          <i className="bi bi-exclamation-triangle text-warning me-1"></i>
                          Error loading categories - using fallback
                        </>
                      ) : categoriesData?.data?.length > 0 ? (
                        <>
                          <i className="bi bi-check-circle text-success me-1"></i>
                          {categoriesData.data.length} categories available
                        </>
                      ) : (
                        <>
                          <i className="bi bi-info-circle text-info me-1"></i>
                          Default categories will be created automatically
                        </>
                      )}
                    </Form.Text>
                  </Form.Group>
                </div>

                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="Amount"
                      isInvalid={!!errors.amount}
                      className="form-control-lg"
                      id="amount"
                    />
                    <label htmlFor="amount" className="text-muted">
                      <i className="bi bi-currency-rupee me-2"></i>Amount *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.amount}
                    </Form.Control.Feedback>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <Form.Group>
                    <Form.Label className="text-muted mb-2">
                      <i className="bi bi-mortarboard me-2"></i>Grade *
                    </Form.Label>
                    <Typeahead
                      id="grade-typeahead"
                      labelKey="name"
                      options={gradesData?.data || []}
                      placeholder={gradesData ? "Search and select a grade..." : "Loading grades..."}
                      selected={selectedGrades}
                      onChange={handleGradeChange}
                      disabled={!gradesData?.data?.length}
                      className={errors.grade_id ? 'is-invalid' : ''}
                      emptyLabel={gradesData?.data?.length === 0 ? 'No grades available' : 'No matches found'}
                      filterBy={['name']}
                      highlightOnlyResult
                      selectHintOnEnter
                      clearButton
                      renderMenuItemChildren={(option) => (
                        <div>
                          <strong>{option.name}</strong>
                          {option.description && (
                            <div><small className="text-muted">{option.description}</small></div>
                          )}
                        </div>
                      )}
                    />
                    {errors.grade_id && (
                      <div className="invalid-feedback d-block">
                        {errors.grade_id}
                      </div>
                    )}
                    <Form.Text className="text-muted">
                      Select the specific grade for this fee structure
                    </Form.Text>
                  </Form.Group>
                </div>

                {/* Division field removed - fee structures now apply to entire grade */}

                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center h-100">
                    <Form.Check
                      type="checkbox"
                      name="is_mandatory"
                      id="is_mandatory"
                      checked={formData.is_mandatory}
                      onChange={handleInputChange}
                      label={
                        <span className="ms-2">
                          <i className="bi bi-asterisk text-success me-2"></i>
                          <strong>Mandatory Fee</strong>
                          <small className="text-muted d-block">
                            Will be applied to both semesters
                          </small>
                        </span>
                      }
                      className="form-check-lg"
                    />
                  </div>
                </div>


                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleInputChange}
                      isInvalid={!!errors.due_date}
                      className="form-control-lg"
                      id="dueDate"
                    />
                    <label htmlFor="dueDate" className="text-muted">
                      <i className="bi bi-calendar-event me-2"></i>Due Date (Optional)
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.due_date}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Leave empty if no specific due date is required
                    </Form.Text>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      name="late_fee_amount"
                      value={formData.late_fee_amount}
                      onChange={handleInputChange}
                      placeholder="Late Fee Amount (Optional)"
                      isInvalid={!!errors.late_fee_amount}
                      className="form-control-lg"
                      id="lateFeeAmount"
                    />
                    <label htmlFor="lateFeeAmount" className="text-muted">
                      <i className="bi bi-exclamation-triangle me-2"></i>Late Fee Amount (Optional)
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.late_fee_amount}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Additional fee charged after the due date passes
                    </Form.Text>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="number"
                      min="1"
                      name="late_fee_days"
                      value={formData.late_fee_days}
                      onChange={handleInputChange}
                      placeholder="Late Fee Days (Optional)"
                      isInvalid={!!errors.late_fee_days}
                      className="form-control-lg"
                      id="lateFeeDays"
                    />
                    <label htmlFor="lateFeeDays" className="text-muted">
                      <i className="bi bi-clock me-2"></i>Late Fee Days (Optional)
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.late_fee_days}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Number of days after due date when late fee applies
                    </Form.Text>
                  </div>
                </div>

                {/* Dynamic Fields Based on Category */}
                {shouldShowSizeField() && (
                  <div className="col-md-6 mb-3">
                    <div className="form-floating">
                      <Form.Select
                        name="item_size"
                        value={formData.item_size}
                        onChange={handleInputChange}
                        className="form-control-lg"
                        id="itemSize"
                        isInvalid={!!errors.item_size}
                      >
                        <option value="">Select Size</option>
                        {getSizeOptions().map((size) => (
                          <option key={size.value} value={size.value}>
                            {size.label}
                          </option>
                        ))}
                      </Form.Select>
                      <label htmlFor="itemSize" className="text-muted">
                        <i className="bi bi-rulers me-2"></i>
                        {getSelectedCategoryName().toLowerCase().includes('shoes') ? 'Shoe Size' : 'Uniform Size'}
                      </label>
                      <Form.Control.Feedback type="invalid">
                        {errors.item_size}
                      </Form.Control.Feedback>
                    </div>
                  </div>
                )}

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
                      id="description"
                    />
                    <label htmlFor="description" className="text-muted">
                      <i className="bi bi-text-paragraph me-2"></i>Description (Optional)
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.description}
                    </Form.Control.Feedback>
                  </div>
                  <div className="form-text text-muted mt-2 d-flex justify-content-between">
                    <span>
                      <i className="bi bi-lightbulb me-1"></i>
                      Additional details about this fee structure
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
                    <span>{editingStructure ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <i className={`bi ${editingStructure ? 'bi-arrow-repeat' : 'bi-plus-circle'} me-2`}></i>
                    <span>{editingStructure ? 'Update Structure' : 'Create Structure'}</span>
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </div>

        <style jsx>{`
          .bg-gradient-structure {
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
          .form-floating > .form-control:not(:placeholder-shown) ~ label {
            transform: scale(0.85) translateY(-0.5rem) translateX(0.15rem);
            color: #28a745 !important;
          }
          .form-control:focus {
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
          .spin {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </Modal>
    </div>
  );
};

export default FeeStructuresManagement;