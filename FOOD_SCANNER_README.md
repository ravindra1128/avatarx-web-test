# Food Scanner Components

This project includes a complete food scanning and nutrition analysis system with the following components:

## Components

### 1. FoodScanner (`src/Component/FoodScanner.jsx`)

A modal component that provides camera capture and image upload functionality for food scanning.

**Features:**
- Camera capture with live preview
- Image upload from gallery
- Multiple scan modes (food, document, gallery)
- Flash control
- Real-time image processing
- Confidence scoring for food detection

**Props:**
- `onClose`: Function called when the scanner is closed
- `onImageProcessed`: Function called with analysis results when image is processed

**Usage:**
```jsx
import FoodScanner from './Component/FoodScanner';

const [showScanner, setShowScanner] = useState(false);

const handleImageProcessed = (results) => {
  console.log('Analysis results:', results);
  // Handle the nutrition analysis results
};

{showScanner && (
  <FoodScanner
    onClose={() => setShowScanner(false)}
    onImageProcessed={handleImageProcessed}
  />
)}
```

### 2. NutritionResults (`src/Component/NutritionResults.jsx`)

A modal component that displays detailed nutritional analysis results.

**Features:**
- Nutritional breakdown (calories, carbs, protein, fats)
- Health score with visual progress bar
- Quantity adjustment
- Identified food items overlay
- Edit and save functionality
- **NEW**: Detailed nutrition information (fiber, sugar, sodium, vitamins, minerals)
- **NEW**: Confidence scoring display
- **NEW**: Expandable detailed nutrition section

**Props:**
- `results`: Nutrition analysis data
- `foodImage`: URL of the scanned food image
- `onClose`: Function called when results are closed
- `onEdit`: Function called when "Fix Results" is clicked
- `onDone`: Function called when "Done" is clicked

**Usage:**
```jsx
import NutritionResults from './Component/NutritionResults';

const [showResults, setShowResults] = useState(false);
const [nutritionData, setNutritionData] = useState(null);

{showResults && (
  <NutritionResults
    results={nutritionData}
    foodImage={scannedImage}
    onClose={() => setShowResults(false)}
    onEdit={() => console.log('Edit results')}
    onDone={() => console.log('Save results')}
  />
)}
```

### 3. FoodScannerDemo (`src/Pages/FoodScannerDemo.jsx`)

A complete demo page that showcases both components working together.

**Features:**
- Interactive demo interface
- Feature explanations
- Sample nutrition data
- Complete workflow demonstration

**Route:** `/food-scanner-demo`

## API Integration

The components are designed to work with a food analysis API. The API endpoint is configured to work with the `/food-analysis/analyze` endpoint.

**API Endpoint:**
```
POST /food-analysis/analyze
Content-Type: multipart/form-data
Body: FormData with "image" field
```

**Expected API Response Format:**
```json
{
  "id": "daea7ee6-557b-437c-b8f2-0cd331b9960d",
  "detectedFood": "burger",
  "confidence": 0.98,
  "calories": 354,
  "nutritionData": {
    "calories": 354,
    "protein": "17g",
    "carbs": "30g",
    "fat": "20g",
    "fiber": "2g",
    "sugar": "5g",
    "sodium": "530mg",
    "saturatedFat": "8g",
    "unsaturatedFat": "12g",
    "vitamins": {
      "Vitamin D": "0.2μg",
      "Vitamin C": "1mg",
      "Vitamin B12": "2.5μg"
    },
    "minerals": {
      "Potassium": "200mg",
      "Calcium": "100mg",
      "Iron": "3.5mg",
      "Omega-3": "0.1g"
    }
  },
  "imageUrl": "https://avatarx-bucket.s3.us-east-1.amazonaws.com/food-images/48cbff5f-426f-412b-a861-c318e8b0a039-eaa97904abd2208caf660b23833511cf"
}
```

**Transformed Response Format (for UI):**
```json
{
  "id": "daea7ee6-557b-437c-b8f2-0cd331b9960d",
  "mealName": "burger",
  "mealType": "Meal",
  "calories": 354,
  "carbs": 30,
  "protein": 17,
  "fats": 20,
  "healthScore": 10,
  "confidence": 0.98,
  "nutritionData": { /* original nutritionData object */ },
  "identifiedItems": [
    {
      "name": "burger",
      "amount": 354,
      "unit": "cal",
      "confidence": 0.98
    }
  ],
  "imageUrl": "https://..."
}
```

## Implementation Steps

1. **API Configuration**: The system uses the configured `apiClient` from `src/config/APIConfig.js`
2. **Error Handling**: Graceful fallback to mock data when API is unavailable
3. **Data Transformation**: API response is transformed to match UI expectations
4. **Enhanced UI**: New detailed nutrition display with vitamins, minerals, and confidence scoring

## Features

### Camera Functionality
- Live camera preview
- Photo capture
- Flash control
- Camera permissions handling
- iOS Safari optimization

### Image Upload
- File picker integration
- Image validation
- Preview functionality

### Nutrition Analysis
- **Calorie calculation** with confidence scoring
- **Macronutrient breakdown** (carbs, protein, fats)
- **Health scoring** based on confidence
- **Food item identification** with confidence levels
- **NEW**: Detailed nutrition metrics (fiber, sugar, sodium)
- **NEW**: Vitamin and mineral breakdown
- **NEW**: Expandable detailed nutrition section
- **NEW**: Enhanced food name display with proper capitalization

### User Experience
- Modal-based interface
- Responsive design
- Loading states
- Error handling
- **NEW**: Confidence indicators
- **NEW**: Detailed nutrition toggle
- **NEW**: Enhanced visual feedback

## New Features

### Confidence Scoring
- **High Confidence** (≥90%): Green indicator
- **Medium Confidence** (70-89%): Yellow indicator  
- **Low Confidence** (<70%): Red indicator

### Detailed Nutrition
- **Fiber, Sugar, Sodium** metrics
- **Saturated/Unsaturated Fat** breakdown
- **Vitamin content** (Vitamin D, C, B12, etc.)
- **Mineral content** (Potassium, Calcium, Iron, Omega-3, etc.)
- **Expandable section** for detailed view

### Enhanced UI
- **Confidence badges** on food images
- **Detailed nutrition toggle** button
- **Color-coded confidence** indicators
- **Improved layout** for nutrition data 