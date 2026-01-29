function assessHealthRisk(data) {
    if (!data) return "Failed";

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
            return "Failed";
        }
    }

    const age = data.age_years ?? 50;  // default age if missing
    const gender = data.gender?.toLowerCase() ?? 'neutral';  // default gender

    const systolicBP = data.systolic_blood_pressure_mmhg;
    const diastolicBP = data.diastolic_blood_pressure_mmhg;
    const heartRate = data.heart_rate_bpm;
    const breathingRate = data.breathing_rate_bpm;
    const hrv = data.hrv_sdnn_ms;

    let highRisk = false;
    let moderateRisk = false;

    // --- Systolic BP ---
    if (age <= 40) {
        if (systolicBP > 180 || systolicBP < 80) highRisk = true;
        else if (systolicBP >= 150 || systolicBP < 90) moderateRisk = true;
    } else if (age <= 60) {
        if (systolicBP > 180 || systolicBP < 80) highRisk = true;
        else if (systolicBP >= 150 || systolicBP < 90) moderateRisk = true;
    } else if (age <= 75) {
        if (systolicBP > 190 || systolicBP < 80) highRisk = true;
        else if (systolicBP >= 150 || systolicBP < 100) moderateRisk = true;
    } else {
        if (systolicBP > 200 || systolicBP < 80) highRisk = true;
        else if (systolicBP >= 150 || systolicBP < 110) moderateRisk = true;
    }

    // --- Diastolic BP ---
    if (diastolicBP > 120) highRisk = true;
    else if (diastolicBP > 95) moderateRisk = true;

    // --- Heart Rate ---
    if (age <= 40) {
        if (heartRate < 40 || heartRate > 130) highRisk = true;
        else if (heartRate > 100) moderateRisk = true;
    } else if (age <= 60) {
        if (heartRate < 40 || heartRate > 130) highRisk = true;
        else if (heartRate > 90) moderateRisk = true;
    } else if (age <= 75) {
        if (heartRate < 40 || heartRate > 130) highRisk = true;
        else if (heartRate > 85) moderateRisk = true;
    } else {
        if (heartRate < 40 || heartRate > 130) highRisk = true;
        else if (heartRate > 80) moderateRisk = true;
    }

    // --- Breathing Rate (All ages) ---
    if (breathingRate < 8 || breathingRate > 30) highRisk = true;
    else if (breathingRate >= 20) moderateRisk = true;

    // --- HRV thresholds based on age and gender ---
    let hrvThreshold;
    if (age <= 40) {
        hrvThreshold = gender === 'female' ? 22 : 20;
    } else if (age <= 60) {
        hrvThreshold = gender === 'female' ? 20 : 18;
    } else if (age <= 75) {
        hrvThreshold = gender === 'female' ? 18 : 15;
    } else {
        hrvThreshold = gender === 'female' ? 15 : 12;
    }

    if (hrv < hrvThreshold) moderateRisk = true;

    // --- Final Decision ---
    if (highRisk) return "High Risk";
    if (moderateRisk) return "Moderate Risk";
    return "Low Risk";
}


const personA = {
    heart_rate_bpm: 71,
    hrv_sdnn_ms: 43,
    hrv_lnrmssd_ms: 3.7,
    stress_index: 2.3,
    parasympathetic_activity: 75,
    breathing_rate_bpm: 21,
    systolic_blood_pressure_mmhg: 125,
    diastolic_blood_pressure_mmhg: 81,
    cardiac_workload_mmhg_per_sec: 148,
    age_years: 40
};

const personB = {
    heart_rate_bpm: 108,
    hrv_sdnn_ms: 10,
    hrv_lnrmssd_ms: 2.2,
    stress_index: 11.1,
    parasympathetic_activity: 51,
    breathing_rate_bpm: 23,
    systolic_blood_pressure_mmhg: 131,
    diastolic_blood_pressure_mmhg: 81,
    cardiac_workload_mmhg_per_sec: 236,
    age_years: 66
};

const personX = {
    heart_rate_bpm: 95,
    hrv_sdnn_ms: 14,
    breathing_rate_bpm: 22,
    systolic_blood_pressure_mmhg: 155,
    diastolic_blood_pressure_mmhg: 98
    // no age_years or gender
};

console.log(assessHealthRisk(personA)); // Moderate Risk
console.log(assessHealthRisk(personB)); // Moderate Risk
console.log(assessHealthRisk(personX)); // Moderate Risk
