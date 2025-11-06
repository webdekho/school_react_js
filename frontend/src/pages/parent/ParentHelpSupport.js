import React, { useState } from 'react';
import { Card, Button, Form, Row, Col, Alert, Badge, Accordion, Modal, Spinner } from 'react-bootstrap';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

const ParentHelpSupport = () => {
  const queryClient = useQueryClient();
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
      const response = await apiService.post('/api/parent/support-ticket', ticketData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parent_support_tickets']);
      toast.success('Support ticket submitted successfully! We will get back to you soon.');
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
          question: "How do I access my child's information?",
          answer: "You can view your child's information by clicking on 'My Children' in the sidebar. This shows academic details, attendance, and fee information for all your enrolled children."
        },
        {
          question: "How do I check my child's fee status?",
          answer: "Navigate to 'Fee Information' from the sidebar to view pending fees, payment history, and download receipts. You can also see upcoming due dates and installment details."
        },
        {
          question: "How do I view school announcements?",
          answer: "School announcements are displayed on your dashboard and in the 'Announcements' section. You'll also receive notifications when new announcements are posted."
        }
      ]
    },
    {
      category: "Fee Management",
      questions: [
        {
          question: "How can I pay my child's school fees?",
          answer: "Currently, fees are collected by the school administration. You can view your fee status online and contact the school office for payment options. Online payment features will be available soon."
        },
        {
          question: "How do I download fee receipts?",
          answer: "Go to 'Fee Information' and click on any payment record to download the receipt. You can download receipts for all past payments made."
        },
        {
          question: "What should I do if I notice an error in fee calculation?",
          answer: "If you notice any discrepancies in fee amounts or calculations, please contact the school administration immediately through our support system or visit the school office."
        }
      ]
    },
    {
      category: "Communication",
      questions: [
        {
          question: "How do I submit a complaint or concern?",
          answer: "You can submit complaints through the 'Complaints' section in the sidebar. Provide detailed information about your concern, and the school administration will respond promptly."
        },
        {
          question: "How do I contact my child's teacher?",
          answer: "Use the complaint system to send messages to specific teachers or the administration. Choose the appropriate category when submitting your message."
        },
        {
          question: "How do I get updates about school events?",
          answer: "School events and important updates are posted in the Announcements section. Make sure to check regularly for the latest news and upcoming events."
        }
      ]
    },
    {
      category: "Account & Technical",
      questions: [
        {
          question: "How do I update my contact information?",
          answer: "Go to 'My Profile' from the user menu (top right corner) to update your personal information, contact details, and emergency contacts."
        },
        {
          question: "I forgot my password. How can I reset it?",
          answer: "Use the 'Forgot Password' link on the login page, or contact the school administration to reset your password. For security reasons, password resets must be verified."
        },
        {
          question: "The system is not working properly. What should I do?",
          answer: "Try refreshing the page or clearing your browser cache. If the problem persists, submit a technical support ticket with details about the issue you're experiencing."
        }
      ]
    }
  ];

  const quickLinks = [
    {
      title: "Parent Handbook",
      description: "Complete guide for parents",
      icon: "bi-book",
      color: "primary"
    },
    {
      title: "School Calendar",
      description: "Important dates and events",
      icon: "bi-calendar-event",
      color: "success"
    },
    {
      title: "Fee Schedule",
      description: "Academic year fee structure",
      icon: "bi-receipt",
      color: "info"
    },
    {
      title: "Contact Directory",
      description: "School staff contacts",
      icon: "bi-telephone-fill",
      color: "warning"
    }
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-0 fw-semibold" style={{ fontSize: '1.1rem' }}>
            <i className="bi bi-question-circle me-2" style={{ fontSize: '1rem' }}></i>
            Help & Support
          </h5>
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
                Our school administration team is here to help you with any questions or concerns about your child's education.
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
              <h5>School Contact</h5>
              <p className="text-muted mb-2">
                For urgent matters or direct communication
              </p>
              <div className="mb-2">
                <strong>Phone:</strong> +91 98765 43210
              </div>
              <div className="mb-2">
                <strong>Email:</strong> info@school.edu.in
              </div>
              <div>
                <strong>Office Hours:</strong> 8:00 AM - 4:00 PM
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
              <i className="bi bi-shield-check display-6 text-success mb-3"></i>
              <h6>Privacy & Safety</h6>
              <p className="text-muted small">
                Your child's information is protected with enterprise-grade security measures.
              </p>
              <Button variant="outline-success" size="sm">
                View Privacy Policy
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <i className="bi bi-clock display-6 text-info mb-3"></i>
              <h6>School Hours</h6>
              <div className="text-start">
                <div className="mb-2">
                  <small className="text-muted">Regular Classes:</small>
                  <div>8:00 AM - 3:00 PM</div>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Office Hours:</small>
                  <div>8:00 AM - 4:00 PM</div>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Saturday:</small>
                  <div>9:00 AM - 1:00 PM</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <i className="bi bi-lightbulb display-6 text-warning mb-3"></i>
              <h6>Suggestions</h6>
              <p className="text-muted small">
                Have a suggestion to improve your experience? We'd love to hear from you!
              </p>
              <Button 
                variant="outline-warning" 
                size="sm"
                onClick={() => {
                  setContactForm(prev => ({ ...prev, category: 'suggestion' }));
                  setShowContactModal(true);
                }}
              >
                Share Feedback
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
                    placeholder="Brief description of your inquiry"
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
                    <option value="academic">Academic Inquiry</option>
                    <option value="fees">Fee Related</option>
                    <option value="attendance">Attendance Issue</option>
                    <option value="complaint">Complaint</option>
                    <option value="suggestion">Suggestion</option>
                    <option value="technical">Technical Issue</option>
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
                <option value="high">High - Urgent matter</option>
                <option value="critical">Critical - Emergency</option>
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
                placeholder="Please describe your inquiry or concern in detail..."
              />
            </Form.Group>

            <Alert variant="info">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Response Time:</strong> We typically respond within 24 hours for standard inquiries. 
              Urgent matters are addressed within 2-4 hours during school hours.
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
                  <Spinner size="sm" className="me-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <i className="bi bi-send me-2"></i>
                  Submit Request
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

export default ParentHelpSupport;