import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for checking permissions
 * @param {string} resource - The resource name (e.g., 'students', 'grades')
 * @returns {Object} Permission check functions
 */
export const usePermissions = (resource) => {
  const { user, hasPermission } = useAuth();

  // Admin and staff always have all permissions
  const isAdmin = user?.user_type === 'admin' || user?.user_type === 'staff';

  return {
    // Check if user can view the resource
    canView: isAdmin || hasPermission(resource) || hasPermission(`${resource}.view`),
    
    // Check if user can create new resources
    canCreate: isAdmin || hasPermission(resource) || hasPermission(`${resource}.create`),
    
    // Check if user can update existing resources
    canUpdate: isAdmin || hasPermission(resource) || hasPermission(`${resource}.update`),
    
    // Check if user can delete resources
    canDelete: isAdmin || hasPermission(resource) || hasPermission(`${resource}.delete`),
    
    // Check if user has full access (all CRUD operations)
    hasFullAccess: isAdmin || hasPermission(resource),
    
    // Check for any permission on the resource
    hasAnyPermission: isAdmin || 
      hasPermission(resource) || 
      hasPermission(`${resource}.view`) ||
      hasPermission(`${resource}.create`) ||
      hasPermission(`${resource}.update`) ||
      hasPermission(`${resource}.delete`),
    
    // Raw permission check
    hasPermission: (permission) => isAdmin || hasPermission(permission),
    
    // Check multiple permissions (AND logic)
    hasAllPermissions: (...permissions) => {
      if (isAdmin) return true;
      return permissions.every(perm => hasPermission(perm));
    },
    
    // Check multiple permissions (OR logic)
    hasAnyOfPermissions: (...permissions) => {
      if (isAdmin) return true;
      return permissions.some(perm => hasPermission(perm));
    }
  };
};

export default usePermissions;