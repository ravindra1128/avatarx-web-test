import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

const BpTrendsChart = ({ data }) => {
  // Helper function to format dates
  const formatDate = (dateValue) => {
    if (!dateValue) return '';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return dateValue; // Return original if invalid date
      
      // Always format as "Jan 15" or "Jan 15, 2024" if different year
      const currentYear = new Date().getFullYear();
      const dateYear = date.getFullYear();
      
      if (dateYear === currentYear) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch (error) {
      return dateValue; // Return original if formatting fails
    }
  };

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-gray-400 text-sm mb-2">No BP trend data</div>
        <div className="text-xs text-gray-500">Change the filter or add BP readings</div>
      </div>
    );
  }

  const { labels, systolicValues, diastolicValues } = useMemo(() => {
    const labels = data.map((item, idx) => {
      const dateValue = item?.label || item?.date || item?.day;
      if (dateValue) {
        return formatDate(dateValue);
      }
      return `Item ${idx + 1}`;
    });
    
    const systolicValues = data.map((item) => {
      if (typeof item?.systolic_bp === 'number') return item.systolic_bp;
      if (typeof item?.systolic === 'number') return item.systolic;
      const num = parseFloat(item?.systolic_bp || item?.systolic);
      return Number.isFinite(num) ? num : 0;
    });
    
    const diastolicValues = data.map((item) => {
      if (typeof item?.diastolic_bp === 'number') return item.diastolic_bp;
      if (typeof item?.diastolic === 'number') return item.diastolic;
      const num = parseFloat(item?.diastolic_bp || item?.diastolic);
      return Number.isFinite(num) ? num : 0;
    });
    
    return { labels, systolicValues, diastolicValues };
  }, [data]);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Systolic BP',
        data: systolicValues,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
      },
      {
        label: 'Diastolic BP',
        data: diastolicValues,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 }
        }
      },
      tooltip: { 
        enabled: true,
        callbacks: {
          title: (tooltipItems) => {
            const item = tooltipItems[0];
            const dataIndex = item.dataIndex;
            const originalDate = data[dataIndex]?.label || data[dataIndex]?.date || data[dataIndex]?.day;
            
            if (originalDate) {
              try {
                const date = new Date(originalDate);
                if (!isNaN(date.getTime())) {
                  return date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                }
              } catch (error) {
                // Fallback to original date
              }
            }
            return tooltipItems[0].label;
          },
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y} mmHg`;
          }
        }
      },
      title: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          autoSkip: true, 
          maxTicksLimit: 8, 
          includeBounds: true,
          color: '#6b7280', 
          font: { size: 11 }
        },
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          color: '#6b7280',
          callback: (value) => `${value} mmHg`,
        },
      },
    },
  };

  return (
    <div className="w-full h-[160px] mb-4">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default BpTrendsChart;