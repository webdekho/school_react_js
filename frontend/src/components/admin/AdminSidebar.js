import React, { useState, useEffect } from 'react';
import { Nav, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SidebarGlobalSearch from './SidebarGlobalSearch';

const AdminSidebar = ({ show, collapsed, onToggleCollapse, onClose }) => {
  const location = useLocation();
  const { hasPermission, user } = useAuth();
  const [expandedSections, setExpandedSections] = useState({});

  // Define menu structure with sections and submenus
  const menuStructure = [
    {
      type: 'item',
      path: '/admin',
      label: 'Dashboard',
      icon: 'bi-speedometer2',
      permission: 'dashboard'
    },
    {
      type: 'section',
      label: 'Academics',
      icon: 'bi-book',
      permission: 'academic_years',
      submenu: [
        {
          path: '/admin/academic-years',
          icon: 'bi-calendar-range',
          label: 'Years',
          permission: 'academic_years'
        },
        {
          path: '/admin/grades',
          icon: 'bi-bookmark',
          label: 'Grades',
          permission: 'grades'
        },
        {
          path: '/admin/divisions',
          icon: 'bi-grid',
          label: 'Divisions',
          permission: 'divisions'
        },
        {
          path: '/admin/students',
          icon: 'bi-people',
          label: 'Students',
          permission: 'students'
        },
        {
          path: '/admin/parents',
          icon: 'bi-person-hearts',
          label: 'Parents',
          permission: 'parents'
        },
        {
          path: '/admin/staff',
          icon: 'bi-person-badge',
          label: 'Staff',
          permission: 'staff'
        }
      ]
    },
    {
      type: 'section',
      label: 'Roles',
      icon: 'bi-shield-lock',
      permission: 'roles',
      submenu: [
        {
          path: '/admin/roles',
          icon: 'bi-shield-check',
          label: 'Permissions',
          permission: 'roles'
        },
        {
          path: '/admin/staff-wallets',
          icon: 'bi-wallet2',
          label: 'Wallets',
          permission: 'staff_wallets'
        }
      ]
    },
    {
      type: 'section',
      label: 'Fees',
      icon: 'bi-currency-rupee',
      permission: 'fees',
      submenu: [
        {
          path: '/admin/fee-categories',
          icon: 'bi-tags',
          label: 'Categories',
          permission: 'fees'
        },
        {
          path: '/admin/fee-structures',
          icon: 'bi-diagram-3',
          label: 'Structures',
          permission: 'fees'
        },
        {
          path: '/admin/fees',
          icon: 'bi-receipt',
          label: 'Collection',
          permission: 'fees'
        }
      ]
    },
    {
      type: 'section',
      label: 'Syllabus',
      icon: 'bi-journal-text',
      permission: 'syllabus',
      submenu: [
        {
          path: '/admin/subjects',
          icon: 'bi-book',
          label: 'Subjects',
          permission: 'syllabus'
        },
        {
          path: '/admin/syllabus',
          icon: 'bi-calendar-week',
          label: 'Day-wise Syllabus',
          permission: 'syllabus'
        }
      ]
    },
    {
      type: 'section',
      label: 'Attendance',
      icon: 'bi-calendar-check',
      permission: 'attendance',
      submenu: [
        {
          path: '/admin/attendance',
          icon: 'bi-person-check',
          label: 'Students',
          permission: 'attendance'
        },
        {
          path: '/admin/staff-attendance',
          icon: 'bi-people',
          label: 'Staff',
          permission: 'staff_attendance'
        }
      ]
    },
    {
      type: 'section',
      label: 'Communication',
      icon: 'bi-megaphone',
      permission: 'announcements',
      submenu: [
        {
          path: '/admin/announcements',
          icon: 'bi-bell',
          label: 'Notices',
          permission: 'announcements'
        },
        {
          path: '/admin/complaints',
          icon: 'bi-chat-dots',
          label: 'Complaints',
          permission: 'complaints'
        }
      ]
    },
    {
      type: 'item',
      path: '/admin/vision-statements',
      label: 'Vision Statements',
      icon: 'bi-lightbulb',
      permission: 'vision_statements'
    },
    {
      type: 'item',
      path: '/admin/reports',
      label: 'Reports',
      icon: 'bi-graph-up',
      permission: 'reports'
    },
    {
      type: 'item',
      path: '/admin/system-settings',
      label: 'Settings',
      icon: 'bi-gear',
      permission: 'settings'
    }
  ];

  // Check if user has permission for menu item
  const hasMenuPermission = (permission) => {
    if (!permission) return true;
    return hasPermission(permission) || 
           hasPermission(`${permission}.view`) ||
           hasPermission(`${permission}.create`) ||
           hasPermission(`${permission}.update`) ||
           hasPermission(`${permission}.delete`);
  };

  // Filter menu items based on permissions
  const filteredMenuStructure = menuStructure.map(item => {
    if (item.type === 'item') {
      // Direct menu item
      return hasMenuPermission(item.permission) ? item : null;
    } else {
      // Section with submenu
      const filteredSubmenu = item.submenu.filter(subItem => hasMenuPermission(subItem.permission));
      return filteredSubmenu.length > 0 ? { ...item, submenu: filteredSubmenu } : null;
    }
  }).filter(Boolean);

  // Auto-expand sections that contain active route
  useEffect(() => {
    const newExpanded = { ...expandedSections };
    filteredMenuStructure.forEach((item, index) => {
      if (item.type === 'section' && item.submenu) {
        const hasActiveChild = item.submenu.some(subItem => {
          if (subItem.path === '/admin') {
            return location.pathname === '/admin' || location.pathname === '/admin/';
          }
          return location.pathname.startsWith(subItem.path);
        });
        if (hasActiveChild) {
          newExpanded[index] = true;
        }
      }
    });
    setExpandedSections(newExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
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

      {/* Global Search - Only show when sidebar is expanded */}
      {!collapsed && (
        <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <SidebarGlobalSearch />
        </div>
      )}

      {/* Navigation */}
      <div className="flex-grow-1 overflow-auto">
        <Nav className="flex-column p-3">
          {filteredMenuStructure.map((item, itemIndex) => {
            if (item.type === 'item') {
              // Direct menu item
              return (
                <Nav.Item key={itemIndex} className="mb-2">
                  <Nav.Link
                    as={Link}
                    to={item.path}
                    className="text-white d-flex align-items-center p-2 rounded"
                    style={{ 
                      textDecoration: 'none',
                      backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      transition: 'background-color 0.2s ease'
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    {collapsed ? (
                      <i className={`bi ${item.icon} fs-5`}></i>
                    ) : (
                      <>
                        <i className={`bi ${item.icon} me-3`}></i>
                        <span>{item.label}</span>
                      </>
                    )}
                  </Nav.Link>
                </Nav.Item>
              );
            } else {
              // Section with submenu
              const isExpanded = expandedSections[itemIndex];
              const hasActiveChild = item.submenu && item.submenu.some(subItem => isActive(subItem.path));

              return (
                <div key={itemIndex} className="mb-2">
                  {/* Section Header */}
                  {collapsed ? (
                    <Nav.Item className="mb-1">
                      <Nav.Link
                        className="text-white d-flex align-items-center justify-content-center p-2 rounded"
                        style={{ 
                          textDecoration: 'none',
                          backgroundColor: hasActiveChild ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                          transition: 'background-color 0.2s ease'
                        }}
                        title={item.label}
                      >
                        <i className={`bi ${item.icon} fs-5`}></i>
                      </Nav.Link>
                    </Nav.Item>
                  ) : (
                    <Nav.Item className="mb-1">
                      <Nav.Link
                        className="text-white d-flex align-items-center p-2 rounded"
                        style={{ 
                          textDecoration: 'none',
                          backgroundColor: hasActiveChild ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleSection(itemIndex);
                        }}
                      >
                        <i className={`bi ${item.icon} me-3`}></i>
                        <span className="flex-grow-1">{item.label}</span>
                        <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                      </Nav.Link>
                    </Nav.Item>
                  )}

                  {/* Submenu Items */}
                  {!collapsed && isExpanded && item.submenu.map((subItem) => (
                    <Nav.Item key={subItem.path} className="mb-1 ms-4">
                      <Nav.Link
                        as={Link}
                        to={subItem.path}
                        className={`text-white d-flex align-items-center p-2 rounded`}
                        style={{ 
                          textDecoration: 'none',
                          backgroundColor: isActive(subItem.path) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                          fontSize: '0.9rem',
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <i className={`bi ${subItem.icon} me-2`} style={{ fontSize: '0.85rem' }}></i>
                        <span>{subItem.label}</span>
                      </Nav.Link>
                    </Nav.Item>
                  ))}

                  {/* Show first submenu item when collapsed */}
                  {collapsed && item.submenu.length > 0 && (
                    <Nav.Item className="mb-1">
                      <Nav.Link
                        as={Link}
                        to={item.submenu[0].path}
                        className="text-white d-flex align-items-center justify-content-center p-2 rounded"
                        style={{ 
                          textDecoration: 'none',
                          backgroundColor: isActive(item.submenu[0].path) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                          transition: 'background-color 0.2s ease'
                        }}
                        title={item.submenu[0].label}
                      >
                        <i className={`bi ${item.submenu[0].icon}`} style={{ fontSize: '0.9rem' }}></i>
                      </Nav.Link>
                    </Nav.Item>
                  )}
                </div>
              );
            }
          })}
        </Nav>
      </div>

      {/* Footer with Vision Statement */}
      

    </div>
  );
};

export default AdminSidebar;