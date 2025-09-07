import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Badge, Spinner, Row, Col, InputGroup, Tab, Tabs } from 'react-bootstrap';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { useAcademicYear } from '../../contexts/AcademicYearContext';
import { useAuth } from '../../contexts/AuthContext';

const ReportsManagement = () => {
  const { selectedAcademicYear } = useAcademicYear();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('generate');
  const [selectedReport, setSelectedReport] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportTitle, setReportTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter states with default date range (previous 1 month to current date)
  const [filters, setFilters] = useState(() => {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    return {
      academic_year_id: '',
      grade_id: '',
      division_id: '',
      category_id: '',
      staff_id: '',
      start_date: oneMonthAgo.toISOString().split('T')[0], // Format as YYYY-MM-DD
      end_date: today.toISOString().split('T')[0], // Format as YYYY-MM-DD
      status: '',
      priority: '',
      assigned_to: '',
      target_type: '',
      overdue_only: false
    };
  });

  // Fetch available report types
  const { data: reportTypesResponse, isLoading: loadingTypes } = useQuery({
    queryKey: ['report_types'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/report_types');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  const reportTypes = reportTypesResponse?.report_types || [];

  // Fetch filter options
  const { data: gradesResponse } = useQuery({
    queryKey: ['grades_dropdown'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/grades');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ['fee_types_dropdown'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/fee_types');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  const { data: staffResponse } = useQuery({
    queryKey: ['staff_dropdown'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/staff?limit=100');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async ({ reportType, reportFilters, exportFormat }) => {
      const params = new URLSearchParams();
      
      // Add filters to params
      Object.entries(reportFilters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          if (typeof value === 'boolean') {
            params.append(key, value ? '1' : '0');
          } else {
            params.append(key, value);
          }
        }
      });

      if (exportFormat) {
        params.append('export', exportFormat);
      }

      // CRITICAL: Ensure academic_year_id is included for fee reports in mutation
      if ((reportType.includes('fee') || reportType.includes('Fee')) && selectedAcademicYear?.id && !reportFilters.academic_year_id) {
        params.append('academic_year_id', selectedAcademicYear.id);
      }
      
      // Add academic year display info to URL params if available
      if (selectedAcademicYear && !reportFilters.academic_year_display) {
        params.append('academic_year_display', selectedAcademicYear.name || 
          `${new Date(selectedAcademicYear.start_date).getFullYear()}-${new Date(selectedAcademicYear.end_date).getFullYear()}`);
      }
      
      // Debug: Log the final URL being called (only in development)
      const finalUrl = `/api/admin/reports/${reportType}?${params}`;
      if (process.env.NODE_ENV === 'development') {
        console.log('Final API URL:', finalUrl);
      }

      const response = await apiService.get(finalUrl);
      return response.data;
    },
    onSuccess: (data) => {
      setReportData(data);
      setReportTitle(data.title);
      setShowReportModal(true);
      setIsGenerating(false);
      toast.success('Report generated successfully!');
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error(error.response?.data?.message || 'Failed to generate report');
    }
  });

  // Set default academic year filter - only when selectedAcademicYear changes
  useEffect(() => {
    if (selectedAcademicYear?.id) {
      setFilters(prev => ({ 
        ...prev, 
        academic_year_id: prev.academic_year_id || selectedAcademicYear.id 
      }));
    }
  }, [selectedAcademicYear?.id]); // Only depend on the ID, not the entire filters object

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateReport = useCallback(async (exportFormat = null) => {
    if (!selectedReport) {
      toast.error('Please select a report type');
      return;
    }

    // Prevent multiple simultaneous calls
    if (isGenerating) {
      console.warn('Report generation already in progress');
      return;
    }

    setIsGenerating(true);
    
    // Prepare filters based on selected report type
    const selectedReportType = reportTypes.find(rt => rt.id === selectedReport);
    const applicableFilters = {};
    
    if (selectedReportType?.filters) {
      selectedReportType.filters.forEach(filterKey => {
        if (filters[filterKey] !== '' && filters[filterKey] !== null && filters[filterKey] !== undefined) {
          applicableFilters[filterKey] = filters[filterKey];
        }
      });
    }
    
    // CRITICAL: Ensure academic_year_id is always included for fee reports
    if ((selectedReport.includes('fee') || selectedReport.includes('Fee')) && selectedAcademicYear?.id && !applicableFilters.academic_year_id) {
      applicableFilters.academic_year_id = selectedAcademicYear.id;
    }
    
    // Add academic year information for display
    if (selectedAcademicYear && !applicableFilters.academic_year_display) {
      // Use the name property or format from start_date/end_date
      applicableFilters.academic_year_display = selectedAcademicYear.name || 
        `${new Date(selectedAcademicYear.start_date).getFullYear()}-${new Date(selectedAcademicYear.end_date).getFullYear()}`;
    }
    
    // Debug: Log filters being sent (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Selected Report Type:', selectedReportType?.name);
      console.log('Applicable Filters being sent:', applicableFilters);
      
      // Special debugging for fee reports
      if (selectedReport.includes('fee') || selectedReport.includes('Fee')) {
        console.log('🏦 FEE REPORT - Academic Year ID:', applicableFilters.academic_year_id);
      }
    }

    if (exportFormat === 'csv' || exportFormat === 'excel') {
      // Handle CSV and Excel export differently - direct download
      try {
        const params = new URLSearchParams();
        Object.entries(applicableFilters).forEach(([key, value]) => {
          if (value !== '' && value !== null && value !== undefined) {
            if (typeof value === 'boolean') {
              params.append(key, value ? '1' : '0');
            } else {
              params.append(key, value);
            }
          }
        });
        
        // CRITICAL: Ensure academic_year_id is included for export of fee reports
        if ((selectedReport.includes('fee') || selectedReport.includes('Fee')) && selectedAcademicYear?.id && !applicableFilters.academic_year_id) {
          params.append('academic_year_id', selectedAcademicYear.id);
        }
        
        // Add academic year display for export
        if (selectedAcademicYear && !applicableFilters.academic_year_display) {
          params.append('academic_year_display', selectedAcademicYear.name || 
            `${new Date(selectedAcademicYear.start_date).getFullYear()}-${new Date(selectedAcademicYear.end_date).getFullYear()}`);
        }
        
        params.append('export', exportFormat);

        // Add auth token to URL for download
        const token = localStorage.getItem('auth_token');
        params.append('token', token);
        
        const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost/School/backend/';
        const url = `${backendUrl}api/admin/reports/${selectedReport}?${params}`;
        
        // Use window.open for download
        window.open(url, '_blank');
        setIsGenerating(false);
      } catch (error) {
        setIsGenerating(false);
        toast.error('Failed to export report');
      }
    } else {
      try {
        generateReportMutation.mutate({
          reportType: selectedReport,
          reportFilters: applicableFilters,
          exportFormat
        });
      } catch (error) {
        setIsGenerating(false);
        toast.error('Failed to initiate report generation');
      }
    }
  }, [selectedReport, isGenerating, reportTypes, filters, selectedAcademicYear, generateReportMutation]);

  const getReportsByCategory = () => {
    const categories = {};
    reportTypes.forEach(report => {
      if (!categories[report.category]) {
        categories[report.category] = [];
      }
      categories[report.category].push(report);
    });
    return categories;
  };

  const renderFilterControls = () => {
    const selectedReportType = reportTypes.find(rt => rt.id === selectedReport);
    if (!selectedReportType?.filters) return null;

    return (
      <Card className="mb-4">
        <Card.Header>
          <h6 className="mb-0">
            <i className="bi bi-funnel me-2"></i>
            Report Filters
          </h6>
        </Card.Header>
        <Card.Body>
          <Row>
            {selectedReportType.filters.includes('academic_year_id') && (
              <Col md={3} className="mb-3">
                <Form.Label>Academic Year</Form.Label>
                <Form.Select
                  value={filters.academic_year_id}
                  onChange={(e) => {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Academic Year changed:', e.target.value);
                    }
                    handleFilterChange('academic_year_id', e.target.value);
                  }}
                >
                  <option value="">All Academic Years</option>
                  {selectedAcademicYear && (
                    <option value={selectedAcademicYear.id}>
                      {selectedAcademicYear.name || 
                        `${new Date(selectedAcademicYear.start_date).getFullYear()}-${new Date(selectedAcademicYear.end_date).getFullYear()}`}
                    </option>
                  )}
                </Form.Select>
              </Col>
            )}
            

            {selectedReportType.filters.includes('grade_id') && (
              <Col md={3} className="mb-3">
                <Form.Label>Grade</Form.Label>
                <Form.Select
                  value={filters.grade_id}
                  onChange={(e) => handleFilterChange('grade_id', e.target.value)}
                >
                  <option value="">All Grades</option>
                  {gradesResponse?.data?.map(grade => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            )}

            {selectedReportType.filters.includes('category_id') && (
              <Col md={3} className="mb-3">
                <Form.Label>Fee Category</Form.Label>
                <Form.Select
                  value={filters.category_id}
                  onChange={(e) => {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Category selected:', e.target.value);
                    }
                    handleFilterChange('category_id', e.target.value);
                  }}
                >
                  <option value="">All Categories</option>
                  {(Array.isArray(categoriesResponse) ? categoriesResponse : categoriesResponse?.data || []).map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            )}

            {selectedReportType.filters.includes('staff_id') && (
              <Col md={3} className="mb-3">
                <Form.Label>Staff Member</Form.Label>
                <Form.Select
                  value={filters.staff_id}
                  onChange={(e) => handleFilterChange('staff_id', e.target.value)}
                >
                  <option value="">All Staff</option>
                  {staffResponse?.data?.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            )}

            {selectedReportType.filters.includes('start_date') && (
              <Col md={3} className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                />
              </Col>
            )}

            {selectedReportType.filters.includes('end_date') && (
              <Col md={3} className="mb-3">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                />
              </Col>
            )}

            {selectedReportType.filters.includes('status') && (
              <Col md={3} className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="sent">Sent</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                </Form.Select>
              </Col>
            )}

            {selectedReportType.filters.includes('overdue_only') && (
              <Col md={3} className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Overdue Only"
                  checked={filters.overdue_only}
                  onChange={(e) => handleFilterChange('overdue_only', e.target.checked)}
                  className="mt-4"
                />
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>
    );
  };

  const renderReportData = () => {
    if (!reportData?.data) return null;

    // Handle different data structures
    if (reportData.report_type === 'dashboard_analytics') {
      return (
        <div>
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <div className="display-6 text-primary">{reportData.data.total_students}</div>
                  <small className="text-muted">Total Students</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <div className="display-6 text-success">{reportData.data.total_parents}</div>
                  <small className="text-muted">Total Parents</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <div className="display-6 text-warning">{reportData.data.total_staff}</div>
                  <small className="text-muted">Total Staff</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <div className="display-6 text-danger">{reportData.data.active_complaints}</div>
                  <small className="text-muted">Active Complaints</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {reportData.data.grade_distribution && (
            <div>
              <h6>Grade Distribution</h6>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Grade</th>
                    <th>Student Count</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.data.grade_distribution.map((grade, index) => (
                    <tr key={index}>
                      <td>{grade.grade_name}</td>
                      <td>{grade.student_count}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      );
    }

    // Handle array data (most reports)
    if (Array.isArray(reportData.data) && reportData.data.length > 0) {
      const headers = Object.keys(reportData.data[0]);
      
      return (
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <Table responsive striped>
            <thead>
              <tr>
                {headers.map(header => {
                  let displayHeader = header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  // Special formatting for certain headers
                  if (header === 'academic_year') displayHeader = 'Academic Year';
                  if (header === 'total_due') displayHeader = 'Total Due (₹)';
                  if (header === 'paid_amount') displayHeader = 'Paid Amount (₹)';
                  if (header === 'pending_amount') displayHeader = 'Pending Amount (₹)';
                  if (header === 'fee_amount') displayHeader = 'Fee Amount (₹)';
                  if (header === 'student_name') displayHeader = 'Student Name';
                  if (header === 'parent_name') displayHeader = 'Parent Name';
                  if (header === 'grade_name') displayHeader = 'Grade';
                  if (header === 'division_name') displayHeader = 'Division';
                  return (
                    <th key={header}>
                      {displayHeader}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {reportData.data.map((row, index) => (
                <tr key={index}>
                  {headers.map(header => (
                    <td key={header}>
                      {(() => {
                        const value = row[header];
                        
                        // Format currency fields
                        if ((typeof value === 'number' || !isNaN(value)) && 
                            (header.includes('amount') || header.includes('due') || header.includes('fee'))) {
                          return new Intl.NumberFormat('en-IN', { 
                            style: 'currency', 
                            currency: 'INR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(value || 0);
                        }
                        
                        // Format date fields
                        if (value && (header.includes('date') || header.includes('created_at') || header.includes('updated_at'))) {
                          try {
                            return new Date(value).toLocaleDateString('en-IN');
                          } catch (e) {
                            return value;
                          }
                        }
                        
                        // Default formatting
                        return value || '-';
                      })()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      );
    }

    return (
      <Alert variant="info">
        <i className="bi bi-info-circle me-2"></i>
        No data available for the selected filters.
      </Alert>
    );
  };

  if (loadingTypes) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">
            <i className="bi bi-graph-up me-2"></i>
            Reports & Analytics
          </h4>
          <small className="text-muted">
            Generate comprehensive reports and analytics
          </small>
        </div>
      </div>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="generate" title="Generate Reports">
          <Row>
            <Col md={4}>
              <Card className="border-0 shadow-sm mb-4">
                <Card.Header>
                  <h6 className="mb-0">
                    <i className="bi bi-list-ul me-2"></i>
                    Available Reports
                  </h6>
                </Card.Header>
                <Card.Body>
                  {Object.entries(getReportsByCategory()).map(([category, reports]) => (
                    <div key={category} className="mb-3">
                      <div className="fw-bold text-muted mb-2 text-uppercase small">
                        {category}
                      </div>
                      {reports.map(report => (
                        <div 
                          key={report.id}
                          className={`p-2 rounded cursor-pointer ${selectedReport === report.id ? 'bg-primary text-white' : 'hover-bg-light'}`}
                          onClick={() => setSelectedReport(report.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="fw-medium">{report.name}</div>
                          <small className={selectedReport === report.id ? 'text-light' : 'text-muted'}>
                            {report.description}
                          </small>
                        </div>
                      ))}
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>

            <Col md={8}>
              {selectedReport ? (
                <div>
                  {renderFilterControls()}
                  
                  <Card className="border-0 shadow-sm">
                    <Card.Header>
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">
                          <i className="bi bi-file-earmark-text me-2"></i>
                          {reportTypes.find(rt => rt.id === selectedReport)?.name}
                          {selectedAcademicYear && (
                            <small className="text-muted ms-2">
                              - {selectedAcademicYear.name || 
                                `${new Date(selectedAcademicYear.start_date).getFullYear()}-${new Date(selectedAcademicYear.end_date).getFullYear()}`}
                            </small>
                          )}
                        </h6>
                        <div className="btn-group">
                          <Button
                            variant="primary"
                            onClick={() => handleGenerateReport()}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <>
                                <Spinner size="sm" className="me-2" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-play-circle me-2"></i>
                                Generate Report
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline-success"
                            onClick={() => handleGenerateReport('csv')}
                            disabled={isGenerating}
                          >
                            <i className="bi bi-file-earmark-csv me-2"></i>
                            Export CSV
                          </Button>
                          <Button
                            variant="outline-primary"
                            onClick={() => handleGenerateReport('excel')}
                            disabled={isGenerating}
                          >
                            <i className="bi bi-file-earmark-excel me-2"></i>
                            Export Excel
                          </Button>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <p className="text-muted mb-0">
                        {reportTypes.find(rt => rt.id === selectedReport)?.description}
                      </p>
                      <small className="text-muted">
                        Configure filters above and click "Generate Report" to view the data.
                      </small>
                    </Card.Body>
                  </Card>
                </div>
              ) : (
                <Card className="border-0 shadow-sm text-center py-5">
                  <Card.Body>
                    <i className="bi bi-graph-up display-1 text-muted mb-4"></i>
                    <h5>Select a Report Type</h5>
                    <p className="text-muted">
                      Choose a report from the list on the left to get started.
                    </p>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Tab>
      </Tabs>

      {/* Report Display Modal */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-file-earmark-bar-graph me-2"></i>
            {reportTitle}
            {filters.category_id && (
              <small className="text-primary ms-2">
                (Category Filtered)
              </small>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {reportData && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <small className="text-muted">
                    Generated on {new Date(reportData.generated_at).toLocaleString()} by {reportData.generated_by}
                  </small>
                  {reportData.filters && Object.keys(reportData.filters).length > 0 && (
                    <div className="text-info small mt-1">
                      <i className="bi bi-funnel me-1"></i>
                      Filters Applied: {Object.entries(reportData.filters)
                        .filter(([key, value]) => value && value !== '' && key !== 'academic_year_display')
                        .map(([key, value]) => {
                          if (key === 'category_id') {
                            const category = (Array.isArray(categoriesResponse) ? categoriesResponse : categoriesResponse?.data || [])
                              .find(cat => cat.id == value);
                            return `Category: ${category?.name || value}`;
                          }
                          if (key === 'grade_id') {
                            const grade = gradesResponse?.data?.find(g => g.id == value);
                            return `Grade: ${grade?.name || value}`;
                          }
                          return `${key.replace(/_/g, ' ')}: ${value}`;
                        })
                        .join(', ')}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={() => {
                    const selectedReportType = reportTypes.find(rt => rt.id === reportData.report_type);
                    const applicableFilters = {};
                    
                    if (selectedReportType?.filters) {
                      selectedReportType.filters.forEach(filterKey => {
                        if (filters[filterKey] !== '' && filters[filterKey] !== null) {
                          applicableFilters[filterKey] = filters[filterKey];
                        }
                      });
                    }

                    const params = new URLSearchParams();
                    Object.entries(applicableFilters).forEach(([key, value]) => {
                      if (value !== '' && value !== null && value !== undefined) {
                        params.append(key, value);
                      }
                    });
                    
                    // CRITICAL: Ensure academic_year_id is included for export from modal
                    if ((reportData.report_type.includes('fee') || reportData.report_type.includes('Fee')) && selectedAcademicYear?.id && !applicableFilters.academic_year_id) {
                      params.append('academic_year_id', selectedAcademicYear.id);
                    }
                    
                    // Add academic year display for export from modal
                    if (selectedAcademicYear && !applicableFilters.academic_year_display) {
                      params.append('academic_year_display', selectedAcademicYear.name || 
                        `${new Date(selectedAcademicYear.start_date).getFullYear()}-${new Date(selectedAcademicYear.end_date).getFullYear()}`);
                    }
                    
                    params.append('export', 'excel');

                    // Add auth token to URL for download
                    const token = localStorage.getItem('auth_token');
                    params.append('token', token);
                    
                    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost/School/backend/';
                    const url = `${backendUrl}api/admin/reports/${reportData.report_type}?${params}`;
                    
                    // Use window.open for download
                    window.open(url, '_blank');
                  }}
                >
                  <i className="bi bi-file-earmark-excel me-2"></i>
                  Export Excel
                </Button>
              </div>
              
              {renderReportData()}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .hover-bg-light:hover {
          background-color: #f8f9fa;
        }
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default ReportsManagement;