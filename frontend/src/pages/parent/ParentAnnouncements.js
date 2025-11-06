import React, { useState } from 'react';
import { Card, Badge, Row, Col, Form, InputGroup, Button, Spinner, Table, Modal } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api';

const ParentAnnouncements = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Fetch announcements for parent
  const { data, isLoading, isError } = useQuery({
    queryKey: ['parent_announcements', searchTerm, currentPage, itemsPerPage],
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        limit: String(itemsPerPage),
        offset: String(offset)
      });
      if (searchTerm) params.append('search', searchTerm);
      const response = await apiService.get(`/api/parent/announcements?${params.toString()}`);
      // Expecting { data: [], total: number, limit, offset }
      return response.data;
    }
  });

  const announcements = data?.data || [];
  const total = data?.total || 0;

  const openModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAnnouncement(null);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">School Announcements</h4>
          <p className="text-muted mb-0">Stay updated with school notices and announcements</p>
        </div>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body>
          <Row className="g-2">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </InputGroup>
            </Col>
            <Col md="auto">
              <Form.Select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[10, 20, 50].map(n => (
                  <option key={n} value={n}>{n} per page</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : isError ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-exclamation-triangle display-6" />
              <div className="mt-2">Failed to load announcements</div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-bell-slash display-6" />
              <div className="mt-2">No announcements found</div>
            </div>
          ) : (
            <>
              <Table responsive hover>
                <thead className="table-light">
                  <tr>
                    <th>Title</th>
                    <th>Message</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((a) => (
                    <tr key={a.id}>
                      <td className="fw-medium">
                        {a.title}
                        {!a.is_read && (
                          <Badge bg="primary" className="ms-2">New</Badge>
                        )}
                      </td>
                      <td style={{maxWidth: 420}}>
                        <div className="text-muted" style={{
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>{a.message}</div>
                      </td>
                      <td>
                        <small>{new Date(a.created_at).toLocaleString()}</small>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => openModal(a)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Simple Pagination */}
              {total > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted small">Showing {announcements.length} of {total}</div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >Prev</Button>
                    <div className="small align-self-center">Page {currentPage}</div>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setCurrentPage(p => (announcements.length < itemsPerPage ? p : p + 1))}
                      disabled={announcements.length < itemsPerPage}
                    >Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* View Message Modal */}
      <Modal show={showModal} onHide={closeModal} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <i className="bi bi-megaphone" />
            {selectedAnnouncement?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-2">
            <small className="text-muted">
              {selectedAnnouncement ? new Date(selectedAnnouncement.created_at).toLocaleString() : ''}
            </small>
          </div>
          <div className="p-3 bg-light rounded" style={{whiteSpace: 'pre-wrap'}}>
            {selectedAnnouncement?.message}
          </div>
          {selectedAnnouncement?.attachment_filename && (
            <div className="mt-3">
              <i className="bi bi-paperclip me-2"></i>
              <a href={`${selectedAnnouncement.attachment_filepath}`} target="_blank" rel="noreferrer">
                {selectedAnnouncement.attachment_filename}
              </a>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ParentAnnouncements;

