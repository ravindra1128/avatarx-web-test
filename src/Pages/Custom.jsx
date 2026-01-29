import React, {useRef, useEffect, useState, useContext} from "react";
import { createOrUpdateUserHealthVitals } from "../api/user.service";

export default function Custom() {
  const videoRef = useRef(null);
  const [shenai, setShenai] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [measurementState, setMeasurementState] = useState(null);
  const [measurementProgress, setMeasurementProgress] = useState(null);
  const [faceState, setFaceState] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_KEY = "62ad70ae10a84a028e615b781dd81a73";
  const USER_ID = "1234567890";

  const FaceStateEnum = {
    0: "OK",
    1: "Face Too Far",
    2: "Face Too Close",
    3: "Face is not centered",
    4: "Face is not visible",
    5: "UNKNOWN",
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

  useEffect(() => {
    let sdkInstance;

    const setupCameraAndSDK = async () => {
      try {
        // 2. Dynamically import Shen.AI SDK
        const {default: CreateShenaiSDK} = await import("../../shenai-sdk");
        sdkInstance = await CreateShenaiSDK({
          onRuntimeInitialized: () => {},
        });
        setShenai(sdkInstance);

        // 3. Initialize SDK with no built-in UI
        await sdkInstance.initialize(API_KEY, USER_ID, {
          operatingMode: instance.OperatingMode.MEASURE,
          showUserInterface: false,
          enableSummaryScreen: false,
          enableStartAfterSuccess: true,
          operatingMode: sdkInstance.OperatingMode.MEASURE,
          setRecordingEnabled: true,
          customMeasurementConfig: {
            realtimeHrPeriodSeconds: 10,
            realtimeHrvPeriodSeconds: 60,
            realtimeCardiacStressPeriodSeconds: 60,
            infiniteMeasurement: false,
            durationSeconds: 60,
            instantMetrics: [
              sdkInstance.Metric.HEART_RATE,
              sdkInstance.Metric.HRV_SDNN,
              sdkInstance.Metric.BREATHING_RATE,
            ],
            summaryMetrics: [
              sdkInstance.Metric.HEART_RATE,
              sdkInstance.Metric.HRV_SDNN,
              sdkInstance.Metric.BREATHING_RATE,
            ],
            healthIndices: [
              sdkInstance.HealthIndex.NON_ALCOHOLIC_FATTY_LIVER_DISEASE_RISK,
              sdkInstance.HealthIndex.DIABETES_RISK,
              sdkInstance.HealthIndex.CARDIOVASCULAR_DISEASE_RISK
            ],
          },
          eventCallback: async (event) => {
            if (event === "MEASUREMENT_FINISHED") {
              const data = await sdkInstance.getMeasurementResults();
              await createOrUpdateUserHealthVitals(data);
              setResults({
                heartRate: Math.round(data.heart_rate_bpm),
                hrvSdnn: data.hrv_sdnn_ms ? Math.round(data.hrv_sdnn_ms) : null,
                hrvLnrmssd: data.hrv_lnrmssd_ms ? Number(data.hrv_lnrmssd_ms.toFixed(1)) : null,
                stressIndex: data.stress_index ? Number(data.stress_index.toFixed(1)) : null,
                parasympatheticActivity: data.parasympathetic_activity ? Math.round(data.parasympathetic_activity) : null,
                breathingRate: data.breathing_rate_bpm ? Math.round(data.breathing_rate_bpm) : null,
                systolicBP: data.systolic_blood_pressure_mmhg ? Math.round(data.systolic_blood_pressure_mmhg) : null,
                diastolicBP: data.diastolic_blood_pressure_mmhg ? Math.round(data.diastolic_blood_pressure_mmhg) : null,
                cardiacWorkload: data.cardiac_workload_mmhg_per_sec ? Math.round(data.cardiac_workload_mmhg_per_sec) : null,
                estimatedAge: data.age_years ? Math.round(data.age_years) : null,
                estimatedBMI: data.bmi_kg_per_m2 ? Number(data.bmi_kg_per_m2.toFixed(2)) : null,
                signalQuality: data.average_signal_quality,
                heartbeats: data.heartbeats,
              });
            }
          },
        }, (result) => {
          if (result !== sdkInstance.InitializationResult.OK) {
          } else {
            setLoading(false);
          }
        });
        setInterval(() => {
          const progress = sdkInstance.getMeasurementProgressPercentage();
          const state = sdkInstance.getMeasurementState();
          const faceState = sdkInstance.getFaceState();
          setMeasurementProgress(progress);
          setMeasurementState(state);
          setFaceState(faceState);
        }, 300);

        // SET LOADING
        setLoading(false);
      } catch (err) {
        console.error("Error setting up Shen.AI:", err);
        setError(err.message || "Unknown error");
      }
    };

    setupCameraAndSDK();

    // Cleanup on unmount
    return () => {
      if (sdkInstance) sdkInstance.deinitialize();
    };
  }, []);

  useEffect(() => {
    let stream;

    const setupCamera = async () => {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: "user", width: 640, height: 480},
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }
    setupCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-lg font-medium text-muted-foreground">Initializing Shen.AI...</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background w-full">
      <div className="w-full max-w-md space-y-6 p-8 bg-card rounded-xl shadow-lg mb-16">
        <div id="canvas-wrapper" style={{display: "none"}}>
          <canvas id="mxcanvas"/>
        </div>

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: "100%",
            maxWidth: 400,
            border: "2px solid #ccc",
            borderRadius: "8px",
            transform: "scaleX(-1)"
          }}
        />

        {error && <p style={{color: "red"}}>Error: {error}</p>}
        <div className="flex flex-col">
          <div>State: {MeasurementStateEnum[measurementState?.value] ?? "N/A"}</div>
          <div>Face State: {FaceStateEnum[faceState?.value] ?? "N/A"}</div>
        </div>

        <div>
          <div>Progress: {JSON.stringify(Math.round(measurementProgress || 0))}</div>
        </div>

        {results && (
          <div
            style={{
              marginTop: 20,
              padding: 16,
              background: "#f1f1f1",
              borderRadius: 10,
            }}>
            <h3 className="text-lg font-semibold mb-2">Measurement Results</h3>
            <div className="space-y-1 text-sm text-gray-800">
              <p><strong>Heart Rate:</strong> {results.heartRate} BPM</p>
              <p><strong>HRV (SDNN):</strong> {results.hrvSdnn} ms</p>
              <p><strong>HRV (lnRMSSD):</strong> {results.hrvLnrmssd} ms</p>
              <p><strong>Stress Index:</strong> {results.stressIndex}</p>
              <p><strong>Parasympathetic Activity:</strong> {results.parasympatheticActivity}%</p>
              <p><strong>Breathing Rate:</strong> {results.breathingRate} BPM</p>
              <p><strong>Systolic BP:</strong> {results.systolicBP} mmHg</p>
              <p><strong>Diastolic BP:</strong> {results.diastolicBP} mmHg</p>
              <p><strong>Cardiac Workload:</strong> {results.cardiacWorkload} mmHg/s</p>
              <p><strong>Estimated Age:</strong> {results.estimatedAge} years</p>
              <p><strong>Estimated BMI:</strong> {results.estimatedBMI} kg/m²</p>
              <p><strong>Avg Signal Quality:</strong> {results.signalQuality}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
