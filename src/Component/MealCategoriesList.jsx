import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import FoodScanCard from './Cards/FoodScanCard';
import { Camera, Plus, Loader2 } from 'lucide-react';

const MealCategoriesList = ({ 
  analyses = [], 
  isLoading = false,
  onItemClick,
  pendingPreviewUrl,
  pendingProgress = 0,
  pendingPhase,
  pendingMealFor
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Group food items by meal type
  const groupItemsByMeal = (scans) => {
    const mealGroups = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
      other: [] // for items without meal_for
    };
    
    scans.forEach(scan => {
      const nutritionData = (() => {
        try {
          return JSON.parse(scan.nutrition_data || scan.nutrition_data_json || '{}');
        } catch (e) {
          return {};
        }
      })();
      
      const mealFor = nutritionData.meal_for || scan.meal_for;
      
      // Only add to specific meal groups if meal_for is exactly one of the predefined types
      if (mealFor && ['breakfast', 'lunch', 'dinner', 'snack'].includes(mealFor.toLowerCase())) {
        mealGroups[mealFor.toLowerCase()].push(scan);
      } else {
        // Add everything else to "other" - this includes items without meal_for or with different values
        mealGroups.other.push(scan);
      }
    });
    
    return mealGroups;
  };

  // Calculate total calories for a meal group
  const calculateMealCalories = (items) => {
    return items.reduce((sum, scan) => {
      const nutritionData = (() => {
        try {
          return JSON.parse(scan.nutrition_data || scan.nutrition_data_json || '{}');
        } catch (e) {
          return {};
        }
      })();
      const calories = Number(scan.calories) || Number(nutritionData.calories) || 0;
      return sum + calories;
    }, 0);
  };

  // Meal configuration
  const mealConfig = {
    breakfast: {
      emoji: '🥪',
      label: t('nutritionResults.breakfast', 'Breakfast'),
      showAsGrid: true
    },
    lunch: {
      emoji: '🍛',
      label: t('nutritionResults.lunch', 'Lunch'),
      showAsGrid: true
    },
    dinner: {
      emoji: '🥗',
      label: t('nutritionResults.dinner', 'Dinner'),
      showAsGrid: true
    },
    snack: {
      emoji: '🥨',
      label: t('nutritionResults.snack', 'Snack'),
      showAsGrid: true
    },
    other: {
      emoji: '🍽️',
      label: t('patientDashboard.recentlyLogged', 'Recently Logged'),
      showAsGrid: false
    }
  };

  // Hide "Recently Logged" by excluding 'other' from render order
  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
  const mealGroups = groupItemsByMeal(analyses);

  // Handle opening nutrition details
  const handleItemClick = (scan) => {
    if (onItemClick) {
      onItemClick(scan);
    }
  };

  // Render meal category card
  const renderMealCategory = (mealType) => {
    const items = mealGroups[mealType];
    const config = mealConfig[mealType];
    const totalCalories = calculateMealCalories(items);
    const isEmpty = items.length === 0;

    return (
      <div id={`meal-${mealType}`} key={mealType} className={`bg-white border border-gray-200 rounded-xl ${isEmpty ? 'p-3' : 'p-4'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between ${isEmpty ? 'mb-2' : 'mb-3'}`}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{config.emoji}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{config.label}</h3>
              <p className="text-sm text-gray-600">{totalCalories} Calories</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/patient/check-calories', { state: { preselectedMeal: mealType } })}
            className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors relative"
          >
            <Camera className="w-8 h-8" aria-hidden />
            <span className="absolute -top-0.5 -right-0.5 w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center">
              <Plus className="w-4 h-4" aria-hidden />
            </span>
          </button>
        </div>
        
        {/* Content */}
        {items.length > 0 || (pendingPreviewUrl && pendingMealFor === mealType) ? (
          config.showAsGrid ? (
            // Grid layout for meal categories
            <div className="flex flex-wrap gap-2">
              {pendingPreviewUrl && pendingMealFor === mealType && (
                <div className="w-16 h-16 rounded-lg overflow-hidden relative">
                  <img src={pendingPreviewUrl} alt="preview" className="w-full h-full object-cover opacity-70" crossOrigin="anonymous" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-white/40" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32" />
                        <path className="text-white" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray={`${Math.min(99, Math.max(1, Math.round(pendingProgress)))}, 100`} d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-[10px] font-semibold">{Math.min(99, Math.max(1, Math.round(pendingProgress)))}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {items.map((scan, index) => {
                const isAnalysisIncomplete = scan.analysis_complete === 0;
                const isNotDetected = !scan.detected_food && (!scan.nutrition_data || scan.status === 'not_detected');
                
                // Show loader for incomplete analyses first
                if (isAnalysisIncomplete) {
                  return (
                    <div
                      key={scan.id || `incomplete-${index}`}
                      className="w-16 h-16 rounded-lg overflow-hidden relative"
                    >
                      {scan.image_url ? (
                        <img src={scan.image_url} alt="analyzing" className="w-full h-full object-cover opacity-70" crossOrigin="anonymous" />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    </div>
                  );
                }
                
                if (isNotDetected) {
                  return (
                    <div
                      key={scan.id || `nd-${index}`}
                      className="w-16 h-16 rounded-lg overflow-hidden relative cursor-pointer"
                      onClick={() => navigate('/patient/check-calories')}
                    >
                      {scan.image_url ? (
                        <img src={scan.image_url} alt="failed scan" className="w-full h-full object-cover opacity-50" crossOrigin="anonymous" />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-red-500 text-xs font-bold">Retake</span>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div
                    key={scan.id || index}
                    className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => handleItemClick(scan)}
                  >
                    <img
                      src={scan.image_url}
                      alt={scan.detected_food || 'Food item'}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            // List layout for "other" category
            <div className="space-y-2">
              {items.map((scan, index) => {
                const isAnalysisIncomplete = scan.analysis_complete === 0;
                const isNotDetected = !scan.detected_food && (!scan.nutrition_data || scan.status === 'not_detected');
                
                // Show loader for incomplete analyses first
                if (isAnalysisIncomplete) {
                  return (
                    <div
                      key={scan.id || `incomplete-${index}`}
                      className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-4"
                    >
                      <div className="flex h-36 sm:h-40">
                        <div className="w-36 sm:w-40 h-full bg-gray-100 flex-shrink-0 relative">
                          {scan.image_url ? (
                            <img src={scan.image_url} alt="analyzing" className="w-full h-full object-cover opacity-70" crossOrigin="anonymous" />
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          </div>
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between">
                            <div className="text-base font-semibold text-gray-700 pr-3">Analyzing...</div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">Processing your food image</div>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                if (isNotDetected) {
                  return (
                    <div
                      key={scan.id || `nd-${index}`}
                      className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-4 cursor-pointer"
                      onClick={() => navigate('/patient/check-calories')}
                    >
                      <div className="flex h-36 sm:h-40">
                        <div className="w-36 sm:w-40 h-full bg-gray-100 flex-shrink-0 relative">
                          {scan.image_url ? (
                            <img src={scan.image_url} alt="failed scan" className="w-full h-full object-cover opacity-50" crossOrigin="anonymous" />
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-red-500 text-sm font-bold">Retake</span>
                          </div>
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between">
                            <div className="text-base font-semibold text-red-500 pr-3">Scan Failed</div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">Tap to retake photo</div>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                const imageUrl = scan.image_url || scan.imageUrl || scan.preview_url;
                return (
                  <FoodScanCard
                    key={scan.id || index}
                    type="item"
                    scan={{
                      ...scan,
                      image_url: imageUrl
                    }}
                    onClick={() => handleItemClick(scan)}
                  />
                );
              })}
              {pendingPreviewUrl && pendingMealFor === mealType && (
                <FoodScanCard
                  key={`pending-${mealType}`}
                  type="pending"
                  previewUrl={pendingPreviewUrl}
                  progress={pendingProgress}
                  phase={pendingPhase}
                />
              )}
            </div>
          )
        ) : (
          // Empty state
          <div className="text-center py-2">
            {/* <p className="text-sm text-gray-500">
              {t('patientDashboard.noFoodYet', 'No food logged yet')}
            </p> */}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {mealOrder.map(mealType => (
          <div key={mealType} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div>
                  <div className="h-5 w-20 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mealOrder.map(renderMealCategory)}
    </div>
  );
};

export default MealCategoriesList;