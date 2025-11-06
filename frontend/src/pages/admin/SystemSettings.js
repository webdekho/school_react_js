import React, { useState, useEffect } from 'react';
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
    provider: 'twilio',
    api_key: '',
    api_secret: '',
    sender_id: '',
    api_url: '',
    enabled: false
  });

  // WhatsApp settings form
  const [whatsappSettings, setWhatsappSettings] = useState({
    type: 'text',
    baseUrl: 'https://wa.clareinfotech.com/api/send',
    instance_id: '687646EA9210B',
    access_token: '648db645b4f8c',
    enabled: false
  });

  // Backup info state
  const [backupInfo, setBackupInfo] = useState({
    database_size: 'Calculating...',
    total_tables: '0',
    last_backup: null
  });

  // Load backup info
  useEffect(() => {
    const loadBackupInfo = async () => {
      try {
        const response = await apiService.get('/api/admin/backup_info');
        if (response.data) {
          setBackupInfo(response.data);
        }
      } catch (error) {
        console.error('Failed to load backup info:', error);
      }
    };
    loadBackupInfo();
  }, []);

  // Load system settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/system_settings');
      return response.data;
    }
  });

  // Process settings data when it changes
  useEffect(() => {
    if (settingsData) {
      if (settingsData.general) {
        setGeneralSettings(prev => ({ ...prev, ...settingsData.general }));
      }
      if (settingsData.email) {
        setEmailSettings(prev => ({ ...prev, ...settingsData.email }));
      }
      if (settingsData.sms) {
        setSmsSettings(prev => ({ ...prev, ...settingsData.sms }));
      }
      if (settingsData.whatsapp) {
        // Convert string values to proper types for form handling
        const enabledValue = settingsData.whatsapp.enabled === '1' || settingsData.whatsapp.enabled === 'true' || settingsData.whatsapp.enabled === true;
        
        setWhatsappSettings(prev => ({
          type: settingsData.whatsapp.type || prev.type,
          baseUrl: settingsData.whatsapp.baseUrl || prev.baseUrl,
          instance_id: settingsData.whatsapp.instance_id || prev.instance_id,
          access_token: settingsData.whatsapp.access_token || prev.access_token,
          enabled: enabledValue
        }));
      }
    }
  }, [settingsData]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async ({ category, settings }) => {
      const response = await apiService.put(`/api/admin/system_settings/${category}`, settings);
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

  // Test SMS configuration
  const testSmsMutation = useMutation({
    mutationFn: async (testNumber) => {
      const response = await apiService.post('/api/admin/test-sms', { 
        number: testNumber,
        message: 'This is a test SMS from your school management system. SMS configuration is working correctly!'
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Test SMS sent successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send test SMS');
    }
  });

  // Test WhatsApp configuration
  const testWhatsappMutation = useMutation({
    mutationFn: async (testNumber) => {
      const response = await apiService.post('/api/admin/test-whatsapp', { 
        number: testNumber,
        message: 'This is a test message from your school management system. WhatsApp configuration is working correctly!'
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Test WhatsApp message sent successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send test WhatsApp message');
    }
  });

  // Backup mutation
  const backupMutation = useMutation({
    mutationFn: async (backupType) => {
      const url = `${apiService.api.defaults.baseURL}api/admin/database_backup${backupType ? `?table=${backupType}` : ''}`;
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to download backup');
      }
      
      return { blob: await response.blob(), type: backupType };
    },
    onSuccess: ({ blob, type }) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `backup_${type || 'full'}_${timestamp}.back`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create backup');
    }
  });

  const handleDatabaseBackup = () => {
    if (window.confirm('This will download a complete database backup. Continue?')) {
      backupMutation.mutate(null);
    }
  };

  const handleTableBackup = (tableName) => {
    if (window.confirm(`Download backup of ${tableName} table only?`)) {
      backupMutation.mutate(tableName);
    }
  };

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

  const handleWhatsappSubmit = (e) => {
    e.preventDefault();
    // Convert boolean back to string for backend compatibility
    const settingsForBackend = {
      ...whatsappSettings,
      enabled: whatsappSettings.enabled ? 'true' : 'false'
    };
    updateSettingsMutation.mutate({ category: 'whatsapp', settings: settingsForBackend });
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

  const handleWhatsappChange = (field, value) => {
    setWhatsappSettings(prev => ({ ...prev, [field]: value }));
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
          <h5 className="mb-0 fw-semibold" style={{ fontSize: '1.1rem' }}>
            <i className="bi bi-gear me-2" style={{ fontSize: '1rem' }}></i>
            System Settings
          </h5>
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
                      <Form.Label>Date Format</Form.Label>
                      <Form.Select
                        value={generalSettings.date_format}
                        onChange={(e) => handleGeneralChange('date_format', e.target.value)}
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (12/31/2024)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (31/12/2024)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                        <option value="DD-MM-YYYY">DD-MM-YYYY (31-12-2024)</option>
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
                </Row>

                <Row>
                  <Col md={6}>
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

        <Tab eventKey="sms" title={<span><i className="bi bi-chat-dots me-2"></i>SMS</span>}>
          <Card className="border-0 shadow-sm">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="bi bi-chat-dots me-2"></i>
                  SMS Configuration
                </h6>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => {
                    const testNumber = prompt('Enter phone number with country code (e.g., +919226926292):');
                    if (testNumber) {
                      testSmsMutation.mutate(testNumber);
                    }
                  }}
                  disabled={testSmsMutation.isLoading || !smsSettings.enabled}
                >
                  {testSmsMutation.isLoading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-chat-dots me-2"></i>
                      Test SMS
                    </>
                  )}
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSmsSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>SMS Provider</Form.Label>
                      <Form.Select
                        value={smsSettings.provider}
                        onChange={(e) => handleSmsChange('provider', e.target.value)}
                      >
                        <option value="twilio">Twilio</option>
                        <option value="textlocal">TextLocal</option>
                        <option value="msg91">MSG91</option>
                        <option value="custom">Custom API</option>
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Choose your SMS service provider
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="sms_enabled"
                        label="Enable SMS Notifications"
                        checked={smsSettings.enabled}
                        onChange={(e) => handleSmsChange('enabled', e.target.checked)}
                      />
                      <Form.Text className="text-muted">
                        Enable SMS notifications for parents and staff
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        API Key / Account SID
                        {smsSettings.provider === 'twilio' && <small className="text-muted"> (Account SID)</small>}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={smsSettings.api_key}
                        onChange={(e) => handleSmsChange('api_key', e.target.value)}
                        placeholder={
                          smsSettings.provider === 'twilio' ? 'Account SID' :
                          smsSettings.provider === 'textlocal' ? 'API Key' :
                          smsSettings.provider === 'msg91' ? 'Auth Key' :
                          'API Key'
                        }
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        API Secret / Auth Token
                        {smsSettings.provider === 'twilio' && <small className="text-muted"> (Auth Token)</small>}
                      </Form.Label>
                      <Form.Control
                        type="password"
                        value={smsSettings.api_secret}
                        onChange={(e) => handleSmsChange('api_secret', e.target.value)}
                        placeholder={
                          smsSettings.provider === 'twilio' ? 'Auth Token' :
                          smsSettings.provider === 'textlocal' ? 'Not required' :
                          smsSettings.provider === 'msg91' ? 'Not required' :
                          'API Secret'
                        }
                        required={smsSettings.provider === 'twilio' || smsSettings.provider === 'custom'}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Sender ID / Phone Number
                        {smsSettings.provider === 'twilio' && <small className="text-muted"> (Phone Number)</small>}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={smsSettings.sender_id}
                        onChange={(e) => handleSmsChange('sender_id', e.target.value)}
                        placeholder={
                          smsSettings.provider === 'twilio' ? '+1234567890' :
                          smsSettings.provider === 'textlocal' ? 'SCHOOL' :
                          smsSettings.provider === 'msg91' ? 'SCHOOL' :
                          'Sender ID'
                        }
                        maxLength={smsSettings.provider === 'twilio' ? 15 : 11}
                        required
                      />
                      <Form.Text className="text-muted">
                        {smsSettings.provider === 'twilio' && 'Your Twilio phone number (e.g., +1234567890)'}
                        {smsSettings.provider === 'textlocal' && 'Max 11 characters, alphanumeric'}
                        {smsSettings.provider === 'msg91' && 'Max 6 characters for promotional, 11 for transactional'}
                        {smsSettings.provider === 'custom' && 'Sender identifier'}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  {smsSettings.provider === 'custom' && (
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Custom API URL</Form.Label>
                        <Form.Control
                          type="url"
                          value={smsSettings.api_url}
                          onChange={(e) => handleSmsChange('api_url', e.target.value)}
                          placeholder="https://api.example.com/send?number={number}&message={message}&key={api_key}"
                          required={smsSettings.provider === 'custom'}
                        />
                        <Form.Text className="text-muted">
                          Use placeholders: {'{number}'}, {'{message}'}, {'{api_key}'}
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  )}
                </Row>

                <div className="mb-3">
                  <h6 className="text-primary">
                    <i className="bi bi-gear me-2"></i>
                    Configuration Summary
                  </h6>
                  <Table size="sm" className="table-borderless">
                    <tbody>
                      <tr>
                        <td><strong>Status:</strong></td>
                        <td>
                          <Badge bg={smsSettings.enabled ? 'success' : 'secondary'}>
                            {smsSettings.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Provider:</strong></td>
                        <td><Badge bg="info">{smsSettings.provider}</Badge></td>
                      </tr>
                      <tr>
                        <td><strong>Sender ID:</strong></td>
                        <td><code className="small">{smsSettings.sender_id || 'Not set'}</code></td>
                      </tr>
                    </tbody>
                  </Table>
                </div>

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
                      Save SMS Settings
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="whatsapp" title={<span><i className="bi bi-whatsapp me-2"></i>WhatsApp</span>}>
          <Card className="border-0 shadow-sm">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="bi bi-whatsapp me-2"></i>
                  WhatsApp Configuration
                </h6>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => {
                      const testNumber = prompt('Enter phone number with country code (e.g., 919226926292):');
                      if (testNumber) {
                        testWhatsappMutation.mutate(testNumber);
                      }
                    }}
                    disabled={testWhatsappMutation.isLoading || !whatsappSettings.enabled}
                  >
                    {testWhatsappMutation.isLoading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-whatsapp me-2"></i>
                        Test WhatsApp
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleWhatsappSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Message Type</Form.Label>
                      <Form.Select
                        value={whatsappSettings.type}
                        onChange={(e) => handleWhatsappChange('type', e.target.value)}
                      >
                        <option value="text">Text Message</option>
                        <option value="media">Media Message</option>
                        <option value="document">Document Message</option>
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Type of WhatsApp messages to send
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="whatsapp_enabled"
                        label="Enable WhatsApp Notifications"
                        checked={Boolean(whatsappSettings.enabled)}
                        onChange={(e) => handleWhatsappChange('enabled', e.target.checked)}
                      />
                      <Form.Text className="text-muted">
                        Enable WhatsApp notifications for parents and staff
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Base URL</Form.Label>
                  <Form.Control
                    type="url"
                    value={whatsappSettings.baseUrl}
                    onChange={(e) => handleWhatsappChange('baseUrl', e.target.value)}
                    placeholder="https://wa.clareinfotech.com/api/send"
                    required
                  />
                  <Form.Text className="text-muted">
                    WhatsApp API base URL endpoint
                  </Form.Text>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Instance ID</Form.Label>
                      <Form.Control
                        type="text"
                        value={whatsappSettings.instance_id}
                        onChange={(e) => handleWhatsappChange('instance_id', e.target.value)}
                        placeholder="687646EA9210B"
                        required
                      />
                      <Form.Text className="text-muted">
                        Your WhatsApp instance identifier
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Access Token</Form.Label>
                      <Form.Control
                        type="password"
                        value={whatsappSettings.access_token}
                        onChange={(e) => handleWhatsappChange('access_token', e.target.value)}
                        placeholder="648db645b4f8c"
                        required
                      />
                      <Form.Text className="text-muted">
                        Your WhatsApp API access token
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
                      Save WhatsApp Settings
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="backup" title={<span><i className="bi bi-cloud-download me-2"></i>Backup</span>}>
          <Row>
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header>
                  <h6 className="mb-0">
                    <i className="bi bi-download me-2"></i>
                    Database Backup & Export
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Alert variant="info">
                    <i className="bi bi-info-circle me-2"></i>
                    Create and download database backups to ensure your data is safe. Regular backups are recommended.
                  </Alert>

                  <Row className="mb-4">
                    <Col md={12}>
                      <div className="p-4 border rounded bg-light">
                        <h6 className="mb-3">
                          <i className="bi bi-database me-2"></i>
                          Full Database Backup
                        </h6>
                        <p className="text-muted small mb-3">
                          Download a complete SQL backup of your entire database including all tables, data, and structure.
                        </p>
                        <div className="d-flex gap-2">
                          <Button 
                            variant="primary"
                            onClick={() => handleDatabaseBackup()}
                            disabled={backupMutation.isLoading}
                          >
                            {backupMutation.isLoading ? (
                              <>
                                <Spinner size="sm" className="me-2" />
                                Creating Backup...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-cloud-download me-2"></i>
                                Download Full Backup
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline-secondary"
                            onClick={() => handleTableBackup('students')}
                          >
                            <i className="bi bi-people me-2"></i>
                            Students Only
                          </Button>
                          <Button 
                            variant="outline-secondary"
                            onClick={() => handleTableBackup('staff')}
                          >
                            <i className="bi bi-person-badge me-2"></i>
                            Staff Only
                          </Button>
                          <Button 
                            variant="outline-secondary"
                            onClick={() => handleTableBackup('fee_collections')}
                          >
                            <i className="bi bi-currency-rupee me-2"></i>
                            Fee Collections
                          </Button>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <h6 className="mb-3">
                        <i className="bi bi-info-circle me-2"></i>
                        Backup Information
                      </h6>
                      <Table size="sm" bordered hover>
                        <tbody>
                          <tr>
                            <td className="fw-medium" style={{ width: '40%' }}>Last Backup:</td>
                            <td>
                              <Badge bg="secondary">Never</Badge>
                              <small className="text-muted ms-2">No backup history available</small>
                            </td>
                          </tr>
                          <tr>
                            <td className="fw-medium">Database Size:</td>
                            <td>
                              <code>{backupInfo?.database_size || 'Calculating...'}</code>
                            </td>
                          </tr>
                          <tr>
                            <td className="fw-medium">Total Tables:</td>
                            <td>
                              <Badge bg="info">{backupInfo?.total_tables || '0'}</Badge>
                            </td>
                          </tr>
                          <tr>
                            <td className="fw-medium">Backup Format:</td>
                            <td><code>SQL (.back)</code></td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>

                  <Alert variant="warning" className="mt-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>Important:</strong> Store backups in a secure location. Download and save backups regularly to prevent data loss.
                  </Alert>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>

      <style jsx>{`
        .form-label {
          font-weight: 600;
          color: #212529 !important;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          display: block;
          line-height: 1.2;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group .form-label {
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #212529 !important;
        }
        
        .form-control, .form-select {
          border: 1px solid #ced4da;
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.9rem;
        }
        
        .form-control:focus, .form-select:focus {
          border-color: #86b7fe;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }
        
        .form-text {
          font-size: 0.8rem;
          color: #6c757d;
          margin-top: 0.25rem;
        }
        
        .card-header h6 {
          color: #495057;
          font-weight: 600;
        }
        
        .btn-primary {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }
        
        .btn-primary:hover {
          background-color: #0b5ed7;
          border-color: #0a58ca;
        }
        
        /* Ensure labels are always visible */
        .form-label {
          opacity: 1 !important;
          visibility: visible !important;
          display: block !important;
        }
        
        /* Add some spacing and visual hierarchy */
        .card-body .form-group:first-child {
          margin-top: 0;
        }
        
        .form-label::after {
          content: '';
          display: none;
        }
        
        /* Make sure labels are not hidden by any global styles */
        label.form-label {
          color: #212529 !important;
          font-weight: 600 !important;
          margin-bottom: 0.5rem !important;
        }
      `}</style>
    </div>
  );
};

export default SystemSettings;