import React, { useState } from 'react';
import { Card, Button, Form, Row, Col, Alert, Badge, Spinner, Tab, Tabs, Table } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

const SystemSettings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');

  // General settings form
  const [generalSettings, setGeneralSettings] = useState({
    school_name: '',
    school_address: '',
    school_phone: '',
    school_email: '',
    school_website: '',
    academic_year_start_month: 'April',
    default_currency: 'INR',
    timezone: 'Asia/Kolkata',
    date_format: 'DD/MM/YYYY',
    fee_reminder_days: 7,
    late_fee_percentage: 5
  });

  // Email settings form
  const [emailSettings, setEmailSettings] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    from_email: '',
    from_name: ''
  });

  // SMS settings form
  const [smsSettings, setSmsSettings] = useState({
    sms_provider: 'twilio',
    api_key: '',
    api_secret: '',
    sender_id: '',
    enabled: false
  });

  // Load system settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/system-settings');
      return response.data;
    },
    onSuccess: (data) => {
      if (data.general) setGeneralSettings({ ...generalSettings, ...data.general });
      if (data.email) setEmailSettings({ ...emailSettings, ...data.email });
      if (data.sms) setSmsSettings({ ...smsSettings, ...data.sms });
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async ({ category, settings }) => {
      const response = await apiService.put(`/api/admin/system-settings/${category}`, settings);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['system_settings']);
      toast.success('Settings updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    }
  });

  // Test email configuration
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiService.post('/api/admin/test-email');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Test email sent successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send test email');
    }
  });

  const handleGeneralSubmit = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate({ category: 'general', settings: generalSettings });
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate({ category: 'email', settings: emailSettings });
  };

  const handleSmsSubmit = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate({ category: 'sms', settings: smsSettings });
  };

  const handleGeneralChange = (field, value) => {
    setGeneralSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailChange = (field, value) => {
    setEmailSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSmsChange = (field, value) => {
    setSmsSettings(prev => ({ ...prev, [field]: value }));
  };

  if (settingsLoading) {
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
            <i className="bi bi-gear me-2"></i>
            System Settings
          </h4>
          <small className="text-muted">
            Configure system-wide settings and preferences
          </small>
        </div>
      </div>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="general" title={<span><i className="bi bi-gear me-2"></i>General</span>}>
          <Card className="border-0 shadow-sm">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-building me-2"></i>
                School Information & General Settings
              </h6>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleGeneralSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>School Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={generalSettings.school_name}
                        onChange={(e) => handleGeneralChange('school_name', e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>School Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={generalSettings.school_email}
                        onChange={(e) => handleGeneralChange('school_email', e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>School Phone</Form.Label>
                      <Form.Control
                        type="tel"
                        value={generalSettings.school_phone}
                        onChange={(e) => handleGeneralChange('school_phone', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>School Website</Form.Label>
                      <Form.Control
                        type="url"
                        value={generalSettings.school_website}
                        onChange={(e) => handleGeneralChange('school_website', e.target.value)}
                        placeholder="https://www.school.com"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>School Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={generalSettings.school_address}
                    onChange={(e) => handleGeneralChange('school_address', e.target.value)}
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Academic Year Start Month</Form.Label>
                      <Form.Select
                        value={generalSettings.academic_year_start_month}
                        onChange={(e) => handleGeneralChange('academic_year_start_month', e.target.value)}
                      >
                        <option value="January">January</option>
                        <option value="April">April</option>
                        <option value="June">June</option>
                        <option value="July">July</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Default Currency</Form.Label>
                      <Form.Select
                        value={generalSettings.default_currency}
                        onChange={(e) => handleGeneralChange('default_currency', e.target.value)}
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Timezone</Form.Label>
                      <Form.Select
                        value={generalSettings.timezone}
                        onChange={(e) => handleGeneralChange('timezone', e.target.value)}
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fee Reminder Days</Form.Label>
                      <Form.Control
                        type="number"
                        value={generalSettings.fee_reminder_days}
                        onChange={(e) => handleGeneralChange('fee_reminder_days', parseInt(e.target.value))}
                        min="1"
                        max="30"
                      />
                      <Form.Text className="text-muted">
                        Days before due date to send reminders
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Late Fee Percentage</Form.Label>
                      <Form.Control
                        type="number"
                        value={generalSettings.late_fee_percentage}
                        onChange={(e) => handleGeneralChange('late_fee_percentage', parseFloat(e.target.value))}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <Form.Text className="text-muted">
                        Percentage of fee amount as late fee
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={updateSettingsMutation.isLoading}
                >
                  {updateSettingsMutation.isLoading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2"></i>
                      Save General Settings
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="email" title={<span><i className="bi bi-envelope me-2"></i>Email</span>}>
          <Card className="border-0 shadow-sm">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="bi bi-envelope-gear me-2"></i>
                  Email Configuration
                </h6>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => testEmailMutation.mutate()}
                  disabled={testEmailMutation.isLoading}
                >
                  {testEmailMutation.isLoading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send me-2"></i>
                      Test Email
                    </>
                  )}
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleEmailSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>SMTP Host</Form.Label>
                      <Form.Control
                        type="text"
                        value={emailSettings.smtp_host}
                        onChange={(e) => handleEmailChange('smtp_host', e.target.value)}
                        placeholder="smtp.gmail.com"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>SMTP Port</Form.Label>
                      <Form.Control
                        type="number"
                        value={emailSettings.smtp_port}
                        onChange={(e) => handleEmailChange('smtp_port', parseInt(e.target.value))}
                        placeholder="587"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>SMTP Username</Form.Label>
                      <Form.Control
                        type="text"
                        value={emailSettings.smtp_username}
                        onChange={(e) => handleEmailChange('smtp_username', e.target.value)}
                        placeholder="your-email@gmail.com"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>SMTP Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={emailSettings.smtp_password}
                        onChange={(e) => handleEmailChange('smtp_password', e.target.value)}
                        placeholder="App Password"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Encryption</Form.Label>
                      <Form.Select
                        value={emailSettings.smtp_encryption}
                        onChange={(e) => handleEmailChange('smtp_encryption', e.target.value)}
                      >
                        <option value="tls">TLS</option>
                        <option value="ssl">SSL</option>
                        <option value="none">None</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>From Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={emailSettings.from_email}
                        onChange={(e) => handleEmailChange('from_email', e.target.value)}
                        placeholder="noreply@school.com"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>From Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={emailSettings.from_name}
                        onChange={(e) => handleEmailChange('from_name', e.target.value)}
                        placeholder="School Management System"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Gmail Users:</strong> Use your email address as username and generate an App Password 
                  instead of your regular password. Enable 2-factor authentication first.
                </Alert>

                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={updateSettingsMutation.isLoading}
                >
                  {updateSettingsMutation.isLoading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2"></i>
                      Save Email Settings
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="backup" title={<span><i className="bi bi-cloud-download me-2"></i>Backup</span>}>
          <Row>
            <Col md={6}>
              <Card className="border-0 shadow-sm">
                <Card.Header>
                  <h6 className="mb-0">
                    <i className="bi bi-download me-2"></i>
                    Database Backup
                  </h6>
                </Card.Header>
                <Card.Body>
                  <p className="text-muted">
                    Create a backup of your database to ensure data safety.
                  </p>
                  <div className="d-grid">
                    <Button variant="primary">
                      <i className="bi bi-cloud-download me-2"></i>
                      Create Backup
                    </Button>
                  </div>
                  <hr />
                  <h6>Recent Backups</h6>
                  <div className="text-muted">
                    <small>No recent backups found</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-0 shadow-sm">
                <Card.Header>
                  <h6 className="mb-0">
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    System Maintenance
                  </h6>
                </Card.Header>
                <Card.Body>
                  <p className="text-muted">
                    Perform system maintenance tasks to optimize performance.
                  </p>
                  <div className="d-grid gap-2">
                    <Button variant="outline-warning">
                      <i className="bi bi-trash me-2"></i>
                      Clear Cache
                    </Button>
                    <Button variant="outline-info">
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Optimize Database
                    </Button>
                    <Button variant="outline-secondary">
                      <i className="bi bi-file-text me-2"></i>
                      View Logs
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </div>
  );
};

export default SystemSettings;