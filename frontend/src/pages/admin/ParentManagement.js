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
import JsBarcode from 'jsbarcode';

const ParentManagement = () => {
  // Helper to construct absolute URLs for uploaded assets
  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    if (path.startsWith('/uploads/')) {
      return `${ENV_CONFIG.API_BASE_URL}${path.substring(1)}`;
    }
    if (path.startsWith('uploads/')) {
      return `${ENV_CONFIG.API_BASE_URL}${path}`;
    }
    return `${ENV_CONFIG.API_BASE_URL}uploads/${path.replace(/^\//, '')}`;
  };
  const location = useLocation();
  const navigate = useNavigate();
  const { getFormattedAcademicYear } = useAcademicYear();
  const [showModal, setShowModal] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [highlightedParentId, setHighlightedParentId] = useState(null);
  const [formData, setFormData] = useState({
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
  const [errors, setErrors] = useState({});
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [previewUrls, setPreviewUrls] = useState({
    parent_photo: null,
    id_proof: null,
    address_proof: null
  });
  const [uploadedFiles, setUploadedFiles] = useState({
    parent_photo: '',
    id_proof: '',
    address_proof: ''
  });
  const currentFileUrls = useRef({
    parent_photo: '',
    id_proof: '',
    address_proof: ''
  });

  // Parent staff management state
  const [parentStaff, setParentStaff] = useState([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editingStaffIndex, setEditingStaffIndex] = useState(null);
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    mobile_number: '',
    tss_id: '',
    photo: ''
  });
  const [staffErrors, setStaffErrors] = useState({});
  const [staffPhotoPreview, setStaffPhotoPreview] = useState(null);
  const [staffUploading, setStaffUploading] = useState(false);

  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const searchInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Handle navigation state from Global Search
  useEffect(() => {
    if (location.state?.searchParent && location.state?.parentId) {
      const { searchParent, parentId } = location.state;
      
      setSearchTerm(searchParent);
      setHighlightedParentId(parentId);
      toast.success(`Found parent: ${searchParent}`);
      navigate(location.pathname, { replace: true, state: {} });
      
      setTimeout(() => {
        setHighlightedParentId(null);
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

  // Fetch parents with pagination
  const { data: parentsResponse, isLoading, error } = useQuery({
    queryKey: ['parents', currentPage, itemsPerPage, debouncedSearchTerm],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      
      const response = await apiService.get(`/api/admin/parents?${params}`);
      return response.data;
    }
  });

  const parents = parentsResponse?.data || [];
  const totalItems = parentsResponse?.total || 0;

  // Create parent mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiService.post('/api/admin/parents', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parents']);
      toast.success('Parent created successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create parent');
    }
  });

  // Update parent mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiService.put(`/api/admin/parents/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parents']);
      toast.success('Parent updated successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update parent');
    }
  });

  // Delete parent mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiService.delete(`/api/admin/parents/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parents']);
      toast.success('Parent deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete parent');
    }
  });

  const handleShowModal = async (parent = null) => {
    if (parent) {
      setEditingParent(parent);
      setFormData({
        name: parent.name,
        mobile: parent.mobile,
        email: parent.email || '',
        password: '', // Never pre-fill password when editing
        address: parent.address || '',
        pincode: parent.pincode || '',
        occupation: parent.occupation || '',
        current_employment: parent.current_employment || '',
        company_name: parent.company_name || '',
        best_contact_day: parent.best_contact_day || '',
        best_contact_time: parent.best_contact_time || '',
        kid_likes: parent.kid_likes || '',
        kid_dislikes: parent.kid_dislikes || '',
        kid_aspirations: parent.kid_aspirations || '',
        id_proof: parent.id_proof || '',
        address_proof: parent.address_proof || '',
        parent_photo: parent.parent_photo || ''
      });
      const existingDocs = {
        parent_photo: parent.parent_photo || '',
        id_proof: parent.id_proof || '',
        address_proof: parent.address_proof || ''
      };
      currentFileUrls.current = existingDocs;
      setUploadedFiles(existingDocs);
      setPreviewUrls({
        parent_photo: parent.parent_photo ? getImageUrl(parent.parent_photo) : null,
        id_proof: parent.id_proof ? getImageUrl(parent.id_proof) : null,
        address_proof: parent.address_proof ? getImageUrl(parent.address_proof) : null
      });
      
      // Fetch parent staff
      try {
        const staffResponse = await apiService.get(`/api/admin/parent_staff/${parent.id}`);
        const contacts = (staffResponse.data || []).map(contact => ({
          name: contact.name,
          mobile_number: contact.mobile_number,
          tss_id: contact.tss_id ?? null,
          photo: contact.photo || null
        }));
        setParentStaff(contacts);
      } catch (error) {
        console.error('Error loading parent staff:', error);
        setParentStaff([]);
      }
    } else {
      setEditingParent(null);
      setFormData({
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
      currentFileUrls.current = {
        parent_photo: '',
        id_proof: '',
        address_proof: ''
      };
      setUploadedFiles({
        parent_photo: '',
        id_proof: '',
        address_proof: ''
      });
      setPreviewUrls({
        parent_photo: null,
        id_proof: null,
        address_proof: null
      });
      setParentStaff([]);
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingParent(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      password: '',
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
    setErrors({});
    currentFileUrls.current = {
      parent_photo: '',
      id_proof: '',
      address_proof: ''
    };
    setUploadedFiles({
      parent_photo: '',
      id_proof: '',
      address_proof: ''
    });
    setPreviewUrls({
      parent_photo: null,
      id_proof: null,
      address_proof: null
    });
    setParentStaff([]);
  };

  // Parent staff management handlers
  const handleShowStaffModal = (staff = null, index = null) => {
    if (staff) {
      setEditingStaff(staff);
      setEditingStaffIndex(index);
      setStaffFormData({
        name: staff.name || '',
        mobile_number: staff.mobile_number || '',
        tss_id: staff.tss_id || '',
        photo: staff.photo || ''
      });
      setStaffPhotoPreview(staff.photo ? getImageUrl(staff.photo) : null);
    } else {
      setEditingStaff(null);
      setEditingStaffIndex(null);
      setStaffFormData({
        name: '',
        mobile_number: '',
        tss_id: '',
        photo: ''
      });
      setStaffPhotoPreview(null);
    }
    setStaffErrors({});
    setShowStaffModal(true);
  };

  const handleCloseStaffModal = () => {
    setShowStaffModal(false);
    setEditingStaff(null);
    setEditingStaffIndex(null);
    setStaffFormData({
      name: '',
      mobile_number: '',
      tss_id: '',
      photo: ''
    });
    setStaffErrors({});
    setStaffPhotoPreview(null);
    setStaffUploading(false);
  };

  const handleStaffInputChange = (e) => {
    const { name, value } = e.target;
    setStaffFormData(prev => ({ ...prev, [name]: value }));
    if (staffErrors[name]) {
      setStaffErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStaffForm = () => {
    const newErrors = {};
    if (!staffFormData.name.trim()) {
      newErrors.name = 'Staff name is required';
    }
    if (!staffFormData.mobile_number.trim()) {
      newErrors.mobile_number = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(staffFormData.mobile_number)) {
      newErrors.mobile_number = 'Mobile number must be 10 digits';
    }
    setStaffErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStaffSubmit = (e) => {
    e.preventDefault();
    if (!validateStaffForm()) return;

    const staffData = {
      name: staffFormData.name,
      mobile_number: staffFormData.mobile_number,
      tss_id: editingStaff?.tss_id ?? (staffFormData.tss_id || null),
      photo: staffFormData.photo || null
    };

    if (editingStaffIndex !== null) {
      // Update existing staff
      const updatedStaff = [...parentStaff];
      updatedStaff[editingStaffIndex] = { ...updatedStaff[editingStaffIndex], ...staffData };
      setParentStaff(updatedStaff);
      toast.success('Staff information updated');
    } else {
      // Add new staff
      setParentStaff(prev => [...prev, staffData]);
      toast.success('Staff added');
    }

    handleCloseStaffModal();
  };

  const handleStaffDelete = (index) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      setParentStaff(prev => prev.filter((_, i) => i !== index));
      toast.success('Staff removed');
    }
  };

  const handleStaffPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo size must be less than 2MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('Invalid photo type. Allowed: JPG, PNG');
      return;
    }

    setStaffUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('document_type', 'staff_photo');

      const response = await apiService.uploadParentDocument(uploadFormData);
      
      // console.log(response);
      const photoUrl = response.data?.url || response.url;

      setStaffFormData(prev => ({ ...prev, photo: photoUrl }));
      setStaffPhotoPreview(getImageUrl(photoUrl));
      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading staff photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setStaffUploading(false);
    }
  };

  const generateParentStaffIDCard = async (staff) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [54, 85.6]
    });

    const barcodeValue = staff.tss_id ? staff.tss_id.toString() : staff.mobile_number || 'PARENT_STAFF';

    const img = new Image();
    img.src = '/logo.png';

    img.onload = async () => {
      try {
        doc.setFillColor(102, 126, 234);
        doc.rect(0, 0, 85.6, 15, 'F');

        doc.setFillColor(255, 255, 255);
        doc.circle(9, 7.5, 5.5, 'F');
        try {
          doc.addImage(img, 'PNG', 5, 3.5, 8, 8);
        } catch (error) {
          console.error('Error adding logo:', error);
        }

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('The Trivandrum Scottish School', 45, 6, { align: 'center' });

        doc.setFontSize(4.5);
        doc.setFont('helvetica', 'normal');
        doc.text('Thundathil, Kariyavattom, Trivandrum - 695581', 45, 9.5, { align: 'center' });

        doc.setFontSize(5);
        doc.setFont('helvetica', 'normal');
        doc.text('STAFF ID CARD (PARENT)', 45, 12.5, { align: 'center' });

        doc.setFillColor(255, 255, 255);
        doc.rect(0, 15, 85.6, 34, 'F');

        doc.setFillColor(102, 126, 234);
        doc.rect(0, 15, 2.5, 34, 'F');

        doc.setFillColor(250, 250, 250);
        doc.rect(5, 18, 20, 26, 'F');
        doc.setDrawColor(102, 126, 234);
        doc.setLineWidth(0.4);
        doc.rect(5, 18, 20, 26);
        
        // Load and add staff photo if available
        if (staff.photo) {
          try {
            let imageDataUrl = null;
            
            // Use the serve_file endpoint which has CORS headers
            try {
              const imagePath = staff.photo.startsWith('/') ? staff.photo : `/${staff.photo}`;
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
                const imagePath = staff.photo.startsWith('/') ? staff.photo.substring(1) : staff.photo;
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
                const isPNG = staff.photo.toLowerCase().includes('.png') ||
                            imageDataUrl.substring(5, 15).toLowerCase().includes('png');
                doc.addImage(imageDataUrl, isPNG ? 'PNG' : 'JPEG', 5.5, 18.5, 19, 25);
              } catch (addImageError) {
                console.error('Error adding staff photo to PDF:', addImageError);
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
            console.error('Error loading staff photo:', error);
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

        finalizeCard();

        function finalizeCard() {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(102, 126, 234);
          doc.text('NAME', 28, 20);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          const displayName = staff.name.length > 26 ? `${staff.name.substring(0, 26)}...` : staff.name;
          doc.text(displayName, 28, 24);

          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(100, 100, 100);
          doc.text('MOBILE', 28, 29);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          doc.text(staff.mobile_number || 'N/A', 28, 32);

          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(100, 100, 100);
          doc.text('TTSS ID', 28, 37);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          doc.text(staff.tss_id ? staff.tss_id.toString() : 'Pending', 28, 40);

          const barcodeCanvas = document.createElement('canvas');
          JsBarcode(barcodeCanvas, barcodeValue, {
            format: 'CODE128',
            width: 2,
            height: 40,
            displayValue: true,
            fontSize: 10,
            margin: 5
          });

          const barcodeDataUrl = barcodeCanvas.toDataURL('image/png');
          doc.addImage(barcodeDataUrl, 'PNG', 25, 47, 55, 7);

          const fileName = `Parent_Staff_ID_${staff.name.replace(/\s+/g, '_')}_${barcodeValue}.pdf`;
          doc.save(fileName);
          toast.success('Parent staff ID Card generated successfully!');
        }
      } catch (error) {
        console.error('Error generating staff ID card:', error);
        toast.error('Failed to generate staff ID card');
      }
    };

    img.onerror = () => {
      toast.error('Failed to load school logo');
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // File upload handler (similar to StudentManagement)
  const handleFileUpload = async (e, documentType) => {
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

    setUploadingDocument(true);

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
      currentFileUrls.current[fieldName] = fileUrl;

      setUploadedFiles(prev => ({
        ...prev,
        [fieldName]: fileUrl
      }));

      setFormData(prevFormData => ({
        ...prevFormData,
        [fieldName]: fileUrl
      }));

      // Set preview URL
      setPreviewUrls(prev => ({
        ...prev,
        [documentType]: file.type.includes('pdf') ? fileUrl : URL.createObjectURL(file)
      }));

      toast.success('Document uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Parent name is required';
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
    if (!editingParent && !formData.password) {
      newErrors.password = 'Password is required for new parents';
    }
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const staffContactsPayload = parentStaff.map(contact => ({
      name: contact.name,
      mobile_number: contact.mobile_number,
      tss_id: contact.tss_id ?? null,
      photo: contact.photo || null
    }));

    const submitData = {
      ...formData,
      parent_photo: uploadedFiles.parent_photo || currentFileUrls.current.parent_photo || formData.parent_photo || '',
      id_proof: uploadedFiles.id_proof || currentFileUrls.current.id_proof || formData.id_proof || '',
      address_proof: uploadedFiles.address_proof || currentFileUrls.current.address_proof || formData.address_proof || '',
      staff_contacts: staffContactsPayload
    };
    
    if (editingParent && !submitData.password) {
      delete submitData.password; // Don't update password if empty
    }

    if (editingParent) {
      updateMutation.mutate({ id: editingParent.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (parent) => {
    if (parent.student_count > 0) {
      toast.error('Cannot delete parent with active students');
      return;
    }
    if (window.confirm(`Are you sure you want to delete parent "${parent.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(parent.id);
    }
  };

  // Generate Parent ID Card
  const generateParentIDCard = async (parent) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [54, 85.6] // Credit card size in landscape (width, height)
    });

    const barcodeValue = parent.mobile || parent.id?.toString() || 'PARENT';
    
    // Load school logo
    const img = new Image();
    img.src = '/logo.png';
    
    img.onload = async () => {
      try {
        // Green Header Background (different from student's blue)
        doc.setFillColor(40, 167, 69); // Green
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
        doc.text('PARENT IDENTITY CARD', 45, 12.5, { align: 'center' });

        // White card body
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 15, 85.6, 34, 'F');

        // Green left accent bar
        doc.setFillColor(40, 167, 69);
        doc.rect(0, 15, 2.5, 34, 'F');

        // Photo frame
        doc.setFillColor(250, 250, 250);
        doc.rect(5, 18, 20, 26, 'F');
        doc.setDrawColor(40, 167, 69);
        doc.setLineWidth(0.4);
        doc.rect(5, 18, 20, 26);
        
        // Load and add parent photo if available
        if (parent.parent_photo) {
          try {
            let imageDataUrl = null;
            
            // Use the serve_file endpoint which has CORS headers
            try {
              const imagePath = parent.parent_photo.startsWith('/') ? parent.parent_photo : `/${parent.parent_photo}`;
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
                const imagePath = parent.parent_photo.startsWith('/') ? parent.parent_photo.substring(1) : parent.parent_photo;
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
                const isPNG = parent.parent_photo.toLowerCase().includes('.png') ||
                            imageDataUrl.substring(5, 15).toLowerCase().includes('png');
                doc.addImage(imageDataUrl, isPNG ? 'PNG' : 'JPEG', 5.5, 18.5, 19, 25);
              } catch (addImageError) {
                console.error('Error adding parent photo to PDF:', addImageError);
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
            console.error('Error loading parent photo:', error);
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

        // Parent details
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
        const nameText = parent.name.length > 25 ? 
                         parent.name.substring(0, 25) : 
                         parent.name;
        doc.text(nameText, detailsX, y + 3);
        y += 7;

        // Mobile Number
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('MOBILE', detailsX, y);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(parent.mobile, detailsX, y + 3);
        y += 7;

        // Email
        if (parent.email) {
          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(100, 100, 100);
          doc.text('EMAIL', detailsX, y);
          doc.setFontSize(6);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          const emailText = parent.email.length > 30 ? 
                           parent.email.substring(0, 30) + '...' : 
                           parent.email;
          doc.text(emailText, detailsX, y + 3);
          y += 7;
        }

        // Address (if available)
        if (parent.address) {
          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(100, 100, 100);
          doc.text('ADDRESS', detailsX, y);
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          const addressText = parent.address.length > 40 ? 
                             parent.address.substring(0, 40) + '...' : 
                             parent.address;
          const lines = doc.splitTextToSize(addressText, 54);
          doc.text(lines.slice(0, 2), detailsX, y + 3);
          y += 7;
        }

        // Barcode at bottom
        const barcodeCanvas = document.createElement('canvas');
        JsBarcode(barcodeCanvas, barcodeValue, {
          format: 'CODE128',
          width: 2,
          height: 40,
          displayValue: true,
          fontSize: 10,
          margin: 5
        });
        
        const barcodeDataUrl = barcodeCanvas.toDataURL('image/png');
        doc.addImage(barcodeDataUrl, 'PNG', 25, 47, 55, 7);

        // Save the PDF
        doc.save(`Parent_ID_${parent.name.replace(/\s+/g, '_')}_${parent.mobile}.pdf`);
        toast.success('Parent ID Card generated successfully!');
      } catch (error) {
        console.error('Error generating ID card:', error);
        toast.error('Failed to generate ID card');
      }
    };

    img.onerror = () => {
      toast.error('Failed to load school logo');
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
        Failed to load parents. Please try again.
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-0 fw-semibold" style={{ fontSize: '1.1rem' }}>
            <i className="bi bi-person-hearts me-2" style={{ fontSize: '1rem' }}></i>
            Parent Management
          </h5>
          <small className="text-muted">
            <i className="bi bi-calendar-range me-1"></i>
            {getFormattedAcademicYear()}
          </small>
        </div>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <i className="bi bi-plus-circle me-2"></i>
          Add New Parent
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
                  placeholder="Search by name, mobile, or email..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="text-end">
              <small className="text-muted">
                {totalItems} total parents
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {parents && parents.length > 0 ? (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Parent Details</th>
                  <th>Contact Information</th>
                  <th>Address</th>
                  <th>Students</th>
                  <th>Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parents.map((parent) => (
                  <tr 
                    key={parent.id}
                    className={highlightedParentId === parent.id ? 'table-warning' : ''}
                    style={highlightedParentId === parent.id ? {
                      animation: 'pulse 2s ease-in-out',
                      border: '2px solid #ffc107'
                    } : {}}
                  >
                    <td>
                      <div className="fw-medium">{parent.name}</div>
                    </td>
                    <td>
                      <div>{parent.mobile}</div>
                      {parent.email && (
                        <small className="text-muted">{parent.email}</small>
                      )}
                    </td>
                    <td>
                      {parent.address ? (
                        <div>
                          <div className="text-muted small">{parent.address}</div>
                          {parent.pincode && (
                            <Badge bg="light" text="dark">PIN: {parent.pincode}</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">Not provided</span>
                      )}
                    </td>
                    <td>
                      <Badge bg="info">{parent.student_count || 0} students</Badge>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(parent.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td className="text-center">
                      <div className="btn-group btn-group-sm">
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => generateParentIDCard(parent)}
                          title="Download ID Card"
                        >
                          <i className="bi bi-download"></i>
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleShowModal(parent)}
                          title="Edit Parent"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(parent)}
                          title="Delete Parent"
                          disabled={deleteMutation.isLoading || parent.student_count > 0}
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
              <i className="bi bi-person-hearts display-1 text-muted mb-4"></i>
              <h5>No Parents Found</h5>
              <p className="text-muted mb-4">
                {searchTerm ? 'No parents match your search criteria.' : 'Start by adding your first parent.'}
              </p>
              <Button variant="primary" onClick={() => handleShowModal()}>
                <i className="bi bi-plus-circle me-2"></i>
                Add First Parent
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

      {/* Add/Edit Parent Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-parent text-white border-0 py-3" closeButton>
            <Modal.Title className="d-flex align-items-center">
              <i className="bi bi-person-hearts me-2"></i>
              <span>{editingParent ? 'Edit Parent' : 'Add New Parent'}</span>
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
                      placeholder="Parent Name"
                      isInvalid={!!errors.name}
                      maxLength={100}
                      className="form-control-lg"
                      id="parentName"
                    />
                    <label htmlFor="parentName" className="text-muted">
                      <i className="bi bi-person me-2"></i>Parent Full Name *
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
                      id="parentMobile"
                    />
                    <label htmlFor="parentMobile" className="text-muted">
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
                      id="parentEmail"
                    />
                    <label htmlFor="parentEmail" className="text-muted">
                      <i className="bi bi-envelope me-2"></i>Email Address (Optional)
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
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
                      id="parentPassword"
                    />
                    <label htmlFor="parentPassword" className="text-muted">
                      <i className="bi bi-lock me-2"></i>Password {editingParent ? '(Leave empty to keep current)' : '*'}
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </div>
                </div>
                <div className="col-md-8 mb-3">
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
                      id="parentAddress"
                    />
                    <label htmlFor="parentAddress" className="text-muted">
                      <i className="bi bi-geo-alt me-2"></i>Residential Address
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
                      id="parentPincode"
                    />
                    <label htmlFor="parentPincode" className="text-muted">
                      <i className="bi bi-mailbox me-2"></i>Pincode
                    </label>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="col-12 mb-3">
                  <hr />
                  <h6 className="text-muted mb-3">
                    <i className="bi bi-briefcase me-2"></i>Professional Information
                  </h6>
                </div>

                <div className="col-md-4 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      placeholder="Occupation"
                      maxLength={150}
                      id="occupation"
                    />
                    <label htmlFor="occupation" className="text-muted">
                      <i className="bi bi-person-workspace me-2"></i>Occupation
                    </label>
                  </div>
                </div>

                <div className="col-md-4 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="current_employment"
                      value={formData.current_employment}
                      onChange={handleInputChange}
                      placeholder="Current Employment"
                      maxLength={150}
                      id="currentEmployment"
                    />
                    <label htmlFor="currentEmployment" className="text-muted">
                      <i className="bi bi-building me-2"></i>Current Employment
                    </label>
                  </div>
                </div>

                <div className="col-md-4 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      placeholder="Company Name"
                      maxLength={150}
                      id="companyName"
                    />
                    <label htmlFor="companyName" className="text-muted">
                      <i className="bi bi-building-fill me-2"></i>Company Name
                    </label>
                  </div>
                </div>

                {/* Contact Preferences */}
                <div className="col-12 mb-3">
                  <hr />
                  <h6 className="text-muted mb-3">
                    <i className="bi bi-telephone me-2"></i>Contact Preferences
                  </h6>
                </div>

                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Select
                      name="best_contact_day"
                      value={formData.best_contact_day}
                      onChange={handleInputChange}
                      id="bestContactDay"
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
                    <label htmlFor="bestContactDay" className="text-muted">
                      <i className="bi bi-calendar-day me-2"></i>Best Contact Day
                    </label>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <div className="form-floating">
                    <Form.Select
                      name="best_contact_time"
                      value={formData.best_contact_time}
                      onChange={handleInputChange}
                      id="bestContactTime"
                    >
                      <option value="">Select Time</option>
                      <option value="Morning (8 AM - 12 PM)">Morning (8 AM - 12 PM)</option>
                      <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                      <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                      <option value="Anytime">Anytime</option>
                    </Form.Select>
                    <label htmlFor="bestContactTime" className="text-muted">
                      <i className="bi bi-clock me-2"></i>Best Contact Time
                    </label>
                  </div>
                </div>

                {/* Child Information */}
                <div className="col-12 mb-3">
                  <hr />
                  <h6 className="text-muted mb-3">
                    <i className="bi bi-heart me-2"></i>Know Your Child
                  </h6>
                </div>

                <div className="col-md-12 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      as="textarea"
                      name="kid_likes"
                      value={formData.kid_likes}
                      onChange={handleInputChange}
                      placeholder="What does your child like?"
                      style={{ minHeight: '80px' }}
                      id="kidLikes"
                    />
                    <label htmlFor="kidLikes" className="text-muted">
                      <i className="bi bi-emoji-smile me-2"></i>Child's Likes
                    </label>
                  </div>
                </div>

                <div className="col-md-12 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      as="textarea"
                      name="kid_dislikes"
                      value={formData.kid_dislikes}
                      onChange={handleInputChange}
                      placeholder="What does your child dislike?"
                      style={{ minHeight: '80px' }}
                      id="kidDislikes"
                    />
                    <label htmlFor="kidDislikes" className="text-muted">
                      <i className="bi bi-emoji-frown me-2"></i>Child's Dislikes
                    </label>
                  </div>
                </div>

                <div className="col-md-12 mb-3">
                  <div className="form-floating">
                    <Form.Control
                      as="textarea"
                      name="kid_aspirations"
                      value={formData.kid_aspirations}
                      onChange={handleInputChange}
                      placeholder="Child's aspirations and goals"
                      style={{ minHeight: '80px' }}
                      id="kidAspirations"
                    />
                    <label htmlFor="kidAspirations" className="text-muted">
                      <i className="bi bi-star me-2"></i>Child's Aspirations
                    </label>
                  </div>
                </div>

                {/* Documents Upload */}
                <div className="col-12 mb-3">
                  <hr />
                  <h6 className="text-muted mb-3">
                    <i className="bi bi-file-earmark-arrow-up me-2"></i>Upload Documents
                  </h6>
                </div>

                {/* Parent Photo */}
                <div className="col-md-4 mb-3">
                  <label className="form-label text-muted">
                    <i className="bi bi-person-badge me-2"></i>Parent Photograph
                  </label>
                  <Form.Control
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'parent_photo')}
                    disabled={uploadingDocument}
                  />
                  <small className="text-muted d-block">Max 2MB, JPG/PNG only</small>
                  {(previewUrls.parent_photo || formData.parent_photo) && (
                    <div className="mt-2 position-relative">
                      <img
                        src={previewUrls.parent_photo || getImageUrl(formData.parent_photo)}
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
                          currentFileUrls.current.parent_photo = '';
                          setUploadedFiles(prev => ({ ...prev, parent_photo: '' }));
                          setFormData(prev => ({ ...prev, parent_photo: '' }));
                          setPreviewUrls(prev => ({ ...prev, parent_photo: null }));
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
                  {(previewUrls.id_proof || formData.id_proof) && (
                    <div className="mt-2">
                      {(previewUrls.id_proof || formData.id_proof)?.endsWith('.pdf') ? (
                        <div>
                          <Badge bg="success" className="mb-2">
                            <i className="bi bi-file-pdf me-1"></i>PDF Document
                          </Badge>
                          <br />
                          <a
                            href={previewUrls.id_proof || getImageUrl(formData.id_proof)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-eye me-1"></i>View PDF
                          </a>
                        </div>
                      ) : (
                        <img
                          src={previewUrls.id_proof || getImageUrl(formData.id_proof)}
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
                          currentFileUrls.current.id_proof = '';
                          setUploadedFiles(prev => ({ ...prev, id_proof: '' }));
                          setFormData(prev => ({ ...prev, id_proof: '' }));
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
                  {(previewUrls.address_proof || formData.address_proof) && (
                    <div className="mt-2">
                      {(previewUrls.address_proof || formData.address_proof)?.endsWith('.pdf') ? (
                        <div>
                          <Badge bg="success" className="mb-2">
                            <i className="bi bi-file-pdf me-1"></i>PDF Document
                          </Badge>
                          <br />
                          <a
                            href={previewUrls.address_proof || getImageUrl(formData.address_proof)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-eye me-1"></i>View PDF
                          </a>
                        </div>
                      ) : (
                        <img
                          src={previewUrls.address_proof || getImageUrl(formData.address_proof)}
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
                          currentFileUrls.current.address_proof = '';
                          setUploadedFiles(prev => ({ ...prev, address_proof: '' }));
                          setFormData(prev => ({ ...prev, address_proof: '' }));
                          setPreviewUrls(prev => ({ ...prev, address_proof: null }));
                        }}
                      >
                        <i className="bi bi-trash me-1"></i>Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Parent Staff Information Section */}
              <div className="row">
                <div className="col-12 mb-3">
                  <hr />
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="text-muted mb-0">
                      <i className="bi bi-person-badge me-2"></i>Parent Staff Contacts
                    </h6>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => handleShowStaffModal()}
                    >
                      <i className="bi bi-plus-circle me-2"></i>Add Staff
                    </Button>
                  </div>
                </div>

                {parentStaff.length > 0 ? (
                  <div className="col-12 mb-3">
                    <Table size="sm" hover bordered>
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '15%' }}>Photo</th>
                          <th style={{ width: '30%' }}>Name</th>
                          <th style={{ width: '20%' }}>Mobile Number</th>
                          <th style={{ width: '15%' }}>TTSS ID</th>
                          <th style={{ width: '20%' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parentStaff.map((staff, index) => (
                          <tr key={index}>
                            <td>
                              {staff.photo ? (
                                <img
                                  src={getImageUrl(staff.photo)}
                                  alt={`${staff.name} photo`}
                                  className="rounded-circle border"
                                  style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <span className="text-muted">No photo</span>
                              )}
                            </td>
                            <td>{staff.name}</td>
                            <td>{staff.mobile_number}</td>
                            <td>{staff.tss_id ? staff.tss_id : <span className="text-muted">Pending</span>}</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleShowStaffModal(staff, index)}
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil"></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleStaffDelete(index)}
                                  title="Delete"
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => generateParentStaffIDCard(staff)}
                                  title="Generate ID Card"
                                >
                                  <i className="bi bi-card-heading"></i>
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
                      No staff contacts added yet. Click "Add Staff" to add information.
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
                    <span>{editingParent ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <i className={`bi ${editingParent ? 'bi-arrow-repeat' : 'bi-plus-circle'} me-2`}></i>
                    <span>{editingParent ? 'Update Parent' : 'Create Parent'}</span>
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </div>

        <style jsx>{`
          .bg-gradient-parent {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
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
            color: #667eea !important;
          }
          .form-control:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 0.25rem rgba(102, 126, 234, 0.15);
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
          .modal-content {
            border-radius: 16px;
            overflow: hidden;
          }
          @keyframes pulse {
            0% { background-color: #fff3cd; }
            50% { background-color: #ffeaa7; }
            100% { background-color: #fff3cd; }
          }
        `}</style>
      </Modal>

      {/* Add/Edit Parent Staff Modal */}
      <Modal show={showStaffModal} onHide={handleCloseStaffModal} centered>
        <Modal.Header closeButton className="bg-gradient-primary text-white" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
          <Modal.Title>
            <i className="bi bi-person-plus me-2"></i>
            {editingStaff ? 'Edit Staff Contact' : 'Add Staff Contact'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleStaffSubmit}>
          <Modal.Body>
            <Row>
              <Col md={12} className="mb-3">
                <label className="form-label text-muted">
                  <i className="bi bi-image me-2"></i>Staff Photo
                </label>
                <Form.Control
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleStaffPhotoUpload}
                  disabled={staffUploading}
                />
                <small className="text-muted d-block">Max 2MB, JPG/PNG only</small>
                {staffPhotoPreview && (
                  <div className="mt-3 d-flex align-items-center gap-3">
                    <img
                      src={staffPhotoPreview}
                      alt="Staff preview"
                      className="rounded border"
                      style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => {
                        setStaffFormData(prev => ({ ...prev, photo: '' }));
                        setStaffPhotoPreview(null);
                      }}
                    >
                      <i className="bi bi-trash me-1"></i>Remove Photo
                    </Button>
                  </div>
                )}
                {staffUploading && (
                  <div className="mt-2">
                    <Spinner size="sm" className="me-2" />
                    <small>Uploading...</small>
                  </div>
                )}
              </Col>

              <Col md={12} className="mb-3">
                <div className="form-floating">
                  <Form.Control
                    type="text"
                    name="name"
                    value={staffFormData.name}
                    onChange={handleStaffInputChange}
                    placeholder="Staff Name"
                    isInvalid={!!staffErrors.name}
                    id="staffName"
                  />
                  <label htmlFor="staffName">
                    <i className="bi bi-person me-2"></i>Staff Name *
                  </label>
                  <Form.Control.Feedback type="invalid">
                    {staffErrors.name}
                  </Form.Control.Feedback>
                </div>
              </Col>

              <Col md={6} className="mb-3">
                <div className="form-floating">
                  <Form.Control
                    type="text"
                    name="mobile_number"
                    value={staffFormData.mobile_number}
                    onChange={handleStaffInputChange}
                    placeholder="Mobile Number"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    isInvalid={!!staffErrors.mobile_number}
                    id="staffMobile"
                  />
                  <label htmlFor="staffMobile">
                    <i className="bi bi-phone me-2"></i>Mobile Number (10 digits) *
                  </label>
                  <Form.Control.Feedback type="invalid">
                    {staffErrors.mobile_number}
                  </Form.Control.Feedback>
                </div>
              </Col>

              <Col md={6} className="mb-3">
                <label className="form-label text-muted">
                  <i className="bi bi-hash me-2"></i>TTSS ID
                </label>
                <div className="p-3 border rounded bg-light">
                  {staffFormData.tss_id ? (
                    <strong>{staffFormData.tss_id}</strong>
                  ) : (
                    <span className="text-muted">Will be generated automatically</span>
                  )}
                </div>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseStaffModal}>
              <i className="bi bi-x-circle me-2"></i>Cancel
            </Button>
            <Button type="submit" variant="primary">
              <i className="bi bi-check-circle me-2"></i>
              {editingStaff ? 'Update' : 'Add'} Staff
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ParentManagement;