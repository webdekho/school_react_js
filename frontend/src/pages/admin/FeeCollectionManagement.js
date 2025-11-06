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
  const [selectedOptionalFees, setSelectedOptionalFees] = useState([]);
  const [collectionData, setCollectionData] = useState({
    amount: '',
    payment_mode: 'cash',
    reference_number: '',
    remarks: '',
    semester: 'Semester 1' // Make semester mandatory
  });
  const [errors, setErrors] = useState({});

  // Modal tab state
  const [modalActiveTab, setModalActiveTab] = useState('pending');
  
  // Direct payment state
  const [isDirectPayment, setIsDirectPayment] = useState(false);
  const [directPaymentData, setDirectPaymentData] = useState({
    category_id: '',
    category_name: '',
    amount: '',
    due_date: new Date().toISOString().split('T')[0],
    description: ''
  });

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
    payment_mode: '',
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

  // Optional fees filter states
  const [optionalFeesFilter, setOptionalFeesFilter] = useState({
    grade_id: 'all', // 'all' for global + student's grade, 'global' for global only, specific grade_id for that grade
    show_global: true
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

  // Get available optional fees for the selected student
  const { data: availableOptionalFeesResponse, isLoading: optionalFeesLoading } = useQuery({
    queryKey: ['available_optional_fees', selectedStudent?.id, selectedStudent?.grade_id, selectedAcademicYear?.id, collectionData.semester],
    queryFn: async () => {
      if (!selectedStudent?.id || !selectedStudent?.grade_id || !selectedAcademicYear?.id) {
        return { data: [] };
      }
      
      const semester = collectionData.semester || 'Semester 1';
      const response = await apiService.get(
        `/api/admin/available_optional_fees/${selectedStudent.id}?grade_id=${selectedStudent.grade_id}&academic_year_id=${selectedAcademicYear.id}&semester=${semester}&include_global=true`
      );
      return response.data;
    },
    enabled: !!selectedStudent?.id && !!selectedStudent?.grade_id && !!selectedAcademicYear?.id
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
      if (collectionFilters.payment_mode) {
        params.append('payment_mode', collectionFilters.payment_mode);
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
      // Note: We don't filter by grade_id here because we want to show 
      // both grade-specific AND global fee structures for better visibility
      // The frontend will handle filtering if needed
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

  const studentFees = studentFeesResponse?.data || [];
  const availableOptionalFees = availableOptionalFeesResponse?.data || [];

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
    onSuccess: async (response) => {
      queryClient.invalidateQueries(['fee_collections']);
      queryClient.invalidateQueries(['student_fees']);
      setShowCollectModal(false);
      resetCollectionForm();
      
      // Automatically show receipt after successful collection
      if (response.data?.id || response.data?.collection_id) {
        const collectionId = response.data.id || response.data.collection_id;
        try {
          // Fetch complete receipt details
          const receiptResponse = await apiService.get(`/api/admin/fee_collections/${collectionId}`);
          let receiptData;
          
          if (receiptResponse.data && receiptResponse.data.data) {
            receiptData = receiptResponse.data.data;
          } else if (receiptResponse.data) {
            receiptData = receiptResponse.data;
          }
          
          if (receiptData && receiptData.receipt_number) {
            setSelectedReceipt(receiptData);
            setShowReceiptModal(true);
            // Show only the API response message
            toast.success(response.data?.message || 'Fee collected successfully');
          }
        } catch (receiptError) {
          console.error('Error fetching receipt details:', receiptError);
          // Still show success message from API response
          toast.success(response.data?.message || 'Fee collected successfully');
        }
      } else {
        // If no collection ID, still show success message
        toast.success(response.data?.message || 'Fee collected successfully');
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

  // Handle optional fee selection
  const handleOptionalFeeToggle = (fee) => {
    setSelectedOptionalFees(prev => {
      const isSelected = prev.some(f => f.id === fee.id);
      const newSelectedFees = isSelected 
        ? prev.filter(f => f.id !== fee.id)
        : [...prev, fee];
      
      // Update amount field with new total
      const newTotal = calculateTotalAmountWithFees(selectedAssignment, newSelectedFees);
      setCollectionData(prev => ({
        ...prev,
        amount: newTotal.toString()
      }));
      
      return newSelectedFees;
    });
  };

  // Helper function to calculate total with specific fees
  const calculateTotalAmountWithFees = (assignment, optionalFees) => {
    let total = 0;
    
    // Add selected assignment amount
    if (assignment) {
      total += parseFloat(assignment.pending_amount || 0);
    }
    
    // Add selected optional fees
    optionalFees.forEach(fee => {
      total += parseFloat(fee.amount || 0);
    });
    
    return total;
  };

  // Calculate total amount including selected optional fees
  const calculateTotalAmount = () => {
    return calculateTotalAmountWithFees(selectedAssignment, selectedOptionalFees);
  };

  // Auto-update amount when fees change (for cases without mandatory assignment)
  useEffect(() => {
    if (selectedOptionalFees.length > 0 && !selectedAssignment) {
      const totalAmount = calculateTotalAmountWithFees(null, selectedOptionalFees);
      setCollectionData(prev => ({
        ...prev,
        amount: totalAmount.toString()
      }));
    }
  }, [selectedOptionalFees, selectedAssignment]);

  const resetCollectionForm = () => {
    setCollectionData({
      amount: '',
      payment_mode: 'cash',
      reference_number: '',
      remarks: '',
      semester: 'Semester 1'
    });
    setSelectedStudent(null);
    setSelectedAssignment(null);
    setSelectedOptionalFees([]);
    setStudentSearch('');
    setCategorySearch('');
    setShowCategoryDropdown(false);
    setErrors({});
    setModalActiveTab('pending');
    setIsDirectPayment(false);
    setDirectPaymentData({
      category_id: '',
      category_name: '',
      amount: '',
      due_date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setOptionalFeesFilter({
      grade_id: 'all',
      show_global: true
    });
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setStudentSearch(`${student.student_name} (${student.roll_number})`);
  };

  const handleAssignmentSelect = (assignment) => {
    setSelectedAssignment(assignment);
    
    // Calculate total including any already selected optional fees
    const totalAmount = calculateTotalAmountWithFees(assignment, selectedOptionalFees);
    setCollectionData(prev => ({
      ...prev,
      amount: totalAmount.toString()
    }));
  };

  const handleCollectionSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (!selectedStudent) {
      newErrors.student = 'Please select a student';
    }
    
    if (isDirectPayment) {
      // Validation for direct payment (Other Payment tab)
      if (!directPaymentData.category_id) {
        newErrors.category = 'Please select a fee category';
      }
      if (!collectionData.remarks || collectionData.remarks.trim() === '') {
        newErrors.remarks = 'Payment description is required for other payments';
      }
      if (!collectionData.amount || parseFloat(collectionData.amount) <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      }
    } else {
      // Validation for assigned fee payment (Pending Payment tab)
      if (!selectedAssignment && selectedOptionalFees.length === 0) {
        newErrors.assignment = 'Please select at least one fee to collect';
      }
      if (selectedAssignment && parseFloat(collectionData.amount) > calculateTotalAmount()) {
        newErrors.amount = 'Amount cannot exceed total selected amount';
      }
    }
    
    if (!collectionData.amount || parseFloat(collectionData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!collectionData.payment_mode) {
      newErrors.payment_mode = 'Payment mode is required';
    }
    if (['card', 'online', 'cheque', 'dd'].includes(collectionData.payment_mode) && !collectionData.reference_number) {
      newErrors.reference_number = 'Reference number is required for this payment method';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const paymentData = {
      student_id: selectedStudent.id,
      amount: parseFloat(collectionData.amount),
      payment_mode: collectionData.payment_mode,
      reference_number: collectionData.reference_number || null,
      remarks: collectionData.remarks || null,
      semester: collectionData.semester
    };

    if (isDirectPayment) {
      // For other payments (direct payments without specific fee structure)
      paymentData.is_direct_payment = 1;
      paymentData.fee_category_id = directPaymentData.category_id;
      paymentData.direct_fee_description = collectionData.remarks;
      // Remove semester requirement for direct payments
      delete paymentData.semester;
    } else {
      // Handle both mandatory and optional fees (Pending Payment tab)
      if (selectedAssignment) {
        paymentData.student_fee_assignment_id = selectedAssignment.id;
      }
      
      // Add optional fees data
      if (selectedOptionalFees.length > 0) {
        paymentData.optional_fees = selectedOptionalFees.map(fee => ({
          fee_structure_id: fee.id,
          amount: fee.amount
        }));
      }
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
      'Payment Mode': collection.payment_mode?.toUpperCase(),
      'Collected By': collection.collected_by_name || 'Unknown',
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
          <h5 className="mb-0 fw-semibold" style={{ fontSize: '1.1rem' }}>
            <i className="bi bi-receipt me-2" style={{ fontSize: '1rem' }}></i>
            Fee Collection Management
          </h5>
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
                    value={collectionFilters.payment_mode}
                    onChange={(e) => setCollectionFilters(prev => ({ ...prev, payment_mode: e.target.value }))}
                  >
                    <option value="">All Modes</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                    <option value="cheque">Cheque</option>
                    <option value="dd">DD</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </Form.Select>
                </Col>
                <Col md={1} className="text-end">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setDateFilter({ start_date: '', end_date: '' });
                      setCollectionFilters({ staff_id: '', payment_mode: '', category_id: '' });
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
                              <i className={`${getPaymentMethodIcon(collection.payment_mode)} me-2`}></i>
                              {collection.payment_mode?.toUpperCase() || 'N/A'}
                              {collection.reference_number && (
                                <small className="text-muted ms-2">({collection.reference_number})</small>
                              )}
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="fw-medium">{collection.collected_by_name || 'Unknown'}</div>
                              {collection.collected_by_id && (
                                <small className="text-muted">ID: {collection.collected_by_id}</small>
                              )}
                            </div>
                          </td>
                          <td>
                            <small>{new Date(collection.collection_date).toLocaleDateString()}</small>
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
      <Modal show={showCollectModal} onHide={() => setShowCollectModal(false)} size="xl" centered>
        <Modal.Header className="bg-gradient-collection text-white border-0 py-3" closeButton>
          <Modal.Title className="d-flex align-items-center">
            <i className="bi bi-currency-rupee me-2"></i>
            <span>Fee Collection</span>
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleCollectionSubmit}>
          <Modal.Body className="p-4">
            <Tabs 
              activeKey={modalActiveTab} 
              onSelect={(key) => {
                setModalActiveTab(key);
                setIsDirectPayment(key === 'other');
                setErrors({});
              }} 
              className="mb-4"
            >
              <Tab eventKey="pending" title="Pending Payment">
              {/* Student Search */}
              <div className="mb-4">
                <label className="form-label fw-medium text-dark">
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
                    {feesLoading ? (
                      <div className="text-center p-3">
                        <Spinner size="sm" />
                      </div>
                    ) : (
                      <div>
                        {/* All Fees Section - Combined Mandatory and Optional */}
                        {(studentFeesResponse?.data?.length > 0 || availableOptionalFeesResponse?.data?.length > 0) && (
                          <div className="mb-4">
                            <div className="max-height-300 overflow-auto">
                              <Row>
                              {/* Mandatory Fees */}
                              {studentFeesResponse?.data
                                ?.filter(fee => fee.status !== 'paid' && fee.is_mandatory == 1)
                                .map((fee) => (
                                <Col md={6} key={`mandatory-${fee.id}`}>
                                <div 
                                  className={`p-3 border rounded mb-2 cursor-pointer ${selectedAssignment?.id === fee.id ? 'border-primary bg-primary bg-opacity-10' : 'border-left-primary border-light hover-bg-light'}`}
                                  onClick={() => handleAssignmentSelect(fee)}
                                  style={{ cursor: 'pointer', borderLeft: '4px solid #0d6efd' }}
                                >
                                  <div className="d-flex flex-column">
                                    <div className="mb-2">
                                      <div className="d-flex align-items-center mb-1">
                                        <span className="badge bg-danger me-2">MANDATORY</span>
                                        <span className="fw-medium">{fee.category_name}</span>
                                      </div>
                                      <small className="text-muted d-block">
                                        <i className="bi bi-calendar me-1"></i>
                                        Due: {new Date(fee.due_date).toLocaleDateString()}
                                      </small>
                                    </div>
                                    <div>
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
                                </Col>
                              ))}
                              
                              {/* Optional Fees */}
                              {availableOptionalFeesResponse?.data?.map((fee) => (
                                <Col md={6} key={`optional-${fee.id}`}>
                                <div 
                                  className={`p-3 border rounded mb-2 cursor-pointer ${selectedOptionalFees.some(f => f.id === fee.id) ? 'border-success bg-success bg-opacity-10' : 'border-left-success border-light hover-bg-light'}`}
                                  onClick={() => handleOptionalFeeToggle(fee)}
                                  style={{ cursor: 'pointer', borderLeft: '4px solid #198754' }}
                                >
                                  <div className="d-flex flex-column">
                                    <div className="mb-2">
                                      <div className="d-flex align-items-center flex-wrap mb-1">
                                        <span className="badge bg-secondary me-2">OPTIONAL</span>
                                        <span className="fw-medium">{fee.category_name}</span>
                                        {fee.is_global && (
                                          <span className="badge bg-primary ms-2">
                                            <i className="bi bi-globe me-1"></i>GLOBAL
                                          </span>
                                        )}
                                      </div>
                                      <small className="text-muted d-block">
                                        {fee.is_global ? (
                                          <span className="text-primary fw-medium">
                                            <i className="bi bi-globe me-1"></i>
                                            Applies to All Grades
                                          </span>
                                        ) : (
                                          <span>
                                            <i className="bi bi-bookmark me-1"></i>
                                            {fee.grade_name || 'Grade-specific'}
                                          </span>
                                        )}
                                        {fee.description && (
                                          <><br />{fee.description}</>
                                        )}
                                      </small>
                                    </div>
                                    <div>
                                      <div className="fw-bold text-success">
                                        {formatCurrency(fee.amount)}
                                      </div>
                                      <div className="small text-muted">
                                        {fee.is_global ? 'Global Fee' : 'Grade-specific Fee'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                </Col>
                              ))}
                              </Row>
                            </div>
                          </div>
                        )}

                        {/* No Fees Available */}
                        {(!studentFeesResponse?.data?.length || studentFeesResponse.data.filter(fee => fee.status !== 'paid' && fee.is_mandatory == 1).length === 0) && 
                         (!availableOptionalFeesResponse?.data?.length || availableOptionalFeesResponse.data.length === 0) && (
                          <Alert variant="info" className="mb-3">
                            <i className="bi bi-info-circle me-2"></i>
                            No pending fees found for this student in {collectionData.semester}.
                          </Alert>
                        )}

                        {/* Total Amount Display */}
                        {(selectedAssignment || selectedOptionalFees.length > 0) && (
                          <div className="mt-3 p-3 bg-light border rounded">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-medium">Total Amount:</span>
                              <span className="fw-bold fs-5 text-success">
                                {formatCurrency(calculateTotalAmount())}
                              </span>
                            </div>
                            {selectedOptionalFees.length > 0 && (
                              <small className="text-muted">
                                Including {selectedOptionalFees.length} optional fee(s)
                              </small>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {errors.assignment && (
                      <div className="invalid-feedback d-block">{errors.assignment}</div>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* Collection Details */}
              {(selectedAssignment || selectedOptionalFees.length > 0) && (
                <Row className="mt-4">
                  <Col md={6}>
                    <div className="form-floating mb-3">
                      <Form.Select
                        value={collectionData.payment_mode}
                        onChange={(e) => handleInputChange('payment_mode', e.target.value)}
                        isInvalid={!!errors.payment_mode}
                        id="paymentMethod"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="online">Online Transfer</option>
                        <option value="cheque">Cheque</option>
                        <option value="dd">Demand Draft</option>
                        <option value="upi">UPI</option>
                        <option value="bank_transfer">Bank Transfer</option>
                      </Form.Select>
                      <label htmlFor="paymentMethod">
                        <i className="bi bi-credit-card me-2"></i>Payment Mode *
                      </label>
                      <Form.Control.Feedback type="invalid">
                        {errors.payment_mode}
                      </Form.Control.Feedback>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="form-floating mb-3">
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        value={collectionData.amount || calculateTotalAmount()}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        placeholder="Amount"
                        isInvalid={!!errors.amount}
                        id="amount"
                      />
                      <label htmlFor="amount">
                        <i className="bi bi-currency-rupee me-2"></i>Amount * (Editable)
                      </label>
                      <Form.Control.Feedback type="invalid">
                        {errors.amount}
                      </Form.Control.Feedback>
                      <div className="form-text">
                        <small className="text-muted">
                          <i className="bi bi-pencil-square me-1"></i>You can edit this amount
                        </small>
                      </div>
                    </div>
                  </Col>

                  {['card', 'online', 'cheque', 'dd'].includes(collectionData.payment_mode) && (
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

                  <Col md={collectionData.payment_mode === 'cash' ? 12 : 6}>
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
              </Tab>

              <Tab eventKey="other" title="Other Payment">
                {/* Student Search for Other Payment */}
                <div className="mb-4">
                  <label className="form-label fw-medium text-dark">
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

                {/* Selected Student Info for Other Payment */}
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
                            setStudentSearch('');
                          }}
                        >
                          <i className="bi bi-x-circle"></i>
                        </Button>
                      </div>
                    </Card.Header>

                    <Card.Body>
                      {/* Direct Payment Details */}
                      <Row>
                        <Col md={6}>
                          <div className="form-floating mb-3">
                            <Form.Select
                              id="otherPaymentCategory"
                              value={directPaymentData.category_id}
                              onChange={(e) => {
                                setDirectPaymentData({ ...directPaymentData, category_id: e.target.value });
                                setErrors({ ...errors, category: '' });
                              }}
                              isInvalid={!!errors.category}
                            >
                              <option value="">Select Fee Category</option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Label htmlFor="otherPaymentCategory">
                              <i className="bi bi-folder me-2"></i>Fee Category *
                            </Form.Label>
                            <Form.Control.Feedback type="invalid">
                              {errors.category}
                            </Form.Control.Feedback>
                          </div>
                        </Col>

                        <Col md={6}>
                          <div className="form-floating mb-3">
                            <Form.Control
                              id="otherPaymentDescription"
                              type="text"
                              placeholder="Payment Description"
                              value={collectionData.remarks}
                              onChange={(e) => setCollectionData({ ...collectionData, remarks: e.target.value })}
                              isInvalid={!!errors.remarks}
                            />
                            <Form.Label htmlFor="otherPaymentDescription">
                              <i className="bi bi-tag me-2"></i>Payment Description *
                            </Form.Label>
                            <Form.Control.Feedback type="invalid">
                              {errors.remarks}
                            </Form.Control.Feedback>
                          </div>
                        </Col>

                        <Col md={6}>
                          <div className="form-floating mb-3">
                            <Form.Control
                              id="otherPaymentAmount"
                              type="number"
                              placeholder="Amount"
                              value={collectionData.amount}
                              onChange={(e) => setCollectionData({ ...collectionData, amount: e.target.value })}
                              isInvalid={!!errors.amount}
                            />
                            <Form.Label htmlFor="otherPaymentAmount">
                              <i className="bi bi-currency-rupee me-2"></i>Amount *
                            </Form.Label>
                            <Form.Control.Feedback type="invalid">
                              {errors.amount}
                            </Form.Control.Feedback>
                          </div>
                        </Col>

                        <Col md={6}>
                          <div className="form-floating mb-3">
                            <Form.Select
                              id="otherPaymentMode"
                              value={collectionData.payment_mode}
                              onChange={(e) => setCollectionData({ ...collectionData, payment_mode: e.target.value })}
                            >
                              <option value="cash">Cash</option>
                              <option value="upi">UPI</option>
                              <option value="bank_transfer">Bank Transfer</option>
                              <option value="cheque">Cheque</option>
                              <option value="card">Card</option>
                            </Form.Select>
                            <Form.Label htmlFor="otherPaymentMode">
                              <i className="bi bi-credit-card me-2"></i>Payment Mode *
                            </Form.Label>
                          </div>
                        </Col>

                        <Col md={12}>
                          <div className="form-floating mb-3">
                            <Form.Control
                              id="otherPaymentReference"
                              type="text"
                              placeholder="Reference Number"
                              value={collectionData.reference_number}
                              onChange={(e) => setCollectionData({ ...collectionData, reference_number: e.target.value })}
                            />
                            <Form.Label htmlFor="otherPaymentReference">
                              <i className="bi bi-hash me-2"></i>Reference Number
                            </Form.Label>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}
              </Tab>
            </Tabs>
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
                disabled={
                  collectFeeMutation.isLoading || 
                  !selectedStudent ||
                  (isDirectPayment 
                    ? (!directPaymentData.category_id || !collectionData.remarks || !collectionData.amount)
                    : (!selectedAssignment && selectedOptionalFees.length === 0)
                  )
                }
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
        </Modal>

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
          .max-height-300 {
            max-height: 300px;
          }
          .border-left-primary {
            border-left: 4px solid #0d6efd !important;
          }
          .border-left-success {
            border-left: 4px solid #198754 !important;
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
          
          /* Custom Tab Styling */
          .nav-tabs-custom {
            border-bottom: 2px solid #e9ecef;
          }
          .nav-tabs-custom .nav-link {
            color: #6c757d;
            border: none;
            border-bottom: 3px solid transparent;
            padding: 12px 24px;
            font-weight: 500;
            transition: all 0.3s ease;
          }
          .nav-tabs-custom .nav-link:hover {
            color: #20c997;
            border-bottom-color: rgba(32, 201, 151, 0.3);
            background-color: rgba(32, 201, 151, 0.05);
          }
          .nav-tabs-custom .nav-link.active {
            color: #20c997;
            border-bottom-color: #20c997;
            background-color: rgba(32, 201, 151, 0.1);
            font-weight: 600;
          }
          .nav-tabs-custom .nav-link i {
            font-size: 1.1rem;
          }
        `}</style>

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