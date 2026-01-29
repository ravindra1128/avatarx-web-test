import { useEffect, useCallback, useRef } from "react";

/**
 * Custom hook to handle resize events with debouncing and proper cleanup
 * Prevents ResizeObserver loop errors by using requestAnimationFrame
 */
export function useResizeHandler(callback, dependencies = []) {
  const rafRef = useRef(null);
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Clear any existing RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Use both debouncing and RAF to prevent ResizeObserver loops
    timeoutRef.current = setTimeout(() => {
      rafRef.current = requestAnimationFrame(() => {
        callback(...args);
      });
    }, 16); // ~60fps debounce
  }, [callback]);

  useEffect(() => {
    const handleResize = (event) => {
      debouncedCallback(event);
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      
      // Cleanup timeouts and RAF
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [debouncedCallback, ...dependencies]);
}
