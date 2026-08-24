# Enterprise Architecture — Virtual Plant Operator AI SaaS

## 🏛️ System Architecture Overview

```mermaid
flowchart TD
  subgraph Client["Presentation Layer (frontend/)"]
    UI["Vite Code-Split React 19 SPA"]
    SPARK["SVG Sparkline Components"]
    CHART["Chart.js Telemetry Trends"]
    CSS["SaaS Light Theme System"]
  end

  subgraph Cloud["Railway Monorepo Cloud Hosting"]
    direction TB
    FE_SRV["Frontend Static/Vite Service\n(frontend/dist)"]
    BE_SRV["Python Backend Service\nGunicorn WSGI (backend/app.py)"]
  end

  subgraph BackendServices["Backend Services (backend/)"]
    ROUTE["REST API Blueprints (/api/*)"]
    SIM["SimPy Discrete-Event Simulator"]
    DETECTOR["PyTorch Autoencoder & Scikit-learn"]
    RULES["ISA-18.2 Decision Rule Engine"]
    OLLAMA["Ollama Llama-3.2 Diagnostic AI"]
    PDF["ReportLab PDF Generator"]
  end

  subgraph Storage["Persistence & Caching"]
    MDB["MongoDB Atlas\n$jsonSchema Validators & Indexes"]
    MEM["Thread-Safe In-Memory Fallback"]
  end

  Client <--> FE_SRV
  Client <--> BE_SRV
  BE_SRV --> ROUTE
  ROUTE --> BackendServices
  BackendServices <--> Storage
```

---

## ⚡ Architectural Highlights

1. **Monorepo Service Separation**: Decoupled Python Flask WSGI backend (`backend/`) and React 19 SPA (`frontend/`) optimized for independent Railway cloud deployment.
2. **Gunicorn Production Server**: Standalone Gunicorn WSGI application server (`gunicorn app:app --bind 0.0.0.0:$PORT`) running inside `backend/`.
3. **Enterprise Security & CORS**: Dynamic CORS origin evaluation supporting both local Vite development and production Railway frontend URLs.
4. **Machine Learning Anomaly Detection**: PyTorch Autoencoder and Scikit-learn model evaluation with automatic fallback rule overrides.
5. **Explainable AI (XAI)**: Ollama Llama-3.2 local model diagnostic engine with configurable `OLLAMA_BASE_URL` environment variables.
