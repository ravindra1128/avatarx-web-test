import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

export async function loadFaceDetectionModels() {
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {

      const modelPath = '/models';
      const requiredModels = [
        'tiny_face_detector_model-weights_manifest.json',
        'tiny_face_detector_model.bin',
        'face_landmark_68_model-weights_manifest.json',
        'face_landmark_68_model.bin'
      ];

      // Create models directory if it doesn't exist
      try {
        await fetch(`${modelPath}/tiny_face_detector_model-weights_manifest.json`, { method: 'HEAD' });
      } catch (error) {
        console.warn('Models directory not found, will attempt to create from package');

        // Models will be loaded from the package's default location
        await faceapi.nets.tinyFaceDetector.load('/');
        await faceapi.nets.faceLandmark68Net.load('/');

        modelsLoaded = true;
        return;
      }

        // If models directory exists, verify files
      for (const model of requiredModels) {
        try {
          const response = await fetch(`${modelPath}/${model}`);
          if (!response.ok) {
            throw new Error(`Model file ${model} not accessible`);
          }
        } catch (error) {
          console.error(`Error verifying model ${model}:`, error);
          throw new Error(`Failed to access model file: ${model}`);
        }
      }

      // Load models sequentially with retries
      const loadModel = async (modelLoader: () => Promise<void>, name: string, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            await modelLoader();
            return;
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
          }
        }
      };

      await loadModel(
        () => faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
        'TinyFaceDetector'
      );

      await loadModel(
        () => faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
        'FaceLandmark68'
      );

      modelsLoaded = true;
    } catch (error) {
      console.error('Error loading face detection models:', error);
      modelsLoaded = false;
      loadingPromise = null;
      throw new Error(`Failed to load face detection models: ${error}`);
    }
  })();

  return loadingPromise;
}

export async function detectFace(video: HTMLVideoElement, detectedFaceOverlayRef: React.RefObject<HTMLCanvasElement>, drawFaceMapping?: any) {
  try {
    if (!modelsLoaded) {
      await loadFaceDetectionModels();
    }

    // Configure face detector options for better performance
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416, // Good balance between speed and accuracy
      scoreThreshold: 0.5
    });

    const detection = await faceapi.detectSingleFace(video, options)
      .withFaceLandmarks();

    if (detection) {

      // Visualize the detection on the canvas
      // drawFaceMapping(video, detection, detectedFaceOverlayRef);
      return detection;
    } else {
      return undefined;
    }
  } catch (error) {
    console.error('Error in face detection:', error);
    return undefined;
  }
}

export function isFaceWellPositioned(
  detection: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }> | undefined,
  videoWidth: number,
  videoHeight: number
) {
  if (!detection) return false;

  const face = detection.detection;
  const box = face.box;
  const landmarks = detection.landmarks;

  // Calculate face center point
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Define target zones
  const targetCenterX = videoWidth * 0.5;
  const targetCenterY = videoHeight * 0.45;
  const targetWidth = videoWidth * 0.5;
  const targetHeight = videoHeight * 0.75;

  // Calculate face size ratio relative to target
  const widthRatio = box.width / targetWidth;
  const heightRatio = box.height / targetHeight;

  // Check if face is centered with adaptive margins
  const horizontalMargin = targetWidth * 0.25 * (1 + Math.abs(1 - widthRatio));
  const verticalMargin = targetHeight * 0.25 * (1 + Math.abs(1 - heightRatio));

  const isHorizontallyCentered = Math.abs(centerX - targetCenterX) < horizontalMargin;
  const isVerticallyCentered = Math.abs(centerY - targetCenterY) < verticalMargin;

  // Check if face is the right size
  const isRightSize = widthRatio >= 0.5 && widthRatio <= 0.9 && heightRatio >= 0.5 && heightRatio <= 0.9;

  // Check face rotation using landmarks
  const rotation = calculateFaceRotation(landmarks);
  const isLookingForward = 
    Math.abs(rotation.pitch) < 20 && 
    Math.abs(rotation.yaw) < 20 && 
    Math.abs(rotation.roll) < 20;

  return isHorizontallyCentered && isVerticallyCentered && isRightSize && isLookingForward;
}

function calculateFaceRotation(landmarks: faceapi.FaceLandmarks68) {
  const points = landmarks.positions;

  // Get key facial landmarks
  const leftEye = points[36];
  const rightEye = points[45];
  const noseTip = points[30];
  const leftMouth = points[48];
  const rightMouth = points[54];

  // Calculate rotation angles
  const eyeSlope = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
  const mouthSlope = Math.atan2(rightMouth.y - leftMouth.y, rightMouth.x - leftMouth.x) * (180 / Math.PI);

  // Estimate head rotation
  const yaw = (rightEye.x - leftEye.x) / (rightMouth.x - leftMouth.x) * 45 - 45;
  const pitch = (noseTip.y - ((leftEye.y + rightEye.y) / 2)) / 
                ((leftMouth.y + rightMouth.y) / 2 - ((leftEye.y + rightEye.y) / 2)) * 45 - 22.5;
  const roll = (eyeSlope + mouthSlope) / 2;

  return { pitch, yaw, roll };
}