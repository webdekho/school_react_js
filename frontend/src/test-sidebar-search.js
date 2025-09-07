/**
 * Test script to verify sidebar global search functionality
 * 
 * This script can be run in the browser console to test that:
 * 1. Sidebar search component renders correctly
 * 2. Search functionality works identically to navbar search
 * 3. Dropdown positioning is correct
 * 4. All search features are preserved
 */

function testSidebarSearch() {
  console.log('🧪 Testing sidebar global search functionality...');
  
  // Check if sidebar search component is rendered
  const sidebarSearch = document.querySelector('.sidebar input[placeholder*="Search"]');
  if (sidebarSearch) {
    console.log('✅ Sidebar search input found');
  } else {
    console.log('❌ Sidebar search input not found');
    return;
  }
  
  // Check if navbar search exists for comparison
  const navbarSearch = document.querySelector('.navbar input[placeholder*="Search"]');
  if (navbarSearch) {
    console.log('✅ Navbar search input found for comparison');
  } else {
    console.log('ℹ️  Navbar search not visible (expected on smaller screens)');
  }
  
  // Test search functionality
  console.log('📝 Testing search input...');
  sidebarSearch.focus();
  sidebarSearch.value = 'test';
  sidebarSearch.dispatchEvent(new Event('input', { bubbles: true }));
  
  setTimeout(() => {
    const dropdown = document.querySelector('.sidebar .position-absolute.bg-white');
    if (dropdown) {
      console.log('✅ Search dropdown appeared');
      
      // Check if search filters are present
      const filters = dropdown.querySelectorAll('.badge');
      if (filters.length >= 5) {
        console.log('✅ Search type filters found:', filters.length);
      } else {
        console.log('❌ Search type filters missing');
      }
      
      // Check positioning
      const rect = dropdown.getBoundingClientRect();
      console.log('📐 Dropdown position:', {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      });
      
    } else {
      console.log('❌ Search dropdown did not appear');
    }
  }, 100);
}

function testSearchFunctionality() {
  console.log('🧪 Testing search API functionality...');
  
  // Test with a sample search query
  const testQuery = 'admin';
  const testTypes = ['students', 'parents', 'staff'];
  
  const queryParams = new URLSearchParams({
    q: testQuery,
    types: testTypes.join(','),
    limit: 5
  });
  
  fetch(`/School/backend/api/admin/global_search?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ Search API response:', data);
    if (data.status === 'success' && data.data) {
      const totalResults = Object.values(data.data).reduce((sum, results) => {
        return sum + (Array.isArray(results) ? results.length : 0);
      }, 0);
      console.log(`✅ Found ${totalResults} total results`);
    }
  })
  .catch(error => {
    console.log('❌ Search API error:', error);
  });
}

function testResponsiveDisplay() {
  console.log('🧪 Testing responsive display...');
  
  const sidebar = document.querySelector('.sidebar');
  const navbar = document.querySelector('.navbar');
  
  if (sidebar && navbar) {
    const sidebarSearch = sidebar.querySelector('input[placeholder*="Search"]');
    const navbarSearch = navbar.querySelector('input[placeholder*="Search"]');
    
    console.log('📱 Current display state:');
    console.log('- Sidebar search visible:', sidebarSearch ? 'Yes' : 'No');
    console.log('- Navbar search visible:', navbarSearch && !navbarSearch.closest('.d-none') ? 'Yes' : 'No');
    console.log('- Window width:', window.innerWidth);
    
    // Test sidebar collapse state
    const collapseBtn = sidebar.querySelector('button');
    if (collapseBtn) {
      console.log('🔄 Testing sidebar collapse...');
      collapseBtn.click();
      
      setTimeout(() => {
        const sidebarSearchAfterCollapse = sidebar.querySelector('input[placeholder*="Search"]');
        console.log('- Sidebar search after collapse:', sidebarSearchAfterCollapse ? 'Visible' : 'Hidden');
      }, 500);
    }
  }
}

// Export functions for console usage
window.testSidebarSearch = testSidebarSearch;
window.testSearchFunctionality = testSearchFunctionality;
window.testResponsiveDisplay = testResponsiveDisplay;

console.log(`
🧪 Sidebar Search Test Functions Available:
- testSidebarSearch() - Test if sidebar search renders and functions
- testSearchFunctionality() - Test search API functionality  
- testResponsiveDisplay() - Test responsive behavior

Run any function in the console to test the functionality.
`);