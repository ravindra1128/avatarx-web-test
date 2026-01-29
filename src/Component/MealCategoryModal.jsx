import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MealCategoryModal = ({ 
  open, 
  onClose, 
  onMealSelect, 
  imageUrl,
  isLoading = false,
  isUploading = false,
  preselectedMeal = null
}) => {
  const { t } = useTranslation();
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [isMealSelected, setIsMealSelected] = useState(false);

  const mealOptions = [
    { key: 'breakfast', label: t('nutritionResults.breakfast', 'Breakfast'), emoji: '🥪' },
    { key: 'lunch', label: t('nutritionResults.lunch', 'Lunch'), emoji: '🍛' },
    { key: 'dinner', label: t('nutritionResults.dinner', 'Dinner'), emoji: '🥗' },
    { key: 'snack', label: t('nutritionResults.snack', 'Snack'), emoji: '🥨' },
  ];

  const handleMealSelect = (mealKey) => {
    setSelectedMeal(mealKey);
    setIsMealSelected(true);
  };

  const handleDone = async () => {
    if (selectedMeal) {
      try {
        await onMealSelect(selectedMeal, imageUrl);
      } catch (error) {
        console.error('Error processing meal selection:', error);
        setSelectedMeal(null);
        setIsMealSelected(false);
      }
    }
  };

  // Auto-select preselected meal when modal opens
  React.useEffect(() => {
    if (open && preselectedMeal && ['breakfast', 'lunch', 'dinner', 'snack'].includes(String(preselectedMeal).toLowerCase())) {
      const mealKey = String(preselectedMeal).toLowerCase();
      setSelectedMeal(mealKey);
      setIsMealSelected(true);
    }
  }, [open, preselectedMeal]);

  // Reset selected meal when modal closes or loading stops
  React.useEffect(() => {
    if (!isLoading) {
      setSelectedMeal(null);
      setIsMealSelected(false);
    }
  }, [isLoading]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm mx-4 shadow-xl relative">
        {/* Close Button */}
        {/* <button
          aria-label="Close"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-3 right-3 w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ×
        </button> */}

        {/* Title */}
        <div className="text-center text-2xl font-bold text-gray-900 mb-4">
          {t('nutritionResults.eatItFor', 'Eat it for')}
        </div>

        {/* Meal Options */}
        <div className="space-y-3">
          {mealOptions.map(meal => {
            const isThisMealSelected = selectedMeal === meal.key;
            
            return (
              <button
                key={meal.key}
                onClick={() => handleMealSelect(meal.key)}
                disabled={isLoading}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-colors ${
                  isThisMealSelected 
                    ? 'bg-black border-2 border-black text-white' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="text-2xl" aria-hidden>{meal.emoji}</span>
                <span className="text-lg font-semibold">{meal.label}</span>
                {isThisMealSelected && (
                  <div className="ml-auto">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <span className="text-black text-sm">✓</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Done Button */}
        <div className="mt-6">
          <button
            onClick={handleDone}
            disabled={isLoading || !isMealSelected}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-black hover:bg-gray-800 text-white rounded-2xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t("common.saving", "Saving...")}</span>
              </>
            ) : (
              <span>{t("common.done", "Done")}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealCategoryModal;