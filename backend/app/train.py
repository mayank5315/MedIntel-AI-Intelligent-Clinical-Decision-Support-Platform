import pandas as pd
import numpy as np
import os
import json
import joblib
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer
from xgboost import XGBClassifier

def train_model():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "data", "minor dataset.csv")
    artifacts_dir = os.path.join(base_dir, "artifacts")
    
    os.makedirs(artifacts_dir, exist_ok=True)
    
    print(f"Reading dataset from {data_path}")
    df = pd.read_csv(data_path)
    
    # Preprocessing
    df['Symptoms_List'] = df['Symptoms'].apply(lambda x: [s.strip() for s in x.split(',')])
    
    mlb = MultiLabelBinarizer()
    symptoms_encoded = mlb.fit_transform(df['Symptoms_List'])
    symptoms_df = pd.DataFrame(symptoms_encoded, columns=mlb.classes_)
    
    df['Gender_Encoded'] = df['Gender'].apply(lambda x: 0 if str(x).lower() == 'male' else 1)
    
    # Extract Age from DateOfBirth
    df['DateOfBirth'] = pd.to_datetime(df['DateOfBirth'], format='%d-%m-%Y', errors='coerce')
    df['Age'] = df['DateOfBirth'].apply(lambda x: (pd.to_datetime('today') - x).days // 365 if pd.notnull(x) else 30)
    
    X = pd.concat([df[['Age', 'Gender_Encoded']], symptoms_df], axis=1)
    
    le = LabelEncoder()
    y = le.fit_transform(df['Disease'])
    
    print("Training model...")
    # Train Model
    model = XGBClassifier(
        max_depth=3,
        learning_rate=0.05,
        n_estimators=200,
        reg_alpha=0.1,
        reg_lambda=1.2,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric='mlogloss',
        random_state=42
    )
    model.fit(X, y)
    
    print("Saving artifacts...")
    # Save artifacts
    joblib.dump(model, os.path.join(artifacts_dir, "xgboost_disease_model.pkl"))
    joblib.dump(le, os.path.join(artifacts_dir, "label_encoder.pkl"))
    joblib.dump(mlb, os.path.join(artifacts_dir, "symptoms_binarizer.pkl"))
    
    # Generate and save Knowledge Base
    kb = {}
    for disease in df['Disease'].unique():
        disease_data = df[df['Disease'] == disease]
        medicines = []
        for med in disease_data['Medicine'].unique():
            if pd.notna(med):
                medicines.append({"name": med, "ingredient": med})
        kb[disease] = {"medicines": medicines}
        
    with open(os.path.join(artifacts_dir, "knowledge_base.json"), "w") as f:
        json.dump(kb, f, indent=4)
        
    print("Training complete. Artifacts saved successfully in:", artifacts_dir)

if __name__ == "__main__":
    train_model()
