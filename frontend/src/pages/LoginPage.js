import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

/**
 * Login page component
 */
const LoginPage = () => {
  const { login, isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const [formData, setFormData] = useState({
    mobile: '9999999999',
    password: 'password',
    user_type: 'admin',
    remember: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Clear any errors when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setError('');
    }
  }, [isAuthenticated, user]);

  const getRedirectPath = (userType) => {
    switch (userType) {
      case 'admin':
      case 'staff':
        return '/admin';
      case 'parent':
        return '/parent';
      default:
        return '/';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const success = await login(formData);
      if (success) {
        // Navigation will be handled by the useEffect above
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Only redirect if we're actually authenticated AND have user data AND not currently loading
  if (!loading && isAuthenticated && user) {
    const from = location.state?.from?.pathname || getRedirectPath(user.user_type);
    return <Navigate to={from} replace />;
  }

  return (
    <div className="login-container">
      <Container fluid>
        <Row className="min-vh-100">
          <Col lg={6} className="d-flex align-items-center justify-content-center">
            <div className="login-form-wrapper">
              <div className="logo-section mb-4 text-center">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="logo-image"
                  style={{ height: '100px', width: 'auto' }}
                />
              </div>

              <div className="login-form">
                <h2 className="login-title">Login</h2>
                <p className="login-subtitle">Login to access your travelwise account</p>

                {error && (
                  <Alert variant="danger" className="mb-4">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">User Type</Form.Label>
                    <div className="user-type-selector">
                      <div 
                        className={`user-type-option ${formData.user_type === 'parent' ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, user_type: 'parent' }))}
                      >
                        <div className="user-type-icon">👨‍👩‍👧‍👦</div>
                        <span>Parent</span>
                      </div>
                      <div 
                        className={`user-type-option ${formData.user_type === 'staff' ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, user_type: 'staff' }))}
                      >
                        <div className="user-type-icon">👨‍🏫</div>
                        <span>Staff</span>
                      </div>
                      <div 
                        className={`user-type-option ${formData.user_type === 'admin' ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, user_type: 'admin' }))}
                      >
                        <div className="user-type-icon">👨‍💼</div>
                        <span>Admin</span>
                      </div>
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">Mobile Number</Form.Label>
                    <Form.Control
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="03001234567"
                      className="form-input"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">Password</Form.Label>
                    <div className="password-input-wrapper">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••••••••••"
                        className="form-input password-input"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </Form.Group>

                  <div className="form-options mb-4">
                    <Form.Check
                      type="checkbox"
                      name="remember"
                      checked={formData.remember}
                      onChange={handleInputChange}
                      label="Remember me"
                      className="remember-checkbox"
                    />
                    <a href="#" className="forgot-password">Forgot Password?</a>
                  </div>

                  <Button
                    type="submit"
                    className="login-btn w-100 mb-4"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing in...' : 'Login'}
                  </Button>
                </Form>

                {/* Demo Credentials Section */}
                <div className="demo-credentials mt-4">
                  <div className="demo-header mb-3">
                    <h6 className="text-muted">
                      <i className="bi bi-info-circle me-2"></i>
                      Demo Credentials
                    </h6>
                  </div>
                  
                  <div className="demo-accounts">
                    <div className="demo-account mb-2 p-2 border rounded" style={{backgroundColor: '#f8f9fa', cursor: 'pointer'}} 
                         onClick={() => setFormData({...formData, mobile: '1111111111', password: 'password', user_type: 'admin'})}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong className="text-primary">👨‍💼 Admin</strong>
                          <div className="small text-muted">Full access to all modules</div>
                        </div>
                        <div className="text-end">
                          <div className="small">Mobile: 1111111111</div>
                          <div className="small">Password: password</div>
                        </div>
                      </div>
                    </div>

                    <div className="demo-account mb-2 p-2 border rounded" style={{backgroundColor: '#f8f9fa', cursor: 'pointer'}}
                         onClick={() => setFormData({...formData, mobile: '2222222222', password: 'password', user_type: 'staff'})}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong className="text-success">👨‍🏫 Staff</strong>
                          <div className="small text-muted">Limited permissions</div>
                        </div>
                        <div className="text-end">
                          <div className="small">Mobile: 2222222222</div>
                          <div className="small">Password: password</div>
                        </div>
                      </div>
                    </div>

                    <div className="demo-account mb-2 p-2 border rounded" style={{backgroundColor: '#f8f9fa', cursor: 'pointer'}}
                         onClick={() => setFormData({...formData, mobile: '3333333333', password: 'password', user_type: 'parent'})}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong className="text-info">👨‍👩‍👧‍👦 Parent</strong>
                          <div className="small text-muted">Parent portal access</div>
                        </div>
                        <div className="text-end">
                          <div className="small">Mobile: 3333333333</div>
                          <div className="small">Password: password</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="demo-note mt-2">
                    <small className="text-muted">
                      <i className="bi bi-lightbulb me-1"></i>
                      Click any account above to auto-fill credentials
                    </small>
                  </div>
                </div>

              </div>
            </div>
          </Col>
          
          <Col lg={6} className="d-none d-lg-flex align-items-center justify-content-center illustration-col">
            <div className="illustration-wrapper">
              <div className="phone-mockup">
                <div className="phone-screen">
                  <div className="security-icons">
                    <div className="check-icon">✓</div>
                    <div className="lock-icon">🔒</div>
                  </div>
                  <div className="password-dots">★★★★</div>
                </div>
              </div>
              <div className="hand-illustration"></div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;