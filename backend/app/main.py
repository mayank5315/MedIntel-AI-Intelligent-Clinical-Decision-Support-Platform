from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import joblib
import os
import logging

from app.schemas import PatientProfile, DiagnosisResponse, SymptomsResponse, ChatRequest, ChatResponse
from app.engine import run_hybrid_pipeline
from app.explainer import generate_clinical_explanation
from app.chat import chat_with_ollama, check_ollama_status

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
artifacts_dir = os.path.join(base_dir, "artifacts")

models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        models["model"] = joblib.load(os.path.join(artifacts_dir, "xgboost_disease_model.pkl"))
        models["le"] = joblib.load(os.path.join(artifacts_dir, "label_encoder.pkl"))
        models["mlb"] = joblib.load(os.path.join(artifacts_dir, "symptoms_binarizer.pkl"))
        logger.info("ML/DL Models loaded successfully.")
    except Exception as e:
        logger.warning(f"Could not load models. Please run train.py first. Error: {e}")
    
    # Check Ollama status at startup
    ollama_status = await check_ollama_status()
    if ollama_status["online"]:
        logger.info(f"Ollama connected. Model '{ollama_status['model']}' available: {ollama_status['model_available']}")
    else:
        logger.warning("Ollama is not running. Chat functionality will be unavailable.")
    
    yield
    models.clear()

app = FastAPI(
    title="MedIntel AI",
    description="Hybrid ML+DL Clinical Decision Support System",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    ollama_status = await check_ollama_status()
    return {
        "status": "ok",
        "models_loaded": "model" in models,
        "ollama": ollama_status
    }

@app.get("/api/symptoms", response_model=SymptomsResponse)
async def get_symptoms():
    if "mlb" not in models:
        raise HTTPException(status_code=500, detail="Models not loaded. Please train the model.")
    return {"symptoms": list(models["mlb"].classes_)}

@app.post("/api/diagnose", response_model=DiagnosisResponse)
async def diagnose(profile: PatientProfile):
    if "model" not in models:
        raise HTTPException(status_code=500, detail="Models not loaded. Please train the model.")
        
    patient_dict = {
        "Age": profile.age,
        "Gender": profile.gender,
        "Symptoms": profile.symptoms,
        "Allergies": profile.allergies
    }
    
    try:
        pipeline_result = run_hybrid_pipeline(patient_dict, models["model"], models["le"], models["mlb"])
        explanation = generate_clinical_explanation(pipeline_result, patient_dict)
        
        response = DiagnosisResponse(
            prediction=pipeline_result["prediction"],
            medications=pipeline_result["medications"],
            safety_score=pipeline_result["safety_score"],
            risk_level=pipeline_result["risk_level"],
            warnings=pipeline_result["warnings"],
            patient_age=pipeline_result["patient_age"],
            is_vulnerable=pipeline_result["is_vulnerable"],
            explanation=explanation
        )
        return response
    except Exception as e:
        logger.error(f"Diagnosis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with the clinical AI assistant using diagnosis context."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    
    if not request.diagnosis_context:
        raise HTTPException(status_code=400, detail="Diagnosis context is required. Please run a diagnosis first.")
    
    try:
        history = [{"role": m.role, "content": m.content} for m in request.chat_history]
        
        response_text = await chat_with_ollama(
            user_message=request.message,
            diagnosis_context=request.diagnosis_context,
            chat_history=history
        )
        
        return ChatResponse(response=response_text, role="assistant")
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ollama/status")
async def ollama_status():
    """Check Ollama service status."""
    return await check_ollama_status()
