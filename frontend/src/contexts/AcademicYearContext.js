import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

const AcademicYearContext = createContext();

export const useAcademicYear = () => {
  const context = useContext(AcademicYearContext);
  if (!context) {
    throw new Error('useAcademicYear must be used within an AcademicYearProvider');
  }
  return context;
};

export const AcademicYearProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Determine the correct endpoint based on user type
  const getAcademicYearEndpoint = () => {
    if (!user) return '/api/admin/academic_years_current';
    
    switch(user.user_type) {
      case 'parent':
        return '/api/parent/academic_year';
      case 'staff':
        return '/api/staff/academic_year';
      default:
        return '/api/admin/academic_years_current';
    }
  };

  // Fetch current academic year - only if authenticated
  const { data: currentYear } = useQuery({
    queryKey: ['current-academic-year', user?.user_type],
    queryFn: async () => {
      try {
        const endpoint = getAcademicYearEndpoint();
        const response = await apiService.get(endpoint);
        return response.data;
      } catch (error) {
        console.error('Failed to fetch current academic year:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    enabled: isAuthenticated && !authLoading // Only fetch if authenticated
  });

  // Clear academic year data when user logs out
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      setSelectedAcademicYear(null);
      setIsLoading(true);
      localStorage.removeItem('selectedAcademicYear');
    }
  }, [isAuthenticated, authLoading]);

  // Initialize selected academic year
  useEffect(() => {
    // Only initialize if authenticated
    if (!isAuthenticated || authLoading) {
      return;
    }

    // Try to load from localStorage first
    const savedYear = localStorage.getItem('selectedAcademicYear');
    if (savedYear) {
      try {
        const parsedYear = JSON.parse(savedYear);
        setSelectedAcademicYear(parsedYear);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing saved academic year:', error);
        localStorage.removeItem('selectedAcademicYear');
      }
    }

    // Fallback to current academic year
    if (currentYear) {
      setSelectedAcademicYear(currentYear);
      localStorage.setItem('selectedAcademicYear', JSON.stringify(currentYear));
      setIsLoading(false);
    }
  }, [currentYear, isAuthenticated, authLoading]);

  const setAcademicYear = (year) => {
    const previousYearId = selectedAcademicYear?.id;
    const newYearId = year?.id;
    
    setSelectedAcademicYear(year);
    if (year) {
      localStorage.setItem('selectedAcademicYear', JSON.stringify(year));
    } else {
      localStorage.removeItem('selectedAcademicYear');
    }
    
    // Invalidate all queries that depend on academic year when it changes
    if (previousYearId !== newYearId) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          // Invalidate queries that include academic year dependency
          return Array.isArray(queryKey) && (
            queryKey.includes('students') ||
            queryKey.includes('grades') ||
            queryKey.includes('divisions') ||
            queryKey.includes('fees') ||
            queryKey.includes('fee-collections') ||
            queryKey.includes('announcements') ||
            queryKey.includes('complaints') ||
            queryKey.includes('reports') ||
            queryKey.includes('dashboard') ||
            queryKey.some(key => typeof key === 'string' && key.includes('academic'))
          );
        }
      });
    }
  };

  // Helper function to get academic year ID for API calls
  const getAcademicYearId = () => {
    return selectedAcademicYear?.id || 1; // Default to 1 if no year selected
  };

  // Helper function to check if a specific academic year is selected
  const isAcademicYearSelected = (yearId) => {
    return selectedAcademicYear?.id === yearId;
  };

  // Helper function to get formatted academic year display
  const getFormattedAcademicYear = () => {
    if (!selectedAcademicYear) return 'No Academic Year Selected';
    
    const startDate = new Date(selectedAcademicYear.start_date).toLocaleDateString();
    const endDate = new Date(selectedAcademicYear.end_date).toLocaleDateString();
    
    return `${selectedAcademicYear.name} (${startDate} - ${endDate})`;
  };

  // Helper function to check if current date is within selected academic year
  const isCurrentDateInSelectedYear = () => {
    if (!selectedAcademicYear) return false;
    
    const today = new Date();
    const startDate = new Date(selectedAcademicYear.start_date);
    const endDate = new Date(selectedAcademicYear.end_date);
    
    return today >= startDate && today <= endDate;
  };

  const value = {
    selectedAcademicYear,
    setAcademicYear,
    getAcademicYearId,
    isAcademicYearSelected,
    getFormattedAcademicYear,
    isCurrentDateInSelectedYear,
    isLoading
  };

  return (
    <AcademicYearContext.Provider value={value}>
      {children}
    </AcademicYearContext.Provider>
  );
};

export default AcademicYearContext;