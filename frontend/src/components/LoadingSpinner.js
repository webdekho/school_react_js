import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ size = '', text = 'Loading...', center = true }) => {
  const content = (
    <div className="d-flex flex-column align-items-center">
      <Spinner animation="border" variant="primary" size={size} />
      {text && <small className="text-muted mt-2">{text}</small>}
    </div>
  );

  if (center) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;