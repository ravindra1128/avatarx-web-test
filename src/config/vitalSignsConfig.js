export const ALERT_FIELDS = {
  SYSTOLIC_BP: 'systolic_blood_pressure_mmhg',
  DIASTOLIC_BP: 'diastolic_blood_pressure_mmhg',
  HEART_RATE: 'heart_rate_bpm',
  BREATHING_RATE: 'breathing_rate_bpm',
  HRV: 'hrv_sdnn_ms'
};

export const vitalSignsConfig = {
  thresholds: {
    systolic_blood_pressure_mmhg: {
      high: {
        upper: 150,
        lower: 90
      },
      medium: {
        upper: 150,
        lower: 130
      }
    },
    diastolic_blood_pressure_mmhg: {
      high: {
        upper: 95,
        lower: 60
      },
      medium: {
        upper: 95,
        lower: 85
      }
    },
    heart_rate_bpm: {
      high: {
        upper: 130,
        lower: 40
      },
      medium: {
        upper: 130,
        lower: 110
      }
    },
    breathing_rate_bpm: {
      high: {
        upper: 30,
        lower: 8
      },
      medium: {
        upper: 30,
        lower: 20
      }
    },
    hrv_sdnn_ms: {
      high: {
        upper: null,
        lower: 20
      },
      medium: {
        upper: null,
        lower: 40
      }
    }
  }
};

export const checkVitalSignAlert = (vitalSign, value, thresholds) => {

  if (thresholds.high) {
    if (
      (thresholds.high.upper !== null && value > thresholds.high.upper) ||
      (thresholds.high.lower !== null && value < thresholds.high.lower)
    ) {
      return 'high';
    }
  }

  if (thresholds.medium) {
    if (
      (thresholds.medium.upper !== null && value > thresholds.medium.upper) ||
      (thresholds.medium.lower !== null && value < thresholds.medium.lower)
    ) {
      return 'medium';
    }
  }

  return 'low';
};


export function checkHealthRisk(data) {
  // Check for invalid/missing data
  if (!data) return { risk: "Failed", message: "Invalid or missing data", alert_in: null };

  const requiredFields = [
    'systolic_blood_pressure_mmhg',
    'diastolic_blood_pressure_mmhg',
    'heart_rate_bpm',
    'breathing_rate_bpm',
    'hrv_sdnn_ms'
  ];

  for (const field of requiredFields) {
    if (data[field] === null ||
      data[field] === undefined ||
      data[field] === 0 ||
      data[field] === '') {
      return { risk: "Failed", message: "Invalid or missing data", alert_in: null };
    }
  }

  const age = data.age_years ?? 50; // Assume 50 yrs if not provided
  const gender = data.gender ?? 'neutral'; // Placeholder, not used in logic for now

  const systolicBP = data.systolic_blood_pressure_mmhg;
  const diastolicBP = data.diastolic_blood_pressure_mmhg;
  const heartRate = data.heart_rate_bpm;
  const breathingRate = data.breathing_rate_bpm;
  const hrv = data.hrv_sdnn_ms;

  let highRisk = false;
  let mediumRisk = false;
  let primaryReason = "";
  let alertField = "";

  // Systolic BP - Check high risk first
  if (age <= 40) {
    if (systolicBP > 180) {
      highRisk = true;
      primaryReason = "Systolic BP critically high (>180 mmHg)";
      alertField = ALERT_FIELDS.SYSTOLIC_BP;
    } else if (systolicBP < 80) {
      highRisk = true;
      primaryReason = "Systolic BP critically low (<80 mmHg)";
      alertField = ALERT_FIELDS.SYSTOLIC_BP;
    } else if (systolicBP >= 150) {
      mediumRisk = true;
      primaryReason = "Systolic BP elevated (≥150 mmHg)";
      alertField = ALERT_FIELDS.SYSTOLIC_BP;
    } else if (systolicBP < 90) {
      mediumRisk = true;
      primaryReason = "Systolic BP low (<90 mmHg)";
      alertField = ALERT_FIELDS.SYSTOLIC_BP;
    }
  } else if (age <= 60) {
    if (systolicBP > 180) {
      highRisk = true;
      primaryReason = "Systolic BP critically high (>180 mmHg)";
      alertField = ALERT_FIELDS.SYSTOLIC_BP;
    } else if (systolicBP < 80) {
      highRisk = true;
      primaryReason = "Systolic BP critically low (<80 mmHg)";
      alertField = ALERT_FIELDS.SYSTOLIC_BP;
    } else if (systolicBP >= 150) {
      mediumRisk = true;
      primaryReason = "Systolic BP elevated (≥150 mmHg)";
      alertField = ALERT_FIELDS.SYSTOLIC_BP;
    } else if (systolicBP < 90) {
      mediumRisk = true;
      primaryReason = "Systolic BP low (<90 mmHg)";
      alertField = ALERT_FIELDS.SYSTOLIC_BP;
    }
  } else if (age <= 75) {
    if (systolicBP > 190) {
      highRisk = true;
      primaryReason = "Systolic BP critically high (>190 mmHg)";
      alertField = ALERT_FIELDS.SYSTOLIC_BP;
    } else if (systolicBP < 80) {
      highRisk = true;
      primaryReason = "Systolic BP critically low (<80 mmHg)";
      alertField = ALERT_FIELDS.SYSTOLIC_BP;
    } else if (systolicBP >= 150) {
      mediumRisk = true;
      primaryReason = "Systolic BP elevated (≥150 mmHg)";
      alertField = ALERT_FIELDS.SYSTOLIC_BP;
    } else if (systolicBP < 100) {
      mediumRisk = true;
      primaryReason = "Systolic BP low (<100 mmHg)";
      alertField = ALERT_FIELDS.SYSTOLIC_BP;
    }
  } else {
    if (systolicBP > 200) {
      highRisk = true;
      primaryReason = "Systolic BP critically high (>200 mmHg)";
      alertField = ALERT_FIELDS.SYSTOLIC_BP;
    } else if (systolicBP < 80) {
      highRisk = true;
      primaryReason = "Systolic BP critically low (<80 mmHg)";
      alertField = ALERT_FIELDS.SYSTOLIC_BP;
    } else if (systolicBP >= 150) {
      mediumRisk = true;
      primaryReason = "Systolic BP elevated (≥150 mmHg)";
      alertField = ALERT_FIELDS.SYSTOLIC_BP;
    } else if (systolicBP < 110) {
      mediumRisk = true;
      primaryReason = "Systolic BP low (<110 mmHg)";
      alertField = ALERT_FIELDS.SYSTOLIC_BP;
    }
  }

  // Diastolic BP - Only check if no systolic issue found
  if (!highRisk && !mediumRisk) {
    if (diastolicBP > 120) {
      highRisk = true;
      primaryReason = "Diastolic BP critically high (>120 mmHg)";
      alertField = ALERT_FIELDS.DIASTOLIC_BP;
    } else if (diastolicBP > 95) {
      mediumRisk = true;
      primaryReason = "Diastolic BP elevated (>95 mmHg)";
      alertField = ALERT_FIELDS.DIASTOLIC_BP;
    }
  }

  // Heart Rate - Only check if no BP issue found
  if (!highRisk && !mediumRisk) {
    if (age <= 40) {
      if (heartRate < 40) {
        highRisk = true;
        primaryReason = "Heart rate critically low (<40 bpm)";
        alertField = ALERT_FIELDS.HEART_RATE;
      } else if (heartRate > 130) {
        highRisk = true;
        primaryReason = "Heart rate critically high (>130 bpm)";
        alertField = ALERT_FIELDS.HEART_RATE;
      } else if (heartRate > 100) {
        mediumRisk = true;
        primaryReason = "Heart rate elevated (>100 bpm)";
        alertField = ALERT_FIELDS.HEART_RATE;
      }
    } else if (age <= 60) {
      if (heartRate < 40) {
        highRisk = true;
        primaryReason = "Heart rate critically low (<40 bpm)";
        alertField = ALERT_FIELDS.HEART_RATE;
      } else if (heartRate > 130) {
        highRisk = true;
        primaryReason = "Heart rate critically high (>130 bpm)";
        alertField = ALERT_FIELDS.HEART_RATE;
      } else if (heartRate > 90) {
        mediumRisk = true;
        primaryReason = "Heart rate elevated (>90 bpm)";
        alertField = ALERT_FIELDS.HEART_RATE;
      }
    } else if (age <= 75) {
      if (heartRate < 40) {
        highRisk = true;
        primaryReason = "Heart rate critically low (<40 bpm)";
        alertField = ALERT_FIELDS.HEART_RATE;
      } else if (heartRate > 130) {
        highRisk = true;
        primaryReason = "Heart rate critically high (>130 bpm)";
        alertField = ALERT_FIELDS.HEART_RATE;
      } else if (heartRate > 85) {
        mediumRisk = true;
        primaryReason = "Heart rate elevated (>85 bpm)";
        alertField = ALERT_FIELDS.HEART_RATE;
      }
    } else {
      if (heartRate < 40) {
        highRisk = true;
        primaryReason = "Heart rate critically low (<40 bpm)";
        alertField = ALERT_FIELDS.HEART_RATE;
      } else if (heartRate > 130) {
        highRisk = true;
        primaryReason = "Heart rate critically high (>130 bpm)";
        alertField = ALERT_FIELDS.HEART_RATE;
      } else if (heartRate > 80) {
        mediumRisk = true;
        primaryReason = "Heart rate elevated (>80 bpm)";
        alertField = ALERT_FIELDS.HEART_RATE;
      }
    }
  }

  // Breathing Rate - Only check if no previous issues found
  if (!highRisk && !mediumRisk) {
    if (breathingRate < 8) {
      highRisk = true;
      primaryReason = "Breathing rate critically low (<8 bpm)";
      alertField = ALERT_FIELDS.BREATHING_RATE;
    } else if (breathingRate > 30) {
      highRisk = true;
      primaryReason = "Breathing rate critically high (>30 bpm)";
      alertField = ALERT_FIELDS.BREATHING_RATE;
    } else if (breathingRate >= 20) {
      mediumRisk = true;
      primaryReason = "Breathing rate elevated (≥20 bpm)";
      alertField = ALERT_FIELDS.BREATHING_RATE;
    }
  }

  // HRV - Only check if no previous issues found
  if (!highRisk && !mediumRisk) {
    if (age <= 40 && hrv < 20) {
      mediumRisk = true;
      primaryReason = "Heart rate variability low (<20 ms)";
      alertField = ALERT_FIELDS.HRV;
    } else if (age <= 60 && hrv < 18) {
      mediumRisk = true;
      primaryReason = "Heart rate variability low (<18 ms)";
      alertField = ALERT_FIELDS.HRV;
    } else if (age <= 75 && hrv < 15) {
      mediumRisk = true;
      primaryReason = "Heart rate variability low (<15 ms)";
      alertField = ALERT_FIELDS.HRV;
    } else if (age > 75 && hrv < 12) {
      mediumRisk = true;
      primaryReason = "Heart rate variability low (<12 ms)";
      alertField = ALERT_FIELDS.HRV;
    }
  }

  console.log(highRisk, mediumRisk, age, "highRisk, mediumRisk");
  
  // Final Risk Assessment
  if (highRisk) {
    return { 
      risk: "high", 
      message: primaryReason,
      alert_in: alertField
    };
  }
  if (mediumRisk) {
    return { 
      risk: "medium", 
      message: primaryReason,
      alert_in: alertField
    };
  }
  return { 
    risk: "low", 
    message: "All vital signs are within normal ranges",
    alert_in: null
  };
}