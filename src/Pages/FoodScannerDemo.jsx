import React, { useState } from "react";
import { Camera, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../Component/UI/button";
import FoodScanner from "../Component/FoodScanner";
import NutritionResults from "../Component/NutritionResults";

const FoodScannerDemo = () => {
  const { t } = useTranslation();
  const [showScanner, setShowScanner] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scannedImage, setScannedImage] = useState(null);
  const [nutritionResults, setNutritionResults] = useState(null);

  const handleImageProcessed = (results) => {
    setNutritionResults(results);
    // Store the current image from the scanner
    const currentImage = results?.imageUrl || null;
    setScannedImage(currentImage);
    setShowScanner(false);
    setShowResults(true);
  };

  const handleScannerClose = () => {
    setShowScanner(false);
  };

  const handleResultsClose = () => {
    setShowResults(false);
    setScannedImage(null);
    setNutritionResults(null);
  };

  const handleEditResults = () => {
    // Reset and show scanner again
    setShowResults(false);
    setScannedImage(null);
    setNutritionResults(null);
    setShowScanner(true);
  };

  const handleDone = () => {
    // TODO: Implement save functionality
    console.log("Done clicked", nutritionResults);
    setShowResults(false);
    setScannedImage(null);
    setNutritionResults(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t("foodScannerDemo.title", "Food Scanner Demo")}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("foodScannerDemo.description", "Scan your food to get instant nutritional information. Take a picture or upload an image to analyze calories, carbs, protein, and fats.")}
          </p>
        </div>

        {/* Demo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Scanner Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t("foodScannerDemo.scannerTitle", "Food Scanner")}
              </h3>
              <p className="text-gray-600">
                {t("foodScannerDemo.scannerDescription", "Take a picture or upload an image of your food to analyze its nutritional content.")}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {t("foodScannerDemo.feature1", "Camera Capture")}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t("foodScannerDemo.feature1Desc", "Use your device camera to take a picture")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {t("foodScannerDemo.feature2", "Image Upload")}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t("foodScannerDemo.feature2Desc", "Upload existing images from your gallery")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {t("foodScannerDemo.feature3", "AI Analysis")}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t("foodScannerDemo.feature3Desc", "Get instant nutritional breakdown")}
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => setShowScanner(true)}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Camera className="w-5 h-5 mr-2" />
              {t("foodScannerDemo.startScanning", "Start Scanning")}
            </Button>
          </div>

          {/* Results Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t("foodScannerDemo.resultsTitle", "Nutrition Results")}
              </h3>
              <p className="text-gray-600">
                {t("foodScannerDemo.resultsDescription", "View detailed nutritional information including calories, macros, and health score.")}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">615</div>
                  <div className="text-sm text-gray-600">
                    {t("foodScannerDemo.calories", "Calories")}
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">93g</div>
                  <div className="text-sm text-gray-600">
                    {t("foodScannerDemo.carbs", "Carbs")}
                  </div>
                </div>
                <div className="bg-pink-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-pink-600">11g</div>
                  <div className="text-sm text-gray-600">
                    {t("foodScannerDemo.protein", "Protein")}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">21g</div>
                  <div className="text-sm text-gray-600">
                    {t("foodScannerDemo.fats", "Fats")}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    {t("foodScannerDemo.healthScore", "Health Score")}
                  </span>
                  <span className="text-sm font-bold text-gray-900">7/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "70%" }} />
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                {t("foodScannerDemo.demoNote", "This is a demo. Scan food to see real results.")}
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {t("foodScannerDemo.featuresTitle", "Key Features")}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {t("foodScannerDemo.feature1Title", "Easy Scanning")}
              </h3>
              <p className="text-gray-600 text-sm">
                {t("foodScannerDemo.feature1Text", "Simply point your camera at food or upload an image to get started.")}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {t("foodScannerDemo.feature2Title", "Instant Results")}
              </h3>
              <p className="text-gray-600 text-sm">
                {t("foodScannerDemo.feature2Text", "Get detailed nutritional information in seconds.")}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {t("foodScannerDemo.feature3Title", "Health Insights")}
              </h3>
              <p className="text-gray-600 text-sm">
                {t("foodScannerDemo.feature3Text", "Understand the health impact of your food choices.")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showScanner && (
        <FoodScanner
          onClose={handleScannerClose}
          onImageProcessed={handleImageProcessed}
        />
      )}

      {showResults && (
        <NutritionResults
          results={nutritionResults}
          foodImage={scannedImage}
          onClose={handleResultsClose}
          onEdit={handleEditResults}
          onDone={handleDone}
        />
      )}
    </div>
  );
};

export default FoodScannerDemo; 