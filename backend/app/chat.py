"""
Ollama-powered Clinical Chatbot for MedIntel AI.
Uses the diagnosis context to answer patient questions with structured, 
easy-to-understand clinical responses.
"""
import httpx
import json
import re
import logging

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3.2:latest"


def _build_system_prompt(diagnosis_context: dict) -> str:
    """Build a structured system prompt from the diagnosis results."""
    pred = diagnosis_context.get("prediction", {})
    meds = diagnosis_context.get("medications", [])
    warnings = diagnosis_context.get("warnings", [])
    safety = diagnosis_context.get("safety_score", "N/A")
    risk = diagnosis_context.get("risk_level", "N/A")
    patient_age = diagnosis_context.get("patient_age", "N/A")
    is_vulnerable = diagnosis_context.get("is_vulnerable", False)
    explanation = diagnosis_context.get("explanation", "")

    med_lines = "\n".join(
        [f"  - {m.get('name', 'Unknown')} (Active: {m.get('ingredient', 'Unknown')})" for m in meds]
    ) if meds else "  No medications recommended."

    warning_lines = "\n".join(
        [f"  - [{w.get('level', 'info').upper()}] {w.get('message', '')}" for w in warnings]
    ) if warnings else "  No alerts."

    top3_lines = "\n".join(
        [f"  {i+1}. {d.get('disease', '?')} — {d.get('confidence', 0)}% confidence"
         for i, d in enumerate(pred.get("top3", []))]
    )

    return f"""You are MedIntel AI Clinical Assistant — an expert medical AI advisor embedded in a Clinical Decision Support System (CDSS). You MUST follow these rules strictly:

## YOUR ROLE
- You provide clear, structured, patient-friendly medical explanations based ONLY on the diagnosis data below.
- You are NOT a replacement for a doctor. Always remind the user to consult a healthcare professional.
- Answer questions about the diagnosis, medications, safety score, warnings, and risk level.
- If the user asks about something outside the diagnosis context, politely redirect them.

## CURRENT DIAGNOSIS CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Patient Profile:**
  - Age: {patient_age} years
  - Vulnerable demographic: {"Yes (age <12 or >65)" if is_vulnerable else "No"}

**Primary Diagnosis:** {pred.get('predicted_disease', 'Unknown')}
**Confidence:** {pred.get('confidence', 0)}%

**Differential Diagnoses (Top 3):**
{top3_lines}

**Recommended Medications:**
{med_lines}

**Safety Score:** {safety}/100
**Risk Level:** {risk}

**Clinical Alerts:**
{warning_lines}

**Clinical Reasoning:**
{explanation}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## RESPONSE FORMAT RULES
1. Always respond in clear, structured format with headers and bullet points.
2. Use simple language a patient can understand — avoid excessive medical jargon.
3. When explaining medications, mention what they do and any relevant warnings.
4. When discussing risk, explain what the safety score means practically.
5. Keep responses concise but thorough — max 200 words per response.
6. Always end with a brief disclaimer about consulting a doctor.
7. Do NOT invent or hallucinate information not present in the context above.
8. Use /no_think to keep your response clean and direct."""


async def chat_with_ollama(
    user_message: str,
    diagnosis_context: dict,
    chat_history: list[dict] = None
) -> str:
    """
    Send a message to Ollama with the diagnosis context and return a structured response.
    
    Args:
        user_message: The user's question
        diagnosis_context: Full diagnosis result from the pipeline
        chat_history: Previous messages in the conversation
    
    Returns:
        The model's response text
    """
    system_prompt = _build_system_prompt(diagnosis_context)

    messages = [{"role": "system", "content": system_prompt}]

    # Add chat history (limit to last 6 exchanges to keep context manageable)
    if chat_history:
        for msg in chat_history[-12:]:
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })

    # For qwen3 reasoning models, prepend /no_think to suppress thinking blocks
    # For standard models like llama3.2, just send the message directly
    messages.append({"role": "user", "content": user_message})

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=10.0)) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.4,
                        "top_p": 0.9,
                        "num_predict": 500,
                    }
                }
            )
            if response.status_code != 200:
                error_text = response.text[:300]
                logger.error(f"Ollama returned {response.status_code}: {error_text}")
                return f"The AI model returned an error (HTTP {response.status_code}). Please try again."
            
            data = response.json()
            
            raw_content = data.get("message", {}).get("content", "")
            
            # If content is empty but thinking exists (reasoning models), use thinking
            if not raw_content and data.get("message", {}).get("thinking"):
                raw_content = data["message"]["thinking"]
            
            if not raw_content:
                return "I wasn't able to generate a response. Please try rephrasing your question."
            
            # Strip <think>...</think> blocks from reasoning models (fallback)
            cleaned = re.sub(r'<think>.*?</think>', '', raw_content, flags=re.DOTALL).strip()
            
            return cleaned if cleaned else raw_content

    except httpx.ConnectError:
        logger.error("Could not connect to Ollama. Is it running on localhost:11434?")
        return "**Connection Error**: Could not reach the Ollama service. Please ensure Ollama is running and try again."
    except httpx.TimeoutException:
        logger.error("Ollama request timed out.")
        return "**Timeout**: The AI model took too long to respond. Please try a shorter question."
    except Exception as e:
        logger.error(f"Ollama chat error: {e}")
        return f"**Error**: An unexpected error occurred: {str(e)}"

async def check_ollama_status() -> dict:
    """Check if Ollama is running and the model is available."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            response.raise_for_status()
            models = [m["name"] for m in response.json().get("models", [])]
            has_model = any(OLLAMA_MODEL in m for m in models)
            return {
                "online": True,
                "model": OLLAMA_MODEL,
                "model_available": has_model,
                "available_models": models
            }
    except Exception:
        return {
            "online": False,
            "model": OLLAMA_MODEL,
            "model_available": False,
            "available_models": []
        }
