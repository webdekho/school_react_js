import React, { useState } from 'react';
import { Card, Button, Form, Row, Col, Table, Badge, Modal, Spinner, Tabs, Tab, Alert } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

const StaffAttendanceManagement = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState('mark');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsData, setStatsData] = useState(null);
  
  // Filter states
  const [filterStaff, setFilterStaff] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch staff list
  const { data: staffList = [] } = useQuery({
    queryKey: ['staff_dropdown'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/staff_dropdown');
      // Response structure can be: { status: 'success', data: [...] } or direct array
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          return response.data;
        }
        if (response.data.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
      }
      if (Array.isArray(response)) {
        return response;
      }
      return [];
    }
  });

  // Fetch daily attendance
  const { data: dailyAttendance, isLoading: loadingDaily, refetch: refetchDaily } = useQuery({
    queryKey: ['staff_daily_attendance', selectedDate],
    queryFn: async () => {
      const response = await apiService.get(`/api/admin/staff_attendance_daily?date=${selectedDate}`);
      return response.data;
    },
    enabled: activeTab === 'mark'
  });

  // Fetch attendance history
  const { data: attendanceHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['staff_attendance_history', selectedMonth, filterStaff, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({ month: selectedMonth });
      if (filterStaff) params.append('staff_id', filterStaff);
      if (filterStatus) params.append('status', filterStatus);
      
      const response = await apiService.get(`/api/admin/staff_attendance_history?${params}`);
      return response.data;
    },
    enabled: activeTab === 'history'
  });

  // Fetch low attendance staff
  const { data: lowAttendanceData, isLoading: loadingLowAttendance } = useQuery({
    queryKey: ['low_attendance_staff', selectedMonth],
    queryFn: async () => {
      const response = await apiService.get(`/api/admin/low_attendance_staff?threshold=75&month=${selectedMonth}`);
      return response.data;
    },
    enabled: activeTab === 'reports'
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async (data) => {
      return await apiService.post('/api/admin/mark_staff_attendance', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff_daily_attendance']);
      queryClient.invalidateQueries(['staff_attendance_history']);
      toast.success('Attendance marked successfully!');
      setAttendanceRecords({});
      refetchDaily();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    }
  });

  // Delete attendance mutation
  const deleteAttendanceMutation = useMutation({
    mutationFn: async (id) => {
      return await apiService.delete(`/api/admin/staff_attendance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff_daily_attendance']);
      queryClient.invalidateQueries(['staff_attendance_history']);
      toast.success('Attendance record deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete attendance');
    }
  });

  // Initialize attendance records when data loads
  React.useEffect(() => {
    if (dailyAttendance) {
      const records = {};
      dailyAttendance.forEach(staff => {
        records[staff.staff_id] = {
          staff_id: staff.staff_id,
          status: staff.status || 'present',
          check_in_time: staff.check_in_time || '09:00',
          check_out_time: staff.check_out_time || '17:00',
          remarks: staff.remarks || ''
        };
      });
      setAttendanceRecords(records);
    }
  }, [dailyAttendance]);

  // Handle status change
  const handleStatusChange = (staffId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        staff_id: staffId,
        status,
        check_in_time: status === 'absent' ? '' : (prev[staffId]?.check_in_time || '09:00'),
        check_out_time: status === 'absent' ? '' : (prev[staffId]?.check_out_time || '17:00')
      }
    }));
  };

  // Handle time/remarks change
  const handleFieldChange = (staffId, field, value) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        staff_id: staffId,
        [field]: value
      }
    }));
  };

  // Mark all as present
  const markAllPresent = () => {
    if (!dailyAttendance) return;
    
    const records = {};
    dailyAttendance.forEach(staff => {
      records[staff.staff_id] = {
        staff_id: staff.staff_id,
        status: 'present',
        check_in_time: '09:00',
        check_out_time: '17:00',
        remarks: ''
      };
    });
    setAttendanceRecords(records);
    toast.success('All staff marked as present');
  };

  // Submit attendance
  const handleSubmitAttendance = () => {
    const attendance_records = Object.values(attendanceRecords);
    
    markAttendanceMutation.mutate({
      attendance_date: selectedDate,
      attendance_records
    });
  };

  // View staff statistics
  const viewStaffStats = async (staffId) => {
    try {
      const response = await apiService.get(`/api/admin/staff_attendance_stats?staff_id=${staffId}&month=${selectedMonth}`);
      setStatsData(response.data);
      setShowStatsModal(true);
    } catch (error) {
      toast.error('Failed to load statistics');
    }
  };

  // Handle delete
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      deleteAttendanceMutation.mutate(id);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const variants = {
      'present': 'success',
      'absent': 'danger',
      'late': 'warning',
      'half_day': 'info',
      'leave': 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  };

  // Format time
  const formatTime = (time) => {
    if (!time) return '-';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  // Calculate work hours
  const calculateWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-';
    try {
      const [inHours, inMinutes] = checkIn.split(':').map(Number);
      const [outHours, outMinutes] = checkOut.split(':').map(Number);
      const totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    } catch {
      return '-';
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">
            <i className="bi bi-person-check me-2"></i>
            Staff Attendance Management
          </h4>
          <p className="text-muted mb-0">Track and manage staff attendance</p>
        </div>
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab eventKey="mark" title={<><i className="bi bi-check-circle me-2"></i>Mark Attendance</>}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Row className="mb-4">
                <Col md={9}>
                  <Form.Group>
                    <Form.Label className="text-dark fw-medium">Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="text-dark fw-medium">&nbsp;</Form.Label>
                    <div className="d-grid">
                      <Button
                        variant="outline-success"
                        onClick={markAllPresent}
                        disabled={!dailyAttendance || dailyAttendance.length === 0}
                      >
                        <i className="bi bi-check-all me-2"></i>
                        Mark All Present
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              {loadingDaily ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                </div>
              ) : dailyAttendance && dailyAttendance.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <Table hover>
                      <thead className="table-light">
                        <tr>
                          <th>Staff Name</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Check-in Time</th>
                          <th>Check-out Time</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyAttendance.map((staff) => (
                          <tr key={staff.staff_id}>
                            <td>
                              <div className="fw-medium">{staff.staff_name}</div>
                              <small className="text-muted">{staff.email}</small>
                            </td>
                            <td>{staff.role_name || '-'}</td>
                            <td>
                              <div className="btn-group" role="group">
                                {['present', 'absent', 'late', 'half_day', 'leave'].map(status => (
                                  <Button
                                    key={status}
                                    variant={attendanceRecords[staff.staff_id]?.status === status ? 'primary' : 'outline-secondary'}
                                    size="sm"
                                    onClick={() => handleStatusChange(staff.staff_id, status)}
                                  >
                                    {status.replace('_', ' ')}
                                  </Button>
                                ))}
                              </div>
                            </td>
                            <td>
                              <Form.Control
                                type="time"
                                size="sm"
                                value={attendanceRecords[staff.staff_id]?.check_in_time || ''}
                                onChange={(e) => handleFieldChange(staff.staff_id, 'check_in_time', e.target.value)}
                                disabled={attendanceRecords[staff.staff_id]?.status === 'absent'}
                                style={{ minWidth: '120px' }}
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="time"
                                size="sm"
                                value={attendanceRecords[staff.staff_id]?.check_out_time || ''}
                                onChange={(e) => handleFieldChange(staff.staff_id, 'check_out_time', e.target.value)}
                                disabled={attendanceRecords[staff.staff_id]?.status === 'absent'}
                                style={{ minWidth: '120px' }}
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="text"
                                size="sm"
                                placeholder="Optional remarks"
                                value={attendanceRecords[staff.staff_id]?.remarks || ''}
                                onChange={(e) => handleFieldChange(staff.staff_id, 'remarks', e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  <div className="text-end mt-3">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleSubmitAttendance}
                      disabled={markAttendanceMutation.isLoading}
                    >
                      {markAttendanceMutation.isLoading ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save me-2"></i>
                          Save Attendance
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <Alert variant="secondary" className="text-center">
                  <i className="bi bi-person-check display-4 text-muted d-block mb-3"></i>
                  Please select a date to mark staff attendance.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="history" title={<><i className="bi bi-clock-history me-2"></i>History</>}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Row className="mb-4">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="text-dark fw-medium">Month</Form.Label>
                    <Form.Control
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      max={new Date().toISOString().slice(0, 7)}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="text-dark fw-medium">Staff Member</Form.Label>
                    <Form.Select
                      value={filterStaff}
                      onChange={(e) => setFilterStaff(e.target.value)}
                    >
                      <option value="">All Staff</option>
                      {Array.isArray(staffList) && staffList.map(staff => (
                        <option key={staff.id} value={staff.id}>{staff.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="text-dark fw-medium">Status</Form.Label>
                    <Form.Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="half_day">Half Day</option>
                      <option value="leave">Leave</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {loadingHistory ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                </div>
              ) : attendanceHistory && attendanceHistory.length > 0 ? (
                <div className="table-responsive">
                  <Table hover>
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Staff Name</th>
                        <th>Role</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Work Hours</th>
                        <th>Status</th>
                        <th>Remarks</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.map((record) => (
                        <tr key={record.id}>
                          <td>{new Date(record.attendance_date).toLocaleDateString()}</td>
                          <td>
                            <div className="fw-medium">{record.staff_name}</div>
                            <small className="text-muted">{record.email}</small>
                          </td>
                          <td>{record.role_name || '-'}</td>
                          <td>{formatTime(record.check_in_time)}</td>
                          <td>{formatTime(record.check_out_time)}</td>
                          <td>{calculateWorkHours(record.check_in_time, record.check_out_time)}</td>
                          <td>{getStatusBadge(record.status)}</td>
                          <td>{record.remarks || '-'}</td>
                          <td>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(record.id)}
                              disabled={deleteAttendanceMutation.isLoading}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="info" className="text-center">
                  <i className="bi bi-info-circle me-2"></i>
                  No attendance records found for the selected filters.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="reports" title={<><i className="bi bi-exclamation-triangle me-2"></i>Low Attendance</>}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Row className="mb-4">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="text-dark fw-medium">Month</Form.Label>
                    <Form.Control
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      max={new Date().toISOString().slice(0, 7)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <h5 className="mb-4">Staff with Less than 75% Attendance</h5>

              {loadingLowAttendance ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                </div>
              ) : lowAttendanceData && lowAttendanceData.length > 0 ? (
                <div className="table-responsive">
                  <Table hover>
                    <thead className="table-light">
                      <tr>
                        <th>Staff Name</th>
                        <th>Role</th>
                        <th>Total Days</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Attendance %</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowAttendanceData.map((staff) => (
                        <tr key={staff.staff_id}>
                          <td>
                            <div className="fw-medium">{staff.staff_name}</div>
                            <small className="text-muted">{staff.email}</small>
                          </td>
                          <td>{staff.role_name || '-'}</td>
                          <td>{staff.total_days}</td>
                          <td><Badge bg="success">{staff.present_days}</Badge></td>
                          <td><Badge bg="danger">{staff.absent_days}</Badge></td>
                          <td>
                            <Badge bg={parseFloat(staff.attendance_rate) < 50 ? 'danger' : 'warning'}>
                              {staff.attendance_rate}%
                            </Badge>
                          </td>
                          <td>
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => viewStaffStats(staff.staff_id)}
                            >
                              <i className="bi bi-graph-up"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="success" className="text-center">
                  <i className="bi bi-check-circle me-2"></i>
                  Great! All staff have attendance above 75%.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Statistics Modal */}
      <Modal show={showStatsModal} onHide={() => setShowStatsModal(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="bi bi-graph-up me-2"></i>
            Attendance Statistics
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {statsData && (
            <div>
              <Row className="mb-3">
                <Col xs={6}>
                  <div className="text-center p-3 bg-light rounded">
                    <div className="display-6 text-primary">{statsData.total_days || 0}</div>
                    <small className="text-muted">Total Days</small>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="text-center p-3 bg-light rounded">
                    <div className="display-6 text-success">{statsData.attendance_rate || '0.00'}%</div>
                    <small className="text-muted">Attendance</small>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col xs={6} className="mb-3">
                  <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                    <div className="h3 text-success">{statsData.present_days || 0}</div>
                    <small className="text-muted">Present</small>
                  </div>
                </Col>
                <Col xs={6} className="mb-3">
                  <div className="text-center p-3 bg-danger bg-opacity-10 rounded">
                    <div className="h3 text-danger">{statsData.absent_days || 0}</div>
                    <small className="text-muted">Absent</small>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                    <div className="h3 text-warning">{statsData.late_days || 0}</div>
                    <small className="text-muted">Late</small>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="text-center p-3 bg-info bg-opacity-10 rounded">
                    <div className="h3 text-info">{statsData.half_days || 0}</div>
                    <small className="text-muted">Half Day</small>
                  </div>
                </Col>
              </Row>
              {statsData.avg_work_hours && (
                <Row className="mt-3">
                  <Col xs={12}>
                    <div className="text-center p-3 bg-secondary bg-opacity-10 rounded">
                      <div className="h4 text-secondary">{statsData.avg_work_hours} hrs</div>
                      <small className="text-muted">Average Work Hours</small>
                    </div>
                  </Col>
                </Row>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StaffAttendanceManagement;
