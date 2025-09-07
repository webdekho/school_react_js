import React, { useState } from 'react';
import { Card, Button, Form, Row, Col, Alert, Badge, Accordion, Modal } from 'react-bootstrap';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

const HelpSupport = () => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: 'general',
    message: '',
    priority: 'medium'
  });

  // Submit support ticket mutation
  const submitTicketMutation = useMutation({
    mutationFn: async (ticketData) => {
      const response = await apiService.post('/api/admin/support-ticket', ticketData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Support ticket submitted successfully!');
      setShowContactModal(false);
      setContactForm({
        subject: '',
        category: 'general',
        message: '',
        priority: 'medium'
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit support ticket');
    }
  });

  const handleContactSubmit = (e) => {
    e.preventDefault();
    submitTicketMutation.mutate(contactForm);
  };

  const handleInputChange = (field, value) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  };

  const faqData = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How do I add a new student?",
          answer: "Navigate to Student Management from the sidebar, click 'Add New Student', fill in the required information including personal details, academic information, and parent details, then click 'Save Student'."
        },
        {
          question: "How do I set up fee structures?",
          answer: "Go to Fee Structures in the sidebar, click 'Add New Structure', select the academic year, grade, and category, set the amount and due date, then save. You can also set up installments if needed."
        },
        {
          question: "How do I generate reports?",
          answer: "Visit the Reports section, select the type of report you need (Fee Collection, Fee Dues, etc.), apply any filters like date range or academic year, then click 'Generate Report' or export to Excel/CSV."
        }
      ]
    },
    {
      category: "Fee Management",
      questions: [
        {
          question: "How do I collect fees from students?",
          answer: "Go to Fee Collection, search for the student by name or roll number, select the fee categories to collect, choose payment method, enter the amount, and generate a receipt."
        },
        {
          question: "How do I handle partial payments?",
          answer: "When collecting fees, you can enter a partial amount instead of the full fee amount. The system will automatically calculate the remaining balance and update the student's fee status."
        },
        {
          question: "How do I set up late fees?",
          answer: "In System Settings > General, you can configure the late fee percentage. This will be automatically applied to overdue payments based on the due date set in fee structures."
        }
      ]
    },
    {
      category: "Reports & Analytics",
      questions: [
        {
          question: "How do I view fee collection reports?",
          answer: "Navigate to Reports, select 'Fee Collection Report', set your date range and filters, then generate the report. You can view it online or export to Excel/CSV format."
        },
        {
          question: "How do I track outstanding fees?",
          answer: "Use the 'Fee Dues Report' in the Reports section. This shows all students with pending fee payments, overdue amounts, and days overdue."
        },
        {
          question: "Can I export data to Excel?",
          answer: "Yes, most reports and data tables have export options. Look for 'Export Excel' or 'Export CSV' buttons in reports and data management sections."
        }
      ]
    },
    {
      category: "User Management",
      questions: [
        {
          question: "How do I add new staff members?",
          answer: "Go to Staff Management, click 'Add New Staff', fill in personal and professional details, assign a role, set permissions, and create login credentials."
        },
        {
          question: "How do I manage user permissions?",
          answer: "In Role Management, you can create custom roles and assign specific permissions. Then assign these roles to staff members to control their access to different features."
        },
        {
          question: "How do I reset a user's password?",
          answer: "In Staff Management, find the user and click 'Edit', then use the 'Reset Password' option to generate a new temporary password that the user can change on first login."
        }
      ]
    },
    {
      category: "Technical Issues",
      questions: [
        {
          question: "The system is running slowly. What should I do?",
          answer: "Try clearing your browser cache, ensure you have a stable internet connection, and contact support if the issue persists. We can help optimize the system performance."
        },
        {
          question: "I'm getting an error when uploading files. What's wrong?",
          answer: "Check that your file is in the correct format (PDF, JPG, PNG for most uploads), under the size limit (usually 5MB), and try again. If the error persists, contact technical support."
        },
        {
          question: "How do I backup my data?",
          answer: "Regular backups are automatically taken. For manual backups, go to System Settings > Backup and click 'Create Backup'. Contact support for data restoration if needed."
        }
      ]
    }
  ];

  const quickLinks = [
    {
      title: "User Manual",
      description: "Complete guide to using the system",
      icon: "bi-book",
      color: "primary"
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video guides",
      icon: "bi-play-circle",
      color: "success"
    },
    {
      title: "API Documentation",
      description: "For developers and integrations",
      icon: "bi-code-slash",
      color: "info"
    },
    {
      title: "Keyboard Shortcuts",
      description: "Speed up your workflow",
      icon: "bi-keyboard",
      color: "warning"
    }
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">
            <i className="bi bi-question-circle me-2"></i>
            Help & Support
          </h4>
          <small className="text-muted">
            Find answers to common questions and get help
          </small>
        </div>
        <Button 
          variant="primary"
          onClick={() => setShowContactModal(true)}
        >
          <i className="bi bi-headset me-2"></i>
          Contact Support
        </Button>
      </div>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="bi bi-chat-dots display-4 text-primary mb-3"></i>
              <h5>Need Help?</h5>
              <p className="text-muted">
                Our support team is here to help you with any questions or issues you may have.
              </p>
              <Button 
                variant="primary"
                onClick={() => setShowContactModal(true)}
              >
                Contact Support
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <i className="bi bi-telephone display-4 text-success mb-3"></i>
              <h5>Emergency Contact</h5>
              <p className="text-muted mb-2">
                For urgent technical issues or system downtime
              </p>
              <div className="mb-2">
                <strong>Phone:</strong> +91 98765 43210
              </div>
              <div>
                <strong>Email:</strong> support@schoolsystem.com
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        {quickLinks.map((link, index) => (
          <Col md={3} key={index} className="mb-3">
            <Card className="border-0 shadow-sm h-100 hover-card">
              <Card.Body className="text-center">
                <i className={`${link.icon} display-6 text-${link.color} mb-3`}></i>
                <h6>{link.title}</h6>
                <p className="text-muted small">{link.description}</p>
                <Button variant={`outline-${link.color}`} size="sm">
                  View <i className="bi bi-arrow-right ms-1"></i>
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-question-circle me-2"></i>
            Frequently Asked Questions
          </h5>
        </Card.Header>
        <Card.Body>
          <Accordion defaultActiveKey="0">
            {faqData.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-4">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-folder2-open me-2"></i>
                  {category.category}
                </h6>
                {category.questions.map((faq, faqIndex) => (
                  <Accordion.Item 
                    eventKey={`${categoryIndex}-${faqIndex}`} 
                    key={faqIndex}
                    className="mb-2"
                  >
                    <Accordion.Header>
                      <i className="bi bi-question-circle-fill me-2 text-info"></i>
                      {faq.question}
                    </Accordion.Header>
                    <Accordion.Body>
                      {faq.answer}
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </div>
            ))}
          </Accordion>
        </Card.Body>
      </Card>

      <Row className="mt-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <i className="bi bi-info-circle display-6 text-info mb-3"></i>
              <h6>System Information</h6>
              <div className="text-start">
                <div className="mb-2">
                  <small className="text-muted">Version:</small>
                  <div>v2.1.0</div>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Last Updated:</small>
                  <div>August 2025</div>
                </div>
                <div className="mb-2">
                  <small className="text-muted">License:</small>
                  <div>Enterprise</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <i className="bi bi-shield-check display-6 text-success mb-3"></i>
              <h6>Security & Privacy</h6>
              <p className="text-muted small">
                Your data is protected with enterprise-grade security measures.
              </p>
              <Button variant="outline-success" size="sm">
                View Security Policy
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <i className="bi bi-star display-6 text-warning mb-3"></i>
              <h6>Feature Requests</h6>
              <p className="text-muted small">
                Have an idea for improving the system? Let us know!
              </p>
              <Button variant="outline-warning" size="sm">
                Submit Idea
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Contact Support Modal */}
      <Modal show={showContactModal} onHide={() => setShowContactModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-headset me-2"></i>
            Contact Support
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleContactSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject</Form.Label>
                  <Form.Control
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    required
                    placeholder="Brief description of your issue"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={contactForm.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                  >
                    <option value="general">General Question</option>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing & Account</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Bug Report</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Priority</Form.Label>
              <Form.Select
                value={contactForm.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
              >
                <option value="low">Low - General inquiry</option>
                <option value="medium">Medium - Standard issue</option>
                <option value="high">High - Urgent issue</option>
                <option value="critical">Critical - System down</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={contactForm.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                required
                placeholder="Please describe your issue or question in detail..."
              />
            </Form.Group>

            <Alert variant="info">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Response Time:</strong> We typically respond within 24 hours for standard issues, 
              and within 2 hours for critical issues during business hours.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowContactModal(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={submitTicketMutation.isLoading}
            >
              {submitTicketMutation.isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <i className="bi bi-send me-2"></i>
                  Submit Ticket
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style jsx>{`
        .hover-card {
          transition: transform 0.2s ease-in-out;
        }
        .hover-card:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default HelpSupport;