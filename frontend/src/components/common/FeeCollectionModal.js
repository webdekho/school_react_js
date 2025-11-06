import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner, Row, Col, InputGroup, Card, Badge, Tabs, Tab } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { useAcademicYear } from '../../contexts/AcademicYearContext';
import { useAuth } from '../../contexts/AuthContext';
import ReceiptModal from './ReceiptModal';

const FeeCollectionModal = ({ show, onHide, preSelectedStudent = null }) => {
  const { selectedAcademicYear } = useAcademicYear();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedStudent, setSelectedStudent] = useState(preSelectedStudent);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedOptionalFees, setSelectedOptionalFees] = useState([]);
  const [collectionData, setCollectionData] = useState({
    amount: '',
    payment_method: 'cash',
    reference_number: '',
    remarks: '',
    semester: 'Semester 1'
  });
  const [errors, setErrors] = useState({});
  const [studentSearch, setStudentSearch] = useState('');
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState('');

  // Modal tab state
  const [modalActiveTab, setModalActiveTab] = useState('pending');
  
  // Direct payment state
  const [isDirectPayment, setIsDirectPayment] = useState(false);
  const [directPaymentData, setDirectPaymentData] = useState({
    category_id: '',
    category_name: '',
    amount: '',
    due_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Receipt modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Set pre-selected student when modal opens
  useEffect(() => {
    if (preSelectedStudent) {
      setSelectedStudent(preSelectedStudent);
      setStudentSearch(`${preSelectedStudent.student_name} (${preSelectedStudent.roll_number})`);
    }
  }, [preSelectedStudent]);

  // Debounce search terms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStudentSearch(studentSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  // Student search for fee collection
  const { data: studentsResponse, isLoading: studentsLoading } = useQuery({
    queryKey: ['students_search', debouncedStudentSearch, selectedAcademicYear?.id],
    queryFn: async () => {
      if (!selectedAcademicYear?.id || !debouncedStudentSearch) return { data: [] };
      
      const params = new URLSearchParams({
        search: debouncedStudentSearch,
        limit: '10',
        offset: '0'
      });
      
      try {
        const response = await apiService.get(`/api/admin/students?${params}`);
        return response.data;
      } catch (error) {
        if (error.response?.status === 403) {
          toast.error('Insufficient permissions to search student data');
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Failed to search students. Please try again.');
        }
        throw error;
      }
    },
    enabled: !!debouncedStudentSearch && debouncedStudentSearch.length >= 2
  });

  // Get student fee assignments when student is selected
  const { data: studentFeesResponse, isLoading: feesLoading } = useQuery({
    queryKey: ['student_fees', selectedStudent?.id, selectedAcademicYear?.id],
    queryFn: async () => {
      if (!selectedStudent?.id || !selectedAcademicYear?.id) return { data: [] };
      
      const response = await apiService.get(`/api/admin/student_fee_assignments/${selectedStudent.id}?academic_year_id=${selectedAcademicYear.id}`);
      return response.data;
    },
    enabled: !!selectedStudent?.id && !!selectedAcademicYear?.id
  });

  // Get available optional fees for the selected student
  const { data: availableOptionalFeesResponse, isLoading: optionalFeesLoading } = useQuery({
    queryKey: ['available_optional_fees', selectedStudent?.id, selectedStudent?.grade_id, selectedAcademicYear?.id, collectionData.semester],
    queryFn: async () => {
      if (!selectedStudent?.id || !selectedStudent?.grade_id || !selectedAcademicYear?.id) {
        return { data: [] };
      }
      
      const semester = collectionData.semester || 'Semester 1';
      const response = await apiService.get(
        `/api/admin/available_optional_fees/${selectedStudent.id}?grade_id=${selectedStudent.grade_id}&academic_year_id=${selectedAcademicYear.id}&semester=${semester}&include_global=true`
      );
      return response.data;
    },
    enabled: !!selectedStudent?.id && !!selectedStudent?.grade_id && !!selectedAcademicYear?.id
  });

  const studentFees = studentFeesResponse?.data || [];
  const availableOptionalFees = availableOptionalFeesResponse?.data || [];

  // Fee categories for Other Payment
  const { data: categoriesResponse } = useQuery({
    queryKey: ['fee_categories_dropdown'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/api/admin/fee_categories/dropdown');
        if (response && response.status === 'success' && response.data && Array.isArray(response.data)) {
          return { data: response.data };
        }
        return { data: [] };
      } catch (error) {
        console.error('Failed to fetch fee categories:', error);
        return { data: [] };
      }
    }
  });

  const categories = categoriesResponse?.data || [];

  // Fee collection mutation
  const collectFeeMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiService.post('/api/admin/fee_collections', {
        ...data,
        collected_by_staff_id: user.id
      });
      return response;
    },
    onSuccess: async (response) => {
      queryClient.invalidateQueries(['fee_collections']);
      queryClient.invalidateQueries(['student_fees']);
      resetCollectionForm();
      onHide();
      
      // Automatically show receipt after successful collection
      if (response.data?.id || response.data?.collection_id) {
        const collectionId = response.data.id || response.data.collection_id;
        try {
          const receiptResponse = await apiService.get(`/api/admin/fee_collections/${collectionId}`);
          let receiptData;
          
          if (receiptResponse.data && receiptResponse.data.data) {
            receiptData = receiptResponse.data.data;
          } else if (receiptResponse.data) {
            receiptData = receiptResponse.data;
          }
          
          if (receiptData && receiptData.receipt_number) {
            setSelectedReceipt(receiptData);
            setShowReceiptModal(true);
            toast.success(response.data?.message || 'Fee collected successfully');
          }
        } catch (receiptError) {
          console.error('Error fetching receipt details:', receiptError);
          toast.success(response.data?.message || 'Fee collected successfully');
        }
      } else {
        toast.success(response.data?.message || 'Fee collected successfully');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to collect fee');
    }
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const resetCollectionForm = () => {
    setCollectionData({
      amount: '',
      payment_method: 'cash',
      reference_number: '',
      remarks: '',
      semester: 'Semester 1'
    });
    setSelectedStudent(null);
    setSelectedAssignment(null);
    setSelectedOptionalFees([]);
    setStudentSearch('');
    setErrors({});
    setModalActiveTab('pending');
    setIsDirectPayment(false);
    setDirectPaymentData({
      category_id: '',
      category_name: '',
      amount: '',
      due_date: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setStudentSearch(`${student.student_name} (${student.roll_number})`);
  };

  const handleAssignmentSelect = (assignment) => {
    setSelectedAssignment(assignment);
    
    const totalAmount = calculateTotalAmountWithFees(assignment, selectedOptionalFees);
    setCollectionData(prev => ({
      ...prev,
      amount: totalAmount.toString()
    }));
  };

  const handleOptionalFeeToggle = (fee) => {
    setSelectedOptionalFees(prev => {
      const isSelected = prev.some(f => f.id === fee.id);
      const newSelectedFees = isSelected 
        ? prev.filter(f => f.id !== fee.id)
        : [...prev, fee];
      
      const newTotal = calculateTotalAmountWithFees(selectedAssignment, newSelectedFees);
      setCollectionData(prev => ({
        ...prev,
        amount: newTotal.toString()
      }));
      
      return newSelectedFees;
    });
  };

  const calculateTotalAmountWithFees = (assignment, optionalFees) => {
    let total = 0;
    
    if (assignment) {
      total += parseFloat(assignment.pending_amount || 0);
    }
    
    optionalFees.forEach(fee => {
      total += parseFloat(fee.amount || 0);
    });
    
    return total;
  };

  const calculateTotalAmount = () => {
    return calculateTotalAmountWithFees(selectedAssignment, selectedOptionalFees);
  };

  const handleCollectionSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (!selectedStudent) {
      newErrors.student = 'Please select a student';
    }
    
    if (isDirectPayment) {
      // Validation for direct payment (Other Payment tab)
      if (!directPaymentData.category_id) {
        newErrors.category = 'Please select a fee category';
      }
      if (!collectionData.remarks || collectionData.remarks.trim() === '') {
        newErrors.remarks = 'Payment description is required for other payments';
      }
      if (!collectionData.amount || parseFloat(collectionData.amount) <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      }
    } else {
      // Validation for assigned fee payment (Pending Payment tab)
      if (!selectedAssignment && selectedOptionalFees.length === 0) {
        newErrors.assignment = 'Please select at least one fee to collect';
      }
      if (selectedAssignment && parseFloat(collectionData.amount) > calculateTotalAmount()) {
        newErrors.amount = 'Amount cannot exceed total selected amount';
      }
    }
    
    if (!collectionData.amount || parseFloat(collectionData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!collectionData.payment_method) {
      newErrors.payment_method = 'Payment method is required';
    }
    if (['card', 'online', 'cheque', 'dd'].includes(collectionData.payment_method) && !collectionData.reference_number) {
      newErrors.reference_number = 'Reference number is required for this payment method';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const paymentData = {
      student_id: selectedStudent.id,
      amount: parseFloat(collectionData.amount),
      payment_mode: collectionData.payment_method,
      reference_number: collectionData.reference_number || null,
      remarks: collectionData.remarks || null,
      semester: collectionData.semester
    };

    if (isDirectPayment) {
      // For other payments (direct payments without specific fee structure)
      paymentData.is_direct_payment = 1;
      paymentData.fee_category_id = directPaymentData.category_id;
      paymentData.direct_fee_description = collectionData.remarks;
      // Remove semester requirement for direct payments
      delete paymentData.semester;
    } else {
      // Handle both mandatory and optional fees (Pending Payment tab)
      if (selectedAssignment) {
        paymentData.student_fee_assignment_id = selectedAssignment.id;
      }
      
      // Add optional fees data
      if (selectedOptionalFees.length > 0) {
        paymentData.optional_fees = selectedOptionalFees.map(fee => ({
          fee_structure_id: fee.id,
          amount: fee.amount
        }));
      }
    }
    
    collectFeeMutation.mutate(paymentData);
  };

  const handleInputChange = (name, value) => {
    setCollectionData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'pending': 'warning',
      'partial': 'info', 
      'paid': 'success',
      'overdue': 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (!selectedAcademicYear) {
    return (
      <Modal show={show} onHide={onHide} centered>
        <Modal.Body>
          <Alert variant="warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Please select an academic year to collect fees.
          </Alert>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" centered>
        <div className="modal-content border-0 shadow-lg">
          <Modal.Header className="bg-gradient-collection text-white border-0 py-3" closeButton>
            <Modal.Title className="d-flex align-items-center">
              <i className="bi bi-currency-rupee me-2"></i>
              <span>Collect Fee</span>
            </Modal.Title>
          </Modal.Header>

          <Form onSubmit={handleCollectionSubmit}>
            <Modal.Body className="p-4">
              <Tabs 
                activeKey={modalActiveTab} 
                onSelect={(key) => {
                  setModalActiveTab(key);
                  setIsDirectPayment(key === 'other');
                  setErrors({});
                }} 
                className="mb-4"
              >
                <Tab eventKey="pending" title="Pending Payment">
              {/* Student Search */}
              <div className="mb-4">
                <label className="form-label fw-medium text-dark">
                  <i className="bi bi-person-search me-2"></i>Search Student *
                </label>
                <Form.Control
                  type="text"
                  placeholder="Enter student name, roll number, or mobile..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  isInvalid={!!errors.student}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.student}
                </Form.Control.Feedback>

                {/* Student Search Results */}
                {studentsLoading && studentSearch && (
                  <div className="mt-2 p-2 border rounded bg-light">
                    <Spinner size="sm" className="me-2" />
                    Searching...
                  </div>
                )}

                {studentsResponse?.data?.length > 0 && (
                  <div className="mt-2 border rounded max-height-200 overflow-auto">
                    {studentsResponse.data.map((student) => (
                      <div 
                        key={student.id}
                        className="p-2 border-bottom cursor-pointer hover-bg-light"
                        onClick={() => handleStudentSelect(student)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex justify-content-between">
                          <div>
                            <div className="fw-medium">{student.student_name}</div>
                            <small className="text-muted">
                              {student.roll_number} - {student.grade_name} {student.division_name}
                            </small>
                          </div>
                          <small className="text-muted">{student.parent_mobile}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Student Info */}
              {selectedStudent && (
                <Card className="mb-4 border-primary">
                  <Card.Header className="bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">
                          <i className="bi bi-person-check-fill me-2 text-success"></i>
                          {selectedStudent.student_name}
                        </h6>
                        <small className="text-muted">
                          {selectedStudent.roll_number} - {selectedStudent.grade_name} {selectedStudent.division_name}
                        </small>
                      </div>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-danger p-0"
                        onClick={() => {
                          setSelectedStudent(null);
                          setSelectedAssignment(null);
                          setStudentSearch('');
                        }}
                      >
                        <i className="bi bi-x-circle"></i>
                      </Button>
                    </div>
                  </Card.Header>

                  <Card.Body>
                    <label className="form-label fw-medium">
                      <i className="bi bi-list-check me-2"></i>Select Fees to Collect *
                    </label>
                    
                    {feesLoading ? (
                      <div className="text-center p-3">
                        <Spinner size="sm" />
                      </div>
                    ) : (
                      <div>
                        {/* Available Fees */}
                        {(studentFeesResponse?.data?.length > 0 || availableOptionalFeesResponse?.data?.length > 0) && (
                          <div className="mb-4">
                            <div className="max-height-300 overflow-auto">
                              {/* Mandatory Fees */}
                              {studentFeesResponse?.data
                                ?.filter(fee => fee.status !== 'paid' && fee.is_mandatory == 1)
                                .map((fee) => (
                                <div 
                                  key={`mandatory-${fee.id}`}
                                  className={`p-3 border rounded mb-2 cursor-pointer ${selectedAssignment?.id === fee.id ? 'border-primary bg-primary bg-opacity-10' : 'border-left-primary border-light hover-bg-light'}`}
                                  onClick={() => handleAssignmentSelect(fee)}
                                  style={{ cursor: 'pointer', borderLeft: '4px solid #0d6efd' }}
                                >
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <div className="d-flex align-items-center">
                                        <span className="badge bg-danger me-2">MANDATORY</span>
                                        <span className="fw-medium">{fee.category_name}</span>
                                      </div>
                                      <small className="text-muted">
                                        <i className="bi bi-calendar me-1"></i>
                                        Due: {new Date(fee.due_date).toLocaleDateString()}
                                      </small>
                                    </div>
                                    <div className="text-end">
                                      <div className="fw-bold text-success">
                                        {formatCurrency(fee.pending_amount)}
                                      </div>
                                      <div className="small text-muted">
                                        Total: {formatCurrency(fee.total_amount)} | 
                                        Paid: {formatCurrency(fee.paid_amount)}
                                      </div>
                                      {getStatusBadge(fee.status)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {/* Optional Fees */}
                              {availableOptionalFeesResponse?.data?.map((fee) => (
                                <div 
                                  key={`optional-${fee.id}`}
                                  className={`p-3 border rounded mb-2 cursor-pointer ${selectedOptionalFees.some(f => f.id === fee.id) ? 'border-success bg-success bg-opacity-10' : 'border-left-success border-light hover-bg-light'}`}
                                  onClick={() => handleOptionalFeeToggle(fee)}
                                  style={{ cursor: 'pointer', borderLeft: '4px solid #198754' }}
                                >
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <div className="d-flex align-items-center">
                                        <span className="badge bg-secondary me-2">OPTIONAL</span>
                                        <span className="fw-medium">{fee.category_name}</span>
                                        {fee.is_global && (
                                          <span className="badge bg-primary ms-2">
                                            <i className="bi bi-globe me-1"></i>GLOBAL
                                          </span>
                                        )}
                                      </div>
                                      <small className="text-muted">
                                        {fee.is_global ? (
                                          <span className="text-primary fw-medium">
                                            <i className="bi bi-globe me-1"></i>
                                            Applies to All Grades
                                          </span>
                                        ) : (
                                          <span>
                                            <i className="bi bi-bookmark me-1"></i>
                                            {fee.grade_name || 'Grade-specific'}
                                          </span>
                                        )}
                                        {fee.description && (
                                          <><br />{fee.description}</>
                                        )}
                                      </small>
                                    </div>
                                    <div className="text-end">
                                      <div className="fw-bold text-success">
                                        {formatCurrency(fee.amount)}
                                      </div>
                                      <div className="small text-muted">
                                        {fee.is_global ? 'Global Fee' : 'Grade-specific Fee'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No Fees Available */}
                        {(!studentFeesResponse?.data?.length || studentFeesResponse.data.filter(fee => fee.status !== 'paid' && fee.is_mandatory == 1).length === 0) && 
                         (!availableOptionalFeesResponse?.data?.length || availableOptionalFeesResponse.data.length === 0) && (
                          <Alert variant="info" className="mb-3">
                            <i className="bi bi-info-circle me-2"></i>
                            No pending fees found for this student.
                          </Alert>
                        )}

                        {/* Total Amount Display */}
                        {(selectedAssignment || selectedOptionalFees.length > 0) && (
                          <div className="mt-3 p-3 bg-light border rounded">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-medium">Total Amount:</span>
                              <span className="fw-bold fs-5 text-success">
                                {formatCurrency(calculateTotalAmount())}
                              </span>
                            </div>
                            {selectedOptionalFees.length > 0 && (
                              <small className="text-muted">
                                Including {selectedOptionalFees.length} optional fee(s)
                              </small>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {errors.assignment && (
                      <div className="invalid-feedback d-block">{errors.assignment}</div>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* Collection Details */}
              {(selectedAssignment || selectedOptionalFees.length > 0) && (
                <Row>
                  <Col md={6}>
                    <div className="form-floating mb-3">
                      <Form.Select
                        value={collectionData.payment_method}
                        onChange={(e) => handleInputChange('payment_method', e.target.value)}
                        isInvalid={!!errors.payment_method}
                        id="paymentMethod"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="online">Online Transfer</option>
                        <option value="cheque">Cheque</option>
                        <option value="dd">Demand Draft</option>
                      </Form.Select>
                      <label htmlFor="paymentMethod">
                        <i className="bi bi-credit-card me-2"></i>Payment Method *
                      </label>
                      <Form.Control.Feedback type="invalid">
                        {errors.payment_method}
                      </Form.Control.Feedback>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="form-floating mb-3">
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        value={collectionData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        placeholder="Amount"
                        isInvalid={!!errors.amount}
                        id="amount"
                      />
                      <label htmlFor="amount">
                        <i className="bi bi-currency-rupee me-2"></i>Amount *
                      </label>
                      <Form.Control.Feedback type="invalid">
                        {errors.amount}
                      </Form.Control.Feedback>
                    </div>
                  </Col>

                  {['card', 'online', 'cheque', 'dd'].includes(collectionData.payment_method) && (
                    <Col md={6}>
                      <div className="form-floating mb-3">
                        <Form.Control
                          type="text"
                          value={collectionData.reference_number}
                          onChange={(e) => handleInputChange('reference_number', e.target.value)}
                          placeholder="Reference Number"
                          isInvalid={!!errors.reference_number}
                          id="referenceNumber"
                        />
                        <label htmlFor="referenceNumber">
                          <i className="bi bi-hash me-2"></i>Reference Number *
                        </label>
                        <Form.Control.Feedback type="invalid">
                          {errors.reference_number}
                        </Form.Control.Feedback>
                      </div>
                    </Col>
                  )}

                  <Col md={collectionData.payment_method === 'cash' ? 12 : 6}>
                    <div className="form-floating mb-3">
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={collectionData.remarks}
                        onChange={(e) => handleInputChange('remarks', e.target.value)}
                        placeholder="Remarks"
                        style={{ minHeight: '80px' }}
                        id="remarks"
                      />
                      <label htmlFor="remarks">
                        <i className="bi bi-chat-text me-2"></i>Remarks (Optional)
                      </label>
                    </div>
                  </Col>
                </Row>
              )}
              </Tab>

              <Tab eventKey="other" title="Other Payment">
                {/* Student Search for Other Payment */}
                <div className="mb-4">
                  <label className="form-label fw-medium text-dark">
                    <i className="bi bi-person-search me-2"></i>Search Student *
                  </label>
                  <Form.Control
                    type="text"
                    placeholder="Enter student name, roll number, or mobile..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    isInvalid={!!errors.student}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.student}
                  </Form.Control.Feedback>

                  {/* Student Search Results */}
                  {studentsLoading && studentSearch && (
                    <div className="mt-2 p-2 border rounded bg-light">
                      <Spinner size="sm" className="me-2" />
                      Searching...
                    </div>
                  )}

                  {studentsResponse?.data?.length > 0 && (
                    <div className="mt-2 border rounded max-height-200 overflow-auto">
                      {studentsResponse.data.map((student) => (
                        <div 
                          key={student.id}
                          className="p-2 border-bottom cursor-pointer hover-bg-light"
                          onClick={() => handleStudentSelect(student)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex justify-content-between">
                            <div>
                              <div className="fw-medium">{student.student_name}</div>
                              <small className="text-muted">
                                {student.roll_number} - {student.grade_name} {student.division_name}
                              </small>
                            </div>
                            <small className="text-muted">{student.parent_mobile}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Student Info for Other Payment */}
                {selectedStudent && (
                  <Card className="mb-4 border-primary">
                    <Card.Header className="bg-light">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-0">
                            <i className="bi bi-person-check-fill me-2 text-success"></i>
                            {selectedStudent.student_name}
                          </h6>
                          <small className="text-muted">
                            {selectedStudent.roll_number} - {selectedStudent.grade_name} {selectedStudent.division_name}
                          </small>
                        </div>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="text-danger p-0"
                          onClick={() => {
                            setSelectedStudent(null);
                            setStudentSearch('');
                          }}
                        >
                          <i className="bi bi-x-circle"></i>
                        </Button>
                      </div>
                    </Card.Header>

                    <Card.Body>
                      {/* Direct Payment Details */}
                      <Row>
                        <Col md={6}>
                          <div className="form-floating mb-3">
                            <Form.Select
                              id="otherPaymentCategory"
                              value={directPaymentData.category_id}
                              onChange={(e) => {
                                setDirectPaymentData({ ...directPaymentData, category_id: e.target.value });
                                setErrors({ ...errors, category: '' });
                              }}
                              isInvalid={!!errors.category}
                            >
                              <option value="">Select Fee Category</option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Label htmlFor="otherPaymentCategory">
                              <i className="bi bi-folder me-2"></i>Fee Category *
                            </Form.Label>
                            <Form.Control.Feedback type="invalid">
                              {errors.category}
                            </Form.Control.Feedback>
                          </div>
                        </Col>

                        <Col md={6}>
                          <div className="form-floating mb-3">
                            <Form.Control
                              id="otherPaymentDescription"
                              type="text"
                              placeholder="Payment Description"
                              value={collectionData.remarks}
                              onChange={(e) => setCollectionData({ ...collectionData, remarks: e.target.value })}
                              isInvalid={!!errors.remarks}
                            />
                            <Form.Label htmlFor="otherPaymentDescription">
                              <i className="bi bi-tag me-2"></i>Payment Description *
                            </Form.Label>
                            <Form.Control.Feedback type="invalid">
                              {errors.remarks}
                            </Form.Control.Feedback>
                          </div>
                        </Col>

                        <Col md={6}>
                          <div className="form-floating mb-3">
                            <Form.Control
                              id="otherPaymentAmount"
                              type="number"
                              placeholder="Amount"
                              value={collectionData.amount}
                              onChange={(e) => setCollectionData({ ...collectionData, amount: e.target.value })}
                              isInvalid={!!errors.amount}
                            />
                            <Form.Label htmlFor="otherPaymentAmount">
                              <i className="bi bi-currency-rupee me-2"></i>Amount *
                            </Form.Label>
                            <Form.Control.Feedback type="invalid">
                              {errors.amount}
                            </Form.Control.Feedback>
                          </div>
                        </Col>

                        <Col md={6}>
                          <div className="form-floating mb-3">
                            <Form.Select
                              id="otherPaymentMode"
                              value={collectionData.payment_method}
                              onChange={(e) => setCollectionData({ ...collectionData, payment_method: e.target.value })}
                            >
                              <option value="cash">Cash</option>
                              <option value="upi">UPI</option>
                              <option value="bank_transfer">Bank Transfer</option>
                              <option value="cheque">Cheque</option>
                              <option value="card">Card</option>
                            </Form.Select>
                            <Form.Label htmlFor="otherPaymentMode">
                              <i className="bi bi-credit-card me-2"></i>Payment Mode *
                            </Form.Label>
                          </div>
                        </Col>

                        <Col md={12}>
                          <div className="form-floating mb-3">
                            <Form.Control
                              id="otherPaymentReference"
                              type="text"
                              placeholder="Reference Number"
                              value={collectionData.reference_number}
                              onChange={(e) => setCollectionData({ ...collectionData, reference_number: e.target.value })}
                            />
                            <Form.Label htmlFor="otherPaymentReference">
                              <i className="bi bi-hash me-2"></i>Reference Number
                            </Form.Label>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}
              </Tab>
            </Tabs>

            </Modal.Body>

            <Modal.Footer className="bg-light border-0 p-4">
              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  onHide();
                  resetCollectionForm();
                }}
              >
                <i className="bi bi-x-circle me-2"></i>Cancel
              </Button>
              <Button 
                type="submit" 
                variant="success"
                disabled={
                  collectFeeMutation.isLoading || 
                  !selectedStudent ||
                  (isDirectPayment 
                    ? (!directPaymentData.category_id || !collectionData.remarks || !collectionData.amount)
                    : (!selectedAssignment && selectedOptionalFees.length === 0)
                  )
                }
              >
                {collectFeeMutation.isLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-currency-rupee me-2"></i>
                    Collect Fee
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </div>

        <style jsx>{`
          .bg-gradient-collection {
            background: linear-gradient(135deg, #20c997 0%, #0d6efd 100%) !important;
          }
          .modal-icon-wrapper {
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
          }
          .max-height-200 {
            max-height: 200px;
          }
          .max-height-300 {
            max-height: 300px;
          }
          .border-left-primary {
            border-left: 4px solid #0d6efd !important;
          }
          .border-left-success {
            border-left: 4px solid #198754 !important;
          }
          .hover-bg-light:hover {
            background-color: #f8f9fa;
          }
          .cursor-pointer {
            cursor: pointer;
          }
        `}</style>
      </Modal>

      {/* Receipt Modal */}
      <ReceiptModal
        show={showReceiptModal}
        onHide={() => setShowReceiptModal(false)}
        receiptData={selectedReceipt}
      />
    </>
  );
};

export default FeeCollectionModal;