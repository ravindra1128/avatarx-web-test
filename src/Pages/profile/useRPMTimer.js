import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useUser } from "../../Hooks/useUser";

export function useRPMTimer({ patientData }) {
    
  const [isConnected, setIsConnected] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const isUserActive = patientData?.status === "ACTIVE";
  const [isTimerLoading, setIsTimerLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const user = useUser();

  useEffect(() => {
    if (!isUserActive) {
      setIsTimerLoading(false);
    }
  }, [isUserActive]);

  // useEffect(() => {
  //   if (!patientData || !isUserActive) return;
  //   const socketUrl = import.meta.env.VITE_BACKEND_URL;
  //   socketRef.current = io(socketUrl);

  //   socketRef.current.on("connect", () => {
  //     setIsConnected(true);
  //     // Join the session room
  //     socketRef.current.emit("join_session", {
  //       providerId: user.id,
  //       patientId: patientData.id,
  //       sessionType: "video",
  //     });
  //   });

  //   socketRef.current.on("disconnect", () => {
  //     setIsConnected(false);
  //   });

  //   socketRef.current.on("session_state", (data) => {
  //     setIsSessionActive(true);
  //     setElapsedSeconds(data.duration || 0);
  //     if (isTimerLoading) setIsTimerLoading(false);
  //   });

  //   socketRef.current.on("session_started", () => {
  //     setIsSessionActive(true);
  //     setElapsedSeconds(0);
  //   });

  //   socketRef.current.on("session_ended", (data) => {
  //     setIsSessionActive(false);
  //     setElapsedSeconds(data.duration);
  //   });

  //   return () => {
  //     if (socketRef.current) {
  //       socketRef.current.disconnect();
  //     }
  //   };
  // }, [patientData, user.id, isTimerLoading, isUserActive]);

const continueTimer = () => {
  if (isSessionActive || isPaused || !isUserActive) {
    return;
  }
  setIsTimerLoading(true); // Resume timer
  // Request fresh session state from backend
  socketRef.current?.emit("request_session_state", {
    providerId: user.id,
    patientId: patientData?.id,
    sessionType: "video",
  });
};

// Pause session if user switches tabs or windows
useEffect(() => {
  if (!isUserActive) return;
  const handleVisibilityChange = () => {
    if (document.hidden) {
      setIsSessionActive(false); // Pause timer
      // Do NOT request fresh session state here!
    } else {
      setIsTimerLoading(true);
      setIsSessionActive(true); // Resume timer
      // Request fresh session state from backend
      socketRef.current?.emit("request_session_state", {
        providerId: user.id,
        patientId: patientData?.id,
        sessionType: "video",
      });
    }
  };
  const handleWindowBlur = () => {
    setIsSessionActive(false); // Pause timer
  };
  const handleWindowFocus = () => {
    continueTimer();
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("blur", handleWindowBlur);
  window.addEventListener("focus", handleWindowFocus);
  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("blur", handleWindowBlur);
    window.removeEventListener("focus", handleWindowFocus);
  };
}, [isConnected, patientData, user.id, isSessionActive, isUserActive]);

  useEffect(() => {
    if (!isPaused) {
      continueTimer();
    }
  }, [isPaused]);

  // Timer effect
  useEffect(() => {
    if (!patientData || !patientData.health_vitals || !isConnected)
      return;

    if (isSessionActive && !isTimerLoading && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          socketRef.current?.emit("update_session", {
            providerId: user.id,
            patientId: patientData.id,
            sessionType: "video",
            delta: 1,
          });
              return prev + 1;
          });
            }, 1000);
    } else {
        clearInterval(timerRef.current);
    }
    
    return () => {
      clearInterval(timerRef.current);
    };
  }, [ patientData, isConnected, isSessionActive, user.id, isTimerLoading, isPaused ]);

  return {
    isConnected,
    isSessionActive,
    elapsedSeconds,
    setIsSessionActive,
    isTimerLoading,
    setIsTimerLoading,
    isPaused,
    setIsPaused ,
  };
} 