# 🧠 MedIntel AI — Hybrid ML+DL Clinical Decision Support System

A production-grade Clinical Decision Support System (CDSS) combining **XGBoost** disease prediction, **PyTorch DeepDDI** drug-drug interaction analysis, and a **Nordic Biotech Telemetry** UI.

![Architecture](https://img.shields.io/badge/Architecture-FastAPI%20%2B%20React-blue)
![ML](https://img.shields.io/badge/ML-XGBoost-green)
![DL](https://img.shields.io/badge/DL-PyTorch%20DeepDDI-red)
![UI](https://img.shields.io/badge/UI-Nordic%20Biotech%20Telemetry-sage)

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React + Vite + Tailwind CSS)             │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │  Patient Intake  │  │  Telemetry Grid          │  │
│  │  Form (40%)      │  │  - DiagnosisCard         │  │
│  │  - Demographics  │  │  - SafetyGauge (SVG)     │  │
│  │  - Symptoms      │  │  - MedicationPanel       │  │
│  │  - Allergies     │  │  - WarningsPanel         │  │
│  └────────┬─────────┘  │  - ExplainerPanel        │  │
│           │            └────────────▲─────────────┘  │
└───────────┼─────────────────────────┼────────────────┘
            │ POST /api/diagnose      │ JSON Response
┌───────────▼─────────────────────────┼────────────────┐
│  Backend (FastAPI + Uvicorn)                         │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Phase 1: XGBoost Disease Prediction (ML)       │ │
│  │  Phase 2: Knowledge Base Medication Retrieval   │ │
│  │  Phase 3: WHO Allergy Conflict Detection        │ │
│  │  Phase 4: DeepDDI Neural Network Interaction    │ │
│  │  Phase 5: Agentic RAG Clinical Explainer        │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### 1. Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Train the XGBoost model (generates artifacts/)
python -m app.train

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start the Vite dev server
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 🎨 Design System: Nordic Biotech Telemetry

| Token | Value | Usage |
|-------|-------|-------|
| `charcoal` | `#14191D` | App background |
| `module` | `#1C2329` | Cards / Modules |
| `moduleBorder` | `#2A343D` | Borders |
| `sage` | `#8DBA99` | Primary accent |
| `sand` | `#D9C5B2` | Secondary accent |
| `danger` | `#EF4444` | Critical alerts |
| `amber` | `#F59E0B` | Warning alerts |
| `emerald` | `#10B981` | Success / Low risk |

---

## 🧪 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/symptoms` | List available symptoms |
| `POST` | `/api/diagnose` | Run hybrid CDSS pipeline |

### Sample Request
```json
POST /api/diagnose
{
  "age": 74,
  "gender": "Male",
  "symptoms": ["Fever", "Cough"],
  "allergies": ["Ibuprofen"]
}
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 3, Framer Motion, Lucide React |
| Backend | FastAPI, Uvicorn, Pydantic v2 |
| ML Engine | XGBoost (Regularized), Scikit-Learn |
| DL Engine | PyTorch (DeepDDI Network) |
| Data | Pandas, NumPy, Joblib |

---

## 📁 Project Structure

```
medintel-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app with lifespan
│   │   ├── engine.py         # Hybrid ML+DL pipeline
│   │   ├── schemas.py        # Pydantic models
│   │   ├── explainer.py      # Clinical reasoning generator
│   │   └── train.py          # XGBoost training script
│   ├── data/
│   │   └── minor dataset.csv # Training dataset
│   ├── artifacts/            # Generated model files
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── api/client.js
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── PatientForm.jsx
│   │       ├── TelemetryGrid.jsx
│   │       ├── DiagnosisCard.jsx
│   │       ├── SafetyGauge.jsx
│   │       ├── MedicationPanel.jsx
│   │       ├── WarningsPanel.jsx
│   │       └── ExplainerPanel.jsx
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```
