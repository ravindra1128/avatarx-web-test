'use client';

import { createContext, useContext, useState, ReactNode } from "react";
import { VitalsData } from "@/components/health-check/VitalsDisplay";

interface AnalysisContextType {
  analysisData: VitalsData | null;
  setAnalysisData: (data: VitalsData | null) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  isMicrosoftLogin: boolean;
  setIsMicrosoftLogin: (value: boolean) => void;
  replitBloodGlucose: number | null;
  setReplitBloodGlucose: (value: number | null) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [analysisData, setAnalysisData] = useState<VitalsData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMicrosoftLogin, setIsMicrosoftLogin] = useState(false);
  const [replitBloodGlucose, setReplitBloodGlucose] = useState<number | null>(null);

  return (
    <AnalysisContext.Provider
      value={{
        analysisData,
        setAnalysisData,
        isLoggedIn,
        setIsLoggedIn,
        isMicrosoftLogin,
        setIsMicrosoftLogin,
        replitBloodGlucose,
        setReplitBloodGlucose
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
}