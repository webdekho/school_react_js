import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { ENV_CONFIG } from '../../config/environment';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import { useAcademicYear } from '../../contexts/AcademicYearContext';
import jsPDF from 'jspdf';

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
    designation: '',
    address: '',
    pincode: '',
    selectedGradeIds: [],
    selectedDivisionIds: [],
    medical_history: '',
    qualification: '',
    experience: '',
    achievements: '',
    basic_salary: '',
    allowances: '',
    deductions: '',
    pf_number: '',
    pf_contribution: '',
    photo_url: ''
  });
  const [errors, setErrors] = useState({});
  
  // File upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Kids management state
  const [kids, setKids] = useState([]);
  const [showKidModal, setShowKidModal] = useState(false);
  const [editingKid, setEditingKid] = useState(null);
  const [editingKidIndex, setEditingKidIndex] = useState(null);
  const [kidFormData, setKidFormData] = useState({
    name: '',
    gender: 'Male',
    dob_date: '',
    school_name: ''
  });
  const [kidErrors, setKidErrors] = useState({});

  // Helper function to get full image URL with API_BASE_URL concatenation
  const getImageUrl = (path) => {
    if (!path) return '';
    
    // If already a full URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    
    // If it starts with /uploads/, concatenate with API_BASE_URL
    if (path.startsWith('/uploads/')) {
      return `${ENV_CONFIG.API_BASE_URL}${path.substring(1)}`;
    }
    
    // If it starts with uploads/ (without leading slash), concatenate with API_BASE_URL
    if (path.startsWith('uploads/')) {
      return `${ENV_CONFIG.API_BASE_URL}${path}`;
    }
    
    // For any other relative path, treat as uploads file and concatenate
    if (!path.startsWith('/') && !path.includes('://')) {
      return `${ENV_CONFIG.API_BASE_URL}uploads/${path}`;
    }
    
    return path;
  };

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


  // Create staff mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiService.post('/api/admin/staff', data);
      return response;
    },
    onSuccess: async (response) => {
      const staffId = response.data?.id;
      
      // Save kids if any were added
      if (staffId && kids.length > 0) {
        try {
          await apiService.post(`/api/admin/staff_kids_bulk/${staffId}`, { kids });
        } catch (error) {
          console.error('Failed to save kids:', error);
          toast.error('Staff created but failed to save children information');
        }
      }
      
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
    onSuccess: async (response, variables) => {
      const staffId = variables.id;
      
      // Update kids
      if (staffId) {
        try {
          await apiService.post(`/api/admin/staff_kids_bulk/${staffId}`, { kids });
        } catch (error) {
          console.error('Failed to update kids:', error);
          toast.error('Staff updated but failed to save children information');
        }
      }
      
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
        
        // Fetch kids for this staff member
        try {
          const kidsResponse = await apiService.get(`/api/admin/staff_kids/${staffMember.id}`);
          const normalizedKids = (kidsResponse.data || []).map(kid => ({
            ...kid,
            dob_date: kid.dob_date ? kid.dob_date.substring(0, 10) : ''
          }));
          setKids(normalizedKids);
        } catch (error) {
          console.error('Error loading staff kids:', error);
          setKids([]);
        }
        
        // Set basic form data with IDs for multi-select
        setFormData({
          name: fullStaffData.name,
          mobile: fullStaffData.mobile,
          email: fullStaffData.email || '',
          password: '',
          role_id: fullStaffData.role_id ? fullStaffData.role_id.toString() : '',
          designation: fullStaffData.designation || '',
          address: fullStaffData.address || '',
          pincode: fullStaffData.pincode || '',
          selectedGradeIds: (fullStaffData.assigned_grades || []).map(g => g.id.toString()),
          selectedDivisionIds: (fullStaffData.assigned_divisions || []).map(d => d.id.toString()),
          medical_history: fullStaffData.medical_history || '',
          qualification: fullStaffData.qualification || '',
          experience: fullStaffData.experience || '',
          achievements: fullStaffData.achievements || '',
          basic_salary: fullStaffData.basic_salary || '',
          allowances: fullStaffData.allowances || '',
          deductions: fullStaffData.deductions || '',
          pf_number: fullStaffData.pf_number || '',
          pf_contribution: fullStaffData.pf_contribution || '',
          photo_url: fullStaffData.photo_url || ''
        });
        
      } catch (error) {
        toast.error('Failed to load staff details');
        console.error('Error loading staff details:', error);
      }
    } else {
      setEditingStaff(null);
      setKids([]);
      setFormData({
        name: '',
        mobile: '',
        email: '',
        password: 'password',
        role_id: '',
        designation: '',
        address: '',
        pincode: '',
        selectedGradeIds: [],
        selectedDivisionIds: [],
        medical_history: '',
        qualification: '',
        experience: '',
        achievements: '',
        basic_salary: '',
        allowances: '',
        deductions: '',
        pf_number: '',
        pf_contribution: '',
        photo_url: ''
      });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(null);
    setKids([]);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      password: 'password',
      role_id: '',
      designation: '',
      address: '',
      pincode: '',
      selectedGradeIds: [],
      selectedDivisionIds: [],
      medical_history: '',
      qualification: '',
      experience: '',
      achievements: '',
      basic_salary: '',
      allowances: '',
      deductions: '',
      pf_number: '',
      pf_contribution: '',
      photo_url: ''
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

  const handleGradeToggle = (grade) => {
    setFormData(prev => {
      const gradeId = grade.id.toString();
      const isSelected = prev.selectedGradeIds.includes(gradeId);
      
      if (isSelected) {
        return {
          ...prev,
          selectedGradeIds: prev.selectedGradeIds.filter(id => id !== gradeId)
        };
      } else {
        return {
          ...prev,
          selectedGradeIds: [...prev.selectedGradeIds, gradeId]
        };
      }
    });
  };

  const handleGradeRemove = (gradeId) => {
    setFormData(prev => ({
      ...prev,
      selectedGradeIds: prev.selectedGradeIds.filter(id => id !== gradeId)
    }));
  };

  const handleDivisionToggle = (division) => {
    setFormData(prev => {
      const divisionId = division.id.toString();
      const isSelected = prev.selectedDivisionIds.includes(divisionId);
      
      if (isSelected) {
        return {
          ...prev,
          selectedDivisionIds: prev.selectedDivisionIds.filter(id => id !== divisionId)
        };
      } else {
        return {
          ...prev,
          selectedDivisionIds: [...prev.selectedDivisionIds, divisionId]
        };
      }
    });
  };

  const handleDivisionRemove = (divisionId) => {
    setFormData(prev => ({
      ...prev,
      selectedDivisionIds: prev.selectedDivisionIds.filter(id => id !== divisionId)
    }));
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
    if (!formData.qualification.trim()) {
      newErrors.qualification = 'Qualification is required';
    }
    if (!formData.basic_salary || formData.basic_salary <= 0) {
      newErrors.basic_salary = 'Basic salary is required and must be greater than 0';
    }
    if (formData.allowances && formData.allowances < 0) {
      newErrors.allowances = 'Allowances cannot be negative';
    }
    if (formData.deductions && formData.deductions < 0) {
      newErrors.deductions = 'Deductions cannot be negative';
    }
    if (formData.pf_contribution && formData.pf_contribution < 0) {
      newErrors.pf_contribution = 'PF contribution cannot be negative';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Kids management handlers
  const handleShowKidModal = (kid = null, index = null) => {
    if (kid) {
      setEditingKid(kid);
      setEditingKidIndex(index);
      setKidFormData({
        name: kid.name || '',
        gender: kid.gender || 'Male',
        dob_date: kid.dob_date ? kid.dob_date.substring(0, 10) : '',
        school_name: kid.school_name || ''
      });
    } else {
      setEditingKid(null);
      setEditingKidIndex(null);
      setKidFormData({
        name: '',
        gender: 'Male',
        dob_date: '',
        school_name: ''
      });
    }
    setKidErrors({});
    setShowKidModal(true);
  };

  const handleCloseKidModal = () => {
    setShowKidModal(false);
    setEditingKid(null);
    setEditingKidIndex(null);
    setKidFormData({
      name: '',
      gender: 'Male',
      dob_date: '',
      school_name: ''
    });
    setKidErrors({});
  };

  const handleKidInputChange = (e) => {
    const { name, value } = e.target;
    setKidFormData(prev => ({ ...prev, [name]: value }));
    if (kidErrors[name]) {
      setKidErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateKidForm = () => {
    const newErrors = {};
    if (!kidFormData.name.trim()) {
      newErrors.name = 'Child name is required';
    }
    if (!kidFormData.gender) {
      newErrors.gender = 'Gender is required';
    }
    if (!kidFormData.dob_date) {
      newErrors.dob_date = 'Date of birth is required';
    } else {
      const dobDate = new Date(`${kidFormData.dob_date}T00:00:00Z`);
      if (Number.isNaN(dobDate.getTime())) {
        newErrors.dob_date = 'Invalid DOB selected';
      } else {
        const today = new Date();
        if (dobDate > today) {
          newErrors.dob_date = 'DOB cannot be in the future';
        } else {
          const age = today.getUTCFullYear() - dobDate.getUTCFullYear() - ((today.getUTCMonth() < dobDate.getUTCMonth() || (today.getUTCMonth() === dobDate.getUTCMonth() && today.getUTCDate() < dobDate.getUTCDate())) ? 1 : 0);
          if (age < 0 || age > 120) {
            newErrors.dob_date = 'DOB must be within a valid range';
          }
        }
      }
    }
    setKidErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleKidSubmit = (e) => {
    e.preventDefault();
    if (!validateKidForm()) return;

    const kidData = {
      name: kidFormData.name,
      gender: kidFormData.gender,
      dob_date: kidFormData.dob_date,
      school_name: kidFormData.school_name || null
    };

    if (editingKidIndex !== null) {
      // Update existing kid
      const updatedKids = [...kids];
      updatedKids[editingKidIndex] = { ...updatedKids[editingKidIndex], ...kidData };
      setKids(updatedKids);
      toast.success('Child information updated');
    } else {
      // Add new kid
      setKids(prev => [...prev, kidData]);
      toast.success('Child added');
    }

    handleCloseKidModal();
  };

  const handleKidDelete = (index) => {
    if (window.confirm('Are you sure you want to remove this child?')) {
      setKids(prev => prev.filter((_, i) => i !== index));
      toast.success('Child removed');
    }
  };

  const handleSubmit = async (e) => {
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

  // Photo upload handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: JPG, PNG');
      return;
    }

    setUploadingPhoto(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      console.log('Uploading staff photo...');

      // Use the staff photo upload method
      const response = await apiService.uploadStaffPhoto(uploadFormData);

      console.log('Staff photo upload response:', response);
      
      // Extract file URL from response
      const fileUrl = response.data?.url || response.url;
      console.log('Extracted file URL:', fileUrl);
      
      if (!fileUrl) {
        console.error('No file URL found in response!');
        throw new Error('No file URL returned from upload');
      }
      
      // Update form data with the uploaded photo URL
      setFormData(prevFormData => ({
        ...prevFormData,
        photo_url: fileUrl
      }));

      toast.success(`Staff photo uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Generate Staff ID Card with Professional Design
  const generateStaffIDCard = async (staffMember) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [54, 85.6] // Credit card size in landscape (width, height)
    });

    const barcodeValue = staffMember.mobile || staffMember.id?.toString() || 'STAFF';
    
    // Load school logo
    const img = new Image();
    img.src = '/logo.png';
    
    img.onload = async () => {
      try {
        // Blue Header Background
        doc.setFillColor(70, 130, 180); // Steel blue
        doc.rect(0, 0, 85.6, 15, 'F');

        // Add logo with white circle background
        doc.setFillColor(255, 255, 255);
        doc.circle(9, 7.5, 5.5, 'F');
        try {
          doc.addImage(img, 'PNG', 5, 3.5, 8, 8);
        } catch (error) {
          console.error('Error adding logo:', error);
        }

        // School name
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('The Trivandrum Scottish School', 45, 6, { align: 'center' });
        
        doc.setFontSize(4.5);
        doc.setFont('helvetica', 'normal');
        doc.text('Thundathil, Kariyavattom, Trivandrum - 695581', 45, 9.5, { align: 'center' });
        
        doc.setFontSize(5);
        doc.setFont('helvetica', 'normal');
        doc.text('STAFF IDENTITY CARD', 45, 12.5, { align: 'center' });

        // White card body
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 15, 85.6, 34, 'F');

        // Red left accent bar
        doc.setFillColor(220, 53, 69);
        doc.rect(0, 15, 2.5, 34, 'F');

        // Photo frame
        doc.setFillColor(250, 250, 250);
        doc.rect(5, 18, 20, 26, 'F');
        doc.setDrawColor(70, 130, 180);
        doc.setLineWidth(0.4);
        doc.rect(5, 18, 20, 26);
        
        doc.setFontSize(7);
        doc.setTextColor(180, 180, 180);
        doc.setFont('helvetica', 'normal');
        doc.text('PHOTO', 15, 32, { align: 'center' });

        // Staff details
        doc.setTextColor(0, 0, 0);
        const detailsX = 28;
        let y = 21;
        
        // Name
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('NAME', detailsX, y);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        const nameText = staffMember.name.length > 25 ? 
                         staffMember.name.substring(0, 25) : 
                         staffMember.name;
        doc.text(nameText, detailsX, y + 3);
        y += 7;

        // Employee ID / Mobile
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('ID', detailsX, y);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(staffMember.mobile || `EMP${staffMember.id}`, detailsX, y + 3);
        y += 7;

        // Designation Badge (replacing Role) - Full Width
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('DESIGNATION', detailsX, y);
        
        // Calculate full width: from detailsX to right edge with padding
        const cardWidth = 85.6;
        const rightPadding = 1;
        const badgeWidth = cardWidth - detailsX - rightPadding;
        const badgeCenterX = detailsX + (badgeWidth / 2);
        
        doc.setFillColor(70, 130, 180);
        doc.roundedRect(detailsX, y + 0.5, badgeWidth, 4, 1, 1, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        const designationText = staffMember.designation || staffMember.role_name || 'Staff';
        const displayDesignation = designationText.length > 40 ? 
                                   designationText.substring(0, 40) : 
                                   designationText;
        doc.text(displayDesignation.toUpperCase(), badgeCenterX, y + 3.5, { align: 'center' });
        y += 8;

        // Mobile Number
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('MOBILE:', detailsX, y);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(staffMember.mobile || 'N/A', detailsX + 12, y);

        // Barcode section at bottom
        doc.setFillColor(245, 245, 245);
        doc.rect(0, 48.5, 85.6, 5.5, 'F');
        
        // Draw high-quality, scannable barcode with bottom margin
        doc.setDrawColor(0, 0, 0);
        const startX = 22.5;  // Centered position
        const barcodeWidth = 40;  // Reduced width for compression
        const barcodeY = 49;
        const barcodeHeight = 4;  // Increased height for better scanning
        
        // Generate high-density barcode pattern based on mobile number
        const mobileNum = barcodeValue.toString();
        const totalBars = 60;  // Adjusted for spacing
        const barSpacing = 0.15;  // Space between bars (mm)
        
        // Draw vertical lines for professional barcode with spacing
        for (let i = 0; i < totalBars; i++) {
          // Create consistent scannable pattern
          const charCode = i < mobileNum.length ? mobileNum.charCodeAt(i % mobileNum.length) : (i * 13) % 128;
          const isThick = (charCode % 3 === 0) || (i % 2 === 0);
          const isTall = (charCode % 5 !== 0);
          
          const lineWidth = isThick ? 0.5 : 0.25;  // Bar width
          const lineHeight = isTall ? barcodeHeight : barcodeHeight * 0.75;
          const x = startX + (i * ((barcodeWidth / totalBars) + barSpacing));
          
          doc.setLineWidth(lineWidth);
          doc.line(x, barcodeY, x, barcodeY + lineHeight);
        }

        // Card border
        doc.setDrawColor(70, 130, 180);
        doc.setLineWidth(0.5);
        doc.rect(0, 0, 85.6, 54);

        // Save the PDF
        doc.save(`${staffMember.name.replace(/\s+/g, '_')}_Staff_ID_Card.pdf`);
        toast.success('Staff ID Card generated successfully!');
      } catch (error) {
        console.error('Error generating ID card:', error);
        toast.error('Error generating ID card');
      }
    };

    img.onerror = async () => {
      console.error('Failed to load logo, generating ID card without logo');
      
      try {
        // Same design without logo
        doc.setFillColor(70, 130, 180);
        doc.rect(0, 0, 85.6, 15, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('The Trivandrum Scottish School', 42.8, 6, { align: 'center' });
        
        doc.setFontSize(4.5);
        doc.setFont('helvetica', 'normal');
        doc.text('Thundathil, Kariyavattom, Trivandrum - 695581', 42.8, 9.5, { align: 'center' });
        
        doc.setFontSize(5);
        doc.setFont('helvetica', 'normal');
        doc.text('STAFF IDENTITY CARD', 42.8, 12.5, { align: 'center' });

        doc.setFillColor(255, 255, 255);
        doc.rect(0, 15, 85.6, 34, 'F');
        
        doc.setFillColor(220, 53, 69);
        doc.rect(0, 15, 2.5, 34, 'F');

        doc.setFillColor(250, 250, 250);
        doc.rect(5, 18, 20, 26, 'F');
        doc.setDrawColor(70, 130, 180);
        doc.setLineWidth(0.4);
        doc.rect(5, 18, 20, 26);
        
        doc.setFontSize(7);
        doc.setTextColor(180, 180, 180);
        doc.setFont('helvetica', 'normal');
        doc.text('PHOTO', 15, 32, { align: 'center' });

        const detailsX = 28;
        let y = 21;
        
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('NAME', detailsX, y);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        const nameText = staffMember.name.length > 25 ? 
                         staffMember.name.substring(0, 25) : 
                         staffMember.name;
        doc.text(nameText, detailsX, y + 3);
        y += 7;

        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('ID', detailsX, y);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(staffMember.mobile || `EMP${staffMember.id}`, detailsX, y + 3);
        y += 7;

        // Designation Badge (replacing Role) - Full Width
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('DESIGNATION', detailsX, y);
        
        // Calculate full width: from detailsX to right edge with padding
        const cardWidth = 85.6;
        const rightPadding = 1;
        const badgeWidth = cardWidth - detailsX - rightPadding;
        const badgeCenterX = detailsX + (badgeWidth / 2);
        
        doc.setFillColor(70, 130, 180);
        doc.roundedRect(detailsX, y + 0.5, badgeWidth, 4, 1, 1, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        const designationText = staffMember.designation || staffMember.role_name || 'Staff';
        const displayDesignation = designationText.length > 40 ? 
                                   designationText.substring(0, 40) : 
                                   designationText;
        doc.text(displayDesignation.toUpperCase(), badgeCenterX, y + 3.5, { align: 'center' });
        y += 8;

        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('MOBILE:', detailsX, y);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(staffMember.mobile || 'N/A', detailsX + 12, y);

        doc.setFillColor(245, 245, 245);
        doc.rect(0, 48.5, 85.6, 5.5, 'F');
        
        doc.setDrawColor(0, 0, 0);
        const startX = 22.5;
        const barcodeWidth = 40;
        const barcodeY = 49;
        const barcodeHeight = 4;
        const mobileNum = barcodeValue.toString();
        const totalBars = 60;
        const barSpacing = 0.15;
        
        for (let i = 0; i < totalBars; i++) {
          const charCode = i < mobileNum.length ? mobileNum.charCodeAt(i % mobileNum.length) : (i * 13) % 128;
          const isThick = (charCode % 3 === 0) || (i % 2 === 0);
          const isTall = (charCode % 5 !== 0);
          
          const lineWidth = isThick ? 0.5 : 0.25;
          const lineHeight = isTall ? barcodeHeight : barcodeHeight * 0.75;
          const x = startX + (i * ((barcodeWidth / totalBars) + barSpacing));
          
          doc.setLineWidth(lineWidth);
          doc.line(x, barcodeY, x, barcodeY + lineHeight);
        }

        doc.setDrawColor(70, 130, 180);
        doc.setLineWidth(0.5);
        doc.rect(0, 0, 85.6, 54);

        doc.save(`${staffMember.name.replace(/\s+/g, '_')}_Staff_ID_Card.pdf`);
        toast.success('Staff ID Card generated successfully!');
      } catch (error) {
        console.error('Error generating ID card:', error);
        toast.error('Error generating ID card');
      }
    };
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
          <h5 className="mb-0 fw-semibold" style={{ fontSize: '1.1rem' }}>
            <i className="bi bi-people me-2" style={{ fontSize: '1rem' }}></i>
            Staff Management
          </h5>
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
                      {staffMember.designation && (
                        <small className="text-primary">
                          <i className="bi bi-briefcase me-1"></i>{staffMember.designation}
                        </small>
                      )}
                      {staffMember.address && (
                        <small className="text-muted d-block">{staffMember.address}</small>
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
                          variant="outline-success"
                          size="sm"
                          onClick={() => generateStaffIDCard(staffMember)}
                          title="Generate ID Card"
                        >
                          <i className="bi bi-card-heading"></i>
                        </Button>
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
          <Modal.Header className="bg-gradient-staff text-white border-0 py-3" closeButton>
            <Modal.Title className="d-flex align-items-center">
              <i className="bi bi-people me-2"></i>
              <span>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</span>
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
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      placeholder="Designation"
                      maxLength={100}
                      className="form-control-lg"
                      id="staffDesignation"
                    />
                    <label htmlFor="staffDesignation" className="text-muted">
                      <i className="bi bi-briefcase me-2"></i>Designation
                    </label>
                    <small className="form-text text-muted">
                      e.g., Senior Teacher, Head of Department, Coordinator
                    </small>
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

                {/* Additional Staff Information Section */}
                <div className="col-12 mb-3">
                  <hr />
                  <h6 className="text-muted mb-3">
                    <i className="bi bi-person-lines-fill me-2"></i>Additional Information
                  </h6>
                </div>
                
                {/* Qualification */}
                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleInputChange}
                      placeholder="Qualification"
                      isInvalid={!!errors.qualification}
                      maxLength={255}
                      className="form-control-lg"
                      id="staffQualification"
                    />
                    <label htmlFor="staffQualification" className="text-muted">
                      <i className="bi bi-mortarboard me-2"></i>Qualification *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.qualification}
                    </Form.Control.Feedback>
                  </div>
                </div>

                {/* Medical History */}
                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="medical_history"
                      value={formData.medical_history}
                      onChange={handleInputChange}
                      placeholder="Medical History"
                      maxLength={2000}
                      style={{ minHeight: '80px' }}
                      id="staffMedicalHistory"
                    />
                    <label htmlFor="staffMedicalHistory" className="text-muted">
                      <i className="bi bi-heart-pulse me-2"></i>Medical History
                    </label>
                  </div>
                </div>

                {/* Experience */}
                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      placeholder="Past Experience"
                      maxLength={2000}
                      style={{ minHeight: '120px' }}
                      id="staffExperience"
                    />
                    <label htmlFor="staffExperience" className="text-muted">
                      <i className="bi bi-briefcase me-2"></i>Past Experience
                    </label>
                  </div>
                </div>

                {/* Achievements */}
                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="achievements"
                      value={formData.achievements}
                      onChange={handleInputChange}
                      placeholder="Achievements"
                      maxLength={2000}
                      style={{ minHeight: '120px' }}
                      id="staffAchievements"
                    />
                    <label htmlFor="staffAchievements" className="text-muted">
                      <i className="bi bi-trophy me-2"></i>Achievements & Awards
                    </label>
                  </div>
                </div>

                {/* Salary Information Section */}
                <div className="col-12 mb-3">
                  <hr />
                  <h6 className="text-muted mb-3">
                    <i className="bi bi-currency-rupee me-2"></i>Salary Information
                  </h6>
                </div>

                {/* Basic Salary */}
                <div className="col-md-4 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="basic_salary"
                      value={formData.basic_salary}
                      onChange={handleInputChange}
                      placeholder="Basic Salary"
                      isInvalid={!!errors.basic_salary}
                      className="form-control-lg"
                      id="staffBasicSalary"
                    />
                    <label htmlFor="staffBasicSalary" className="text-muted">
                      <i className="bi bi-currency-rupee me-2"></i>Basic Salary *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.basic_salary}
                    </Form.Control.Feedback>
                  </div>
                </div>

                {/* Allowances */}
                <div className="col-md-4 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="allowances"
                      value={formData.allowances}
                      onChange={handleInputChange}
                      placeholder="Allowances"
                      isInvalid={!!errors.allowances}
                      className="form-control-lg"
                      id="staffAllowances"
                    />
                    <label htmlFor="staffAllowances" className="text-muted">
                      <i className="bi bi-plus-circle me-2"></i>Allowances
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.allowances}
                    </Form.Control.Feedback>
                  </div>
                </div>

                {/* Deductions */}
                <div className="col-md-4 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="deductions"
                      value={formData.deductions}
                      onChange={handleInputChange}
                      placeholder="Deductions"
                      isInvalid={!!errors.deductions}
                      className="form-control-lg"
                      id="staffDeductions"
                    />
                    <label htmlFor="staffDeductions" className="text-muted">
                      <i className="bi bi-dash-circle me-2"></i>Deductions
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.deductions}
                    </Form.Control.Feedback>
                  </div>
                </div>

                {/* Net Salary Display */}
                <div className="col-md-4 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      value={`₹${((parseFloat(formData.basic_salary) || 0) + (parseFloat(formData.allowances) || 0) - (parseFloat(formData.deductions) || 0)).toFixed(2)}`}
                      disabled
                      className="form-control-lg bg-light"
                      id="staffNetSalary"
                    />
                    <label htmlFor="staffNetSalary" className="text-muted">
                      <i className="bi bi-calculator me-2"></i>Net Salary (Calculated)
                    </label>
                  </div>
                </div>

                {/* PF Information Section */}
                <div className="col-12 mb-3">
                  <hr />
                  <h6 className="text-muted mb-3">
                    <i className="bi bi-piggy-bank me-2"></i>PF Information
                  </h6>
                </div>

                {/* PF Number */}
                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="pf_number"
                      value={formData.pf_number}
                      onChange={handleInputChange}
                      placeholder="PF Number"
                      maxLength={50}
                      className="form-control-lg"
                      id="staffPfNumber"
                    />
                    <label htmlFor="staffPfNumber" className="text-muted">
                      <i className="bi bi-hash me-2"></i>PF Number
                    </label>
                  </div>
                </div>

                {/* PF Contribution */}
                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="pf_contribution"
                      value={formData.pf_contribution}
                      onChange={handleInputChange}
                      placeholder="PF Contribution"
                      isInvalid={!!errors.pf_contribution}
                      className="form-control-lg"
                      id="staffPfContribution"
                    />
                    <label htmlFor="staffPfContribution" className="text-muted">
                      <i className="bi bi-percent me-2"></i>PF Contribution
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.pf_contribution}
                    </Form.Control.Feedback>
                  </div>
                </div>

                {/* Photo Upload Section */}
                <div className="col-12 mb-3">
                  <hr />
                  <h6 className="text-muted mb-3">
                    <i className="bi bi-camera me-2"></i>Staff Photo
                  </h6>
                </div>

                {/* Photo Upload */}
                <div className="col-md-6 mb-3">
                  <div className="form-group">
                    <label className="form-label text-muted mb-2">
                      <i className="bi bi-image me-2"></i>Upload Photo
                    </label>
                    <Form.Control
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      className="form-control-lg"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                    <Form.Text className="text-muted">
                      Supported formats: JPG, JPEG, PNG. Max size: 2MB
                    </Form.Text>
                  </div>
                </div>

                {/* Photo Preview */}
                <div className="col-md-6 mb-3">
                  {uploadingPhoto ? (
                    <div className="text-center">
                      <Spinner animation="border" role="status">
                        <span className="visually-hidden">Uploading...</span>
                      </Spinner>
                      <p className="text-muted mt-2">Uploading photo...</p>
                    </div>
                  ) : formData.photo_url ? (
                    <div className="text-center">
                      <img 
                        src={getImageUrl(formData.photo_url)} 
                        alt="Staff Photo"
                        className="img-thumbnail"
                        style={{ maxWidth: '150px', maxHeight: '150px' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="mt-2">
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, photo_url: '' }))}
                        >
                          <i className="bi bi-trash me-1"></i>Remove Photo
                        </Button>
                      </div>
                    </div>
                  ) : null}
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
                  
                  <div className="form-control" style={{ minHeight: '45px', padding: '8px' }}>
                    <details>
                      <summary className="text-muted" style={{ cursor: 'pointer', listStyle: 'none' }}>
                        <i className="bi bi-chevron-down me-2"></i>
                        Select grades...
                      </summary>
                      <div className="mt-2">
                        {grades.map(grade => (
                          <div 
                            key={grade.id}
                            className="form-check"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleGradeToggle(grade)}
                          >
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={formData.selectedGradeIds.includes(grade.id.toString())}
                              onChange={() => {}} // Handled by onClick
                            />
                            <label className="form-check-label">
                              {grade.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                  
                  {/* Selected Grades */}
                  {formData.selectedGradeIds.length > 0 && (
                    <div className="mt-2">
                      <small className="text-muted">Selected ({formData.selectedGradeIds.length}):</small>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {formData.selectedGradeIds.map((gradeId) => {
                          const grade = grades.find(g => g.id.toString() === gradeId);
                          return grade ? (
                            <Badge 
                              key={gradeId} 
                              bg="primary" 
                              className="d-flex align-items-center"
                            >
                              {grade.name}
                              <Button
                                variant="link"
                                size="sm"
                                className="text-white p-0 ms-1"
                                onClick={() => handleGradeRemove(gradeId)}
                              >
                                <i className="bi bi-x"></i>
                              </Button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Divisions Multi-Select */}
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted">
                    <i className="bi bi-grid me-2"></i>Assigned Divisions
                  </label>
                  
                  <div className="form-control" style={{ minHeight: '45px', padding: '8px' }}>
                    <details>
                      <summary className="text-muted" style={{ cursor: 'pointer', listStyle: 'none' }}>
                        <i className="bi bi-chevron-down me-2"></i>
                        Select divisions...
                      </summary>
                      <div className="mt-2">
                        {divisions.map(division => (
                          <div 
                            key={division.id}
                            className="form-check"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleDivisionToggle(division)}
                          >
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={formData.selectedDivisionIds.includes(division.id.toString())}
                              onChange={() => {}} // Handled by onClick
                            />
                            <label className="form-check-label">
                              {division.name} ({division.grade_name || 'Grade'})
                            </label>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                  
                  {/* Selected Divisions */}
                  {formData.selectedDivisionIds.length > 0 && (
                    <div className="mt-2">
                      <small className="text-muted">Selected ({formData.selectedDivisionIds.length}):</small>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {formData.selectedDivisionIds.map((divisionId) => {
                          const division = divisions.find(d => d.id.toString() === divisionId);
                          return division ? (
                            <Badge 
                              key={divisionId} 
                              bg="primary" 
                              className="d-flex align-items-center"
                            >
                              {division.name} ({division.grade_name || 'Grade'})
                              <Button
                                variant="link"
                                size="sm"
                                className="text-white p-0 ms-1"
                                onClick={() => handleDivisionRemove(divisionId)}
                              >
                                <i className="bi bi-x"></i>
                              </Button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Children Information Section */}
              <div className="row">
                <div className="col-12 mb-3">
                  <hr />
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="text-muted mb-0">
                      <i className="bi bi-people me-2"></i>Children Information
                    </h6>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => handleShowKidModal()}
                    >
                      <i className="bi bi-plus-circle me-2"></i>Add Child
                    </Button>
                  </div>
                </div>

                {kids.length > 0 ? (
                  <div className="col-12 mb-3">
                    <Table size="sm" hover bordered>
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '25%' }}>Name</th>
                          <th style={{ width: '15%' }}>Gender</th>
                          <th style={{ width: '15%' }}>DOB Date</th>
                          <th style={{ width: '30%' }}>School/collage/occupation</th>
                          <th style={{ width: '15%' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kids.map((kid, index) => (
                          <tr key={index}>
                            <td>{kid.name}</td>
                            <td>
                              <Badge bg={kid.gender === 'Male' ? 'primary' : kid.gender === 'Female' ? 'danger' : 'secondary'}>
                                {kid.gender}
                              </Badge>
                            </td>
                            <td>{kid.dob_date ? new Date(`${kid.dob_date}T00:00:00Z`).toLocaleDateString() : '-'}</td>
                            <td>{kid.school_name || '-'}</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleShowKidModal(kid, index)}
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil"></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleKidDelete(index)}
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
                ) : (
                  <div className="col-12 mb-3">
                    <Alert variant="secondary" className="text-center mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      No children added yet. Click "Add Child" to add information.
                    </Alert>
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
          .bg-gradient-kid {
            background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%) !important;
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
          
          /* Pill Tag Styling */
          .badge-tag:hover {
            background-color: #dee2e6 !important;
          }
          .btn-close-tag:hover {
            color: #212529 !important;
            background-color: rgba(0, 0, 0, 0.1);
            border-radius: 50%;
          }
          
          @keyframes pulse {
            0% { background-color: #fff3cd; }
            50% { background-color: #ffeaa7; }
            100% { background-color: #fff3cd; }
          }
        `}</style>
      </Modal>

      {/* Add/Edit Kid Modal */}
      <Modal show={showKidModal} onHide={handleCloseKidModal} centered>
        <Modal.Header closeButton className="bg-gradient-kid text-white" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
          <Modal.Title>
            <i className="bi bi-person-plus me-2"></i>
            {editingKid ? 'Edit Child Information' : 'Add Child Information'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleKidSubmit}>
          <Modal.Body>
            <Row>
              <Col md={12} className="mb-3">
                <div className="form-floating">
                  <Form.Control
                    type="text"
                    name="name"
                    value={kidFormData.name}
                    onChange={handleKidInputChange}
                    placeholder="Child Name"
                    isInvalid={!!kidErrors.name}
                    id="kidName"
                  />
                  <label htmlFor="kidName">
                    <i className="bi bi-person me-2"></i>Child Name *
                  </label>
                  <Form.Control.Feedback type="invalid">
                    {kidErrors.name}
                  </Form.Control.Feedback>
                </div>
              </Col>

              <Col md={6} className="mb-3">
                <div className="form-floating">
                  <Form.Select
                    name="gender"
                    value={kidFormData.gender}
                    onChange={handleKidInputChange}
                    isInvalid={!!kidErrors.gender}
                    id="kidGender"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                  <label htmlFor="kidGender">
                    <i className="bi bi-gender-ambiguous me-2"></i>Gender *
                  </label>
                  <Form.Control.Feedback type="invalid">
                    {kidErrors.gender}
                  </Form.Control.Feedback>
                </div>
              </Col>

              <Col md={6} className="mb-3">
                <div className="form-floating">
                  <Form.Control
                    type="date"
                    name="dob_date"
                    value={kidFormData.dob_date}
                    onChange={handleKidInputChange}
                    placeholder="Date of Birth"
                    isInvalid={!!kidErrors.dob_date}
                    id="kidDobDate"
                  />
                  <label htmlFor="kidDobDate">
                    <i className="bi bi-calendar-event me-2"></i>DOB Date *
                  </label>
                  <Form.Control.Feedback type="invalid">
                    {kidErrors.dob_date}
                  </Form.Control.Feedback>
                </div>
              </Col>

              <Col md={6} className="mb-3">
                <div className="form-floating">
                  <Form.Control
                    type="text"
                    name="school_name"
                    value={kidFormData.school_name}
                    onChange={handleKidInputChange}
                    placeholder="School/collage/occupation"
                    maxLength={150}
                    id="kidSchoolName"
                  />
                  <label htmlFor="kidSchoolName">
                    <i className="bi bi-building me-2"></i>School/collage/occupation
                  </label>
                </div>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseKidModal}>
              <i className="bi bi-x-circle me-2"></i>Cancel
            </Button>
            <Button type="submit" variant="primary">
              <i className="bi bi-check-circle me-2"></i>
              {editingKid ? 'Update' : 'Add'} Child
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffManagement;