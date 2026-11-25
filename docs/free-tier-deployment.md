# Free‑Tier Deployment Guide for BugBunny

## A. Introduction

BugBunny is an autonomous, multi‑agent software‑engineering assistant built with **FastAPI** (backend) and **Next.js 16** (frontend).  The production architecture consists of:

- **Frontend** hosted on **Vercel (Hobby plan – free)**
- **Backend** hosted on **Render (Free Web Service)**
- **PostgreSQL** provided by **Neon (Free tier)**
- **Gemini API** (free‑quota tier) for AI reasoning
- **GitHub** read‑only integration for issue import

Docker is optional – the application can be run locally without containers.

> **Architecture diagram**

```mermaid
flowchart TD
    Browser -->|HTTPS| Vercel["Vercel Frontend (Free)"
        style Vercel fill:#f9f,stroke:#333,stroke-width:2px]
    Vercel -->|API calls| Render["Render FastAPI Backend (Free)"
        style Render fill:#bbf,stroke:#333,stroke-width:2px]
    Render -->|asyncpg| Neon["Neon PostgreSQL (Free)"
        style Neon fill:#bfb,stroke:#333,stroke-width:2px]
    Render -->|GitHub API| GitHub["GitHub (read‑only)"
        style GitHub fill:#ff9,stroke:#333,stroke-width:2px]
    Render -->|Gemini API| Gemini["Gemini 1.5 (Free quota)"
        style Gemini fill:#9ff,stroke:#333,stroke-width:2px]
```

---

## B. Option 1 – Run locally **WITHOUT Docker**

### 1️⃣ Prerequisites
| Tool | Minimum version | Install command |
|------|----------------|-----------------|
| **Git** | 2.30+ | `brew install git` |
| **Node.js** | 20+ (includes npm) | `brew install node@20` |
| **Python** | 3.11+ (3.12 recommended) | `brew install python@3.12` |
| **PostgreSQL** | 14+ (local) | `brew install postgresql` |

### 2️⃣ Clone the repository
```bash
git clone https://github.com/ynsh-ai/BugBunny.git
cd BugBunny
```

### 3️⃣ Backend setup
```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install Python dependencies
pip install -r backend/requirements.txt

# Copy env template and edit values
cp backend/.env.example backend/.env
# Edit backend/.env – see section **F** for variable list
```

#### Database (local PostgreSQL)
```bash
# Start PostgreSQL (brew services) – optional if already running
brew services start postgresql

# Create database and user (matches .env.example)
psql -U $(whoami) -c "CREATE USER bugbunny WITH PASSWORD 'bugbunny_password';"
psql -U $(whoami) -c "CREATE DATABASE bugbunny_db OWNER bugbunny;"
```

#### Run migrations and start the API
```bash
cd backend
alembic upgrade head   # creates tables
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Visit `http://localhost:8000/health` to confirm the backend is alive.

### 4️⃣ Frontend setup
```bash
cd ../frontend
npm install
npm run dev   # runs on http://localhost:3000
```
The dashboard will contact the backend at `http://localhost:8000` (default in `NEXT_PUBLIC_API_URL`).

### 5️⃣ Optional – Switch to **Neon** (hosted PostgreSQL) instead of local DB
1. Sign‑up at https://neon.tech and create a new PostgreSQL project.
2. Copy the generated connection URL (e.g. `postgresql+asyncpg://<user>:<pw>@<host>/bugbunny?sslmode=require`).
3. Replace `DATABASE_URL` in `backend/.env` with that URL.
4. Skip the local `psql` steps; the backend will connect directly to Neon.

---

## C. Option 2 – Use the **deployed** application (no local install)

1. **Frontend** – open the Vercel URL (e.g. `https://bugbunny-ten.vercel.app`).
2. **Backend** – the frontend is pre‑configured to call the Render service (`https://bugbunny-backend.onrender.com`). No extra steps are needed.
3. **Database** – Render service already points to a Neon PostgreSQL instance (configured via Render Secrets).
4. **Authentication / GitHub** – the backend uses a read‑only GitHub token stored as a Render secret; the frontend never sees any secrets.
5. **Verification** – open the site, sign in with GitHub (OAuth flow handled by the backend), import an issue, and run a full investigation. All work happens in the cloud.

> **Note:** If the deployed URLs change, update the `NEXT_PUBLIC_API_URL` environment variable in the Vercel dashboard (Settings → Environment Variables).

---

## D. Option 3 – **Free‑Tier‑Only** end‑to‑end deployment (Zero cost) – Summary

| Component | Service & free tier | How to configure |
|-----------|---------------------|-----------------|
| **Frontend** | Vercel Hobby (free) | Connect the GitHub repo, enable *Automatic Deployments*.
| **Backend** | Render Free Web Service | Add a *Web Service* (Python), set **Build Command** `pip install -r requirements.txt && alembic upgrade head`, **Start Command** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Add required env vars as *Secrets* (see §F).
| **Database** | Neon (Free) | Create a project, copy the URL into Render secret `DATABASE_URL`.
| **Gemini** | Gemini API free quota | Add secret `GEMINI_API_KEY` to Render.
| **GitHub** | Public read‑only access | Add optional `GITHUB_TOKEN` secret to Render (increases rate limit).

All services stay within free allocations; no paid cloud resources are required.

---

## E. Free‑Tier Services Overview

| Service | Free tier limits (as of 2026) | Why it fits BugBunny |
|---------|-----------------------------|----------------------|
| **Vercel Hobby** | Unlimited static sites, 100 GB bandwidth/month, 12 serverless functions | Hosts the Next.js UI; low traffic portfolio site stays well below limits.
| **Render Free** | 750 hrs/month (≈1 instance), 512 MB RAM, 1 GB outbound bandwidth, PostgreSQL (Neon) free tier integration | Sufficient for demo traffic and API calls.
| **Neon Free** | 20 GB storage, 1 M rows, 5 GB data transfer/month | Stores issue, workspace, and telemetry tables.
| **Gemini API Free** | ~15 requests/minute (RPM) | Adequate for lightweight demo usage; falls back to *demo mode* when quota exhausted.
| **GitHub public API** | 60 req/h (unauthenticated) – 5 000 req/h with token | Only read‑only operations needed for issue import.

---

## F. Required Environment Variables (template)

```
# .env (root) – used for Docker compose (optional)
ENVIRONMENT=development
LOG_LEVEL=info
POSTGRES_USER=bugbunny
POSTGRES_PASSWORD=bugbunny_password
POSTGRES_DB=bugbunny_db
POSTGRES_PORT=5432
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
PORT=3000                     # Next.js dev server
NEXT_PUBLIC_API_URL=http://localhost:8000   # For local dev only
AGENT_MODE=demo               # or "live"
AGENT_PROVIDER=gemini
GEMINI_API_KEY=                # Set in Render/Vercel secret if live mode
GEMINI_MODEL=gemini-1.5-pro
GITHUB_TOKEN=                 # Optional, set as Render secret

# Backend‑specific (backend/.env)
DATABASE_URL=postgresql+asyncpg://bugbunny:bugbunny_password@localhost:5432/bugbunny_db
SYNC_DATABASE_URL=postgresql://bugbunny:bugbunny_password@localhost:5432/bugbunny_db
```

*When deploying to Render, add those variables as **Secrets** (Settings → Environment → Secrets). Vercel only needs `NEXT_PUBLIC_API_URL` and optionally `GEMINI_API_KEY` if you want the frontend to hit a live Gemini endpoint directly (currently backend‑only).

---

## G. Deployment Steps (Free‑Tier Only)

1. **Fork the repository** on GitHub (makes it your own copy).
2. **Connect Vercel**
   - In the Vercel dashboard click **New Project → Import Git Repository**.
   - Choose your fork, keep the default *Next.js* framework.
   - Add an environment variable `NEXT_PUBLIC_API_URL` pointing to the Render backend URL (e.g. `https://bugbunny-backend.onrender.com`).
   - Deploy – Vercel will run `npm install` and `npm run build` automatically.
3. **Create a Neon PostgreSQL instance**
   - Copy the connection string (includes `postgresql+asyncpg://`).
4. **Create a Render Web Service**
   - Language: *Python 3.12*.
   - Build Command: `pip install -r requirements.txt && alembic upgrade head`.
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
   - Add Secrets: `DATABASE_URL`, `GEMINI_API_KEY` (if live), `GITHUB_TOKEN` (optional), `AGENT_MODE=live` (or `demo`).
   - Deploy – Render will pull the code, install deps, run migrations, then start the API.
5. **Verify**
   - Health check: `https://<render‑service>.onrender.com/health` should return `{"status":"ok"}`.
   - Open the Vercel URL; the UI should load and communicate with the backend.
6. **Optional – Switch to Neon for local dev**
   - Set `DATABASE_URL` in `backend/.env` to the Neon URL.
   - Run the backend locally as described in **Option 1**.

---

## H. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Backend returns **CORS** errors | `CORS_ORIGINS` does not include Vercel domain | Add `https://<your‑vercel‑site>.vercel.app` to `CORS_ORIGINS` secret on Render.
| `alembic upgrade head` fails | DB URL typo or missing `asyncpg` driver | Ensure `DATABASE_URL` uses `postgresql+asyncpg://` and run `pip install asyncpg`.
| Gemini calls error **401** | Missing/invalid `GEMINI_API_KEY` | Add the correct key to Render Secrets; restart the service.
| Vercel build fails (`npm run build` error) | Missing env var `NEXT_PUBLIC_API_URL` at build time | Define it under *Environment Variables* in Vercel (Project Settings → Environment Variables).
| Application cannot connect to PostgreSQL on Render | Neon URL requires `sslmode=require` flag | Append `?sslmode=require` to the end of the connection string.

---

## I. Security Considerations (Free‑Tier Only)

- **All secrets** (`GEMINI_API_KEY`, `GITHUB_TOKEN`, DB credentials) are stored as **Render/Vercel Secrets** – never committed to the repo.
- **Backend‑only AI calls** – the frontend never sees the Gemini key.
- **Read‑only GitHub integration** – the token is used solely for GET endpoints; no write permissions are granted.
- **CORS** is locked down to the exact Vercel domain(s).
- **Database** is isolated per Render service; Neon free tier does not expose public ports.

---

## J. Limitations of the Free‑Tier Setup

- **Gemini free quota** limits concurrent users; heavy usage will trigger graceful fallback to *demo mode* (offline heuristics).
- **Neon free tier** caps storage and bandwidth – suitable for a demo dataset (< 100 k rows).
- **Render free tier** provides a single instance; background workers (e.g., async task queues) are not available – all processing runs synchronously in the request cycle.
- **Vercel serverless functions** have a 10 s timeout – long‑running agent runs should stay under this limit or be delegated to the backend.

---

## K. Quick Reference Cheat‑Sheet

```text
# Local development (no Docker)
git clone … && cd BugBunny
cp backend/.env.example backend/.env
# edit .env -> set DATABASE_URL (local or Neon)
# start DB (brew services start postgresql)
cd backend && alembic upgrade head && uvicorn app.main:app --reload
cd ../frontend && npm install && npm run dev

# Deploy (free‑tier)
# 1. Fork → Vercel import (adds NEXT_PUBLIC_API_URL)
# 2. Neon → copy URL → Render secret DATABASE_URL
# 3. Render → set GEMINI_API_KEY, AGENT_MODE=live
# 4. Deploy → verify https://<vercel>.vercel.app
```

---

*This guide is intentionally beginner‑friendly and contains only commands and values verified against the current codebase.*
