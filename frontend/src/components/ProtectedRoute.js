import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Protected route component that checks authentication and authorization
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string[]} [props.allowedRoles] - Array of allowed user roles
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.user_type)) {
    // Redirect to user's appropriate dashboard instead of showing access denied
    if (user.user_type === 'staff') {
      return <Navigate to="/staff" replace />;
    } else if (user.user_type === 'parent') {
      return <Navigate to="/parent" replace />;
    } else {
      // All others go to admin
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;