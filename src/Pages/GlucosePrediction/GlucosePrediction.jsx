import { lazy, Suspense } from 'react';
import Loader from '../../Component/Loader';

const ShanAIGlucosePrediction = lazy(() => import('./ShanAIGlucosePrediction'));

const GlucosePrediction = () => {
  return (
    <Suspense fallback={<Loader />}>
      <ShanAIGlucosePrediction />
    </Suspense>
  );
};

export default GlucosePrediction;

