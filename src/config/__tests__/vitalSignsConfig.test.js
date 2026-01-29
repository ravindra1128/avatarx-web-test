import { vitalSignsConfig, checkVitalSignAlert } from '../vitalSignsConfig';

describe('Vital Signs Alert Configuration', () => {
  describe('checkVitalSignAlert', () => {
    // Test cases for systolic blood pressure
    test('should return high alert for systolic BP above high threshold', () => {
      const result = checkVitalSignAlert(
        'systolic_blood_pressure_mmhg',
        160,
        vitalSignsConfig.thresholds.systolic_blood_pressure_mmhg
      );
      expect(result).toBe('high');
    });

    test('should return high alert for systolic BP below high threshold', () => {
      const result = checkVitalSignAlert(
        'systolic_blood_pressure_mmhg',
        85,
        vitalSignsConfig.thresholds.systolic_blood_pressure_mmhg
      );
      expect(result).toBe('high');
    });

    test('should return medium alert for systolic BP below medium threshold', () => {
      const result = checkVitalSignAlert(
        'systolic_blood_pressure_mmhg',
        125,
        vitalSignsConfig.thresholds.systolic_blood_pressure_mmhg
      );
      expect(result).toBe('medium');
    });

    test('should return low alert for systolic BP in normal range', () => {
      const result = checkVitalSignAlert(
        'systolic_blood_pressure_mmhg',
        140,
        vitalSignsConfig.thresholds.systolic_blood_pressure_mmhg
      );
      expect(result).toBe('low');
    });

    // Test cases for heart rate
    test('should return high alert for heart rate above high threshold', () => {
      const result = checkVitalSignAlert(
        'heart_rate_bpm',
        140,
        vitalSignsConfig.thresholds.heart_rate_bpm
      );
      expect(result).toBe('high');
    });

    test('should return high alert for heart rate below high threshold', () => {
      const result = checkVitalSignAlert(
        'heart_rate_bpm',
        35,
        vitalSignsConfig.thresholds.heart_rate_bpm
      );
      expect(result).toBe('high');
    });

    test('should return medium alert for heart rate below medium threshold', () => {
      const result = checkVitalSignAlert(
        'heart_rate_bpm',
        105,
        vitalSignsConfig.thresholds.heart_rate_bpm
      );
      expect(result).toBe('medium');
    });

    test('should return low alert for heart rate in normal range', () => {
      const result = checkVitalSignAlert(
        'heart_rate_bpm',
        115,
        vitalSignsConfig.thresholds.heart_rate_bpm
      );
      expect(result).toBe('low');
    });

    // Test cases for breathing rate
    test('should return high alert for breathing rate above high threshold', () => {
      const result = checkVitalSignAlert(
        'breathing_rate_bpm',
        35,
        vitalSignsConfig.thresholds.breathing_rate_bpm
      );
      expect(result).toBe('high');
    });

    test('should return high alert for breathing rate below high threshold', () => {
      const result = checkVitalSignAlert(
        'breathing_rate_bpm',
        6,
        vitalSignsConfig.thresholds.breathing_rate_bpm
      );
      expect(result).toBe('high');
    });

    test('should return medium alert for breathing rate below medium threshold', () => {
      const result = checkVitalSignAlert(
        'breathing_rate_bpm',
        18,
        vitalSignsConfig.thresholds.breathing_rate_bpm
      );
      expect(result).toBe('medium');
    });

    test('should return low alert for breathing rate in normal range', () => {
      const result = checkVitalSignAlert(
        'breathing_rate_bpm',
        25,
        vitalSignsConfig.thresholds.breathing_rate_bpm
      );
      expect(result).toBe('low');
    });

    // Test cases for HRV SDNN
    test('should return high alert for HRV SDNN below high threshold', () => {
      const result = checkVitalSignAlert(
        'hrv_sdnn_ms',
        15,
        vitalSignsConfig.thresholds.hrv_sdnn_ms
      );
      expect(result).toBe('high');
    });

    test('should return medium alert for HRV SDNN below medium threshold', () => {
      const result = checkVitalSignAlert(
        'hrv_sdnn_ms',
        35,
        vitalSignsConfig.thresholds.hrv_sdnn_ms
      );
      expect(result).toBe('medium');
    });

    test('should return low alert for HRV SDNN in normal range', () => {
      const result = checkVitalSignAlert(
        'hrv_sdnn_ms',
        45,
        vitalSignsConfig.thresholds.hrv_sdnn_ms
      );
      expect(result).toBe('low');
    });

    // Test cases for diastolic blood pressure
    test('should return high alert for diastolic BP above high threshold', () => {
      const result = checkVitalSignAlert(
        'diastolic_blood_pressure_mmhg',
        100,
        vitalSignsConfig.thresholds.diastolic_blood_pressure_mmhg
      );
      expect(result).toBe('high');
    });

    test('should return high alert for diastolic BP below high threshold', () => {
      const result = checkVitalSignAlert(
        'diastolic_blood_pressure_mmhg',
        55,
        vitalSignsConfig.thresholds.diastolic_blood_pressure_mmhg
      );
      expect(result).toBe('high');
    });

    test('should return medium alert for diastolic BP below medium threshold', () => {
      const result = checkVitalSignAlert(
        'diastolic_blood_pressure_mmhg',
        80,
        vitalSignsConfig.thresholds.diastolic_blood_pressure_mmhg
      );
      expect(result).toBe('medium');
    });

    test('should return low alert for diastolic BP in normal range', () => {
      const result = checkVitalSignAlert(
        'diastolic_blood_pressure_mmhg',
        90,
        vitalSignsConfig.thresholds.diastolic_blood_pressure_mmhg
      );
      expect(result).toBe('low');
    });
  });
}); 