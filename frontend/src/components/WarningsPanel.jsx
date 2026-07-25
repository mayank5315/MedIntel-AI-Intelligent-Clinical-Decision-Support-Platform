import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, Info, FileText, CheckCircle } from 'lucide-react';

export default function WarningsPanel({ warnings }) {
  const getSeverityConfig = (level) => {
    switch(level?.toLowerCase()) {
      case 'critical':
        return { icon: ShieldAlert, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30', bar: 'bg-danger' };
      case 'major':
        return { icon: AlertTriangle, color: 'text-amber', bg: 'bg-amber/10', border: 'border-amber/30', bar: 'bg-amber' };
      case 'minor':
        return { icon: Info, color: 'text-sand', bg: 'bg-sand/10', border: 'border-sand/30', bar: 'bg-sand' };
      default:
        return { icon: FileText, color: 'text-slate', bg: 'bg-slate/10', border: 'border-slate/30', bar: 'bg-slate' };
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-xl p-5 flex flex-col h-full glow-border"
    >
      <div className="flex items-center gap-2 mb-4 border-b border-moduleBorder pb-3">
        <AlertTriangle className="w-5 h-5 text-amber" />
        <h3 className="text-sm font-medium text-slate uppercase tracking-wider">Clinical Alerts</h3>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin space-y-3">
        {(!warnings || warnings.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center opacity-70">
            <CheckCircle className="w-8 h-8 text-emerald mb-2" />
            <span className="text-sm text-emerald font-medium">No critical alerts detected</span>
          </div>
        ) : (
          warnings.map((warning, idx) => {
            const config = getSeverityConfig(warning.level);
            const Icon = config.icon;
            
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + (idx * 0.1) }}
                className={`relative overflow-hidden rounded-lg border ${config.border} ${config.bg} p-3 pl-4 flex gap-3`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bar}`}></div>
                <div className={`mt-0.5 ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color} mb-1 block`}>
                    {warning.level} ALERT
                  </span>
                  <p className="text-sm text-slate leading-snug">
                    {warning.message}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
