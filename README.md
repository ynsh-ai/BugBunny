# BugBunny

<div align="center">
  <img src="frontend/public/bugbunny-logo.png" width="130" alt="BugBunny Logo" />
  <h3>Autonomous Multi-Agent Software Engineering Assistant</h3>
  <p><em>From GitHub issue to implementation-ready change.</em></p>

  <p>
    <a href="https://bugbunny-backend.onrender.com/health"><img src="https://img.shields.io/badge/Backend-Render%20(Healthy)-success?style=flat-square&logo=render" alt="Backend Status" /></a>
    <a href="https://bugbunny-backend.onrender.com/docs"><img src="https://img.shields.io/badge/OpenAPI-Swagger%20Docs-blue?style=flat-square&logo=fastapi" alt="API Docs" /></a>
    <a href="https://neon.tech"><img src="https://img.shields.io/badge/Database-Neon%20Postgres%2018-00E599?style=flat-square&logo=postgresql" alt="Database" /></a>
    <a href="https://vercel.com"><img src="https://img.shields.io/badge/Frontend-Vercel%20Next.js%2016-black?style=flat-square&logo=vercel" alt="Frontend Vercel" /></a>
  </p>
</div>

---

## 🌐 Live Cloud Deployments

| Component | Cloud Provider | Deployed Live URL | Status |
| :--- | :--- | :--- | :--- |
| **Backend API Gateway** | **Render** | [https://bugbunny-backend.onrender.com](https://bugbunny-backend.onrender.com) | 🟢 **Healthy** |
| **API Health Check** | **Render** | [https://bugbunny-backend.onrender.com/health](https://bugbunny-backend.onrender.com/health) | 🟢 **HTTP 200** |
| **Swagger OpenAPI Docs** | **Render** | [https://bugbunny-backend.onrender.com/docs](https://bugbunny-backend.onrender.com/docs) | 🟢 **Interactive** |
| **Issues API Endpoint** | **Render** | [https://bugbunny-backend.onrender.com/api/issues](https://bugbunny-backend.onrender.com/api/issues) | 🟢 **JSON Payload** |
| **Database Tier** | **Neon.tech** | Serverless PostgreSQL 18 Pooler (Ohio) | 🟢 **Seeded & Active** |
| **Frontend Web App** | **Vercel** | [https://frontend-patchpilot-ai.vercel.app](https://frontend-patchpilot-ai.vercel.app) *(or your Vercel URL)* | 🟢 **Live** |

---

BugBunny is an autonomous, web-based multi-agent software engineering assistant. A developer selects a GitHub issue, and BugBunny coordinates specialized agents to analyze requirements, investigate the codebase, propose an implementation plan, run tests, review the change, and generate documentation.

Orchestrated using the **OpenAI Agents SDK** and powered by **Gemini** for multi-file codebase reasoning.

---

## 🌟 Architecture Overview

```mermaid
flowchart LR
    Issue([GitHub Issue]) --> Analyst[1. Requirements Analyst]
    Analyst --> Investigator[2. Codebase Investigator]
    Investigator --> Planner[3. Solution Planner]
    Planner --> Engineer[4. Patch Engineer]
    Engineer --> Tester[5. Test Runner]
    Tester -->|Tests Pass| Reviewer[6. Reviewer & Docs]
    Tester -->|Tests Fail| Engineer
    Reviewer --> PR([Verified Pull Request])
```

1. **Requirements Analyst**: Extracts reproduction steps and explicit acceptance criteria from issue descriptions.
2. **Codebase Investigator**: Traverses AST symbols, call hierarchies, and test suites to locate relevant files.
3. **Solution Planner**: Formulates a deterministic, safe, step-by-step implementation plan.
4. **Patch Engineer**: Generates minimal, idiomatic unified diffs matching repository conventions.
5. **Test Runner**: Runs unit and regression test suites in an isolated sandbox to detect regressions.
6. **Code Reviewer & Documenter**: Validates security, writes release notes, and drafts the pull request.

---

## 📁 Monorepo Structure

```text
bugbunny/
├── frontend/               # Next.js 16 App Router, TypeScript, Tailwind CSS, Standalone Docker
├── backend/                # Python 3.12 FastAPI application & agent orchestration
│   ├── alembic/            # Database migration configuration
│   ├── app/                # Application core, models, schemas, routes, agents, services
│   └── tests/              # Pytest async test suite
├── infra/                  # Standalone PostgreSQL 16 Docker Compose setup
├── docs/                   # Architecture, development, and deployment documentation
│   ├── architecture.md     # In-depth architectural specification & agent designs
│   ├── development.md      # Local development and testing guide
│   └── deployment.md       # Multi-service production deployment guide
├── docker-compose.yml      # Full-stack Compose file (Frontend + Backend + PostgreSQL)
├── .env.example            # Monorepo environment variable template (no real secrets)
├── .gitignore              # Multi-stack gitignore rules
└── README.md               # Project documentation
```

---

## 🚀 Cloud Deployment (Zero Local Docker Required)

Deploy BugBunny completely free across three best-in-class cloud providers:

| Layer | Service | Provider | Guide |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 16 App Router | [Vercel](https://vercel.com) | [Step-by-step Guide](docs/cloud-deployment-guide.md#phase-3-frontend-setup-on-vercel-free-tier) |
| **Backend** | FastAPI (Python 3.12) | [Render](https://render.com) | [Step-by-step Guide](docs/cloud-deployment-guide.md#phase-2-backend-setup-on-render-free-tier) |
| **Database** | PostgreSQL 16 (Serverless) | [Neon.tech](https://neon.tech) | [Step-by-step Guide](docs/cloud-deployment-guide.md#phase-1-database-setup-on-neon-free-tier) |

👉 **[Read the Full Cloud Deployment Walkthrough (docs/cloud-deployment-guide.md)](docs/cloud-deployment-guide.md)** for copy-paste instructions.

---

## 🐳 Alternative: Local / Containerized Deployment (Docker Compose)

If you prefer running all 3 services locally in Docker containers:

```bash
# 1. Setup environment
cp .env.example .env

# 2. Build and run all services
docker compose up -d --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **FastAPI OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 💻 Local Development Workflow

If you prefer running services independently on your local machine:

### 1. Database (PostgreSQL)
```bash
docker compose -f infra/docker-compose.yml up -d
```

### 2. Backend (FastAPI)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the BugBunny dashboard.

---

## 🧪 Verification & Test Suite

Run automated checks across both stacks:

```bash
# 1. Backend async tests (11 passing)
./backend/.venv/bin/pytest backend/tests -v

# 2. Backend Ruff linter
./backend/.venv/bin/ruff check backend

# 3. Frontend ESLint
cd frontend && npm run lint

# 4. Frontend Next.js standalone build
cd frontend && npm run build

# 5. Full-stack Docker Compose specification validation
docker compose config
```

---

## 🛠️ Technology Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript | Real-time agent visualizer & developer review UI |
| **Styling** | Tailwind CSS v4, Lucide React | Modern dark-mode aesthetic with custom BugBunny cyber-motif |
| **Backend** | FastAPI, Uvicorn, Pydantic v2 | High-performance asynchronous API gateway |
| **Orchestrator** | OpenAI Agents SDK *(Ready)* | Multi-agent coordination and handoff control |
| **Model Provider** | Google Gemini *(Ready)* | Deep context reasoning and codebase analysis |
| **Persistence** | PostgreSQL 16 Alpine, SQLAlchemy 2.0 | Entity, trace, and patch persistence |
| **Migrations** | Alembic | Version-controlled schema migrations |
| **Containerization**| Docker & Docker Compose | Multi-stage production images with non-root security |

---

## 📖 Further Reading

- [Deployment Guide](docs/deployment.md) — Detailed instructions for deploying Frontend, Backend, and Database
- [Architecture Specification](docs/architecture.md) — Detailed agent pipelines and domain models
- [Local Development Guide](docs/development.md) — Step-by-step developer setup and database migrations

---

## 📄 License

MIT
