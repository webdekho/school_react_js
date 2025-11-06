import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import StaffSidebar from '../../components/staff/StaffSidebar';
import StaffNavbar from '../../components/staff/StaffNavbar';
import PermissionGuard from '../../components/PermissionGuard';
import DashboardOverview from '../admin/DashboardOverview';
import AcademicYearManagement from '../admin/AcademicYearManagement';
import GradeManagement from '../admin/GradeManagement';
import DivisionManagement from '../admin/DivisionManagement';
import StudentManagement from '../admin/StudentManagement';
import ParentManagement from '../admin/ParentManagement';
import StaffManagement from '../admin/StaffManagement';
import FeeCategoriesManagement from '../admin/FeeCategoriesManagement';
import FeeStructuresManagement from '../admin/FeeStructuresManagement';
import FeeCollectionManagement from '../admin/FeeCollectionManagement';
import AnnouncementsManagement from '../admin/AnnouncementsManagement';
import AttendanceManagement from './AttendanceManagement';
import StaffAttendanceManagement from './StaffAttendanceManagement';
import ComplaintsManagement from '../admin/ComplaintsManagement';
import ReportsManagement from '../admin/ReportsManagement';
import RoleManagement from '../admin/RoleManagement';
import ProfileManagement from '../admin/ProfileManagement';
import SystemSettings from '../admin/SystemSettings';
import HelpSupport from '../admin/HelpSupport';

// Lazy load the StaffWalletManagement component
const StaffWalletManagement = lazy(() => import('../admin/StaffWalletManagement'));

const StaffDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="d-flex">
      <StaffSidebar 
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
        <StaffNavbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          sidebarCollapsed={sidebarCollapsed} 
        />
        <Container fluid className="px-4 py-3">
          <Routes>
            <Route path="/" element={
              <PermissionGuard permission="dashboard">
                <DashboardOverview />
              </PermissionGuard>
            } />
            <Route path="/academic-years" element={
              <PermissionGuard permission="academic_years">
                <AcademicYearManagement />
              </PermissionGuard>
            } />
            <Route path="/grades" element={
              <PermissionGuard permission="grades">
                <GradeManagement />
              </PermissionGuard>
            } />
            <Route path="/divisions" element={
              <PermissionGuard permission="divisions">
                <DivisionManagement />
              </PermissionGuard>
            } />
            <Route path="/students" element={
              <PermissionGuard permission="students">
                <StudentManagement />
              </PermissionGuard>
            } />
            <Route path="/parents" element={
              <PermissionGuard permission="parents">
                <ParentManagement />
              </PermissionGuard>
            } />
            <Route path="/staff" element={
              <PermissionGuard permission="staff">
                <StaffManagement />
              </PermissionGuard>
            } />
            <Route path="/roles" element={
              <PermissionGuard permission="roles">
                <RoleManagement />
              </PermissionGuard>
            } />
            <Route path="/fee-categories" element={
              <PermissionGuard permission="fee_categories">
                <FeeCategoriesManagement />
              </PermissionGuard>
            } />
            <Route path="/fee-structures" element={
              <PermissionGuard permission="fee_structures">
                <FeeStructuresManagement />
              </PermissionGuard>
            } />
            <Route path="/fees" element={
              <PermissionGuard permission="fee_collection">
                <FeeCollectionManagement />
              </PermissionGuard>
            } />
            <Route path="/announcements" element={
              <PermissionGuard permission="announcements">
                <AnnouncementsManagement />
              </PermissionGuard>
            } />
            <Route path="/attendance" element={
              <PermissionGuard permission="attendance">
                <AttendanceManagement />
              </PermissionGuard>
            } />
            <Route path="/staff-attendance" element={
              <PermissionGuard permission="staff_attendance">
                <StaffAttendanceManagement />
              </PermissionGuard>
            } />
            <Route path="/complaints" element={
              <PermissionGuard permission="complaints">
                <ComplaintsManagement />
              </PermissionGuard>
            } />
            <Route path="/staff-wallets" element={
              <PermissionGuard permission="staff_wallets">
                <Suspense fallback={<div className="text-center py-5"><Spinner animation="border" /></div>}>
                  <StaffWalletManagement />
                </Suspense>
              </PermissionGuard>
            } />
            <Route path="/reports" element={
              <PermissionGuard permission="reports">
                <ReportsManagement />
              </PermissionGuard>
            } />
            <Route path="/profile" element={<ProfileManagement />} />
            <Route path="/system-settings" element={
              <PermissionGuard permission="system_settings">
                <SystemSettings />
              </PermissionGuard>
            } />
            <Route path="/help-support" element={<HelpSupport />} />
          </Routes>
        </Container>
      </div>
    </div>
  );
};

export default StaffDashboard;