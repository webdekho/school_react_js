import React, { useState, useEffect } from 'react';
import { Dropdown, Badge, Button, Card, ListGroup, Spinner, Alert, Modal, Row, Col } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const AnnouncementsNotification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);

  // Fetch recent announcements for the user
  const { data: announcements, isLoading: announcementsLoading, error: announcementsError } = useQuery({
    queryKey: ['user_announcements', user?.user_type, user?.id],
    queryFn: async () => {
      try {
        // Get recent announcements based on user type
        const params = {
          limit: 10,
          offset: 0,
          status: 'sent', // Only show sent announcements
        };
        
        // Determine the correct endpoint based on user type
        let endpoint = '/api/admin/announcements';
        if (user?.user_type === 'parent') {
          endpoint = '/api/parent/announcements';
        } else if (user?.user_type === 'staff') {
          endpoint = '/api/staff/announcements';
        }
        
        const response = await apiService.get(endpoint, params);
        return response.data?.data || response.data || [];
      } catch (error) {
        // If endpoint fails, return default announcements
        if (error.response?.status === 404 || error.response?.status === 403) {
          return getDefaultAnnouncements();
        }
        throw error;
      }
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch all announcements for the "View All" modal
  const { data: allAnnouncements, isLoading: allAnnouncementsLoading } = useQuery({
    queryKey: ['all_user_announcements', user?.user_type, user?.id],
    queryFn: async () => {
      try {
        const params = {
          limit: 50, // Get more announcements for the full view
          offset: 0,
          status: 'sent',
        };
        
        // Determine the correct endpoint based on user type
        let endpoint = '/api/admin/announcements';
        if (user?.user_type === 'parent') {
          endpoint = '/api/parent/announcements';
        } else if (user?.user_type === 'staff') {
          endpoint = '/api/staff/announcements';
        }
        
        const response = await apiService.get(endpoint, params);
        return response.data?.data || response.data || [];
      } catch (error) {
        if (error.response?.status === 404 || error.response?.status === 403) {
          return getDefaultAnnouncements();
        }
        throw error;
      }
    },
    enabled: showAllModal, // Only fetch when modal is shown
  });

  // Default announcements when API is not available or for demo
  const getDefaultAnnouncements = () => {
    const baseAnnouncements = [
      {
        id: 1,
        title: 'New Academic Year Started',
        message: 'Welcome to the new academic year 2024-2025. Please ensure all documents are updated.',
        target_type: 'all',
        status: 'sent',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        created_by_name: 'Admin',
        priority: 'high'
      },
      {
        id: 2,
        title: 'Fee Payment Reminder',
        message: 'Monthly fees are due by the 10th of each month. Please ensure timely payment.',
        target_type: user?.user_type === 'parent' ? 'parent' : 'all',
        status: 'sent',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        created_by_name: 'Finance Team',
        priority: 'medium'
      },
      {
        id: 3,
        title: 'Parent-Teacher Meeting',
        message: 'Monthly parent-teacher meeting scheduled for next Saturday. Please check the schedule.',
        target_type: user?.user_type === 'parent' ? 'parent' : 'all',
        status: 'sent',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        created_by_name: 'Academic Team',
        priority: 'medium'
      }
    ];

    // Filter based on user type (admin and staff see all, others see relevant ones)
    if (user?.user_type === 'admin' || user?.user_type === 'staff') {
      return baseAnnouncements;
    } else {
      return baseAnnouncements.filter(ann => 
        ann.target_type === 'all' || ann.target_type === user?.user_type
      );
    }
  };

  // Mark announcement as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (announcementId) => {
      try {
        // Determine the correct endpoint based on user type
        let endpoint = `/api/admin/announcements/${announcementId}/read`;
        if (user?.user_type === 'parent') {
          endpoint = `/api/parent/announcements/${announcementId}/read`;
        } else if (user?.user_type === 'staff') {
          endpoint = `/api/staff/announcements/${announcementId}/read`;
        }
        
        const response = await apiService.post(endpoint);
        return response.data;
      } catch (error) {
        // If endpoint doesn't exist, simulate locally
        if (error.response?.status === 404) {
          return { id: announcementId, read: true };
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user_announcements']);
      queryClient.invalidateQueries(['all_user_announcements']);
    },
    onError: (error) => {
      console.error('Failed to mark announcement as read:', error);
    }
  });

  const handleAnnouncementClick = (announcement) => {
    // Mark as read
    markAsReadMutation.mutate(announcement.id);
    
    // Navigate to announcements page or show details
    if (user?.user_type === 'admin' || user?.user_type === 'staff') {
      navigate('/admin/announcements', { 
        state: { 
          searchAnnouncement: announcement.title, 
          announcementId: announcement.id 
        }
      });
    } else {
      // For non-admin users, you might want to show a detailed view
      toast.success('Opening announcement details');
    }
    
    setShowAnnouncements(false);
  };

  // File download functions
  const handleDownloadAttachment = (filepath, filename) => {
    if (!filepath) return;
    
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost/School/backend/';
    const fileUrl = filepath.split('/').pop();
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : API_BASE_URL + '/';
    const downloadUrl = `${baseUrl}api/admin/public_download_attachment/${fileUrl}`;
    
    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Downloading file...');
  };

  const handleOpenFile = (filepath, filename, mimeType) => {
    if (!filepath) return;
    
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost/School/backend/';
    const fileUrl = filepath.split('/').pop();
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : API_BASE_URL + '/';
    const fileOpenUrl = `${baseUrl}api/admin/public_download_attachment/${fileUrl}`;
    
    // Check if it's a viewable file type
    const viewableTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];
    
    if (viewableTypes.includes(mimeType)) {
      // Open in new tab for viewable files
      window.open(fileOpenUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Force download for other file types
      handleDownloadAttachment(filepath, filename);
    }
  };

  const handleCopyFileLink = async (announcement) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost/School/backend/';
      const fileUrl = announcement.attachment_filepath.split('/').pop();
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
      
      toast.success('File link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy file link:', error);
      toast.error('Failed to copy file link');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  const getTargetTypeIcon = (targetType) => {
    switch (targetType) {
      case 'parent': return 'bi-people';
      case 'staff': return 'bi-person-badge';
      case 'admin': return 'bi-person-gear';
      case 'all': return 'bi-broadcast';
      default: return 'bi-info-circle';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Filter announcements based on user type (show all recent announcements)
  const recentAnnouncements = announcements?.filter(announcement => {
    const isRelevant = announcement.target_type === 'all' || 
                      announcement.target_type === user?.user_type ||
                      user?.user_type === 'admin' || user?.user_type === 'staff';
    return isRelevant && announcement.status === 'sent';
  }) || [];

  const unreadCount = recentAnnouncements.filter(ann => !ann.is_read).length || recentAnnouncements.length;
  const attachmentCount = recentAnnouncements.filter(ann => ann.attachment_filename).length;

  return (
    <div className="position-relative">
      <Dropdown show={showAnnouncements} onToggle={setShowAnnouncements}>
        <Dropdown.Toggle
          as={Button}
          variant="link"
          className="text-muted p-1 border-0 position-relative"
          style={{ boxShadow: 'none' }}
        >
          <i className="bi bi-bell fs-5"></i>
          {unreadCount > 0 && (
            <Badge 
              bg="danger" 
              className="position-absolute"
              style={{ 
                fontSize: '0.6rem',
                top: '0px',
                right: '0px',
                transform: 'translate(50%, -50%)'
              }}
            >
              {unreadCount}
            </Badge>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu 
          align="end" 
          className="shadow-lg border-0" 
          style={{ width: '400px', maxHeight: '500px', overflowY: 'auto' }}
        >
          <div className="p-3 border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <i className="bi bi-bell me-2"></i>
                Announcements
                {attachmentCount > 0 && (
                  <i className="bi bi-paperclip text-info ms-1" title={`${attachmentCount} with attachments`}></i>
                )}
              </h6>
              <div className="d-flex align-items-center gap-2">
                {attachmentCount > 0 && (
                  <Badge bg="info" className="small">
                    {attachmentCount} files
                  </Badge>
                )}
                <Badge bg="primary" pill>{unreadCount}</Badge>
              </div>
            </div>
            {user?.user_type !== 'admin' && user?.user_type !== 'staff' && (
              <small className="text-muted">
                Showing announcements for {user?.user_type}s and general announcements
              </small>
            )}
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {announcementsLoading ? (
              <div className="text-center py-4">
                <Spinner animation="border" size="sm" />
                <div className="small text-muted mt-2">Loading announcements...</div>
              </div>
            ) : announcementsError ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-exclamation-circle"></i>
                <div className="small">Failed to load announcements</div>
              </div>
            ) : recentAnnouncements.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-bell-slash fs-1 text-muted"></i>
                <div className="small">No recent announcements</div>
                <div className="small">You're all caught up!</div>
              </div>
            ) : (
              <ListGroup variant="flush">
                {recentAnnouncements.map((announcement) => (
                  <ListGroup.Item 
                    key={announcement.id} 
                    className="border-0 px-3 py-3"
                    onClick={() => handleAnnouncementClick(announcement)}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1 me-2">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <i className={`${getTargetTypeIcon(announcement.target_type)} text-muted`}></i>
                          <span className="fw-medium small">
                            {announcement.title}
                          </span>
                          {announcement.priority && (
                            <Badge bg={getPriorityColor(announcement.priority)} size="sm">
                              {announcement.priority}
                            </Badge>
                          )}
                        </div>
                        <div className="small text-muted mb-2" style={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {announcement.message}
                        </div>
                        
                        {/* File Attachment Section */}
                        {announcement.attachment_filename && (
                          <div className="mb-2 p-2 bg-light rounded small">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center">
                                <i className="bi bi-paperclip text-muted me-1"></i>
                                <span className="text-muted">{announcement.attachment_filename}</span>
                              </div>
                              <div className="d-flex gap-1">
                                <button
                                  type="button"
                                  className="btn btn-link text-success p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenFile(
                                      announcement.attachment_filepath, 
                                      announcement.attachment_filename, 
                                      announcement.attachment_mime_type
                                    );
                                  }}
                                  title="Open file"
                                >
                                  <i className="bi bi-eye"></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-link text-primary p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadAttachment(
                                      announcement.attachment_filepath, 
                                      announcement.attachment_filename
                                    );
                                  }}
                                  title="Download file"
                                >
                                  <i className="bi bi-download"></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-link text-info p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyFileLink(announcement);
                                  }}
                                  title="Copy file link"
                                >
                                  <i className="bi bi-link-45deg"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="d-flex align-items-center justify-content-between">
                          <small className="text-muted">
                            <i className="bi bi-person me-1"></i>
                            {announcement.created_by_name}
                          </small>
                          <small className="text-muted">
                            {formatTimeAgo(announcement.created_at)}
                          </small>
                        </div>
                      </div>
                      {!announcement.is_read && (
                        <div 
                          className="bg-primary rounded-circle"
                          style={{ width: '8px', height: '8px', minWidth: '8px' }}
                        ></div>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>

          <div className="p-3 border-top text-center">
            <Button 
              variant="outline-primary" 
              size="sm" 
              className="w-100"
              onClick={() => {
                setShowAnnouncements(false);
                setShowAllModal(true);
              }}
            >
              <i className="bi bi-list-ul me-2"></i>
              View All Announcements
            </Button>
          </div>
        </Dropdown.Menu>
      </Dropdown>

      {/* View All Announcements Modal */}
      <Modal 
        show={showAllModal} 
        onHide={() => setShowAllModal(false)} 
        size="lg" 
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-bell me-2"></i>
            All Announcements
            {user?.user_type !== 'admin' && user?.user_type !== 'staff' && (
              <Badge bg="secondary" className="ms-2">
                {user?.user_type}
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {allAnnouncementsLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <div className="mt-2">Loading all announcements...</div>
            </div>
          ) : allAnnouncements?.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-bell-slash fs-1"></i>
              <h5 className="mt-3">No Announcements</h5>
              <p>There are no announcements available for you at this time.</p>
            </div>
          ) : (
            <div className="announcement-list">
              {allAnnouncements?.map((announcement, index) => (
                <Card 
                  key={announcement.id} 
                  className={`mb-3 border-start border-${getPriorityColor(announcement.priority)} border-3 ${
                    !announcement.is_read ? 'bg-light' : ''
                  }`}
                >
                  <Card.Body>
                    <Row>
                      <Col>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="mb-0 flex-grow-1">
                            {announcement.title}
                            {!announcement.is_read && (
                              <Badge bg="primary" className="ms-2 small">New</Badge>
                            )}
                          </h6>
                          <div className="d-flex align-items-center gap-2">
                            <Badge bg={getPriorityColor(announcement.priority)} size="sm">
                              {announcement.priority}
                            </Badge>
                            <i className={`${getTargetTypeIcon(announcement.target_type)} text-muted`}></i>
                          </div>
                        </div>
                        
                        <p className="text-muted mb-3" style={{ fontSize: '0.95rem' }}>
                          {announcement.message}
                        </p>
                        
                        {/* File Attachment Section for Modal */}
                        {announcement.attachment_filename && (
                          <div className="mb-3 p-3 bg-light rounded">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center">
                                <i className="bi bi-file-earmark text-primary me-2 fs-5"></i>
                                <div>
                                  <div className="fw-medium">{announcement.attachment_filename}</div>
                                  <small className="text-muted">
                                    {announcement.attachment_size ? 
                                      `${(announcement.attachment_size / 1024 / 1024).toFixed(2)} MB` : 
                                      'File attachment'
                                    }
                                  </small>
                                </div>
                              </div>
                              <div className="d-flex gap-1">
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenFile(
                                      announcement.attachment_filepath, 
                                      announcement.attachment_filename, 
                                      announcement.attachment_mime_type
                                    );
                                  }}
                                  title="Open file"
                                >
                                  <i className="bi bi-eye me-1"></i>Open
                                </Button>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadAttachment(
                                      announcement.attachment_filepath, 
                                      announcement.attachment_filename
                                    );
                                  }}
                                  title="Download file"
                                >
                                  <i className="bi bi-download me-1"></i>Download
                                </Button>
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyFileLink(announcement);
                                  }}
                                  title="Copy file link"
                                >
                                  <i className="bi bi-link-45deg me-1"></i>Copy
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-3">
                            <small className="text-muted">
                              <i className="bi bi-person me-1"></i>
                              {announcement.created_by_name}
                            </small>
                            <small className="text-muted">
                              <i className="bi bi-calendar me-1"></i>
                              {new Date(announcement.created_at).toLocaleDateString()}
                            </small>
                            <small className="text-muted">
                              <i className="bi bi-clock me-1"></i>
                              {formatTimeAgo(announcement.created_at)}
                            </small>
                          </div>
                          
                          {!announcement.is_read && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                markAsReadMutation.mutate(announcement.id);
                              }}
                              disabled={markAsReadMutation.isLoading}
                            >
                              {markAsReadMutation.isLoading ? (
                                <Spinner size="sm" />
                              ) : (
                                <>
                                  <i className="bi bi-check2 me-1"></i>
                                  Mark as Read
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between align-items-center w-100">
            <div>
              {allAnnouncements?.length > 0 && (
                <small className="text-muted">
                  Showing {allAnnouncements.length} announcements
                </small>
              )}
            </div>
            <div className="d-flex gap-2">
              {(user?.user_type === 'admin' || user?.user_type === 'staff') && (
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setShowAllModal(false);
                    navigate('/admin/announcements');
                  }}
                >
                  <i className="bi bi-gear me-2"></i>
                  Manage
                </Button>
              )}
              <Button variant="secondary" onClick={() => setShowAllModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AnnouncementsNotification;