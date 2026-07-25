import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function SafetyGauge({ safety_score, risk_level }) {
  const [offset, setOffset] = useState(220); // Circle circumference approx 220
  
  useEffect(() => {
    // 220 is approx circumference of r=35 circle
    const circumference = 2 * Math.PI * 35;
    const strokeDashoffset = circumference - (safety_score / 100) * circumference;
    
    // Slight delay for animation
    setTimeout(() => {
      setOffset(strokeDashoffset);
    }, 100);
  }, [safety_score]);

  const getColor = (score) => {
    if (score >= 85) return '#10B981'; // Emerald
    if (score >= 60) return '#F59E0B'; // Amber
    return '#EF4444'; // Danger
  };

  const color = getColor(safety_score);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card rounded-xl p-5 flex flex-col h-full items-center justify-center glow-border relative"
    >
      <div className="absolute top-5 left-5 flex items-center gap-2">
        <Shield className="w-5 h-5 text-slateMuted" />
        <h3 className="text-sm font-medium text-slateMuted uppercase tracking-wider">Safety Index</h3>
      </div>

      <div className="relative w-40 h-40 mt-6 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="35"
            stroke="#1C2329"
            strokeWidth="8"
            fill="transparent"
            className="drop-shadow-lg"
          />
          {/* Animated Foreground Circle */}
          <motion.circle
            cx="80"
            cy="80"
            r="35"
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray="220"
            initial={{ strokeDashoffset: 220 }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate leading-none" style={{ color }}>
            {safety_score}
          </span>
          <span className="text-[10px] text-slateMuted font-medium uppercase mt-1">/ 100</span>
        </div>
      </div>

      <div className="mt-4 px-4 py-1.5 rounded-full border border-moduleBorder bg-charcoal/50 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
        <span className="text-sm font-medium text-slate uppercase tracking-wider">{risk_level || 'Unknown Risk'}</span>
      </div>
    </motion.div>
  );
}
