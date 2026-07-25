import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, Loader2, Bot, User, Sparkles,
  AlertCircle, RefreshCw
} from 'lucide-react';
import { chatWithAssistant } from '../api/client';

// Simple markdown-to-JSX renderer for structured chatbot output
function RenderMarkdown({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  let listType = null; // 'ul' or 'ol'
  let inList = false;

  const flushList = (key) => {
    if (listItems.length > 0) {
      if (listType === 'ol') {
        elements.push(
          <ol key={key} className="list-decimal pl-5 my-2 space-y-1 text-sm text-slate/90">
            {listItems.map((item, i) => <li key={i}>{item}</li>)}
          </ol>
        );
      } else {
        elements.push(
          <ul key={key} className="list-disc pl-5 my-2 space-y-1 text-sm text-slate/90">
            {listItems.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        );
      }
      listItems = [];
      listType = null;
      inList = false;
    }
  };

  const formatInline = (str) => {
    // Bold
    str = str.replace(/\*\*(.*?)\*\*/g, '<strong class="text-sage font-semibold">$1</strong>');
    // Italic
    str = str.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code
    str = str.replace(/`(.*?)`/g, '<code class="bg-charcoal px-1.5 py-0.5 rounded text-sand text-xs font-mono">$1</code>');
    // Emoji-based alerts
    str = str.replace(/⚠️/g, '<span class="text-amber">⚠️</span>');
    str = str.replace(/🚨/g, '<span class="text-danger">🚨</span>');
    str = str.replace(/✅/g, '<span class="text-emerald">✅</span>');
    str = str.replace(/💊/g, '<span>💊</span>');
    str = str.replace(/🩺/g, '<span>🩺</span>');
    return str;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList(`list-${idx}`);
      return;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList(`list-${idx}`);
      elements.push(
        <h4 key={idx} className="text-sm font-bold text-sage mt-3 mb-1 uppercase tracking-wide"
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(4)) }} />
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList(`list-${idx}`);
      elements.push(
        <h3 key={idx} className="text-base font-bold text-sage mt-3 mb-1"
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(3)) }} />
      );
      return;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***') {
      flushList(`list-${idx}`);
      elements.push(<hr key={idx} className="border-moduleBorder my-2" />);
      return;
    }

    // Unordered list
    const ulMatch = trimmed.match(/^[-*]\s+(.*)/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        flushList(`list-${idx}`);
        listType = 'ul';
        inList = true;
      }
      listItems.push(
        <span dangerouslySetInnerHTML={{ __html: formatInline(ulMatch[1]) }} />
      );
      return;
    }

    // Ordered list
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        flushList(`list-${idx}`);
        listType = 'ol';
        inList = true;
      }
      listItems.push(
        <span dangerouslySetInnerHTML={{ __html: formatInline(olMatch[2]) }} />
      );
      return;
    }

    // Regular paragraph
    flushList(`list-${idx}`);
    elements.push(
      <p key={idx} className="text-sm text-slate/90 leading-relaxed my-1"
        dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
    );
  });

  flushList('list-final');
  return <>{elements}</>;
}

// Suggested quick-ask buttons
const QUICK_QUESTIONS = [
  "Explain my diagnosis",
  "Are my medications safe?",
  "What does the safety score mean?",
  "What should I do next?",
];

export default function ChatPanel({ diagnosisContext }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Reset chat when diagnosis context changes
  useEffect(() => {
    if (diagnosisContext) {
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm the **MedIntel AI Clinical Assistant**. I've reviewed the diagnosis results for this patient.\n\nThe primary diagnosis is **${diagnosisContext.prediction?.predicted_disease || 'Unknown'}** with a confidence of **${diagnosisContext.prediction?.confidence || 0}%** and a safety score of **${diagnosisContext.safety_score ?? 'N/A'}/100** (${diagnosisContext.risk_level || 'Unknown'}).\n\nFeel free to ask me anything about the diagnosis, medications, risk factors, or next steps.`
      }]);
      setError(null);
    }
  }, [diagnosisContext]);

  const handleSend = async (messageText = null) => {
    const msg = (messageText || input).trim();
    if (!msg || isLoading) return;

    const userMessage = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await chatWithAssistant(msg, diagnosisContext, chatHistory);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.response
      }]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to get a response. Please check if Ollama is running.';
      setError(errorMsg);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ **Error**: ${errorMsg}\n\nPlease ensure Ollama is running with \`ollama serve\` and try again.`,
        isError: true
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showQuickQuestions = messages.length <= 1 && !isLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card rounded-xl flex flex-col h-full glow-border overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-moduleBorder bg-module/50">
        <div className="flex items-center gap-2">
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-sage" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald rounded-full animate-pulse" />
          </div>
          <h3 className="text-sm font-medium text-slate uppercase tracking-wider">
            Clinical AI Assistant
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slateMuted font-medium px-2 py-0.5 bg-charcoal rounded-full border border-moduleBorder">
            <Sparkles className="w-3 h-3 inline mr-1 text-sand" />
            Ollama · llama3.2
          </span>
          {messages.length > 1 && (
            <button
              onClick={() => {
                setMessages([messages[0]]);
                setError(null);
              }}
              className="text-slateMuted hover:text-sage transition-colors p-1"
              title="Reset conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${
                  msg.isError ? 'bg-danger/10 text-danger' : 'bg-sage/10 text-sage'
                }`}>
                  <Bot className="w-4 h-4" />
                </div>
              )}
              
              <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-sage/15 border border-sage/20 text-slate'
                  : msg.isError
                    ? 'bg-danger/5 border border-danger/20 text-slate'
                    : 'bg-charcoal/60 border border-moduleBorder text-slate'
              }`}>
                <RenderMarkdown text={msg.content} />
              </div>

              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-sand/10 text-sand flex items-center justify-center mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-sage/10 text-sage flex items-center justify-center mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-charcoal/60 border border-moduleBorder rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-sage animate-spin" />
              <span className="text-sm text-slateMuted">Analyzing clinical context...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <AnimatePresence>
        {showQuickQuestions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-2"
          >
            <p className="text-[10px] text-slateMuted uppercase tracking-wider mb-2 font-medium">Quick Questions</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleSend(q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-module border border-moduleBorder 
                    text-slateMuted hover:text-sage hover:border-sage/30 transition-all duration-200
                    hover:bg-sage/5"
                >
                  {q}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-3 border-t border-moduleBorder bg-module/30">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your diagnosis, medications, or risk factors..."
            disabled={isLoading || !diagnosisContext}
            className="flex-1 bg-charcoal border border-moduleBorder text-slate text-sm rounded-lg 
              focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage/30
              px-4 py-2.5 transition-all duration-200
              placeholder:text-slateMuted/50 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim() || !diagnosisContext}
            className={`p-2.5 rounded-lg transition-all duration-200 ${
              isLoading || !input.trim()
                ? 'bg-moduleBorder text-slateMuted cursor-not-allowed'
                : 'bg-sage text-charcoal hover:bg-sageDark shadow-[0_0_10px_rgba(141,186,153,0.2)]'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
