import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup, Tab, Tabs } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import ReceiptModal from '../../components/common/ReceiptModal';
import { useAcademicYear } from '../../contexts/AcademicYearContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const FeeCollectionManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedAcademicYear, getFormattedAcademicYear } = useAcademicYear();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('collect');
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [collectionData, setCollectionData] = useState({
    amount: '',
    payment_method: 'cash',
    reference_number: '',
    remarks: ''
  });
  const [errors, setErrors] = useState({});

  // Receipt modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Search and pagination for collections
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    start_date: '',
    end_date: ''
  });
  const [collectionFilters, setCollectionFilters] = useState({
    staff_id: '',
    payment_method: '',
    category_id: ''
  });

  // Student search states
  const [studentSearch, setStudentSearch] = useState('');
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState('');

  // Category search states for filters
  const [collectionCategorySearch, setCollectionCategorySearch] = useState('');
  const [structureCategorySearch, setStructureCategorySearch] = useState('');
  const [showCollectionCategoryDropdown, setShowCollectionCategoryDropdown] = useState(false);
  const [showStructureCategoryDropdown, setShowStructureCategoryDropdown] = useState(false);
  const [filteredCollectionCategories, setFilteredCollectionCategories] = useState([]);
  const [filteredStructureCategories, setFilteredStructureCategories] = useState([]);

  // Direct payment states
  const [isDirectPayment, setIsDirectPayment] = useState(false);
  const [directPaymentData, setDirectPaymentData] = useState({
    category_id: '',
    category_name: '',
    amount: '',
    due_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Fee category search states
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState([]);

  const searchInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Handle navigation state for pre-selected student
  useEffect(() => {
    if (location.state?.preSelectedStudent && location.state?.openCollectModal) {
      setSelectedStudent(location.state.preSelectedStudent);
      setShowCollectModal(true);
      // Clear navigation state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Debounce search terms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setDebouncedStudentSearch(studentSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, studentSearch]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, dateFilter, collectionFilters]);


  // Student search for fee collection
  const { data: studentsResponse, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['students_search', debouncedStudentSearch, selectedAcademicYear?.id],
    queryFn: async () => {
      if (!selectedAcademicYear?.id || !debouncedStudentSearch) return { data: [] };
      
      const params = new URLSearchParams({
        search: debouncedStudentSearch,
        limit: '10',
        offset: '0'
      });
      
      try {
        const response = await apiService.get(`/api/admin/students?${params}`);
        return response.data;
      } catch (error) {
        if (error.response?.status === 403) {
          toast.error('Insufficient permissions to search student data');
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Failed to search students. Please try again.');
        }
        throw error;
      }
    },
    enabled: !!debouncedStudentSearch && debouncedStudentSearch.length >= 2
  });

  // Get student fee assignments when student is selected
  const { data: studentFeesResponse, isLoading: feesLoading } = useQuery({
    queryKey: ['student_fees', selectedStudent?.id, selectedAcademicYear?.id],
    queryFn: async () => {
      if (!selectedStudent?.id || !selectedAcademicYear?.id) return { data: [] };
      
      const response = await apiService.get(`/api/admin/student_fee_assignments/${selectedStudent.id}?academic_year_id=${selectedAcademicYear.id}`);
      return response.data;
    },
    enabled: !!selectedStudent?.id && !!selectedAcademicYear?.id
  });

  // Fee collections with pagination
  const { data: collectionsResponse, isLoading: collectionsLoading, error } = useQuery({
    queryKey: ['fee_collections', currentPage, itemsPerPage, debouncedSearchTerm, dateFilter, collectionFilters],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString()
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      if (dateFilter.start_date) {
        params.append('start_date', dateFilter.start_date);
      }
      if (dateFilter.end_date) {
        params.append('end_date', dateFilter.end_date);
      }
      if (collectionFilters.staff_id) {
        params.append('staff_id', collectionFilters.staff_id);
      }
      if (collectionFilters.payment_method) {
        params.append('payment_method', collectionFilters.payment_method);
      }
      if (collectionFilters.category_id) {
        params.append('category_id', collectionFilters.category_id);
      }
      
      const response = await apiService.get(`/api/admin/fee_collections?${params}`);
      return response.data;
    },
    enabled: activeTab === 'history'
  });

  // Fee structures with pagination for mandatory fees display
  const [structureSearchTerm, setStructureSearchTerm] = useState('');
  const [debouncedStructureSearch, setDebouncedStructureSearch] = useState('');
  const [structureFilters, setStructureFilters] = useState({
    grade_id: '',
    category_id: ''
  });

  // Debounce structure search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStructureSearch(structureSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [structureSearchTerm]);

  const { data: structuresResponse, isLoading: structuresLoading, error: structuresError } = useQuery({
    queryKey: ['fee_structures', currentPage, itemsPerPage, debouncedStructureSearch, structureFilters, selectedAcademicYear?.id],
    queryFn: async () => {
      if (!selectedAcademicYear?.id) return { data: [], total: 0 };
      
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
        academic_year_id: selectedAcademicYear.id.toString(),
        is_mandatory: '1' // Only show mandatory fee structures
      });
      
      if (debouncedStructureSearch) {
        params.append('search', debouncedStructureSearch);
      }
      if (structureFilters.grade_id) {
        params.append('grade_id', structureFilters.grade_id);
      }
      if (structureFilters.category_id) {
        params.append('category_id', structureFilters.category_id);
      }
      
      const response = await apiService.get(`/api/admin/fee_structures?${params}`);
      return response.data;
    },
    enabled: activeTab === 'structures' && !!selectedAcademicYear?.id
  });

  // Grades dropdown for structures filter
  const { data: gradesResponse } = useQuery({
    queryKey: ['grades_dropdown'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/grades_dropdown');
      return response.data;
    }
  });

  const collections = collectionsResponse?.data || [];
  const totalItems = collectionsResponse?.total || 0;

  const structures = structuresResponse?.data || [];
  const structuresTotalItems = structuresResponse?.total || 0;
  const grades = gradesResponse?.data || [];

  // Debug logging
  console.log('Collections data:', collections?.slice(0, 2));

  // Staff list for filter dropdown
  const { data: staffResponse } = useQuery({
    queryKey: ['staff_list'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/staff');
      return response.data;
    }
  });
  const staffList = staffResponse?.data || [];

  // Fee categories for direct payment
  const { data: categoriesResponse, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['fee_categories_dropdown'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/api/admin/fee_categories/dropdown');
        
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
      } catch (error) {
        console.error('Failed to load categories:', error);
        return { data: [] };
      }
    }
  });
  const categories = categoriesResponse?.data || [];

  // Filter categories based on search
  useEffect(() => {
    if (categories && categories.length > 0) {
      if (categorySearch.trim()) {
        const filtered = categories.filter(category => 
          category.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
          (category.description && category.description.toLowerCase().includes(categorySearch.toLowerCase()))
        );
        setFilteredCategories(filtered);
      } else {
        setFilteredCategories(categories);
      }
    } else {
      setFilteredCategories([]);
    }
  }, [categories, categorySearch]);

  // Filter categories for collection filters
  useEffect(() => {
    if (categories && categories.length > 0) {
      if (collectionCategorySearch.trim()) {
        const filtered = categories.filter(category => 
          category.name.toLowerCase().includes(collectionCategorySearch.toLowerCase()) ||
          (category.description && category.description.toLowerCase().includes(collectionCategorySearch.toLowerCase()))
        );
        setFilteredCollectionCategories(filtered);
      } else {
        setFilteredCollectionCategories(categories);
      }
    } else {
      setFilteredCollectionCategories([]);
    }
  }, [categories, collectionCategorySearch]);

  // Filter categories for structure filters
  useEffect(() => {
    if (categories && categories.length > 0) {
      if (structureCategorySearch.trim()) {
        const filtered = categories.filter(category => 
          category.name.toLowerCase().includes(structureCategorySearch.toLowerCase()) ||
          (category.description && category.description.toLowerCase().includes(structureCategorySearch.toLowerCase()))
        );
        setFilteredStructureCategories(filtered);
      } else {
        setFilteredStructureCategories(categories);
      }
    } else {
      setFilteredStructureCategories([]);
    }
  }, [categories, structureCategorySearch]);

  // Fee amount by category query
  const { data: feeAmountResponse, refetch: fetchFeeAmount } = useQuery({
    queryKey: ['fee_category_amount', directPaymentData.category_id],
    queryFn: async () => {
      if (!directPaymentData.category_id) return null;
      const response = await apiService.get(`/api/admin/fee_category_amount/${directPaymentData.category_id}`);
      return response.data;
    },
    enabled: false // Only fetch when manually triggered
  });

  // Fee collection mutation
  const collectFeeMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiService.post('/api/admin/fee_collections', {
        ...data,
        collected_by_staff_id: user.id
      });
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['fee_collections']);
      queryClient.invalidateQueries(['student_fees']);
      toast.success('Fee collected successfully!');
      setShowCollectModal(false);
      resetCollectionForm();
      
      // Show receipt option
      if (response.data?.receipt_number) {
        toast.success(`Receipt ${response.data.receipt_number} generated`, {
          duration: 5000
        });
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to collect fee');
    }
  });

  // Verification mutation
  const verifyCollectionMutation = useMutation({
    mutationFn: async (collectionId) => {
      const response = await apiService.post(`/api/admin/fee_collections/${collectionId}/verify`, {
        admin_id: user.id
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fee_collections']);
      toast.success('Collection verified successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to verify collection');
    }
  });


  // Get receipt details
  const handleViewReceipt = async (collectionId) => {
    try {
      console.log('Fetching receipt for collection ID:', collectionId);
      const response = await apiService.get(`/api/admin/fee_collections/${collectionId}`);
      console.log('Receipt API response:', response);
      
      // Handle the response structure correctly based on API format
      let receiptData;
      if (response.data && response.data.data) {
        // If response has nested data structure
        receiptData = response.data.data;
      } else if (response.data) {
        // If response data is at the root level
        receiptData = response.data;
      } else {
        throw new Error('Invalid response format');
      }
      
      console.log('Processed receipt data:', receiptData);
      
      // Validate required fields
      if (!receiptData.receipt_number) {
        throw new Error('Receipt number is missing');
      }
      
      setSelectedReceipt(receiptData);
      setShowReceiptModal(true);
    } catch (error) {
      console.error('Receipt error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      toast.error(`Failed to load receipt details: ${errorMessage}`);
    }
  };

  const resetCollectionForm = () => {
    setCollectionData({
      amount: '',
      payment_method: 'cash',
      reference_number: '',
      remarks: ''
    });
    setSelectedStudent(null);
    setSelectedAssignment(null);
    setStudentSearch('');
    setCategorySearch('');
    setShowCategoryDropdown(false);
    setErrors({});
    setIsDirectPayment(false);
    setDirectPaymentData({
      category_id: '',
      category_name: '',
      amount: '',
      due_date: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setStudentSearch(`${student.student_name} (${student.roll_number})`);
  };

  const handleAssignmentSelect = (assignment) => {
    setSelectedAssignment(assignment);
    const maxAmount = assignment.pending_amount;
    setCollectionData(prev => ({
      ...prev,
      amount: maxAmount.toString()
    }));
  };

  const handleCollectionSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (!selectedStudent) {
      newErrors.student = 'Please select a student';
    }
    
    if (isDirectPayment) {
      // Validation for direct payment
      if (!directPaymentData.category_id) {
        newErrors.category = 'Please select a fee category';
      }
      if (!directPaymentData.amount || parseFloat(directPaymentData.amount) <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      }
    } else {
      // Validation for assigned fee payment
      if (!selectedAssignment) {
        newErrors.assignment = 'Please select a fee to collect';
      }
      if (selectedAssignment && parseFloat(collectionData.amount) > selectedAssignment.pending_amount) {
        newErrors.amount = 'Amount cannot exceed pending amount';
      }
    }
    
    if (!collectionData.amount || parseFloat(collectionData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!collectionData.payment_method) {
      newErrors.payment_method = 'Payment method is required';
    }
    if (['card', 'online', 'cheque', 'dd'].includes(collectionData.payment_method) && !collectionData.reference_number) {
      newErrors.reference_number = 'Reference number is required for this payment method';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const paymentData = {
      student_id: selectedStudent.id,
      amount: parseFloat(collectionData.amount),
      payment_method: collectionData.payment_method,
      reference_number: collectionData.reference_number || null,
      remarks: collectionData.remarks || null
    };

    if (isDirectPayment) {
      // For direct payments, we need to create a fee assignment first or use a different API
      paymentData.fee_category_id = directPaymentData.category_id;
      paymentData.direct_fee_due_date = directPaymentData.due_date;
      paymentData.direct_fee_description = directPaymentData.description || `Direct payment for ${directPaymentData.category_name}`;
      paymentData.is_direct_payment = 1;
    } else {
      paymentData.student_fee_assignment_id = selectedAssignment.id;
    }
    
    collectFeeMutation.mutate(paymentData);
  };

  const handleInputChange = (name, value) => {
    setCollectionData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Direct payment handlers
  const handleCreateDirectPayment = () => {
    setIsDirectPayment(true);
    setSelectedAssignment(null);
    setDirectPaymentData({
      category_id: '',
      category_name: '',
      amount: '',
      due_date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setCollectionData(prev => ({
      ...prev,
      amount: ''
    }));
  };

  const handleDirectPaymentChange = async (name, value) => {
    setDirectPaymentData(prev => ({ ...prev, [name]: value }));
    if (name === 'category_id') {
      const category = categories?.find(cat => cat.id === value);
      if (category) {
        setDirectPaymentData(prev => ({ ...prev, category_name: category.name }));
        
        // Fetch the predefined amount for this category
        try {
          const response = await apiService.get(`/api/admin/fee_category_amount/${value}`);
          if (response.data?.amount) {
            const amount = response.data.amount.toString();
            setDirectPaymentData(prev => ({ ...prev, amount }));
            setCollectionData(prev => ({ ...prev, amount }));
            toast.success(`Amount auto-filled: ₹${response.data.amount}`);
          } else {
            toast('No predefined amount found. Please enter amount manually.', { icon: 'ℹ️' });
          }
        } catch (error) {
          console.warn('Failed to fetch fee amount:', error);
          toast('Please enter the amount manually.', { icon: 'ℹ️' });
        }
      }
    }
    if (name === 'amount') {
      setCollectionData(prev => ({ ...prev, amount: value }));
    }
  };

  const handleCancelDirectPayment = () => {
    setIsDirectPayment(false);
    setCategorySearch('');
    setShowCategoryDropdown(false);
    setDirectPaymentData({
      category_id: '',
      category_name: '',
      amount: '',
      due_date: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  // Fee category search handlers
  const handleCategorySelect = (category) => {
    setCategorySearch(category.name);
    setShowCategoryDropdown(false);
    handleDirectPaymentChange('category_id', category.id);
  };

  const handleCategorySearchChange = (value) => {
    setCategorySearch(value);
    setShowCategoryDropdown(true);
    if (!value) {
      setDirectPaymentData(prev => ({ ...prev, category_id: '', category_name: '' }));
    }
  };

  const handleCategorySearchFocus = () => {
    setShowCategoryDropdown(true);
  };

  const handleCategorySearchBlur = (e) => {
    // Delay hiding dropdown to allow for item selection
    setTimeout(() => {
      setShowCategoryDropdown(false);
    }, 200);
  };

  // Collection filter category search handlers
  const handleCollectionCategorySelect = (category) => {
    setCollectionCategorySearch(category.name);
    setShowCollectionCategoryDropdown(false);
    setCollectionFilters(prev => ({ ...prev, category_id: category.id }));
  };

  const handleCollectionCategorySearchChange = (value) => {
    setCollectionCategorySearch(value);
    setShowCollectionCategoryDropdown(true);
    if (!value) {
      setCollectionFilters(prev => ({ ...prev, category_id: '' }));
    }
  };

  // Structure filter category search handlers
  const handleStructureCategorySelect = (category) => {
    setStructureCategorySearch(category.name);
    setShowStructureCategoryDropdown(false);
    setStructureFilters(prev => ({ ...prev, category_id: category.id }));
  };

  const handleStructureCategorySearchChange = (value) => {
    setStructureCategorySearch(value);
    setShowStructureCategoryDropdown(true);
    if (!value) {
      setStructureFilters(prev => ({ ...prev, category_id: '' }));
    }
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const handleExportToExcel = () => {
    if (!collections || collections.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Prepare data for Excel export
    const excelData = collections.map((collection) => ({
      'Receipt Number': collection.receipt_number,
      'Student Name': collection.student_name,
      'Roll Number': collection.roll_number,
      'Grade': collection.grade_name,
      'Division': collection.division_name,
      'Category': collection.category_name || 'Direct Payment',
      'Amount': collection.amount,
      'Payment Method': collection.payment_method?.toUpperCase(),
      'Collected By': collection.collected_by_staff_name || 'Unknown',
      'Collection Date': new Date(collection.collection_date).toLocaleDateString('en-IN'),
      'Status': collection.is_verified ? 'Verified' : 'Pending',
      'Remarks': collection.remarks || ''
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Receipt Number
      { wch: 20 }, // Student Name
      { wch: 12 }, // Roll Number
      { wch: 10 }, // Grade
      { wch: 8 },  // Division
      { wch: 20 }, // Category
      { wch: 12 }, // Amount
      { wch: 15 }, // Payment Method
      { wch: 20 }, // Collected By
      { wch: 12 }, // Collection Date
      { wch: 10 }, // Status
      { wch: 30 }  // Remarks
    ];
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fee Collections');

    // Generate filename with current date and filters
    const today = new Date().toISOString().split('T')[0];
    let filename = `Fee_Collections_${today}`;
    
    if (dateFilter.start_date || dateFilter.end_date) {
      filename += `_${dateFilter.start_date || 'start'}_to_${dateFilter.end_date || 'end'}`;
    }
    
    filename += '.xlsx';

    // Save file
    XLSX.writeFile(workbook, filename);
    
    toast.success(`Exported ${collections.length} records to Excel`);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'pending': 'warning',
      'partial': 'info', 
      'paid': 'success',
      'overdue': 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      'cash': 'bi-cash',
      'card': 'bi-credit-card',
      'online': 'bi-phone',
      'cheque': 'bi-journal-check',
      'dd': 'bi-bank'
    };
    return icons[method] || 'bi-currency-exchange';
  };

  if (!selectedAcademicYear) {
    return (
      <Alert variant="warning">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Please select an academic year to manage fee collections.
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">
            <i className="bi bi-receipt me-2"></i>
            Fee Collection Management
          </h4>
          <small className="text-muted">
            <i className="bi bi-calendar-range me-1"></i>
            {getFormattedAcademicYear()}
          </small>
        </div>
        <Button variant="primary" onClick={() => setShowCollectModal(true)}>
          <i className="bi bi-plus-circle me-2"></i>
          Collect Fee
        </Button>
      </div>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="collect" title="Collect Fees">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center py-5">
              <i className="bi bi-currency-rupee display-1 text-primary mb-4"></i>
              <h5>Ready to Collect Fees</h5>
              <p className="text-muted mb-4">
                Click "Collect Fee" to search for students and collect their pending fees.
              </p>
              <Button variant="primary" size="lg" onClick={() => setShowCollectModal(true)}>
                <i className="bi bi-plus-circle me-2"></i>
                Collect Fee
              </Button>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="structures" title="Mandatory Fees">
          {/* Search and Filters for Fee Structures */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row>
                <Col md={4}>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search fee structures..."
                      value={structureSearchTerm}
                      onChange={(e) => setStructureSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={structureFilters.grade_id}
                    onChange={(e) => setStructureFilters(prev => ({ ...prev, grade_id: e.target.value }))}
                  >
                    <option value="">All Grades</option>
                    {grades.map((grade) => (
                      <option key={grade.id} value={grade.id}>
                        {grade.name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <div className="position-relative">
                    <Form.Control
                      type="text"
                      placeholder="Search fee category..."
                      value={structureCategorySearch}
                      onChange={(e) => handleStructureCategorySearchChange(e.target.value)}
                      onFocus={() => setShowStructureCategoryDropdown(true)}
                      onBlur={() => setTimeout(() => setShowStructureCategoryDropdown(false), 200)}
                    />
                    {showStructureCategoryDropdown && !categoriesLoading && filteredStructureCategories.length > 0 && (
                      <div className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}>
                        <div
                          className="p-2 border-bottom cursor-pointer"
                          onClick={() => {
                            setStructureCategorySearch('');
                            setShowStructureCategoryDropdown(false);
                            setStructureFilters(prev => ({ ...prev, category_id: '' }));
                          }}
                          style={{ cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                        >
                          <i className="bi bi-x-circle me-2 text-muted"></i>
                          <em>All Categories</em>
                        </div>
                        {filteredStructureCategories.map((category) => (
                          <div
                            key={category.id}
                            className="p-2 border-bottom cursor-pointer d-flex align-items-center"
                            onClick={() => handleStructureCategorySelect(category)}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                          >
                            <i className="bi bi-tag me-2 text-muted"></i>
                            <div>
                              <div className="fw-medium">{category.name}</div>
                              {category.description && (
                                <small className="text-muted">{category.description}</small>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Col>
                <Col md={2} className="text-end">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setStructureSearchTerm('');
                      setStructureFilters({ grade_id: '', category_id: '' });
                      setStructureCategorySearch('');
                      setShowStructureCategoryDropdown(false);
                      setCurrentPage(1);
                    }}
                    title="Clear Filters"
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Clear
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              {structuresLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                </div>
              ) : structuresError ? (
                <Alert variant="danger">Failed to load fee structures</Alert>
              ) : structures.length > 0 ? (
                <>
                  <div className="row">
                    {structures.map((structure) => (
                      <div key={structure.id} className="col-md-6 col-lg-4 mb-4">
                        <Card className="h-100 border-danger shadow-sm">
                          <Card.Header className="bg-danger bg-opacity-10 border-danger">
                            <div className="d-flex justify-content-between align-items-center">
                              <Badge bg="danger" className="fw-bold">
                                <i className="bi bi-asterisk me-1" style={{fontSize: '8px'}}></i>
                                MANDATORY
                              </Badge>
                              <small className="text-muted">
                                ID: {structure.id}
                              </small>
                            </div>
                          </Card.Header>
                          <Card.Body className="d-flex flex-column">
                            <div className="flex-grow-1">
                              <h6 className="card-title text-danger fw-bold mb-2">
                                {structure.category_name || 'Unknown Category'}
                              </h6>
                              
                              {structure.description && (
                                <p className="card-text text-muted small mb-3">
                                  {structure.description}
                                </p>
                              )}
                              
                              <div className="row text-center mb-3">
                                <div className="col-6">
                                  <small className="text-muted d-block">Amount</small>
                                  <span className="fw-bold text-success fs-5">
                                    ₹{parseFloat(structure.amount || 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="col-6">
                                  <small className="text-muted d-block">Due Date</small>
                                  <span className="fw-medium">
                                    {structure.due_date ? 
                                      new Date(structure.due_date).toLocaleDateString() : 
                                      'Not set'
                                    }
                                  </span>
                                </div>
                              </div>

                              <div className="mb-3">
                                <small className="text-muted d-block mb-1">Applicable To:</small>
                                <div className="d-flex flex-wrap gap-1">
                                  {structure.grade_name ? (
                                    <Badge bg="secondary" pill>
                                      {structure.grade_name}
                                      {structure.division_name && ` - ${structure.division_name}`}
                                    </Badge>
                                  ) : (
                                    <Badge bg="info" pill>All Grades</Badge>
                                  )}
                                  
                                  {structure.semester ? (
                                    <Badge bg="warning" pill>{structure.semester}</Badge>
                                  ) : (
                                    <Badge bg="primary" pill>Both Semesters</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-auto">
                              {structure.academic_year_name && (
                                <small className="text-muted d-block mb-2">
                                  <i className="bi bi-calendar-range me-1"></i>
                                  {structure.academic_year_name}
                                </small>
                              )}
                              
                              <div className="d-flex justify-content-between align-items-center">
                                <Badge 
                                  bg={structure.is_active ? 'success' : 'danger'}
                                  pill
                                >
                                  {structure.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                
                                <Button 
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => {
                                    // Navigate to fee structures management for editing
                                    navigate('/admin/fee-structures');
                                  }}
                                >
                                  <i className="bi bi-pencil me-1"></i>
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    ))}
                  </div>

                  {structuresTotalItems > 0 && (
                    <div className="mt-4">
                      <Pagination
                        currentPage={currentPage}
                        totalItems={structuresTotalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(newSize) => {
                          setItemsPerPage(newSize);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-list-ul display-1 text-muted mb-4"></i>
                  <h5>No Mandatory Fee Structures Found</h5>
                  <p className="text-muted">No mandatory fee structures match your search criteria.</p>
                  <Button 
                    variant="primary" 
                    onClick={() => navigate('/admin/fee-structures')}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Create Fee Structure
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="history" title="Collection History">
          {/* Search and Filters */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row>
                <Col md={3}>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by student, receipt..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
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
                  <Form.Control
                    type="date"
                    value={dateFilter.end_date}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, end_date: e.target.value }))}
                    placeholder="End Date"
                  />
                </Col>
                <Col md={2}>
                  <Form.Select
                    value={collectionFilters.staff_id}
                    onChange={(e) => setCollectionFilters(prev => ({ ...prev, staff_id: e.target.value }))}
                  >
                    <option value="">All Staff</option>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Select
                    value={collectionFilters.payment_method}
                    onChange={(e) => setCollectionFilters(prev => ({ ...prev, payment_method: e.target.value }))}
                  >
                    <option value="">All Methods</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                    <option value="cheque">Cheque</option>
                    <option value="dd">DD</option>
                  </Form.Select>
                </Col>
                <Col md={1} className="text-end">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setDateFilter({ start_date: '', end_date: '' });
                      setCollectionFilters({ staff_id: '', payment_method: '', category_id: '' });
                      setCollectionCategorySearch('');
                      setShowCollectionCategoryDropdown(false);
                      setCurrentPage(1);
                    }}
                    title="Clear Filters"
                  >
                    <i className="bi bi-x-circle"></i>
                  </Button>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col md={3}>
                  <div className="position-relative">
                    <Form.Control
                      type="text"
                      placeholder="Search fee category..."
                      value={collectionCategorySearch}
                      onChange={(e) => handleCollectionCategorySearchChange(e.target.value)}
                      onFocus={() => setShowCollectionCategoryDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCollectionCategoryDropdown(false), 200)}
                    />
                    {showCollectionCategoryDropdown && !categoriesLoading && filteredCollectionCategories.length > 0 && (
                      <div className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}>
                        <div
                          className="p-2 border-bottom cursor-pointer"
                          onClick={() => {
                            setCollectionCategorySearch('');
                            setShowCollectionCategoryDropdown(false);
                            setCollectionFilters(prev => ({ ...prev, category_id: '' }));
                          }}
                          style={{ cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                        >
                          <i className="bi bi-x-circle me-2 text-muted"></i>
                          <em>All Categories</em>
                        </div>
                        {filteredCollectionCategories.map((category) => (
                          <div
                            key={category.id}
                            className="p-2 border-bottom cursor-pointer d-flex align-items-center"
                            onClick={() => handleCollectionCategorySelect(category)}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                          >
                            <i className="bi bi-tag me-2 text-muted"></i>
                            <div>
                              <div className="fw-medium">{category.name}</div>
                              {category.description && (
                                <small className="text-muted">{category.description}</small>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Col>
                <Col md={6}></Col>
                <Col md={3} className="text-end">
                  <div className="d-flex justify-content-end align-items-center gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={handleExportToExcel}
                      disabled={collections.length === 0}
                    >
                      <i className="bi bi-file-earmark-excel me-1"></i>
                      Export Excel
                    </Button>
                    <small className="text-muted">
                      {totalItems} collections
                    </small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              {collectionsLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                </div>
              ) : error ? (
                <Alert variant="danger">Failed to load collections</Alert>
              ) : collections.length > 0 ? (
                <>
                  <Table responsive hover>
                    <thead className="table-light">
                      <tr>
                        <th>Receipt</th>
                        <th>Student</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Payment Method</th>
                        <th>Collected By</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collections.map((collection) => (
                        <tr key={collection.id}>
                          <td>
                            <div className="fw-medium">
                              {collection.receipt_number}
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="fw-medium">{collection.student_name}</div>
                              <small className="text-muted">{collection.roll_number} - {collection.grade_name} {collection.division_name}</small>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {collection.category_name || 'Direct Payment'}
                            </span>
                          </td>
                          <td>
                            <div className="fw-medium text-success">
                              {formatCurrency(collection.amount)}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className={`${getPaymentMethodIcon(collection.payment_method)} me-2`}></i>
                              {collection.payment_method.toUpperCase()}
                              {collection.reference_number && (
                                <small className="text-muted ms-2">({collection.reference_number})</small>
                              )}
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="fw-medium">{collection.collected_by_staff_name || 'Unknown'}</div>
                              {collection.collected_by_staff_id && (
                                <small className="text-muted">ID: {collection.collected_by_staff_id}</small>
                              )}
                            </div>
                          </td>
                          <td>
                            <small>{new Date(collection.collection_date).toLocaleDateString()}</small>
                          </td>
                          <td>
                            {collection.is_verified ? (
                              <Badge bg="success">Verified</Badge>
                            ) : (
                              <Badge bg="warning">Pending</Badge>
                            )}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              {!collection.is_verified && user.role === 'admin' && (
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => verifyCollectionMutation.mutate(collection.id)}
                                  disabled={verifyCollectionMutation.isLoading}
                                  title="Verify Collection"
                                >
                                  <i className="bi bi-check-circle"></i>
                                </Button>
                              )}
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleViewReceipt(collection.id)}
                                title="View Receipt"
                              >
                                <i className="bi bi-receipt"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {totalItems > 0 && (
                    <div className="mt-4">
                      <Pagination
                        currentPage={currentPage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(newSize) => {
                          setItemsPerPage(newSize);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-receipt display-1 text-muted mb-4"></i>
                  <h5>No Collections Found</h5>
                  <p className="text-muted">No fee collections match your search criteria.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Fee Collection Modal */}
      <Modal show={showCollectModal} onHide={() => setShowCollectModal(false)} size="lg" centered>
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-collection text-white border-0" closeButton>
            <Modal.Title className="d-flex align-items-center fs-4">
              <div className="modal-icon-wrapper me-3">
                <i className="bi bi-currency-rupee fs-3"></i>
              </div>
              <div>
                <h5 className="mb-0">Collect Fee</h5>
                <small className="opacity-75">Process student fee payment</small>
              </div>
            </Modal.Title>
          </Modal.Header>

          <Form onSubmit={handleCollectionSubmit}>
            <Modal.Body className="p-4">
              {/* Student Search */}
              <div className="mb-4">
                <label className="form-label fw-medium">
                  <i className="bi bi-person-search me-2"></i>Search Student *
                </label>
                <Form.Control
                  type="text"
                  placeholder="Enter student name, roll number, or mobile..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  isInvalid={!!errors.student}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.student}
                </Form.Control.Feedback>

                {/* Student Search Results */}
                {studentsLoading && studentSearch && (
                  <div className="mt-2 p-2 border rounded bg-light">
                    <Spinner size="sm" className="me-2" />
                    Searching...
                  </div>
                )}

                {studentsResponse?.data?.length > 0 && (
                  <div className="mt-2 border rounded max-height-200 overflow-auto">
                    {studentsResponse.data.map((student) => (
                      <div 
                        key={student.id}
                        className="p-2 border-bottom cursor-pointer hover-bg-light"
                        onClick={() => handleStudentSelect(student)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex justify-content-between">
                          <div>
                            <div className="fw-medium">{student.student_name}</div>
                            <small className="text-muted">
                              {student.roll_number} - {student.grade_name} {student.division_name}
                            </small>
                          </div>
                          <small className="text-muted">{student.parent_mobile}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Student Info */}
              {selectedStudent && (
                <Card className="mb-4 border-primary">
                  <Card.Header className="bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">
                          <i className="bi bi-person-check-fill me-2 text-success"></i>
                          {selectedStudent.student_name}
                        </h6>
                        <small className="text-muted">
                          {selectedStudent.roll_number} - {selectedStudent.grade_name} {selectedStudent.division_name}
                        </small>
                      </div>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-danger p-0"
                        onClick={() => {
                          setSelectedStudent(null);
                          setSelectedAssignment(null);
                          setStudentSearch('');
                        }}
                      >
                        <i className="bi bi-x-circle"></i>
                      </Button>
                    </div>
                  </Card.Header>

                  <Card.Body>
                    <label className="form-label fw-medium">
                      <i className="bi bi-list-check me-2"></i>Select Fee to Collect *
                    </label>
                    
                    {feesLoading ? (
                      <div className="text-center p-3">
                        <Spinner size="sm" />
                      </div>
                    ) : studentFeesResponse?.data?.length > 0 ? (
                      <div className="max-height-200 overflow-auto">
                        {studentFeesResponse.data
                          .filter(fee => fee.status !== 'paid')
                          .map((fee) => (
                          <div 
                            key={fee.id}
                            className={`p-3 border rounded mb-2 cursor-pointer ${selectedAssignment?.id === fee.id ? 'border-primary bg-primary bg-opacity-10' : 'border-light hover-bg-light'}`}
                            onClick={() => handleAssignmentSelect(fee)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="fw-medium">{fee.category_name}</div>
                                <small className="text-muted">
                                  Due: {new Date(fee.due_date).toLocaleDateString()}
                                </small>
                              </div>
                              <div className="text-end">
                                <div className="fw-bold text-success">
                                  {formatCurrency(fee.pending_amount)}
                                </div>
                                <div className="small text-muted">
                                  Total: {formatCurrency(fee.total_amount)} | 
                                  Paid: {formatCurrency(fee.paid_amount)}
                                </div>
                                {getStatusBadge(fee.status)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <Alert variant="info" className="mb-3">
                          <i className="bi bi-info-circle me-2"></i>
                          No pending fees found for this student.
                        </Alert>
                        
                        <div className="border rounded p-3 bg-light">
                          <h6 className="mb-3">
                            <i className="bi bi-plus-circle me-2"></i>
                            Collect Direct Payment
                          </h6>
                          <p className="text-muted small mb-3">
                            For non-semester fees like events, penalties, or other miscellaneous charges.
                          </p>
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => handleCreateDirectPayment()}
                          >
                            <i className="bi bi-currency-rupee me-2"></i>
                            Create Direct Payment
                          </Button>
                        </div>
                      </div>
                    )}

                    {errors.assignment && (
                      <div className="invalid-feedback d-block">{errors.assignment}</div>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* Collection Details */}
              {selectedAssignment && (
                <Row>
                  <Col md={6}>
                    <div className="form-floating mb-3">
                      <Form.Control
                        type="number"
                        step="0.01"
                        max={selectedAssignment.pending_amount}
                        value={collectionData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        placeholder="Amount"
                        isInvalid={!!errors.amount}
                        id="amount"
                      />
                      <label htmlFor="amount">
                        <i className="bi bi-currency-rupee me-2"></i>Amount *
                      </label>
                      <Form.Control.Feedback type="invalid">
                        {errors.amount}
                      </Form.Control.Feedback>
                      <div className="form-text">
                        Maximum: {formatCurrency(selectedAssignment.pending_amount)}
                      </div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="form-floating mb-3">
                      <Form.Select
                        value={collectionData.payment_method}
                        onChange={(e) => handleInputChange('payment_method', e.target.value)}
                        isInvalid={!!errors.payment_method}
                        id="paymentMethod"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="online">Online Transfer</option>
                        <option value="cheque">Cheque</option>
                        <option value="dd">Demand Draft</option>
                      </Form.Select>
                      <label htmlFor="paymentMethod">
                        <i className="bi bi-credit-card me-2"></i>Payment Method *
                      </label>
                      <Form.Control.Feedback type="invalid">
                        {errors.payment_method}
                      </Form.Control.Feedback>
                    </div>
                  </Col>

                  {['card', 'online', 'cheque', 'dd'].includes(collectionData.payment_method) && (
                    <Col md={6}>
                      <div className="form-floating mb-3">
                        <Form.Control
                          type="text"
                          value={collectionData.reference_number}
                          onChange={(e) => handleInputChange('reference_number', e.target.value)}
                          placeholder="Reference Number"
                          isInvalid={!!errors.reference_number}
                          id="referenceNumber"
                        />
                        <label htmlFor="referenceNumber">
                          <i className="bi bi-hash me-2"></i>Reference Number *
                        </label>
                        <Form.Control.Feedback type="invalid">
                          {errors.reference_number}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                  )}

                  <Col md={collectionData.payment_method === 'cash' ? 12 : 6}>
                    <div className="form-floating mb-3">
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={collectionData.remarks}
                        onChange={(e) => handleInputChange('remarks', e.target.value)}
                        placeholder="Remarks"
                        style={{ minHeight: '80px' }}
                        id="remarks"
                      />
                      <label htmlFor="remarks">
                        <i className="bi bi-chat-text me-2"></i>Remarks (Optional)
                      </label>
                    </div>
                  </Col>
                </Row>
              )}

              {/* Direct Payment Form */}
              {isDirectPayment && (
                <Card className="border-warning">
                  <Card.Header className="bg-warning bg-opacity-10">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">
                        <i className="bi bi-currency-rupee me-2"></i>Direct Payment Details
                      </h6>
                      <Button 
                        variant="outline-warning" 
                        size="sm"
                        onClick={handleCancelDirectPayment}
                      >
                        <i className="bi bi-x me-1"></i>Cancel
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3 position-relative">
                          <div className="form-floating">
                            <Form.Control
                              type="text"
                              value={categorySearch}
                              onChange={(e) => handleCategorySearchChange(e.target.value)}
                              onFocus={handleCategorySearchFocus}
                              onBlur={handleCategorySearchBlur}
                              placeholder="Search fee category"
                              isInvalid={!!errors.category}
                              id="feeCategory"
                              disabled={categoriesLoading}
                              autoComplete="off"
                            />
                            <label htmlFor="feeCategory">
                              <i className="bi bi-tags me-2"></i>Fee Category *
                            </label>
                            <Form.Control.Feedback type="invalid">
                              {errors.category}
                            </Form.Control.Feedback>
                          </div>
                          
                          {/* Dropdown for search results */}
                          {showCategoryDropdown && !categoriesLoading && (
                            <div className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-sm" style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}>
                              {filteredCategories.length > 0 ? (
                                filteredCategories.map((category) => (
                                  <div
                                    key={category.id}
                                    className="p-2 border-bottom d-flex align-items-center"
                                    onClick={() => handleCategorySelect(category)}
                                    style={{ 
                                      cursor: 'pointer',
                                      transition: 'background-color 0.15s ease-in-out'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '';
                                    }}
                                  >
                                    <i className="bi bi-tag me-2 text-muted"></i>
                                    <div>
                                      <div className="fw-medium">{category.name}</div>
                                      {category.description && (
                                        <small className="text-muted">{category.description}</small>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 text-center text-muted">
                                  <i className="bi bi-search me-2"></i>
                                  No categories found matching "{categorySearch}"
                                </div>
                              )}
                            </div>
                          )}
                          
                          {categoriesLoading && (
                            <div className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-sm p-3 text-center text-muted" style={{ zIndex: 1050 }}>
                              <Spinner size="sm" className="me-2" />
                              Loading categories...
                            </div>
                          )}
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="form-floating mb-3">
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            value={directPaymentData.amount}
                            onChange={(e) => handleDirectPaymentChange('amount', e.target.value)}
                            placeholder="Amount"
                            isInvalid={!!errors.amount}
                            id="directAmount"
                          />
                          <label htmlFor="directAmount">
                            <i className="bi bi-currency-rupee me-2"></i>Amount *
                          </label>
                          <Form.Control.Feedback type="invalid">
                            {errors.amount}
                          </Form.Control.Feedback>
                          <small className="text-muted">
                            <i className="bi bi-info-circle me-1"></i>
                            Amount will be auto-filled when you select a fee category (if predefined)
                          </small>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="form-floating mb-3">
                          <Form.Select
                            value={collectionData.payment_method}
                            onChange={(e) => handleInputChange('payment_method', e.target.value)}
                            isInvalid={!!errors.payment_method}
                            id="directPaymentMethod"
                          >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="online">Online Transfer</option>
                            <option value="cheque">Cheque</option>
                            <option value="dd">Demand Draft</option>
                          </Form.Select>
                          <label htmlFor="directPaymentMethod">
                            <i className="bi bi-credit-card me-2"></i>Payment Method *
                          </label>
                          <Form.Control.Feedback type="invalid">
                            {errors.payment_method}
                          </Form.Control.Feedback>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="form-floating mb-3">
                          <Form.Control
                            type="date"
                            value={directPaymentData.due_date}
                            onChange={(e) => handleDirectPaymentChange('due_date', e.target.value)}
                            id="dueDate"
                          />
                          <label htmlFor="dueDate">
                            <i className="bi bi-calendar me-2"></i>Due Date
                          </label>
                        </div>
                      </Col>

                      {collectionData.payment_method !== 'cash' && (
                        <Col md={6}>
                          <div className="form-floating mb-3">
                            <Form.Control
                              type="text"
                              value={collectionData.reference_number}
                              onChange={(e) => handleInputChange('reference_number', e.target.value)}
                              placeholder="Reference Number"
                              isInvalid={!!errors.reference_number}
                              id="directRefNumber"
                            />
                            <label htmlFor="directRefNumber">
                              <i className="bi bi-hash me-2"></i>Reference Number *
                            </label>
                            <Form.Control.Feedback type="invalid">
                              {errors.reference_number}
                            </Form.Control.Feedback>
                          </div>
                        </Col>
                      )}

                      <Col md={12}>
                        <div className="form-floating mb-3">
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={directPaymentData.description}
                            onChange={(e) => handleDirectPaymentChange('description', e.target.value)}
                            placeholder="Description"
                            style={{ minHeight: '80px' }}
                            id="directDescription"
                          />
                          <label htmlFor="directDescription">
                            <i className="bi bi-chat-text me-2"></i>Description (Optional)
                          </label>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}
            </Modal.Body>

            <Modal.Footer className="bg-light border-0 p-4">
              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  setShowCollectModal(false);
                  resetCollectionForm();
                }}
              >
                <i className="bi bi-x-circle me-2"></i>Cancel
              </Button>
              <Button 
                type="submit" 
                variant="success"
                disabled={collectFeeMutation.isLoading || (!selectedAssignment && !isDirectPayment) || (isDirectPayment && (!directPaymentData.category_id || !directPaymentData.amount || !collectionData.amount))}
              >
                {collectFeeMutation.isLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-currency-rupee me-2"></i>
                    Collect Fee
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </div>

        <style jsx>{`
          .bg-gradient-collection {
            background: linear-gradient(135deg, #20c997 0%, #0d6efd 100%) !important;
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
          .max-height-200 {
            max-height: 200px;
          }
          .hover-bg-light:hover {
            background-color: #f8f9fa;
          }
          .cursor-pointer {
            cursor: pointer;
          }
          .form-floating > .form-control:focus ~ label {
            color: #20c997 !important;
          }
          .form-control:focus {
            border-color: #20c997;
            box-shadow: 0 0 0 0.25rem rgba(32, 201, 151, 0.15);
          }
        `}</style>
      </Modal>

      {/* Receipt Modal */}
      <ReceiptModal
        show={showReceiptModal}
        onHide={() => setShowReceiptModal(false)}
        receiptData={selectedReceipt}
      />
    </div>
  );
};

export default FeeCollectionManagement;