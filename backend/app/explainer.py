def generate_clinical_explanation(pipeline_result: dict, patient_profile: dict) -> str:
    pred = pipeline_result.get("prediction", {})
    disease = pred.get("predicted_disease", "Unknown")
    conf = pred.get("confidence", 0.0)
    top3 = pred.get("top3", [])
    
    meds = pipeline_result.get("medications", [])
    warnings = pipeline_result.get("warnings", [])
    is_vulnerable = pipeline_result.get("is_vulnerable", False)
    
    explanation = f"### Clinical Reasoning Narrative\n\n"
    explanation += f"**Differential Diagnosis Rationale:**\n"
    explanation += f"Based on the patient's presented symptoms ({', '.join(patient_profile.get('Symptoms', []))}) and demographic profile (Age: {patient_profile.get('Age')}, Gender: {patient_profile.get('Gender')}), the model predicts **{disease}** with a confidence of {conf}%. "
    
    if len(top3) > 1:
        explanation += f"Other potential diagnoses considered include " + ", ".join([f"{t['disease']} ({t['confidence']}%)" for t in top3[1:]]) + ".\n\n"
    else:
        explanation += "\n\n"
        
    explanation += f"**Medication Safety Analysis:**\n"
    if meds:
        med_names = [m['name'] for m in meds]
        explanation += f"The standard treatment protocol for {disease} includes: {', '.join(med_names)}. "
    else:
        explanation += f"No specific medications are recommended in the knowledge base for {disease}. "
        
    if warnings:
        explanation += "\n\nDuring the drug-drug interaction (DDI) and allergy safety checks, the following concerns were identified:\n"
        for w in warnings:
            explanation += f"- **{w['level'].upper()}**: {w['message']}\n"
    else:
        explanation += "No critical drug-drug interactions or allergy conflicts were detected.\n"
        
    explanation += "\n**Risk Factor Assessment:**\n"
    if is_vulnerable:
        explanation += "The patient falls within a vulnerable age demographic (either <12 or >65 years old). A conservative approach to medication dosing is recommended. "
    else:
        explanation += "The patient's age does not automatically place them in a high-risk demographic category for medication dosing. "
        
    if patient_profile.get("Allergies"):
        explanation += f"Patient's known allergies ({', '.join(patient_profile['Allergies'])}) have been cross-referenced with the proposed treatment plan."
    else:
        explanation += "No known allergies were reported."
        
    return explanation
