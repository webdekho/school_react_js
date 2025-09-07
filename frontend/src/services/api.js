import axios from 'axios';
import { ENV_CONFIG } from '../config/environment';

const API_BASE_URL = ENV_CONFIG.API_BASE_URL;

console.log('API Base URL:', API_BASE_URL);
console.log('Environment:', ENV_CONFIG.ENVIRONMENT);

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear the token and trigger redirect to login
          localStorage.removeItem('auth_token');
          
          // Force redirect to login page if not already there
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && !currentPath.startsWith('/login')) {
            // Dispatch a custom event to notify the AuthContext
            window.dispatchEvent(new CustomEvent('token-expired'));
            
            // Use setTimeout to allow React to process the state change first
            setTimeout(() => {
              window.location.href = '/login';
            }, 100);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get(url, params) {
    const response = await this.api.get(url, { params });
    return response.data;
  }

  async post(url, data) {
    const response = await this.api.post(url, data);
    return response.data;
  }

  async put(url, data) {
    const response = await this.api.put(url, data);
    return response.data;
  }

  async delete(url) {
    const response = await this.api.delete(url);
    return response.data;
  }

  async patch(url, data) {
    const response = await this.api.patch(url, data);
    return response.data;
  }

  async uploadAnnouncementAttachment(formData) {
    const response = await this.api.post('api/admin/upload_announcement_attachment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteAnnouncementAttachment(filepath) {
    const response = await this.api.delete('api/admin/delete_announcement_attachment', {
      data: { filepath }
    });
    return response.data;
  }
}

export const apiService = new ApiService();