import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Dashboard overview component with statistics and metrics
 */
const DashboardOverview = () => {
  const { user } = useAuth();
  
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats', user?.user_type],
    queryFn: async () => {
      try {
        // Determine the correct endpoint based on user type
        const endpoint = user?.user_type === 'staff' ? '/api/staff/dashboard' : '/api/admin/dashboard';
        const response = await apiService.get(endpoint);
        return response.data;
      } catch (error) {
        console.error('Dashboard API error:', error);
        // Return mock data if API fails for development
        return {
          total_students: 0,
          total_staff: 0,
          fees_pending: { pending_count: 0 },
          complaints_summary: {},
          recent_activities: []
        };
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user, // Only run query when user is available
  });

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Failed to load dashboard data. Please try again.
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0 fw-semibold" style={{ fontSize: '1.1rem' }}>
          <i className="bi bi-speedometer2 me-2" style={{ fontSize: '1rem' }}></i>
          Dashboard Overview
        </h5>
        <span className="text-muted" style={{ fontSize: '0.8rem' }}>
          Last updated: {new Date().toLocaleString()}
        </span>
      </div>

      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-primary mb-3">
                <i className="bi bi-people"></i>
              </div>
              <h3 className="mb-1">{stats?.total_students?.toLocaleString() || '0'}</h3>
              <p className="text-muted mb-0">Total Students</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-success mb-3">
                <i className="bi bi-person-badge"></i>
              </div>
              <h3 className="mb-1">{stats?.total_staff?.toLocaleString() || '0'}</h3>
              <p className="text-muted mb-0">Total Staff</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-warning mb-3">
                <i className="bi bi-currency-rupee"></i>
              </div>
              <h3 className="mb-1">{stats?.fees_pending?.pending_count?.toLocaleString() || '0'}</h3>
              <p className="text-muted mb-0">Pending Fees</p>
              {stats?.fees_pending?.pending_amount && (
                <small className="text-muted">
                  ₹{stats.fees_pending.pending_amount.toLocaleString()}
                </small>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-danger mb-3">
                <i className="bi bi-exclamation-triangle"></i>
              </div>
              <h3 className="mb-1">
                {Object.values(stats?.complaints_summary || {}).reduce((a, b) => a + b, 0).toLocaleString()}
              </h3>
              <p className="text-muted mb-0">Total Complaints</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col md={8}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pb-0">
              <h5 className="mb-0">
                <i className="bi bi-activity me-2"></i>
                Recent Activities
              </h5>
            </Card.Header>
            <Card.Body>
              {stats?.recent_activities && stats.recent_activities.length > 0 ? (
                <div className="list-group list-group-flush">
                  {stats.recent_activities.slice(0, 10).map((activity, index) => (
                    <div key={index} className="list-group-item border-0 px-0">
                      <div className="d-flex w-100 justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{activity.action}</h6>
                          <p className="mb-1 text-muted small">
                            {activity.user_name || `${activity.user_type} (ID: ${activity.user_id})`}
                            {activity.table_name && (
                              <span className="ms-2">
                                <i className="bi bi-arrow-right-short"></i>
                                {activity.table_name}
                                {activity.record_id && ` #${activity.record_id}`}
                              </span>
                            )}
                          </p>
                        </div>
                        <small className="text-muted ms-2" style={{ minWidth: '100px', textAlign: 'right' }}>
                          {new Date(activity.created_at).toLocaleString()}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-inbox display-4 mb-3 d-block"></i>
                  <p>No recent activities</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pb-0">
              <h5 className="mb-0">
                <i className="bi bi-chat-dots me-2"></i>
                Complaints Summary
              </h5>
            </Card.Header>
            <Card.Body>
              {stats?.complaints_summary && Object.keys(stats.complaints_summary).length > 0 ? (
                <div>
                  {Object.entries(stats.complaints_summary).map(([status, count]) => (
                    <div key={status} className="d-flex justify-content-between align-items-center mb-3">
                      <span className="text-capitalize">
                        <i className={`bi ${getStatusIcon(status)} me-2`}></i>
                        {status.replace('_', ' ')}
                      </span>
                      <span className={`badge ${getStatusBadgeClass(status)}`}>
                        {count?.toLocaleString() || '0'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-check-circle display-4 mb-3 d-block text-success"></i>
                  <p>No complaints</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

/**
 * Get status icon based on complaint status
 * @param {string} status - Complaint status
 * @returns {string} Bootstrap icon class
 */
const getStatusIcon = (status) => {
  switch (status) {
    case 'open': return 'bi-circle';
    case 'in_progress': return 'bi-arrow-clockwise';
    case 'resolved': return 'bi-check-circle';
    case 'closed': return 'bi-x-circle';
    default: return 'bi-circle';
  }
};

/**
 * Get badge class based on complaint status
 * @param {string} status - Complaint status
 * @returns {string} Bootstrap badge class
 */
const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'open': return 'bg-warning';
    case 'in_progress': return 'bg-info';
    case 'resolved': return 'bg-success';
    case 'closed': return 'bg-secondary';
    default: return 'bg-secondary';
  }
};

export default DashboardOverview;