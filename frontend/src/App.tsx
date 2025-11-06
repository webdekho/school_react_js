import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AcademicYearProvider } from './contexts/AcademicYearContext';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import './styles/responsive.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 401 errors to prevent infinite loops
        if (error?.response?.status === 401) {
          return false;
        }
        // Retry other errors up to 1 time
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Component to redirect users to their appropriate dashboard
const RoleBasedRedirect = () => {
  const { user, isAuthenticated } = useAuth() as any;
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  // Staff goes to staff dashboard (full admin functionality)
  if (user.user_type === 'staff') {
    return <Navigate to="/staff" replace />;
  }
  
  // Parent goes to parent dashboard
  if (user.user_type === 'parent') {
    return <Navigate to="/parent" replace />;
  }
  
  // Everyone else (admin and any other roles) goes to admin
  return <Navigate to="/admin" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AcademicYearProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin/*" element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/staff/*" element={
                  <ProtectedRoute allowedRoles={['staff']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/parent/*" element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/" element={<RoleBasedRedirect />} />
              </Routes>
              <Toaster position="top-right" />
            </div>
          </Router>
        </AcademicYearProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
