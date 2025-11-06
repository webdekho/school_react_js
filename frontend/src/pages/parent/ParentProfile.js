import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Alert, Badge, Spinner, Modal } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const ParentProfile = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    mobile: '',
    phone: '',
    address: '',
    emergency_contact: '',
    occupation: '',
    relation: ''
  });
  
  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Load user profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['parent_profile'],
    queryFn: async () => {
      const response = await apiService.get('/api/parent/profile');
      return response.data;
    }
  });

  // Process profile data when it changes
  useEffect(() => {
    if (profileData) {
      setProfileForm({
        name: profileData.name || '',
        email: profileData.email || '',
        mobile: profileData.mobile || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        emergency_contact: profileData.emergency_contact || '',
        occupation: profileData.occupation || '',
        relation: profileData.relation || ''
      });
    }
  }, [profileData]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      const response = await apiService.put('/api/parent/profile', profileData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['parent_profile']);
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
      const response = await apiService.put('/api/parent/change-password', passwordData);
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

  // Upload profile picture mutation
  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await apiService.post('/api/parent/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parent_profile']);
      toast.success('Profile picture updated successfully!');
      setShowProfilePictureModal(false);
      setSelectedImage(null);
      setImagePreview(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
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

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should not exceed 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureUpload = () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    const formData = new FormData();
    formData.append('profile_picture', selectedImage);
    uploadProfilePictureMutation.mutate(formData);
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
          <h5 className="mb-0 fw-semibold" style={{ fontSize: '1.1rem' }}>
            <i className="bi bi-person-circle me-2" style={{ fontSize: '1rem' }}></i>
            My Profile
          </h5>
          <small className="text-muted">
            Manage your account information and settings
          </small>
        </div>
      </div>

      <Row>
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="mb-3 position-relative d-inline-block">
                {profileData?.profile_picture ? (
                  <img 
                    src={profileData.profile_picture} 
                    alt="Profile" 
                    className="rounded-circle"
                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                  />
                ) : (
                <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center mx-auto"
                     style={{ width: '80px', height: '80px' }}>
                  <i className="bi bi-person-fill text-white" style={{ fontSize: '2rem' }}></i>
                </div>
                )}
                <Button
                  variant="light"
                  size="sm"
                  className="position-absolute bottom-0 end-0 rounded-circle p-1"
                  style={{ width: '28px', height: '28px' }}
                  onClick={() => setShowProfilePictureModal(true)}
                >
                  <i className="bi bi-camera-fill"></i>
                </Button>
              </div>
              <h5 className="mb-1">{profileData?.name || 'Parent Name'}</h5>
              <p className="text-muted mb-2">{profileData?.email}</p>
              <Badge bg="success" className="mb-3">
                {profileData?.relation || 'Parent'}
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
                      <Form.Label className="fw-medium text-dark">
                        <i className="bi bi-person me-2 text-secondary"></i>
                        Full Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                        required
                        placeholder="Enter your full name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium text-dark">
                        <i className="bi bi-envelope me-2 text-secondary"></i>
                        Email Address <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        required
                        placeholder="your.email@example.com"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium text-dark">
                        <i className="bi bi-phone me-2 text-secondary"></i>
                        Mobile Number <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        value={profileForm.mobile}
                        onChange={(e) => handleInputChange('mobile', e.target.value)}
                        disabled={!isEditing}
                        placeholder="+91 98765 43210"
                        required
                      />
                      <Form.Text className="text-muted">
                        Primary contact number
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium text-dark">
                        <i className="bi bi-telephone me-2 text-secondary"></i>
                        Alternate Phone Number
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        placeholder="+91 98765 43210"
                      />
                      <Form.Text className="text-muted">
                        Optional alternate number
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium text-dark">
                        <i className="bi bi-shield-check me-2 text-secondary"></i>
                        Emergency Contact Number
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        value={profileForm.emergency_contact}
                        onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                        disabled={!isEditing}
                        placeholder="+91 98765 43210"
                      />
                      <Form.Text className="text-muted">
                        For emergency situations
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium text-dark">
                        <i className="bi bi-people me-2 text-secondary"></i>
                        Relation to Student
                      </Form.Label>
                      <Form.Select
                        value={profileForm.relation}
                        onChange={(e) => handleInputChange('relation', e.target.value)}
                        disabled={!isEditing}
                      >
                        <option value="">Select Relation</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Uncle">Uncle</option>
                        <option value="Aunt">Aunt</option>
                        <option value="Grandparent">Grandparent</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium text-dark">
                    <i className="bi bi-geo-alt me-2 text-secondary"></i>
                    Residential Address
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={profileForm.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your complete residential address"
                  />
                  <Form.Text className="text-muted">
                    Include street, locality, city, state, and PIN code
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium text-dark">
                    <i className="bi bi-briefcase me-2 text-secondary"></i>
                    Occupation/Profession
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={profileForm.occupation}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g., Software Engineer, Teacher, Business Owner"
                  />
                  <Form.Text className="text-muted">
                    Your current profession or occupation
                  </Form.Text>
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

      {/* Profile Picture Upload Modal */}
      <Modal show={showProfilePictureModal} onHide={() => setShowProfilePictureModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-camera me-2"></i>
            Update Profile Picture
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            {imagePreview ? (
              <div className="mb-3">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="rounded-circle"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
              </div>
            ) : (
              <div className="mb-3">
                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto"
                     style={{ width: '150px', height: '150px' }}>
                  <i className="bi bi-camera display-4 text-muted"></i>
                </div>
              </div>
            )}
            
            <Form.Group>
              <Form.Label className="btn btn-outline-primary w-100">
                <i className="bi bi-upload me-2"></i>
                Choose Image
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="d-none"
                />
              </Form.Label>
            </Form.Group>
            
            <small className="text-muted">
              Maximum file size: 5MB. Accepted formats: JPG, PNG, GIF
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProfilePictureModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={handleProfilePictureUpload}
            disabled={!selectedImage || uploadProfilePictureMutation.isLoading}
          >
            {uploadProfilePictureMutation.isLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Uploading...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                Upload Picture
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="bi bi-lock me-2"></i>
            Change Password
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePasswordSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="text-dark">Current Password</Form.Label>
              <Form.Control
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => handlePasswordInputChange('current_password', e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-dark">New Password</Form.Label>
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
              <Form.Label className="text-dark">Confirm New Password</Form.Label>
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

export default ParentProfile;