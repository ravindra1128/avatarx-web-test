import VideoInference from './VideoInference'
// import { Progress } from "../../../Component/UI/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../../../Component/Cards/card";

export default function ResultsDisplay({ video, result }) {
  const depressedPercentage = result.depressed;


  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Inference Results</CardTitle>
      </CardHeader>
      <CardContent>
     
        <div className="space-y-2 mb-4">
          <p><strong>File Name:</strong> {video.name}</p>
          {video.size && <p><strong>File Size:</strong> {(video.size / 1024 / 1024).toFixed(2)} MB</p>}
          {video.type && <p><strong>File Type:</strong> {video.type}</p>}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Prediction Results</h3>
          <div className="flex justify-between mb-2">
            <span>Depressed</span>
            <span>Non-Depressed</span>
          </div>
          {/* <Progress value={depressedPercentage} className="w-full" /> */}
          <div className="flex justify-between mt-1">
            <span>{depressedPercentage.toFixed(2)}%</span>
            <span>{(100 - depressedPercentage).toFixed(2)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}