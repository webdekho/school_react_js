import React, { useState, useRef, useEffect } from 'react';
import { InputGroup, Form, Dropdown, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(['students', 'parents', 'staff']);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const debouncedQuery = useDebounce(query, 500);

  // Global search query
  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['global_search', debouncedQuery, selectedTypes],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return null;
      }
      
      const queryParams = new URLSearchParams({
        q: debouncedQuery,
        types: selectedTypes.join(','),
        limit: 20
      });
      const response = await apiService.get(`/api/admin/global_search?${queryParams}`);
      return response.data?.results || response.data;
    },
    enabled: debouncedQuery.length >= 2
  });

  // Handle click/touch outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    const handleTouchOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleTouchOutside, { passive: true });
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowDropdown(value.length >= 2);
  };

  const handleInputFocus = () => {
    if (query.length >= 2) {
      setShowDropdown(true);
    }
  };

  const handleInputClick = () => {
    if (query.length >= 2) {
      setShowDropdown(true);
    }
  };

  const handleTypeToggle = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getTypeColor = (type) => {
    const colors = {
      student: 'primary',
      parent: 'success',
      staff: 'warning',
      complaint: 'danger',
      announcement: 'info'
    };
    return colors[type] || 'secondary';
  };

  const getTypeIcon = (type) => {
    const icons = {
      student: 'bi-person-fill',
      parent: 'bi-people-fill',
      staff: 'bi-person-badge-fill',
      complaint: 'bi-exclamation-triangle-fill',
      announcement: 'bi-megaphone-fill'
    };
    return icons[type] || 'bi-circle-fill';
  };

  const formatResultDisplay = (result) => {
    switch (result.type) {
      case 'student':
        return (
          <div>
            <div className="fw-bold">{result.name}</div>
            <small className="text-muted">
              Roll: {result.roll_number} | Grade: {result.grade_name} {result.division_name}
              {result.mobile && ` | Mobile: ${result.mobile}`}
            </small>
          </div>
        );
      case 'parent':
        return (
          <div>
            <div className="fw-bold">{result.name}</div>
            <small className="text-muted">
              Mobile: {result.mobile} | {result.student_count} student(s)
              {result.email && ` | Email: ${result.email}`}
            </small>
          </div>
        );
      case 'staff':
        return (
          <div>
            <div className="fw-bold">{result.name}</div>
            <small className="text-muted">
              Role: {result.role_name} | Mobile: {result.mobile}
              {result.email && ` | Email: ${result.email}`}
            </small>
          </div>
        );
      case 'complaint':
        return (
          <div>
            <div className="fw-bold">{result.complaint_number}: {result.subject}</div>
            <small className="text-muted">
              Status: {result.status} | Parent: {result.parent_name} | 
              {new Date(result.created_at).toLocaleDateString()}
            </small>
          </div>
        );
      case 'announcement':
        return (
          <div>
            <div className="fw-bold">{result.title}</div>
            <small className="text-muted">
              Status: {result.status} | By: {result.created_by_name} | 
              {new Date(result.created_at).toLocaleDateString()}
            </small>
          </div>
        );
      default:
        return result.name || result.title || 'Unknown';
    }
  };

  const getTotalResults = () => {
    if (!searchResults) return 0;
    return Object.values(searchResults).reduce((total, results) => {
      return total + (Array.isArray(results) ? results.length : 0);
    }, 0);
  };

  const handleResultClick = (result) => {
    setShowDropdown(false);
    setQuery(''); // Clear search after selection
    
    switch (result.type) {
      case 'student':
        toast.success(`Opening ${result.name}'s details...`);
        navigate('/admin/students', { 
          state: { searchStudent: result.name, studentId: result.id } 
        });
        break;
        
      case 'parent':
        toast.success(`Opening ${result.name}'s details...`);
        navigate('/admin/parents', { 
          state: { searchParent: result.name, parentId: result.id } 
        });
        break;
        
      case 'staff':
        toast.success(`Opening ${result.name}'s details...`);
        navigate('/admin/staff', { 
          state: { searchStaff: result.name, staffId: result.id } 
        });
        break;
        
      case 'complaint':
        toast.success(`Opening complaint ${result.complaint_number}...`);
        navigate('/admin/complaints', { 
          state: { searchComplaint: result.complaint_number, complaintId: result.id } 
        });
        break;
        
      case 'announcement':
        toast.success(`Opening announcement "${result.title}"...`);
        navigate('/admin/announcements', { 
          state: { searchAnnouncement: result.title, announcementId: result.id } 
        });
        break;
        
      default:
        toast.error('Cannot open this result type');
        console.log('Unknown result type:', result);
    }
  };

  return (
    <div className="position-relative global-search" style={{ minWidth: '300px' }}>
      <InputGroup ref={searchRef}>
        <InputGroup.Text 
          className="search-icon-btn"
          role="button"
          onClick={() => {
            const input = searchRef.current?.querySelector('input');
            if (input) input.focus();
          }}
          style={{ cursor: 'pointer' }}
        >
          <i className="bi bi-search"></i>
        </InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Search students, parents, staff..."
          value={query}
          onChange={handleSearchChange}
          onFocus={handleInputFocus}
          onClick={handleInputClick}
          style={{ fontSize: '16px' }} // Prevent zoom on iOS
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        {query && (
          <InputGroup.Text 
            className="search-clear-btn"
            role="button" 
            onClick={() => {
              setQuery('');
              setShowDropdown(false);
              const input = searchRef.current?.querySelector('input');
              if (input) input.focus();
            }}
            style={{ cursor: 'pointer' }}
          >
            <i className="bi bi-x-lg"></i>
          </InputGroup.Text>
        )}
      </InputGroup>

      {showDropdown && (
        <div 
          ref={dropdownRef}
          className="position-absolute top-100 start-0 end-0 bg-white border rounded-bottom shadow-lg"
          style={{ zIndex: 1050, maxHeight: '400px', overflowY: 'auto' }}
        >
          {/* Search Type Filters */}
          <div className="p-3 border-bottom bg-light">
            <small className="text-muted d-block mb-2">Search in:</small>
            <div className="d-flex flex-wrap gap-1">
              {['students', 'parents', 'staff', 'complaints', 'announcements'].map(type => (
                <Badge 
                  key={type}
                  bg={selectedTypes.includes(type) ? 'primary' : 'outline-secondary'}
                  role="button"
                  onClick={() => handleTypeToggle(type)}
                  className={`text-capitalize ${selectedTypes.includes(type) ? '' : 'text-dark border'}`}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Search Results */}
          <div className="p-3">
            {query.length < 2 && (
              <small className="text-muted">
                <i className="bi bi-info-circle me-2"></i>
                Type at least 2 characters to search
              </small>
            )}

            {query.length >= 2 && isLoading && (
              <div className="text-center py-3">
                <Spinner size="sm" className="me-2" />
                <small className="text-muted">Searching...</small>
              </div>
            )}

            {error && (
              <Alert variant="danger" className="py-2 mb-2">
                <small>Search failed: {error.response?.data?.message || error.message}</small>
              </Alert>
            )}

            {searchResults && getTotalResults() === 0 && (
              <div className="text-center py-3">
                <i className="bi bi-search display-6 text-muted"></i>
                <div className="text-muted">No results found for "{query}"</div>
                <small className="text-muted">Try different keywords or search types</small>
              </div>
            )}

            {searchResults && getTotalResults() > 0 && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="text-muted">
                    Found {getTotalResults()} result(s)
                  </small>
                </div>

                {Object.entries(searchResults).map(([type, results]) => {
                  if (!Array.isArray(results) || results.length === 0) return null;
                  
                  return (
                    <div key={type} className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <Badge bg={getTypeColor(results[0]?.type)} className="me-2 text-capitalize">
                          <i className={`${getTypeIcon(results[0]?.type)} me-1`}></i>
                          {type}
                        </Badge>
                        <small className="text-muted">({results.length})</small>
                      </div>
                      
                      {results.map((result, index) => (
                        <Card 
                          key={index} 
                          className="mb-2 border-0 bg-light hover-shadow-sm cursor-pointer"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleResultClick(result)}
                        >
                          <Card.Body className="py-2 px-3 d-flex justify-content-between align-items-center">
                            <div className="flex-grow-1">
                              {formatResultDisplay(result)}
                            </div>
                            <div className="text-muted ms-2">
                              <i className="bi bi-arrow-right-short"></i>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .hover-shadow-sm:hover {
          box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
          border-color: #667eea !important;
          background-color: #f8f9ff !important;
        }
        .cursor-pointer {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .hover-shadow-sm:hover .bi-arrow-right-short {
          color: #667eea !important;
          transform: translateX(2px);
        }
        .bi-arrow-right-short {
          transition: all 0.2s ease;
        }
        
        /* Make search icons smaller on all devices */
        .search-icon-btn i,
        .search-clear-btn i {
          font-size: 0.875rem;
        }
        
        /* Fix mobile search input layout */
        @media (max-width: 767px) {
          .input-group {
            flex-direction: row !important;
          }
          
          .input-group-text {
            width: auto !important;
            border-radius: 0.25rem 0 0 0.25rem !important;
            min-height: 44px;
            min-width: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem;
          }
          
          .input-group .form-control {
            border-radius: 0 !important;
            flex: 1;
            min-height: 44px;
            font-size: 16px !important;
            padding: 0.5rem 0.75rem;
          }
          
          .input-group .form-control:focus {
            z-index: 3;
          }
          
          .input-group-text:last-child {
            border-radius: 0 0.25rem 0.25rem 0 !important;
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Better touch targets for mobile */
          .search-icon-btn,
          .search-clear-btn {
            min-height: 44px !important;
            min-width: 44px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
            transition: background-color 0.15s ease;
          }
          
          .search-icon-btn:active,
          .search-clear-btn:active {
            background-color: rgba(0, 0, 0, 0.1) !important;
            transform: scale(0.95);
          }
          
          .search-icon-btn i,
          .search-clear-btn i {
            font-size: 0.9rem;
            pointer-events: none;
          }
          
          /* Make entire container more responsive */
          .position-relative {
            min-width: 280px !important;
            width: 100% !important;
          }
          
          /* Dropdown positioning fix for mobile */
          .position-absolute {
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-width: 100vw !important;
          }
          
          /* Search dropdown mobile optimization */
          .position-absolute > div {
            margin: 0 -15px;
            border-radius: 0.25rem;
          }
          
          /* Make search filters wrap better on mobile */
          .d-flex.flex-wrap.gap-1 {
            gap: 0.25rem !important;
          }
          
          /* Adjust card layout for mobile */
          .card.mb-2 {
            margin-left: 0;
            margin-right: 0;
          }
          
          /* Improve touch targets */
          .badge[role="button"] {
            min-height: 32px;
            display: flex;
            align-items: center;
            padding: 0.375rem 0.75rem;
          }
        }
        
        @media (max-width: 576px) {
          /* Ultra small screens */
          .position-relative {
            min-width: 250px !important;
          }
          
          .position-absolute {
            max-height: 60vh !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GlobalSearch;