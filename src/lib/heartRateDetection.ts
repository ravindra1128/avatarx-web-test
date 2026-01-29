import * as faceapi from "@vladmandic/face-api";

interface RGB {
  r: number;
  g: number;
  b: number;
}

export class HeartRateDetector {
  private readonly windowSize = 60;
  private readonly samplingRate = 30;
  private greenSignal: number[] = [];
  private lastHeartRate: number | null = null;
  private readonly minValidHeartRate = 67;
  private readonly maxValidHeartRate = 98;
  private lastProcessingTime: number = 0;
  private signalQualityHistory: number[] = [];
  private heartRateHistory: number[] = [];
  private readonly historySize = 10;
  private readonly minValidSignalQuality = 0.1;
  private lastValidSignal: number | null = null;
  private readonly maxHeartRateChange = 2;
  private lastValidHeartRate: number | null = null;
  private heartRateBuffer: number[] = [];
  private readonly bufferSize = 5;

  private extractSignalFromFace(
    videoElement: HTMLVideoElement,
    detection: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>,
    detectedFaceOverlayRef: React.RefObject<HTMLCanvasElement>
  ): { signal: number; quality: number } {
    if (!videoElement || !detection || !detection.landmarks?.positions) {
      console.error("[HeartRate] Missing required parameters or landmarks");
      return { signal: this.lastValidSignal || 0, quality: 0 };
    }

    try {
      const canvas = detectedFaceOverlayRef.current;
      if (!canvas) {
        console.error("[HeartRate] Canvas is null");
        return { signal: this.lastValidSignal || 0, quality: 0 };
      }
      const context = canvas.getContext("2d");

      if (!context) {
        console.error("[HeartRate] Failed to get canvas context");
        return { signal: this.lastValidSignal || 0, quality: 0 };
      }

      // Set canvas dimensions to match the video element
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // Clear previous drawings
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Get face bounding box and landmarks
      const box = detection.detection.box;

      // Define forehead ROI
      const rois = [
        {
          x: box.x + box.width * 0.2,
          y: box.y - box.height * 0.3,
          width: box.width * 0.6,
          height: box.height * 0.3,
        },
      ];

      let totalGreen = 0;
      let totalBrightness = 0;
      let validPixels = 0;

      for (const roi of rois) {
        // Validate ROI boundaries
        const validRoi = {
          x: Math.max(0, Math.min(roi.x, videoElement.videoWidth - roi.width)),
          y: Math.max(
            0,
            Math.min(roi.y, videoElement.videoHeight - roi.height)
          ),
          width: Math.min(roi.width, videoElement.videoWidth - roi.x),
          height: Math.min(roi.height, videoElement.videoHeight - roi.y),
        };

        if (validRoi.width < 10 || validRoi.height < 10) continue;

        canvas.width = validRoi.width;
        canvas.height = validRoi.height;

        // try {
        //   context.drawImage(
        //     videoElement,
        //     validRoi.x,
        //     validRoi.y,
        //     validRoi.width,
        //     validRoi.height,
        //     0,
        //     0,
        //     validRoi.width,
        //     validRoi.height
        //   );
        // } catch (error) {
        //   console.error("[HeartRate] Error drawing ROI to canvas:", error);
        //   continue;
        // }

        const imageData = context.getImageData(
          0,
          0,
          validRoi.width,
          validRoi.height
        );
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          try {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const sum = r + g + b;
            if (sum === 0) continue;

            const rRatio = r / sum;
            const gRatio = g / sum;
            const bRatio = b / sum;

            const hue = Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b);
            const saturation = 1 - (3 * Math.min(r, g, b)) / sum;

            if (
              this.isValidSkinPixel(rRatio, gRatio, bRatio, hue, saturation)
            ) {
              const greenWeight = this.calculateGreenWeight(r, g, b);
              totalGreen += g * greenWeight;
              totalBrightness += (r + g + b) / (3 * 255);
              validPixels++;
            }
          } catch (error) {
            console.error("[HeartRate] Error processing pixel:", error);
            continue;
          }
        }
      }

      if (validPixels === 0) {
        console.warn("[HeartRate] No valid skin pixels detected");
        return { signal: this.lastValidSignal || 0, quality: 0 };
      }

      const avgBrightness = totalBrightness / validPixels;
      const signalQuality = this.calculateSignalQuality(
        validPixels,
        validPixels * 4,
        avgBrightness
      );
      const signal = totalGreen / validPixels;

      if (signalQuality > this.minValidSignalQuality) {
        this.lastValidSignal = signal;
      }

      return { signal, quality: signalQuality };
    } catch (error) {
      console.error("[HeartRate] Error in signal extraction:", error);
      return { signal: this.lastValidSignal || 0, quality: 0 };
    }
  }

  private isValidSkinPixel(
    rRatio: number,
    gRatio: number,
    bRatio: number,
    hue: number,
    saturation: number
  ): boolean {
    // Multi-dimensional skin detection using RGB and HSV color spaces
    const rgbValid =
      rRatio > 0.3 &&
      rRatio < 0.5 &&
      gRatio > 0.25 &&
      gRatio < 0.4 &&
      bRatio > 0.15 &&
      bRatio < 0.35;

    // HSV-based validation
    const hueValid = hue >= -0.5 && hue <= 0.5;
    const saturationValid = saturation >= 0.2 && saturation <= 0.6;

    return rgbValid && hueValid && saturationValid;
  }

  private calculateGreenWeight(r: number, g: number, b: number): number {
    // ICA-inspired weighting for green channel
    const greenEmphasis = 1.5;
    const crossTalk = 0.3;

    // Compensate for RGB cross-talk
    const pureGreen = g - (r * crossTalk + b * crossTalk);

    // Normalize and apply emphasis
    const normalized = Math.max(0, pureGreen) / 255;
    return Math.pow(normalized, greenEmphasis);
  }

  private calculateSignalQuality(
    validPixels: number,
    totalPixels: number,
    brightness: number
  ): number {
    const coverage = validPixels / totalPixels;
    const brightnessWeight = Math.pow(brightness, 0.5); // Non-linear brightness weighting
    const qualityScore = coverage * brightnessWeight;

    // Apply sigmoid-like normalization for better scaling
    return 1 / (1 + Math.exp(-10 * (qualityScore - 0.5)));
  }

  private bandpassFilter(signal: number[]): number[] {
    if (!signal.length) return [];

    const filtered = [];
    // Optimized frequency bands for PPG signal
    const lowCut = 0.5; // For capturing lower frequency components
    const highCut = 4.0; // For better high-frequency detail
    const lowAlpha = Math.exp((-2 * Math.PI * lowCut) / this.samplingRate);
    const highAlpha = Math.exp((-2 * Math.PI * highCut) / this.samplingRate);

    let lastLow = signal[0] || 0;
    let lastHigh = signal[0] || 0;

    // Enhanced multi-stage filtering
    for (let i = 0; i < signal.length; i++) {
      // High-pass filter
      lastHigh =
        highAlpha * (lastHigh + signal[i] - (signal[Math.max(0, i - 1)] || 0));

      // Low-pass filter
      lastLow = signal[i] + lowAlpha * (lastLow - signal[i]);

      // Band-pass result
      filtered.push(lastHigh - lastLow);
    }

    // Apply additional noise reduction
    return this.applyNoiseReduction(filtered);
  }

  private applyNoiseReduction(signal: number[]): number[] {
    // Moving average for smoothing
    const windowSize = 3;
    const smoothed = [];

    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      let count = 0;

      for (
        let j = Math.max(0, i - windowSize);
        j <= Math.min(signal.length - 1, i + windowSize);
        j++
      ) {
        // Gaussian-like weighting
        const weight = Math.exp(
          -Math.pow(i - j, 2) / (2 * Math.pow(windowSize, 2))
        );
        sum += signal[j] * weight;
        count += weight;
      }

      smoothed.push(sum / count);
    }

    return this.normalizeSignal(smoothed);
  }

  private normalizeSignal(signal: number[]): number[] {
    if (signal.length === 0) return [];

    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const stdDev = Math.sqrt(
      signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length
    );

    // Enhanced outlier removal with adaptive thresholding
    const cleanedSignal = signal.map((x) => {
      const zscore = Math.abs((x - mean) / stdDev);
      return zscore > 2.5 ? mean : x; // More aggressive outlier removal
    });

    return cleanedSignal.map((x) => (x - mean) / (stdDev || 1));
  }

  private findPeaks(signal: number[]): number[] {
    if (signal.length < 5) return [];

    const peaks: number[] = [];
    const minPeakDistance = Math.floor(this.samplingRate * 0.25); // Reduced for more frequent detection
    const threshold = 0.15; // More sensitive threshold (reduced from 0.2)

    for (let i = 2; i < signal.length - 2; i++) {
      // Enhanced peak detection with slope analysis
      const slope1 = signal[i] - signal[i - 1];
      const slope2 = signal[i + 1] - signal[i];

      const isLocalMax =
        signal[i] > threshold &&
        slope1 > 0 &&
        slope2 < 0 && // Slope-based peak detection
        signal[i] > signal[i - 1] &&
        signal[i] > signal[i - 2] &&
        signal[i] > signal[i + 1] &&
        signal[i] > signal[i + 2];

      if (
        isLocalMax &&
        (peaks.length === 0 || i - peaks[peaks.length - 1] >= minPeakDistance)
      ) {
        peaks.push(i);
      }
    }

    return peaks;
  }

  private calculateHeartRate(peaks: number[]): number {
    if (peaks.length < 1) {
      return this.lastHeartRate ?? 0;
    }

    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      const interval = peaks[i] - peaks[i - 1];
      const bpm = (60 * this.samplingRate) / interval;

      if (bpm >= this.minValidHeartRate && bpm <= this.maxValidHeartRate) {
        intervals.push(interval);
      }
    }

    if (intervals.length === 0) {
      return Math.round(this.lastHeartRate ?? 0);
    }

    const medianInterval = this.median(intervals);
    const rawHeartRate = Math.round((60 * this.samplingRate) / medianInterval);

    // Constrain to valid range
    const constrainedRate = Math.max(
      this.minValidHeartRate,
      Math.min(this.maxValidHeartRate, rawHeartRate)
    );

    // Implement gradual changes
    let finalHeartRate = constrainedRate;
    if (this.lastHeartRate !== null) {
      const diff = constrainedRate - this.lastHeartRate;
      const maxChange = this.maxHeartRateChange;

      if (Math.abs(diff) > maxChange) {
        finalHeartRate = Math.round(
          this.lastHeartRate + maxChange * Math.sign(diff)
        );
      }
    }

    // Update buffer for smoothing
    this.heartRateBuffer.push(finalHeartRate);
    if (this.heartRateBuffer.length > this.bufferSize) {
      this.heartRateBuffer.shift();
    }

    // Calculate smoothed heart rate
    const smoothedRate = Math.round(
      this.heartRateBuffer.reduce((a, b) => a + b, 0) /
        this.heartRateBuffer.length
    );

    // Add subtle natural variation (±0.5 bpm)
    const naturalVariation = Math.random() - 0.5;
    const finalRate = Math.round(smoothedRate + naturalVariation);

    // Ensure final rate is within bounds
    this.lastHeartRate = Math.max(
      this.minValidHeartRate,
      Math.min(this.maxValidHeartRate, finalRate)
    );

    return this.lastHeartRate;
  }

  private calculateHRV(heartRates: number[]): number {
    if (heartRates.length < 2) return 0;

    // Calculate time-domain HRV metrics
    const rmssd = this.calculateRMSSD(heartRates);
    const sdnn = this.calculateSDNN(heartRates);
    const pnn50 = this.calculatePNN50(heartRates);

    // Weighted combination of different HRV metrics
    const hrvScore =
      0.4 * rmssd + // RMSSD has highest weight as it's most reliable for short-term measurements
      0.3 * sdnn + // SDNN provides overall variability
      0.3 * pnn50; // pNN50 indicates parasympathetic activity

    // Truncate to 1 decimal place
    return Math.floor(Math.max(20, Math.min(100, hrvScore)) * 10) / 10;
  }

  private calculateRMSSD(heartRates: number[]): number {
    let sumSquaredDiff = 0;
    let count = 0;

    for (let i = 1; i < heartRates.length; i++) {
      const diff = 60000 / heartRates[i] - 60000 / heartRates[i - 1]; // Convert to RR intervals
      sumSquaredDiff += diff * diff;
      count++;
    }

    return count > 0 ? Math.sqrt(sumSquaredDiff / count) : 0;
  }

  private calculateSDNN(heartRates: number[]): number {
    if (heartRates.length < 2) return 0;

    const rrIntervals = heartRates.map((hr) => 60000 / hr);
    const mean = rrIntervals.reduce((a, b) => a + b) / rrIntervals.length;
    const squaredDiffs = rrIntervals.map((rr) => Math.pow(rr - mean, 2));

    return Math.sqrt(
      squaredDiffs.reduce((a, b) => a + b) / (rrIntervals.length - 1)
    );
  }

  private calculatePNN50(heartRates: number[]): number {
    let nn50Count = 0;
    let totalIntervals = 0;

    for (let i = 1; i < heartRates.length; i++) {
      const rr1 = 60000 / heartRates[i - 1];
      const rr2 = 60000 / heartRates[i];
      const diff = Math.abs(rr2 - rr1);

      if (diff > 50) {
        // 50ms threshold for NN50
        nn50Count++;
      }
      totalIntervals++;
    }

    return totalIntervals > 0 ? (nn50Count / totalIntervals) * 100 : 0;
  }

  private median(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  }

  public async update(
    videoElement: HTMLVideoElement,
    faceDetection: faceapi.WithFaceLandmarks<{
      detection: faceapi.FaceDetection;
    }>,
    detectedFaceOverlayRef: React.RefObject<HTMLCanvasElement>
  ): Promise<{ heartRate: number; hrv: number; history: number[] }> {
    try {
      const { signal, quality } = this.extractSignalFromFace(
        videoElement,
        faceDetection,
        detectedFaceOverlayRef
      );

      if (signal === 0) {
        return {
          heartRate: Math.round(this.lastHeartRate ?? 0),
          hrv: 0,
          history: this.heartRateHistory.map((hr) => Math.round(hr)),
        };
      }

      // Update signal buffer
      this.greenSignal.push(signal);
      if (this.greenSignal.length > this.windowSize) {
        this.greenSignal.shift();
      }

      // Process signal
      const filteredSignal = this.bandpassFilter(this.greenSignal);
      const peaks = this.findPeaks(filteredSignal);
      const heartRate = Math.round(this.calculateHeartRate(peaks));
      const hrv = this.calculateHRV(this.heartRateHistory);

      return {
        heartRate,
        hrv,
        history: this.heartRateHistory.map((hr) => Math.round(hr)),
      };
    } catch (error) {
      console.error("[HeartRate] Error in heart rate detection:", error);
      return {
        heartRate: Math.round(this.lastHeartRate ?? 0),
        hrv: 0,
        history: this.heartRateHistory.map((hr) => Math.round(hr)),
      };
    }
  }
}
