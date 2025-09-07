import { useQuery } from '@tanstack/react-query';
import { useAcademicYear } from '../contexts/AcademicYearContext';

/**
 * Custom hook to automatically include academic year in query keys and parameters
 * This ensures all queries are automatically scoped to the selected academic year
 */
export const useAcademicYearData = (queryKey, queryFn, options = {}) => {
  const { getAcademicYearId, selectedAcademicYear } = useAcademicYear();

  // Create a query key that includes academic year ID
  const enhancedQueryKey = [
    ...queryKey,
    'academic_year',
    getAcademicYearId()
  ];

  // Enhanced query function that automatically adds academic_year_id parameter
  const enhancedQueryFn = async (context) => {
    const academicYearId = getAcademicYearId();
    
    // If the original query function expects academic year ID, pass it
    if (queryFn.length > 0) {
      return queryFn({ ...context, academicYearId });
    } else {
      return queryFn();
    }
  };

  return useQuery({
    queryKey: enhancedQueryKey,
    queryFn: enhancedQueryFn,
    ...options,
    // Don't run the query if academic year is not yet loaded
    enabled: !!selectedAcademicYear && (options.enabled !== false)
  });
};

/**
 * Helper function to add academic year ID to URL parameters
 */
export const addAcademicYearToParams = (params, academicYearId) => {
  if (academicYearId) {
    params.append('academic_year_id', academicYearId.toString());
  }
  return params;
};

/**
 * Helper function to create URLSearchParams with academic year
 */
export const createAcademicYearParams = (baseParams, academicYearId) => {
  const params = new URLSearchParams(baseParams);
  return addAcademicYearToParams(params, academicYearId);
};