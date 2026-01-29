import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

const CalorieTrendsChart = ({ data }) => {
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
        <div className="text-gray-400 text-sm mb-2">No trend data</div>
        <div className="text-xs text-gray-500">Change the filter or add calorie logs</div>
      </div>
    );
  }

  const { labels, values } = useMemo(() => {
    const labels = data.map((item, idx) => {
      const dateValue = item?.label || item?.date || item?.day;
      if (dateValue) {
        return formatDate(dateValue);
      }
      return `Item ${idx + 1}`;
    });
    const values = data.map((item) => {
      if (typeof item?.calories === 'number') return item.calories;
      if (typeof item?.value === 'number') return item.value;
      if (typeof item?.count === 'number') return item.count;
      const num = parseFloat(item?.calories || item?.value || item?.count);
      return Number.isFinite(num) ? num : 0;
    });
    return { labels, values };
  }, [data]);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Calories',
        data: values,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
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
            return `Calories: ${context.parsed.y}`;
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
          callback: (value) => `${value}`,
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

export default CalorieTrendsChart;


