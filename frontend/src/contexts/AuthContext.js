import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext(undefined);

/**
 * Hook to use authentication context
 * @returns {Object} Authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          try {
            // Verify token and get user info
            const userData = await authService.getCurrentUser();
            setUser(userData);
          } catch (error) {
            // Token is invalid, clear it and reset user state
            localStorage.removeItem('auth_token');
            setUser(null);
            console.error('Token validation failed:', error);
          }
        } else {
          // No token, ensure user is null
          setUser(null);
        }
      } catch (error) {
        // Any unexpected errors during initialization
        console.error('Auth initialization error:', error);
        localStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []); // Remove user dependency to prevent infinite loop

  // Separate effect for periodic token validation
  useEffect(() => {
    // Set up periodic token validation (every 5 minutes)
    const tokenCheckInterval = setInterval(() => {
      const token = localStorage.getItem('auth_token');
      if (token && !authService.isAuthenticated()) {
        // Token has expired, user will be cleared by the isAuthenticated method
        console.log('Periodic token check detected expiration');
        setUser(null);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      clearInterval(tokenCheckInterval);
    };
  }, []); // Run only once

  // Separate effect for localStorage changes and token expiration
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'auth_token' && !e.newValue && user) {
        // Token was removed, clear user state
        setUser(null);
        console.log('Token removed, clearing user state');
      }
    };

    const handleTokenExpired = () => {
      // Clear user state when token expires
      setUser(null);
      toast.error('Your session has expired. Please login again.');
      console.log('Token expired, redirecting to login');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('token-expired', handleTokenExpired);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('token-expired', handleTokenExpired);
    };
  }, [user]);

  /**
   * Login user with credentials
   * @param {import('../types').LoginFormData} credentials - Login credentials
   * @returns {Promise<boolean>} Success status
   */
  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authService.login(credentials);
      
      if (response.status === 'success') {
        localStorage.setItem('auth_token', response.data.token);
        
        // Fetch complete user data from /me endpoint
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          // Fallback to user data from login response if /me fails
          console.warn('Failed to fetch user data from /me endpoint:', error);
          const fallbackUser = response.data.user;
          
          // Parse permissions for fallback user data too
          if (fallbackUser.permissions && typeof fallbackUser.permissions === 'string') {
            try {
              fallbackUser.permissions = JSON.parse(fallbackUser.permissions);
            } catch (e) {
              console.warn('Failed to parse fallback user permissions:', e);
              fallbackUser.permissions = [];
            }
          }
          
          setUser(fallbackUser);
        }
        
        toast.success('Login successful!');
        return true;
      } else {
        toast.error(response.message || 'Login failed');
        return false;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout current user
   */
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.clearAuth();
      setUser(null);
      setLoading(false);
      toast.success('Logged out successfully');
    }
  };

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} Has permission
   */
  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes('*') || user.permissions.includes(permission);
  };

  /**
   * Check if user has any of the specified roles
   * @param {string[]} roles - Roles to check
   * @returns {boolean} Has role
   */
  const hasRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.user_type);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};