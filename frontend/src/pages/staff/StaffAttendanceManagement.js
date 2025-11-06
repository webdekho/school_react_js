import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Badge, Alert, Tabs, Tab, Modal } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import format from 'date-fns/format';

const StaffAttendanceManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('mark');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Fetch today's attendance status
  const { data: todayAttendance, isLoading: loadingToday } = useQuery({
    queryKey: ['staff_attendance_today', user?.id],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await api.get(`/api/staff/my_attendance/${today}`);
      return response.data || response;
    },
    retry: false,
    refetchInterval: 60000 // Refetch every minute
  });

  // Fetch attendance history
  const { data: attendanceHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['staff_attendance_history', selectedMonth],
    queryFn: async () => {
      const response = await api.get('/api/staff/my_attendance_history', { month: selectedMonth });
      return response.data || response;
    }
  });

  // Fetch attendance statistics
  const { data: stats } = useQuery({
    queryKey: ['staff_attendance_stats', selectedMonth],
    queryFn: async () => {
      const response = await api.get('/api/staff/my_attendance_stats', { month: selectedMonth });
      return response.data || response;
    }
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/api/staff/check_in');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff_attendance_today']);
      queryClient.invalidateQueries(['staff_attendance_history']);
      queryClient.invalidateQueries(['staff_attendance_stats']);
    }
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/api/staff/check_out');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff_attendance_today']);
      queryClient.invalidateQueries(['staff_attendance_history']);
      queryClient.invalidateQueries(['staff_attendance_stats']);
    }
  });

  const handleCheckIn = () => {
    if (window.confirm('Are you sure you want to check in?')) {
      checkInMutation.mutate();
    }
  };

  const handleCheckOut = () => {
    if (window.confirm('Are you sure you want to check out?')) {
      checkOutMutation.mutate();
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      present: 'success',
      absent: 'danger',
      late: 'warning',
      half_day: 'info',
      leave: 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const formatTime = (time) => {
    if (!time) return '-';
    try {
      return format(new Date(`2000-01-01 ${time}`), 'hh:mm a');
    } catch {
      return time;
    }
  };

  const calculateWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-';
    try {
      const start = new Date(`2000-01-01 ${checkIn}`);
      const end = new Date(`2000-01-01 ${checkOut}`);
      const diff = (end - start) / 1000 / 60 / 60; // hours
      return `${diff.toFixed(2)} hrs`;
    } catch {
      return '-';
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0">Staff Attendance</h2>
          <p className="text-muted">Mark your attendance and view your history</p>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab eventKey="mark" title="Mark Attendance">
          <Row>
            <Col lg={8} className="mx-auto">
              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <div className="text-center mb-4">
                    <h3>{format(new Date(), 'EEEE, MMMM dd, yyyy')}</h3>
                    <div className="display-1 text-primary my-4">
                      {format(new Date(), 'hh:mm a')}
                    </div>
                  </div>

                  {loadingToday ? (
                    <Alert variant="info">Loading today's attendance...</Alert>
                  ) : (
                    <>
                      {todayAttendance ? (
                        <Card className="bg-light">
                          <Card.Body>
                            <Row>
                              <Col md={6} className="mb-3 mb-md-0">
                                <div className="mb-2">
                                  <small className="text-muted">Check-in Time</small>
                                  <div className="h4 mb-0 text-success">
                                    <i className="bi bi-box-arrow-in-right me-2"></i>
                                    {formatTime(todayAttendance.check_in_time)}
                                  </div>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div className="mb-2">
                                  <small className="text-muted">Check-out Time</small>
                                  <div className="h4 mb-0 text-danger">
                                    <i className="bi bi-box-arrow-right me-2"></i>
                                    {formatTime(todayAttendance.check_out_time)}
                                  </div>
                                </div>
                              </Col>
                            </Row>
                            {todayAttendance.check_in_time && todayAttendance.check_out_time && (
                              <div className="mt-3 pt-3 border-top">
                                <small className="text-muted">Total Work Hours</small>
                                <div className="h5 mb-0">
                                  {calculateWorkHours(todayAttendance.check_in_time, todayAttendance.check_out_time)}
                                </div>
                              </div>
                            )}
                            {todayAttendance.remarks && (
                              <div className="mt-3 pt-3 border-top">
                                <small className="text-muted">Remarks</small>
                                <div>{todayAttendance.remarks}</div>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      ) : (
                        <Alert variant="warning">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          You haven't marked your attendance today.
                        </Alert>
                      )}

                      <div className="d-grid gap-2 mt-4">
                        {!todayAttendance?.check_in_time ? (
                          <Button
                            variant="success"
                            size="lg"
                            onClick={handleCheckIn}
                            disabled={checkInMutation.isPending}
                          >
                            <i className="bi bi-box-arrow-in-right me-2"></i>
                            {checkInMutation.isPending ? 'Checking In...' : 'Check In'}
                          </Button>
                        ) : !todayAttendance?.check_out_time ? (
                          <Button
                            variant="danger"
                            size="lg"
                            onClick={handleCheckOut}
                            disabled={checkOutMutation.isPending}
                          >
                            <i className="bi bi-box-arrow-right me-2"></i>
                            {checkOutMutation.isPending ? 'Checking Out...' : 'Check Out'}
                          </Button>
                        ) : (
                          <Alert variant="success" className="mb-0">
                            <i className="bi bi-check-circle me-2"></i>
                            You have completed your attendance for today.
                          </Alert>
                        )}
                      </div>

                      {(checkInMutation.isError || checkOutMutation.isError) && (
                        <Alert variant="danger" className="mt-3 mb-0">
                          {checkInMutation.error?.response?.data?.message || 
                           checkOutMutation.error?.response?.data?.message || 
                           'An error occurred. Please try again.'}
                        </Alert>
                      )}
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="history" title="Attendance History">
          <Card className="shadow-sm">
            <Card.Body>
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Select Month</Form.Label>
                    <Form.Control
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      max={format(new Date(), 'yyyy-MM')}
                    />
                  </Form.Group>
                </Col>
                <Col md={8} className="text-md-end d-flex align-items-end">
                  <Button
                    variant="outline-primary"
                    onClick={() => setShowStatsModal(true)}
                  >
                    <i className="bi bi-graph-up me-2"></i>
                    View Statistics
                  </Button>
                </Col>
              </Row>

              {loadingHistory ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : attendanceHistory?.length > 0 ? (
                <div className="table-responsive">
                  <Table hover>
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Work Hours</th>
                        <th>Status</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.map((record) => (
                        <tr key={record.id}>
                          <td>{format(new Date(record.attendance_date), 'MMM dd, yyyy')}</td>
                          <td>{format(new Date(record.attendance_date), 'EEEE')}</td>
                          <td>{formatTime(record.check_in_time)}</td>
                          <td>{formatTime(record.check_out_time)}</td>
                          <td>{calculateWorkHours(record.check_in_time, record.check_out_time)}</td>
                          <td>{getStatusBadge(record.status)}</td>
                          <td>{record.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="info">
                  No attendance records found for {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Statistics Modal */}
      <Modal show={showStatsModal} onHide={() => setShowStatsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Attendance Statistics</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {stats ? (
            <Row>
              <Col md={6} className="mb-3">
                <Card className="bg-success bg-opacity-10 border-success">
                  <Card.Body>
                    <h6 className="text-muted mb-2">Present Days</h6>
                    <h2 className="mb-0 text-success">{stats.present_days || 0}</h2>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} className="mb-3">
                <Card className="bg-danger bg-opacity-10 border-danger">
                  <Card.Body>
                    <h6 className="text-muted mb-2">Absent Days</h6>
                    <h2 className="mb-0 text-danger">{stats.absent_days || 0}</h2>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} className="mb-3">
                <Card className="bg-warning bg-opacity-10 border-warning">
                  <Card.Body>
                    <h6 className="text-muted mb-2">Late Days</h6>
                    <h2 className="mb-0 text-warning">{stats.late_days || 0}</h2>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} className="mb-3">
                <Card className="bg-info bg-opacity-10 border-info">
                  <Card.Body>
                    <h6 className="text-muted mb-2">Attendance Rate</h6>
                    <h2 className="mb-0 text-info">{stats.attendance_rate || '0.00'}%</h2>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} className="mb-3">
                <Card className="bg-primary bg-opacity-10 border-primary">
                  <Card.Body>
                    <h6 className="text-muted mb-2">Total Work Days</h6>
                    <h2 className="mb-0 text-primary">{stats.total_days || 0}</h2>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} className="mb-3">
                <Card className="bg-secondary bg-opacity-10 border-secondary">
                  <Card.Body>
                    <h6 className="text-muted mb-2">Average Work Hours</h6>
                    <h2 className="mb-0 text-secondary">{stats.avg_work_hours || '0.00'} hrs</h2>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ) : (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StaffAttendanceManagement;

