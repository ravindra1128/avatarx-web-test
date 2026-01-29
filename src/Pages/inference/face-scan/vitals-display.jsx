import { Card, CardHeader, CardTitle } from "../../../Component/Cards/card";
import { Heart, Activity, Wind, Gauge } from "lucide-react";

export default function VitalsDisplay({ vitals }) {
  if (!vitals) return null;

  return (
    <div className="p-4 overflow-y-auto">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800">
          Your Health Vitals
        </h2>
        <p className="text-slate-500 text-sm">Scan completed successfully</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Heart className="h-4 w-4 mr-2 text-red-500" />
              Heart Rate
            </CardTitle>
          </CardHeader>
          <div>
            <p className="text-2xl font-bold">{vitals.heartRate}</p>
            <p className="text-xs text-slate-500">Normal range: 60-100 bpm</p>
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2 text-emerald-500" />
              Blood Pressure
            </CardTitle>
          </CardHeader>
          <div>
            <p className="text-2xl font-bold">{vitals.bloodPressure}</p>
            <p className="text-xs text-slate-500">Normal range: 90-120/60-80</p>
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Wind className="h-4 w-4 mr-2 text-purple-500" />
              Respiration Rate
            </CardTitle>
          </CardHeader>
          <div>
            <p className="text-2xl font-bold">{vitals.respirationRate}</p>
            <p className="text-xs text-slate-500">
              Normal range: 12-20 breaths per minute
            </p>
          </div>
        </Card>

        {vitals.stressIndex && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="h-4 w-4 mr-2 text-orange-500" />
                Stress Index
              </CardTitle>
            </CardHeader>
            <div>
              <p className="text-2xl font-bold">{vitals.stressIndex}</p>
              <p className="text-xs text-slate-500">
                Lower values indicate less stress
              </p>
            </div>
          </Card>
        )}

        {vitals.cardiacWorkload && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Gauge className="h-4 w-4 mr-2 text-indigo-500" />
                Cardiac Workload
              </CardTitle>
            </CardHeader>
            <div>
              <p className="text-2xl font-bold">{vitals.cardiacWorkload}</p>
              <p className="text-xs text-slate-500">mmHg per second</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
