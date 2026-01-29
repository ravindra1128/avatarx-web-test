// DualAxisChart.jsx
import React, { useRef, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  Filler,
  PointElement,
} from 'chart.js';

// Register the required chart elements
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  Filler,
  PointElement
);

const DualAxisChart = ({ data = [], selectedVital = 'All' }) => {
  const chartRef = useRef(null);

  // Build multi-line labels robustly across browsers (no string splitting).
  const dateTimeLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const safeDate = (v) => {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    let lastDate = null;

    return data.map((item, index) => {
      const d = safeDate(item?.vitals_created_at);
      if (!d) return ['—', '—'];

      const parts = fmt.formatToParts(d);
      const pick = (t) => parts.find((p) => p.type === t)?.value ?? '';

      const month = pick('month');
      const day = pick('day');
      const hour = pick('hour');
      const minute = pick('minute');
      const dayPeriod = pick('dayPeriod'); // AM/PM (may be empty if 24h locales)

      const currentDate = `${month} ${day}`.trim();
      const timePart = `${hour}:${minute}${dayPeriod ? ` ${dayPeriod}` : ''}`.trim();

      // Check if this is the same day as the previous reading
      const isSameDay = lastDate === currentDate;
      
      // Update lastDate for next iteration
      lastDate = currentDate;

      // If same day and not the first reading, only show date (no time)
      // if (isSameDay && index > 0) {
      //   return [ '', '']; // Show date, empty time part
      // } else {
        // First reading of the day or first reading overall - show both date and time
        return [currentDate || '', timePart || '—'];
      // }
    });
  }, [data]);

  const getVitalData = (vitalKey) =>
    data.map((item) => item?.[vitalKey] ?? null);

  // Prepare the chart data
  const systolicData = getVitalData('systolic_blood_pressure_mmhg');
  const diastolicData = getVitalData('diastolic_blood_pressure_mmhg');
  const heartRateData = getVitalData('heart_rate_bpm');
  const breathingRateData = getVitalData('breathing_rate_bpm');
  const hrvData = getVitalData('hrv_sdnn_ms');

  // Define all possible datasets
  const allDatasets = [
    {
      label: 'Systolic BP (mmHg)',
      data: systolicData,
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      fill: false,
      yAxisID: 'bp',
      tension: 0.4,
      cubicInterpolationMode: 'monotone',
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: 'rgb(255, 99, 132)',
      pointBorderColor: 'white',
      pointBorderWidth: 2,
      vitalType: 'Blood Pressure',
    },
    {
      label: 'Diastolic BP (mmHg)',
      data: diastolicData,
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      fill: false,
      yAxisID: 'bp',
      tension: 0.4,
      cubicInterpolationMode: 'monotone',
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: 'rgb(54, 162, 235)',
      pointBorderColor: 'white',
      pointBorderWidth: 2,
      vitalType: 'Blood Pressure',
    },
    {
      label: 'Heart Rate (BPM)',
      data: heartRateData,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: false,
      yAxisID: 'hr',
      tension: 0.4,
      cubicInterpolationMode: 'monotone',
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: 'rgb(75, 192, 192)',
      pointBorderColor: 'white',
      pointBorderWidth: 2,
      vitalType: 'Heart Rate',
    },
    {
      label: 'Breathing Rate (BPM)',
      data: breathingRateData,
      borderColor: 'rgb(153, 102, 255)',
      backgroundColor: 'rgba(153, 102, 255, 0.2)',
      fill: false,
      yAxisID: 'br',
      tension: 0.4,
      cubicInterpolationMode: 'monotone',
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: 'rgb(153, 102, 255)',
      pointBorderColor: 'white',
      pointBorderWidth: 2,
      vitalType: 'Breathing Rate',
    },
    {
      label: 'HRV (ms)',
      data: hrvData,
      borderColor: 'rgb(255, 159, 64)',
      backgroundColor: 'rgba(255, 159, 64, 0.2)',
      fill: false,
      yAxisID: 'hrv',
      tension: 0.4,
      cubicInterpolationMode: 'monotone',
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: 'rgb(255, 159, 64)',
      pointBorderColor: 'white',
      pointBorderWidth: 2,
      vitalType: 'HRV',
    },
  ];

  // Filter datasets based on selected vital
  const getFilteredDatasets = () => {
    if (selectedVital === 'All') return allDatasets;
    return allDatasets.filter((d) => d.vitalType === selectedVital);
  };

  const visibleAxes = (() => {
    const axes = { bp: false, hr: false, br: false, hrv: false };
    getFilteredDatasets().forEach((d) => (axes[d.yAxisID] = true));
    return axes;
  })();

  const chartData = {
    labels: dateTimeLabels, // array -> renders as two-line labels
    datasets: getFilteredDatasets(),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    stacked: false,
    plugins: {
      title: { display: true, text: 'Vital Signs Over Time' },
      legend: {
        position: 'top',
        align: 'center',
        labels: {
          boxWidth: 12,
          padding: 8,
          font: { size: 11 },
        },
      },
    },
    scales: {
      bp: {
        type: 'linear',
        display: !!visibleAxes.bp,
        position: 'left',
        grid: { display: false },
        title: { display: !!visibleAxes.bp, text: 'Blood Pressure (mmHg)' },
      },
      hr: {
        type: 'linear',
        display: false,
        position: 'left',
        grid: { display: false },
        title: { display: false, text: 'Heart Rate (BPM)' },
      },
      br: {
        type: 'linear',
        display: false,
        position: 'left',
        grid: { display: false },
        title: { display: false, text: 'Breathing Rate (BPM)' },
      },
      hrv: {
        type: 'linear',
        display: false,
        position: 'left',
        grid: { display: false },
        title: { display: false, text: 'HRV (ms)' },
      },
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          // No callback needed; Chart.js will render each label array on two lines.
          font: { size: 11, weight: 'bold' },
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
};

export default DualAxisChart;
