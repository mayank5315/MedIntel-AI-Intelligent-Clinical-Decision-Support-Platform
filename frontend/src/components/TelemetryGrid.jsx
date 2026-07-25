import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import DiagnosisCard from './DiagnosisCard';
import SafetyGauge from './SafetyGauge';
import MedicationPanel from './MedicationPanel';
import WarningsPanel from './WarningsPanel';
import ExplainerPanel from './ExplainerPanel';
import ChatPanel from './ChatPanel';

export default function TelemetryGrid({ results, loading }) {
  
  if (loading) {
    return (
      <div className="min-h-[400px] w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-sage/20 rounded-full border-t-sage animate-spin"></div>
            <Activity className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-sage" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium text-sage animate-pulse">Processing Telemetry Data</h3>
            <p className="text-sm text-slateMuted">Running XGBoost and PyTorch DeepDDI inference...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-[400px] w-full flex items-center justify-center relative overflow-hidden rounded-xl border border-dashed border-moduleBorder bg-module/20">
        <div className="absolute inset-0 bg-sage/5 opacity-20 pointer-events-none" style={{ animation: 'scan-line 3s linear infinite' }}></div>
        <div className="text-center z-10 flex flex-col items-center">
          <Activity className="w-12 h-12 text-slateMuted/30 mb-4" />
          <h3 className="text-xl font-medium text-slateMuted mb-2">Awaiting Patient Data</h3>
          <p className="text-sm text-slateMuted/70 max-w-sm">
            Enter patient demographics and symptoms in the intake form to generate a hybrid ML+DL clinical analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="results"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col gap-6"
      >
        {/* Row 1: Diagnosis + Safety Gauge */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <DiagnosisCard prediction={results.prediction} />
          <SafetyGauge 
            safety_score={results.safety_score} 
            risk_level={results.risk_level} 
          />
        </div>
        
        {/* Row 2: Medications + Warnings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <MedicationPanel medications={results.medications} />
          <WarningsPanel warnings={results.warnings} />
        </div>
        
        {/* Row 3: Explainer (full width) */}
        <ExplainerPanel explanation={results.explanation} />

        {/* Row 4: Chat Panel (full width, comfortable height) */}
        <div className="h-[520px]">
          <ChatPanel diagnosisContext={results} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
