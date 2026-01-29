import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import apiClient from "../config/APIConfig";
import { logCritical, logInfo, logWarn } from "../utils/logger";

const PendingContext = createContext({ isFoodScanPending: false, setFoodScanPending: () => {}, foodScanProgress: 0, foodScanPreviewUrl: null, foodScanPhase: "", lastFoodScan: null, pendingMealFor: null, startFoodScan: async () => {}, selectedMealFor: null, setSelectedMealFor: () => {} });

export const PendingProvider = ({ children }) => {
  const [isFoodScanPending, setIsFoodScanPending] = useState(false);
  const [foodScanProgress, setFoodScanProgress] = useState(0);
  const [foodScanPreviewUrl, setFoodScanPreviewUrl] = useState(null);
  const [foodScanPhase, setFoodScanPhase] = useState("");
  const [lastFoodScan, setLastFoodScan] = useState(null);
  const [pendingMealFor, setPendingMealFor] = useState(null);
  const [selectedMealFor, setSelectedMealFor] = useState(null);

  const setFoodScanPending = useCallback((pending) => {
    setIsFoodScanPending(Boolean(pending));
  }, []);

  const startFoodScan = useCallback(async (imageUrl, path, mealFor) => {
    try {
      setIsFoodScanPending(true);
      setFoodScanProgress(5);
      setPendingMealFor(mealFor || null);
      // Immediately convert to a persistent data URL so preview survives route changes
      let blob;
      try {
        const resp = await fetch(imageUrl);
        if (!resp.ok) throw new Error('fetch-failed');
        blob = await resp.blob();
        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          setFoodScanPreviewUrl(dataUrl);
        } catch (_) {
          setFoodScanPreviewUrl(imageUrl || null);
        }
      } catch (_) {
        setFoodScanPreviewUrl(imageUrl || null);
      }
      const phases = ["Analysing food ...", "Separating ingredients...", "Breaking down macros..."];
      let phaseIdx = 0;
      setFoodScanPhase(phases[phaseIdx]);
      let phaseInterval;
      try {
        phaseInterval = setInterval(() => {
          phaseIdx = (phaseIdx + 1) % phases.length;
          setFoodScanPhase(phases[phaseIdx]);
        }, 3500);
      } catch (_) {}
      // Ensure we have a blob for upload
      if (!blob) {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        blob = await response.blob();
      }

      // Convert blob to persistent data URL so preview survives route changes
      let dataUrl = null;
      try {
        dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        setFoodScanPreviewUrl(dataUrl);
      } catch (_) {
        setFoodScanPreviewUrl(imageUrl || null);
      }

      const formData = new FormData();
      formData.append("image", blob, "food-image.jpg");
      if (mealFor) {
        try {
          formData.append("meal_for", String(mealFor));
        } catch (_) {}
      }
      const url = path === "/demos/calories-count" ? "/hybrid-food-analysis/demo/food-analyze" : "/hybrid-food-analysis/food-analyze";

      let rampInterval;
      try {
        rampInterval = setInterval(() => {
          setFoodScanProgress((p) => (p < 95 ? p + Math.max(1, Math.floor((100 - p) / 20)) : p));
        }, 800);
      } catch (_) {}

      const apiResponse = await apiClient.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000,
        onUploadProgress: (evt) => {
          try {
            if (evt && evt.total) {
              const uploaded = Math.round((evt.loaded / evt.total) * 60); // upload portion up to 60%
              setFoodScanProgress((p) => Math.max(p, Math.min(60, uploaded)));
            }
          } catch (_) {}
        }
      });

      if (apiResponse.status === 200 || apiResponse.status === 201) {
        logInfo("Food analysis completed in background");
        try {
          const responseData = apiResponse?.data || {};
          const analysis = responseData?.analysis || {};
          const nowIso = new Date().toISOString();
          
          // Check if API explicitly returned success: false
          if (responseData.success === false) {
            // Create a simple failed scan entry with error status
            setLastFoodScan({
              id: undefined,
              detected_food: undefined,
              calories: undefined,
              image_url: dataUrl || imageUrl || null,
              nutrition_data: JSON.stringify({}),
              status: 'not_detected',
              meal_for: mealFor || undefined,
              created_at: nowIso,
              created_at_local: nowIso.replace('T', ' ').slice(0, 19),
            });
            return;
          }
          
          // Check if analysis has meaningful nutrition data
          const meaningfulKeys = [
            'name', 'calories', 'carbs', 'protein', 'fat', 'fats', 'confidence', 
            'healthScore', 'fiber', 'sugar', 'sodium', 'saturatedFat', 'unsaturatedFat', 
            'vitamins', 'minerals'
          ];
          const hasMeaningfulData = analysis && meaningfulKeys.some(key => 
            analysis[key] !== undefined && analysis[key] !== null && analysis[key] !== ''
          );
          
          // If no analysis returned or no meaningful data, treat as error
          if (!analysis || (typeof analysis === 'object' && Object.keys(analysis).length === 0) || !hasMeaningfulData) {
            // Create a simple failed scan entry with error status
            setLastFoodScan({
              id: undefined,
              detected_food: undefined,
              calories: undefined,
              image_url: dataUrl || imageUrl || null,
              nutrition_data: JSON.stringify({}),
              status: 'not_detected',
              meal_for: mealFor || undefined,
              created_at: nowIso,
              created_at_local: nowIso.replace('T', ' ').slice(0, 19),
            });
            return;
          }
          const normalized = {
            id: analysis.id || undefined,
            detected_food: analysis.name || "Unknown Food",
            calories: analysis.calories ?? undefined,
            image_url: responseData?.image_url || dataUrl || imageUrl || null,
            nutrition_data: JSON.stringify({
              protein: analysis.protein,
              carbs: analysis.carbs,
              fat: analysis.fat ?? analysis.fats,
              fiber: analysis.fiber,
              sugar: analysis.sugar,
              sodium: analysis.sodium,
              saturatedFat: analysis.saturatedFat,
              unsaturatedFat: analysis.unsaturatedFat,
              vitamins: analysis.vitamins,
              minerals: analysis.minerals,
              confidence: analysis.confidence,
              name: analysis.name,
              healthScore: analysis.healthScore,
              healthScoreReason: analysis.healthScoreReason,
              meal_for: mealFor || analysis.meal_for,
            }),
            status: undefined,
            meal_for: mealFor || analysis.meal_for,
            created_at: nowIso,
            created_at_local: nowIso.replace('T', ' ').slice(0, 19),
          };
          setLastFoodScan(normalized);
        } catch (_) {}
      } else {
        throw new Error(`API returned status ${apiResponse.status}`);
      }
    } catch (error) {
      logCritical(`food-scan-background-error ${error}`);
      
      // Only show an error if server responded with an error payload
      if (error?.response) {
        const serverMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message;
        if (serverMsg) {
          toast.error(serverMsg);
        }
      }
    } finally {
      try { setFoodScanProgress(100); } catch(_) {}
      setTimeout(() => {
        setIsFoodScanPending(false);
        setFoodScanProgress(0);
        setFoodScanPreviewUrl(null);
        setFoodScanPhase("");
        setPendingMealFor(null);
        // keep lastFoodScan for dashboard to pick up; it can clear it after consuming if needed
      }, 600);
    }
  }, []);

  const value = useMemo(() => ({ isFoodScanPending, setFoodScanPending, startFoodScan, foodScanProgress, foodScanPreviewUrl, foodScanPhase, lastFoodScan, setLastFoodScan, pendingMealFor, selectedMealFor, setSelectedMealFor }), [isFoodScanPending, setFoodScanPending, startFoodScan, foodScanProgress, foodScanPreviewUrl, foodScanPhase, lastFoodScan, pendingMealFor, selectedMealFor]);

  return (
    <PendingContext.Provider value={value}>
      {children}
    </PendingContext.Provider>
  );
};

export const usePending = () => useContext(PendingContext);

export default PendingContext;

