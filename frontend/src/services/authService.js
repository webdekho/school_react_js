import { apiService } from './api';

/**
 * Authentication service for handling user login, logout, and token management
 */
class AuthService {
  /**
   * Login user with credentials
   * @param {import('../types').LoginFormData} credentials - Login credentials
   * @returns {Promise<import('../types').AuthResponse>} Authentication response
   */
  async login(credentials) {
    const response = await apiService.post('/api/auth/login', credentials);
    return {
      status: response.status,
      message: response.message || 'Success',
      data: response.data
    };
  }

  /**
   * Logout current user
   * @returns {Promise<void>}
   */
  async logout() {
    await apiService.post('/api/auth/logout');
  }

  /**
   * Refresh authentication token
   * @returns {Promise<import('../types').AuthResponse>} Authentication response
   */
  async refreshToken() {
    const response = await apiService.post('/api/auth/refresh');
    return {
      status: response.status,
      message: response.message || 'Success',
      data: response.data
    };
  }

  /**
   * Get current user information
   * @returns {Promise<import('../types').User>} User information
   */
  async getCurrentUser() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No token found');
    }
    
    try {
      const response = await apiService.get('/api/auth/me');
      const userData = response.data;
      
      // Parse permissions from JSON string to array
      if (userData.permissions && typeof userData.permissions === 'string') {
        try {
          userData.permissions = JSON.parse(userData.permissions);
        } catch (e) {
          console.warn('Failed to parse user permissions:', e);
          userData.permissions = [];
        }
      }
      
      return userData;
    } catch (error) {
      // If /me endpoint fails, clear the token and throw error
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
      }
      throw error;
    }
  }

  /**
   * Get stored authentication token
   * @returns {string|null} Token or null if not found
   */
  getToken() {
    return localStorage.getItem('auth_token');
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // Simple JWT expiration check (you might want to use a proper JWT library)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isValid = payload.exp * 1000 > Date.now();
      
      // If token is expired, clear it and dispatch event
      if (!isValid) {
        localStorage.removeItem('auth_token');
        window.dispatchEvent(new CustomEvent('token-expired'));
      }
      
      return isValid;
    } catch {
      // Invalid token format, clear it
      localStorage.removeItem('auth_token');
      return false;
    }
  }

  /**
   * Clear authentication data (for logout or expired sessions)
   */
  clearAuth() {
    localStorage.removeItem('auth_token');
    window.dispatchEvent(new CustomEvent('token-expired'));
  }
}

export const authService = new AuthService();