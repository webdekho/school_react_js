import React, { useState } from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api';

const ParentOverview = ({ onNewComplaint }) => {
  // Fetch complaint statistics
  const { data: statsResponse } = useQuery({
    queryKey: ['parent_complaints_stats'],
    queryFn: async () => {
      const response = await apiService.get('/api/parent/complaints_stats');
      return response.data;
    }
  });
  const stats = statsResponse || {};

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Dashboard Overview</h4>
          <p className="text-muted mb-0">Quick overview of your account</p>
        </div>
      </div>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="display-6 text-primary">{stats.total || 0}</div>
              <small className="text-muted">Total Complaints</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="display-6 text-warning">{stats.by_status?.new || 0}</div>
              <small className="text-muted">New Complaints</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="display-6 text-info">{stats.by_status?.in_progress || 0}</div>
              <small className="text-muted">In Progress</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="display-6 text-success">{stats.by_status?.resolved || 0}</div>
              <small className="text-muted">Resolved</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <div className="display-1 text-muted mb-4">
            <i className="bi bi-chat-dots"></i>
          </div>
          <h4 className="mb-3">Submit a Complaint</h4>
          <p className="text-muted mb-4">
            Have a concern or issue? Submit a complaint and we'll address it promptly.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={onNewComplaint}
          >
            <i className="bi bi-plus-circle me-2"></i>
            New Complaint
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ParentOverview;

