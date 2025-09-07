import React from 'react';
import { Pagination as BootstrapPagination, Form, Row, Col } from 'react-bootstrap';

const Pagination = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showSizeSelector = true,
  sizeOptions = [10, 25, 50, 100]
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    // Previous button
    items.push(
      <BootstrapPagination.Prev
        key="prev"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      />
    );

    // First page
    if (currentPage > 3) {
      items.push(
        <BootstrapPagination.Item
          key={1}
          onClick={() => onPageChange(1)}
        >
          1
        </BootstrapPagination.Item>
      );
      
      if (currentPage > 4) {
        items.push(<BootstrapPagination.Ellipsis key="ellipsis1" />);
      }
    }

    // Visible page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <BootstrapPagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => onPageChange(i)}
        >
          {i}
        </BootstrapPagination.Item>
      );
    }

    // Last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        items.push(<BootstrapPagination.Ellipsis key="ellipsis2" />);
      }
      
      items.push(
        <BootstrapPagination.Item
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </BootstrapPagination.Item>
      );
    }

    // Next button
    items.push(
      <BootstrapPagination.Next
        key="next"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      />
    );

    return items;
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <Row className="align-items-center gy-3">
      <Col xs={12} md={6} className="text-center text-md-start">
        <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center justify-content-md-start">
          <span className="text-muted me-0 me-sm-3 mb-2 mb-sm-0 small">
            Showing {startItem} to {endItem} of {totalItems} entries
          </span>
          {showSizeSelector && (
            <div className="d-flex align-items-center">
              <span className="text-muted me-2 small d-none d-sm-inline">Show:</span>
              <Form.Select
                size="sm"
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
                style={{ width: 'auto' }}
                className="form-select-sm"
              >
                {sizeOptions.map(size => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Form.Select>
            </div>
          )}
        </div>
      </Col>
      <Col xs={12} md={6}>
        <div className="d-flex justify-content-center justify-content-md-end">
          {totalPages > 1 && (
            <BootstrapPagination className="mb-0 pagination-sm">
              {generatePaginationItems()}
            </BootstrapPagination>
          )}
        </div>
      </Col>
    </Row>
  );
};

export default Pagination;