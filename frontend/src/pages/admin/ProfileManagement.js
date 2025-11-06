import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Alert, Badge, Spinner, Modal } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const ProfileManagement = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    emergency_contact: '',
    bio: ''
  });
  
  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Load user profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['user_profile'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/profile');
      return response.data;
    },
    onSuccess: (data) => {
      setProfileForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        emergency_contact: data.emergency_contact || '',
        bio: data.bio || ''
      });
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      const response = await apiService.put('/api/admin/profile', profileData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['user_profile']);
      updateUser(data); // Update auth context
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData) => {
      const response = await apiService.put('/api/admin/change_password', passwordData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    changePasswordMutation.mutate({
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password
    });
  };

  const handleInputChange = (field, value) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  if (profileLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">
            <i className="bi bi-person-circle me-2"></i>
            Profile Management
          </h4>
          <small className="text-muted">
            Manage your account information and settings
          </small>
        </div>
      </div>

      <Row>
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="mb-3">
                <i className="bi bi-person-circle display-1 text-muted"></i>
              </div>
              <h5 className="mb-1">{profileData?.name || 'User Name'}</h5>
              <p className="text-muted mb-2">{profileData?.email}</p>
              <Badge bg="primary" className="mb-3">
                {profileData?.user_type || user?.user_type || 'Admin'}
              </Badge>
              
              <div className="d-grid gap-2">
                <Button 
                  variant="outline-primary"
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={updateProfileMutation.isLoading}
                >
                  <i className="bi bi-pencil-square me-2"></i>
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </Button>
                <Button 
                  variant="outline-secondary"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <i className="bi bi-lock me-2"></i>
                  Change Password
                </Button>
              </div>

              <hr className="my-4" />
              
              <div className="text-start">
                <h6 className="text-muted mb-3">Account Details</h6>
                <div className="mb-2">
                  <small className="text-muted">Member since:</small>
                  <div>{new Date(profileData?.created_at || Date.now()).toLocaleDateString()}</div>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Last login:</small>
                  <div>{new Date(profileData?.last_login || Date.now()).toLocaleString()}</div>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Account status:</small>
                  <div>
                    <Badge bg="success">Active</Badge>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Personal Information
              </h6>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleProfileSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-dark fw-medium">Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-dark fw-medium">Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-dark fw-medium">Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        placeholder="+91 98765 43210"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-dark fw-medium">Emergency Contact</Form.Label>
                      <Form.Control
                        type="tel"
                        value={profileForm.emergency_contact}
                        onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                        disabled={!isEditing}
                        placeholder="+91 98765 43210"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="text-dark fw-medium">Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={profileForm.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your address"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="text-dark fw-medium">Bio / Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself..."
                  />
                </Form.Group>

                {isEditing && (
                  <div className="d-flex gap-2">
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={updateProfileMutation.isLoading}
                    >
                      {updateProfileMutation.isLoading ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline-secondary"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-lock me-2"></i>
            Change Password
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePasswordSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="text-dark fw-medium">Current Password</Form.Label>
              <Form.Control
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => handlePasswordInputChange('current_password', e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-dark fw-medium">New Password</Form.Label>
              <Form.Control
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => handlePasswordInputChange('new_password', e.target.value)}
                required
                minLength={6}
              />
              <Form.Text className="text-muted">
                Password must be at least 6 characters long.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-dark fw-medium">Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => handlePasswordInputChange('confirm_password', e.target.value)}
                required
                minLength={6}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={changePasswordMutation.isLoading}
            >
              {changePasswordMutation.isLoading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfileManagement;