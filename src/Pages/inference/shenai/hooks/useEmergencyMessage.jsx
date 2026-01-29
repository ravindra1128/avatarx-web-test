import { useEffect, useRef, useState } from "react";
import { useResizeHandler } from "./useResizeHandler";

export const EMERGENCY_MSG =
  "Disclaimer: These readings are for informational purposes only. If you are experiencing a medical emergency, please call 911 immediately.";

/**
 * useEmergencyMessage toggles showEmergency to true for 3s every 10s.
 * Returns { showEmergency, EMERGENCY_MSG }
 */

export function useEmergencyMessage(initDone, isLogging) {
  const [canvasWidth, setCanvasWidth] = useState(null);
  const [canvasTop, setCanvasTop] = useState(null);
  const canvasRef = useRef(null);

  const updateMetrics = () => {
    if (canvasRef.current) {
      setCanvasWidth(canvasRef.current.offsetWidth);
      const rect = canvasRef.current.getBoundingClientRect();
      setCanvasTop(rect.top + window.scrollY);
    }
  };

  // Use the custom resize handler to prevent ResizeObserver loops
  useResizeHandler(updateMetrics, [initDone, isLogging]);

  // Initial update
  useEffect(() => {
    updateMetrics();
  }, [initDone, isLogging]);

  return { canvasWidth, canvasTop, canvasRef };
}