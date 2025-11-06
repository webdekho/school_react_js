import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import PermissionGuard from '../../components/PermissionGuard';
import DashboardOverview from './DashboardOverview';
import AcademicYearManagement from './AcademicYearManagement';
import GradeManagement from './GradeManagement';
import DivisionManagement from './DivisionManagement';
import StudentManagement from './StudentManagement';
import ParentManagement from './ParentManagement';
import StaffManagement from './StaffManagement';
import FeeCategoriesManagement from './FeeCategoriesManagement';
import FeeStructuresManagement from './FeeStructuresManagement';
import FeeCollectionManagement from './FeeCollectionManagement';
import AnnouncementsManagement from './AnnouncementsManagement';
import AttendanceManagement from './AttendanceManagement';
import StaffAttendanceManagement from './StaffAttendanceManagement';
import ComplaintsManagement from './ComplaintsManagement';
import ReportsManagement from './ReportsManagement';
import RoleManagement from './RoleManagement';
import ProfileManagement from './ProfileManagement';
import VisionStatementsManagement from './VisionStatementsManagement';
import SubjectManagement from './SubjectManagement';
import SyllabusManagement from './SyllabusManagement';
import SystemSettings from './SystemSettings';
import HelpSupport from './HelpSupport';

// Lazy load the StaffWalletManagement component
const StaffWalletManagement = lazy(() => import('./StaffWalletManagement'));

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="d-flex">
      <AdminSidebar 
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
        <AdminNavbar 
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
            <Route path="/vision-statements" element={
              <PermissionGuard permission="vision_statements">
                <VisionStatementsManagement />
              </PermissionGuard>
            } />
            <Route path="/subjects" element={
              <PermissionGuard permission="syllabus">
                <SubjectManagement />
              </PermissionGuard>
            } />
            <Route path="/syllabus" element={
              <PermissionGuard permission="syllabus">
                <SyllabusManagement />
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

export default AdminDashboard;