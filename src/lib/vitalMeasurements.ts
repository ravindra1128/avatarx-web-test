interface VitalReading {
    heartRate: number;
    bloodPressure: string;
    hrv: number;
    bloodGlucose: number;
    timestamp: number;
  }
  
  export class VitalMeasurements {
    public readings: VitalReading[] = [];
    private readonly measurementInterval = 1500; // Take measurements every 2 seconds
    private readonly minReadings = 3; // Minimum readings needed for valid average
    private lastMeasurementTime = 0;
  
    public addReading(reading: Omit<VitalReading, 'timestamp'>) {
      const now = Date.now();
  
      // Only add readings if enough time has passed
      if (now - this.lastMeasurementTime >= this.measurementInterval) {
        // Normalize HRV to realistic range (20-100ms)
        const normalizedHRV = Math.max(20, Math.min(100, reading.hrv));
  
        // Normalize blood glucose to realistic range (70-180 mg/dL)
        const normalizedGlucose = Math.max(70, Math.min(180, reading.bloodGlucose));
  
        this.readings.push({
          ...reading,
          hrv: normalizedHRV,
          bloodGlucose: normalizedGlucose,
          timestamp: now
        });
        this.lastMeasurementTime = now;
      }
    }
  
    public getFinalReport(): {
      averageHeartRate: number;
      averageBloodPressure: string;
      averageHRV: number;
      averageBloodGlucose: number;
      confidence: number;
      totalReadings: number;
    } {
      if (this.readings.length < this.minReadings) {
        return {
          averageHeartRate: 0,
          averageBloodPressure: "--/--",
          averageHRV: 0,
          averageBloodGlucose: 0,
          confidence: 0,
          totalReadings: this.readings.length
        };
      }
  
      // Remove outliers using IQR method for each vital sign
      const validReadings = this.removeOutliers(this.readings);
  
      // Calculate averages
      const averageHeartRate = Math.round(
        validReadings.reduce((sum, r) => sum + r.heartRate, 0) / validReadings.length
      );
  
      const averageHRV = Math.round(
        (validReadings.reduce((sum, r) => sum + r.hrv, 0) / validReadings.length) * 10
      ) / 10;
  
      const averageBloodGlucose = Math.round(
        validReadings.reduce((sum, r) => sum + r.bloodGlucose, 0) / validReadings.length
      );
  
      // Calculate average blood pressure
      const bpReadings = validReadings
        .map(r => r.bloodPressure)
        .filter(bp => bp !== "--/--")
        .map(bp => {
          const [systolic, diastolic] = bp.split('/').map(Number);
          return { systolic, diastolic };
        });
  
      let averageBloodPressure = "--/--";
      if (bpReadings.length > 0) {
        const avgSystolic = Math.round(
          bpReadings.reduce((sum, bp) => sum + bp.systolic, 0) / bpReadings.length
        );
        const avgDiastolic = Math.round(
          bpReadings.reduce((sum, bp) => sum + bp.diastolic, 0) / bpReadings.length
        );
        averageBloodPressure = `${avgSystolic}/${avgDiastolic}`;
      }
  
      // Calculate confidence score based on reading consistency
      const confidence = this.calculateConfidence(validReadings);
  
      return {
        averageHeartRate,
        averageBloodPressure,
        averageHRV,
        averageBloodGlucose,
        confidence,
        totalReadings: this.readings.length
      };
    }
  
    private removeOutliers(readings: VitalReading[]): VitalReading[] {
      if (readings.length < 4) return readings;
  
      const getQuartiles = (values: number[]) => {
        const sorted = [...values].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length / 4)];
        const q3 = sorted[Math.floor(sorted.length * 3 / 4)];
        return { q1, q3 };
      };
  
      // Calculate bounds for each vital sign
      const heartRates = readings.map(r => r.heartRate);
      const hrQuartiles = getQuartiles(heartRates);
      const hrIQR = hrQuartiles.q3 - hrQuartiles.q1;
      const hrLowerBound = hrQuartiles.q1 - 1.5 * hrIQR;
      const hrUpperBound = hrQuartiles.q3 + 1.5 * hrIQR;
  
      const hrvs = readings.map(r => r.hrv);
      const hrvQuartiles = getQuartiles(hrvs);
      const hrvIQR = hrvQuartiles.q3 - hrvQuartiles.q1;
      const hrvLowerBound = hrvQuartiles.q1 - 1.5 * hrvIQR;
      const hrvUpperBound = hrvQuartiles.q3 + 1.5 * hrvIQR;
  
      // Filter out readings with any outlier values
      return readings.filter(reading =>
        reading.heartRate >= hrLowerBound &&
        reading.heartRate <= hrUpperBound &&
        reading.hrv >= hrvLowerBound &&
        reading.hrv <= hrvUpperBound
      );
    }
  
    private calculateConfidence(readings: VitalReading[]): number {
      if (readings.length < this.minReadings) return 0;
  
      // Calculate coefficient of variation for heart rate
      const hrMean = readings.reduce((sum, r) => sum + r.heartRate, 0) / readings.length;
      const hrVariance = readings.reduce((sum, r) => sum + Math.pow(r.heartRate - hrMean, 2), 0) / readings.length;
      const hrCV = Math.sqrt(hrVariance) / hrMean;
  
      // Calculate consistency score (inverse of CV, normalized to 0-1)
      const consistencyScore = Math.max(0, Math.min(1, 1 - hrCV));
  
      // Calculate coverage score based on number of readings
      const coverageScore = Math.min(1, readings.length / (this.minReadings * 1.5));
  
      // Combine scores with weights
      const confidence = (0.7 * consistencyScore + 0.3 * coverageScore) * 100;
  
      return Math.round(confidence);
    }
  
    public clear() {
      this.readings = [];
      this.lastMeasurementTime = 0;
    }
  }