# Enterprise Production Deployment Guide — Virtual Plant Operator

This guide covers production deployment options, containerization, health probes, CI/CD pipelines, and database backup procedures.

---

## 🐳 1. Docker & Docker Compose Production Deployment

The recommended production deployment utilizes Docker Compose orchestrating 3 isolated services:
1. `app`: Multi-stage Python 3.11 WSGI backend executing via Gunicorn with Node.js compiled frontend assets.
2. `mongodb`: Persistent MongoDB database server.
3. `nginx`: High-performance reverse proxy and static asset server with Gzip compression and rate limiting.

### Launch Production Stack

```bash
# Build and start containers in detached mode
docker-compose up -d --build

# Inspect container status and health probes
docker-compose ps
```

Access the platform at `http://localhost`.

---

## 🩺 2. Health Probes & Monitoring

The API exposes standard Kubernetes / APM monitoring probes under `/health`:

- **Liveness Probe**: `GET /health/live` (Returns `200 OK` if process is responsive).
- **Readiness Probe**: `GET /health/ready` (Verifies MongoDB connection and service initialization).
- **Metrics Probe**: `GET /health/metrics` (Reports memory RSS, CPU percentage, uptime, tick count, and database connection mode).

---

## 🔄 3. CI/CD Pipeline Integration

A GitHub Actions workflow is pre-configured in `.github/workflows/ci-cd.yml`:
1. Executes backend test suite (`python test_pipeline.py`).
2. Builds TypeScript & Vite production bundles (`npm run build`).
3. Verifies multi-stage Docker build steps.

---

## 💾 4. Database Snapshot & Backup Strategy

Automated MongoDB backups are managed by `scripts/backup_db.py`:

```bash
# Run database backup snapshot
python scripts/backup_db.py
```

- Exports JSON backups to `./backups/` directory.
- Automatically purges backups older than 7 days.

---

## 🔒 5. Environment Variables Configuration

| Variable | Description | Default |
|---|---|---|
| `FLASK_ENV` | Application environment (`production` / `development`) | `production` |
| `PORT` | Backend server port | `5000` |
| `MONGO_URI` | MongoDB connection URI | `mongodb://localhost:27017/` |
| `MONGO_DB` | MongoDB database name | `virtual_plant_db` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `vpo-super-secret-key...` |
| `XAI_API_KEY` | Grok API key (server-side) | `your_grok_api_key` |
| `XAI_MODEL` | Grok model name | `grok-2-latest` |
