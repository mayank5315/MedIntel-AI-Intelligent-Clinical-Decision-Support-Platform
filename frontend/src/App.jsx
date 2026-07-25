import React, { useState } from 'react';
import Header from './components/Header';
import PatientForm from './components/PatientForm';
import TelemetryGrid from './components/TelemetryGrid';
import { diagnosePatient } from './api/client';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handlePatientSubmit = async (patientData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await diagnosePatient(patientData);
      setResults(data);
    } catch (err) {
      console.error("Diagnosis error:", err);
      setError(err.response?.data?.detail || "Failed to connect to MedIntel AI Engine. Please check if the backend is running.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal relative overflow-x-hidden">
      {/* Background glow effects */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sage/5 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald/5 blur-[120px] pointer-events-none"></div>
      
      <Header />
      
      <main className="flex flex-col lg:flex-row gap-5 p-5 max-w-[1800px] w-full mx-auto relative z-10">
        {/* Left Panel: Patient Form */}
        <div className="w-full lg:w-[28%] lg:min-w-[340px] lg:max-w-[420px] flex-shrink-0 lg:sticky lg:top-5 lg:self-start">
          <PatientForm onSubmit={handlePatientSubmit} isLoading={loading} />
        </div>
        
        {/* Right Panel: Telemetry Grid + Chat */}
        <div className="flex-1 min-w-0">
          <TelemetryGrid results={results} loading={loading} />
        </div>
      </main>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-danger/90 backdrop-blur-md text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-danger/50"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-4 opacity-70 hover:opacity-100 transition-opacity"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
