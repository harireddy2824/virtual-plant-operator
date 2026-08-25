# Enterprise Virtual Plant Operator — AI SaaS Platform

An enterprise-grade, AI-powered industrial monitoring and digital twin platform that simulates process plant telemetry, detects sensor anomalies using machine learning, executes automated safety rules, provides explainable AI (XAI) diagnostics, and orchestrates predictive maintenance.

---

## 🚀 Enterprise Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend UI** | React 19 · TypeScript 5.7 · Vite 6 | Modern SPA with component architecture & strict typing |
| **Data Visualizations** | Chart.js 4.x · SVG Sparklines · Canvas | Real-time trend curves, sparklines, and animated gauges |
| **Backend Framework** | Python 3.11 · Flask 3.x WSGI · Gunicorn | Production WSGI backend service (`backend/app.py`) |
| **Machine Learning** | PyTorch Autoencoder · Scikit-learn | Multi-variate anomaly detection with rule overrides |
| **AI Copilot** | Grok API (xAI Cloud) | Natural language incident analysis & XAI feature attribution |
| **Database Layer** | MongoDB Atlas · PyMongo 4.7+ | `$jsonSchema` validators, compound TTL indexes, `$facet` pipelines |
| **Deployment** | Railway Monorepo / Gunicorn / Vite | Independent cloud service deployment for backend & frontend |

---

## 📁 Monorepo Directory Structure

```text
virtual-plant-operator/
├── backend/
│   ├── app.py                   # Flask entry point & Gunicorn launcher (app:app)
│   ├── config.py                # Environment Settings manager
│   ├── requirements.txt         # Backend Python dependencies (including Gunicorn)
│   ├── test_pipeline.py         # Backend smoke test suite
│   ├── ai_recommendation/       # Grok API diagnostic engine
│   ├── anomaly_detection/       # PyTorch Autoencoder anomaly detector
│   ├── database/                # MongoDB client & collection validators
│   ├── decision_engine/         # ISA-18.2 safety rule engine
│   ├── middleware/              # Error handling & CORS middleware
│   ├── models/                  # PyTorch .pth & Scikit-learn .pkl model binaries
│   ├── reports/                 # Report generator & PDF builder
│   ├── routes/                  # Flask Blueprint REST API (/api/*)
│   ├── security/                # JWT auth & security helpers
│   ├── services/                # Plant monitoring facade & sub-services
│   ├── simulation/              # SimPy process plant drift simulator
│   └── utils/                   # Health score calculation utilities
├── frontend/
│   ├── src/                     # React 19 + TypeScript source code
│   ├── css/                     # Enterprise SaaS Light Theme stylesheet
│   ├── js/                      # ES module API client & config
│   ├── public/                  # Static assets
│   ├── package.json             # Frontend package configuration
│   └── vite.config.ts           # Vite build configuration
├── .env.example                 # Environment configuration template
├── .gitignore                   # Exclusions for Python, Node, Vite & secrets
├── README.md                    # System documentation & deployment guide
└── ARCHITECTURE.md              # Architectural blueprint
```

---

## ⚡ Local Development Setup

### 1. Backend Service (Flask)

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run backend production-style server
gunicorn app:app --bind 0.0.0.0:5000
```

Alternatively, run Python directly:
```bash
python app.py
```

### 2. Frontend Application (React + Vite)

In a separate terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:3000` or `http://localhost:3001` in your browser.

---

## ☁️ Production Deployment (Railway)

This repository is structured as a production monorepo optimized for **Railway**:

### Service 1: Flask Backend Service
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
- **Environment Variables**:
  - `PORT`: `${PORT}`
  - `FLASK_ENV`: `production`
  - `MONGO_URI`: `mongodb+srv://...` (your MongoDB Atlas connection URI)
  - `XAI_API_KEY`: `your_grok_api_key`
  - `XAI_MODEL`: `grok-2-latest`
  - `CORS_ORIGIN`: `https://your-frontend.up.railway.app`

### Service 2: React Frontend Application
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: `https://your-backend.up.railway.app`

---

## 🧪 Testing Backend Pipeline

To run the backend smoke test suite:

```bash
cd backend
python test_pipeline.py
```
