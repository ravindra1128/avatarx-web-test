"use client";

import { Camera, Heart, RefreshCcw, Sun, SwitchCamera } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../../Component/AuthProvider";
import { Card } from "../../../Component/Cards/card";
import { Button } from "../../../Component/UI/button";
import { createOrUpdateUserHealthVitals } from "../../../api/user.service";
import { logError, logInfo, logWarn } from "../../../utils/logger";
import FacePositionGuide from "./face-position-guide";
import mockVideo from "./faceScan.mov";
import VitalsDisplay from "./vitals-display";
const isMockVideo = true;
// Main component that combines the stable SDK implementation with the UI
export default function FaceScanApp() {
  const { token } = useParams();
  const { authData } = useContext(AuthContext);
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null); // Store stream reference to properly clean up
  const maxProgressRef = useRef(0); // Track maximum progress to prevent regression

  const [shenai, setShenai] = useState(null);
  const [results, setResults] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);
  const [error, setError] = useState(null);
  const [measurementState, setMeasurementState] = useState({ value: 0 });
  const [measurementProgress, setMeasurementProgress] = useState(0);
  const [faceState, setFaceState] = useState({ value: 4 });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [heartRate, setHeartRate] = useState(null);
  const [facingMode, setFacingMode] = useState("user");
  const [showCamera, setShowCamera] = useState(true);
  const [sdkInitialized, setSdkInitialized] = useState(false); // Track SDK initialization state

  // New states for loading progress
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState("");
  const startTimeRef = useRef(null);

  const API_KEY = "62ad70ae10a84a028e615b781dd81a73";
  const USER_ID = token || "1234567890";

  // Updated FaceStateEnum with more descriptive text
  const FaceStateEnum = {
    0: "Face Positioned Correctly",
    1: "Face Too Far",
    2: "Face Too Close",
    3: "Face is not centered",
    4: "Face is not visible",
    5: "Face Position Unknown",
  };

  const MeasurementStateEnum = {
    0: "Not Started",
    1: "Waiting for face",
    2: "Signal is short",
    3: "Signal is good",
    4: "Signal is bad",
    5: "Signal is bad (Device Unstable)",
    6: "Finished",
    7: "Failed",
  };

  // Map measurement state to lighting condition
  const getLightingCondition = () => {
    switch (measurementState?.value) {
      case 0:
        return "Checking...";
      case 1:
        return "Waiting for face";
      case 2:
        return "Lighting too dim";
      case 3:
        return "Good lighting";
      case 4:
        return "Poor lighting";
      case 5:
        return "Unstable lighting";
      case 6:
        return "Scan complete";
      case 7:
        return "Scan failed";
      default:
        return "Checking...";
    }
  };

  // Check if face is detected and centered based on faceState
  const faceDetected =
    faceState?.value === 0 ||
    faceState?.value === 1 ||
    faceState?.value === 2 ||
    faceState?.value === 3;
  const faceCentered = faceState?.value === 0;

  // Function to get face position text
  const getFacePositionText = () => {
    return FaceStateEnum[faceState?.value] || "Face is not visible";
  };

  // Function to set up camera stream
  const setupCamera = async (mode = "user") => {
    try {
      setLoadingProgress(10);

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            logWarn("Error stopping track:", e);
          }
        });
      }

      // Request new stream with specified facing mode
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      // Add specific constraints for iOS Safari
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        constraints.video.frameRate = { ideal: 30 };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLoadingProgress(20);

      // Store stream reference for cleanup
      streamRef.current = stream;

      // Set video source
      if (videoRef.current && !isMockVideo) {
        videoRef.current.srcObject = stream;

        // Ensure video plays on iOS Safari
        videoRef.current.setAttribute("playsinline", true);
        videoRef.current.setAttribute("autoplay", true);
        videoRef.current.setAttribute("muted", true);

        // Force play for browsers that might block autoplay
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            logError("Error playing video:", err);
            setError(
              "Camera access blocked. Please check permissions and try again."
            );
          });
        }
      }

      return stream;
    } catch (err) {
      logError("Camera setup error:", err);
      setError(`Camera access error: ${err.message || "Unknown error"}`);
      return null;
    }
  };

  // Function to update progress with non-decreasing behavior
  const updateMeasurementProgress = (newProgress) => {
    // Allow small regressions (up to 5%) to reflect actual measurement state changes
    // but prevent large jumps backward
    if (
      newProgress >= maxProgressRef.current ||
      (maxProgressRef.current - newProgress < 5 && newProgress > 0)
    ) {
      // Update the max progress if this is a new maximum
      if (newProgress > maxProgressRef.current) {
        maxProgressRef.current = newProgress;
      }
      // Always update the displayed progress
      setMeasurementProgress(newProgress);
    } else if (newProgress === 0 && scanning) {
      // Reset max progress if we're starting a new scan
      maxProgressRef.current = 0;
      setMeasurementProgress(0);
    }
    // For larger regressions, keep the current progress (don't go backwards too much)
  };

  // Setup camera and SDK - using the approach from the stable custom component
  useEffect(() => {
    let sdkInstance;
    let pollingInterval;

    const setupCameraAndSDK = async () => {
      try {
        // 1. Setup camera first
        setLoadingProgress(5);

        setLoadingProgress(25);

        logInfo("Setting up camera and SDK");
        // 2. Dynamically import Shen.AI SDK
        const { default: CreateShenaiSDK } = await import(
          "../../../../shenai-sdk/index.mjs"
        );
        logInfo("Shen.AI SDK imported");

        setLoadingProgress(40);

        logInfo("Creating Shen.AI SDK instance");
        sdkInstance = await CreateShenaiSDK({
          onRuntimeInitialized: () => {
            logInfo("X vitals runtime initialized");
            setLoadingProgress(60);
            setLoadingStage("Runtime initialized...");
          },
        });
        logInfo("Shen.AI SDK instance created");
        setShenai(sdkInstance);
        setLoadingProgress(70);

        // 3. Initialize SDK with no built-in UI
        logInfo("Initializing Shen.AI SDK");
        await sdkInstance.initialize(
          API_KEY,
          USER_ID,
          {
            operatingMode: instance.OperatingMode.MEASURE,
            showUserInterface: false,
            enableSummaryScreen: false,
            enableStartAfterSuccess: true,
            operatingMode: sdkInstance.OperatingMode.IDLE,
            measurementPreset: sdkInstance.MeasurementPreset.CUSTOM,
            customMeasurementConfig: {
              realtimeHrPeriodSeconds: 10,
              realtimeHrvPeriodSeconds: 10,
              // Removed HRV-related periods
              realtimeCardiacStressPeriodSeconds: 60,
              infiniteMeasurement: false,
              durationSeconds: 30,
              instantMetrics: [
                sdkInstance.Metric.HEART_RATE,
                sdkInstance.Metric.BLOOD_PRESSURE,
                // Removed HRV_SDNN
                sdkInstance.Metric.BREATHING_RATE,
                sdkInstance.Metric.CARDIAC_STRESS,
                sdkInstance.Metric.CARDIAC_WORKLOAD,
                // Removed PNS_ACTIVITY
                sdkInstance.Metric.SYSTOLIC_BP,
                sdkInstance.Metric.DIASTOLIC_BP,
              ],
              summaryMetrics: [
                sdkInstance.Metric.HEART_RATE,
                sdkInstance.Metric.BLOOD_PRESSURE,
                // Removed HRV_SDNN
                sdkInstance.Metric.BREATHING_RATE,
                sdkInstance.Metric.CARDIAC_STRESS,
                sdkInstance.Metric.CARDIAC_WORKLOAD,
                // Removed PNS_ACTIVITY
                sdkInstance.Metric.SYSTOLIC_BP,
                sdkInstance.Metric.DIASTOLIC_BP,
              ],
              healthIndices: [
                sdkInstance.HealthIndex.NON_ALCOHOLIC_FATTY_LIVER_DISEASE_RISK,
                // Removed DIABETES_RISK
                sdkInstance.HealthIndex.CARDIOVASCULAR_DISEASE_RISK,
              ],
            },
            eventCallback: async (event) => {
              logInfo("X vitals event:", event);

              if (event === "MEASUREMENT_FINISHED") {
                try {
                  const data = await sdkInstance.getMeasurementResults();
                  logInfo("Measurement results:", data);

                  if (!data) {
                    logError("Measurement results are null - measurement may have failed");
                    return;
                  }

                  // Format results
                  const formattedResults = {
                    heartRate: Math.round(data.heart_rate_bpm),
                    // Removed HRV-related metrics
                    stressIndex: data.stress_index
                      ? Number(data.stress_index.toFixed(1))
                      : null,
                    // Removed parasympatheticActivity
                    breathingRate: data.breathing_rate_bpm
                      ? Math.round(data.breathing_rate_bpm)
                      : null,
                    systolicBP: data.systolic_blood_pressure_mmhg
                      ? Math.round(data.systolic_blood_pressure_mmhg)
                      : null,
                    diastolicBP: data.diastolic_blood_pressure_mmhg
                      ? Math.round(data.diastolic_blood_pressure_mmhg)
                      : null,
                    cardiacWorkload: data.cardiac_workload_mmhg_per_sec
                      ? Math.round(data.cardiac_workload_mmhg_per_sec)
                      : null,
                    // Removed pnsActivity
                    // Removed diabetesRisk
                    signalQuality: data.average_signal_quality,
                    heartbeats: data.heartbeats,
                  };

                  // Save results to user health vitals
                  try {
                    const { bmi_kg_per_m2, ...apiResults } = data;
                    const healthVitalsResult = await createOrUpdateUserHealthVitals(apiResults);
                    
                    // Capture alert information if available
                    if (healthVitalsResult && !healthVitalsResult.error) {
                      // Extract alert information from the response
                      const alertData = {
                        risk: healthVitalsResult.alert,
                        message: healthVitalsResult.alert_reason,
                        alert_in: healthVitalsResult.alert_in
                      };
                      setAlertInfo(alertData);
                    }
                  } catch (err) {
                    logError("Failed to update health vitals:", err);
                  }

                  // Update state with results
                  setResults(formattedResults);
                  setShowCamera(false);
                  setScanning(false);

                  // Reset progress tracking
                  maxProgressRef.current = 0;
                } catch (err) {
                  logError("Error getting measurement results:", err);
                  setError("Failed to process measurement results");
                }
              }
            },
          },
          async (result) => {
            logInfo("SDK initialization result:", result);
            setLoadingProgress(90);
            sdkInstance.attachToCanvas("mxcanvas");

            if (result === sdkInstance.InitializationResult.OK) {
              setLoadingProgress(100);
              setLoadingStage("Ready!");

              const stream = await setupCamera(facingMode);
              if (!stream) return;

              // Add a small delay before removing the loading screen
              setTimeout(() => {
                setLoading(false);
                setSdkInitialized(true);
                logInfo("SDK initialized successfully");
              }, 500);

              // Set up polling for UI updates
              pollingInterval = setInterval(() => {
                if (!sdkInstance) return;

                try {
                  // Poll heart rate
                  try {
                    const hr = sdkInstance.getHeartRate10s();
                    if (hr) {
                      setHeartRate(Math.round(hr));
                    } else if (!scanning) {
                      setHeartRate(null);
                    }
                  } catch (err) {
                    logWarn("Error getting heart rate:", err);
                  }

                  // Poll face position
                  try {
                    const facePosition = sdkInstance.getFaceState();
                    if (facePosition && typeof facePosition === "object") {
                      setFaceState(facePosition);
                    }
                  } catch (err) {
                    logWarn("Error getting face state:", err);
                  }

                  // Poll measurement progress and state - using non-decreasing progress
                  try {
                    const progress =
                      sdkInstance.getMeasurementProgressPercentage();
                    if (progress !== undefined && progress !== null) {
                      updateMeasurementProgress(progress);
                    }
                  } catch (err) {
                    logWarn("Error getting measurement progress:", err);
                  }

                  try {
                    const state = sdkInstance.getMeasurementState();
                    if (state && typeof state === "object") {
                      setMeasurementState(state);

                      // If measurement is finished, ensure progress shows 100%
                      if (state.value === 6) {
                        // FINISHED state
                        updateMeasurementProgress(100);
                      }

                      // Add this new condition to handle failed measurements
                      if (state.value === 7) {
                        // FAILED state - reset scan after a short delay
                        setTimeout(() => {
                          if (scanning) {
                            cancelScan();
                            setError(
                              "Scan failed. Please try again with better lighting and keep your face centered."
                            );
                          }
                        }, 2000);
                      }
                    }
                  } catch (err) {
                    logWarn("Error getting measurement state:", err);
                  }
                } catch (err) {
                  logError("Error during polling:", err);
                }
              }, 300);
            } else {
              logError("Shen.AI license activation error:", result);
              setError(
                "Failed to initialize Shen.AI: License activation error"
              );
              setLoading(false);
            }
          }
        );
      } catch (err) {
        logError("Error setting up Shen.AI:", err);
        setError(err.message || "Unknown error");
        setLoading(false);
      }
    };

    setupCameraAndSDK();

    logInfo("Setup camera and SDK completed");
    // Cleanup on unmount
    return () => {
      logInfo("Cleaning up on unmount");
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }

      if (sdkInstance) {
        try {
          logInfo("Destroying Shen.AI SDK runtime");
          sdkInstance.destroyRuntime();

          logInfo("Shen.AI SDK runtime destroyed");
        } catch (err) {
          logError("Error deinitializing SDK:", err);
        }
      }

      logInfo("Stopping camera stream");
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        logInfo("Camera stream stopped");
      }

      logInfo("Cleanup completed");
    };
  }, []);

  // Function to switch camera (front/back)
  const switchCamera = async () => {
    try {
      setError(null);
      const newFacingMode = facingMode === "user" ? "environment" : "user";
      setFacingMode(newFacingMode);

      // Setup new camera stream with the new facing mode
      await setupCamera(newFacingMode);

      if (shenai) {
        shenai.setCameraMode(
          newFacingMode === "user"
            ? shenai.CameraMode.FACING_USER
            : shenai.CameraMode.FACING_ENVIRONMENT
        );
      }
    } catch (err) {
      logError("Failed to switch camera:", err);
      setError("Failed to switch camera: " + (err.message || "Unknown error"));
    }
  };

  // Start scan
  const startScan = () => {
    logInfo("Starting scan");
    if (!shenai || !faceCentered) {
      logError(
        "Failed to start scan: Shen.AI SDK not initialized or face not centered"
      );
      return;
    }

    try {
      // Reset progress tracking when starting a new scan
      maxProgressRef.current = 0;
      setMeasurementProgress(0);
      setError(null);

      // Set scanning state
      setScanning(true);

      // Add a small delay before starting measurement to ensure SDK is ready
      setTimeout(() => {
        if (shenai) {
          // Set operating mode to MEASURE to start the measurement
          shenai.setOperatingMode(shenai.OperatingMode.MEASURE);
        }
      }, 300);
    } catch (err) {
      logError("Error starting scan:", err);
      setError(
        "Failed to start measurement: " + (err.message || "Unknown error")
      );
      setScanning(false);
    }
  };

  // Cancel scan
  const cancelScan = () => {
    if (!shenai) return;

    try {
      // Set operating mode to IDLE to stop the measurement
      shenai.setOperatingMode(shenai.OperatingMode.IDLE);

      // Reset progress tracking when canceling
      maxProgressRef.current = 0;
      setMeasurementProgress(0);
      setError(null);

      // Update UI state after a short delay to ensure SDK has time to process
      setTimeout(() => {
        setScanning(false);
      }, 300);
    } catch (err) {
      logError("Error canceling scan:", err);
      setError(
        "Failed to cancel measurement: " + (err.message || "Unknown error")
      );
    }
  };

  // Reset scan - Fixed to properly reinitialize camera and SDK
  const resetScan = async () => {
    try {
      // First set the SDK to idle mode if it exists
      if (shenai) {
        try {
          // Make sure we're in IDLE mode
          shenai.setOperatingMode(shenai.OperatingMode.IDLE);

          // Wait a moment for the SDK to process the mode change
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (err) {
          logWarn("Error setting SDK to idle mode:", err);
          // Continue with reset even if this fails
        }
      }

      // Reset all state variables in the correct order
      setScanning(false);
      // Reset progress tracking
      maxProgressRef.current = 0;
      setMeasurementProgress(0);
      setHeartRate(null);
      setFaceState({ value: 4 }); // Reset to default "Face is not visible" state
      setMeasurementState({ value: 0 }); // Reset to default "Not Started" state

      // Clear results before showing camera
      setResults(null);
      setAlertInfo(null);

      // Show camera view
      setShowCamera(true);

      // Clear any existing errors
      setError(null);

      // Reinitialize camera stream after state is reset
      await setupCamera(facingMode);

      logInfo("Scan reset successfully");
    } catch (err) {
      logError("Error resetting scan:", err);
      setError("Failed to reset: " + (err.message || "Unknown error"));

      // Even if there's an error, ensure we show the camera view
      setShowCamera(true);
    }
  };

  // Handle finish action
  const handleFinish = () => {
    logInfo("Handling finish action");
    if (results) {
      if (shenai) {
        logInfo("Destroying Shen.AI SDK runtime");
        shenai.destroyRuntime();
        logInfo("Shen.AI SDK runtime destroyed");
      }
      logInfo("Navigating to profile page");
      navigate("/profile");
    }
  };

  // Format results for the VitalsDisplay component
  const formatVitalsData = () => {
    if (!results) {
      logError("No results to format");
      return null;
    }

    return {
      heartRate: `${results.heartRate} bpm`,
      bloodPressure:
        results.systolicBP && results.diastolicBP
          ? `${results.systolicBP}/${results.diastolicBP} mmHg`
          : "N/A",
      oxygenLevel: "N/A", // X VITALS doesn't provide oxygen level
      temperature: "N/A", // X VITALS doesn't provide temperature
      respirationRate: results.breathingRate
        ? `${results.breathingRate} bpm`
        : "N/A",
      // Removed HRV-related metrics
      stressIndex: results.stressIndex ? `${results.stressIndex}` : "N/A",
      cardiacWorkload: results.cardiacWorkload
        ? `${results.cardiacWorkload} mmHg/s`
        : "N/A",
      // Removed pnsActivity
      // Removed diabetesRisk
    };
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 md:pt-[80px]">
      <Card className="w-full max-w-md mx-auto overflow-hidden">
        {showCamera ? (
          <div className="flex flex-col video-wrapper">
            {/* Camera view container */}
            <div className="relative aspect-[3/4] w-full bg-black rounded-t-lg overflow-hidden video-area">
              {/* Hidden canvas for X VITALS SDK - IMPORTANT: Keep the exact same ID */}
              <div id="canvas-wrapper" style={{ display: "none" }}>
                <canvas id="mxcanvas" />
              </div>

              {/* Video element */}
              <video
                src={isMockVideo ? mockVideo : ""}
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
              />

              {/* Face position guide overlay */}
              <FacePositionGuide
                faceDetected={faceDetected}
                faceCentered={faceCentered}
                scanning={scanning}
              />

              {/* Enhanced loading indicator with progress */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-20">
                  <div className="flex flex-col items-center w-4/5 max-w-xs">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
                    <p className="text-black text-center mb-2">
                      {loadingStage}
                    </p>

                    {/* Show a tip if loading takes a while */}
                    {loadingProgress > 0 && loadingProgress < 90 && (
                      <p className="text-xs text-black-400 mt-6 text-center">
                        First-time loading may take a minute. Please keep the
                        app open.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Error message if any */}
              {error && (
                <div className="absolute inset-x-0 top-4 px-4 z-20">
                  <p className="text-red-500 text-center text-sm font-medium bg-black/50 py-1 px-2 rounded">
                    Error: {error}
                  </p>
                </div>
              )}

              {/* Start/Cancel button and camera switch button */}
              <div className="absolute bottom-12 left-0 right-0 px-4 z-20 flex justify-center items-center gap-2">
                {!scanning ? (
                  <Button
                    onClick={startScan}
                    disabled={!faceDetected || !faceCentered || loading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2 rounded-full"
                  >
                    Start Scan
                  </Button>
                ) : (
                  <Button
                    onClick={cancelScan}
                    className="bg-red-500 hover:bg-red-600 text-white px-8 py-2 rounded-full"
                  >
                    Cancel
                  </Button>
                )}

                {/* Camera switch button */}
                <Button
                  onClick={switchCamera}
                  size="icon"
                  variant="secondary"
                  disabled={loading}
                  className="bg-white/90 text-slate-700 hover:bg-white rounded-full h-10 w-10 flex items-center justify-center"
                >
                  <SwitchCamera className="h-5 w-5" />
                </Button>
              </div>

              {/* Progress bar - only show when scanning */}
              {scanning && (
                <div className="absolute bottom-0 left-0 right-0 px-4 py-3 z-20">
                  <div className="flex justify-between text-sm text-white mb-2">
                    <span>Scanning...</span>
                    <span className="font-bold">
                      {Math.round(measurementProgress)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300"
                      style={{ width: `${measurementProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Status cards below camera view */}
            <div className="bg-white p-4 rounded-b-lg">
              {/* Heart rate display when scanning */}
              {true && (
                <Card className="mt-3 overflow-hidden mb-2">
                  <div className="p-3">
                    <div className="flex items-center justify-center">
                      <Heart
                        className={`h-5 w-5 text-red-500 mr-2 ${
                          scanning ? "animate-pulse" : ""
                        }`}
                        style={{ animationDuration: "1s" }}
                      />
                      <span className="text-xs md:text-sm font-medium">
                        Heart Rate:
                      </span>
                      <span className="text-lg font-bold ml-2">
                        {heartRate ? heartRate : "N/A"}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">BPM</span>
                    </div>
                  </div>
                </Card>
              )}
              <div className="grid grid-cols-2 gap-3">
                {/* Face position card */}
                <Card className="overflow-hidden">
                  <div className="p-3 flex flex-col items-center">
                    <Camera
                      className={`h-5 w-5 ${
                        faceCentered ? "text-emerald-500" : "text-amber-500"
                      } mb-1`}
                    />
                    <p className="text-xs md:text-sm text-slate-500">
                      Face Position
                    </p>
                    <p className="text-xs md:text-sm font-medium text-center whitespace-nowrap">
                      {getFacePositionText()}
                    </p>
                  </div>
                </Card>

                {/* Lighting condition card */}
                <Card className="overflow-hidden">
                  <div className="p-3 flex flex-col items-center">
                    <Sun className="h-5 w-5 text-amber-500 mb-1" />
                    <p className="text-xs md:text-sm text-slate-500">
                      Lighting
                    </p>
                    <p className="text-xs md:text-sm font-medium text-center">
                      {getLightingCondition()}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <VitalsDisplay vitals={formatVitalsData()} alertIn={alertInfo?.alert_in} />
        )}
      </Card>

      {/* Action buttons outside the camera display */}
      {!showCamera && results && (
        <div className="mt-4 flex justify-center gap-3">
          <Button onClick={resetScan} variant="outline">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Re-scan
          </Button>
          <Button
            onClick={handleFinish}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            Finish
          </Button>
        </div>
      )}

      {/* Error message outside the camera display */}
      {error && !showCamera && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <p className="font-medium">Error occurred</p>
          <p>{error}</p>
          <Button
            onClick={resetScan}
            variant="outline"
            className="mt-2 text-xs h-8"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
