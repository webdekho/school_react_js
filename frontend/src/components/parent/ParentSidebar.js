import React from 'react';
import { Nav, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ParentSidebar = ({ show, collapsed, onToggleCollapse, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Define parent menu items
  const menuItems = [
    {
      path: '/parent',
      icon: 'bi-speedometer2',
      label: 'Dashboard'
    },
    {
      path: '/parent/children',
      icon: 'bi-people',
      label: 'My Child'
    },
    {
      path: '/parent/announcements',
      icon: 'bi-megaphone',
      label: 'Announcements'
    },
    {
      path: '/parent/fees',
      icon: 'bi-receipt',
      label: 'Fee Tracking'
    },
    {
      path: '/parent/complaints',
      icon: 'bi-chat-dots',
      label: 'Complaints'
    },
    {
      path: '/parent/profile',
      icon: 'bi-person-circle',
      label: 'My Profile'
    },
    {
      path: '/parent/help-support',
      icon: 'bi-question-circle',
      label: 'Help & Support'
    }
  ];

  const isActive = (path) => {
    if (path === '/parent') {
      return location.pathname === '/parent' || location.pathname === '/parent/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div 
      className={`text-white vh-100 position-fixed sidebar ${show ? 'show' : ''} ${collapsed ? 'collapsed collapsed-sidebar' : ''} d-flex flex-column`}
      style={{ 
        width: collapsed ? '80px' : '250px',
        transition: 'width 0.3s ease',
        zIndex: 1000,
        background: 'linear-gradient(135deg, #667eea 0%, #3b3b6d 100%)'
      }}
    >
      {/* Header */}
      <div 
        className="px-3 d-flex align-items-center flex-shrink-0"
        style={{ 
          height: '64px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <div className="d-flex align-items-center justify-content-between w-100">
          {!collapsed ? (
            <div className="d-flex align-items-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                style={{ height: '50px', width: 'auto' }}
                className="me-3"
              />
              <div>
                <h5 className="mb-0 text-white">Trivandrum</h5>
                <span className="text-white-50" style={{ fontSize: '0.9rem' }}>Scottish School</span>
              </div>
            </div>
          ) : (
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={{ height: '45px', width: 'auto' }}
            />
          )}
          <Button
            variant="link"
            className={`text-white p-0 ${collapsed ? 'w-100 d-flex justify-content-center' : ''}`}
            onClick={onToggleCollapse}
          >
            <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-grow-1 overflow-auto">
        <Nav className="flex-column p-3">
          {menuItems.map((item) => {
            return (
              <Nav.Item key={item.path} className="mb-1">
                <Nav.Link
                  as={Link}
                  to={item.path}
                  className={`text-white d-flex align-items-center p-2 rounded`}
                  style={{ 
                    textDecoration: 'none',
                    backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <i className={`${item.icon} ${collapsed ? 'fs-5' : 'me-3'}`}></i>
                  {!collapsed && <span>{item.label}</span>}
                </Nav.Link>
              </Nav.Item>
            );
          })}
        </Nav>
      </div>

      

    </div>
  );
};

export default ParentSidebar;

