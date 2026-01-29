// import { Progress } from "../../../Component/UI/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../../../Component/Cards/card";

/**
 * @typedef {Object} Video
 */

/**
 * @typedef {Object} ResultsDisplayProps
 * @property {Video} video
 * @property {{parkinsons: number}} result
 */

/**
 * @param {ResultsDisplayProps} props
 */
export default function ResultsDisplay({ video, result }) {
  const parkinsonsPercentage = result.parkinsons;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Inference Results</CardTitle>
      </CardHeader>
      <CardContent>
        {/* <div className="w-full mb-4">
          <audio
            src={video.url}
            controls
            crossOrigin="anonymous"
            className="rounded-lg"
            style={{ width: "100%" }}
          />
        </div> */}
        <div className="space-y-2 mb-4">
          <p>
            <strong>File Name:</strong> {video.name}
          </p>
          {video.size && (
            <p>
              <strong>File Size:</strong>{" "}
              {(video.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
          {video.type && (
            <p>
              <strong>File Type:</strong> {video.type}
            </p>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Prediction Results</h3>
          <div className="flex justify-between mb-2">
            <span>Parkinson{"'"}s</span>
            <span>Non-Parkinson{"'"}s</span>
          </div>
          {/* <Progress value={parkinsonsPercentage} className="w-full" /> */}
          <div className="flex justify-between mt-1">
            <span>{parkinsonsPercentage.toFixed(2)}%</span>
            <span>{(100 - parkinsonsPercentage).toFixed(2)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
