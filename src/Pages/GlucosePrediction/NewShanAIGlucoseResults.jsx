import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const NewShanAIGlucoseResults = () => {
  const location = useLocation();
  const { shenaiResults, glucoseResults, ppgSignal } = location.state || {};

  useEffect(() => {
    // If no data in state, redirect back after a short delay
    const timer = setTimeout(() => {
      if (!shenaiResults) {
        console.warn('No ShanAI results found, redirecting...');
        window.location.href = '/demos/glucose-prediction';
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [shenaiResults]);

  if (!shenaiResults) {
    return (
      <div className="p-5 text-center">
        <p>Loading results...</p>
      </div>
    );
  }

  // Helper function to format values
  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return value;
  };

  // Helper function to get unit explanation
  const getUnitExplanation = (metric) => {
    const explanations = {
      'Heart Rate (HR)': 'Beats per minute (number of heartbeats per minute)',
      'Heart Rate Variability': 'Milliseconds (time variation between heartbeats)',
      'Breathing Rate (BR)': 'Breaths per minute (number of breaths per minute)',
      'Stress Index': 'Unitless calculated index for stress level',
      'Blood Pressure (SBP/DBP)': 'Millimeters of mercury (pressure in the arteries)',
      'Cardiac Workload': 'Millimeters of mercury per second (work to pump blood)',
      'Parasympathetic Activity': 'Percentage (level of relaxation and recovery)',
      'PPG Signal': 'Millivolts (voltage of the PPG signal)'
    };
    return explanations[metric] || '';
  };

  // Prepare ShanAI results data
  const shenaiData = [
    {
      metric: 'Heart Rate (HR)',
      value: shenaiResults.heart_rate_bpm,
      unit: 'bpm',
      unitExplanation: getUnitExplanation('Heart Rate (HR)')
    },
    // {
    //   metric: 'Heart Rate Variability',
    //   value: shenaiResults.hrv_sdnn_ms,
    //   unit: 'ms',
    //   unitExplanation: getUnitExplanation('Heart Rate Variability')
    // },
    {
      metric: 'Breathing Rate (BR)',
      value: shenaiResults.breathing_rate_bpm || shenaiResults.breathing_rate,
      unit: 'bpm',
      unitExplanation: getUnitExplanation('Breathing Rate (BR)')
    },
    // {
    //   metric: 'Stress Index',
    //   value: shenaiResults.stress_index,
    //   unit: '(index)',
    //   unitExplanation: getUnitExplanation('Stress Index')
    // },
    {
      metric: 'Blood Pressure (SBP/DBP)',
      value: shenaiResults.systolic_blood_pressure_mmhg && shenaiResults.diastolic_blood_pressure_mmhg
        ? `${shenaiResults.systolic_blood_pressure_mmhg} / ${shenaiResults.diastolic_blood_pressure_mmhg}`
        : null,
      unit: 'mmHg',
      unitExplanation: getUnitExplanation('Blood Pressure (SBP/DBP)')
    },
    // {
    //   metric: 'Cardiac Workload',
    //   value: shenaiResults.cardiac_workload_mmhg_per_sec,
    //   unit: 'mmHg/s',
    //   unitExplanation: getUnitExplanation('Cardiac Workload')
    // },
    // {
    //   metric: 'Parasympathetic Activity',
    //   value: shenaiResults.parasympathetic_activity,
    //   unit: '%',
    //   unitExplanation: getUnitExplanation('Parasympathetic Activity')
    // },
    // {
    //   metric: 'PPG Signal',
    //   value: shenaiResults.average_signal_quality,
    //   unit: 'mV',
    //   unitExplanation: getUnitExplanation('PPG Signal')
    // },
    {
      metric: 'Patient height',
      value: shenaiResults.height_cm,
      unit: 'cm',
      unitExplanation: getUnitExplanation('Patient height')
    },
    {
      metric: 'Patient weight',
      value: shenaiResults.weight_kg,
      unit: 'kg',
      unitExplanation: getUnitExplanation('Patient weight')
    },
    {
      metric: 'Patient age',
      value: shenaiResults.age_years,
      unit: 'years',
      unitExplanation: getUnitExplanation('Patient age')
    },
    {
      metric: 'Patient BMI',
      value: shenaiResults.bmi_kg_per_m2,
      unit: 'kg/m2',
      unitExplanation: getUnitExplanation('Patient BMI')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:py-10 sm:px-5 pt-20">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md p-4 sm:p-6 md:p-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 text-gray-800 text-center">
           Glucose Prediction Results
        </h1>
        <p className="text-center text-gray-600 mb-6 sm:mb-8 md:mb-10 text-sm sm:text-base">
          Your vital signs and glucose prediction based on ShanAI measurement
        </p>

        {/* Glucose Prediction Card */}
        {glucoseResults && (
          <div className="mb-6 bg-white border-2 border-gray-300 rounded-xl shadow-md p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 flex items-center">
              <span className="mr-2">📊</span>
              Glucose Prediction Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Glucose Prediction</div>
                <div className="text-3xl font-bold text-[#56B0B0]">
                  {formatValue(glucoseResults.glucose_clamped)} <span className="text-lg text-gray-500">mg/dL</span>
                </div>
              </div> */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Blood Glucose level </div>
                <div className="text-2xl font-semibold text-gray-800">
                  {glucoseResults.glucose}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ShanAI Results Card */}
        <div className="mb-6 bg-white border-2 border-gray-300 rounded-xl shadow-md p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-800 flex items-center">
            <span className="mr-2">❤️</span>
            Vital Signs Results
          </h2>
          
          {/* Desktop Table Layout */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300" style={{ minWidth: '600px' }}>
              <thead>
                <tr className="bg-[#56B0B0] text-white">
                  <th className="p-4 text-left border border-gray-300 font-bold">Metric</th>
                  <th className="p-4 text-center border border-gray-300 font-bold">Value</th>
                  <th className="p-4 text-center border border-gray-300 font-bold">Unit</th>
                  <th className="p-4 text-left border border-gray-300 font-bold">Unit Explanation</th>
                </tr>
              </thead>
              <tbody>
                {shenaiData.map((row, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  >
                    <td className="p-4 border border-gray-300 font-medium text-gray-800">
                      {row.metric}
                    </td>
                    <td className={`p-4 text-center border border-gray-300 ${row.value !== null && row.value !== undefined ? 'text-gray-800 font-semibold' : 'text-gray-400'}`}>
                      {row.value}
                    </td>
                    <td className="p-4 text-center border border-gray-300 text-gray-600">
                      {row.unit}
                    </td>
                    <td className="p-4 border border-gray-300 text-gray-600 text-xs">
                      {row.unitExplanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PPG Signal Info */}
        {/* {ppgSignal && Array.isArray(ppgSignal) && ppgSignal.length > 0 && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">PPG Signal Information</h3>
            <p className="text-sm text-gray-600">
              Signal samples captured: <span className="font-semibold">{ppgSignal.length}</span>
            </p>
          </div>
        )} */}

        <div className="mt-8 sm:mt-10 md:mt-12 text-center">
          <button
            onClick={() => window.location.href = '/data-capture'}
            className="px-6 py-3 bg-black text-white border-none rounded-lg text-base sm:text-lg font-bold cursor-pointer transition-colors duration-200 hover:bg-gray-800 active:bg-[#3d7d7d] w-full sm:w-auto"
          >
            Back to Glucose Prediction
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewShanAIGlucoseResults;

