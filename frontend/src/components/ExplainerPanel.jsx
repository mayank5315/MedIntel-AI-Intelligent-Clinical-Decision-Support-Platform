import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';

export default function ExplainerPanel({ explanation }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!explanation) return null;

  // Simple markdown parser for basic formatting
  const parseMarkdown = (text) => {
    if (!text) return null;
    
    // Split by double newlines for paragraphs
    const paragraphs = text.split('\n\n');
    
    return paragraphs.map((para, i) => {
      // Bold text handling
      let htmlPara = para.replace(/\*\*(.*?)\*\*/g, '<strong class="text-sage font-semibold">$1</strong>');
      
      // Handle list items (simple approach)
      if (para.trim().startsWith('- ') || para.trim().startsWith('* ')) {
        const items = para.split('\n').map(item => item.replace(/^[-*]\s/, ''));
        return (
          <ul key={i} className="list-disc pl-5 my-2 text-sm text-slate/90 space-y-1">
            {items.map((item, j) => (
              <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-sage font-semibold">$1</strong>') }} />
            ))}
          </ul>
        );
      }

      return (
        <p key={i} className="text-sm text-slate/90 leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: htmlPara }} />
      );
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-xl overflow-hidden glow-border col-span-2 flex flex-col"
    >
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between bg-module hover:bg-module/80 transition-colors border-b border-moduleBorder focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-sage" />
          <h3 className="text-sm font-medium text-slate uppercase tracking-wider">Clinical Reasoning — Agentic RAG Analysis</h3>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-slateMuted" /> : <ChevronDown className="w-5 h-5 text-slateMuted" />}
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-5 max-h-[300px] overflow-y-auto scrollbar-thin bg-charcoal/30">
              <div className="prose prose-invert max-w-none">
                {parseMarkdown(explanation)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
