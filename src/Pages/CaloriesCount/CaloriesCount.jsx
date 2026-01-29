import React, { useState, useEffect } from 'react';
import { Camera, Plus, Edit, Check, X, Activity, Flame, Apple, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FoodScanner from '../../Component/FoodScanner';
import NutritionResults from '../../Component/NutritionResults';
import { Button } from '../../Component/UI/button';
import MobileNavigation from '../../Component/MobileNavigation';
import apiClient from '../../config/APIConfig';
import { useNavigate, useLocation } from 'react-router-dom';

const CaloriesCount = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showFoodScanner, setShowFoodScanner] = useState(true); // Directly open camera
  const [showNutritionResults, setShowNutritionResults] = useState(false);
  const [scannedImage, setScannedImage] = useState(null);
  const [nutritionResults, setNutritionResults] = useState(null);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [dailyMacros, setDailyMacros] = useState({
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  });
  const [meals, setMeals] = useState([]);
  const {pathname} = useLocation();

  // Food Scanner Handlers
  const handleImageProcessed = (results) => {
    setNutritionResults(results);
    const currentImage = results?.imageUrl || null;
    setScannedImage(currentImage);
    setShowFoodScanner(false); // Hide scanner when showing results
    setShowNutritionResults(true);
    
    // Add to meals and update daily totals
    if (results) {
      const newMeal = {
        id: Date.now(),
        name: results.mealName || 'Scanned Food',
        calories: results.calories || 0,
        protein: results.protein || 0,
        carbs: results.carbs || 0,
        fat: results.fat || 0,
        fiber: results.fiber || 0,
        image: currentImage,
        timestamp: new Date().toISOString()
      };
      
      setMeals(prev => [...prev, newMeal]);
      updateDailyTotals(newMeal);
    }
  };

  const updateDailyTotals = (meal) => {
    setDailyCalories(prev => prev + meal.calories);
    setDailyMacros(prev => ({
      protein: prev.protein + meal.protein,
      carbs: prev.carbs + meal.carbs,
      fat: prev.fat + meal.fat,
      fiber: prev.fiber + meal.fiber
    }));
  };

  const handleFoodScannerClose = () => {
    setShowFoodScanner(false);
  };

  const handleNutritionResultsClose = () => {
    setShowNutritionResults(false);
    setScannedImage(null);
    setNutritionResults(null);
  };

  const handleEditResults = () => {
    // Reset and show scanner again
    setShowNutritionResults(false);
    setScannedImage(null);
    setNutritionResults(null);
    setShowFoodScanner(true);
  };

  const handleDone = async (updatedPayload) => {
    try {
      // If no change, just close and navigate
      if (updatedPayload?.noChange) {
        setShowNutritionResults(false);
        setScannedImage(null);
        setNutritionResults(null);
        setShowFoodScanner(true);
        navigate(pathname === "/demos/calories-count" ? "/demos/calories-count" : '/patient/dashboard');
        return;
      }

      // Skip backend update for demo routes
      const isDemo = pathname?.includes('/demos/');
      const analysisId = nutritionResults?.id || nutritionResults?._id;
      if (!isDemo && analysisId) {
        const url = `/food-analysis/${encodeURIComponent(analysisId)}`;
        // Ensure meal_for is included when available (from updated payload or current results)
        const mealFor = (updatedPayload && updatedPayload.meal_for) || nutritionResults?.meal_for;
        const mergedPayload = { ...(updatedPayload || {}) };
        if (mealFor) mergedPayload.meal_for = mealFor;

        // Send only defined fields
        const cleanPayload = Object.fromEntries(Object.entries(mergedPayload).filter(([_, v]) => v !== undefined));
        try { await apiClient.put(url, cleanPayload); } catch (_) {}
      }
    } finally {
      setShowNutritionResults(false);
      setScannedImage(null);
      setNutritionResults(null);
      setShowFoodScanner(true); // Open camera again for next scan
      navigate(pathname === "/demos/calories-count" ? "/demos/calories-count" : '/patient/dashboard');
    }
  };

  const removeMeal = (mealId) => {
    const mealToRemove = meals.find(meal => meal.id === mealId);
    if (mealToRemove) {
      setDailyCalories(prev => prev - mealToRemove.calories);
      setDailyMacros(prev => ({
        protein: prev.protein - mealToRemove.protein,
        carbs: prev.carbs - mealToRemove.carbs,
        fat: prev.fat - mealToRemove.fat,
        fiber: prev.fiber - mealToRemove.fiber
      }));
      setMeals(prev => prev.filter(meal => meal.id !== mealId));
    }
  };

  const resetDaily = () => {
    setDailyCalories(0);
    setDailyMacros({
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    });
    setMeals([]);
  };

  return (
    <>
    <div className="bg-gray-50 py-8 px-4 pb-[200px]">
      {/* Add bottom padding to prevent content from hiding behind mobile navigation */}

      {showFoodScanner && (
        <FoodScanner
          onClose={handleFoodScannerClose}
          onImageProcessed={handleImageProcessed}
        />
      )}

      {/* Nutrition Results Modal */}
      {showNutritionResults && (
        <NutritionResults
          results={nutritionResults}
          foodImage={scannedImage}
          onClose={handleNutritionResultsClose}
          onEdit={handleEditResults}
          onDone={handleDone}
        />
      )}
    </div>
    <MobileNavigation />
    </>
  );
};

export default CaloriesCount;
