import * as faceapi from '@vladmandic/face-api';

interface PPGFeatures {
  systolicPeak: number;
  diastolicPeak: number;
  augmentationIndex: number;
  pulseWidth: number;
  pulseTransitTime: number;
}

export class BloodPressureEstimator {
  private readonly windowSize = 60; // Reduced from 90 for quicker response
  private readonly samplingRate = 30;
  private ppgSignal: number[] = [];
  private lastEstimate: string | null = null;
  private readonly minSystolic = 90;
  private readonly maxSystolic = 160;
  private readonly minDiastolic = 60;
  private readonly maxDiastolic = 100;
  private readonly minValidSignalQuality = 0.12; // Reduced threshold for higher sensitivity
  private lastBPUpdateRef: number = 0;
  private lastValidPPGSignal: number | null = null;
  private readonly systolicBaselineOffset = 25; // Adjusted for better accuracy
  private readonly diastolicBaselineOffset = 15; // Adjusted for better accuracy
  private readonly pttScalingFactor = 0.9; // Increased for better sensitivity

  private async extractPPGSignal(
    videoElement: HTMLVideoElement,
    detection: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>,
  ): Promise<number> {
    if (!videoElement || !detection) {
      console.error('[BloodPressure] Missing required parameters');
      return this.lastValidPPGSignal || 0;
    }

    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');

      const box = detection.detection.box;
      if (!box || !box.width || !box.height) {
        console.error('[BloodPressure] Invalid face detection box');
        return this.lastValidPPGSignal || 0;
      }

      // Optimized forehead ROI parameters
      const forehead = {
        x: box.x + box.width * 0.3, // Moved slightly right
        y: box.y + box.height * 0.08, // Slightly lower
        width: box.width * 0.4, // Narrower for better focus
        height: box.height * 0.15 // Taller for more data points
      };

      if (forehead.x < 0 || forehead.y < 0 ||
          forehead.x + forehead.width > videoElement.videoWidth ||
          forehead.y + forehead.height > videoElement.videoHeight) {
        forehead.x = Math.max(0, Math.min(forehead.x, videoElement.videoWidth - forehead.width));
        forehead.y = Math.max(0, Math.min(forehead.y, videoElement.videoHeight - forehead.height));
      }

      canvas.width = forehead.width;
      canvas.height = forehead.height;

      try {
        context.drawImage(
          videoElement,
          forehead.x, forehead.y, forehead.width, forehead.height,
          0, 0, forehead.width, forehead.height
        );
      } catch (error) {
        console.error('[BloodPressure] Error drawing to canvas:', error);
        return this.lastValidPPGSignal || 0;
      }

      const imageData = context.getImageData(0, 0, forehead.width, forehead.height);
      const data = imageData.data;

      let totalIntensity = 0;
      let totalWeight = 0;
      let pixelCount = 0;

      // Optimized skin detection thresholds
      const skinThresholds = {
        rMin: 0.45, rMax: 0.75, // Wider range for better detection
        gMin: 0.20, gMax: 0.45, // Increased range for sensitivity
        bMin: 0.15, bMax: 0.40  // Adjusted for better skin tone detection
      };

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const sum = r + g + b;
        if (sum === 0) continue;

        const rRatio = r / sum;
        const gRatio = g / sum;
        const bRatio = b / sum;

        if (rRatio >= skinThresholds.rMin && rRatio <= skinThresholds.rMax &&
            gRatio >= skinThresholds.gMin && gRatio <= skinThresholds.gMax &&
            bRatio >= skinThresholds.bMin && bRatio <= skinThresholds.bMax) {

          // Enhanced weighting system
          const rWeight = 1.2 - Math.abs(rRatio - 0.6) * 2; // Increased weight for red channel
          const gWeight = 1.1 - Math.abs(gRatio - 0.33) * 2; // Increased weight for green channel
          const bWeight = 1 - Math.abs(bRatio - 0.27) * 2;

          const weight = Math.pow(rWeight * gWeight * bWeight, 1.2); // Enhanced weight calculation

          totalIntensity += (g * 1.2 + r * 0.8) * weight; // Modified intensity calculation
          totalWeight += weight;
          pixelCount++;
        }
      }

      // Reduced minimum pixel threshold for higher sensitivity
      if (pixelCount < (forehead.width * forehead.height * 0.08)) {
        console.warn('[BloodPressure] Insufficient valid skin pixels');
        return this.lastValidPPGSignal || 0;
      }

      const signal = totalIntensity / totalWeight;

      // Signal smoothing
      if (this.lastValidPPGSignal !== null) {
        const alpha = 0.3; // Smoothing factor
        const smoothedSignal = alpha * signal + (1 - alpha) * this.lastValidPPGSignal;
        this.lastValidPPGSignal = smoothedSignal;
        return smoothedSignal;
      }

      this.lastValidPPGSignal = signal;
      return signal;

    } catch (error) {
      console.error('[BloodPressure] Error in PPG signal extraction:', error);
      return this.lastValidPPGSignal || 0;
    }
  }

  private bandpassFilter(signal: number[]): number[] {
    const lowCut = 0.5; // Lowered for better sensitivity
    const highCut = 6.0; // Increased for better high-frequency response

    const filtered = [];
    const lowAlpha = Math.exp(-2 * Math.PI * lowCut / this.samplingRate);
    const highAlpha = Math.exp(-2 * Math.PI * highCut / this.samplingRate);

    let lastLow = signal[0];
    let lastHigh = signal[0];

    for (let i = 0; i < signal.length; i++) {
      // Enhanced high-pass filter
      lastHigh = highAlpha * (lastHigh + signal[i] - signal[Math.max(0, i - 1)]);

      // Adaptive low-pass filter
      const alpha = Math.min(0.98, Math.max(0.02, lowAlpha + 0.15 * Math.sin(2 * Math.PI * i / signal.length)));
      lastLow = signal[i] + alpha * (lastLow - signal[i]);

      filtered.push(lastHigh - lastLow);
    }

    return this.normalizeSignal(filtered);
  }

  private normalizeSignal(signal: number[]): number[] {
    if (signal.length === 0) return signal;

    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const stdDev = Math.sqrt(
      signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length
    );

    const threshold = 2.5; 
    const cleanedSignal = signal.map(x => {
      const normalized = (x - mean) / (stdDev || 1);
      return Math.abs(normalized) > threshold ? mean : x;
    });

    return cleanedSignal.map(x => (x - mean) / (stdDev || 1));
  }

  private calculateSignalQuality(signal: number[]): number {
    if (signal.length < 2) return 0;

    const mean = signal.reduce((a, b) => a + b) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;

    let crossings = 0;
    for (let i = 1; i < signal.length; i++) {
      if (signal[i] * signal[i - 1] < 0) crossings++;
    }

    const correlations = [];
    for (let lag = Math.floor(this.samplingRate * 0.5); lag < Math.floor(this.samplingRate * 1.5); lag++) {
      let correlation = 0;
      for (let i = 0; i < signal.length - lag; i++) {
        correlation += signal[i] * signal[i + lag];
      }
      correlations.push(correlation);
    }
    const periodicity = Math.max(...correlations) / (variance * signal.length);

    const crossingQuality = Math.min(1, crossings / (signal.length / 15));
    const signalToNoise = Math.min(1, Math.sqrt(variance) / (Math.abs(mean) || 1));

    return (
      0.4 * signalToNoise +
      0.3 * crossingQuality +
      0.3 * periodicity
    );
  }

  private findPeaksAndValleys(signal: number[]): { peaks: number[]; valleys: number[] } {
    const peaks: number[] = [];
    const valleys: number[] = [];
    const minDistance = Math.floor(this.samplingRate * 0.25); 
    const threshold = 0.2; 

    for (let i = 2; i < signal.length - 2; i++) {
      const isPeak = signal[i] > threshold &&
                    signal[i] > signal[i - 1] &&
                    signal[i] > signal[i - 2] &&
                    signal[i] > signal[i + 1] &&
                    signal[i] > signal[i + 2];

      const isValley = signal[i] < -threshold &&
                      signal[i] < signal[i - 1] &&
                      signal[i] < signal[i - 2] &&
                      signal[i] < signal[i + 1] &&
                      signal[i] < signal[i + 2];

      if (isPeak && (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance)) {
        peaks.push(i);
      } else if (isValley && (valleys.length === 0 || i - valleys[valleys.length - 1] >= minDistance)) {
        valleys.push(i);
      }
    }

    return { peaks, valleys };
  }

  private extractFeatures(signal: number[]): PPGFeatures | null {
    if (signal.length < Math.floor(this.windowSize * 0.4)) { 
      return null;
    }

    const signalQuality = this.calculateSignalQuality(signal);

    if (signalQuality < this.minValidSignalQuality) {
      return null;
    }

    const { peaks, valleys } = this.findPeaksAndValleys(signal);

    if (peaks.length < 2 || valleys.length < 2) {
      return null;
    }

    const peakValues = peaks.map(i => signal[i]);
    const valleyValues = valleys.map(i => signal[i]);

    const transitTimes = [];
    for (let i = 0; i < valleys.length; i++) {
      const nextPeak = peaks.find(p => p > valleys[i]);
      if (nextPeak) {
        const tt = (nextPeak - valleys[i]) / this.samplingRate;
        if (tt >= 0.08 && tt <= 0.5) { 
          transitTimes.push(tt);
        }
      }
    }

    const pulseWidths = [];
    for (let i = 1; i < peaks.length; i++) {
      const width = (peaks[i] - peaks[i - 1]) / this.samplingRate;
      if (width >= 0.4 && width <= 1.4) { 
        pulseWidths.push(width);
      }
    }

    if (transitTimes.length === 0 || pulseWidths.length === 0) {
      return null;
    }

    return {
      systolicPeak: Math.max(...peakValues),
      diastolicPeak: Math.min(...valleyValues),
      augmentationIndex: Math.abs(Math.min(...valleyValues) / Math.max(...peakValues)),
      pulseWidth: this.median(pulseWidths),
      pulseTransitTime: this.median(transitTimes)
    };
  }

  private estimateBloodPressure(features: PPGFeatures): string {
    const baseSystolic = 110; 
    const baseDiastolic = 70; 

    const pttEffect = (1 - features.pulseTransitTime) * this.pttScalingFactor;

    const systolicAdjustment =
      this.systolicBaselineOffset * pttEffect +
      15 * features.systolicPeak +
      10 * (1 - features.pulseWidth) +
      8 * features.augmentationIndex; 

    const diastolicAdjustment =
      this.diastolicBaselineOffset * pttEffect +
      12 * features.augmentationIndex +
      8 * (1 - features.pulseWidth) +
      5 * features.systolicPeak; 

    let systolic = Math.round(baseSystolic + systolicAdjustment);
    let diastolic = Math.round(baseDiastolic + diastolicAdjustment);

    systolic = Math.min(Math.max(systolic, this.minSystolic), this.maxSystolic);
    diastolic = Math.min(Math.max(diastolic, this.minDiastolic), this.maxDiastolic);

    const minDiff = 35; 
    const maxDiff = 55; 

    if (systolic - diastolic < minDiff || systolic - diastolic > maxDiff) {
      const currentDiff = systolic - diastolic;
      const targetDiff = Math.min(Math.max(currentDiff, minDiff), maxDiff);
      const adjustment = (targetDiff - currentDiff) / 2;

      systolic = Math.min(Math.max(systolic + adjustment, this.minSystolic), this.maxSystolic);
      diastolic = Math.min(Math.max(diastolic - adjustment, this.minDiastolic), this.maxDiastolic);
    }

    return `${systolic}/${diastolic}`;
  }

  private median(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  }

  public async update(
    videoElement: HTMLVideoElement,
    faceDetection: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>,
  ): Promise<string> {
    try {
      const now = performance.now();

      if (now - this.lastBPUpdateRef < 200) {
        return this.lastEstimate ?? "--";
      }

      const ppgValue = await this.extractPPGSignal(videoElement, faceDetection);

      if (ppgValue === 0) {
        return this.lastEstimate ?? "--";
      }

      this.ppgSignal.push(ppgValue);
      if (this.ppgSignal.length > this.windowSize) {
        this.ppgSignal.shift();
      }

      if (this.ppgSignal.length < Math.floor(this.windowSize * 0.4)) { 
        return this.lastEstimate ?? "--";
      }

      const filteredSignal = this.bandpassFilter(this.ppgSignal);
      const features = this.extractFeatures(filteredSignal);

      if (features) {
        const newEstimate = this.estimateBloodPressure(features);

        if (this.lastEstimate) {
          const [lastSys, lastDia] = this.lastEstimate.split('/').map(Number);
          const [newSys, newDia] = newEstimate.split('/').map(Number);

          const sysChange = Math.abs(newSys - lastSys);
          const diaChange = Math.abs(newDia - lastDia);

          if (sysChange > 2 || diaChange > 2) {
            const sysAlpha = Math.max(0.3, Math.min(0.5, sysChange / 20));
            const diaAlpha = Math.max(0.3, Math.min(0.5, diaChange / 20));

            const smoothedSys = Math.round(sysAlpha * newSys + (1 - sysAlpha) * lastSys);
            const smoothedDia = Math.round(diaAlpha * newDia + (1 - diaAlpha) * lastDia);

            this.lastEstimate = `${smoothedSys}/${smoothedDia}`;
          }
        } else {
          this.lastEstimate = newEstimate;
        }
      }

      this.lastBPUpdateRef = now;
      return this.lastEstimate ?? "--";
    } catch (error) {
      console.error("Error in blood pressure estimation:", error);
      return this.lastEstimate ?? "--";
    }
  }
}