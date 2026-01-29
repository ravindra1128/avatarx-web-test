import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Info, Flame, Weight, Settings, MessageSquareText, Loader2, Trash2 } from "lucide-react";
import FeedbackModal from "./FeedbackModal";
import apiClient from "../config/APIConfig";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";

const NutritionResults = ({ 
  results, 
  onClose, 
  onEdit, 
  onDone,
  onDelete,
  foodImage 
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [quantity, setQuantity] = useState(() => {
    const initial = Number(results?.consumed_count);
    return Number.isFinite(initial) && initial > 0 ? initial : 1;
  });
  const [showDetailedNutrition, setShowDetailedNutrition] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [pendingConsumeAmount, setPendingConsumeAmount] = useState(() => {
    const initial = Number(results?.consumed_count);
    return Number.isFinite(initial) && initial > 0 ? initial : 1;
  });
  // Track initial quantity to detect changes
  const initialQuantity = React.useMemo(() => {
    const initial = Number(results?.consumed_count);
    return Number.isFinite(initial) && initial > 0 ? initial : 1;
  }, [results?.consumed_count]);
  // Mock data structure - replace with actual API response
  const nutritionData = results;

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Close modal when navigating to dashboard
  useEffect(() => {
    const handleNavigation = (event) => {
      // Check if navigation is to dashboard
      if (event.detail?.pathname === '/patient/dashboard' || 
          window.location.pathname === '/patient/dashboard') {
        onClose();
      }
    };

    // Listen for custom navigation events
    window.addEventListener('navigation', handleNavigation);
    
    // Also listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleNavigation);
    
    return () => {
      window.removeEventListener('navigation', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [onClose]);

  const handleQuantityChange = (increment) => {
    const newQuantity = Math.max(1, quantity + increment);
    setQuantity(newQuantity);
  };

  const calculateAdjustedNutrition = (value, type) => {
    const extractNumber = (raw) => {
      if (raw === null || raw === undefined) return NaN;
      if (typeof raw === "number") return raw;
      if (typeof raw === "string") {
        // Remove common unit strings and extract the first numeric token
        const cleaned = raw.replace(/kcal|calories|grams?|g|mg|μg|ug|mcg|%/gi, " ");
        const match = cleaned.match(/-?\d+(?:\.\d+)?/);
        return match ? parseFloat(match[0]) : NaN;
      }
      return NaN;
    };

    const base = extractNumber(value);
    if (Number.isNaN(base)) return "Unknown";

    const total = base * quantity;
    if (!Number.isFinite(total)) return "Unknown";
    return total % 1 !== 0 ? total.toFixed(2) : total;
  };

  // Calculate calories or grams for a specific consumed amount without changing state
  const calculateForAmount = (value, amount) => {
    const extractNumber = (raw) => {
      if (raw === null || raw === undefined) return NaN;
      if (typeof raw === "number") return raw;
      if (typeof raw === "string") {
        const cleaned = raw.replace(/kcal|calories|grams?|g|mg|μg|ug|mcg|%/gi, " ");
        const match = cleaned.match(/-?\d+(?:\.\d+)?/);
        return match ? parseFloat(match[0]) : NaN;
      }
      return NaN;
    };
    const base = extractNumber(value);
    if (Number.isNaN(base)) return "Unknown";
    const total = base * (Number(amount) || 0);
    if (!Number.isFinite(total)) return "Unknown";
    return total % 1 !== 0 ? total.toFixed(2) : total;
  };

  const openConsumeModal = () => {
    setPendingConsumeAmount(quantity);
    setShowConsumeModal(true);
  };

  const handleConsumeDone = () => {
    const newQty = Number(pendingConsumeAmount);
    if (Number.isFinite(newQty) && newQty > 0) {
      setQuantity(newQty);
    }
    setShowConsumeModal(false);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return "text-green-600";
    if (confidence >= 0.7) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.9) return "High";
    if (confidence >= 0.7) return "Medium";
    return "Low";
  };

  const buildUpdatedPayload = () => {
    const nutritionData = results;
    const pick = (obj, key) => (obj && obj[key] !== undefined && obj[key] !== null ? obj[key] : undefined);
    const safeNum = (val) => {
      const n = Number(val);
      return Number.isFinite(n) ? n : undefined;
    };
    const adj = (raw) => {
      const v = calculateAdjustedNutrition(raw);
      return v === 'Unknown' ? undefined : v;
    };

    const payload = {};
    const detectedFood = pick(nutritionData, 'mealName') || pick(nutritionData, 'title');
    if (detectedFood) payload.detectedFood = detectedFood;
    // Include meal_for if available on results or nested nutritionData
    const mealFor = pick(nutritionData, 'meal_for') || pick(nutritionData?.nutritionData, 'meal_for');
    if (mealFor) payload.meal_for = String(mealFor);
    const caloriesAdj = adj(nutritionData.calories);
    if (caloriesAdj !== undefined) payload.calories = safeNum(caloriesAdj);
    const healthScore = pick(nutritionData, 'healthScore');
    if (healthScore !== undefined) payload.healthScore = healthScore;
    const confidence = pick(nutritionData, 'confidence');
    if (confidence !== undefined) payload.confidence = confidence;

    const nutrition = {};
    const proteinAdj = adj(nutritionData.protein);
    if (proteinAdj !== undefined) nutrition.protein = `${proteinAdj} g`;
    const carbsAdj = adj(nutritionData.carbs);
    if (carbsAdj !== undefined) nutrition.carbs = `${carbsAdj} g`;
    const fatsRaw = nutritionData.fat ?? nutritionData.fats;
    const fatAdj = adj(fatsRaw);
    if (fatAdj !== undefined) nutrition.fat = `${fatAdj} g`;

    if (nutritionData.nutritionData) {
      const nd = nutritionData.nutritionData;
      // Adjust detailed nutrition values by quantity (except vitamins/minerals which are usually percentages)
      if (nd.fiber) nutrition.fiber = adj(nd.fiber);
      if (nd.sugar) nutrition.sugar = adj(nd.sugar);
      if (nd.sodium) nutrition.sodium = adj(nd.sodium);
      if (nd.saturatedFat) nutrition.saturatedFat = adj(nd.saturatedFat);
      if (nd.unsaturatedFat) nutrition.unsaturatedFat = adj(nd.unsaturatedFat);
      // Keep vitamins and minerals as-is since they're usually percentages
      if (nd.vitamins) nutrition.vitamins = nd.vitamins;
      if (nd.minerals) nutrition.minerals = nd.minerals;
    }

    if (Object.keys(nutrition).length > 0) payload.nutrition = nutrition;
    // include consumed_count as the selected quantity
    if (Number.isFinite(quantity) && quantity > 0) payload.consumed_count = quantity;
    return payload;
  };

  const handleDoneClick = async (forceSave = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Check if quantity has actually changed
      const hasQuantityChanged = quantity !== initialQuantity;

      if (forceSave || hasQuantityChanged) {
        // Only call API if quantity has changed
        const updatedPayload = buildUpdatedPayload();
        try { window.dispatchEvent(new CustomEvent('foodscan:done')); } catch (_) {}
        await onDone?.(updatedPayload);
      } else {
        // If no change, just close the modal without API call
        try { window.dispatchEvent(new CustomEvent('foodscan:done')); } catch (_) {}
        await onDone?.({ noChange: true });
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  const submitFeedback = async (text) => {
    try {
      await apiClient.post('food-analysis/feedback', { feedback: text });
      try { toast.success('Thanks for your feedback!'); } catch (_) {}
    } catch (error) {
      logError("CCM: Error submitting feedback:", error);
    } finally {
      setShowFeedback(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete?.();
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex flex-col z-[9998]"
      onTouchMove={(e) => e.preventDefault()}
      onWheel={(e) => e.preventDefault()}
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Spacer to push content to bottom */}
      <div className="flex-1"></div>
      
      {/* Modal Content */}
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-xl mx-auto" 
        style={{ 
          maxHeight: 'calc(90vh - 50px)', // Account for MobileNavigation height
          marginBottom: 'calc(50px + 0.50rem)', // MobileNavigation height + very small gap
          minHeight: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
        onTouchMove={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-4 p-6 border-b border-gray-100">
          <button
            aria-label="Back"
            onClick={() => {
              onClose();
              // Only navigate to dashboard if not on demo page
              if (!location.pathname.includes('/demos/')) {
                navigate('/patient/dashboard');
              }
            }}
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-10 sm:h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-center text-2xl font-bold text-gray-900">
            {t("nutritionResults.analysisResults", "Analysis Results")}
          </h2>
          <button
            onClick={() => setShowFeedback(true)}
            aria-label="Feedback"
            title={t('common.feedback','Feedback')}
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-10 sm:h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <MessageSquareText className="w-5 h-5" />
          </button>
          
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Food Image */}
        {foodImage && (
          <div className="relative p-4 sm:p-6">
            <div className="w-full flex justify-center">
              <div className="w-[90%] sm:w-[86%] max-w-[360px] rounded-3xl border border-gray-200 bg-white overflow-hidden">
                <div className="w-full h-64 sm:h-72 md:h-80 bg-gray-50 flex items-center justify-center">
                <img
                  src={foodImage}
                  alt="Food"
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                />
                </div>
              </div>
            </div>
            
            {/* Confidence Badge */}
            {/* {nutritionData.confidence && (
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getConfidenceColor(nutritionData.confidence).replace('text-', 'bg-')}`}></div>
                  <span className={`text-xs font-medium ${getConfidenceColor(nutritionData.confidence)}`}>
                    {getConfidenceText(nutritionData.confidence)} Confidence
                  </span>
                </div>
              </div>
            )} */}
          </div>
        )}

        {/* Meal Summary Card + Counter */}
        <div className="px-4 sm:px-6">
          <div className="w-full">
            <div className="relative mb-6 w-full rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-left text-2xl font-bold text-gray-900 capitalize">
                  {nutritionData.mealName || nutritionData.title || "Food"}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    className="w-12 h-12 sm:w-10 sm:h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-xl hover:bg-gray-100 transition-colors"
                    onClick={() => handleQuantityChange(-1)}
                    aria-label="Decrease"
                  >
                    -
                  </button>
                  <div className="text-xl font-semibold w-8 text-center">{quantity}</div>
                  <button
                    className="w-12 h-12 sm:w-10 sm:h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-xl hover:bg-gray-100 transition-colors"
                    onClick={() => handleQuantityChange(1)}
                    aria-label="Increase"
                  >
                    +
                  </button>
                  <button
                    className="w-12 h-12 sm:w-10 sm:h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors"
                    onClick={handleDeleteClick}
                    aria-label="Delete"
                    title="Delete this food item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-left text-sm leading-6 mb-4 text-gray-600">
                {(() => {
                  const desc = nutritionData.description;
                  const ingredients = Array.isArray(nutritionData.ingredients)
                    ? nutritionData.ingredients.join(', ')
                    : nutritionData.ingredients;
                  const fallback = nutritionData.mealType;
                  return desc || ingredients || fallback || "";
                })()}
              </p>
              {/* Calories summary */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold text-gray-900 leading-none">
                      {nutritionData.calories === "Unknown" ? "Unknown" : calculateAdjustedNutrition(nutritionData.calories, "calories")}
                    </div>
                    <div className="text-gray-600 text-base mt-1">Calories</div>
                  </div>
                </div>
              </div>

              {/* Macro chips */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Protein', value: nutritionData.protein, key: 'protein' },
                  { label: 'Carbs', value: nutritionData.carbs, key: 'carbs' },
                  { label: 'Fats', value: (nutritionData.fat ?? nutritionData.fats), key: 'fat' },
                ].map((row) => (
                  <div key={row.key} className="bg-white border border-gray-200 rounded-2xl p-3 text-center">
                    <div className="text-sm text-gray-500 mb-1">{row.label}</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {row.value === 'Unknown' ? 'Unknown' : `${calculateAdjustedNutrition(row.value, row.key)}g`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional nutrition cards */}
              <div className="grid grid-cols-4 gap-3 mt-3">
                {[
                  { label: 'Fiber', value: nutritionData.nutritionData?.fiber, key: 'fiber' },
                  { label: 'Sugar', value: nutritionData.nutritionData?.sugar, key: 'sugar' },
                  { label: 'Sat. Fat', value: nutritionData.nutritionData?.saturatedFat, key: 'saturatedFat' },
                  { label: 'Sodium', value: nutritionData.nutritionData?.sodium, key: 'sodium' },
                ].filter(row => row.value !== undefined && row.value !== null).map((row) => (
                  <div key={row.key} className="bg-white border border-gray-200 rounded-2xl p-3 text-center">
                    <div className="text-sm text-gray-500 mb-1">{row.label}</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {row.value === 'Unknown' ? 'Unknown' : `${calculateAdjustedNutrition(row.value, row.key)}g`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ingredients section */}
          {/* <div className="mb-6">
            <div className="flex items-center justify-between text-gray-900 text-base mb-2 px-1">
              <span>Ingredients</span>
              <span className="text-gray-500 text-sm">+ Add more</span>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-3">
              <div className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-700">
                {(nutritionData.mealName || 'Item')} • {nutritionData.calories === 'Unknown' ? 'Unknown' : `${calculateAdjustedNutrition(nutritionData.calories, 'calories')} cal`}
              </div>
            </div>
          </div> */}

          {/* Detailed Nutrition Toggle */}
          {/* {nutritionData.nutritionData && (
            <div className="mb-3">
              <button
                onClick={() => setShowDetailedNutrition(!showDetailedNutrition)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <Info className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900 text-sm">
                    Detailed Nutrition
                  </span>
                </div>
                <ChevronLeft className={`w-4 h-4 text-gray-600 transition-transform ${showDetailedNutrition ? 'rotate-90' : ''}`} />
              </button>
            </div>
          )} */}

          {/* Detailed Nutrition Information (same row UI) */}
          {showDetailedNutrition && nutritionData.nutritionData && (
            <div className="mb-6">
              <div className="rounded-2xl overflow-hidden bg-white">
                {[
                  ...(nutritionData.nutritionData.fiber ? [{ label: 'Fiber', value: nutritionData.nutritionData.fiber, key: 'fiber' }] : []),
                  ...(nutritionData.nutritionData.sugar ? [{ label: 'Sugar', value: nutritionData.nutritionData.sugar, key: 'sugar' }] : []),
                  ...(nutritionData.nutritionData.sodium ? [{ label: 'Sodium', value: nutritionData.nutritionData.sodium, key: 'sodium' }] : []),
                  ...(nutritionData.nutritionData.saturatedFat ? [{ label: 'Saturated Fat', value: nutritionData.nutritionData.saturatedFat, key: 'saturatedFat' }] : [])
                ].map((row) => (
                  <div key={row.key} className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-gray-900 text-base">{row.label}</span>
                    <span className="text-gray-900 font-semibold text-base tabular-nums">
                      {row.value === 'Unknown' ? 'Unknown' : row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Health Score */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <div className={`w-3 h-3 bg-green-500 rounded-full ${nutritionData.healthScore <= 5 ? 'bg-red-500' : nutritionData.healthScore > 5 && nutritionData.healthScore < 8 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {t("nutritionResults.healthScore", "Health Score")}
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {nutritionData.healthScore}/10
              </span>
            </div>
            <div className="w-full bg-white rounded-full h-2 shadow-inner">
              <div
                className={`bg-green-500 h-2 rounded-full transition-all duration-300 ${nutritionData.healthScore <= 5 ? 'bg-red-500' : nutritionData.healthScore > 5 && nutritionData.healthScore < 8 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${(nutritionData.healthScore / 10) * 100}%` }}
              />
            </div>
            {nutritionData.healthScoreReason && (
              <div className="mt-2 text-sm text-gray-700">
                {nutritionData.healthScoreReason}
              </div>
            )}
            {/* <div className="mt-2 text-xs">
              {nutritionData.healthScore <= 5 && (
                <span className="text-red-600 font-medium">
                  {t("nutritionResults.poor", "Poor nutritional value - consider healthier alternatives")}
                </span>
              )}
              {nutritionData.healthScore > 5 && nutritionData.healthScore < 8 && (
                <span className="text-yellow-600 font-medium">
                  {t("nutritionResults.fair", "Fair nutritional value - room for improvement")}
                </span>
              )}
              {nutritionData.healthScore >= 8 && (
                <span className="text-green-600 font-medium">
                  {t("nutritionResults.excellent", "Excellent choice! Great nutritional value")}
                </span>
              )}
            </div> */}
          </div>
        </div>
        </div>

        {/* Bottom Action - Consumed/Eat buttons (replaces Done) */}
        <div className="bg-white p-3 border-t border-gray-100" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <div className="flex gap-3 items-center">
            <button
              onClick={openConsumeModal}
              className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 text-gray-900 bg-white hover:bg-gray-50"
            >
              <div className="flex flex-col leading-tight items-center">
                <span className="text-sm font-semibold">{t('nutritionResults.consumedAmount', 'Consumed')}</span>
                <span className="text-sm font-semibold">{t('nutritionResults.consumedAmount', 'amount:')}{quantity === 1 ? '1' : quantity === 0.75 ? '3/4' : quantity === 0.5 ? '1/2' : quantity === 0.25 ? '1/4' : quantity}</span>
                </div>
            </button>
            <button
              onClick={() => handleDoneClick(false)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-5 rounded-2xl bg-gray-900 text-white text-base font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('common.saving', 'Saving...')}
                </span>
              ) : (
                t('nutritionResults.eatIt', 'Eat it')
              )}
            </button>
          </div>
        </div>
      </div>

  {/* Consume Amount Modal */}
  {showConsumeModal && (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
      onClick={() => setShowConsumeModal(false)}
      onTouchMove={(e) => e.preventDefault()}
      onWheel={(e) => e.preventDefault()}
      style={{ overscrollBehavior: 'contain' }}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-5 shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          aria-label="Close"
          onClick={() => setShowConsumeModal(false)}
          disabled={isSubmitting}
          className="absolute top-3 right-3 w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ×
        </button>
        {/* <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" /> */}
        <div className="text-center text-xl font-bold text-gray-900 mb-4">
          {t('nutritionResults.consumedAmount', 'Consumed Amount')}
        </div>
        <div className="space-y-3">
          {[1, 0.75, 0.5, 0.25].map((amt) => (
            <button
              key={amt}
              onClick={() => setPendingConsumeAmount(amt)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border text-left transition-colors ${pendingConsumeAmount === amt ? 'bg-green-100 border-green-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
            >
              <span className="text-lg font-semibold text-gray-900">
                {amt === 1 ? '1' : amt === 0.75 ? '3/4' : amt === 0.5 ? '1/2' : '1/4'}
              </span>
              <span className="text-gray-600">
                {nutritionData.calories === 'Unknown' ? '' : `${calculateForAmount(nutritionData.calories, amt)} kcal`}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-5">
          <button
            onClick={handleConsumeDone}
            disabled={isSubmitting}
            className="w-full px-4 py-4 rounded-2xl bg-gray-900 text-white text-base font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('common.saving', 'Saving...')}
              </span>
            ) : (
              t('common.done', 'Done')
            )}
          </button>
        </div>
      </div>
    </div>
  )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onTouchMove={(e) => e.preventDefault()}
          onWheel={(e) => e.preventDefault()}
          style={{ overscrollBehavior: 'contain' }}
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("nutritionResults.deleteConfirm.title", "Delete Food Item")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t("nutritionResults.deleteConfirm.message", "Are you sure you want to delete this food item? This action cannot be undone.")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("common.deleting", "Deleting...")}
                    </span>
                  ) : (
                    t("common.delete", "Delete")
                  )}

  
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FeedbackModal
        open={showFeedback}
        title={t('common.feedback','Feedback')}
        placeholder={t('common.typeFeedback','Type your feedback...')}
        submitLabel={t('common.submit','Submit')}
        onClose={() => setShowFeedback(false)}
        onSubmit={submitFeedback}
      />
    </div>
  );
};

export default NutritionResults; 