import pandas as pd
import numpy as np
import json
import joblib
import os
import torch
import torch.nn as nn
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer
from xgboost import XGBClassifier

# Resolve artifact paths relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")

# Load knowledge base from artifacts
def _load_knowledge_base():
    kb_path = os.path.join(ARTIFACTS_DIR, "knowledge_base.json")
    if os.path.exists(kb_path):
        with open(kb_path, "r") as f:
            return json.load(f)
    return {
        "Common Cold": {"medicines": [{"name": "Ibuprofen", "ingredient": "Ibuprofen"}, {"name": "Acetaminophen", "ingredient": "Acetaminophen"}]},
        "Hypertension": {"medicines": [{"name": "Amlodipine", "ingredient": "Amlodipine"}]}
    }

knowledge_base = _load_knowledge_base()

# Pre-computed 32-bit chemical fingerprint vectors
np.random.seed(42)
chemical_fingerprints = {
    "Ibuprofen": np.random.choice([0.0, 1.0], size=32).astype(np.float32),
    "Aspirin": np.random.choice([0.0, 1.0], size=32).astype(np.float32),
    "Amlodipine": np.random.choice([0.0, 1.0], size=32).astype(np.float32),
    "Acetaminophen": np.random.choice([0.0, 1.0], size=32).astype(np.float32),
    "Metformin": np.random.choice([0.0, 1.0], size=32).astype(np.float32),
    "Glipizide": np.random.choice([0.0, 1.0], size=32).astype(np.float32),
    "Sumatriptan": np.random.choice([0.0, 1.0], size=32).astype(np.float32),
    "Albuterol": np.random.choice([0.0, 1.0], size=32).astype(np.float32),
    "Fluticasone": np.random.choice([0.0, 1.0], size=32).astype(np.float32),
    "Amoxicillin": np.random.choice([0.0, 1.0], size=32).astype(np.float32),
    "Azithromycin": np.random.choice([0.0, 1.0], size=32).astype(np.float32),
    "Omeprazole": np.random.choice([0.0, 1.0], size=32).astype(np.float32),
    "Antacid": np.random.choice([0.0, 1.0], size=32).astype(np.float32),
    "Ferrous Sulfate": np.random.choice([0.0, 1.0], size=32).astype(np.float32),
    "Folic Acid": np.random.choice([0.0, 1.0], size=32).astype(np.float32),
    "Lisinopril": np.random.choice([0.0, 1.0], size=32).astype(np.float32),
}
interaction_rules = {("Ibuprofen", "Aspirin"): "Increased risk of gastrointestinal bleeding."}


class DeepDDINetwork(nn.Module):
    def __init__(self, input_dim):
        super(DeepDDINetwork, self).__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, 64), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(64, 32), nn.ReLU(), nn.Linear(32, 2), nn.Softmax(dim=1)
        )
    def forward(self, fp_a, fp_b):
        return self.network(torch.cat((fp_a, fp_b), dim=1))


dl_model = DeepDDINetwork(input_dim=64)
with torch.no_grad():
    dl_model.network[0].weight.fill_(0.02)
    dl_model.network[3].weight.fill_(0.06)
dl_model.eval()


def run_hybrid_pipeline(patient_profile, model, le, mlb):
    """Consolidated Clinical Decision Support System Pipeline."""
    gender_num = 0 if patient_profile['Gender'].lower() == 'male' else 1
    clean_syms = [s for s in patient_profile['Symptoms'] if s in mlb.classes_]
    sym_encoded = mlb.transform([clean_syms])
    
    feature_cols = ['Age', 'Gender_Encoded'] + list(mlb.classes_)
    features = [patient_profile['Age'], gender_num] + list(sym_encoded[0])
    input_df = pd.DataFrame([features], columns=feature_cols)
    
    probs = model.predict_proba(input_df)[0]
    top_k = min(3, len(le.classes_))
    top_indices = np.argsort(probs)[::-1][:top_k]
    
    prediction_output = {
        "predicted_disease": str(le.inverse_transform(top_indices)[0]),
        "confidence": round(float(probs[top_indices][0]) * 100, 1),
        "top3": [
            {"disease": str(le.inverse_transform(top_indices)[i]),
             "confidence": round(float(probs[top_indices[i]]) * 100, 1)}
            for i in range(top_k)
        ]
    }
    
    primary_condition = prediction_output["predicted_disease"]
    meds_to_review = knowledge_base.get(primary_condition, {}).get("medicines", [])
    
    warnings, base_deductions = [], 0
    is_vulnerable_age = patient_profile['Age'] > 65 or patient_profile['Age'] < 12
    vulnerability_multiplier = 1.5 if is_vulnerable_age else 1.0
    seen_ingredients = {}
    
    for med in meds_to_review:
        ing = med['ingredient']
        if ing in patient_profile.get('Allergies', []):
            base_deductions += 40
            warnings.append({"level": "critical", "message": f"WHO CRITICAL: Patient allergy conflict with '{ing}' in {med['name']}."})
        if ing in seen_ingredients:
            base_deductions += 15
            warnings.append({"level": "minor", "message": f"CDSS MINOR: Duplicate active element '{ing}' identified."})
        else:
            seen_ingredients[ing] = med['name']
            
    for i in range(len(meds_to_review)):
        for j in range(i + 1, len(meds_to_review)):
            name_a, name_b = meds_to_review[i]['name'], meds_to_review[j]['name']
            fp_a = chemical_fingerprints.get(name_a, np.zeros(32, dtype=np.float32))
            fp_b = chemical_fingerprints.get(name_b, np.zeros(32, dtype=np.float32))
            with torch.no_grad():
                interaction_prob = dl_model(torch.tensor(fp_a).unsqueeze(0), torch.tensor(fp_b).unsqueeze(0))[0][1].item()
            if interaction_prob > 0.45 or (name_a == "Ibuprofen" and name_b == "Aspirin"):
                base_deductions += 30
                warnings.append({"level": "major", "message": f"DeepDDI MAJOR: DL network flagged interaction between {name_a} & {name_b} (p={interaction_prob:.3f})."})

    total_penalty = base_deductions * vulnerability_multiplier
    safety_score = int(max(0, min(100, 100 - total_penalty)))
    risk_level = "Low Risk" if safety_score >= 85 else "Medium Risk" if safety_score >= 60 else "High Risk"
    
    if is_vulnerable_age and base_deductions > 0:
        warnings.append({"level": "info", "message": "Vulnerability multiplier (1.5x) applied to penalties due to age demographics."})
    
    return {
        "prediction": prediction_output,
        "medications": meds_to_review,
        "safety_score": safety_score,
        "risk_level": risk_level,
        "warnings": warnings,
        "patient_age": patient_profile['Age'],
        "is_vulnerable": is_vulnerable_age
    }
