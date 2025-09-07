/**
 * Test script to demonstrate token expiration handling
 * 
 * This script can be run in the browser console to test the token expiration flow:
 * 1. Sets an expired token in localStorage
 * 2. Makes an API call that should trigger the 401 response
 * 3. Verifies that the user is redirected to login page
 */

// Test function to simulate token expiration
function testTokenExpiration() {
  console.log('🧪 Testing token expiration flow...');
  
  // Create an expired JWT token (expired 1 hour ago)
  const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
  const payload = btoa(JSON.stringify({
    id: '1',
    username: 'test',
    role: 'admin',
    iat: expiredTime - 3600,
    exp: expiredTime
  }));
  const signature = 'fake_signature';
  const expiredToken = `${header}.${payload}.${signature}`;
  
  // Set the expired token
  localStorage.setItem('auth_token', expiredToken);
  console.log('✅ Set expired token in localStorage');
  
  // Import and use the API service to make a request
  import('./services/api.js').then(({ apiService }) => {
    console.log('📡 Making API request with expired token...');
    
    // Make an API request that requires authentication
    apiService.get('/api/auth/me')
      .then((response) => {
        console.log('❌ Unexpected success:', response);
      })
      .catch((error) => {
        console.log('✅ Expected error caught:', error.message);
        
        // Check if token was cleared
        const tokenAfter = localStorage.getItem('auth_token');
        if (!tokenAfter) {
          console.log('✅ Token was cleared from localStorage');
        } else {
          console.log('❌ Token was not cleared');
        }
        
        // Check if we're on login page (or will be redirected)
        setTimeout(() => {
          if (window.location.pathname === '/login') {
            console.log('✅ Successfully redirected to login page');
          } else {
            console.log('ℹ️  Current path:', window.location.pathname);
          }
        }, 200);
      });
  });
}

// Test function to check token validation
function testTokenValidation() {
  console.log('🧪 Testing token validation...');
  
  import('./services/authService.js').then(({ authService }) => {
    // Test with no token
    localStorage.removeItem('auth_token');
    console.log('No token - isAuthenticated():', authService.isAuthenticated());
    
    // Test with invalid token
    localStorage.setItem('auth_token', 'invalid.token.here');
    console.log('Invalid token - isAuthenticated():', authService.isAuthenticated());
    
    // Test with expired token
    const expiredTime = Math.floor(Date.now() / 1000) - 3600;
    const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
    const payload = btoa(JSON.stringify({ exp: expiredTime }));
    const expiredToken = `${header}.${payload}.signature`;
    localStorage.setItem('auth_token', expiredToken);
    console.log('Expired token - isAuthenticated():', authService.isAuthenticated());
    
    // Test with valid token (expires in 1 hour)
    const validTime = Math.floor(Date.now() / 1000) + 3600;
    const validPayload = btoa(JSON.stringify({ exp: validTime }));
    const validToken = `${header}.${validPayload}.signature`;
    localStorage.setItem('auth_token', validToken);
    console.log('Valid token - isAuthenticated():', authService.isAuthenticated());
  });
}

// Export functions for console usage
window.testTokenExpiration = testTokenExpiration;
window.testTokenValidation = testTokenValidation;

console.log(`
🧪 Token Expiration Test Functions Available:
- testTokenExpiration() - Test full expiration flow with API call
- testTokenValidation() - Test token validation logic

Run either function in the console to test the functionality.
`);