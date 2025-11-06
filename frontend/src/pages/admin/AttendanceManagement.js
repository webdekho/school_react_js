import React, { useState } from 'react';
import { Card, Button, Form, Row, Col, Table, Badge, Modal, Spinner, Tabs, Tab, Alert } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

const AttendanceManagement = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState('mark');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsStudent, setStatsStudent] = useState(null);
  
  // Filter states for history
  const [filterGrade, setFilterGrade] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Fetch grades (use dropdown endpoint for simple array)
  const { data: gradesData } = useQuery({
    queryKey: ['grades_dropdown'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/grades_dropdown');
      return response.data;
    }
  });
  const grades = Array.isArray(gradesData) ? gradesData : [];

  // Fetch divisions
  const { data: divisionsData } = useQuery({
    queryKey: ['divisions_all'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/divisions');
      return response.data;
    }
  });
  const allDivisions = Array.isArray(divisionsData) ? divisionsData : (divisionsData?.data || []);
  const divisions = allDivisions.filter(d => d.grade_id == (selectedGrade || filterGrade));

  // Fetch class attendance for marking
  const { data: classAttendance, isLoading: loadingClass, refetch: refetchClassAttendance } = useQuery({
    queryKey: ['class_attendance', selectedGrade, selectedDivision, selectedDate],
    queryFn: async () => {
      const response = await apiService.get(`/api/admin/class_attendance/${selectedGrade}/${selectedDivision}/${selectedDate}`);
      return response.data;
    },
    enabled: !!(selectedGrade && selectedDivision && selectedDate)
  });

  // Fetch attendance history
  const { data: attendanceHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['attendance_history', filterGrade, filterDivision, filterStatus, filterStartDate, filterEndDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: '100',
        offset: '0'
      });
      
      if (filterGrade) params.append('grade_id', filterGrade);
      if (filterDivision) params.append('division_id', filterDivision);
      if (filterStatus) params.append('status', filterStatus);
      if (filterStartDate) params.append('start_date', filterStartDate);
      if (filterEndDate) params.append('end_date', filterEndDate);
      
      const response = await apiService.get(`/api/admin/attendance?${params}`);
      return response.data;
    },
    enabled: activeTab === 'history'
  });

  // Fetch low attendance students
  const { data: lowAttendanceData, isLoading: loadingLowAttendance } = useQuery({
    queryKey: ['low_attendance_students'],
    queryFn: async () => {
      const response = await apiService.get('/api/admin/low_attendance_students?threshold=75');
      return response.data;
    },
    enabled: activeTab === 'reports'
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async (data) => {
      return await apiService.post('/api/admin/mark_attendance', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['class_attendance']);
      queryClient.invalidateQueries(['attendance_history']);
      toast.success('Attendance marked successfully!');
      refetchClassAttendance();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    }
  });

  // Initialize attendance records when class data loads
  React.useEffect(() => {
    if (classAttendance) {
      const records = {};
      classAttendance.forEach(student => {
        records[student.id] = {
          student_id: student.id,
          status: student.status || 'present',
          remarks: student.remarks || ''
        };
      });
      setAttendanceRecords(records);
    }
  }, [classAttendance]);

  // Handle status change
  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  // Handle remarks change
  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  // Mark all as present
  const markAllPresent = () => {
    const records = {};
    classAttendance.forEach(student => {
      records[student.id] = {
        student_id: student.id,
        status: 'present',
        remarks: ''
      };
    });
    setAttendanceRecords(records);
  };

  // Submit attendance
  const handleSubmitAttendance = () => {
    const attendance_records = Object.values(attendanceRecords);
    
    markAttendanceMutation.mutate({
      attendance_date: selectedDate,
      attendance_records
    });
  };

  // View student statistics
  const viewStudentStats = async (studentId) => {
    try {
      const response = await apiService.get(`/api/admin/attendance_stats?student_id=${studentId}`);
      setStatsStudent(response.data);
      setShowStatsModal(true);
    } catch (error) {
      toast.error('Failed to load statistics');
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const variants = {
      'present': 'success',
      'absent': 'danger',
      'late': 'warning',
      'half_day': 'info'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">
            <i className="bi bi-calendar-check me-2"></i>
            Attendance Management
          </h4>
          <p className="text-muted mb-0">Mark and manage student attendance</p>
        </div>
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab eventKey="mark" title={<><i className="bi bi-check-circle me-2"></i>Mark Attendance</>}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Row className="mb-4">
                <Col md={3}>
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
                    <Form.Label className="text-dark fw-medium">Grade</Form.Label>
                    <Form.Select
                      value={selectedGrade}
                      onChange={(e) => {
                        setSelectedGrade(e.target.value);
                        setSelectedDivision('');
                      }}
                    >
                      <option value="">Select Grade</option>
                      {grades.map(grade => (
                        <option key={grade.id} value={grade.id}>{grade.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="text-dark fw-medium">Division</Form.Label>
                    <Form.Select
                      value={selectedDivision}
                      onChange={(e) => setSelectedDivision(e.target.value)}
                      disabled={!selectedGrade}
                    >
                      <option value="">Select Division</option>
                      {divisions.map(division => (
                        <option key={division.id} value={division.id}>{division.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="text-dark fw-medium">&nbsp;</Form.Label>
                    <div className="d-grid">
                      <Button
                        variant="outline-success"
                        onClick={markAllPresent}
                        disabled={!classAttendance || classAttendance.length === 0}
                      >
                        <i className="bi bi-check-all me-2"></i>
                        Mark All Present
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              {loadingClass ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                </div>
              ) : classAttendance && classAttendance.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <Table hover>
                      <thead className="table-light">
                        <tr>
                          <th>Roll No</th>
                          <th>Student Name</th>
                          <th>Status</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classAttendance.map((student) => (
                          <tr key={student.id}>
                            <td>{student.roll_number}</td>
                            <td>{student.student_name}</td>
                            <td>
                              <div className="btn-group" role="group">
                                {['present', 'absent', 'late', 'half_day'].map(status => (
                                  <Button
                                    key={status}
                                    variant={attendanceRecords[student.id]?.status === status ? 'primary' : 'outline-secondary'}
                                    size="sm"
                                    onClick={() => handleStatusChange(student.id, status)}
                                  >
                                    {status.replace('_', ' ')}
                                  </Button>
                                ))}
                              </div>
                            </td>
                            <td>
                              <Form.Control
                                type="text"
                                size="sm"
                                placeholder="Optional remarks"
                                value={attendanceRecords[student.id]?.remarks || ''}
                                onChange={(e) => handleRemarksChange(student.id, e.target.value)}
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
              ) : selectedGrade && selectedDivision ? (
                <Alert variant="info" className="text-center">
                  <i className="bi bi-info-circle me-2"></i>
                  No students found for the selected grade and division.
                </Alert>
              ) : (
                <Alert variant="secondary" className="text-center">
                  <i className="bi bi-calendar-check display-4 text-muted d-block mb-3"></i>
                  Please select a date, grade, and division to mark attendance.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="history" title={<><i className="bi bi-clock-history me-2"></i>History</>}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Row className="mb-4">
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="text-dark fw-medium">Grade</Form.Label>
                    <Form.Select
                      value={filterGrade}
                      onChange={(e) => {
                        setFilterGrade(e.target.value);
                        setFilterDivision('');
                      }}
                    >
                      <option value="">All Grades</option>
                      {grades.map(grade => (
                        <option key={grade.id} value={grade.id}>{grade.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="text-dark fw-medium">Division</Form.Label>
                    <Form.Select
                      value={filterDivision}
                      onChange={(e) => setFilterDivision(e.target.value)}
                      disabled={!filterGrade}
                    >
                      <option value="">All Divisions</option>
                      {divisions.map(division => (
                        <option key={division.id} value={division.id}>{division.name}</option>
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
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="text-dark fw-medium">Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="text-dark fw-medium">End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {loadingHistory ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                </div>
              ) : attendanceHistory && attendanceHistory.data && attendanceHistory.data.length > 0 ? (
                <div className="table-responsive">
                  <Table hover>
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Student</th>
                        <th>Roll No</th>
                        <th>Grade/Division</th>
                        <th>Status</th>
                        <th>Remarks</th>
                        <th>Marked By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.data.map((record) => (
                        <tr key={record.id}>
                          <td>{new Date(record.attendance_date).toLocaleDateString()}</td>
                          <td>{record.student_name}</td>
                          <td>{record.roll_number}</td>
                          <td>{record.grade_name} - {record.division_name}</td>
                          <td>{getStatusBadge(record.status)}</td>
                          <td>{record.remarks || '-'}</td>
                          <td><small>{record.marked_by_name}</small></td>
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
              <h5 className="mb-4">Students with Less than 75% Attendance</h5>

              {loadingLowAttendance ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                </div>
              ) : lowAttendanceData && lowAttendanceData.length > 0 ? (
                <div className="table-responsive">
                  <Table hover>
                    <thead className="table-light">
                      <tr>
                        <th>Roll No</th>
                        <th>Student Name</th>
                        <th>Grade/Division</th>
                        <th>Total Days</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Attendance %</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowAttendanceData.map((student) => (
                        <tr key={student.id}>
                          <td>{student.roll_number}</td>
                          <td>{student.student_name}</td>
                          <td>{student.grade_name} - {student.division_name}</td>
                          <td>{student.attendance_stats.total_days}</td>
                          <td><Badge bg="success">{student.attendance_stats.present_days}</Badge></td>
                          <td><Badge bg="danger">{student.attendance_stats.absent_days}</Badge></td>
                          <td>
                            <Badge bg={student.attendance_stats.attendance_percentage < 50 ? 'danger' : 'warning'}>
                              {student.attendance_stats.attendance_percentage}%
                            </Badge>
                          </td>
                          <td>
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => viewStudentStats(student.id)}
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
                  Great! All students have attendance above 75%.
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
          {statsStudent && (
            <div>
              <Row className="mb-3">
                <Col xs={6}>
                  <div className="text-center p-3 bg-light rounded">
                    <div className="display-6 text-primary">{statsStudent.total_days}</div>
                    <small className="text-muted">Total Days</small>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="text-center p-3 bg-light rounded">
                    <div className="display-6 text-success">{statsStudent.attendance_percentage}%</div>
                    <small className="text-muted">Attendance</small>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col xs={6} className="mb-3">
                  <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                    <div className="h3 text-success">{statsStudent.present_days}</div>
                    <small className="text-muted">Present</small>
                  </div>
                </Col>
                <Col xs={6} className="mb-3">
                  <div className="text-center p-3 bg-danger bg-opacity-10 rounded">
                    <div className="h3 text-danger">{statsStudent.absent_days}</div>
                    <small className="text-muted">Absent</small>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                    <div className="h3 text-warning">{statsStudent.late_days}</div>
                    <small className="text-muted">Late</small>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="text-center p-3 bg-info bg-opacity-10 rounded">
                    <div className="h3 text-info">{statsStudent.half_days}</div>
                    <small className="text-muted">Half Day</small>
                  </div>
                </Col>
              </Row>
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

export default AttendanceManagement;


