import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Modal, Button, Card, Row, Col } from 'react-bootstrap';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';

const ReceiptModal = ({ show, onHide, receiptData }) => {
  const receiptRef = useRef();
  const [isContentReady, setIsContentReady] = useState(false);

  // Check if content is ready after modal opens
  useEffect(() => {
    if (show && receiptData) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        if (receiptRef.current && receiptRef.current.innerHTML) {
          setIsContentReady(true);
          console.log('Receipt content is ready for printing');
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsContentReady(false);
    }
  }, [show, receiptData]);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt_${receiptData?.receipt_number || 'Unknown'}`,
    onBeforeGetContent: useCallback(() => {
      console.log('Preparing receipt for printing...', receiptData?.receipt_number);
      return Promise.resolve();
    }, [receiptData]),
    onAfterPrint: useCallback(() => {
      console.log('Receipt printed successfully');
      toast.success('Receipt sent to printer successfully');
    }, []),
    onPrintError: useCallback((errorLocation, error) => {
      console.error('Print error at:', errorLocation, 'Error:', error);
      toast.error('Print failed. Please check your printer settings and try again.');
    }, []),
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .no-print {
          display: none !important;
        }
        .modal-content, .modal-backdrop {
          display: none !important;
        }
      }
    `
  });

  const handlePrintClick = useCallback(() => {
    console.log('Print button clicked');
    console.log('Receipt data:', receiptData);
    console.log('Receipt ref:', receiptRef);
    console.log('Receipt ref current:', receiptRef.current);
    console.log('Receipt ref current innerHTML length:', receiptRef.current?.innerHTML?.length);
    
    if (!receiptData) {
      toast.error('No receipt data available to print');
      return;
    }
    
    if (!receiptRef.current) {
      console.error('Receipt ref is null');
      toast.error('Receipt content not ready. Please wait and try again.');
      return;
    }

    if (!receiptRef.current.innerHTML || receiptRef.current.innerHTML.trim() === '') {
      console.error('Receipt content is empty');
      toast.error('Receipt content is empty. Please try again.');
      return;
    }

    console.log('Starting print process for receipt:', receiptData.receipt_number);
    console.log('Print function about to be called:', typeof handlePrint);
    
    try {
      const result = handlePrint();
      console.log('Print function result:', result);
    } catch (error) {
      console.error('Print function failed:', error);
      toast.error('Print failed: ' + error.message);
    }
  }, [handlePrint, receiptData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (datetime) => {
    return new Date(datetime).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!receiptData) {
    console.log('ReceiptModal: No receipt data provided');
    return null;
  }
  
  console.log('ReceiptModal: Received receipt data:', receiptData);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header className="no-print" closeButton>
        <Modal.Title>
          <i className="bi bi-receipt me-2"></i>
          Fee Receipt - {receiptData.receipt_number}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        <div ref={receiptRef} className="receipt-content">
          {/* School Header */}
          <div className="text-center border-bottom pb-4 mb-4" style={{ backgroundColor: '#f8f9fa', padding: '2rem' }}>
            <div className="mb-3">
              <i className="bi bi-mortarboard display-4 text-primary"></i>
            </div>
            <h3 className="mb-1 text-primary">School Management System</h3>
            <p className="text-muted mb-2">Excellence in Education</p>
            <small className="text-muted">
              123 Education Street, Knowledge City, State - 123456<br />
              Phone: +91 98765 43210 | Email: info@school.edu
            </small>
          </div>

          <div className="px-4 pb-4">
            {/* Receipt Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4 className="mb-1 text-success">
                  <i className="bi bi-receipt me-2"></i>
                  FEE RECEIPT
                </h4>
                <p className="text-muted mb-0">Original Copy</p>
              </div>
              <div className="text-end">
                <div className="fw-bold fs-5 text-primary">#{receiptData.receipt_number}</div>
                <small className="text-muted">
                  {formatDate(receiptData.collection_date)} at {formatTime(receiptData.created_at)}
                </small>
              </div>
            </div>

            {/* Student Information */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-light">
                <h6 className="mb-0">
                  <i className="bi bi-person-fill me-2"></i>
                  Student Information
                </h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Name:</strong> {receiptData.student_name}
                    </div>
                    <div className="mb-3">
                      <strong>Roll Number:</strong> {receiptData.roll_number}
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Class:</strong> {receiptData.grade_name} {receiptData.division_name}
                    </div>
                    <div className="mb-3">
                      <strong>Parent Mobile:</strong> {receiptData.parent_mobile}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Payment Details */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-success text-white">
                <h6 className="mb-0 text-white">
                  <i className="bi bi-currency-rupee me-2"></i>
                  Payment Details
                </h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={8}>
                    <div className="mb-3">
                      <strong>Fee Category:</strong> {receiptData.category_name}
                    </div>
                    <div className="mb-3">
                      <strong>Payment Method:</strong> 
                      <span className="ms-2">
                        <i className={`bi ${getPaymentMethodIcon(receiptData.payment_method)} me-1`}></i>
                        {receiptData.payment_method.toUpperCase()}
                      </span>
                    </div>
                    {receiptData.reference_number && (
                      <div className="mb-3">
                        <strong>Reference Number:</strong> {receiptData.reference_number}
                      </div>
                    )}
                    {receiptData.remarks && (
                      <div className="mb-3">
                        <strong>Remarks:</strong> {receiptData.remarks}
                      </div>
                    )}
                  </Col>
                  <Col md={4}>
                    <div className="bg-light p-3 rounded text-end">
                      <div className="mb-2">
                        <strong>Amount Paid</strong>
                      </div>
                      <div className="display-6 text-success fw-bold">
                        {formatCurrency(receiptData.amount)}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Collection Information */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-light">
                <h6 className="mb-0">
                  <i className="bi bi-person-badge me-2"></i>
                  Collection Information
                </h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-2">
                      <strong>Collected By:</strong> {receiptData.collected_by_staff_name}
                    </div>
                    <div className="mb-2">
                      <strong>Collection Date:</strong> {formatDate(receiptData.collection_date)}
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-2">
                      <strong>Status:</strong> 
                      <span className={`badge ms-2 ${receiptData.is_verified ? 'bg-success' : 'bg-warning'}`}>
                        {receiptData.is_verified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </div>
                    {receiptData.is_verified && receiptData.verified_by_admin_name && (
                      <div className="mb-2">
                        <strong>Verified By:</strong> {receiptData.verified_by_admin_name}
                      </div>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Footer */}
            <div className="text-center pt-4 border-top">
              <p className="text-muted mb-2">
                <strong>Important:</strong> This is a computer-generated receipt and does not require a signature.
              </p>
              <p className="text-muted mb-1">
                Keep this receipt safe for your records. For any queries, contact the school office.
              </p>
              <small className="text-muted">
                Generated on {new Date().toLocaleString('en-IN')} | School Management System v1.0
              </small>
            </div>

            {/* QR Code or Barcode placeholder */}
            <div className="text-center mt-4">
              <div style={{ 
                width: '100px', 
                height: '100px', 
                border: '2px dashed #dee2e6', 
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px'
              }}>
                <small className="text-muted">QR Code</small>
              </div>
              <small className="text-muted mt-2 d-block">Scan for verification</small>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="no-print">
        <Button variant="outline-secondary" onClick={onHide}>
          <i className="bi bi-x-circle me-2"></i>
          Close
        </Button>
        <Button 
          variant="primary" 
          onClick={handlePrintClick}
          disabled={!isContentReady}
        >
          <i className="bi bi-printer me-2"></i>
          {isContentReady ? 'Print Receipt' : 'Preparing...'}
        </Button>
      </Modal.Footer>

      <style>{`
        .receipt-content {
          background: white;
          min-height: 80vh;
        }
        
        @media print {
          .receipt-content {
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          
          .modal-content, .modal-backdrop, .modal-dialog {
            display: none !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          body {
            background: white !important;
          }
        }
      `}</style>
    </Modal>
  );

  function getPaymentMethodIcon(method) {
    const icons = {
      'cash': 'bi-cash',
      'card': 'bi-credit-card',
      'online': 'bi-phone',
      'cheque': 'bi-journal-check',
      'dd': 'bi-bank'
    };
    return icons[method] || 'bi-currency-exchange';
  }
};

export default ReceiptModal;