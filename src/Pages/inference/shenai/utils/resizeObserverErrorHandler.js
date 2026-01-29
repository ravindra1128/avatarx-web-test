/**
 * Global ResizeObserver error handler to suppress benign ResizeObserver loop errors
 * These errors are often caused by third-party libraries and don't affect functionality
 */
export function setupResizeObserverErrorHandler() {
  // Store the original console.error
  const originalError = console.error;
  
  // Override console.error to filter out ResizeObserver loop errors
  console.error = (...args) => {
    const message = args[0];
    
    // Check if it's a ResizeObserver loop error
    if (
      typeof message === 'string' && 
      message.includes('ResizeObserver loop completed with undelivered notifications')
    ) {
      // Suppress this specific error as it's usually benign
      return;
    }
    
    // Log all other errors normally
    originalError.apply(console, args);
  };

  // Also handle unhandled errors
  window.addEventListener('error', (event) => {
    if (
      event.message && 
      event.message.includes('ResizeObserver loop completed with undelivered notifications')
    ) {
      event.preventDefault();
      return false;
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason && 
      typeof event.reason === 'string' && 
      event.reason.includes('ResizeObserver loop completed with undelivered notifications')
    ) {
      event.preventDefault();
      return false;
    }
  });

  // Return cleanup function
  return () => {
    console.error = originalError;
  };
}
