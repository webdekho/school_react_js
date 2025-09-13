import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup, Tab, Tabs, ProgressBar } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAcademicYear } from '../../contexts/AcademicYearContext';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import AcademicYearSelector from '../../components/common/AcademicYearSelector';
import { useAuth } from '../../contexts/AuthContext';

const AnnouncementsManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedAcademicYear, getAcademicYearId } = useAcademicYear();
  const [activeTab, setActiveTab] = useState('list');
  const [highlightedAnnouncementId, setHighlightedAnnouncementId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_type: 'all',
    target_ids: [],
    channels: ['whatsapp'],
    scheduled_at: '',
    attachment_filename: '',
    attachment_filepath: '',
    attachment_size: 0,
    attachment_mime_type: ''
  });
  const [errors, setErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');

  const searchInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Target selection states
  const [targetSearch, setTargetSearch] = useState('');
  const [selectedTargets, setSelectedTargets] = useState([]);

  // Handle navigation state from Global Search or URL parameters
  useEffect(() => {
    if (location.state?.searchAnnouncement && location.state?.announcementId) {
      const { searchAnnouncement, announcementId } = location.state;
      
      setSearchTerm(searchAnnouncement);
      setHighlightedAnnouncementId(announcementId);
      toast.success(`Found announcement: ${searchAnnouncement}`);
      navigate(location.pathname, { replace: true, state: {} });
      
      setTimeout(() => {
        setHighlightedAnnouncementId(null);
      }, 5000);
      
      setTimeout(() => {
        const highlightedRow = document.querySelector('.table-warning');
        if (highlightedRow) {
          highlightedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 1000);
    } else {
      // Check for URL query parameter
      const urlParams = new URLSearchParams(location.search);
      const announcementId = urlParams.get('id');
      
      if (announcementId) {
        setHighlightedAnnouncementId(parseInt(announcementId));
        toast.success('Navigated to announcement');
        
        // Clean up URL by removing the query parameter
        navigate(location.pathname, { replace: true });
        
        setTimeout(() => {
          setHighlightedAnnouncementId(null);
        }, 5000);
        
        setTimeout(() => {
          const highlightedRow = document.querySelector('.table-warning');
          if (highlightedRow) {
            highlightedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 1000);
      }
    }
  }, [location.state, location.search, navigate, location.pathname]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, targetTypeFilter]);

  // Fetch announcements with pagination
  const { data: announcementsResponse, isLoading, error } = useQuery({
    queryKey: ['announcements', currentPage, itemsPerPage, debouncedSearchTerm, statusFilter, targetTypeFilter],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString()
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      if (targetTypeFilter) {
        params.append('target_type', targetTypeFilter);
      }
      
      const response = await apiService.get(`/api/admin/announcements?${params}`);
      return response.data;
    }
  });

  const announcements = announcementsResponse?.data || [];
  const totalItems = announcementsResponse?.total || 0;

  // Fetch target options based on target type
  const { data: targetOptionsResponse, isLoading: targetsLoading, error: targetsError } = useQuery({
    queryKey: ['announcement_targets', formData.target_type, targetSearch],
    queryFn: async () => {
      if (formData.target_type === 'all' || formData.target_type === 'fee_due') {
        return { data: [] };
      }
      
      try {
        const params = new URLSearchParams({
          type: formData.target_type === 'grade' ? 'grades' : 
                formData.target_type === 'parent' ? 'parents' : 'staff'
        });
        
        if (targetSearch && (formData.target_type === 'parent' || formData.target_type === 'staff')) {
          params.append('search', targetSearch);
        }
        
        const response = await apiService.get(`/api/admin/announcement_targets?${params}`);
        return response.data || { data: [] };
      } catch (error) {
        console.error('Failed to load targets:', error);
        return { data: [] };
      }
    },
    enabled: !['all', 'fee_due'].includes(formData.target_type),
    retry: 1
  });

  // Fetch delivery status for selected announcement
  const { data: deliveryStatusResponse, isLoading: deliveryLoading, error: deliveryError } = useQuery({
    queryKey: ['announcement_delivery_status', selectedAnnouncement?.id],
    queryFn: async () => {
      if (!selectedAnnouncement?.id) return null;
      try {
        const response = await apiService.get(`/api/admin/announcement_delivery_status/${selectedAnnouncement.id}`);
        return response.data;
      } catch (error) {
        console.error('Failed to load delivery status:', error);
        throw error;
      }
    },
    enabled: !!selectedAnnouncement?.id && showDeliveryModal,
    retry: 1
  });

  // Create announcement mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiService.post('/api/admin/announcements', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.refetchQueries({ queryKey: ['announcements'] });
      toast.success('Announcement created successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create announcement');
    }
  });

  // Update announcement mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiService.put(`/api/admin/announcements/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement updated successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update announcement');
    }
  });

  // Send announcement mutation
  const sendMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiService.post(`/api/admin/send_announcement/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement sent successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send announcement');
    }
  });

  // Delete announcement mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiService.delete(`/api/admin/announcements/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete announcement');
    }
  });

  const handleShowModal = (announcement = null) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        message: announcement.message,
        target_type: announcement.target_type,
        target_ids: announcement.target_ids || [],
        channels: announcement.channels || ['whatsapp'],
        scheduled_at: announcement.scheduled_at ? announcement.scheduled_at.split(' ')[0] : '',
        attachment_filename: announcement.attachment_filename || '',
        attachment_filepath: announcement.attachment_filepath || '',
        attachment_size: announcement.attachment_size || 0,
        attachment_mime_type: announcement.attachment_mime_type || ''
      });
      // Set selected file state for existing attachment
      if (announcement.attachment_filename) {
        setSelectedFile({ name: announcement.attachment_filename, size: announcement.attachment_size });
      } else {
        setSelectedFile(null);
      }
      setSelectedTargets(announcement.target_ids || []);
    } else {
      setEditingAnnouncement(null);
      setFormData({
        title: '',
        message: '',
        target_type: 'all',
        target_ids: [],
        channels: ['whatsapp'],
        scheduled_at: '',
        attachment_filename: '',
        attachment_filepath: '',
        attachment_size: 0,
        attachment_mime_type: ''
      });
      setSelectedFile(null);
      setSelectedTargets([]);
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAnnouncement(null);
    setSelectedTargets([]);
    setTargetSearch('');
    setErrors({});
    setSelectedFile(null);
    setUploadingFile(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'channels') {
        const updatedChannels = checked 
          ? [...formData.channels, value]
          : formData.channels.filter(ch => ch !== value);
        setFormData(prev => ({ ...prev, channels: updatedChannels }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Reset targets when target type changes
      if (name === 'target_type') {
        setSelectedTargets([]);
        setTargetSearch('');
      }
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not allowed. Please upload PDF, Word, Excel, Image, or Text files.');
      return;
    }

    setUploadingFile(true);
    try {
      // If editing and there's an existing file, delete it first
      if (editingAnnouncement && formData.attachment_filepath) {
        try {
          await apiService.deleteAnnouncementAttachment(formData.attachment_filepath);
        } catch (deleteError) {
          console.warn('Failed to delete previous file:', deleteError);
          // Continue with upload even if delete fails
        }
      }

      const formDataToUpload = new FormData();
      formDataToUpload.append('attachment', file);

      const response = await apiService.uploadAnnouncementAttachment(formDataToUpload);
      
      setSelectedFile(file);
      setFormData(prev => ({
        ...prev,
        attachment_filename: response.filename,
        attachment_filepath: response.filepath,
        attachment_size: response.size,
        attachment_mime_type: response.mime_type
      }));
      
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveAttachment = async () => {
    // If editing and there's an existing file, delete it from server
    if (editingAnnouncement && formData.attachment_filepath) {
      try {
        await apiService.deleteAnnouncementAttachment(formData.attachment_filepath);
      } catch (deleteError) {
        console.warn('Failed to delete file from server:', deleteError);
      }
    }

    setSelectedFile(null);
    setFormData(prev => ({
      ...prev,
      attachment_filename: '',
      attachment_filepath: '',
      attachment_size: 0,
      attachment_mime_type: ''
    }));
    // Clear file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const handleDownloadAttachment = (filepath, filename) => {
    if (!filepath) return;
    
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost/School/backend/';
    const fileUrl = filepath.split('/').pop();
    // Ensure proper URL format with slash
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : API_BASE_URL + '/';
    const downloadUrl = `${baseUrl}api/admin/public_download_attachment/${fileUrl}`;
    
    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // No authentication needed for public endpoint
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyAnnouncementLink = async (announcement) => {
    try {
      let linkToCopy;
      let successMessage;
      
      console.log('handleCopyAnnouncementLink called with:', announcement);
      console.log('attachment_filepath:', announcement.attachment_filepath);
      console.log('attachment_filename:', announcement.attachment_filename);
      
      // If there's an attachment, copy the file download link
      if (announcement.attachment_filepath && announcement.attachment_filename) {
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost/School/backend/';
        const fileUrl = announcement.attachment_filepath.split('/').pop();
        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : API_BASE_URL + '/';
        linkToCopy = `${baseUrl}api/admin/public_download_attachment/${fileUrl}`;
        successMessage = 'File download link copied!';
        
        // Also download the file
        handleDownloadAttachment(announcement.attachment_filepath, announcement.attachment_filename);
      } else {
        // If no attachment, copy announcement page link
        const currentUrl = window.location.origin;
        linkToCopy = `${currentUrl}/admin/announcements?id=${announcement.id}`;
        successMessage = 'Announcement link copied!';
      }
      
      // Copy to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(linkToCopy);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = linkToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      toast.success(successMessage, {
        duration: 3000,
        style: {
          background: '#10B981',
          color: 'white',
        },
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link to clipboard');
    }
  };

  const handleCopyFileLink = async (announcement) => {
    try {
      // Generate public file download link (no authentication required)
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost/School/backend/';
      const fileUrl = announcement.attachment_filepath.split('/').pop();
      // Ensure proper URL format with slash
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : API_BASE_URL + '/';
      const fileDownloadLink = `${baseUrl}api/admin/public_download_attachment/${fileUrl}`;
      
      // Copy to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fileDownloadLink);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = fileDownloadLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      toast.success(`File download link copied!`, {
        duration: 4000,
        style: {
          background: '#3B82F6',
          color: 'white',
        },
      });
    } catch (error) {
      console.error('Failed to copy file link:', error);
      toast.error('Failed to copy file link to clipboard');
    }
  };

  const handleTargetSelect = (target) => {
    if (!selectedTargets.find(t => t.id === target.id)) {
      setSelectedTargets(prev => [...prev, target]);
    }
  };

  const handleTargetRemove = (targetId) => {
    setSelectedTargets(prev => prev.filter(t => t.id !== targetId));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    if (formData.channels.length === 0) {
      newErrors.channels = 'At least one channel is required';
    }
    if (['grade', 'parent', 'staff'].includes(formData.target_type) && selectedTargets.length === 0) {
      newErrors.targets = 'Please select at least one target';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      target_ids: selectedTargets.map(t => t.id)
    };
    
    // Remove scheduled_at if it's empty or invalid
    if (!submitData.scheduled_at || submitData.scheduled_at === '' || submitData.scheduled_at === '0000-00-00') {
      delete submitData.scheduled_at;
    }

    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleSendAnnouncement = (announcement) => {
    if (window.confirm(`Are you sure you want to send this announcement? This action cannot be undone.`)) {
      sendMutation.mutate(announcement.id);
    }
  };

  const handleDeleteAnnouncement = (announcement) => {
    if (window.confirm(`Are you sure you want to delete this announcement?`)) {
      deleteMutation.mutate(announcement.id);
    }
  };

  const handleViewDeliveryStatus = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDeliveryModal(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'draft': 'secondary',
      'scheduled': 'warning',
      'sending': 'info',
      'sent': 'success',
      'failed': 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getTargetTypeLabel = (targetType) => {
    const labels = {
      'all': 'Everyone',
      'grade': 'Grade',
      'division': 'Division', 
      'parent': 'Parents',
      'staff': 'Staff',
      'fee_due': 'Fee Dues'
    };
    return labels[targetType] || targetType;
  };

  const getChannelIcon = (channel) => {
    const icons = {
      'whatsapp': 'bi-whatsapp text-success',
      'sms': 'bi-chat-text text-primary',
      'email': 'bi-envelope text-warning'
    };
    return icons[channel] || 'bi-bell';
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
        Failed to load announcements. Please try again.
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">
            <i className="bi bi-megaphone me-2"></i>
            Announcements Management
          </h4>
          <small className="text-muted">
            Send multi-channel notifications to parents and staff
          </small>
        </div>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <i className="bi bi-plus-circle me-2"></i>
          Create Announcement
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
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="sending">Sending</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={targetTypeFilter}
                onChange={(e) => setTargetTypeFilter(e.target.value)}
              >
                <option value="">All Targets</option>
                <option value="all">Everyone</option>
                <option value="grade">By Grade</option>
                <option value="parent">Specific Parents</option>
                <option value="staff">Specific Staff</option>
                <option value="fee_due">Fee Dues</option>
              </Form.Select>
            </Col>
            <Col md={2} className="text-end">
              <small className="text-muted">
                {totalItems} announcements
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {announcements && announcements.length > 0 ? (
            <>
              <Table responsive hover>
                <thead className="table-light">
                  <tr>
                    <th>Title</th>
                    <th>Target</th>
                    <th>Channels</th>
                    <th>Status</th>
                    <th>Recipients</th>
                    <th>Created</th>
                    <th>Scheduled</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((announcement) => (
                    <tr 
                      key={announcement.id}
                      className={highlightedAnnouncementId === announcement.id ? 'table-warning' : ''}
                      style={highlightedAnnouncementId === announcement.id ? {
                        animation: 'pulse 2s ease-in-out',
                        border: '2px solid #ffc107'
                      } : {}}
                    >
                      <td>
                        <div>
                          <div className="fw-medium d-flex align-items-center">
                            {announcement.title}
                            {announcement.attachment_filename && (
                              <div className="ms-2 d-inline-flex">
                                <button
                                  type="button"
                                  className="btn btn-link text-primary p-0 me-1"
                                  onClick={() => handleDownloadAttachment(announcement.attachment_filepath, announcement.attachment_filename)}
                                  title={`Download: ${announcement.attachment_filename}`}
                                >
                                  <i className="bi bi-paperclip"></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-link text-info p-0"
                                  onClick={() => handleCopyFileLink(announcement)}
                                  title="Copy file link"
                                >
                                  <i className="bi bi-link-45deg"></i>
                                </button>
                              </div>
                            )}
                          </div>
                          <small className="text-muted">
                            {announcement.message.substring(0, 60)}...
                          </small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <Badge bg="light" text="dark">
                            {getTargetTypeLabel(announcement.target_type)}
                          </Badge>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          {announcement.channels?.map((channel) => (
                            <i 
                              key={channel}
                              className={`${getChannelIcon(channel)} fs-5`} 
                              title={channel.toUpperCase()}
                            ></i>
                          ))}
                        </div>
                      </td>
                      <td>
                        {getStatusBadge(announcement.status)}
                      </td>
                      <td>
                        <div className="text-center">
                          {announcement.total_recipients > 0 ? (
                            <div>
                              <div className="fw-medium">{announcement.total_recipients}</div>
                              {announcement.status === 'sent' && (
                                <small className="text-success">
                                  {announcement.sent_count} sent
                                  {announcement.failed_count > 0 && (
                                    <span className="text-danger">
                                      , {announcement.failed_count} failed
                                    </span>
                                  )}
                                </small>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <small className="text-muted">
                            {new Date(announcement.created_at).toLocaleDateString()}
                          </small>
                          <div className="text-muted">
                            <small>by {announcement.created_by_name}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          {announcement.scheduled_at ? (
                            <small className="text-warning">
                              {new Date(announcement.scheduled_at).toLocaleDateString()}
                            </small>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          {announcement.attachment_filename ? (
                            <>
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleCopyFileLink(announcement)}
                                title="Copy file download link"
                              >
                                <i className="bi bi-file-arrow-down"></i>
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleCopyAnnouncementLink(announcement)}
                                title="Copy announcement link"
                              >
                                <i className="bi bi-share"></i>
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleCopyAnnouncementLink(announcement)}
                              title="Copy announcement link"
                            >
                              <i className="bi bi-share"></i>
                            </Button>
                          )}
                          
                          {announcement.status === 'sent' && (
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => handleViewDeliveryStatus(announcement)}
                              title="View Delivery Status"
                            >
                              <i className="bi bi-graph-up"></i>
                            </Button>
                          )}
                          
                          {announcement.status === 'draft' && (
                            <>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleShowModal(announcement)}
                                title="Edit Announcement"
                              >
                                <i className="bi bi-pencil"></i>
                              </Button>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleSendAnnouncement(announcement)}
                                disabled={sendMutation.isLoading}
                                title="Send Now"
                              >
                                <i className="bi bi-send"></i>
                              </Button>
                            </>
                          )}
                          
                          {['draft', 'scheduled'].includes(announcement.status) && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteAnnouncement(announcement)}
                              disabled={deleteMutation.isLoading}
                              title="Delete Announcement"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          )}
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
              <i className="bi bi-megaphone display-1 text-muted mb-4"></i>
              <h5>No Announcements Found</h5>
              <p className="text-muted mb-4">
                {searchTerm || statusFilter || targetTypeFilter
                  ? 'No announcements match your search criteria.'
                  : 'Start by creating your first announcement.'
                }
              </p>
              <Button variant="primary" onClick={() => handleShowModal()}>
                <i className="bi bi-plus-circle me-2"></i>
                Create First Announcement
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Create/Edit Announcement Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-announcement text-white border-0" closeButton>
            <Modal.Title className="d-flex align-items-center fs-4">
              <div className="modal-icon-wrapper me-3">
                <i className="bi bi-megaphone fs-3"></i>
              </div>
              <div>
                <h5 className="mb-0">
                  {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                </h5>
                <small className="opacity-75">
                  Send multi-channel notifications to your target audience
                </small>
              </div>
            </Modal.Title>
          </Modal.Header>

          <Form onSubmit={handleSubmit}>
            <Modal.Body className="p-4">
              <Row>
                <Col md={12} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Announcement Title"
                      isInvalid={!!errors.title}
                      maxLength={200}
                      className="form-control-lg"
                      id="title"
                    />
                    <label htmlFor="title" className="text-muted">
                      <i className="bi bi-card-text me-2"></i>Announcement Title *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.title}
                    </Form.Control.Feedback>
                  </div>
                </Col>

                <Col md={12} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Message"
                      isInvalid={!!errors.message}
                      style={{ minHeight: '120px' }}
                      id="message"
                    />
                    <label htmlFor="message" className="text-muted">
                      <i className="bi bi-chat-text me-2"></i>Message *
                    </label>
                    <Form.Control.Feedback type="invalid">
                      {errors.message}
                    </Form.Control.Feedback>
                  </div>
                </Col>

                <Col md={6} className="mb-3">
                  <div className="form-floating">
                    <Form.Select
                      name="target_type"
                      value={formData.target_type}
                      onChange={handleInputChange}
                      className="form-control-lg"
                      id="targetType"
                    >
                      <option value="all">Send to Everyone</option>
                      <option value="grade">Send to Grade</option>
                      <option value="parent">Specific Parents</option>
                      <option value="staff">Specific Staff</option>
                      <option value="fee_due">Parents with Fee Dues</option>
                    </Form.Select>
                    <label htmlFor="targetType" className="text-muted">
                      <i className="bi bi-people me-2"></i>Target Audience *
                    </label>
                  </div>
                </Col>

                <Col md={6} className="mb-3">
                  <div className="form-floating">
                    <Form.Control
                      type="date"
                      name="scheduled_at"
                      value={formData.scheduled_at}
                      onChange={handleInputChange}
                      className="form-control-lg"
                      id="scheduledAt"
                    />
                    <label htmlFor="scheduledAt" className="text-muted">
                      <i className="bi bi-calendar-event me-2"></i>Schedule For (Optional)
                    </label>
                  </div>
                  <Form.Text className="text-muted">
                    Leave empty to send immediately
                  </Form.Text>
                </Col>
              </Row>

              {/* Target Selection */}
              {['grade', 'parent', 'staff'].includes(formData.target_type) && (
                <div className="mb-3">
                  <label className="form-label fw-medium">
                    <i className="bi bi-person-check me-2"></i>
                    Select {getTargetTypeLabel(formData.target_type)} *
                  </label>
                  
                  {(formData.target_type === 'parent' || formData.target_type === 'staff') && (
                    <Form.Control
                      type="text"
                      placeholder={`Search ${formData.target_type}...`}
                      value={targetSearch}
                      onChange={(e) => setTargetSearch(e.target.value)}
                      className="mb-2"
                    />
                  )}

                  {targetsLoading ? (
                    <div className="text-center p-3">
                      <Spinner size="sm" className="me-2" />
                      Loading {formData.target_type}...
                    </div>
                  ) : targetsError ? (
                    <div className="text-center p-3 text-danger">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Failed to load {formData.target_type}. Please try again.
                    </div>
                  ) : (
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="border rounded p-2">
                      {targetOptionsResponse?.data?.length > 0 ? targetOptionsResponse.data.map((option) => (
                        <div 
                          key={option.id}
                          className="d-flex align-items-center justify-content-between p-2 hover-bg-light cursor-pointer"
                          onClick={() => handleTargetSelect(option)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div>
                            <div className="fw-medium">{option.name}</div>
                            {option.mobile && (
                              <small className="text-muted">{option.mobile}</small>
                            )}
                            {option.student_count && (
                              <small className="text-muted"> - {option.student_count} students</small>
                            )}
                          </div>
                          {selectedTargets.find(t => t.id === option.id) && (
                            <i className="bi bi-check-circle-fill text-success"></i>
                          )}
                        </div>
                      )) : (
                        <div className="text-center p-3 text-muted">
                          <i className="bi bi-info-circle me-2"></i>
                          No {formData.target_type} found
                          {(formData.target_type === 'parent' || formData.target_type === 'staff') && targetSearch && 
                            ` matching "${targetSearch}"`
                          }
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Targets */}
                  {selectedTargets.length > 0 && (
                    <div className="mt-2">
                      <small className="text-muted">Selected ({selectedTargets.length}):</small>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {selectedTargets.map((target) => (
                          <Badge 
                            key={target.id} 
                            bg="primary" 
                            className="d-flex align-items-center"
                          >
                            {target.name}
                            <Button
                              variant="link"
                              size="sm"
                              className="text-white p-0 ms-1"
                              onClick={() => handleTargetRemove(target.id)}
                            >
                              <i className="bi bi-x"></i>
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {errors.targets && (
                    <div className="invalid-feedback d-block">{errors.targets}</div>
                  )}
                </div>
              )}

              {/* Channel Selection */}
              <div className="mb-3">
                <label className="form-label fw-medium">
                  <i className="bi bi-broadcast me-2"></i>
                  Notification Channels *
                </label>
                <div className="d-flex gap-3">
                  {[
                    { value: 'whatsapp', label: 'WhatsApp', icon: 'bi-whatsapp text-success' },
                    { value: 'sms', label: 'SMS', icon: 'bi-chat-text text-primary' },
                    { value: 'email', label: 'Email', icon: 'bi-envelope text-warning' }
                  ].map((channel) => (
                    <Form.Check
                      key={channel.value}
                      type="checkbox"
                      name="channels"
                      value={channel.value}
                      checked={formData.channels.includes(channel.value)}
                      onChange={handleInputChange}
                      label={
                        <span>
                          <i className={`${channel.icon} me-2`}></i>
                          {channel.label}
                        </span>
                      }
                      className="border rounded p-2"
                    />
                  ))}
                </div>
                {errors.channels && (
                  <div className="invalid-feedback d-block">{errors.channels}</div>
                )}
              </div>

              {/* File Attachment */}
              <div className="mb-3">
                <label className="form-label fw-medium">
                  <i className="bi bi-paperclip me-2"></i>
                  File Attachment (Optional)
                </label>
                <div className="border rounded p-3">
                  {!selectedFile && !formData.attachment_filename ? (
                    <div className="text-center">
                      <input
                        type="file"
                        className="d-none"
                        id="attachment-upload"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                      <label htmlFor="attachment-upload" className="btn btn-outline-primary cursor-pointer">
                        {uploadingFile ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-cloud-upload me-2"></i>
                            Choose File
                          </>
                        )}
                      </label>
                      <div className="mt-2 small text-muted">
                        Supported: PDF, Word, Excel, Images, Text files (Max 10MB)
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-file-earmark text-primary me-2 fs-5"></i>
                        <div>
                          <div className="fw-medium d-flex align-items-center">
                            {selectedFile?.name || formData.attachment_filename}
                            {editingAnnouncement && !selectedFile && (
                              <span className="badge bg-info ms-2 small">Previously uploaded</span>
                            )}
                            {selectedFile && editingAnnouncement && (
                              <span className="badge bg-success ms-2 small">Newly uploaded</span>
                            )}
                          </div>
                          <small className="text-muted">
                            {selectedFile ? 
                              `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 
                              `${(formData.attachment_size / 1024 / 1024).toFixed(2)} MB`
                            }
                            {editingAnnouncement && !selectedFile && formData.attachment_filepath && (
                              <span className="text-info ms-2">
                                • Will be replaced if new file uploaded
                              </span>
                            )}
                          </small>
                        </div>
                      </div>
                      <div className="d-flex gap-1">
                        {formData.attachment_filepath && !selectedFile && (
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleDownloadAttachment(formData.attachment_filepath, formData.attachment_filename)}
                            title="Download current file"
                          >
                            <i className="bi bi-download"></i>
                          </Button>
                        )}
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={handleRemoveAttachment}
                          title="Remove attachment"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer className="bg-light border-0 p-4">
              <Button variant="outline-secondary" onClick={handleCloseModal}>
                <i className="bi bi-x-circle me-2"></i>Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={createMutation.isLoading || updateMutation.isLoading}
              >
                {createMutation.isLoading || updateMutation.isLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    {editingAnnouncement ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <i className={`bi ${editingAnnouncement ? 'bi-arrow-repeat' : 'bi-plus-circle'} me-2`}></i>
                    {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </div>

        <style jsx>{`
          .bg-gradient-announcement {
            background: linear-gradient(135deg, #e74c3c 0%, #f39c12 100%) !important;
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
          .hover-bg-light:hover {
            background-color: #f8f9fa;
          }
          .cursor-pointer {
            cursor: pointer;
          }
          @keyframes pulse {
            0% { background-color: #fff3cd; }
            50% { background-color: #ffeaa7; }
            100% { background-color: #fff3cd; }
          }
        `}</style>
      </Modal>

      {/* Delivery Status Modal */}
      <Modal show={showDeliveryModal} onHide={() => setShowDeliveryModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-graph-up me-2"></i>
            Delivery Status - {selectedAnnouncement?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deliveryLoading ? (
            <div className="text-center p-4">
              <Spinner className="me-2" />
              Loading delivery status...
            </div>
          ) : deliveryError ? (
            <div className="text-center p-4">
              <Alert variant="danger">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Failed to load delivery status. Please try again.
              </Alert>
            </div>
          ) : deliveryStatusResponse ? (
            <div>
              {/* Statistics */}
              <Row className="mb-4">
                {Object.entries(deliveryStatusResponse.statistics?.by_status || {}).map(([status, count]) => (
                  <Col key={status} sm={6} md={3} className="mb-2">
                    <Card className="text-center">
                      <Card.Body className="py-2">
                        <div className="h5 mb-1">{count}</div>
                        <small className="text-muted text-uppercase">{status}</small>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Channel Statistics */}
              <div className="mb-4">
                <h6>By Channel</h6>
                {Object.entries(deliveryStatusResponse.statistics?.by_channel || {}).map(([channel, count]) => (
                  <div key={channel} className="d-flex align-items-center mb-2">
                    <i className={`${getChannelIcon(channel)} me-2 fs-5`}></i>
                    <span className="me-2">{channel.toUpperCase()}</span>
                    <Badge bg="primary">{count}</Badge>
                  </div>
                ))}
              </div>

              {/* Delivery Details */}
              {deliveryStatusResponse.delivery_status?.length > 0 && (
                <div>
                  <h6>Delivery Details</h6>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <Table size="sm" responsive>
                      <thead>
                        <tr>
                          <th>Recipient</th>
                          <th>Channel</th>
                          <th>Status</th>
                          <th>Sent At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveryStatusResponse.delivery_status.map((delivery) => (
                          <tr key={delivery.id}>
                            <td>
                              <div>
                                <div className="fw-medium">{delivery.recipient_name}</div>
                                <small className="text-muted">
                                  {delivery.recipient_mobile || delivery.recipient_email}
                                </small>
                              </div>
                            </td>
                            <td>
                              <i className={`${getChannelIcon(delivery.channel)} me-1`}></i>
                              {delivery.channel.toUpperCase()}
                            </td>
                            <td>
                              {getStatusBadge(delivery.status)}
                            </td>
                            <td>
                              <small>
                                {delivery.sent_at ? new Date(delivery.sent_at).toLocaleString() : '-'}
                              </small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-4">
              <Spinner />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeliveryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AnnouncementsManagement;