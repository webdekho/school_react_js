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
        .receipt-content {
          font-size: 14px;
          line-height: 1.4;
        }
        .card {
          margin-bottom: 1rem !important;
        }
        .card-header {
          padding: 0.75rem 1rem !important;
        }
        .card-body {
          padding: 1rem !important;
        }
        .table {
          font-size: 14px;
        }
        .table th, .table td {
          padding: 0.5rem !important;
          vertical-align: middle !important;
        }
        h3 {
          font-size: 1.5rem !important;
        }
        h4 {
          font-size: 1.25rem !important;
        }
        h6 {
          font-size: 1rem !important;
        }
        .badge {
          font-size: 0.75rem !important;
          padding: 0.375rem 0.75rem !important;
        }
        .small {
          font-size: 0.875rem !important;
        }
        .fs-5 {
          font-size: 1.25rem !important;
        }
        .display-4 {
          font-size: 2.5rem !important;
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

  const handlePrintInNewWindow = useCallback(() => {
    if (receiptRef.current) {
      const receiptContent = receiptRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt ${receiptData.receipt_number}</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
          <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none !important; }
            }
            .receipt-content { background: white; }
          </style>
        </head>
        <body>
          <div class="receipt-content">${receiptContent}</div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  }, [receiptData]);

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

  // Only log and show warnings when modal is actually being shown
  if (!receiptData) {
    if (show) {
      console.log('ReceiptModal: No receipt data provided');
    }
    return null;
  }
  
  if (show) {
    console.log('ReceiptModal: Received receipt data:', receiptData);
  }

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
          <div className="border-bottom pb-4 mb-4" style={{ backgroundColor: '#f8f9fa', padding: '1.5rem' }}>
            <div className="d-flex align-items-center">
              <img 
                src="/logo.png" 
                alt="School Logo" 
                style={{ 
                  height: '80px', 
                  width: 'auto',
                  marginRight: '20px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <i className="bi bi-mortarboard display-4 text-primary" style={{ display: 'none', marginRight: '20px' }}></i>
              <div>
                <h3 className="mb-1 text-primary">The Trivandrum Scottish School</h3>
                <p className="text-muted mb-2">Excellence in Education</p>
                <small className="text-muted">
                  Thundathil, Kariyavattom, Trivandrum, Kerala – 695581, India
                </small>
              </div>
            </div>
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
            <div className="mb-4">
              <h6 className="mb-3 text-primary">
                <i className="bi bi-person-fill me-2"></i>
                Student Information
              </h6>
              <div className="table-responsive">
                <table className="table table-sm table-bordered mb-0">
                  <tbody>
                    <tr>
                      <td className="fw-bold" style={{ width: '20%' }}>Name:</td>
                      <td style={{ width: '30%' }}>{receiptData.student_name}</td>
                      <td className="fw-bold" style={{ width: '20%' }}>Roll Number:</td>
                      <td style={{ width: '30%' }}>{receiptData.roll_number}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Class:</td>
                      <td>{receiptData.grade_name} {receiptData.division_name}</td>
                      <td className="fw-bold">Parent Mobile:</td>
                      <td>{receiptData.parent_mobile}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fee Breakdown */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <table className="table table-sm mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '85%' }}>Description</th>
                        <th style={{ width: '15%' }} className="text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptData.fee_breakdown && receiptData.fee_breakdown.length > 0 ? (
                        <>
                          {receiptData.fee_breakdown.length === 1 ? (
                            // Single fee item - show the actual collected amount
                            <tr key={receiptData.fee_breakdown[0].id || 0}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <i className={`bi ${receiptData.fee_breakdown[0].is_mandatory ? 'bi-check-circle-fill text-success' : 'bi-check-square text-info'} me-2`}></i>
                                  <div>
                                    <strong>{receiptData.fee_breakdown[0].name}</strong>
                                    {receiptData.fee_breakdown[0].description && (
                                      <div className="text-muted small">{receiptData.fee_breakdown[0].description}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="text-end fw-bold">
                                {formatCurrency(receiptData.amount)}
                              </td>
                            </tr>
                          ) : (
                            // Multiple fee items - show individual amounts (for multiple fee collections)
                            receiptData.fee_breakdown.map((fee, index) => (
                              <tr key={fee.id || index}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <i className={`bi ${fee.is_mandatory ? 'bi-check-circle-fill text-success' : 'bi-check-square text-info'} me-2`}></i>
                                    <div>
                                      <strong>{fee.name}</strong>
                                      {fee.description && (
                                        <div className="text-muted small">{fee.description}</div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="text-end fw-bold">
                                  {formatCurrency(fee.collected_amount || fee.amount)}
                                </td>
                              </tr>
                            ))
                          )}
                        </>
                      ) : (
                        <tr>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-check-circle-fill text-success me-2"></i>
                              <div>
                                <strong>{receiptData.category_name || 'Fee Payment'}</strong>
                                {receiptData.remarks && (
                                  <div className="text-muted small">{receiptData.remarks}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-end fw-bold">
                            {formatCurrency(receiptData.amount)}
                          </td>
                        </tr>
                      )}
                      <tr className="table-success">
                        <td className="fw-bold fs-5">Total Amount</td>
                        <td className="text-end fw-bold fs-5">
                          {formatCurrency(receiptData.amount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>

            {/* Payment Information */}
            <div className="mb-4">
              <h6 className="mb-3 text-success">
                <i className="bi bi-credit-card me-2"></i>
                Payment Information
              </h6>
              <div className="table-responsive">
                <table className="table table-sm table-bordered mb-0">
                  <tbody>
                    <tr>
                      <td className="fw-bold" style={{ width: '25%' }}>Payment Method:</td>
                      <td style={{ width: '25%' }}>
                        <i className={`bi ${getPaymentMethodIcon(receiptData.payment_method)} me-1`}></i>
                        {receiptData.payment_method.toUpperCase()}
                      </td>
                      <td className="fw-bold" style={{ width: '25%' }}>Payment Date & Time:</td>
                      <td style={{ width: '25%' }}>{formatDate(receiptData.collection_date)} at {formatTime(receiptData.created_at)}</td>
                    </tr>
                    {(receiptData.payment_reference || receiptData.transaction_id || receiptData.reference_number) && (
                      <tr>
                        <td className="fw-bold">Reference:</td>
                        <td colSpan="3">
                          {receiptData.payment_reference && (
                            <span className="me-3">
                              <strong>Payment Ref:</strong> {receiptData.payment_reference}
                            </span>
                          )}
                          {receiptData.transaction_id && (
                            <span className="me-3">
                              <strong>Txn ID:</strong> {receiptData.transaction_id}
                            </span>
                          )}
                          {receiptData.reference_number && (
                            <span>
                              <strong>Ref No:</strong> {receiptData.reference_number}
                            </span>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Collection Information */}
            <div className="mb-4">
              <h6 className="mb-3 text-info">
                <i className="bi bi-person-badge me-2"></i>
                Collection Information
              </h6>
              <div className="table-responsive">
                <table className="table table-sm table-bordered mb-0">
                  <tbody>
                    <tr>
                      <td className="fw-bold" style={{ width: '20%' }}>Collected By:</td>
                      <td style={{ width: '30%' }}>{receiptData.collected_by_name || 'Unknown'}</td>
                      <td className="fw-bold" style={{ width: '20%' }}>Collection Date:</td>
                      <td style={{ width: '30%' }}>{formatDate(receiptData.collection_date)}</td>
                    </tr>
                    {receiptData.is_verified && receiptData.verified_by_admin_name && (
                      <tr>
                        <td className="fw-bold">Verified By:</td>
                        <td colSpan="3">{receiptData.verified_by_admin_name}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 border-top">
              <p className="text-muted mb-0 small">
                <strong>Important:</strong> This is a computer-generated receipt and does not require a signature.
              </p>
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
          variant="outline-primary" 
          onClick={handlePrintInNewWindow}
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