import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import ParentSidebar from '../../components/parent/ParentSidebar';
import ParentNavbar from '../../components/parent/ParentNavbar';
import ParentOverview from './ParentOverview';
import ParentChildren from './ParentChildren';
import ParentAnnouncements from './ParentAnnouncements';
import ParentFees from './ParentFees';
import ParentComplaints from './ParentComplaints';
import ParentProfile from './ParentProfile';
import ParentHelpSupport from './ParentHelpSupport';

const ParentDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="d-flex">
      <ParentSidebar 
        show={sidebarOpen} 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
        onClose={() => setSidebarOpen(false)} 
      />
      {/* Sidebar overlay for mobile */}
      <div 
        className={`sidebar-overlay d-lg-none ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <div className={`flex-grow-1 main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <ParentNavbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          sidebarCollapsed={sidebarCollapsed} 
        />
        <Container fluid className="px-4 py-3">
          <Routes>
            <Route path="/" element={<ParentOverview />} />
            <Route path="/children" element={<ParentChildren />} />
            <Route path="/announcements" element={<ParentAnnouncements />} />
            <Route path="/fees" element={<ParentFees />} />
            <Route path="/complaints" element={<ParentComplaints />} />
            <Route path="/profile" element={<ParentProfile />} />
            <Route path="/help-support" element={<ParentHelpSupport />} />
          </Routes>
        </Container>
      </div>
    </div>
  );
};

export default ParentDashboard;