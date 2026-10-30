# BugBunny — Local Development Guide

This guide details how to set up, run, and test BugBunny services locally on your machine. Both the Next.js frontend and FastAPI backend are architected to be completely independently runnable or orchestrated together with PostgreSQL via Docker Compose.

---

## 1. Prerequisites

Ensure your development machine has the following tools installed:
- **Node.js**: v20.0.0 or later (v20+ LTS recommended)
- **Python**: 3.11 or later (Python 3.12+ recommended)
- **Docker & Docker Compose**: v2.20+ (for local PostgreSQL containerization)
- **Git**: 2.30+

---

## 2. Environment Configuration

Copy the root `.env.example` file to create your local `.env`:

```bash
cp .env.example .env
```

Review the values in `.env`. By default, development settings connect to the Docker Compose PostgreSQL instance at `localhost:5432`:

```ini
ENVIRONMENT=development
LOG_LEVEL=info

POSTGRES_USER=bugbunny
POSTGRES_PASSWORD=bugbunny_password
POSTGRES_DB=bugbunny_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
DATABASE_URL=postgresql+asyncpg://bugbunny:bugbunny_password@localhost:5432/bugbunny_db
SYNC_DATABASE_URL=postgresql://bugbunny:bugbunny_password@localhost:5432/bugbunny_db

BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Agent Orchestration Settings
AGENT_MODE=demo
AGENT_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash

PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> [!NOTE]
> Never commit real API keys or credentials to version control. The `.env` file is excluded in `.gitignore`. The `GEMINI_API_KEY` is strictly backend-only and never exposed to the frontend.

---

## 3. Database Setup (PostgreSQL)

You can run PostgreSQL locally using Docker Compose from the project root:

```bash
# Start PostgreSQL 16 container in the background
docker compose up -d postgres

# Verify container health and logs
docker compose ps postgres
docker compose logs -f postgres
```

To stop the database:
```bash
docker compose down
```

---

## 4. Backend Setup (FastAPI & SQLAlchemy 2)

The backend application lives in `backend/` and uses standard Python virtual environment tooling.

### 4.1 Setup Virtual Environment & Install Dependencies
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4.2 Database Migrations & Clean Startup
When the backend starts up, it automatically creates any missing database tables. Unlike legacy setups, **it does not populate synthetic demo data automatically**, ensuring you start from a clean, empty workspace.

To apply versioned Alembic migrations directly:
```bash
# Apply migrations to the database
alembic upgrade head

# Rollback one migration revision
alembic downgrade -1
```

### 4.3 Starting with an Empty Database & Importing Real Data

BugBunny enforces a real-data-only policy:
- **Clean Empty Workspace**: New databases start with 0 repositories and 0 issues. The UI displays an intentional onboarding empty state.
- **Importing Real Data**:
  - In the web app: Click **Import GitHub Issue** or **Import Repository** from the Workspace, Issues page, or navigation.
  - Via API:
    - `POST /api/v1/github/import-issue` with `{"url": "https://github.com/owner/repo/issues/123"}`
    - `POST /api/v1/github/import-repository` with `{"url": "https://github.com/owner/repo"}`
- **Resetting to an Empty State**:
  - In the web app: Navigate to **Settings** (`/settings`) and click **Reset Database to Empty State**.
  - Via API: Execute `POST /api/v1/dev/reset`. All tracked issues, repositories, investigations, artifacts, and decisions are safely wiped.
- **Optional Development Seeding (Automated Tests Only)**:
  - If you need to populate sample records for manual testing: `POST /api/v1/dev/seed`. (This endpoint is strictly opt-in and never invoked automatically by the frontend).

### 4.4 Start the FastAPI Development Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

The API endpoints will be accessible at:
- **Service Health Check**: [http://localhost:8001/api/v1/health](http://localhost:8001/api/v1/health)
- **Workspace Summary**: [http://localhost:8001/api/v1/workspace/summary](http://localhost:8001/api/v1/workspace/summary)
- **Tracked Repositories**: [http://localhost:8001/api/v1/repositories](http://localhost:8001/api/v1/repositories)
- **Issue Listing**: [http://localhost:8001/api/v1/issues](http://localhost:8001/api/v1/issues)
- **Investigations Listing**: [http://localhost:8001/api/v1/investigations](http://localhost:8001/api/v1/investigations)
- **Dev Reset Endpoint**: `POST` [http://localhost:8001/api/v1/dev/reset](http://localhost:8001/api/v1/dev/reset)
- **Interactive OpenAPI (Swagger) Docs**: [http://localhost:8001/docs](http://localhost:8001/docs)
- **ReDoc UI**: [http://localhost:8001/redoc](http://localhost:8001/redoc)

### 4.5 Run Backend Tests & Linting
```bash
# Run pytest async test suite (57 passing tests)
PYTHONPATH=backend backend/.venv/bin/python3 -m pytest backend/tests -v

# Run Ruff linter across backend
backend/.venv/bin/python3 -m ruff check backend
```

---

## 5. Frontend Setup (Next.js 16)

The frontend is a standalone Next.js App Router application located in `frontend/` that connects to the FastAPI backend API via `NEXT_PUBLIC_API_URL`.

### 5.1 Install Dependencies
```bash
cd frontend
npm install
```

### 5.2 Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Workspace**: [http://localhost:3000](http://localhost:3000) (Clean GitHub-inspired workspace; displays empty onboarding state when no issues exist, and real summary counts + repositories once imported)
- **Issues**: [http://localhost:3000/issues](http://localhost:3000/issues) (Filter and search real tracked issues)
- **Investigations**: [http://localhost:3000/investigations](http://localhost:3000/investigations) (Audit history of multi-agent execution runs)
- **Settings**: [http://localhost:3000/settings](http://localhost:3000/settings) (Model status, read-only guarantees, and one-click database reset tool)
- **Issue Investigation View**: [http://localhost:3000/issues/[id]](http://localhost:3000/issues/[id]) (Focused workspace with Start Investigation action, timeline only after runs exist, API-backed diffs, tests, and human approval gate)

### 5.3 Run Frontend Linting & Production Build
```bash
# Run ESLint checks (0 errors, 0 warnings)
npm run lint

# Run Next.js production build and type checking
npm run build
```

---

## 6. Multi-Agent Orchestration: Demo Mode vs. Live Mode

BugBunny includes a six-stage autonomous agent pipeline powered by the **OpenAI Agents SDK for Python**.

### 6.1 Demo Mode vs. Live Mode Breakdown

| Capability / Behavior | Demo Mode (`AGENT_MODE=demo` or missing key) | Live Mode (`AGENT_MODE=live` + `GEMINI_API_KEY`) |
| :--- | :--- | :--- |
| **External LLM Network Calls** | **Zero.** Completely offline & deterministic. | Live streaming queries via Gemini Provider. |
| **Agent Execution Engine** | Generates strict Pydantic outputs matching real schemas. | OpenAI Agents SDK `Runner` executes dynamic multi-turn interactions. |
| **Safe Sandbox Tools** | In-memory simulated tool calls & strict path guards. | Safe path-bounded tool executions on local workspace. |
| **Patch Authoring** | Generates audit-only unified diffs. | Generates audit-only unified diffs (**never writes to disk**). |
| **Test Execution** | Simulated test runner results with realistic coverage deltas. | Whitelisted test command executions in safe sandbox. |
| **Human Approval Gate** | Transitions investigation to `approved_for_export`. | Transitions investigation to `approved_for_export`. |
| **Persistence** | Full PostgreSQL persistence for `AgentRun`, `AgentArtifact`, and `ConversationMemory`. | Full PostgreSQL persistence for `AgentRun`, `AgentArtifact`, and `ConversationMemory`. |

### 6.2 Steps Needed to Safely Enable Gemini Later

To connect real Google Gemini models in Live Mode:

1. **Obtain an API Key**:
   - Create a Gemini API key via [Google AI Studio](https://aistudio.google.com/).
2. **Configure Environment Variables**:
   - In `.env` (or `backend/.env`):
     ```ini
     AGENT_MODE=live
     AGENT_PROVIDER=gemini
     GEMINI_API_KEY=AIzaSy...your-gemini-key
     GEMINI_MODEL=gemini-2.0-flash
     ```
3. **Verify Model Provider Initialization**:
   - The backend `ModelProvider` in `backend/app/agents/model_provider.py` automatically detects when `GEMINI_API_KEY` is present and initializes the live provider adapter.
   - If the key is omitted or invalid, `ModelProvider.is_live` evaluates to `False`, gracefully falling back to deterministic Demo Mode without crashing.
4. **Security Isolation Guarantee**:
   - The `GEMINI_API_KEY` is purely backend-scoped.
   - The Next.js frontend only consumes normalized REST JSON responses (`/runs`, `/artifacts`) and never has access to or knowledge of API keys.

---

## 7. Monorepo Quality Verification Matrix

Run these commands from the repository root to verify all layers:

| Layer | Command | Expected Result |
| :--- | :--- | :--- |
| **Backend Tests** | `PYTHONPATH=backend backend/.venv/bin/python3 -m pytest backend/tests -v` | All 39 async/sync tests pass |
| **Backend Linter**| `backend/.venv/bin/python3 -m ruff check backend` | All checks pass |
| **Frontend Lint** | `npm run lint --prefix frontend` | Zero errors or warnings |
| **Frontend Build**| `npm run build --prefix frontend` | Standalone optimized production build succeeds |
| **Docker Compose**| `docker compose config` | Valid YAML specification |
