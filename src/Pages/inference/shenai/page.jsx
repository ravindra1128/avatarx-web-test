import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { AuthContext } from "../../../Component/AuthProvider";
import Loader from "../../../Component/Loader";
import {
  createOrUpdateUserHealthVitals,
  logSessionActivity,
} from "../../../api/user.service";
import { logCritical, logErrorSmart, logInfo, logWarn, logError } from "../../../utils/logger";

import { getShenaiEvents } from "./events";
import {
  EMERGENCY_MSG,
  useEmergencyMessage,
} from "./hooks/useEmergencyMessage";
import { useResizeHandler } from "./hooks/useResizeHandler";
import MobileNavigation from "../../../Component/MobileNavigation";
export default function Shenai() {
  const startTimeRef = useRef(Date.now());
  const [isLogging, setIsLogging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const userLanguage = localStorage.getItem("userLanguage");
  const { token } = useParams();
  const { authData } = useContext(AuthContext);
  const location = useLocation();

  const [shenai, setShenai] = useState(null);
  const [initDone, setInitDone] = useState(false);
  const { canvasTop, canvasRef, canvasWidth } = useEmergencyMessage(
    initDone,
    isLogging
  );
  const navigate = useNavigate();
  const API_KEY = "62ad70ae10a84a028e615b781dd81a73";
  const USER_ID = token || "1234567890";

  const shouldShowEmergency =
    shenai &&
    shenai.getScreen() === shenai.Screen.MEASUREMENT &&
    shenai.getScreen() !== shenai.Screen.RESULTS &&
    canvasTop != null;
  const sendSessionLog = async (endMs) => {
    if (authData) {
      setIsLogging(true);
      try {
        const payload = {
          sessionType: "video",
          startTime: new Date(startTimeRef.current).toISOString(),
          endTime: new Date(endMs).toISOString(),
        };
        await logSessionActivity(payload);
        logInfo("ShenAI: Session log sent");
      } catch (error) {
        logCritical("ShenAI: Error logging session:", error);
      } finally {
        setIsLogging(false);
      }
    } else {
      logWarn("ShenAI: No auth data");
    }
  };

  useEffect(() => {
    sendSessionLog(Date.now()); // Call API when page loads

    const handleUnload = () => {
      sendSessionLog(Date.now()); // Call API when page unloads
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      sendSessionLog(Date.now()); // Call API when component unmounts
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Detect mobile screens with proper resize handling
  const checkMobile = () => {
    const mobile = window.innerWidth <= 768;
    setIsMobile(mobile);
    
    // Add/remove body class for mobile navigation only on check-vitals page
    if (mobile && location.pathname === '/patient/check-vitals') {
      document.body.classList.add('has-mobile-nav');
    } else {
      document.body.classList.remove('has-mobile-nav');
    }
  };

  // Use the custom resize handler to prevent ResizeObserver loops
  useResizeHandler(checkMobile, [location.pathname]);

  // Initial mobile check
  useEffect(() => {
    checkMobile();
    return () => {
      document.body.classList.remove('has-mobile-nav');
    };
  }, [location.pathname]);

  // ---- Dynamic import: load the SDK only once this component is mounted
  useEffect(() => {
    let isCancelled = false;
    let instance = null;
    async function loadShenaiSDK() {
      try {
        logInfo("ShenAI:Loading Shenai SDK");
        const { default: CreateShenaiSDK } = await import(
          "../../../../shenai-sdk/index.mjs"
        );
        if (isCancelled) {
          logInfo("ShenAI: SDK cancelled");
          return;
        }
        instance = await CreateShenaiSDK({
          onRuntimeInitialized: () => {},
        });

        logInfo("ShenAI: Shenai SDK created");

        logInfo("ShenAI: Initializing Shenai SDK");
        instance.initialize(
          API_KEY,
          USER_ID,
          {
            operatingMode: instance.OperatingMode.MEASURE,
            measurementPreset: instance.MeasurementPreset.CUSTOM,
            customMeasurementConfig: {
              durationSeconds: 30,
              infiniteMeasurement: false,
              realtimeHrPeriodSeconds: 10,
              realtimeHrvPeriodSeconds: 60,
              realtimeCardiacStressPeriodSeconds: 60,

              instantMetrics: [
                instance.Metric.HEART_RATE,
                instance.Metric.BLOOD_PRESSURE,
                instance.Metric.HRV_SDNN,
                instance.Metric.BREATHING_RATE,
                instance.Metric.CARDIAC_STRESS,
                instance.Metric.CARDIAC_WORKLOAD,
                instance.Metric.PNS_ACTIVITY,
                instance.Metric.SYSTOLIC_BP,
                instance.Metric.DIASTOLIC_BP,
              ],

              summaryMetrics: [
                instance.Metric.HEART_RATE,
                instance.Metric.BLOOD_PRESSURE,
                instance.Metric.HRV_SDNN,
                instance.Metric.BREATHING_RATE,
                instance.Metric.CARDIAC_STRESS,
                instance.Metric.CARDIAC_WORKLOAD,
                instance.Metric.PNS_ACTIVITY,
                instance.Metric.SYSTOLIC_BP,
                instance.Metric.DIASTOLIC_BP,
              ],
              healthIndices: [
                instance.HealthIndex.NON_ALCOHOLIC_FATTY_LIVER_DISEASE_RISK,
                instance.HealthIndex.DIABETES_RISK,
                instance.HealthIndex.CARDIOVASCULAR_DISEASE_RISK,
              ],
            },
            showUserInterface: true,
            enableSummaryScreen: true,
            // Disable color changes for high/low values
            showOutOfRangeResultIndicators: false,
            // Set custom color theme to use black text
            customColorTheme: {
              themeColor: "#56B0B0",      // Black theme color
              textColor: "#000000",       // Black text color
              backgroundColor: "#FFFFFF",  // White background
              tileColor: "#F5F5F5"        // Light gray tiles
            },
            eventCallback: getShenaiEvents({ instance, navigate }),
          },
          (result) => {
            // logInfo("Initialization result", result);
            if (result === instance.InitializationResult.OK) {
              logInfo("ShenAI: Initialization successful");
              document.getElementById("stage").className = "state-loaded";
            } else {
              logError("ShenAI: Initialization failed with result: " + result.toString());
              showError(
                "Avatarx Vitals license activation error " + result.toString()
              );
            }
            setInitDone(true);
          }
        );

        // Make instance available to rest of component
        setShenai(instance);

        logInfo("ShenAI: Shenai SDK loaded");
      } catch (error) {
        alert("Something went wrong, please refresh the page and try again.");
        logErrorSmart(error);
        // showError("Error loading or initializing");
      }
    }

    loadShenaiSDK();

    // Cleanup if component unmounts before load finishes
    return () => {
      isCancelled = true;
      if (instance) {
        logInfo("ShenAI: Deinitializing Shenai SDK");
        instance.deinitialize();
        instance.destroyRuntime();
        instance.setCameraMode(instance.CameraMode.OFF);
      }
    };
  }, []);

  // ---- Utility: show an error message
  function showError(message) {
    document.getElementById("stage")?.classList.add("state-error");
  }

  // ---- Utility: show/hide DOM elements by class
  function showElement(elem) {
    elem?.classList.remove("hidden");
  }

  // ---- Utility: set custom color theme for Shenai SDK
  function setShenaiColorTheme(theme = "black") {
    if (!shenai) return;
    
    const themes = {
      black: {
        themeColor: "#000000",
        textColor: "#000000", 
        backgroundColor: "#FFFFFF",
        tileColor: "#F5F5F5"
      },
      white: {
        themeColor: "#FFFFFF",
        textColor: "#FFFFFF",
        backgroundColor: "#000000", 
        tileColor: "#333333"
      },
      custom: {
        themeColor: "#56b0b0", // Green theme color (set any color you want for the button and the wave)
        textColor: "#000000",
        backgroundColor: "#FFFFFF",
        tileColor: "#F5F5F5"
      }
    };
    
    try {
      shenai.setCustomColorTheme(themes[theme]);
      logInfo(`ShenAI: Shenai color theme set to: ${theme}`);
    } catch (error) {
      logWarn("ShenAI: Error setting Shenai color theme:", error);
    }
  }

  useEffect(() => {
    if (!shenai || !initDone) return;

    let finished = false;
    let wakeLock = "wakeLock" in navigator ? null : false;
    let intervals = null;

    beginPolling(shenai);

    if (userLanguage && shenai.getLanguage() !== userLanguage) {
      logInfo("ShenAI: Setting language to " + userLanguage);
      shenai.setLanguage(userLanguage);
    }

    if (shenai.getOperatingMode() !== shenai.OperatingMode.MEASURE) {
      logInfo("ShenAI: Setting operating mode to MEASURE");
      shenai.setOperatingMode(shenai.OperatingMode.MEASURE);
      localStorage.setItem("measuring", "true");

      if (wakeLock === null) {
        navigator.wakeLock.request("screen").then((lock) => (wakeLock = lock));
      }
    }

    // For setting custom color theme for start button and wave
    // setShenaiColorTheme("custom");

    function beginPolling(sdk) {
      intervals = {
        heartRateInterval: setInterval(() => pollHeartRate(sdk), 300),
        measurementInterval: setInterval(() => pollMeasurement(sdk), 100),
      };
    }

    function pollHeartRate(sdk) {
      if (finished) return;
      const hr = sdk.getHeartRate10s();
      const hrElem = document.getElementById("heart-rate");
      if (hrElem) {
        hrElem.innerText = hr ? Math.round(hr).toString() : " ";
      }
    }

    async function pollMeasurement(sdk) {
      const measurementState = sdk.getMeasurementState();
      if (
        measurementState === sdk.MeasurementState.NOT_STARTED ||
        measurementState === sdk.MeasurementState.RUNNING_SIGNAL_SHORT
      ) {
        finished = false;
      }
      if (measurementState === sdk.MeasurementState.FINISHED) {
        // finished = true;
        shenai.setScreen(shenai.Screen.RESULTS);
        if (wakeLock) {
          wakeLock.release().then(() => (wakeLock = null));
        }
        try {
          const measurementResults = sdk.getMeasurementResults();
          
          if (!measurementResults) {
            logError("ShenAI: Measurement results are null - measurement may have failed");
            return;
          }
          
          if (authData?.user && !finished) {
            finished = true;
            await createOrUpdateUserHealthVitals(measurementResults);
          }
          presentResults(measurementResults);
        } catch (error) {
          logError("ShenAI: Error processing measurement results:", error);
          showError("Failed to process measurement results. Please try again.");
        }
        return;
      }
    }

    function presentResults(results) {
      const resultsElem = document.getElementById("results");
      if (resultsElem) {
        resultsElem.innerText = [
          `HR: ${results.heart_rate_bpm} BPM`,
          `HRV SDNN: ${results.hrv_sdnn_ms} ms`,
          `HRV lnRMSSD: ${results.hrv_lnrmssd_ms} ms`,
          `BR: ${Math.round(results.breathing_rate_bpm)} BPM`,
        ].join(", ");
      }

      const intervals = results.heartbeats;
      if (intervals) {
        const csvData = makeCsvHref(
          ["start_time_sec", "end_time_sec", "duration_ms"],
          intervals.map((i) => [
            i.start_location_sec.toFixed(3),
            i.end_location_sec.toFixed(3),
            i.duration_ms.toString(),
          ])
        );
        const download = document.getElementById("download-intervals");
        if (download) {
          download.href = csvData;
          showElement(download);
        }
        localStorage.setItem(
          "intervals",
          intervals
            .map((row) =>
              [
                row.start_location_sec.toFixed(3),
                row.end_location_sec.toFixed(3),
                row.duration_ms.toString(),
              ].join(",")
            )
            .join("\n")
        );
      }
      const instrElem = document.getElementById("instruction");
      if (instrElem) {
        instrElem.innerText = "Measurement complete!";
      }
      const hrElem = document.getElementById("heart-rate");
      if (hrElem) {
        hrElem.innerText = "";
      }
      const progressElem = document.getElementById("progress");
      if (progressElem) {
        progressElem.innerText = "";
      }
    }

    function makeCsvHref(columnNames, dataRows) {
      return (
        "data:text/csv," +
        encodeURI(
          "\n" +
            columnNames.join(",") +
            "\n" +
            dataRows.map((row) => row.join(",")).join("\n")
        )
      );
    }

    return () => {
      finished = true;
      if (wakeLock) {
        wakeLock.release().then(() => (wakeLock = null));
      }
      if (intervals) {
        Object.values(intervals).forEach(clearInterval);
      }

      logInfo("ShenAI: Shenai SDK cleaned up on unmount");
    };
  }, [shenai, initDone]);

  useEffect(() => {
    return () => {
      if (!shenai) return;
      try {
        if (
          shenai.MxFinishFrameProcessing &&
          typeof shenai.MxFinishFrameProcessing === "function"
        ) {
          shenai.MxFinishFrameProcessing();
          logInfo("ShenAI: Called MxFinishFrameProcessing on Shenai SDK");
        }
        if (
          shenai.MxVideoTrack &&
          typeof shenai.MxVideoTrack.stop === "function"
        ) {
          shenai.MxVideoTrack.stop();
          logInfo("ShenAI: Stopped MxVideoTrack from Shenai SDK");
        }
        if (shenai.deinitialize) shenai.deinitialize();
        if (shenai.destroyRuntime) shenai.destroyRuntime();
        logInfo("ShenAI: Shenai SDK cleaned up on unmount");

        shenai.setCameraMode(shenai.CameraMode.OFF);
      } catch (e) {
        logWarn("ShenAI: Error cleaning up Shenai SDK:", e);
      }
    };
  }, [shenai]);

  logInfo("ShenAI: Shenai initialized");

  // Check if we're on the patient/check-vitals page
  const isCheckVitalsPage = location.pathname === '/patient/check-vitals';

  // Mobile-specific styles - only apply when on check-vitals page
  const mobileStyles = {
    container: {
      overflow: (isMobile && isCheckVitalsPage) ? 'hidden' : 'visible',
      height: (isMobile && isCheckVitalsPage) ? '100vh' : 'auto',
      paddingBottom: (isMobile && isCheckVitalsPage) ? '50px' : '0',
      position: (isMobile && isCheckVitalsPage) ? 'relative' : 'static',
      minHeight: (isMobile && isCheckVitalsPage) ? '100vh' : 'auto'
    },
    stage: {
      overflow: (isMobile && isCheckVitalsPage) ? 'hidden' : 'visible',
      height: (isMobile && isCheckVitalsPage) ? '100vh' : 'auto',
      paddingBottom: (isMobile && isCheckVitalsPage) ? '50px' : '0',
      position: (isMobile && isCheckVitalsPage) ? 'relative' : 'static',
      minHeight: (isMobile && isCheckVitalsPage) ? '100vh' : 'auto'
    },
    canvasWrapper: {
      // height: (isMobile && isCheckVitalsPage) ? 'calc(100vh - 90px)' : '100vh',
      overflow: (isMobile && isCheckVitalsPage) ? 'hidden' : 'visible',
      paddingBottom: (isMobile && isCheckVitalsPage) ? '50px' : '0',
      position: (isMobile && isCheckVitalsPage) ? 'relative' : 'static',
      minHeight: (isMobile && isCheckVitalsPage) ? 'calc(100vh - 90px)' : 'auto'
    }
  };

  // Once loaded, we use the same HTML (plus IDs) you had in index.html
  return (
    <div
      className="try-demo-page relative"
      style={mobileStyles.container}
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
    >
      <div 
        id="stage" 
        className="state-loading"
        style={mobileStyles.stage}
      >
        {isLogging && <Loader />}
        <div 
          id="canvas-wrapper" 
          style={mobileStyles.canvasWrapper}
        >
          <canvas id="mxcanvas" ref={canvasRef} />
          {/* Emergency disclaimer */}
          {/* show only if scanning is in proccess */}

          {shouldShowEmergency && (
            <div
              // shadow should go above also. not only down
              className="emergency-message flex text-slate-200 text-center absolute z-50 text-[7px] rounded-lg p-1"
              style={{
                width: canvasWidth - 20 || undefined,
                position: "fixed",
                lineHeight: "7px",
                top: canvasTop,
              }}
            >
              {EMERGENCY_MSG}
            </div>
          )}
        </div>
        
        {isCheckVitalsPage && <MobileNavigation />}

        <datalist id="gender-list">
          <option value="Male" />
          <option value="Female" />
          <option value="Other" />
        </datalist>
        <datalist id="race-list">
          <option value="White" />
          <option value="African-American" />
          <option value="Other" />
        </datalist>

        <div id="risks" className="hidden">
          <table id="health-risks-results">
            <tbody>
              <tr>
                <th>Hard and fatal events risks</th>
                <td id="coronaryDeathEventRisk">Coronary death event risk</td>
                <td id="fatalStrokeEventRisk">Fatal stroke event risk</td>
                <td id="totalCVMortalityRisk">Total CV mortality risk</td>
                <td id="hardCVEventRisk">Hard CV event risk</td>
              </tr>
              <tr>
                <th>CV diseases risks</th>
                <td id="overallRisk">Overall risk</td>
                <td id="coronaryHeartDiseaseRisk">
                  Coronary heart disease risk
                </td>
                <td id="strokeRisk">Stroke risk</td>
                <td id="heartFailureRisk">Heart failure risk</td>
                <td id="peripheralVascularDiseaseRisk">
                  Peripheral vascular disease risk
                </td>
              </tr>
              <tr>
                <th>Risks factors scores</th>
                <td id="ageScore">Age score</td>
                <td id="sbpScore">SBP score</td>
                <td id="smokingScore">Smoking score</td>
                <td id="diabetesScore">Diabetes score</td>
                <td id="cholesterolScore">Cholesterol score</td>
                <td id="cholesterolHdlScore">Cholesterol HDL score</td>
                <td id="totalScore">Total score</td>
              </tr>
              <tr>
                <th>Vascular age</th>
                <td id="vascularAge">Vascular age</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}