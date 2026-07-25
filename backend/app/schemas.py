from pydantic import BaseModel, Field
from typing import List

class PatientProfile(BaseModel):
    age: int = Field(ge=0, le=120)
    gender: str
    symptoms: List[str]
    allergies: List[str] = Field(default_factory=list)

class TopPrediction(BaseModel):
    disease: str
    confidence: float

class PredictionOutput(BaseModel):
    predicted_disease: str
    confidence: float
    top3: List[TopPrediction]

class MedicationItem(BaseModel):
    name: str
    ingredient: str
    side_effects: List[str] = Field(default_factory=list)

class WarningModel(BaseModel):
    level: str
    message: str

class DiagnosisResponse(BaseModel):
    prediction: PredictionOutput
    medications: List[MedicationItem]
    safety_score: int
    risk_level: str
    warnings: List[WarningModel]
    explanation: str = ""
    patient_age: int
    is_vulnerable: bool

class SymptomsResponse(BaseModel):
    symptoms: List[str]

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    diagnosis_context: dict
    chat_history: List[ChatMessage] = Field(default_factory=list)

class ChatResponse(BaseModel):
    response: str
    role: str = "assistant"
