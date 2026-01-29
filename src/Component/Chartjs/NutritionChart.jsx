import React, { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, Filler, PointElement } from 'chart.js';

// Register the required chart elements
ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, Filler, PointElement);

const NutritionChart = ({ data, selectedVital = 'All' }) => {
  const chartRef = useRef(null);

  // Validate data before rendering
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <p className="text-xl font-medium mb-2">No nutrition data available</p>
        <p className="text-sm text-gray-500">Try scanning some food to see your nutrition trends</p>
      </div>
    );
  }

  // Check if we have any valid nutrition data
  const hasValidData = data.some(item => 
    item.vital_data && 
    (item.vital_data.calories || item.vital_data.carbs || item.vital_data.protein || item.vital_data.fat)
  );

  if (!hasValidData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <p className="text-xl font-medium mb-2">Invalid nutrition data format</p>
        <p className="text-sm text-gray-500">Please check the data structure</p>
      </div>
    );
  }

  // Utility function to extract data in user's local timezone
  const getDates = (data) => {
    const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return data.map((item) => {
      const utcDate = new Date(item?.vitals_created_at);
      const localDate = isNaN(utcDate.getTime()) ? '' : dateTimeFormatter.format(utcDate);
      const parts = typeof localDate === 'string' ? localDate.split(', ') : [];
      const datePart = parts[0] ?? '';
      const timePart = parts[1] ?? '';
      return [`${datePart}`, timePart];
    });
  };

  const getNutritionData = (data, nutritionKey) => {
    return data.map((item) => {
      if (nutritionKey === 'calories') {
        const value = item.calories;
        return value || 0; // Fallback to 0 if undefined
      } else {
        // For carbs, protein, fat - extract numeric value from "23g" format
        const value = item.nutritionData[nutritionKey];
        if (typeof value === 'string' && value.includes('g')) {
          return parseInt(value.replace('g', '')) || 0;
        }
        return value || 0; // Fallback to 0 if undefined
      }
    });
  };

  // Prepare the chart data
  const dateTimeLabels = getDates(data);
  const caloriesData = getNutritionData(data, 'calories');
  const carbsData = getNutritionData(data, 'carbs');
  const proteinData = getNutritionData(data, 'protein');
  const fatData = getNutritionData(data, 'fat');


  // Define all possible datasets
  const allDatasets = [
    {
      label: 'Calories',
      data: caloriesData,
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      fill: false,
      yAxisID: 'calories',
      tension: 0.4,
      cubicInterpolationMode: 'monotone',
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: 'rgb(239, 68, 68)',
      pointBorderColor: 'white',
      pointBorderWidth: 2,
      nutritionType: 'Calories'
    },
    {
      label: 'Carbs (g)',
      data: carbsData,
      borderColor: 'rgb(249, 115, 22)',
      backgroundColor: 'rgba(249, 115, 22, 0.2)',
      fill: false,
      yAxisID: 'macros',
      tension: 0.4,
      cubicInterpolationMode: 'monotone',
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: 'rgb(249, 115, 22)',
      pointBorderColor: 'white',
      pointBorderWidth: 2,
      nutritionType: 'Carbs'
    },
    {
      label: 'Protein (g)',
      data: proteinData,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      fill: false,
      yAxisID: 'macros',
      tension: 0.4,
      cubicInterpolationMode: 'monotone',
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: 'rgb(59, 130, 246)',
      pointBorderColor: 'white',
      pointBorderWidth: 2,
      nutritionType: 'Protein'
    },
    {
      label: 'Fat (g)',
      data: fatData,
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      fill: false,
      yAxisID: 'macros',
      tension: 0.4,
      cubicInterpolationMode: 'monotone',
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: 'rgb(34, 197, 94)',
      pointBorderColor: 'white',
      pointBorderWidth: 2,
      nutritionType: 'Fat'
    }
  ];

  // Filter datasets based on selected nutrition metric
  const getFilteredDatasets = () => {
    
    if (selectedVital === 'All') {
      return allDatasets;
    }
    
    const filtered = allDatasets.filter(dataset => dataset.nutritionType === selectedVital);
    return filtered;
  };

  const chartData = {
    labels: dateTimeLabels,
    datasets: getFilteredDatasets(),
  };

  // Get visible y-axes based on selected datasets
  const getVisibleYAxes = () => {
    const visibleDatasets = getFilteredDatasets();
    const visibleAxes = {};
    
    visibleDatasets.forEach(dataset => {
      if (dataset.yAxisID === 'calories') visibleAxes.calories = true;
      if (dataset.yAxisID === 'macros') visibleAxes.macros = true;
    });
    
    return visibleAxes;
  };

  const visibleAxes = getVisibleYAxes();

  const config = {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      stacked: false,
      plugins: {
        title: {
          display: true,
          text: selectedVital === 'All' ? 'All Nutrition Trends Over Time' : `${selectedVital} Trends Over Time`,
        },
        legend: {
          position: 'top',
          align: 'center',
          labels: {
            boxWidth: 12,
            padding: 8,
            font: {
              size: 11
            }
          }
        }
      },
      scales: {
        calories: {
          type: 'linear',
          display: visibleAxes.calories,
          position: 'left',
          reverse: false,
          grid: {
            display: false
          },
          beginAtZero: true,
          min: 0,
          title: {
            display: visibleAxes.calories,
            text: 'Calories',
          },
          ticks: {
            callback: function(value) {
              return value.toLocaleString() + ' cal';
            }
          }
        },
        macros: {
          type: 'linear',
          display: visibleAxes.macros,
          position: 'right',
          reverse: false,
          grid: {
            display: false
          },
          beginAtZero: true,
          min: 0,
          title: {
            display: visibleAxes.macros,
            text: 'Macronutrients (g)',
          },
          ticks: {
            callback: function(value) {
              return value + 'g';
            }
          }
        },
        x: {
          grid: {
            display: true
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            callback: function(val, index) {
              const label = dateTimeLabels[index];
              return Array.isArray(label) ? [String(label[0] ?? ''), String(label[1] ?? '')] : (label ?? '');
            },
            font: {
              size: 11,
              weight: 'bold'
            }
          }
        }
      },
    },
  };

  return (
    <div>         
      <div style={{ width: '100%', height: '400px' }}>
        <Line ref={chartRef} data={chartData} options={config.options} />
      </div>
    </div>
  );
};

export default NutritionChart;
