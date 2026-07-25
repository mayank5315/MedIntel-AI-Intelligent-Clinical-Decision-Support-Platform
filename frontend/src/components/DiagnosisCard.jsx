import React from 'react';
import { motion } from 'framer-motion';
import { Stethoscope } from 'lucide-react';

export default function DiagnosisCard({ prediction }) {
  if (!prediction) return null;

  const { predicted_disease, confidence, top3 } = prediction;
  
  const getConfidenceColor = (conf) => {
    if (conf >= 80) return 'bg-emerald text-emerald';
    if (conf >= 50) return 'bg-amber text-amber';
    return 'bg-danger text-danger';
  };

  const confColorClass = getConfidenceColor(confidence);
  const bgColorClass = confColorClass.split(' ')[0];
  const textColorClass = confColorClass.split(' ')[1];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-5 flex flex-col h-full glow-border"
    >
      <div className="flex items-center gap-2 mb-1">
        <Stethoscope className="w-5 h-5 text-slateMuted" />
        <h3 className="text-sm font-medium text-slateMuted uppercase tracking-wider">Primary Diagnosis</h3>
      </div>
      <p className="text-[10px] text-slateMuted/60 uppercase tracking-widest mb-3 pl-7">XGBoost Classifier · Disease Prediction Model</p>

      <div className="flex items-end justify-between mb-2">
        <h2 className="text-2xl font-bold text-slate leading-tight">{predicted_disease || 'Unknown'}</h2>
        <div className="flex flex-col items-end">
          <span className={`text-2xl font-bold ${textColorClass}`}>{confidence}%</span>
          <span className="text-[10px] text-slateMuted uppercase tracking-wider">Prediction Probability</span>
        </div>
      </div>

      {/* Main Probability Bar */}
      <div className="w-full h-2 bg-charcoal rounded-full overflow-hidden mb-6">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${bgColorClass} shadow-[0_0_10px_currentColor]`}
        />
      </div>

      {/* Differential Diagnoses */}
      {top3 && top3.length > 0 && (
        <div className="mt-auto space-y-3">
          <h4 className="text-xs font-medium text-slateMuted uppercase tracking-wider mb-2 border-b border-moduleBorder pb-1">Differential Diagnoses</h4>
          {top3.slice(1).map((diff, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate">{diff.disease}</span>
                <span className="text-slateMuted">{diff.confidence}%</span>
              </div>
              <div className="w-full h-1 bg-charcoal rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${diff.confidence}%` }}
                  transition={{ duration: 1, delay: 0.2 + (idx * 0.1) }}
                  className="h-full bg-slateMuted/50"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
