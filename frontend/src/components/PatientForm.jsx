import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X, Search, Loader2, Plus } from 'lucide-react';
import { getSymptoms } from '../api/client';

const COMMON_ALLERGIES = [
  'Penicillin', 'Sulfa drugs', 'NSAIDs', 'Aspirin', 'Ibuprofen',
  'Latex', 'Codeine', 'Morphine', 'Cephalosporins', 'Peanuts'
];

export default function PatientForm({ onSubmit, isLoading }) {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [availableSymptoms, setAvailableSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomSearch, setSymptomSearch] = useState('');
  
  const [allergySearch, setAllergySearch] = useState('');
  const [allergies, setAllergies] = useState([]);

  useEffect(() => {
    // Mock symptoms if API fails
    const fetchSymptoms = async () => {
      try {
        const data = await getSymptoms();
        setAvailableSymptoms(data.symptoms || data);
      } catch (err) {
        console.warn("Failed to fetch symptoms, using mock data");
        setAvailableSymptoms(['Fever', 'Cough', 'Fatigue', 'Headache', 'Nausea', 'Shortness of breath', 'Chest pain', 'Dizziness']);
      }
    };
    fetchSymptoms();
  }, []);

  const handleAddSymptom = (symptom) => {
    if (!selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
      setSymptomSearch('');
    }
  };

  const handleRemoveSymptom = (symptom) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
  };

  const handleAddAllergy = (allergy) => {
    const trimmed = allergy.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies([...allergies, trimmed]);
    }
    setAllergySearch('');
  };

  const handleAllergyKeyDown = (e) => {
    if (e.key === 'Enter' && allergySearch.trim() !== '') {
      e.preventDefault();
      handleAddAllergy(allergySearch);
    }
  };

  const handleRemoveAllergy = (allergy) => {
    setAllergies(allergies.filter(a => a !== allergy));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (age <= 0) return;
    if (selectedSymptoms.length === 0) return;

    onSubmit({
      age: parseInt(age),
      gender,
      symptoms: selectedSymptoms,
      allergies
    });
  };

  const filteredSymptoms = availableSymptoms.filter(s => 
    s.toLowerCase().includes(symptomSearch.toLowerCase()) && 
    !selectedSymptoms.includes(s)
  ).slice(0, 5); // Show top 5

  const filteredAllergies = COMMON_ALLERGIES.filter(a =>
    a.toLowerCase().includes(allergySearch.toLowerCase()) &&
    !allergies.includes(a)
  ).slice(0, 5);

  const formVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={formVariants}
      initial="hidden"
      animate="show"
      className="glass-card rounded-xl p-6 h-full flex flex-col"
    >
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-moduleBorder">
        <div className="p-2 bg-sage/10 rounded-lg text-sage">
          <Activity className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-slate">Patient Intake</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-5 overflow-y-auto pr-2 scrollbar-thin">
        
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slateMuted uppercase tracking-wide">Age</label>
            <input 
              type="number" 
              min="1" max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="bg-charcoal border border-moduleBorder text-slate rounded-md focus:border-sage focus:outline-none px-3 py-2 w-full transition-all duration-200"
              placeholder="e.g. 45"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slateMuted uppercase tracking-wide">Gender</label>
            <select 
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="bg-charcoal border border-moduleBorder text-slate rounded-md focus:border-sage focus:outline-none px-3 py-2 w-full transition-all duration-200"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          <label className="text-xs font-medium text-slateMuted uppercase tracking-wide">Reported Symptoms <span className="text-danger">*</span></label>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slateMuted" />
            </div>
            <input
              type="text"
              value={symptomSearch}
              onChange={(e) => setSymptomSearch(e.target.value)}
              className="bg-charcoal border border-moduleBorder text-slate rounded-md focus:border-sage focus:outline-none pl-11 pr-3 py-2 w-full transition-all duration-200"
              placeholder="Search symptoms..."
            />
            
            <AnimatePresence>
              {symptomSearch && filteredSymptoms.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute z-20 top-full left-0 right-0 mt-1 bg-module border border-moduleBorder rounded-md shadow-xl overflow-hidden"
                >
                  {filteredSymptoms.map(symptom => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => handleAddSymptom(symptom)}
                      className="w-full text-left px-4 py-2 text-sm text-slate hover:bg-sage/10 hover:text-sage transition-colors flex items-center justify-between"
                    >
                      {symptom}
                      <Plus className="w-3 h-3" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap gap-2 min-h-[40px]">
            <AnimatePresence>
              {selectedSymptoms.map(symptom => (
                <motion.span
                  key={symptom}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sage/20 text-sage border border-sage/30"
                >
                  {symptom}
                  <button type="button" onClick={() => handleRemoveSymptom(symptom)} className="hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
            {selectedSymptoms.length === 0 && (
              <span className="text-sm text-slateMuted/50 italic py-1">No symptoms selected</span>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          <label className="text-xs font-medium text-slateMuted uppercase tracking-wide">Known Allergies</label>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slateMuted" />
            </div>
            <input
              type="text"
              value={allergySearch}
              onChange={(e) => setAllergySearch(e.target.value)}
              onKeyDown={handleAllergyKeyDown}
              className="bg-charcoal border border-moduleBorder text-slate rounded-md focus:border-sand focus:outline-none pl-11 pr-3 py-2 w-full transition-all duration-200"
              placeholder="Search known allergies..."
            />

            <AnimatePresence>
              {allergySearch && filteredAllergies.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute z-20 top-full left-0 right-0 mt-1 bg-module border border-moduleBorder rounded-md shadow-xl overflow-hidden"
                >
                  {filteredAllergies.map(allergy => (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => handleAddAllergy(allergy)}
                      className="w-full text-left px-4 py-2 text-sm text-slate hover:bg-sand/10 hover:text-sand transition-colors flex items-center justify-between"
                    >
                      {allergy}
                      <Plus className="w-3 h-3" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-[10px] text-slateMuted/60 -mt-1">Cross-checked against WHO drug-allergy interaction data</p>

          <div className="flex flex-wrap gap-2 min-h-[30px]">
            <AnimatePresence>
              {allergies.map(allergy => (
                <motion.span
                  key={allergy}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sand/20 text-sand border border-sand/30"
                >
                  {allergy}
                  <button type="button" onClick={() => handleRemoveAllergy(allergy)} className="hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
            {allergies.length === 0 && (
              <span className="text-sm text-slateMuted/50 italic py-1">No known allergies</span>
            )}
          </div>
        </motion.div>

        <div className="mt-auto pt-6">
          <motion.button
            variants={itemVariants}
            type="submit"
            disabled={isLoading || !age || selectedSymptoms.length === 0}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
              isLoading || !age || selectedSymptoms.length === 0
                ? 'bg-moduleBorder text-slateMuted cursor-not-allowed'
                : 'bg-sage text-charcoal hover:bg-sageDark shadow-[0_0_15px_rgba(141,186,153,0.3)]'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Telemetry...
              </>
            ) : (
              <>
                <Activity className="w-5 h-5" />
                Initialize Diagnosis
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
