import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup, Accordion } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typeahead } from 'react-bootstrap-typeahead';
import jsPDF from 'jspdf';
import { apiService } from '../../services/api';
import { useAcademicYear } from '../../contexts/AcademicYearContext';
import { useAuth } from '../../contexts/AuthContext';
import { ENV_CONFIG } from '../../config/environment';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import AcademicYearSelector from '../../components/common/AcademicYearSelector';
import FeeCollectionModal from '../../components/common/FeeCollectionModal';
import useWindowsModalFix from '../../hooks/useWindowsModalFix';
import 'react-bootstrap-typeahead/css/Typeahead.css';

// Allergies options for multi-select dropdown
const ALLERGIES_OPTIONS = [
  'No known allergies',
  'Peanut',
  'Tree nuts (Almond/Cashew/Walnut/Pistachio/Hazelnut/Pecan)',
  'Milk/Dairy',
  'Egg',
  'Soy',
  'Wheat/Gluten',
  'Fish',
  'Shellfish (Prawn/Shrimp/Crab/Lobster)',
  'Sesame',
  'Mustard',
  'Chickpea/Gram/Besan',
  'Lentils/Pulses',
  'Food colours/preservatives',
  'House dust mite',
  'Pollen (Grass/Tree/Weed)',
  'Mold/Fungi',
  'Animal dander (Cat/Dog)',
  'Cockroach',
  'Bee/Wasp sting',
  'Other insect bite (severe)',
  'Penicillin/Amoxicillin',
  'NSAIDs (Ibuprofen/Aspirin)',
  'Sulfa drugs',
  'Other antibiotic',
  'Latex',
  'Nickel',
  'Fragrances/Cosmetics/Adhesives',
  'Gelatin (vaccine)',
  'Egg-protein (vaccine)',
  'Other (specify)',
  'Unknown/Not sure'
];

const StudentManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getAcademicYearId } = useAcademicYear();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

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
    pincode: '',
    occupation: '',
    current_employment: '',
    company_name: '',
    best_contact_day: '',
    best_contact_time: '',
    kid_likes: '',
    kid_dislikes: '',
    kid_aspirations: '',
    id_proof: '',
    address_proof: '',
    parent_photo: ''
  });
  const [parentErrors, setParentErrors] = useState({});
  const [parentUploadingDocument, setParentUploadingDocument] = useState(false);
  const [parentPreviewUrls, setParentPreviewUrls] = useState({
    parent_photo: null,
    id_proof: null,
    address_proof: null
  });
  const [parentUploadedFiles, setParentUploadedFiles] = useState({
    parent_photo: '',
    id_proof: '',
    address_proof: ''
  });
  const parentFileUrls = useRef({
    parent_photo: '',
    id_proof: '',
    address_proof: ''
  });
  const [formData, setFormData] = useState({
    student_name: '',
    grade_id: '',
    division_id: '',
    roll_number: '',
    aadhaar: '',
    residential_address: '',
    pincode: '',
    sam_samagrah_id: '',
    aapar_id: '',
    admission_date: '',
    parent_id: '',
    // Emergency Contact
    emergency_contact_number: '',
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    gender: '',
    // Travel Mode
    travel_mode: '',
    // Medical Information
    allergies: [],
    diabetic: false,
    lifestyle_diseases: '',
    asthmatic: false,
    phobia: false,
    special_need: '',
    // Family Doctor
    doctor_name: '',
    doctor_contact: '',
    clinic_address: '',
    // Blood Group
    blood_group: '',
    // Documents
    student_photo_url: '',
    id_proof_url: '',
    address_proof_url: '',
    // Student Aspirations
    student_aspirations: ''
  });
  const [errors, setErrors] = useState({});
  const [semesterFees, setSemesterFees] = useState(null);
  const [, setShowSemesterFees] = useState(false);
  
  // File upload states
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [previewUrls, setPreviewUrls] = useState({
    student_photo: null,
    id_proof: null,
    address_proof: null
  });
  const [existingAadhaarMasked, setExistingAadhaarMasked] = useState('');
  
  // Global storage for uploaded file URLs that persists across renders
  const [uploadedFiles, setUploadedFiles] = useState({
    student_photo_url: '',
    id_proof_url: '',
    address_proof_url: ''
  });
  
  // Ref to track current file URLs to avoid React state timing issues
  const currentFileUrls = useRef({
    student_photo_url: '',
    id_proof_url: '',
    address_proof_url: ''
  });
  
  // Medical accordion state
  const [showMedicalInfo, setShowMedicalInfo] = useState(false);
  
  // Payment history modal states
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState(null);

  // Fee collection modal states
  const [showFeeCollectionModal, setShowFeeCollectionModal] = useState(false);
  const [selectedStudentForFeeCollection, setSelectedStudentForFeeCollection] = useState(null);

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

  // Fetch semester fees for selected grade only
  const { data: semesterFeesData, isLoading: feesLoading } = useQuery({
    queryKey: ['semester-fees', formData.grade_id],
    queryFn: async () => {
      if (!formData.grade_id) return null;
      const params = new URLSearchParams({
        grade_id: formData.grade_id
      });
      const response = await apiService.get(`/api/admin/semester_fees?${params}`);
      return response.data;
    },
    enabled: !!formData.grade_id
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
      console.log('=== EDIT STUDENT DEBUG ===');
      console.log('Student data:', student);
      console.log('Raw allergies from DB:', student.allergies);
      console.log('Allergies type:', typeof student.allergies);
      
      setEditingStudent(student);
      
      const parsedAllergies = (() => {
        try {
          if (!student.allergies) {
            console.log('No allergies data');
            return [];
          }
          if (Array.isArray(student.allergies)) {
            console.log('Allergies already an array:', student.allergies);
            return student.allergies;
          }
          const parsed = JSON.parse(student.allergies);
          console.log('Parsed allergies:', parsed);
          console.log('Is parsed array?', Array.isArray(parsed));
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error('Error parsing allergies:', e, student.allergies);
          return [];
        }
      })();
      
      console.log('Final allergies for formData:', parsedAllergies);
      
      setFormData({
        student_name: student.student_name,
        grade_id: student.grade_id ? student.grade_id.toString() : '',
        division_id: student.division_id ? student.division_id.toString() : '',
        roll_number: student.roll_number,
        aadhaar: '',
        residential_address: student.residential_address || '',
        pincode: student.pincode || '',
        sam_samagrah_id: student.sam_samagrah_id || '',
        aapar_id: student.aapar_id || '',
        admission_date: student.admission_date ? student.admission_date.split(' ')[0] : '',
        parent_id: student.parent_id ? student.parent_id.toString() : '',
        // Emergency Contact
        emergency_contact_number: student.emergency_contact_number || '',
        emergency_contact_name: student.emergency_contact_name || '',
        emergency_contact_relationship: student.emergency_contact_relationship || '',
        gender: student.gender || '',
        // Travel Mode
        travel_mode: student.travel_mode || '',
        // Medical Information
        allergies: parsedAllergies,
        diabetic: student.diabetic === 1 || student.diabetic === '1',
        lifestyle_diseases: student.lifestyle_diseases || '',
        asthmatic: student.asthmatic === 1 || student.asthmatic === '1',
        phobia: student.phobia === 1 || student.phobia === '1',
        special_need: student['special need'] || '',
        // Family Doctor
        doctor_name: student.doctor_name || '',
        doctor_contact: student.doctor_contact || '',
        clinic_address: student.clinic_address || '',
        // Blood Group
        blood_group: student.blood_group || '',
        // Documents
        student_photo_url: student.student_photo_url || '',
        id_proof_url: student.id_proof_url || '',
        address_proof_url: student.address_proof_url || '',
        // Student Aspirations
        student_aspirations: student.student_aspirations || ''
      });
      setExistingAadhaarMasked(student.aadhaar_masked || '');
      
      // Sync all file URL storage with existing student data
      const existingUrls = {
        student_photo_url: student.student_photo_url || '',
        id_proof_url: student.id_proof_url || '',
        address_proof_url: student.address_proof_url || ''
      };
      
      currentFileUrls.current = existingUrls;
      setUploadedFiles(existingUrls);
      
      // Set preview URLs if documents exist (process through getImageUrl for correct base URL)
      setPreviewUrls({
        student_photo: student.student_photo_url ? getImageUrl(student.student_photo_url) : null,
        id_proof: student.id_proof_url ? getImageUrl(student.id_proof_url) : null,
        address_proof: student.address_proof_url ? getImageUrl(student.address_proof_url) : null
      });
    } else {
      console.log('=== CREATE NEW STUDENT ===');
      setEditingStudent(null);
      setFormData({
        student_name: '',
        grade_id: selectedGrade || '',
        division_id: selectedDivision || '',
        roll_number: '',
        aadhaar: '',
        residential_address: '',
        pincode: '',
        sam_samagrah_id: '',
        aapar_id: '',
        admission_date: '',
        parent_id: '',
        // Emergency Contact
        emergency_contact_number: '',
        emergency_contact_name: '',
        emergency_contact_relationship: '',
        gender: '',
        // Travel Mode
        travel_mode: '',
        // Medical Information
        allergies: [],
        diabetic: false,
        lifestyle_diseases: '',
        asthmatic: false,
        phobia: false,
        special_need: '',
        // Family Doctor
        doctor_name: '',
        doctor_contact: '',
        clinic_address: '',
        // Blood Group
        blood_group: '',
        // Documents
        student_photo_url: '',
        id_proof_url: '',
        address_proof_url: '',
        // Student Aspirations
        student_aspirations: ''
      });
      setExistingAadhaarMasked('');
      
      // Reset all file URL storage for new student
      const emptyUrls = {
        student_photo_url: '',
        id_proof_url: '',
        address_proof_url: ''
      };
      
      currentFileUrls.current = emptyUrls;
      setUploadedFiles(emptyUrls);
      localStorage.removeItem('student_form_files');
      
      setPreviewUrls({
        student_photo: null,
        id_proof: null,
        address_proof: null
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
      aadhaar: '',
      residential_address: '',
      pincode: '',
      sam_samagrah_id: '',
      aapar_id: '',
      admission_date: '',
      parent_id: '',
      emergency_contact_number: '',
      emergency_contact_name: '',
      emergency_contact_relationship: '',
      gender: '',
      travel_mode: '',
      allergies: [],
      diabetic: false,
      lifestyle_diseases: '',
      asthmatic: false,
      phobia: false,
      special_need: '',
      doctor_name: '',
      doctor_contact: '',
      clinic_address: '',
      blood_group: '',
      student_photo_url: '',
      id_proof_url: '',
      address_proof_url: '',
      student_aspirations: ''
    });
    setExistingAadhaarMasked('');
    setErrors({});
    setSemesterFees(null);
    setShowSemesterFees(false);
    setPreviewUrls({
      student_photo: null,
      id_proof: null,
      address_proof: null
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = name === 'aadhaar' ? value.replace(/[^0-9]/g, '') : value;
    setFormData(prev => ({ ...prev, [name]: updatedValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAllergyToggle = (allergy) => {
    setFormData(prev => {
      const currentAllergies = Array.isArray(prev.allergies) ? prev.allergies : [];
      const exists = currentAllergies.includes(allergy);
      const updated = exists
        ? currentAllergies.filter(item => item !== allergy)
        : [...currentAllergies, allergy];
      return { ...prev, allergies: updated };
    });
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
    if (formData.aadhaar && !/^[0-9]{12}$/.test(formData.aadhaar)) {
      newErrors.aadhaar = 'Aadhaar number must be 12 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted');
    console.log('Form data:', formData);
    
    if (!validateForm()) {
      console.log('Validation failed', errors);
      return;
    }

    console.log('Validation passed');

    // Log before creating submit data
    console.log('FormData before submit:', {
      student_photo_url: formData.student_photo_url,
      id_proof_url: formData.id_proof_url,
      address_proof_url: formData.address_proof_url
    });

    const submitData = {
      student_name: formData.student_name,
      grade_id: formData.grade_id,
      division_id: formData.division_id,
      roll_number: formData.roll_number,
      residential_address: formData.residential_address,
      pincode: formData.pincode,
      sam_samagrah_id: formData.sam_samagrah_id,
      aapar_id: formData.aapar_id,
      admission_date: formData.admission_date,
      parent_id: parseInt(formData.parent_id),
      academic_year_id: getAcademicYearId(),
      // Emergency Contact
      emergency_contact_number: formData.emergency_contact_number,
      emergency_contact_name: formData.emergency_contact_name,
      emergency_contact_relationship: formData.emergency_contact_relationship,
      gender: formData.gender,
      // Travel Mode
      travel_mode: formData.travel_mode,
      // Medical Information
      allergies: JSON.stringify(formData.allergies),
      diabetic: formData.diabetic ? '1' : '0',
      lifestyle_diseases: formData.lifestyle_diseases,
      asthmatic: formData.asthmatic ? '1' : '0',
      phobia: formData.phobia ? '1' : '0',
      // Family Doctor
      doctor_name: formData.doctor_name,
      doctor_contact: formData.doctor_contact,
      clinic_address: formData.clinic_address,
      // Blood Group
      blood_group: formData.blood_group,
      // Documents - Use multiple fallbacks to ensure URLs are included
      student_photo_url: uploadedFiles.student_photo_url || currentFileUrls.current.student_photo_url || formData.student_photo_url || '',
      id_proof_url: uploadedFiles.id_proof_url || currentFileUrls.current.id_proof_url || formData.id_proof_url || '',
      address_proof_url: uploadedFiles.address_proof_url || currentFileUrls.current.address_proof_url || formData.address_proof_url || '',
      // Student Aspirations
      student_aspirations: formData.student_aspirations,
      special_need: formData.special_need
    };

    if (formData.aadhaar && formData.aadhaar.trim() !== '') {
      submitData.aadhaar = formData.aadhaar.trim();
    }

    console.log('=== COMPREHENSIVE FORM SUBMISSION DEBUG ===');
    console.log('1. FormData state:', {
      student_photo_url: formData.student_photo_url,
      id_proof_url: formData.id_proof_url,
      address_proof_url: formData.address_proof_url,
      student_aspirations: formData.student_aspirations
    });
    console.log('2. UploadedFiles state:', uploadedFiles);
    console.log('3. CurrentFileUrls ref:', currentFileUrls.current);
    console.log('4. LocalStorage backup:', JSON.parse(localStorage.getItem('student_form_files') || '{}'));
    console.log('5. FINAL submitData URLs:', {
      student_photo_url: submitData.student_photo_url,
      id_proof_url: submitData.id_proof_url,
      address_proof_url: submitData.address_proof_url,
      student_aspirations: submitData.student_aspirations
    });
    console.log('6. Full submit data:', submitData);
    
    // Alert if URLs are still empty
    if (!submitData.student_photo_url && !submitData.id_proof_url && !submitData.address_proof_url) {
      console.warn('⚠️ WARNING: No file URLs found in submit data!');
    } else {
      console.log('✅ File URLs found in submit data');
    }
    console.log('=== END DEBUG ===');

    if (editingStudent) {
      console.log('Updating student:', editingStudent.id);
      updateMutation.mutate({ id: editingStudent.id, data: submitData });
    } else {
      console.log('Creating new student');
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
      pincode: '',
      occupation: '',
      current_employment: '',
      company_name: '',
      best_contact_day: '',
      best_contact_time: '',
      kid_likes: '',
      kid_dislikes: '',
      kid_aspirations: '',
      id_proof: '',
      address_proof: '',
      parent_photo: ''
    });
    setParentErrors({});
    parentFileUrls.current = {
      parent_photo: '',
      id_proof: '',
      address_proof: ''
    };
    setParentUploadedFiles({
      parent_photo: '',
      id_proof: '',
      address_proof: ''
    });
    setParentPreviewUrls({
      parent_photo: null,
      id_proof: null,
      address_proof: null
    });
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
      pincode: '',
      occupation: '',
      current_employment: '',
      company_name: '',
      best_contact_day: '',
      best_contact_time: '',
      kid_likes: '',
      kid_dislikes: '',
      kid_aspirations: '',
      id_proof: '',
      address_proof: '',
      parent_photo: ''
    });
    setParentErrors({});
    parentFileUrls.current = {
      parent_photo: '',
      id_proof: '',
      address_proof: ''
    };
    setParentUploadedFiles({
      parent_photo: '',
      id_proof: '',
      address_proof: ''
    });
    setParentPreviewUrls({
      parent_photo: null,
      id_proof: null,
      address_proof: null
    });
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
    
    const submitData = {
      ...parentFormData,
      parent_photo: parentUploadedFiles.parent_photo || parentFileUrls.current.parent_photo || parentFormData.parent_photo || '',
      id_proof: parentUploadedFiles.id_proof || parentFileUrls.current.id_proof || parentFormData.id_proof || '',
      address_proof: parentUploadedFiles.address_proof || parentFileUrls.current.address_proof || parentFormData.address_proof || ''
    };
    
    createParentMutation.mutate(submitData);
  };

  // Parent file upload handler
  const handleParentFileUpload = async (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    // Validate file type
    const allowedTypes = documentType === 'parent_photo'
      ? ['image/jpeg', 'image/jpg', 'image/png']
      : ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Allowed: ${documentType === 'parent_photo' ? 'JPG, PNG' : 'JPG, PNG, PDF'}`);
      return;
    }

    setParentUploadingDocument(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('document_type', documentType);

      const response = await apiService.uploadParentDocument(uploadFormData);

      const fileUrl = response.data?.url || response.url;

      if (!fileUrl) {
        throw new Error('No file URL returned from upload');
      }

      const fieldName = documentType === 'parent_photo' ? 'parent_photo' : documentType;

      // Triple update: ref, uploadedFiles state, and formData
      parentFileUrls.current[fieldName] = fileUrl;

      setParentUploadedFiles(prev => ({
        ...prev,
        [fieldName]: fileUrl
      }));

      setParentFormData(prevFormData => ({
        ...prevFormData,
        [fieldName]: fileUrl
      }));

      // Set preview URL
      setParentPreviewUrls(prev => ({
        ...prev,
        [documentType]: file.type.includes('pdf') ? fileUrl : URL.createObjectURL(file)
      }));

      toast.success('Document uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setParentUploadingDocument(false);
    }
  };

  // File upload handler
  const handleFileUpload = async (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    // Validate file type
    const allowedTypes = documentType === 'student_photo' 
      ? ['image/jpeg', 'image/jpg', 'image/png']
      : ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Allowed: ${documentType === 'student_photo' ? 'JPG, PNG' : 'JPG, PNG, PDF'}`);
      return;
    }

    setUploadingDocument(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('document_type', documentType);

      console.log('Uploading document type:', documentType);

      // Use the dedicated upload method
      const response = await apiService.uploadStudentDocument(uploadFormData);

      console.log('=== FILE UPLOAD COMPLETED ===');
      console.log('Upload response:', response);
      console.log('Document type:', documentType);
      
      // Fix: URL is in response.data.url, not response.url
      const fileUrl = response.data?.url || response.url;
      console.log('Extracted file URL:', fileUrl);
      
      if (!fileUrl) {
        console.error('❌ No file URL found in response!');
        console.log('Response structure:', JSON.stringify(response, null, 2));
        throw new Error('No file URL returned from upload');
      }
      
      // Map document type to correct form field name
      const fieldName = `${documentType}_url`;
      
      console.log('Setting field:', fieldName, 'to:', fileUrl);
      
      // Triple update: ref, formData, and separate uploadedFiles state
      currentFileUrls.current[fieldName] = fileUrl;
      
      // Update the dedicated uploaded files state
      setUploadedFiles(prev => ({
        ...prev,
        [fieldName]: fileUrl
      }));
      
      // Also update formData for consistency
      setFormData(prevFormData => ({
        ...prevFormData,
        [fieldName]: fileUrl
      }));
      
      console.log('=== FILE UPLOAD COMPLETED ===');
      console.log('Field:', fieldName);
      console.log('URL:', fileUrl);
      console.log('Stored in uploadedFiles state for form submission');
      
      // Store in localStorage as backup
      localStorage.setItem('student_form_files', JSON.stringify({
        ...JSON.parse(localStorage.getItem('student_form_files') || '{}'),
        [fieldName]: fileUrl
      }));

      // Set preview URL (ensure it has correct base URL)
      setPreviewUrls(prev => ({
        ...prev,
        [documentType]: getImageUrl(fileUrl)
      }));

      toast.success(`Document uploaded successfully! URL: ${fileUrl}`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to upload document');
    } finally {
      setUploadingDocument(false);
    }
  };

  // Generate Student ID Card with Professional Design
  const generateStudentIDCard = async (student) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [54, 85.6] // Credit card size in landscape (width, height)
    });

    const barcodeValue = student.roll_number || student.id?.toString() || 'STUDENT';
    
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
        doc.text('STUDENT IDENTITY CARD', 45, 12.5, { align: 'center' });

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
        
        // Load and add student photo if available
        if (student.student_photo_url) {
          try {
            let imageDataUrl = null;
            
            // Use the serve_file endpoint which has CORS headers
            try {
              const imagePath = student.student_photo_url.startsWith('/') ? student.student_photo_url : `/${student.student_photo_url}`;
              const axiosResponse = await apiService.api.get(`/api/admin/serve_file?path=${encodeURIComponent(imagePath)}`, {
                responseType: 'blob'
              });
              const blob = axiosResponse.data;
              imageDataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            } catch (serveError) {
              console.warn('Serve file endpoint failed, trying direct path:', serveError);
              // Fallback: try direct axios fetch
              try {
                const imagePath = student.student_photo_url.startsWith('/') ? student.student_photo_url.substring(1) : student.student_photo_url;
                const axiosResponse = await apiService.api.get(imagePath, {
                  responseType: 'blob'
                });
                const blob = axiosResponse.data;
                imageDataUrl = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });
              } catch (axiosError) {
                console.warn('Axios fetch also failed:', axiosError);
              }
            }
            
            if (imageDataUrl) {
              try {
                // Determine image format from filename or data URL
                const isPNG = student.student_photo_url.toLowerCase().includes('.png') ||
                            imageDataUrl.substring(5, 15).toLowerCase().includes('png');
                doc.addImage(imageDataUrl, isPNG ? 'PNG' : 'JPEG', 5.5, 18.5, 19, 25);
              } catch (addImageError) {
                console.error('Error adding student photo to PDF:', addImageError);
                doc.setFontSize(7);
                doc.setTextColor(180, 180, 180);
                doc.setFont('helvetica', 'normal');
                doc.text('PHOTO', 15, 32, { align: 'center' });
              }
            } else {
              // Failed to load image, show placeholder
              doc.setFontSize(7);
              doc.setTextColor(180, 180, 180);
              doc.setFont('helvetica', 'normal');
              doc.text('PHOTO', 15, 32, { align: 'center' });
            }
          } catch (error) {
            console.error('Error loading student photo:', error);
            doc.setFontSize(7);
            doc.setTextColor(180, 180, 180);
            doc.setFont('helvetica', 'normal');
            doc.text('PHOTO', 15, 32, { align: 'center' });
          }
        } else {
          // No photo available, show placeholder
          doc.setFontSize(7);
          doc.setTextColor(180, 180, 180);
          doc.setFont('helvetica', 'normal');
          doc.text('PHOTO', 15, 32, { align: 'center' });
        }

        // Student details
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
        const nameText = student.student_name.length > 25 ? 
                         student.student_name.substring(0, 25) : 
                         student.student_name;
        doc.text(nameText, detailsX, y + 3);
        y += 7;

        // Roll Number
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('ROLL NO', detailsX, y);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(student.roll_number, detailsX, y + 3);
        y += 7;

        // Class badge
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('CLASS', detailsX, y);
        
        doc.setFillColor(70, 130, 180);
        doc.roundedRect(detailsX, y + 0.5, 28, 4, 1, 1, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`${student.grade_name} - ${student.division_name}`, detailsX + 14, y + 3.5, { align: 'center' });
        y += 8;  // Increased top margin

        // Blood Group and Emergency Contact in single row
        const emergencyNumber = student.emergency_contact_number || formData.emergency_contact_number || 'N/A';
        const bloodGroup = student.blood_group || formData.blood_group || 'N/A';
        
        // Blood Group (Left side)
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('BLOOD:', detailsX, y);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 53, 69);
        doc.text(bloodGroup, detailsX + 10, y);
        
        // Emergency Contact (Right side)
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('EMERGENCY:', detailsX + 24, y);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(emergencyNumber, detailsX + 38, y);

        // Footer section at bottom
        doc.setFillColor(245, 245, 245);
        doc.rect(0, 48.5, 85.6, 5.5, 'F');
        
        // Draw high-quality, scannable footer with bottom margin
        doc.setDrawColor(0, 0, 0);
        const startX = 22.5;  // Centered position
        const footerWidth = 40;  // Reduced width for compression
        const footerY = 49;
        const footerHeight = 4;  // Increased height for better scanning
        
        // Generate high-density footer pattern based on roll number
        const rollNum = barcodeValue.toString();
        const totalBars = 60;  // Adjusted for spacing
        const barSpacing = 0.15;  // Space between bars (mm)
        
        // Draw vertical lines for professional footer with spacing
        for (let i = 0; i < totalBars; i++) {
          // Create consistent scannable pattern
          const charCode = i < rollNum.length ? rollNum.charCodeAt(i % rollNum.length) : (i * 13) % 128;
          const isThick = (charCode % 3 === 0) || (i % 2 === 0);
          const isTall = (charCode % 5 !== 0);
          
          const lineWidth = isThick ? 0.5 : 0.25;  // Bar width
          const lineHeight = isTall ? footerHeight : footerHeight * 0.75;
          const x = startX + (i * ((footerWidth / totalBars) + barSpacing));
          
          doc.setLineWidth(lineWidth);
          doc.line(x, footerY, x, footerY + lineHeight);
        }

        // Card border
        doc.setDrawColor(70, 130, 180);
        doc.setLineWidth(0.5);
        doc.rect(0, 0, 85.6, 54);

        // Save the PDF
        doc.save(`${student.student_name.replace(/\s+/g, '_')}_ID_Card.pdf`);
        toast.success('ID Card generated successfully!');
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
        doc.text('STUDENT IDENTITY CARD', 42.8, 12.5, { align: 'center' });

        doc.setFillColor(255, 255, 255);
        doc.rect(0, 15, 85.6, 34, 'F');
        
        doc.setFillColor(220, 53, 69);
        doc.rect(0, 15, 2.5, 34, 'F');

        doc.setFillColor(250, 250, 250);
        doc.rect(5, 18, 20, 26, 'F');
        doc.setDrawColor(70, 130, 180);
        doc.rect(5, 18, 20, 26);
        doc.setFontSize(7);
        doc.setTextColor(180, 180, 180);
        doc.text('PHOTO', 15, 32, { align: 'center' });

        const detailsX = 28;
        let y = 21;
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('NAME', detailsX, y);
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        doc.text(student.student_name.substring(0, 25), detailsX, y + 3);
        
        y += 7;
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        doc.text('ROLL NO', detailsX, y);
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        doc.text(student.roll_number, detailsX, y + 3);
        
        y += 7;
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        doc.text('CLASS', detailsX, y);
        doc.setFillColor(70, 130, 180);
        doc.roundedRect(detailsX, y + 0.5, 28, 4, 1, 1, 'F');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text(`${student.grade_name} - ${student.division_name}`, detailsX + 14, y + 3.5, { align: 'center' });
        y += 7;

        // Blood Group and Emergency Contact in single row
        const emergencyNumber = student.emergency_contact_number || formData.emergency_contact_number || 'N/A';
        const bloodGroup = student.blood_group || formData.blood_group || 'N/A';
        
        // Blood Group (Left side)
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('BLOOD:', detailsX, y);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 53, 69);
        doc.text(bloodGroup, detailsX + 10, y);
        
        // Emergency Contact (Right side)
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('EMERGENCY:', detailsX + 24, y);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(emergencyNumber, detailsX + 38, y);

        // Footer section
        doc.setFillColor(245, 245, 245);
        doc.rect(0, 48.5, 85.6, 5.5, 'F');
        
        // Draw high-quality, scannable footer with bottom margin
        doc.setDrawColor(0, 0, 0);
        const startX = 22.5;  // Centered position
        const footerWidth = 40;  // Reduced width for compression
        const footerY = 49;
        const footerHeight = 4;  // Increased height for better scanning
        
        // Generate high-density footer pattern based on roll number
        const rollNum = barcodeValue.toString();
        const totalBars = 60;  // Adjusted for spacing
        const barSpacing = 0.15;  // Space between bars (mm)
        
        // Draw vertical lines for professional footer with spacing
        for (let i = 0; i < totalBars; i++) {
          // Create consistent scannable pattern
          const charCode = i < rollNum.length ? rollNum.charCodeAt(i % rollNum.length) : (i * 13) % 128;
          const isThick = (charCode % 3 === 0) || (i % 2 === 0);
          const isTall = (charCode % 5 !== 0);
          
          const lineWidth = isThick ? 0.5 : 0.25;  // Bar width
          const lineHeight = isTall ? footerHeight : footerHeight * 0.75;
          const x = startX + (i * ((footerWidth / totalBars) + barSpacing));
          
          doc.setLineWidth(lineWidth);
          doc.line(x, footerY, x, footerY + lineHeight);
        }

        doc.setDrawColor(70, 130, 180);
        doc.setLineWidth(0.5);
        doc.rect(0, 0, 85.6, 54);

        doc.save(`${student.student_name.replace(/\s+/g, '_')}_ID_Card.pdf`);
        toast.success('ID Card generated successfully!');
      } catch (error) {
        console.error('Error in fallback generation:', error);
        toast.error('Error generating ID card');
      }
    };
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

  // Fee collection handlers
  const handleShowFeeCollection = (student) => {
    setSelectedStudentForFeeCollection(student);
    setShowFeeCollectionModal(true);
  };

  const handleCloseFeeCollection = () => {
    setShowFeeCollectionModal(false);
    setSelectedStudentForFeeCollection(null);
  };

  // PDF download handler
  const downloadPaymentHistoryPDF = (student, paymentData) => {
    // Calculate totals
    const totalPaid = paymentData.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const totalTransactions = paymentData.length;

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment History - ${student.student_name}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
          }
          .student-info { 
            background: #f8f9fa; 
            padding: 15px; 
            margin-bottom: 20px; 
            border-radius: 5px;
          }
          .summary { 
            display: flex; 
            justify-content: space-around; 
            margin: 20px 0; 
            padding: 15px;
            background: #e8f5e8;
            border-radius: 5px;
          }
          .summary-item { 
            text-align: center; 
          }
          .summary-value { 
            font-size: 18px; 
            font-weight: bold; 
            color: #28a745;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left;
          }
          th { 
            background-color: #f8f9fa; 
            font-weight: bold;
          }
          .amount { 
            text-align: right; 
            font-weight: bold;
            color: #28a745;
          }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            font-size: 12px; 
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Payment History Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="student-info">
          <h3>Student Information</h3>
          <p><strong>Name:</strong> ${student.student_name}</p>
          <p><strong>Roll Number:</strong> ${student.roll_number}</p>
          <p><strong>Grade:</strong> ${student.grade_name} - ${student.division_name}</p>
        </div>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-value">₹${totalPaid.toLocaleString()}</div>
            <div>Total Paid</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${totalTransactions}</div>
            <div>Transactions</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${totalTransactions}</div>
            <div>Completed</div>
          </div>
        </div>

        <table>
          <thead>
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
            ${paymentData.map(payment => `
              <tr>
                <td>${payment.receipt_number}</td>
                <td>${new Date(payment.collection_date).toLocaleDateString()}</td>
                <td>${payment.primary_category || payment.fee_type_name || 'N/A'}</td>
                <td class="amount">₹${parseFloat(payment.amount).toLocaleString()}</td>
                <td>${payment.payment_method.toUpperCase()}</td>
                <td>${payment.collected_by_name || 'N/A'}</td>
                <td><span style="background: #d4edda; color: #155724; padding: 2px 6px; border-radius: 3px;">Paid</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>This is a computer-generated report. School Management System.</p>
        </div>
      </body>
      </html>
    `;

    // Create a new window and write the HTML content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print dialog
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 250);
    };

    toast.success('PDF download initiated');
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
                      {student.aadhaar_masked && (
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                          <i className="bi bi-credit-card-2-front me-1"></i>
                          Aadhaar: {student.aadhaar_masked}
                        </div>
                      )}
                      {student['special need'] && (
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                          <i className="bi bi-universal-access me-1"></i>
                          Special Need: {student['special need']}
                        </div>
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
                      {student.mandatory_fees && (
                        <div>
                          <small className="text-danger d-block">
                            Due Fee: ₹{(student.mandatory_fees || 0).toLocaleString()}
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
                          onClick={() => handleShowFeeCollection(student)}
                          title="Collect Fee"
                        >
                          <i className="bi bi-currency-rupee"></i>
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleShowPaymentHistory(student)}
                          title="View Payment History"
                        >
                          <i className="bi bi-receipt"></i>
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => generateStudentIDCard(student)}
                          title="Generate ID Card"
                        >
                          <i className="bi bi-card-heading"></i>
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
          <Modal.Header className="bg-gradient-success text-white border-0 py-3" closeButton>
            <Modal.Title className="d-flex align-items-center">
              <i className="bi bi-people me-2"></i>
              <span>{editingStudent ? 'Edit Student' : 'Add New Student'}</span>
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
                  <Form.Group controlId="studentName">
                    <Form.Label className="form-label text-muted">
                      <i className="bi bi-person me-2"></i>Student Full Name *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="student_name"
                      value={formData.student_name}
                      onChange={handleInputChange}
                      placeholder="Enter student full name"
                      isInvalid={!!errors.student_name}
                      maxLength={100}
                      className="form-control-lg"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.student_name}
                    </Form.Control.Feedback>
                  </Form.Group>
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

              <div className="row mb-4">
                <div className="col-md-6 mb-3">
                  <Form.Group>
                    <Form.Label className="form-label text-muted mb-2">
                      <i className="bi bi-gender-ambiguous me-2"></i>Gender *
                    </Form.Label>
                    <Form.Select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="form-select-lg"
                      style={{ minHeight: '50px' }}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Group controlId="aadhaarNumber">
                    <Form.Label className="form-label text-muted">
                      <i className="bi bi-credit-card-2-front me-2"></i>Aadhaar Number
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="aadhaar"
                      value={formData.aadhaar}
                      onChange={handleInputChange}
                      placeholder="Enter 12-digit Aadhaar number"
                      maxLength={12}
                      className="form-control-lg"
                      isInvalid={!!errors.aadhaar}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.aadhaar}
                    </Form.Control.Feedback>
                    {existingAadhaarMasked && (
                      <Form.Text className="text-muted">
                        Current: {existingAadhaarMasked}. Leave blank to keep existing value.
                      </Form.Text>
                    )}
                  </Form.Group>
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
                  <Form.Group controlId="rollNumber">
                    <Form.Label className="form-label text-muted">
                      <i className="bi bi-hash me-2"></i>Roll Number *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="roll_number"
                      value={formData.roll_number}
                      onChange={handleInputChange}
                      placeholder="Enter roll number"
                      isInvalid={!!errors.roll_number}
                      maxLength={20}
                      className="form-control-lg"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.roll_number}
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
                <div className="col-md-4 mb-3">
                  <Form.Group controlId="admissionDate">
                    <Form.Label className="form-label text-muted">
                      <i className="bi bi-calendar-event me-2"></i>Admission Date *
                    </Form.Label>
                    <Form.Control
                      type="date"
                      name="admission_date"
                      value={formData.admission_date}
                      onChange={handleInputChange}
                      isInvalid={!!errors.admission_date}
                      className="form-control-lg"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.admission_date}
                    </Form.Control.Feedback>
                  </Form.Group>
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
                  <Form.Group controlId="samSamagrahId">
                    <Form.Label className="form-label text-muted">
                      <i className="bi bi-card-list me-2"></i>Sam Samagrah ID
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="sam_samagrah_id"
                      value={formData.sam_samagrah_id}
                      onChange={handleInputChange}
                      placeholder="Enter Sam Samagrah ID"
                      maxLength={50}
                      className="form-control-lg"
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Group controlId="aaparId">
                    <Form.Label className="form-label text-muted">
                      <i className="bi bi-card-heading me-2"></i>AAPAR ID
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="aapar_id"
                      value={formData.aapar_id}
                      onChange={handleInputChange}
                      placeholder="Enter AAPAR ID"
                      maxLength={50}
                      className="form-control-lg"
                    />
                  </Form.Group>
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
                  <Form.Group controlId="residentialAddress">
                    <Form.Label className="form-label text-muted">
                      <i className="bi bi-house me-2"></i>Residential Address
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="residential_address"
                      value={formData.residential_address}
                      onChange={handleInputChange}
                      placeholder="Enter residential address"
                      maxLength={500}
                      style={{ minHeight: '100px' }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-4 mb-3">
                  <Form.Group controlId="pincode">
                    <Form.Label className="form-label text-muted">
                      <i className="bi bi-mailbox me-2"></i>Pincode
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="Enter pincode"
                      maxLength={10}
                      className="form-control-lg"
                    />
                  </Form.Group>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="section-header mb-4">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-telephone-plus me-2"></i>Emergency Contact
                </h6>
                <hr className="section-divider" />
              </div>

              <div className="row mb-4">
                <div className="col-md-4 mb-3">
                  <Form.Group controlId="emergencyContactName">
                    <Form.Label className="form-label text-muted">
                      <i className="bi bi-person me-2"></i>Emergency Contact Name
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      placeholder="Enter emergency contact name"
                      maxLength={100}
                      className="form-control-lg"
                    />
                  </Form.Group>
                </div>
                <div className="col-md-4 mb-3">
                  <Form.Group controlId="emergencyContactRelationship">
                    <Form.Label className="form-label text-muted">
                      <i className="bi bi-people me-2"></i>Relationship
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="emergency_contact_relationship"
                      value={formData.emergency_contact_relationship}
                      onChange={handleInputChange}
                      placeholder="Enter relationship"
                      maxLength={50}
                      className="form-control-lg"
                    />
                  </Form.Group>
                </div>
                <div className="col-md-4 mb-3">
                  <Form.Group controlId="emergencyContact">
                    <Form.Label className="form-label text-muted">
                      <i className="bi bi-phone me-2"></i>Contact
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="emergency_contact_number"
                      value={formData.emergency_contact_number}
                      onChange={handleInputChange}
                      placeholder="Enter emergency contact number"
                      maxLength={15}
                      pattern="[0-9]{10}"
                      className="form-control-lg"
                    />
                  </Form.Group>
                </div>
              </div>

              

              {/* Travel Mode Section */}
              <div className="section-header mb-4">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-bus-front me-2"></i>Travel Mode
                </h6>
                <hr className="section-divider" />
              </div>

              <div className="row mb-4">
                <div className="col-md-6 mb-3">
                  <div className="form-group">
                    <label className="form-label text-muted mb-2">
                      <i className="bi bi-signpost-split me-2"></i>Travel Mode
                    </label>
                    <Form.Select
                      name="travel_mode"
                      value={formData.travel_mode}
                      onChange={handleInputChange}
                      className="form-select-lg"
                      style={{ minHeight: '50px' }}
                    >
                      <option value="">Select Travel Mode</option>
                      <option value="School Bus">School Bus</option>
                      <option value="Own">Own</option>
                    </Form.Select>
                  </div>
                </div>

                {/* Removed vehicle number, parent/staff name, and verified TTS ID fields */}
              </div>

              {/* Medical Information Section (Accordion) */}
              <div className="section-header mb-4">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-heart-pulse me-2"></i>Medical Information
                </h6>
                <hr className="section-divider" />
              </div>

              <Accordion className="mb-4">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>
                    <i className="bi bi-heart-pulse me-2"></i>
                    Medical Information (Click to expand)
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="row g-3">
                      {/* Blood Group */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="form-label text-muted mb-2">
                            <i className="bi bi-droplet-fill me-2"></i>Blood Group
                          </label>
                          <Form.Select
                            name="blood_group"
                            value={formData.blood_group}
                            onChange={handleInputChange}
                            className="form-select-lg"
                            style={{ minHeight: '50px' }}
                          >
                            <option value="">Select Blood Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </Form.Select>
                        </div>
                      </div>

                      {/* Allergies Multi-Select */}
                      <div className="col-md-4">
                        <div className="form-group h-100 d-flex flex-column">
                          <label className="form-label text-muted mb-2">
                            <i className="bi bi-exclamation-triangle me-2"></i>Allergies
                          </label>
                          <div className="form-control flex-grow-1" style={{ minHeight: '48px', padding: '12px' }}>
                            <details>
                              <summary className="text-muted" style={{ cursor: 'pointer', listStyle: 'none' }}>
                                <i className="bi bi-chevron-down me-2"></i>
                                Select allergies...
                              </summary>
                              <div className="mt-3">
                                {ALLERGIES_OPTIONS.map((option) => {
                                  const isChecked = Array.isArray(formData.allergies) && formData.allergies.includes(option);
                                  return (
                                    <div
                                      key={option}
                                      className="form-check"
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => handleAllergyToggle(option)}
                                    >
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {}}
                                      />
                                      <label className="form-check-label">
                                        {option}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            </details>
                          </div>
                          <div className="mt-2">
                            {Array.isArray(formData.allergies) && formData.allergies.length > 0 ? (
                              formData.allergies.map((allergy) => (
                                <Badge key={allergy} bg="info" text="dark" className="me-2 mb-2">
                                  {allergy}
                                </Badge>
                              ))
                            ) : (
                              <small className="text-muted">No allergies selected yet.</small>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lifestyle Diseases */}
                      <div className="col-md-4">
                        <Form.Group controlId="lifestyleDiseases" className="h-100 d-flex flex-column">
                          <Form.Label className="form-label text-muted">
                            <i className="bi bi-clipboard2-pulse me-2"></i>Lifestyle Diseases
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="lifestyle_diseases"
                            value={formData.lifestyle_diseases}
                            onChange={handleInputChange}
                            placeholder="List any lifestyle diseases"
                            maxLength={500}
                            style={{ minHeight: '120px' }}
                          />
                        </Form.Group>
                      </div>
                    </div>

                    <div className="row g-3 mt-1">
                      {/* Diabetic Toggle */}
                      <div className="col-md-4 mb-3">
                        <Form.Check
                          type="switch"
                          id="diabetic-switch"
                          label="Diabetic"
                          checked={formData.diabetic}
                          onChange={(e) => setFormData(prev => ({ ...prev, diabetic: e.target.checked }))}
                        />
                      </div>

                      {/* Asthmatic Toggle */}
                      <div className="col-md-4 mb-3">
                        <Form.Check
                          type="switch"
                          id="asthmatic-switch"
                          label="Asthmatic"
                          checked={formData.asthmatic}
                          onChange={(e) => setFormData(prev => ({ ...prev, asthmatic: e.target.checked }))}
                        />
                      </div>

                      {/* Phobia Toggle */}
                      <div className="col-md-4 mb-3">
                        <Form.Check
                          type="switch"
                          id="phobia-switch"
                          label="Has Phobia"
                          checked={formData.phobia}
                          onChange={(e) => setFormData(prev => ({ ...prev, phobia: e.target.checked }))}
                        />
                      </div>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>

              {/* Family Doctor Information Section */}
              <div className="section-header mb-4">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-hospital me-2"></i>Family Doctor Information
                </h6>
                <hr className="section-divider" />
              </div>

              <div className="row mb-4">
                <div className="col-md-4 mb-3">
                  <Form.Group controlId="doctorName">
                    <Form.Label className="form-label text-muted">
                      <i className="bi bi-person-vcard me-2"></i>Doctor Name
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="doctor_name"
                      value={formData.doctor_name}
                      onChange={handleInputChange}
                      placeholder="Enter doctor name"
                      maxLength={100}
                      className="form-control-lg"
                    />
                  </Form.Group>
                </div>
                <div className="col-md-4 mb-3">
                  <Form.Group controlId="doctorContact">
                    <Form.Label className="form-label text-muted">
                      <i className="bi bi-telephone me-2"></i>Doctor Contact
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="doctor_contact"
                      value={formData.doctor_contact}
                      onChange={handleInputChange}
                      placeholder="Enter doctor contact number"
                      maxLength={15}
                      className="form-control-lg"
                    />
                  </Form.Group>
                </div>
                <div className="col-md-4 mb-3">
                  <Form.Group controlId="clinicAddress">
                    <Form.Label className="form-label text-muted">
                      <i className="bi bi-geo-alt me-2"></i>Clinic Address
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="clinic_address"
                      value={formData.clinic_address}
                      onChange={handleInputChange}
                      placeholder="Enter clinic address"
                      maxLength={500}
                      style={{ minHeight: '80px' }}
                    />
                  </Form.Group>
                </div>
              </div>

              {/* Documents & Photos Upload Section */}
              <div className="section-header mb-4">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-file-earmark-arrow-up me-2"></i>Documents & Photos Upload
                </h6>
                <hr className="section-divider" />
              </div>

              <div className="row mb-4">
                {/* Student Photo */}
                <div className="col-md-4 mb-3">
                  <label className="form-label text-muted">
                    <i className="bi bi-person-badge me-2"></i>Student Photograph
                  </label>
                  <Form.Control
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'student_photo')}
                    disabled={uploadingDocument}
                  />
                  <small className="text-muted d-block">Max 2MB, JPG/PNG only</small>
                  {(previewUrls.student_photo || formData.student_photo_url) && (
                    <div className="mt-2 position-relative">
                      <img 
                        src={previewUrls.student_photo || getImageUrl(formData.student_photo_url)} 
                        alt="Student" 
                        className="img-thumbnail"
                        style={{ maxHeight: '120px', width: 'auto' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div style={{ display: 'none' }}>
                        <Badge bg="secondary">
                          <i className="bi bi-image me-1"></i>Image Error
                        </Badge>
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="mt-2 w-100"
                        onClick={() => {
                          currentFileUrls.current.student_photo_url = '';
                          setUploadedFiles(prev => ({ ...prev, student_photo_url: '' }));
                          setFormData(prev => ({ ...prev, student_photo_url: '' }));
                          setPreviewUrls(prev => ({ ...prev, student_photo: null }));
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

                {/* ID Proof */}
                <div className="col-md-4 mb-3">
                  <label className="form-label text-muted">
                    <i className="bi bi-card-checklist me-2"></i>ID Proof
                  </label>
                  <Form.Control
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileUpload(e, 'id_proof')}
                    disabled={uploadingDocument}
                  />
                  <small className="text-muted d-block">Max 2MB, JPG/PNG/PDF</small>
                  {(previewUrls.id_proof || formData.id_proof_url) && (
                    <div className="mt-2">
                      {(previewUrls.id_proof || formData.id_proof_url)?.endsWith('.pdf') ? (
                        <div>
                          <Badge bg="success" className="mb-2">
                            <i className="bi bi-file-pdf me-1"></i>PDF Document
                          </Badge>
                          <br />
                          <a 
                            href={previewUrls.id_proof || getImageUrl(formData.id_proof_url)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-eye me-1"></i>View PDF
                          </a>
                        </div>
                      ) : (
                        <img 
                          src={previewUrls.id_proof || getImageUrl(formData.id_proof_url)} 
                          alt="ID Proof" 
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
                          currentFileUrls.current.id_proof_url = '';
                          setUploadedFiles(prev => ({ ...prev, id_proof_url: '' }));
                          setFormData(prev => ({ ...prev, id_proof_url: '' }));
                          setPreviewUrls(prev => ({ ...prev, id_proof: null }));
                        }}
                      >
                        <i className="bi bi-trash me-1"></i>Remove
                      </Button>
                    </div>
                  )}
                </div>

                {/* Address Proof */}
                <div className="col-md-4 mb-3">
                  <label className="form-label text-muted">
                    <i className="bi bi-house-check me-2"></i>Address Proof
                  </label>
                  <Form.Control
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileUpload(e, 'address_proof')}
                    disabled={uploadingDocument}
                  />
                  <small className="text-muted d-block">Max 2MB, JPG/PNG/PDF</small>
                  {(previewUrls.address_proof || formData.address_proof_url) && (
                    <div className="mt-2">
                      {(previewUrls.address_proof || formData.address_proof_url)?.endsWith('.pdf') ? (
                        <div>
                          <Badge bg="success" className="mb-2">
                            <i className="bi bi-file-pdf me-1"></i>PDF Document
                          </Badge>
                          <br />
                          <a 
                            href={previewUrls.address_proof || getImageUrl(formData.address_proof_url)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-eye me-1"></i>View PDF
                          </a>
                        </div>
                      ) : (
                        <img 
                          src={previewUrls.address_proof || getImageUrl(formData.address_proof_url)} 
                          alt="Address Proof" 
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
                          currentFileUrls.current.address_proof_url = '';
                          setUploadedFiles(prev => ({ ...prev, address_proof_url: '' }));
                          setFormData(prev => ({ ...prev, address_proof_url: '' }));
                          setPreviewUrls(prev => ({ ...prev, address_proof: null }));
                        }}
                      >
                        <i className="bi bi-trash me-1"></i>Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Student Aspirations & Special Need Section */}
              {(user?.role === 'teacher' || user?.user_type === 'admin' || user?.role === 'admin') && (
                <>
                  <div className="section-header mb-4">
                    <h6 className="text-primary mb-3">
                      <i className="bi bi-lightbulb me-2"></i>Student Aspirations & Special Needs
                    </h6>
                    <hr className="section-divider" />
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                      <div className="form-floating h-100">
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="student_aspirations"
                          value={formData.student_aspirations}
                          onChange={handleInputChange}
                          placeholder="Student Aspirations"
                          maxLength={2000}
                          style={{ minHeight: '120px' }}
                          id="studentAspirations"
                        />
                        <label htmlFor="studentAspirations" className="text-muted">
                          <i className="bi bi-star me-2"></i>Student Aspirations
                        </label>
                        <small className="text-muted">
                          <i className="bi bi-info-circle me-1"></i>
                          Share the student's aspirations, goals, and career interests
                        </small>
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <Form.Group controlId="specialNeed" className="h-100 d-flex flex-column">
                        <Form.Label className="form-label text-muted">
                          <i className="bi bi-universal-access me-2"></i>Special Need Details
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="special_need"
                          value={formData.special_need}
                          onChange={handleInputChange}
                          placeholder="Describe any special needs or accommodations"
                          maxLength={500}
                          style={{ minHeight: '120px' }}
                        />
                        <Form.Text className="text-muted mt-2">
                          Leave blank if there are no special requirements for the student.
                        </Form.Text>
                      </Form.Group>
                    </div>
                  </div>
                </>
              )}

              {/* Semester Assignment - Compact */}
              {formData.grade_id && semesterFees && semesterFees.status === 'found' && (
                <div className="mb-4">
                  <h6 className="text-primary mb-3">
                    <i className="bi bi-calendar-range me-2"></i>Semester Assignment
                  </h6>
                  <div className="row">
                    {/* Semester 1 Card */}
                    <div className="col-md-6 mb-3">
                      <div className="card border-primary shadow-sm">
                        <div className="card-header bg-primary text-white py-2">
                          <small className="fw-bold">
                            <i className="bi bi-1-circle me-1"></i>Semester 1
                          </small>
                        </div>
                        <div className="card-body py-3 px-3 text-center">
                          <div className="h5 text-primary mb-2">
                            ₹{parseFloat(semesterFees.semester_1.amount || 0).toLocaleString()}
                          </div>
                          <Badge bg="primary" pill>
                            Required
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Semester 2 Card */}
                    <div className="col-md-6 mb-3">
                      <div className="card border-success shadow-sm">
                        <div className="card-header bg-success text-white py-2">
                          <small className="fw-bold">
                            <i className="bi bi-2-circle me-1"></i>Semester 2
                          </small>
                        </div>
                        <div className="card-body py-3 px-3 text-center">
                          <div className="h5 text-success mb-2">
                            ₹{parseFloat(semesterFees.semester_2.amount || 0).toLocaleString()}
                          </div>
                          <Badge bg="success" pill>
                            Required
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Total Summary - Compact */}
                  <div className="alert alert-info py-2 mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Total Fee: ₹{(semesterFees.total_amount || 0).toLocaleString()}</strong>
                    <br />
                    <small>Based on selected semester, these fees will be automatically assigned to the student.</small>
                  </div>
                </div>
              )}
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
                disabled={createMutation.isLoading || updateMutation.isLoading || uploadingDocument}
                className="px-4 py-2 shadow-sm"
              >
                {createMutation.isLoading || updateMutation.isLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    <span>{editingStudent ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : uploadingDocument ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    <span>Uploading file...</span>
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
      <Modal show={showParentModal} onHide={handleCloseParentModal} size="lg" centered scrollable>
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-primary text-white border-0 py-3" closeButton>
            <Modal.Title className="d-flex align-items-center">
              <i className="bi bi-person-plus me-2"></i>
              <span>Add New Parent</span>
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleParentSubmit}>
            <Modal.Body className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
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

              {/* Professional Information */}
              <div className="col-12 mb-3">
                <hr />
                <h6 className="text-muted mb-3">
                  <i className="bi bi-briefcase me-2"></i>Professional Information
                </h6>
              </div>

              <Row>
                <Col md={4} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="occupation"
                      value={parentFormData.occupation}
                      onChange={handleParentInputChange}
                      placeholder="Occupation"
                      maxLength={150}
                      id="parentOccupation"
                    />
                    <label htmlFor="parentOccupation" className="text-muted">
                      <i className="bi bi-person-workspace me-2"></i>Occupation
                    </label>
                  </div>
                </Col>

                <Col md={4} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="current_employment"
                      value={parentFormData.current_employment}
                      onChange={handleParentInputChange}
                      placeholder="Current Employment"
                      maxLength={150}
                      id="parentCurrentEmployment"
                    />
                    <label htmlFor="parentCurrentEmployment" className="text-muted">
                      <i className="bi bi-building me-2"></i>Current Employment
                    </label>
                  </div>
                </Col>

                <Col md={4} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="company_name"
                      value={parentFormData.company_name}
                      onChange={handleParentInputChange}
                      placeholder="Company Name"
                      maxLength={150}
                      id="parentCompanyName"
                    />
                    <label htmlFor="parentCompanyName" className="text-muted">
                      <i className="bi bi-building-fill me-2"></i>Company Name
                    </label>
                  </div>
                </Col>
              </Row>

              {/* Contact Preferences */}
              <div className="col-12 mb-3">
                <hr />
                <h6 className="text-muted mb-3">
                  <i className="bi bi-telephone me-2"></i>Contact Preferences
                </h6>
              </div>

              <Row>
                <Col md={6} className="mb-3">
                  <div className="form-floating">
                    <Form.Select
                      name="best_contact_day"
                      value={parentFormData.best_contact_day}
                      onChange={handleParentInputChange}
                      id="parentBestContactDay"
                    >
                      <option value="">Select Day</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                      <option value="Weekdays">Weekdays</option>
                      <option value="Weekends">Weekends</option>
                      <option value="Anytime">Anytime</option>
                    </Form.Select>
                    <label htmlFor="parentBestContactDay" className="text-muted">
                      <i className="bi bi-calendar-day me-2"></i>Best Contact Day
                    </label>
                  </div>
                </Col>

                <Col md={6} className="mb-3">
                  <div className="form-floating">
                    <Form.Select
                      name="best_contact_time"
                      value={parentFormData.best_contact_time}
                      onChange={handleParentInputChange}
                      id="parentBestContactTime"
                    >
                      <option value="">Select Time</option>
                      <option value="Morning (8 AM - 12 PM)">Morning (8 AM - 12 PM)</option>
                      <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                      <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                      <option value="Anytime">Anytime</option>
                    </Form.Select>
                    <label htmlFor="parentBestContactTime" className="text-muted">
                      <i className="bi bi-clock me-2"></i>Best Contact Time
                    </label>
                  </div>
                </Col>
              </Row>

              {/* Child Information */}
              <div className="col-12 mb-3">
                <hr />
                <h6 className="text-muted mb-3">
                  <i className="bi bi-heart me-2"></i>Know Your Child
                </h6>
              </div>

              <Row>
                <Col md={12} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      as="textarea"
                      name="kid_likes"
                      value={parentFormData.kid_likes}
                      onChange={handleParentInputChange}
                      placeholder="Child's likes"
                      style={{ minHeight: '80px' }}
                      id="parentKidLikes"
                    />
                    <label htmlFor="parentKidLikes" className="text-muted">
                      <i className="bi bi-emoji-smile me-2"></i>Child's Likes
                    </label>
                  </div>
                </Col>

                <Col md={12} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      as="textarea"
                      name="kid_dislikes"
                      value={parentFormData.kid_dislikes}
                      onChange={handleParentInputChange}
                      placeholder="Child's dislikes"
                      style={{ minHeight: '80px' }}
                      id="parentKidDislikes"
                    />
                    <label htmlFor="parentKidDislikes" className="text-muted">
                      <i className="bi bi-emoji-frown me-2"></i>Child's Dislikes
                    </label>
                  </div>
                </Col>

                <Col md={12} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      as="textarea"
                      name="kid_aspirations"
                      value={parentFormData.kid_aspirations}
                      onChange={handleParentInputChange}
                      placeholder="Child's aspirations"
                      style={{ minHeight: '80px' }}
                      id="parentKidAspirations"
                    />
                    <label htmlFor="parentKidAspirations" className="text-muted">
                      <i className="bi bi-star me-2"></i>Child's Aspirations
                    </label>
                  </div>
                </Col>
              </Row>

              {/* Documents Upload */}
              <div className="col-12 mb-3">
                <hr />
                <h6 className="text-muted mb-3">
                  <i className="bi bi-file-earmark-arrow-up me-2"></i>Upload Documents
                </h6>
              </div>

              <Row>
                {/* Parent Photo */}
                <Col md={4} className="mb-3">
                  <label className="form-label text-muted">
                    <i className="bi bi-person-badge me-2"></i>Parent Photograph
                  </label>
                  <Form.Control
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => handleParentFileUpload(e, 'parent_photo')}
                    disabled={parentUploadingDocument}
                  />
                  <small className="text-muted d-block">Max 2MB, JPG/PNG only</small>
                  {(parentPreviewUrls.parent_photo || parentFormData.parent_photo) && (
                    <div className="mt-2 position-relative">
                      <img
                        src={parentPreviewUrls.parent_photo || getImageUrl(parentFormData.parent_photo)}
                        alt="Parent"
                        className="img-thumbnail"
                        style={{ maxHeight: '120px', width: 'auto' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="mt-2 w-100"
                        onClick={() => {
                          parentFileUrls.current.parent_photo = '';
                          setParentUploadedFiles(prev => ({ ...prev, parent_photo: '' }));
                          setParentFormData(prev => ({ ...prev, parent_photo: '' }));
                          setParentPreviewUrls(prev => ({ ...prev, parent_photo: null }));
                        }}
                      >
                        <i className="bi bi-trash me-1"></i>Remove
                      </Button>
                    </div>
                  )}
                  {parentUploadingDocument && (
                    <div className="mt-2">
                      <Spinner size="sm" className="me-2" />
                      <small>Uploading...</small>
                    </div>
                  )}
                </Col>

                {/* ID Proof */}
                <Col md={4} className="mb-3">
                  <label className="form-label text-muted">
                    <i className="bi bi-card-checklist me-2"></i>ID Proof
                  </label>
                  <Form.Control
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleParentFileUpload(e, 'id_proof')}
                    disabled={parentUploadingDocument}
                  />
                  <small className="text-muted d-block">Max 2MB, JPG/PNG/PDF</small>
                  {(parentPreviewUrls.id_proof || parentFormData.id_proof) && (
                    <div className="mt-2">
                      {(parentPreviewUrls.id_proof || parentFormData.id_proof)?.endsWith('.pdf') ? (
                        <div>
                          <Badge bg="success" className="mb-2">
                            <i className="bi bi-file-pdf me-1"></i>PDF Document
                          </Badge>
                          <br />
                          <a
                            href={parentPreviewUrls.id_proof || getImageUrl(parentFormData.id_proof)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-eye me-1"></i>View PDF
                          </a>
                        </div>
                      ) : (
                        <img
                          src={parentPreviewUrls.id_proof || getImageUrl(parentFormData.id_proof)}
                          alt="ID Proof"
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
                          parentFileUrls.current.id_proof = '';
                          setParentUploadedFiles(prev => ({ ...prev, id_proof: '' }));
                          setParentFormData(prev => ({ ...prev, id_proof: '' }));
                          setParentPreviewUrls(prev => ({ ...prev, id_proof: null }));
                        }}
                      >
                        <i className="bi bi-trash me-1"></i>Remove
                      </Button>
                    </div>
                  )}
                </Col>

                {/* Address Proof */}
                <Col md={4} className="mb-3">
                  <label className="form-label text-muted">
                    <i className="bi bi-house-check me-2"></i>Address Proof
                  </label>
                  <Form.Control
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleParentFileUpload(e, 'address_proof')}
                    disabled={parentUploadingDocument}
                  />
                  <small className="text-muted d-block">Max 2MB, JPG/PNG/PDF</small>
                  {(parentPreviewUrls.address_proof || parentFormData.address_proof) && (
                    <div className="mt-2">
                      {(parentPreviewUrls.address_proof || parentFormData.address_proof)?.endsWith('.pdf') ? (
                        <div>
                          <Badge bg="success" className="mb-2">
                            <i className="bi bi-file-pdf me-1"></i>PDF Document
                          </Badge>
                          <br />
                          <a
                            href={parentPreviewUrls.address_proof || getImageUrl(parentFormData.address_proof)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-eye me-1"></i>View PDF
                          </a>
                        </div>
                      ) : (
                        <img
                          src={parentPreviewUrls.address_proof || getImageUrl(parentFormData.address_proof)}
                          alt="Address Proof"
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
                          parentFileUrls.current.address_proof = '';
                          setParentUploadedFiles(prev => ({ ...prev, address_proof: '' }));
                          setParentFormData(prev => ({ ...prev, address_proof: '' }));
                          setParentPreviewUrls(prev => ({ ...prev, address_proof: null }));
                        }}
                      >
                        <i className="bi bi-trash me-1"></i>Remove
                      </Button>
                    </div>
                  )}
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
          <Modal.Header className="bg-gradient-success text-white border-0 py-3" closeButton>
            <Modal.Title className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <i className="bi bi-receipt me-2"></i>
                <span>Payment History{selectedStudentForHistory && ` - ${selectedStudentForHistory.student_name}`}</span>
              </div>
              {paymentHistoryData && paymentHistoryData.length > 0 && (
                <Button 
                  variant="outline-light" 
                  size="sm"
                  onClick={() => downloadPaymentHistoryPDF(selectedStudentForHistory, paymentHistoryData)}
                  className="d-flex align-items-center"
                >
                  <i className="bi bi-download me-2"></i>
                  Download PDF
                </Button>
              )}
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
                            <td>{payment.primary_category || payment.fee_type_name || 'N/A'}</td>
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
                              <Badge bg="success">
                                Paid
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
                        <Col md={4}>
                          <div className="text-center">
                            <div className="h4 text-success mb-0">
                              ₹{paymentHistoryData.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toLocaleString()}
                            </div>
                            <small className="text-muted">Total Paid</small>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="text-center">
                            <div className="h4 text-primary mb-0">{paymentHistoryData.length}</div>
                            <small className="text-muted">Transactions</small>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="text-center">
                            <div className="h4 text-success mb-0">
                              {paymentHistoryData.length}
                            </div>
                            <small className="text-muted">Completed</small>
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
                  handleShowFeeCollection(selectedStudentForHistory);
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

      {/* Fee Collection Modal */}
      <FeeCollectionModal
        show={showFeeCollectionModal}
        onHide={handleCloseFeeCollection}
        preSelectedStudent={selectedStudentForFeeCollection}
      />
    </div>
  );
};

export default StudentManagement;