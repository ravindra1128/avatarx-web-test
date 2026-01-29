import { useState, useEffect } from "react";
import VideoInference from './VideoInference'
import ResultsDisplay from "./ResultsDisplay";
import { Button } from "../../../Component/Buttons/Button"
import { Loader2 } from "lucide-react";
import axios from "axios";
import { VITE_HUME_API_KEY } from "../../../lib/constants";

async function startInference(video) {
  // Simulating API call to start inference

  const job = await axios.post(
    "https://api.hume.ai/v0/batch/jobs/tl/inference",
    {
      custom_model: {
        id: "bdae0e47-5182-48a6-bd81-990f9e2f38b6",
      },
      notify: true,
      urls: [video.url],
    },
    {
      headers: {
        "x-hume-api-key": VITE_HUME_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );


  return job.data;
}

async function checkJobStatus(jobId) {
  try {
    const response = await axios.get(
      `https://api.hume.ai/v0/batch/jobs/${jobId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-hume-api-key": VITE_HUME_API_KEY,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching job status:", error);
    throw error;
  }
}

export default function InferenceProcess({ video, setIsPredicting }) {
  const [jobId, setJobId] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const startInferenceProcess = async () => {
      setIsLoading(true);
      try {
        const { job_id } = await startInference(video);
        setJobId(job_id);
      } catch (error) {
        console.error("Error starting inference:", error);
      } finally {
        setIsLoading(false);
      }
    };

    startInferenceProcess();
  }, [video]);

  const getPredictions = async (jobId) => {
    const response = await axios.get(
      `https://api.hume.ai/v0/batch/jobs/${jobId}/predictions`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-hume-api-key": VITE_HUME_API_KEY,
        },
      }
    );
    
    const tempRes = response.data[0].results.predictions[0].custom_models["5ae76a1c-5814-444a-a5e9-670d556dfbfc"].output["Depressed Mood"];
    
    setIsPredicting(false);

    return { depressed: tempRes*100 };
  };

  useEffect(() => {
    let intervalId;

    const checkStatus = async () => {
      if (jobId) {
        try {
          const status = await checkJobStatus(jobId);
          if (status.state.status === "COMPLETED") {
            const res = await getPredictions(jobId);
            setResult(res);
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error("Error checking job status:", error);
        }
      }
    };

    if (jobId) {
      intervalId = setInterval(checkStatus, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [jobId]);

  if (isLoading || (jobId && !result)) {
    return (
      <div className="flex items-center justify-center mt-6">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>
          {jobId
            ? `Inference in progress... (Job ID: ${jobId})`
            : "Starting inference process..."}
        </span>
      </div>
    );
  }

  if (result) {
    return <ResultsDisplay video={video} result={result} />;
  }

  return null;
}
