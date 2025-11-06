import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api';

const ParentChildren = () => {
  // Fetch parent's students
  const { data: studentsResponse } = useQuery({
    queryKey: ['parent_students'],
    queryFn: async () => {
      const response = await apiService.get('/api/parent/students');
      return response.data;
    }
  });
  const students = studentsResponse || [];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">My Child</h4>
          <p className="text-muted mb-0">View information about your children</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {students.length > 0 ? (
            <Row>
              {students.map((student) => (
                <Col md={6} lg={4} key={student.id} className="mb-4">
                  <Card className="h-100 border-primary">
                    <Card.Body className="text-center">
                      <div className="mb-3">
                        <i className="bi bi-person-circle display-4 text-primary"></i>
                      </div>
                      <h6 className="mb-2">{student.student_name}</h6>
                      <p className="text-muted mb-2">
                        <i className="bi bi-hash me-1"></i>
                        Roll: {student.roll_number}
                      </p>
                      <div className="mb-3">
                        <Badge bg="primary" className="me-1">{student.grade_name}</Badge>
                        <Badge bg="secondary">{student.division_name}</Badge>
                      </div>
                      <div className="text-muted small">
                        <div>
                          <i className="bi bi-calendar-event me-1"></i>
                          Admitted: {new Date(student.admission_date).toLocaleDateString()}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-people display-1 text-muted mb-4"></i>
              <h5>No Children Found</h5>
              <p className="text-muted">
                No children are currently associated with your account.
              </p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ParentChildren;

