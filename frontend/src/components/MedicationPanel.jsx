import React from 'react';
import { motion } from 'framer-motion';
import { Pill } from 'lucide-react';

export default function MedicationPanel({ medications }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card rounded-xl p-5 flex flex-col h-full glow-border"
    >
      <div className="flex items-center gap-2 mb-4 border-b border-moduleBorder pb-3">
        <Pill className="w-5 h-5 text-sage" />
        <h3 className="text-sm font-medium text-slate uppercase tracking-wider">Recommended Medications</h3>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin space-y-3">
        {(!medications || medications.length === 0) ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-sm text-slateMuted italic">No specific medications recommended</span>
          </div>
        ) : (
          medications.map((med, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-charcoal border border-moduleBorder rounded-lg p-3 hover:border-sage/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-slate">{med.name}</h4>
                  <span className="text-xs text-slateMuted font-medium">{med.ingredient || 'Active Ingredient'}</span>
                </div>
                <div className="bg-sage/10 p-1.5 rounded-md text-sage">
                  <Pill className="w-4 h-4" />
                </div>
              </div>
              
              {med.side_effects && med.side_effects.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {med.side_effects.slice(0, 3).map((effect, eIdx) => (
                    <span key={eIdx} className="text-[10px] px-2 py-0.5 rounded-full bg-sand/10 text-sand border border-sand/20">
                      {effect}
                    </span>
                  ))}
                  {med.side_effects.length > 3 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-moduleBorder text-slateMuted">
                      +{med.side_effects.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
