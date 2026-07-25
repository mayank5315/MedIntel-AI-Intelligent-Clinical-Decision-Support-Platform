import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

export const diagnosePatient = async (patientData) => {
  const response = await api.post('/diagnose', patientData);
  return response.data;
};

export const getSymptoms = async () => {
  const response = await api.get('/symptoms');
  return response.data;
};

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const chatWithAssistant = async (message, diagnosisContext, chatHistory = []) => {
  const response = await api.post('/chat', {
    message,
    diagnosis_context: diagnosisContext,
    chat_history: chatHistory
  }, { timeout: 200000 }); // 200s timeout for LLM responses via Ollama
  return response.data;
};

export const getOllamaStatus = async () => {
  const response = await api.get('/ollama/status');
  return response.data;
};

export default api;
