import React from 'react';
import { Navbar, Nav, Dropdown, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AnnouncementsNotification from '../common/AnnouncementsNotification';

const ParentNavbar = ({ onToggleSidebar, sidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Navbar bg="white" className="border-bottom px-2 px-md-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center w-100">
        <div className="d-flex align-items-center">
          <Button variant="link" onClick={onToggleSidebar} className="d-lg-none me-2 p-0 text-muted">
            <i className="bi bi-list fs-4"></i>
          </Button>
          <h6 className="mb-0 text-muted d-none d-lg-block">
            Welcome back, {user?.name}
          </h6>
          <span className="d-lg-none text-muted small">
            {user?.name?.split(' ')[0]}
          </span>
        </div>

        <Nav className="d-flex align-items-center">
          {/* Announcements Notification */}
          <div className="me-2 me-md-3">
            <AnnouncementsNotification />
          </div>

          {/* User Dropdown */}
          <Dropdown align="end">
            <Dropdown.Toggle 
              variant="link" 
              className="text-decoration-none border-0 p-0 d-flex align-items-center"
            >
              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" 
                   style={{ width: '35px', height: '35px' }}>
                <i className="bi bi-person text-white"></i>
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu className="shadow">
              <Dropdown.Header>
                <div className="text-muted">Signed in as</div>
                <div className="fw-medium">{user?.name}</div>
              </Dropdown.Header>
              
              <Dropdown.Divider />
              
              <Dropdown.Item onClick={() => navigate('/parent/profile')}>
                <i className="bi bi-person me-2"></i>
                Profile Settings
              </Dropdown.Item>
              
              <Dropdown.Item onClick={() => navigate('/parent/help-support')}>
                <i className="bi bi-question-circle me-2"></i>
                Help & Support
              </Dropdown.Item>
              
              <Dropdown.Divider />
              
              <Dropdown.Item onClick={handleLogout} className="text-danger">
                <i className="bi bi-box-arrow-right me-2"></i>
                Sign Out
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </div>
    </Navbar>
  );
};

export default ParentNavbar;