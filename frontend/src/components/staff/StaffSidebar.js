import React from 'react';
import { Nav, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SidebarGlobalSearch from '../admin/SidebarGlobalSearch';

const StaffSidebar = ({ show, collapsed, onToggleCollapse, onClose }) => {
  const location = useLocation();
  const { hasPermission } = useAuth();

  // Mirror ALL admin sidebar items, mapped to /staff paths
  const allMenuItems = [
    {
      path: '/staff',
      icon: 'bi-speedometer2',
      label: 'Dashboard',
      permission: 'dashboard'
    },
    {
      path: '/staff/academic-years',
      icon: 'bi-calendar-range',
      label: 'Academic Years',
      permission: 'academic_years'
    },
    {
      path: '/staff/grades',
      icon: 'bi-bookmark',
      label: 'Grades',
      permission: 'grades'
    },
    {
      path: '/staff/divisions',
      icon: 'bi-grid',
      label: 'Divisions',
      permission: 'divisions'
    },
    {
      path: '/staff/students',
      icon: 'bi-people',
      label: 'Students',
      permission: 'students'
    },
    {
      path: '/staff/parents',
      icon: 'bi-person-hearts',
      label: 'Parents',
      permission: 'parents'
    },
    {
      path: '/staff/staff',
      icon: 'bi-person-badge',
      label: 'Staff',
      permission: 'staff'
    },
    {
      path: '/staff/roles',
      icon: 'bi-shield-lock',
      label: 'Roles & Permissions',
      permission: 'roles'
    },
    {
      path: '/staff/fee-categories',
      icon: 'bi-tags',
      label: 'Fee Categories',
      permission: 'fee_categories'
    },
    {
      path: '/staff/fee-structures',
      icon: 'bi-currency-rupee',
      label: 'Fee Structures',
      permission: 'fee_structures'
    },
    {
      path: '/staff/fees',
      icon: 'bi-receipt',
      label: 'Fee Collection',
      permission: 'fee_collection'
    },
    {
      path: '/staff/announcements',
      icon: 'bi-megaphone',
      label: 'Announcements',
      permission: 'announcements'
    },
    {
      path: '/staff/attendance',
      icon: 'bi-calendar-check',
      label: 'Student Attendance',
      permission: 'attendance'
    },
    {
      path: '/staff/staff-attendance',
      icon: 'bi-person-check',
      label: 'Staff Attendance',
      permission: 'staff_attendance'
    },
    {
      path: '/staff/complaints',
      icon: 'bi-chat-dots',
      label: 'Complaints',
      permission: 'complaints'
    },
    {
      path: '/staff/staff-wallets',
      icon: 'bi-wallet2',
      label: 'Staff Wallets',
      permission: 'staff_wallets'
    },
    {
      path: '/staff/reports',
      icon: 'bi-graph-up',
      label: 'Reports',
      permission: 'reports'
    },
    {
      path: '/staff/system-settings',
      icon: 'bi-gear',
      label: 'System Settings',
      permission: 'settings'
    }
  ];

  const menuItems = allMenuItems.filter(item => {
    return hasPermission(item.permission) || 
           hasPermission(`${item.permission}.view`) ||
           hasPermission(`${item.permission}.create`) ||
           hasPermission(`${item.permission}.update`) ||
           hasPermission(`${item.permission}.delete`);
  });

  const isActive = (path) => {
    if (path === '/staff') {
      return location.pathname === '/staff' || location.pathname === '/staff/';
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
      <div 
        className="px-3 d-flex align-items-center flex-shrink-0"
        style={{ height: '64px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}
      >
        <div className="d-flex align-items-center justify-content-between w-100">
          {!collapsed ? (
            <div className="d-flex align-items-center">
              <img src="/logo.png" alt="Logo" style={{ height: '50px', width: 'auto' }} className="me-3" />
              <div>
                <h5 className="mb-0 text-white">Trivandrum</h5>
                <span className="text-white-50" style={{ fontSize: '0.9rem' }}>Scottish School</span>
              </div>
            </div>
          ) : (
            <img src="/logo.png" alt="Logo" style={{ height: '45px', width: 'auto' }} />
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

      {/* Global Search - Only show when sidebar is expanded */}
      {!collapsed && (
        <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <SidebarGlobalSearch />
        </div>
      )}

      {/* Navigation */}
      <div className="flex-grow-1 overflow-auto">
        <Nav className="flex-column p-3">
          {menuItems.map((item) => (
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
          ))}
        </Nav>
      </div>

    

    </div>
  );
};

export default StaffSidebar;
