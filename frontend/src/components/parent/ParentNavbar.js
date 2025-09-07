import React from 'react';
import { Navbar, Nav, Dropdown, Container } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import AnnouncementsNotification from '../common/AnnouncementsNotification';

const ParentNavbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Navbar bg="white" expand="lg" className="border-bottom shadow-sm sticky-top">
      <Container fluid className="px-2 px-md-4">
        <Navbar.Brand className="d-flex align-items-center">
          <i className="bi bi-mortarboard-fill text-primary me-2 fs-4"></i>
          <div className="d-flex flex-column">
            <span className="fw-bold">School Portal</span>
            <small className="text-muted d-none d-sm-block">Parent Dashboard</small>
          </div>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="parent-navbar-nav" className="border-0">
          <i className="bi bi-list fs-4"></i>
        </Navbar.Toggle>

        <Navbar.Collapse id="parent-navbar-nav">
          <Nav className="ms-auto align-items-lg-center">
            {/* Mobile-only menu items */}
            <div className="d-lg-none border-top mt-3 pt-3">
              <Nav.Link href="#overview" className="d-flex align-items-center py-2">
                <i className="bi bi-house me-2"></i>
                Overview
              </Nav.Link>
              <Nav.Link href="#students" className="d-flex align-items-center py-2">
                <i className="bi bi-people me-2"></i>
                My Children
              </Nav.Link>
              <Nav.Link href="#fees" className="d-flex align-items-center py-2">
                <i className="bi bi-receipt me-2"></i>
                Fee Details
              </Nav.Link>
              <Nav.Link href="#complaints" className="d-flex align-items-center py-2">
                <i className="bi bi-chat-dots me-2"></i>
                Complaints
              </Nav.Link>
              <Nav.Link href="#announcements" className="d-flex align-items-center py-2">
                <i className="bi bi-megaphone me-2"></i>
                Announcements
              </Nav.Link>
            </div>

            {/* Announcements Notification */}
            <Nav.Item className="me-3">
              <AnnouncementsNotification />
            </Nav.Item>

            {/* User Dropdown */}
            <Dropdown align="end">
              <Dropdown.Toggle 
                variant="link" 
                className="text-decoration-none border-0 p-0 d-flex align-items-center"
              >
                <div className="d-flex align-items-center">
                  <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" 
                       style={{ width: '40px', height: '40px' }}>
                    <i className="bi bi-person text-white"></i>
                  </div>
                  <div className="text-start d-none d-md-block">
                    <div className="fw-medium">{user?.name}</div>
                    <small className="text-muted">Parent</small>
                  </div>
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu className="shadow border-0">
                <Dropdown.Header>
                  <div className="d-md-none">
                    <div className="fw-medium">{user?.name}</div>
                    <small className="text-muted">{user?.mobile}</small>
                  </div>
                </Dropdown.Header>
                
                <Dropdown.Item className="d-flex align-items-center py-2">
                  <i className="bi bi-person me-2"></i>
                  My Profile
                </Dropdown.Item>
                
                <Dropdown.Item className="d-flex align-items-center py-2">
                  <i className="bi bi-gear me-2"></i>
                  Settings
                </Dropdown.Item>
                
                <Dropdown.Item className="d-flex align-items-center py-2">
                  <i className="bi bi-question-circle me-2"></i>
                  Help & Support
                </Dropdown.Item>
                
                <Dropdown.Divider />
                
                <Dropdown.Item 
                  onClick={handleLogout} 
                  className="text-danger d-flex align-items-center py-2"
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Sign Out
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default ParentNavbar;