// Helper functions for handling modal cleanup issues on Windows

/**
 * Checks if the current platform is Windows
 * @returns {boolean} True if running on Windows
 */
export const isWindowsPlatform = () => {
  return navigator.platform.indexOf('Win') > -1 || 
         navigator.userAgent.indexOf('Windows') > -1;
};

/**
 * Forces cleanup of Bootstrap modal backdrop
 * Fixes issue where modal backdrop remains after closing on Windows
 */
export const forceModalCleanup = () => {
  try {
    // Remove modal-open class from body
    document.body.classList.remove('modal-open');
    
    // Remove any lingering modal backdrops safely
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
      // Check if backdrop has a parent before trying to remove
      if (backdrop && backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
    });
    
    // Reset body styles that Bootstrap modal might have set
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Also clean up any modal divs that might be stuck
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => {
      if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
      }
    });
  } catch (error) {
    // Silently handle any DOM manipulation errors
    console.warn('Modal cleanup error (non-critical):', error.message);
  }
};

/**
 * Safely closes a modal with Windows-specific fixes
 * @param {Function} closeModalFunction - The original close modal function
 * @param {number} delay - Delay in milliseconds (default: 150)
 */
export const safeCloseModal = (closeModalFunction, delay = 150) => {
  if (isWindowsPlatform()) {
    // On Windows, add a delay and force cleanup
    setTimeout(() => {
      closeModalFunction();
      // Additional cleanup after state update
      setTimeout(forceModalCleanup, 100);
    }, delay);
  } else {
    // On other platforms, close normally
    closeModalFunction();
  }
};

/**
 * Hook to handle modal cleanup on unmount
 * Use this in components with modals to ensure proper cleanup
 */
export const useModalCleanup = () => {
  const cleanup = () => {
    if (isWindowsPlatform()) {
      forceModalCleanup();
    }
  };
  
  // Return cleanup function to be called when needed
  return cleanup;
};