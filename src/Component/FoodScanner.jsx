import React, { useState, useRef, useCallback, useEffect } from "react";
import { Camera, X, Image, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Button } from "./UI/button";
import apiClient from "../config/APIConfig";
import { useLocation, useNavigate } from "react-router-dom";
import { logCritical, logError, logInfo, logWarn } from "../utils/logger";
import "./FoodScanner.css";
import { usePending } from "./PendingContext.jsx";
import MealCategoryModal from "./MealCategoryModal";
import { flushSync } from "react-dom";
const FoodScanner = ({ onClose, onImageProcessed }) => {
  const { t } = useTranslation();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [pendingImageUrl, setPendingImageUrl] = useState(null);
  const [pendingFoodAnalysisId, setPendingFoodAnalysisId] = useState(null);
  const [isSubmittingMeal, setIsSubmittingMeal] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [currentCamera, setCurrentCamera] = useState("environment"); // "environment" or "user"
  const [availableCameras, setAvailableCameras] = useState([]);
  const [scanMode, setScanMode] = useState("food");
  const [flashMode, setFlashMode] = useState("off"); // "off", "on", "auto"
  const [selectedMealKey, setSelectedMealKey] = useState(null); // Track selected meal
  const selectedMealRef = useRef(null); // Ref to track selected meal for race conditions
  const [showScannerLine, setShowScannerLine] = useState(false); // Control scanner line animation
  const [isFirstApiComplete, setIsFirstApiComplete] = useState(false); // Track first API completion
  const [waitingForFirstApi, setWaitingForFirstApi] = useState(false); // Track if we're waiting for first API
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  let {pathname} = location;
  const preselectedMeal = location?.state?.preselectedMeal;
  const { setFoodScanPending, startFoodScan, setSelectedMealFor } = usePending();

  // useEffect to handle waiting for first API completion
  useEffect(() => {
    if (waitingForFirstApi && isFirstApiComplete) {
      // First API is now complete, proceed with meal processing
      setWaitingForFirstApi(false);
      
      // Check if upload failed
      if (analysisError === 'upload_failed') {
        toast.error('Image upload failed - please try again.');
        setIsSubmittingMeal(false);
        return;
      }
      
      // Proceed with second API call
      if (pendingFoodAnalysisId && selectedMealRef.current) {
        processMealWithAnalysisId(selectedMealRef.current, pendingFoodAnalysisId)
          .then(() => {
            setShowMealPicker(false);
            setAnalysisResult(null);
            resetScanner();
            navigate('/patient/dashboard');
            setIsSubmittingMeal(false); // Stop loader after successful completion
          })
          .catch((error) => {
            console.error('Error processing meal with analysis ID:', error);
            toast.error('Failed to process meal selection. Please try again.');
            setIsSubmittingMeal(false);
          });
      } else {
        // Fallback to old method if no analysis ID
        const imageToUse = pendingImageUrl;
        if (imageToUse) {
          startFoodScan(imageToUse, pathname, selectedMealRef.current).catch(() => {});
          setShowMealPicker(false);
          setAnalysisResult(null);
          resetScanner();
          navigate('/patient/dashboard');
          setIsSubmittingMeal(false); // Stop loader after completion
        }
      }
    }
  }, [waitingForFirstApi, isFirstApiComplete, analysisError, pendingFoodAnalysisId, pendingImageUrl, navigate, pathname, startFoodScan]);

  // Handle meal selection with food_analysis_id (now called when Done button is clicked)
  const handleMealSelect = async (mealKey, imageUrl) => {
    setIsSubmittingMeal(true);
    setSelectedMealKey(mealKey); // Store the selected meal
    selectedMealRef.current = mealKey; // Also store in ref for race condition handling
    console.log("mealKey", mealKey);
    // Show scanner line animation for 1 second
    setShowScannerLine(true);
    setTimeout(() => {
      setShowScannerLine(false);
    }, 1000);
    
    try {
      // Use the uploaded image URL from pendingImageUrl if available, otherwise use the passed imageUrl
      const imageToUse = pendingImageUrl || imageUrl;
      
      if (!imageToUse) {
        toast.error('No image available to process.');
        setIsSubmittingMeal(false);
        return;
      }
      
      // For demo URL, process directly without meal picker
      if (pathname === "/demos/calories-count") {
        await processImageDirectly(imageToUse);
        setShowMealPicker(false);
        setAnalysisResult(null);
        setIsSubmittingMeal(false);
        return;
      }
      
      // Always set waiting flag and let useEffect handle the second API call
      // This ensures only one path handles the second API call
      logInfo("CCM: Setting waiting flag for meal processing...");
      setWaitingForFirstApi(true);
      
      // If first API is not complete yet, keep loader active
      if (!isFirstApiComplete) {
        logInfo("CCM: First API still processing, waiting for completion...");
        return;
      }
      
      // If first API is complete, useEffect will handle the rest
      logInfo("CCM: First API already complete, useEffect will handle second API call");
    } catch (error) {
      console.error('CCM: Error processing meal selection:', error);
      toast.error('Failed to process meal selection. Please try again.');
      setIsSubmittingMeal(false);
    }
  };

  // Process meal selection with food_analysis_id
  const processMealWithAnalysisId = useCallback(async (mealKey, foodAnalysisId) => {
    logInfo("CCM: Processing meal selection with food_analysis_id");
    
    try {
      const payload = {
        meal_for: mealKey,
        food_analysis_id: foodAnalysisId
      };
      
      const response = await apiClient.post('/hybrid-food-analysis/food-analyze', payload, {
        headers: {
          "Content-Type": "application/json",
        },
        // timeout: 300000, // 30 second timeout
      });
      setSelectedMealFor(mealKey);
      if (response.status === 200 || response.status === 201) {
        logInfo("CCM: Meal selection processed successfully");
        // The response should contain the updated analysis with meal_for
        // We can store this result or handle it as needed
        const responseData = response?.data || {};
        logInfo("CCM: Meal analysis response:", responseData);
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error) {
      logCritical(`CCM: Error processing meal with analysis ID: ${error}`);
      handleError(error, "meal-processing");
      throw error; // Re-throw to let handleMealSelect handle the error
    } finally {
      logInfo("CCM: Meal processing completed");
    }
  }, []);

  // Show meal picker immediately and upload image in background
  const uploadImageAndShowMealPicker = useCallback(async (imageUrl) => {
    logInfo("CCM: Starting background upload and showing meal picker immediately");
    setAnalysisError(null);
    
    // Set pending image URL immediately
    setPendingImageUrl(imageUrl);
    
    // Show meal picker immediately
    setShowMealPicker(true);
    logInfo("CCM: Meal picker shown immediately");
    
    // Start background upload process (no loading state)
    try {
      // Convert image URL to blob
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      
      // Create FormData for image upload
      const formData = new FormData();
      formData.append("image", blob, "food-image.jpg");
      
      try {
        // Upload image in background
        const uploadResponse = await apiClient.post('/hybrid-food-analysis/upload-food-image', formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 300000, // 30 second timeout
        });

        if (uploadResponse.status === 200 || uploadResponse.status === 201) {
          const uploadData = uploadResponse?.data || {};
          const uploadedImageUrl = uploadData.image_url || uploadData.url;
          const foodAnalysisId = uploadData.food_analysis_id || uploadData.id;
          
          if (uploadedImageUrl) {
            // Update the pending image URL and food analysis ID
            setPendingImageUrl(uploadedImageUrl);
            setPendingFoodAnalysisId(foodAnalysisId);
            setIsFirstApiComplete(true); // Mark first API as complete
            logInfo("CCM: Background image upload completed successfully");
            
            // If user has already selected a meal, useEffect will handle the second API call
            if (selectedMealRef.current) {
              logInfo("CCM: Meal already selected, useEffect will handle second API call");
            }
          } else {
            throw new Error("No image URL returned from upload");
          }
        } else {
          throw new Error(`Upload API returned status ${uploadResponse.status}`);
        }
      } catch (apiError) {
        logCritical(`CCM: api-error-image-upload ${apiError}`);
        // Don't show error immediately, let meal selection handle it
        setAnalysisError('upload_failed');
        setIsFirstApiComplete(true); // Mark as complete even on error
      }
    } catch (error) {
      logCritical(`CCM: Error uploading image: ${error}`);
      setAnalysisError('upload_failed');
      setIsFirstApiComplete(true); // Mark as complete even on error
    } finally {
      setIsUsingFallback(false);
      logInfo("CCM: Background image upload process completed");
    }
  }, [processMealWithAnalysisId, navigate]);

  // Process image directly for demo URL (no meal picker)
  const processImageDirectly = useCallback(async (imageUrl) => {
    logInfo("CCM: Processing image directly for demo");
    setIsProcessing(true);
    setAnalysisError(null);
    
    try {
      // Convert image URL to blob
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      
      // Create FormData for API upload
      const formData = new FormData();
      formData.append("image", blob, "food-image.jpg");
      const url = "/hybrid-food-analysis/demo/food-analyze";
      
      try {
        // Use the configured API client for food analysis
        const apiResponse = await apiClient.post(url, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          // timeout: 300000, // 30 second timeout
        });

        
        if (apiResponse.status === 200 || apiResponse.status === 201) {
          const responseData = apiResponse?.data || {};
          const result = responseData?.analysis;
          const topLevelId = responseData?.id;
          const analysisId = result?.id || topLevelId;
          
          // Check if API explicitly returned success: false
          if (responseData.success === false) {
            setAnalysisError('not_recognized');
            return;
          }
          
          // Determine if the response has any meaningful fields beyond just id
          const meaningfulKeys = [
            'name','calories','carbs','protein','fat','fats','confidence','healthScore',
            'fiber','sugar','sodium','saturatedFat','unsaturatedFat','vitamins','minerals'
          ];
          const hasMeaningfulData = !!(result && meaningfulKeys.some(k => result[k] !== undefined && result[k] !== null && result[k] !== ''));

          // If missing result or only id without meaningful fields → not recognized
          if (!result || !analysisId || !hasMeaningfulData) {
            setAnalysisError('not_recognized');
            return;
          }
          
          const transformedResult = {
            id: analysisId,
            mealName: result.name || "Unknown Food",
            mealType: "Meal",
            calories: result.calories,
            carbs: result.carbs,
            protein: result.protein,
            fats: result.fat,
            healthScore: result.healthScore,
            healthScoreReason: result.healthScoreReason,
            confidence: result.confidence,
            nutritionData: {
              fiber: result.fiber,
              sugar: result.sugar,
              sodium: result.sodium,
              saturatedFat: result.saturatedFat,
              unsaturatedFat: result.unsaturatedFat,
              vitamins: result.vitamins,
              minerals: result.minerals,
            },
            identifiedItems: [
              {
                name: result.name || "Unknown Food",
                amount: result.calories,
                unit: "cal",
                confidence: result.confidence,
              },
            ],
            // Prioritize local image to avoid CORS issues in development
            imageUrl: responseData.image_url || imageUrl,
          };
          
          // For demo, show results directly in the same page
          onImageProcessed?.(transformedResult);
          // Don't reset scanner for demo - let the parent component handle state
        } else {
          throw new Error(`API returned status ${apiResponse.status}`);
        }
      } catch (apiError) {
        logCritical(`CCM: api-error-image-processing ${apiError}`);
        handleError(apiError, "image-processing");
      }
    } catch (error) {
      logCritical(`CCM: Error processing image: ${error}`);
      handleError(error, "image-processing");
    } finally {
      setIsProcessing(false);
      setIsUsingFallback(false);
      logInfo("CCM: Demo image processed");
    }
  }, [onImageProcessed]);

  // Save meal_for update in background
  const saveMealForInBackground = async (analysisId, mealFor) => {
    try {
      if (!analysisId) {
        logWarn("CCM: No analysis ID found, skipping meal_for update");
        return;
      }
      const payload = { meal_for: mealFor };
      const url = `/food-analysis/${analysisId}`;
      apiClient.put(url, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      }).then(() => {
        logInfo("CCM: Meal_for updated successfully in background:", mealFor);
      }).catch((error) => {
        logError("CCM: Failed to update meal_for in background:", error);
      });
    } catch (error) {
      logError("CCM: Error in saveMealForInBackground:", error);
    }
  };

  // Centralized error handling
  const handleError = useCallback((error, context = "general") => {
    console.error(`CCM: Error in ${context}:`, error);

    let errorMessage = "An unexpected error occurred. Please try again.";
    if(error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message.includes('Camera API not supported')) {
      errorMessage = "Camera not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.";
    } else if (error.message.includes('Failed to load camera')) {
      errorMessage = "Failed to load camera. Please try again.";
    } else if (error.message.includes('Failed to capture image')) {
      errorMessage = "Failed to capture image. Please try again.";
    } else if (error.message.includes('Camera not ready')) {
      errorMessage = "Camera not ready. Please wait a moment and try again.";
    } else if (
      error?.name === 'NotAllowedError' ||
      error?.name === 'PermissionDeniedError' ||
      /not allowed by the user agent|permission/i.test(error?.message || '')
    ) {
      errorMessage = "Camera access is blocked. Please allow camera permission in your browser (lock icon → Site settings → Camera → Allow), then reload. On iPhone/iPad Safari: Settings → Safari → Camera → Allow.";
    } else if (error?.name === 'NotFoundError' || /no.*camera|not found/i.test(error?.message || '')) {
      errorMessage = "No camera found. Please connect a camera or try another device.";
    } else if (error?.name === 'NotReadableError') {
      errorMessage = "Camera is in use by another app. Close other apps using the camera and try again.";
    } else {
      errorMessage = `Error: ${error.message}. Please try again.`;
    }
    
    toast.error(errorMessage);
    // Surface a generic error state to show the retry overlay with actions
    setAnalysisError('error');
    // logError(errorMessage, "error-handling");
  }, []);

  // Check browser compatibility on mount
  React.useEffect(() => {
  // Reset scanner state when component mounts
    setCapturedImage(null);
    setUploadedImage(null);
    setIsProcessing(false);
    setIsCameraActive(false);
    setIsCameraLoading(false);
    setAnalysisError(null);
    // Auto-start camera on mount
    (async () => {
      try {
        await getAvailableCameras();
        await startCameraWithFacingMode("environment");
      } catch (e) {
        // handled by start methods
      }
    })();
  }, []);

  // Get available cameras
  const getAvailableCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
    } catch (error) {
      console.error("CCM: Error getting available cameras:", error);
    }
  }, []);

  const shouldMirror = () => {
    // Only mirror the display for front camera preview
    return currentCamera === "user";
  };
  

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (isCameraLoading) return;
    
    const newCamera = currentCamera === "environment" ? "user" : "environment";
    setCurrentCamera(newCamera);
    
    // Restart camera with new facing mode
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    await startCameraWithFacingMode(newCamera);
  }, [currentCamera, isCameraLoading]);

  // Check if flash is supported
  const isFlashSupported = useCallback(() => {
    if (!streamRef.current) return false;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return false;
    
    const capabilities = videoTrack.getCapabilities();
    return capabilities.torch || false;
  }, []);

  // Toggle flash mode
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) return;
    
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;
    
    try {
      const capabilities = videoTrack.getCapabilities();
      if (capabilities.torch) {
        // Cycle through flash modes: off -> on -> auto -> off
        const modes = ["off", "on", "auto"];
        const currentIndex = modes.indexOf(flashMode);
        const newMode = modes[(currentIndex + 1) % modes.length];
        
        setFlashMode(newMode);
        
        // Apply flash mode to camera
        if (newMode === "off") {
          await videoTrack.applyConstraints({
            advanced: [{ torch: false }]
          });
        } else if (newMode === "on") {
          await videoTrack.applyConstraints({
            advanced: [{ torch: true }]
          });
        } else if (newMode === "auto") {
          // For auto mode, we'll let the camera handle it
          await videoTrack.applyConstraints({
            advanced: [{ torch: false }]
          });
        }
      } else {
        logWarn("CCM: Flash not supported on this device");
        toast.info("Flash not supported on this device");
      }
    } catch (error) {
      logWarn("CCM: Error toggling flash:", error);
      toast.error("Failed to toggle flash");
    }
  }, [flashMode]);

  // Start camera with specific facing mode
  const startCameraWithFacingMode = useCallback(async (facingMode) => {
    try {
      logInfo(`CCM: Starting camera with facing mode: ${facingMode}`);
      setIsCameraLoading(true);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        logWarn("CCM: Camera API not supported");
        throw new Error("Camera API not supported");
      }

      // Ensure video element is available
      if (!videoRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!videoRef.current) {
          logWarn("CCM: Video element not found");
          throw new Error("Video element not found");
        }
      }

      // Detect iOS Safari for specific handling
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      const isIOSSafari = isIOS && isSafari;

      let stream;
      try {
        if (isIOSSafari) {
          // iOS Safari optimized settings
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: facingMode,
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              advanced: [
                { torch: flashMode === "on" }
              ]
            }
          });
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
              advanced: [
                { torch: flashMode === "on" }
              ]
            }
          });
        }
      } catch (error) {
        // Final fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          setIsCameraActive(true);
          setIsCameraLoading(false);
        };
        
        videoRef.current.onerror = (error) => {
          logWarn("CCM: Failed to load camera:", error);
          setIsCameraLoading(false);
          handleError(new Error("Failed to load camera"), "camera-loading");
        };
      }
    } catch (error) {
      logWarn("CCM: Error starting camera:", error);
      setIsCameraLoading(false);
      handleError(error, "camera-start");
    }
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    // Get available cameras first
    logInfo("CCM: Starting camera");
    await getAvailableCameras();
    // Start with environment camera (back camera)
    await startCameraWithFacingMode("environment");
    logInfo("CCM: Camera started");
  }, [getAvailableCameras, startCameraWithFacingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    logInfo("CCM: Stopping camera");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    logInfo("CCM: Camera stopped");
  }, []);

  // Take picture
  const takePicture = useCallback(() => {
    logInfo("CCM: Taking picture");
    if (videoRef.current && canvasRef.current && videoRef.current.videoWidth > 0) {
      try {
        const context = canvasRef.current.getContext("2d");
        const video = videoRef.current;

        // Capture full frame at the video's native resolution
        const videoW = video.videoWidth;
        const videoH = video.videoHeight;
        canvasRef.current.width = videoW;
        canvasRef.current.height = videoH;

        context.save();
        if (currentCamera === "user") {
          context.translate(videoW, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, videoW, videoH);
        context.restore();
        
        // Convert to blob
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const imageUrl = URL.createObjectURL(blob);
            setCapturedImage(imageUrl);
            stopCamera();
            // Immediately ask for meal and then send to API with meal_for
            flushSync(() => {
              setPendingImageUrl(imageUrl);
            });
            
            // For demo URL, process directly without meal picker
            if (pathname === "/demos/calories-count") {
              processImageDirectly(imageUrl);
            } else if (preselectedMeal && ['breakfast','lunch','dinner','snack'].includes(String(preselectedMeal).toLowerCase())) {
              // Auto-use preselected meal - upload image first
              uploadImageAndShowMealPicker(imageUrl);
            } else {
              // Upload image first, then show meal picker
              uploadImageAndShowMealPicker(imageUrl);
            }
          } else {
            console.error("Failed to create image blob");
            logWarn("CCM: Failed to create image blob");
            handleError(new Error("Failed to capture image"), "image-capture");
          }
        }, "image/jpeg", 0.9);
      } catch (error) {
        logWarn("CCM: Error taking picture:", error);
        handleError(new Error("Failed to capture image"), "image-capture");
      }
    } else {
      logWarn("CCM: Video not ready for capture");
      handleError(new Error("Camera not ready"), "camera-capture");
    }
    logInfo("CCM: Picture taken");
  }, [stopCamera, currentCamera, processImageDirectly, uploadImageAndShowMealPicker, pathname, preselectedMeal]);

  // Handle file upload
  const handleFileUpload = useCallback((event) => {
    logInfo("CCM: Handling file upload");
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      // Stop camera if it's active to show the uploaded image
      if (isCameraActive) {
        stopCamera();
      }
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);
      logInfo("CCM: File uploaded");
      // Immediately ask for meal and then send to API with meal_for
      flushSync(() => {
        setPendingImageUrl(imageUrl);
      });
      
      // For demo URL, process directly without meal picker
      if (pathname === "/demos/calories-count") {
        processImageDirectly(imageUrl);
      } else if (preselectedMeal && ['breakfast','lunch','dinner','snack'].includes(String(preselectedMeal).toLowerCase())) {
        // Auto-use preselected meal - upload image first
        uploadImageAndShowMealPicker(imageUrl);
      } else {
        // Upload image first, then show meal picker
        uploadImageAndShowMealPicker(imageUrl);
      }
    }
  }, [isCameraActive, stopCamera, processImageDirectly, uploadImageAndShowMealPicker, pathname, preselectedMeal]);

  // Process image for nutrition analysis
  const processImage = useCallback(async (imageUrl) => {
    logInfo("CCM: Processing image");
    setIsProcessing(true);
    setAnalysisError(null);
    
    try {
      // Convert image URL to blob
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      
      // Create FormData for API upload
      const formData = new FormData();
      formData.append("image", blob, "food-image.jpg");
      let url = pathname === "/demos/calories-count" ? "/hybrid-food-analysis/demo/food-analyze" : "/hybrid-food-analysis/food-analyze";
      
      try {
        // Use the configured API client for food analysis
        const apiResponse = await apiClient.post(url, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 300000, // 30 second timeout
        });

        
        if (apiResponse.status === 200 || apiResponse.status === 201) {
          const responseData = apiResponse?.data || {};
          const result = responseData?.analysis;
          const topLevelId = responseData?.id;
          const analysisId = result?.id || topLevelId;
          
          // Check if API explicitly returned success: false
          if (responseData.success === false) {
            setAnalysisError('not_recognized');
            return;
          }
          
          // Determine if the response has any meaningful fields beyond just id
          const meaningfulKeys = [
            'name','calories','carbs','protein','fat','fats','confidence','healthScore',
            'fiber','sugar','sodium','saturatedFat','unsaturatedFat','vitamins','minerals'
          ];
          const hasMeaningfulData = !!(result && meaningfulKeys.some(k => result[k] !== undefined && result[k] !== null && result[k] !== ''));

          // If missing result or only id without meaningful fields → not recognized
          if (!result || !analysisId || !hasMeaningfulData) {
            setAnalysisError('not_recognized');
            return;
          }
          
          const transformedResult = {
            id: analysisId, // Store the analysis ID for later updates
            mealName: result.name || "Unknown Food",
            mealType: "Meal",
            calories: result.calories,
            carbs: result.carbs,
            protein: result.protein,
            fats: result.fat,
            healthScore: result.healthScore,
            healthScoreReason: result.healthScoreReason,
            confidence: result.confidence,
            nutritionData: {
              fiber: result.fiber,
              sugar: result.sugar,
              sodium: result.sodium,
              saturatedFat: result.saturatedFat,
              unsaturatedFat: result.unsaturatedFat,
              vitamins: result.vitamins,
              minerals: result.minerals,
            },
            identifiedItems: [
              {
                name: result.name || "Unknown Food",
                amount: result.calories,
                unit: "cal",
                confidence: result.confidence,
              },
            ],
            // Prioritize local image to avoid CORS issues in development
            imageUrl: responseData.image_url || imageUrl,
          };
          
          // For demo URL, show results directly without meal picker
          if (pathname === "/demos/calories-count") {
            onImageProcessed?.(transformedResult);
            // Don't reset scanner for demo - let the parent component handle state
          } else if (preselectedMeal && ['breakfast','lunch','dinner','snack'].includes(String(preselectedMeal).toLowerCase())) {
            // If a meal is preselected (from dashboard + button), set it and skip modal
            const resultWithMeal = { ...transformedResult, meal_for: String(preselectedMeal).toLowerCase() };
            // Save meal_for in background
            saveMealForInBackground(resultWithMeal.id, resultWithMeal.meal_for);
            // Proceed to results immediately
            onImageProcessed?.(resultWithMeal);
            resetScanner();
          } else {
            // Store the result and show meal picker instead of redirecting
            setAnalysisResult(transformedResult);
            setShowMealPicker(true);
          }
        } else {
          throw new Error(`API returned status ${apiResponse.status}`);
        }
      } catch (apiError) {
        logCritical(`CCM: api-error-image-processing ${apiError}`);
        handleError(apiError, "image-processing");
      }
    } catch (error) {
      logCritical(`CCM: Error processing image: ${error}`);
      handleError(error, "image-processing");
    } finally {
      setIsProcessing(false);
      setIsUsingFallback(false);
      logInfo("CCM: Image processed");
    }
  }, [onImageProcessed, capturedImage, uploadedImage, pathname, preselectedMeal, saveMealForInBackground]);

  // Handle image processing
  const handleProcessImage = useCallback(() => {
    logInfo("CCM: Handling process image");
    const imageToProcess = capturedImage || uploadedImage;
    if (imageToProcess) {
      processImage(imageToProcess);
    } else {
      logError("CCM: No image to process - both capturedImage and uploadedImage are null");
    }
  }, [capturedImage, uploadedImage, processImage]);

  // Reset scanner
  const resetScanner = useCallback(() => {
    // Stop camera if it's active
    if (isCameraActive) {
      stopCamera();
    }
    setCapturedImage(null);
    setUploadedImage(null);
    setIsProcessing(false);
    setIsUsingFallback(false);
    setAnalysisError(null);
    setSelectedMealKey(null); // Clear selected meal
    selectedMealRef.current = null; // Clear ref as well
    setShowScannerLine(false); // Clear scanner line
    setIsFirstApiComplete(false); // Reset first API completion flag
    setWaitingForFirstApi(false); // Reset waiting flag
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [isCameraActive, stopCamera]);

  // Cleanup on unmount
  React.useEffect(() => {
    // Listen for demo-done to reset local state without navigation
    const handleDemoDone = () => {
      if (pathname === "/demos/calories-count") {
        setCapturedImage(null);
        setUploadedImage(null);
        setIsProcessing(false);
        setAnalysisError(null);
        // restart camera for a fresh state
        startCamera().catch(() => {});
      }
    };
    window.addEventListener('foodscan:done', handleDemoDone);

    return () => {
      window.removeEventListener('foodscan:done', handleDemoDone);
      // Stop camera if active
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      // Clean up image URLs
      if (capturedImage) URL.revokeObjectURL(capturedImage);
      if (uploadedImage) URL.revokeObjectURL(uploadedImage);
    };
  }, [capturedImage, uploadedImage]);

  return (
    <div className="fixed inset-0 md:bottom-0 bottom-[45px] bg-black flex flex-col z-[9999]">
      {/* Top Bar - Minimal with Close */}
      <div className="bg-black/90 backdrop-blur-sm px-4 py-4 flex items-center justify-between flex-shrink-0 border-b border-white/15">
        <div className="flex items-center gap-3">
          <button
            aria-label="Close"
            onClick={() => {
              resetScanner();
              if (pathname === "/demos/calories-count") navigate('/demos');
              else navigate('/patient/dashboard');
            }}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/20"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-white text-2xl font-semibold leading-none">
              {t("nutritionResults.caloryCount", "Calory Count")}
            </h1>
          </div>
        </div>
        {/* <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Open Gallery"
          className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors border border-white/25 shadow-sm"
        >
          <Image className="w-6 h-6 text-white" />
        </button> */}
      </div>

      {/* Main Camera Area - Responsive height for all devices */}
      <div className="relative bg-black flex-1 min-h-0">
        {/* No top tabs as per requirement */}
        {/* Camera Video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${
            isCameraActive && !(capturedImage || uploadedImage) ? 'block' : 'hidden'
          }`}
          style={{
            transform: shouldMirror() ? "scaleX(-1)" : "none"
          }}
        />
        
        {/* Placeholder when no image and camera not active */}
        {!isCameraActive && !isCameraLoading && !(capturedImage || uploadedImage) && (
          <div className="w-full h-full bg-gradient-to-b from-black to-gray-900 flex items-center justify-center px-6">
            <div className="flex flex-col items-center text-center max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Camera className="w-7 h-7 text-white/80" />
              </div>
              <h2 className="text-white text-2xl font-semibold">
                {t("foodScanner.title", "Nutrition Scanner")}
              </h2>
              <p className="text-gray-200 text-base mt-2">
                {t("foodScanner.subtitle", "Upload a food photo or use your camera to analyze calories.")}
              </p>
              <p className="text-gray-300 text-sm mt-3"></p>
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => startCamera().catch(() => {})}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors border border-white/20"
                >
                  <Camera className="w-4 h-4" />
                  {t("foodScanner.useCamera", "Use Camera")}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors border border-white/20"
                >
                  <Image className="w-4 h-4" />
                  {t("foodScanner.uploadImage", "Upload Image")}
                </button>
              </div>
              {/* <p className="text-gray-300 text-sm mt-3">
                {t("foodScanner.simpleSteps", "Step 1: Choose a photo. Step 2: Tap Analyze.")}
              </p> */}
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {isCameraLoading && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-3 border-gray-600 rounded-full"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                <p className="text-white font-medium text-sm">
                  {t("foodScanner.loadingCamera", "Starting Camera")}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {t("foodScanner.pleaseWait", "Please wait...")}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Captured/Uploaded Image */}
        {(capturedImage || uploadedImage) && (
          <div className="relative w-full h-full flex items-center justify-center bg-black px-4">
            <img
              src={capturedImage || uploadedImage}
              alt="Food"
              className="max-w-full max-h-full object-contain rounded-xl"
              crossOrigin="anonymous"
              onError={(e) => {
                if (e.target.src.includes('avatarx-bucket.s3.us-east-1.amazonaws.com')) {
                  e.target.src = capturedImage || uploadedImage
                } else {
                  toast.error("Failed to load image. Please try again.");
                }
              }}
            />
            {/* Scanner Line Animation */}
            {showScannerLine && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-black/20 rounded-xl" />
                <div className="scan-glow rounded-xl" />
                {/* Soft glow trail following the scan line */}
                <div className="scan-trail" />
                {/* QR-style vertical scanning line */}
                <div className="scan-line" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="px-5 py-4 md:px-7 md:py-5 rounded-2xl bg-black/70 border border-white/20 backdrop-blur-md text-white text-center"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="text-xl md:text-3xl font-extrabold tracking-wide">
                      {t("foodScanner.processing", "Processing...")}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {analysisError && (
              <div className="absolute inset-0 flex items-center justify-center px-3">
                <div className="max-w-sm w-full bg-black/70 border border-white/15 rounded-xl p-4 text-center text-white backdrop-blur-md">
                  <div className="text-base font-semibold mb-1">
                    {analysisError === 'not_recognized'
                      ? t("foodScanner.notRecognizedTitle", "Image not recognized")
                      : t("foodScanner.errorTitle", "Something went wrong")}
                  </div>
                  <div className="text-xs opacity-90">
                    {analysisError === 'not_recognized'
                      ? t("foodScanner.notRecognizedMessage", "Try a clearer photo.")
                      : t("foodScanner.errorMessage", "Please retry scanning.")}
                  </div>
                  <div className="mt-3 flex justify-center">
                    <button
                      onClick={async () => { try { resetScanner(); await startCamera(); } catch (_) {} }}
                      className="px-3 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      {t("foodScanner.retake", "Retake")}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {isProcessing && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-black/35 rounded-xl" />
                <div className="scan-glow rounded-xl" />
                {/* Soft glow trail following the scan line */}
                <div className="scan-trail" />
                {/* QR-style vertical scanning line */}
                <div className="scan-line" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="px-5 py-4 md:px-7 md:py-5 rounded-2xl bg-black/70 border border-white/20 backdrop-blur-md text-white text-center"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="text-xl md:text-3xl font-extrabold tracking-wide">
                      {t("foodScanner.processing", "Analyzing photo")}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Camera Overlay Elements */}
        {isCameraActive && !(capturedImage || uploadedImage) && (
          <>
            {/* Live Camera Indicator */}
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
              <span className="text-white text-xs font-medium">
                {t("foodScanner.liveCamera", "Live Camera")}
              </span>
            </div>

            {/* Camera Switch Button */}
            {availableCameras.length > 1 && (
              <div className="absolute top-4 right-4">
                <button
                  onClick={switchCamera}
                  disabled={isCameraLoading}
                  className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all hover:bg-black/70 disabled:opacity-50"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            )}

            {/* Scanning Frame Overlay with instruction */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
              <div className="relative w-[80%] h-[70%]">
                {/* Large white corner brackets positioned far apart */}
                <div className="absolute -top-8 -left-8 w-20 h-20 border-l-6 border-t-6 border-white rounded-tl-3xl" />
                <div className="absolute -top-8 -right-8 w-20 h-20 border-r-6 border-t-6 border-white rounded-tr-3xl" />
                <div className="absolute -bottom-8 -left-8 w-20 h-20 border-l-6 border-b-6 border-white rounded-bl-3xl" />
                <div className="absolute -bottom-8 -right-8 w-20 h-20 border-r-6 border-b-6 border-white rounded-br-3xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full">{t("foodScanner.fitInFrame","Fit food in the frame")}</span>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Ready to Analyze Overlay */}
        {(uploadedImage && !isProcessing) && (
          <div className="absolute top-4 left-4 bg-green-500 backdrop-blur-sm rounded-lg px-3 py-1">
            <span className="text-white text-xs font-medium">
              {t("foodScanner.imageReady", "Ready to Analyze")}
            </span>
          </div>
        )}

        {isProcessing && (
          <div className="absolute top-4 left-4 bg-yellow-500 backdrop-blur-sm rounded-lg px-3 py-1">
            <span className="text-white text-xs font-medium">
              {t("foodScanner.processing", "Analyzing...")}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Controls - Responsive height for mobile and desktop */}
      <div className="bg-black/90 backdrop-blur-sm px-4 py-4 md:py-6 flex-shrink-0">
        {/* Ratio selector removed */}
        
        {/* Camera Controls Row */}
        <div className="flex items-center justify-between">
          {/* Left: Gallery */}
          {(isCameraActive || (videoRef.current?.srcObject && !(capturedImage || uploadedImage))) ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center border border-white/25 shadow-sm"
              aria-label="Open Gallery"
            >
              <Image className="w-6 h-6 text-white" />
            </button>
          ) : (
            <div className="w-12" />
          )}

          {/* Center: Shutter */}
          {(isCameraActive || (videoRef.current?.srcObject && !(capturedImage || uploadedImage))) && (
            <button
              onClick={takePicture}
              disabled={!isCameraActive}
              className="w-16 h-16 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Capture"
            >
              <div className="w-12 h-12 bg-white rounded-full border-4 border-gray-200" />
            </button>
          )}

          {/* Right: Flash */}
          {(isCameraActive || (videoRef.current?.srcObject && !(capturedImage || uploadedImage))) && isFlashSupported() ? (
            <button 
              onClick={toggleFlash}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                flashMode === "on" 
                  ? "bg-yellow-500 hover:bg-yellow-600" 
                  : flashMode === "auto"
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-black/30 hover:bg-black/50"
              }`}
              title={`Flash: ${flashMode}`}
              aria-label="Toggle Flash"
            >
              <Zap className={`w-5 h-5 text-white ${flashMode === "on" ? "animate-pulse" : ""}`} />
            </button>
          ) : (
            <div className="w-12" />
          )}
        </div>

        {/* Camera Status Text */}
        {(isCameraActive || (videoRef.current?.srcObject && !(capturedImage || uploadedImage))) && (
          <div className="text-center mt-3">
            <p className="text-xs text-gray-400">
              {isCameraActive 
                ? t("foodScanner.tapToCapture", "Tap to capture photo")
                : t("foodScanner.cameraStarting", "Camera starting up...")
              }
            </p>
          </div>
        )}
        {/* Scan Mode Selector */}
        {/* {!(capturedImage || uploadedImage) && !isCameraLoading && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => setScanMode("food")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                scanMode === "food" 
                  ? "bg-white text-black" 
                  : "bg-black/30 text-white hover:bg-black/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span>Scan food</span>
              </div>
            </button>
            <button
              onClick={() => setScanMode("documents")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                scanMode === "documents" 
                  ? "bg-white text-black" 
                  : "bg-black/30 text-white hover:bg-black/50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button
              onClick={() => setScanMode("gallery")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                scanMode === "gallery" 
                  ? "bg-white text-black" 
                  : "bg-black/30 text-white hover:bg-black/50"
              }`}
            >
              <Image className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScanMode("bookmark")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                scanMode === "bookmark" 
                  ? "bg-white text-black" 
                  : "bg-black/30 text-white hover:bg-black/50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <button
              onClick={() => setScanMode("edit")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                scanMode === "edit" 
                  ? "bg-white text-black" 
                  : "bg-black/30 text-white hover:bg-black/50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        )} */}

        {/* Action Buttons removed (auto-analysis for uploads and captures) */}

        

        {/* Instructions */}
        {/* {!(capturedImage || uploadedImage) && !isCameraLoading && (
          <div className="text-center mt-4">
            <p className="text-xs text-gray-400">
              {t("foodScanner.instructions", "Upload an image or take a photo to analyze")}
            </p>
          </div>
        )} */}

        {/* Reset Button moved next to Analyze for alignment */}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Meal Category Modal */}
      <MealCategoryModal
        open={showMealPicker}
        onClose={() => {
          setShowMealPicker(false);
          setAnalysisResult(null);
          resetScanner();
        }}
        imageUrl={pendingImageUrl}
        onMealSelect={(mealKey) => handleMealSelect(mealKey, pendingImageUrl)}
        isLoading={isSubmittingMeal}
        preselectedMeal={preselectedMeal}
      />
    </div>
  );
};

export default FoodScanner; 