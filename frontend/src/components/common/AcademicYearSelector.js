import React, { useState, useEffect } from 'react';
import { Dropdown, Badge, Spinner } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

const AcademicYearSelector = () => {
  const [selectedYear, setSelectedYear] = useState(null);
  const queryClient = useQueryClient();

  // Fetch available academic years
  const { data: academicYears = [], isLoading, error } = useQuery({
    queryKey: ['academic-years-dropdown'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/api/admin/academic_years_dropdown');
        console.log('Academic years response:', response);
        return response.data || [];
      } catch (error) {
        console.error('Error fetching academic years:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Get current academic year
  const { data: currentYear, error: currentYearError } = useQuery({
    queryKey: ['current-academic-year'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/api/admin/academic_years_current');
        console.log('Current academic year response:', response);
        return response.data;
      } catch (error) {
        console.error('Error fetching current academic year:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000
  });

  // Set default academic year on load
  useEffect(() => {
    if (!selectedYear && currentYear) {
      setSelectedYear(currentYear);
    }
  }, [currentYear, selectedYear]);

  // Set academic year as default mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (yearId) => {
      const response = await apiService.put(`/api/admin/academic_years_set_default/${yearId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['academic-years-dropdown']);
      queryClient.invalidateQueries(['current-academic-year']);
      toast.success('Academic year set as default successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to set academic year as default');
    }
  });

  const handleYearChange = (year) => {
    setSelectedYear(year);
    
    // Store selected academic year in localStorage for persistence
    localStorage.setItem('selectedAcademicYear', JSON.stringify(year));
    
    // Invalidate all queries that depend on academic year
    queryClient.invalidateQueries(['grades']);
    queryClient.invalidateQueries(['divisions']);
    queryClient.invalidateQueries(['students']);
    queryClient.invalidateQueries(['dashboard-stats']);
    queryClient.invalidateQueries(['roles']);
    queryClient.invalidateQueries(['fees']);
    queryClient.invalidateQueries(['announcements']);
    queryClient.invalidateQueries(['complaints']);
    queryClient.invalidateQueries(['reports']);
    
    toast.success(`Switched to academic year: ${year.name}`, {
      duration: 2000
    });
    
    // Refresh the page after a short delay to allow the toast to show
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleSetAsDefault = (year, e) => {
    e.stopPropagation();
    if (year.is_default == 1) {
      toast.info('This academic year is already set as default');
      return;
    }
    setDefaultMutation.mutate(year.id);
  };

  // Load selected academic year from localStorage on mount
  useEffect(() => {
    const savedYear = localStorage.getItem('selectedAcademicYear');
    if (savedYear) {
      try {
        const parsedYear = JSON.parse(savedYear);
        setSelectedYear(parsedYear);
      } catch (error) {
        console.error('Error parsing saved academic year:', error);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="d-flex align-items-center">
        <Spinner size="sm" className="me-2" />
        <small className="text-muted">Loading...</small>
      </div>
    );
  }

  if (!academicYears || academicYears.length === 0) {
    return (
      <div className="text-muted small">
        <i className="bi bi-calendar-x me-2"></i>
        No academic years available
      </div>
    );
  }

  return (
    <Dropdown className="academic-year-selector">
      <Dropdown.Toggle 
        variant="outline-secondary" 
        id="academic-year-dropdown"
        className="d-flex align-items-center border-1 text-dark btn-sm"
        style={{ backgroundColor: 'rgba(248,249,250,0.8)', borderColor: '#dee2e6', padding: '0.25rem 0.5rem' }}
      >
        <i className="bi bi-calendar-range me-2"></i>
        <div className="d-flex flex-column align-items-start">
          <span className="fw-medium" style={{ fontSize: '0.875rem' }}>
            {selectedYear ? selectedYear.name : 'Select Academic Year'}
          </span>
          {selectedYear && (
            <small className="text-muted d-none d-md-block" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
              {new Date(selectedYear.start_date).toLocaleDateString()} - {new Date(selectedYear.end_date).toLocaleDateString()}
            </small>
          )}
        </div>
        {selectedYear?.is_default == 1 && (
          <Badge bg="warning" className="ms-2">
            <i className="bi bi-star-fill"></i>
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="shadow-lg border-0">
        <Dropdown.Header>
          <i className="bi bi-calendar-range me-2"></i>
          Select Academic Year
        </Dropdown.Header>
        <Dropdown.Divider />
        
        {error ? (
          <Dropdown.Item disabled className="text-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Error loading academic years: {error.message}
          </Dropdown.Item>
        ) : academicYears.length === 0 ? (
          <Dropdown.Item disabled className="text-muted">
            <i className="bi bi-info-circle me-2"></i>
            No academic years available
          </Dropdown.Item>
        ) : (
          academicYears.map((year) => (
            <Dropdown.Item
              key={year.id}
              active={selectedYear?.id === year.id}
              onClick={() => handleYearChange(year)}
              className="d-flex align-items-center justify-content-between py-2"
            >
              <div className="d-flex flex-column">
                <div className="d-flex align-items-center">
                  <span className="fw-medium">{year.name}</span>
                  {year.is_default == 1 && (
                    <Badge bg="warning" size="sm" className="ms-2">
                      <i className="bi bi-star-fill me-1"></i>Default
                    </Badge>
                  )}
                </div>
                <small className="text-muted">
                  {new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}
                </small>
              </div>
              
              {year.is_default != 1 && (
                <button
                  className="btn btn-sm btn-outline-warning ms-2"
                  onClick={(e) => handleSetAsDefault(year, e)}
                  title="Set as Default"
                  disabled={setDefaultMutation.isLoading}
                >
                  <i className="bi bi-star"></i>
                </button>
              )}
            </Dropdown.Item>
          ))
        )}
        
        <Dropdown.Divider />
        <Dropdown.Item className="text-muted small" disabled>
          <i className="bi bi-info-circle me-2"></i>
          Current selection affects all data views
        </Dropdown.Item>
      </Dropdown.Menu>

      <style jsx>{`
        .academic-year-selector .dropdown-toggle {
          min-width: 200px;
          transition: all 0.3s ease;
        }
        .academic-year-selector .dropdown-toggle:hover {
          background-color: rgba(248,249,250,1) !important;
          transform: translateY(-1px);
        }
        .academic-year-selector .dropdown-menu {
          border-radius: 12px;
          min-width: 300px;
        }
        .academic-year-selector .dropdown-item:hover {
          background-color: #f8f9fa;
        }
        .academic-year-selector .dropdown-item.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
      `}</style>
    </Dropdown>
  );
};

export default AcademicYearSelector;