import { useEffect, useCallback } from 'react';

/**
 * Custom hook to handle modal cleanup issues on Windows
 * @param {boolean} showModal - The modal visibility state
 * @returns {Function} Safe close modal handler
 */
export const useWindowsModalFix = (showModal) => {
  const isWindows = () => {
    return navigator.platform.indexOf('Win') > -1 || 
           navigator.userAgent.indexOf('Windows') > -1;
  };

  // Cleanup effect when modal state changes
  useEffect(() => {
    if (!showModal && isWindows()) {
      // Delayed cleanup to ensure React has finished its updates
      const cleanupTimer = setTimeout(() => {
        try {
          // Only remove elements that are safe to remove
          const orphanedBackdrops = document.querySelectorAll('.modal-backdrop');
          orphanedBackdrops.forEach(backdrop => {
            // Check if this backdrop is orphaned (no corresponding modal)
            const hasModal = document.querySelector('.modal.show');
            if (!hasModal && backdrop.parentNode) {
              backdrop.style.opacity = '0';
              backdrop.style.pointerEvents = 'none';
              // Let CSS transition complete before removing
              setTimeout(() => {
                if (backdrop.parentNode) {
                  backdrop.parentNode.removeChild(backdrop);
                }
              }, 300);
            }
          });

          // Clean body classes if no modals are open
          const activeModals = document.querySelectorAll('.modal.show');
          if (activeModals.length === 0) {
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
          }
        } catch (error) {
          // Silently handle errors - these are non-critical UI cleanups
          console.debug('Modal cleanup handled gracefully');
        }
      }, 250);

      return () => clearTimeout(cleanupTimer);
    }
  }, [showModal]);

  // Return a safe modal closer
  const safeCloseModal = useCallback((closeHandler) => {
    if (isWindows()) {
      // Add a small delay on Windows to prevent race conditions
      requestAnimationFrame(() => {
        closeHandler();
      });
    } else {
      closeHandler();
    }
  }, []);

  return safeCloseModal;
};

export default useWindowsModalFix;