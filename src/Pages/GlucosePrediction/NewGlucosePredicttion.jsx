import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { AuthContext } from "../../Component/AuthProvider";
import Loader from "../../Component/Loader";
import { logInfo, logWarn, logCritical, logErrorSmart } from "../../utils/logger";
import apiClient from "../../config/APIConfig";

import { getShenaiEvents } from "../inference/shenai/events";
import {
  EMERGENCY_MSG,
  useEmergencyMessage,
} from "../inference/shenai/hooks/useEmergencyMessage";
import { useResizeHandler } from "../inference/shenai/hooks/useResizeHandler";
import MobileNavigation from "../../Component/MobileNavigation";
import axios from "axios";
import "../../App.css";
const GLUCOSE_API_URL = import.meta.env.VITE_GLUCOSE_MONITER;
export default function NewGlucosePredicttion() {
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
  const shenaiResultsRef = useRef(null);
  const glucoseResultsRef = useRef(null);
  const shenaiPpgSignalRef = useRef([]);

  const navigate = useNavigate();
  const API_KEY = "62ad70ae10a84a028e615b781dd81a73";
  const USER_ID = token || "1234567890";

  const shouldShowEmergency =
    shenai &&
    shenai.getScreen() === shenai.Screen.MEASUREMENT &&
    shenai.getScreen() !== shenai.Screen.RESULTS &&
    canvasTop != null;

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
          "../../../shenai-sdk/index.mjs"
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
              // Flow-breaking: SDK initialization failed
              const initError = new Error(`Initialization failed with result: ${result.toString()}`);
              logCritical(`ShenAI: Initialization failed: ${initError.message}`, { phase: 'sdk_initialization', result: result.toString(), error: initError.message });
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

  const buildPpgPayload = useCallback((ppgData) => {
    console.log("ppgData", ppgData, shenaiResultsRef.current);
    const shenaiResults = shenaiResultsRef.current;
    if (!shenaiResults) return null;
    
    const pulseArea =
      shenaiResults.cardiac_workload_mmhg_per_sec ??
      shenaiResults.cardiac_workload ??
      null;
    return {
      "PPG_Signal(mV)": ppgData ?? [],
      "Heart_Rate(bpm)": shenaiResults.heart_rate_bpm ?? undefined,
      "Systolic_Peak(mmHg)": shenaiResults.systolic_blood_pressure_mmhg ?? undefined,
      "Diastolic_Peak(mmHg)": shenaiResults.diastolic_blood_pressure_mmhg ?? undefined,
      Pulse_Area: pulseArea,
      "index(integer)": 1,
      "Gender(1 for Male, 0 for Female)": shenaiResults.gender ?? 1,
      "Height(cm)": shenaiResults.height_cm ?? undefined,
      "Weight(kg)": shenaiResults.weight_kg ?? undefined,
      Age: shenaiResults.age_years ?? undefined,
      "Age Range[1,2,3,4,5]": shenaiResults.age_range_bucket ?? undefined,
      Patient_Id: 1
    };
  }, []);

  const extractShenaiPpgData = useCallback(() => {
    const shenaiResults = shenaiResultsRef.current;
    if (!shenaiResults) {
      logWarn("ShanAI results not available yet - cannot extract PPG signal");
      return null;
    }

    let signal = shenaiPpgSignalRef.current || [];
    if ((!signal || !signal.length) && shenai && typeof shenai.getFullPpgSignal === "function") {
      try {
        const sdkSignal = shenai.getFullPpgSignal();
        if (Array.isArray(sdkSignal)) {
          signal = sdkSignal;
        } else {
          logWarn("ShanAI getFullPpgSignal returned invalid data");
        }
      } catch (sdkError) {
        logWarn(`Failed to get ShanAI PPG signal: ${sdkError?.message || sdkError}`);
      }
    }

    signal = Array.isArray(signal) ? signal : [];

    const data = {
      shenaiResults,
      shenaiPpg: signal,
      timestamp: Date.now(),
      metadata: {
        signalLength: signal.length,
        hasShenaiPpgSignal: signal.length > 0,
      },
    };

    logInfo("ShanAI PPG signal extracted", {
      signalLength: signal.length,
      hasShenaiPpg: data.metadata.hasShenaiPpgSignal,
    });

    return data;
  }, [shenai]);

  const sendPpgDataToServer = useCallback(
    async (signalData) => {
      if (!signalData || !shenaiResultsRef.current) return null;
      const payload = buildPpgPayload(signalData.shenaiPpg);
      if (!payload) return null;
      try {
        logInfo("Sending PPG data to glucose prediction API", {
          signalLength: signalData.shenaiPpg?.length || 0,
        });
        const response = await axios.post(GLUCOSE_API_URL + "predict", payload, {
          timeout: 30000, // 30 second timeout
        });
        console.log("response", response);
        if (response?.data) {
          glucoseResultsRef.current = response.data;
          return response.data;
        }
        return null;
      } catch (err) {
        logWarn(`Failed to post PPG data to glucose API: ${err?.message || err}`);
        return null;
      }
    },
    [buildPpgPayload, GLUCOSE_API_URL]
  );

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
            // Flow-breaking: measurement failed, no results available
            logCritical("ShenAI: Measurement results are null - measurement may have failed", { phase: 'measurement_results', error: "Measurement results are null" });
            return;
          }
          
        //   if (authData?.user && !finished) {
        //     finished = true;
        //     try {
        //       await createOrUpdateUserHealthVitals(measurementResults);
        //     } catch (vitalsError) {
        //       // Non-fatal: vitals save failure doesn't break result presentation
        //       logCritical(`ShenAI: Error saving health vitals: ${vitalsError.message}`, { phase: 'save_health_vitals', error: vitalsError.message, errorStack: vitalsError.stack });
        //     }
        //   }
          if (!finished) {
            finished = true;
            // Store measurement results in ref
            shenaiResultsRef.current = measurementResults;
            
            // Extract PPG signal data
            const ppgSignalData = extractShenaiPpgData();
            
            // Send PPG data to server for glucose prediction
            const glucoseData = await sendPpgDataToServer(ppgSignalData);
            console.log("glucoseData", glucoseData);
            if (glucoseData) {
              logInfo("Glucose prediction received", glucoseData);
            }
            navigate("/health-results", {
              state: {
                shenaiResults: measurementResults,
                glucoseResults: glucoseData || glucoseResultsRef.current,
                ppgSignal: ppgSignalData?.shenaiPpg || [],
              },
              replace: true,
            });
          }
        //   presentResults(measurementResults);
        } catch (error) {
          // Flow-breaking: cannot process measurement results
          logCritical(`ShenAI: Error processing measurement results: ${error.message}`, { phase: 'measurement_processing', error: error.message, errorStack: error.stack });
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
  }, [shenai, initDone, authData, userLanguage, extractShenaiPpgData, sendPpgDataToServer, navigate]);

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
        // Non-fatal: cleanup error doesn't break the flow
        logCritical(`ShenAI: Error cleaning up Shenai SDK: ${e.message}`, { phase: 'sdk_cleanup', error: e.message, errorStack: e.stack });
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