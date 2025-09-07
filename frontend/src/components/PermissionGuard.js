import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Container } from 'react-bootstrap';

/**
 * Component to guard routes based on permissions
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string|string[]} props.permission - Required permission(s) to access this route
 * @param {boolean} props.requireAll - If true, requires all permissions; if false, requires any permission
 * @param {React.ReactNode} props.fallback - Optional fallback component to show when unauthorized
 */
const PermissionGuard = ({ 
  children, 
  permission, 
  requireAll = false, 
  fallback = null 
}) => {
  const { user, hasPermission } = useAuth();

  // Handle single permission or array of permissions
  const permissions = Array.isArray(permission) ? permission : [permission];

  // Check if user has required permissions
  const hasAccess = () => {
    // Admin always has access
    if (user?.user_type === 'admin') {
      return true;
    }

    // For staff, check permissions
    if (user?.user_type === 'staff') {
      if (requireAll) {
        // User must have all specified permissions
        return permissions.every(perm => 
          hasPermission(perm) || 
          hasPermission(`${perm}.view`) ||
          hasPermission(`${perm}.create`) ||
          hasPermission(`${perm}.update`) ||
          hasPermission(`${perm}.delete`)
        );
      } else {
        // User must have at least one of the specified permissions
        return permissions.some(perm => 
          hasPermission(perm) || 
          hasPermission(`${perm}.view`) ||
          hasPermission(`${perm}.create`) ||
          hasPermission(`${perm}.update`) ||
          hasPermission(`${perm}.delete`)
        );
      }
    }

    return false;
  };

  // If user doesn't have access
  if (!hasAccess()) {
    // If fallback component is provided, render it
    if (fallback) {
      return fallback;
    }

    // Default unauthorized message
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <Alert.Heading>
            <i className="bi bi-shield-x me-2"></i>
            Access Denied
          </Alert.Heading>
          <p>You don't have permission to access this page.</p>
          <hr />
          <p className="mb-0">
            Please contact your administrator if you believe you should have access.
          </p>
        </Alert>
      </Container>
    );
  }

  // User has access, render children
  return children;
};

export default PermissionGuard;