import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Activity, Database, Network } from 'lucide-react';

const StatusIndicator = ({ label, icon: Icon, delay }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-module/50 border border-moduleBorder"
  >
    <Icon className="w-4 h-4 text-slateMuted" />
    <span className="text-xs font-medium text-slateMuted">{label}</span>
    <div className="flex items-center gap-1.5 ml-2">
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald"></span>
      </div>
      <span className="text-xs font-medium text-emerald uppercase tracking-wider">Online</span>
    </div>
  </motion.div>
);

export default function Header() {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-20 bg-module/80 backdrop-blur-md border-b border-moduleBorder relative z-10"
    >
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-sage/50 to-transparent"></div>
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 rounded-xl bg-charcoal border border-sage/30 flex items-center justify-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-sage/10 animate-pulse"></div>
            <Brain className="w-6 h-6 text-sage relative z-10" />
          </motion.div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-sage">MedIntel <span className="text-slate">AI</span></h1>
            <span className="text-xs text-slateMuted font-medium uppercase tracking-widest">Hybrid ML+DL Clinical Decision Support</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusIndicator label="ML Engine" icon={Activity} delay={0.2} />
          <StatusIndicator label="DL Network" icon={Network} delay={0.3} />
          <StatusIndicator label="RAG Pipeline" icon={Database} delay={0.4} />
        </div>

      </div>
    </motion.header>
  );
}
