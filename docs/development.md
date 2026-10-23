# BugBunny — Local Development Guide

This guide details how to set up, run, and test BugBunny services locally. Both frontend and backend are architected to be completely independently runnable.

---

## 1. Prerequisites

Ensure your development machine has the following tools installed:
- **Node.js**: v18.18.0 or later (v20+ recommended)
- **Python**: 3.11 or later
- **Docker & Docker Compose**: v2.20+ (for PostgreSQL)
- **Git**

---

## 2. Environment Configuration

Copy the root `.env.example` file to create your local `.env`:

```bash
cp .env.example .env
```

Review the values in `.env`. By default, development settings connect to the Docker Compose PostgreSQL instance at `localhost:5432`.

---

## 3. Starting the PostgreSQL Database

Start the PostgreSQL service using Docker Compose:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Verify that the container is healthy:

```bash
docker compose -f infra/docker-compose.yml ps
```

To stop the database:
```bash
docker compose -f infra/docker-compose.yml down
```

---

## 4. Running the Backend (FastAPI)

The backend lives in `backend/` and can be set up using standard Python tooling:

### 4.1 Setup Virtual Environment & Dependencies
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4.2 Start the FastAPI Development Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 4.3 Database Migrations with Alembic
Generate and run migrations when models change:

```bash
# Generate a new migration revision
alembic revision --autogenerate -m "Initial schema"

# Apply migrations to database
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

### 4.4 Running Backend Tests
Execute the asynchronous pytest suite:

```bash
pytest tests/ -v
```

---

## 5. Running the Frontend (Next.js)

The frontend is a standalone Next.js App Router application in `frontend/`.

### 5.1 Install Dependencies
```bash
cd frontend
npm install
```

### 5.2 Start the Next.js Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 5.3 Linting and Type Checking
```bash
# Run ESLint
npm run lint

# Run production build and type validation
npm run build
```

---

## 6. Monorepo Quality Checks Checklist

Run these commands from the repository root to verify all components:

| Component | Command | Expected Output |
| :--- | :--- | :--- |
| **Backend Tests** | `./backend/.venv/bin/pytest backend/tests` | All tests pass (`5 passed in ...`) |
| **Frontend Lint** | `cd frontend && npm run lint` | Zero errors or warnings |
| **Frontend Build** | `cd frontend && npm run build` | Optimized production build succeeds |
| **Docker Compose** | `docker compose -f infra/docker-compose.yml config` | Valid YAML specification |

---

## 7. Future Integrations Roadmap

- **OpenAI Agents SDK**: Connect orchestrator to agent definitions in `backend/app/agents/specialists/`.
- **Gemini Provider**: Inject `GEMINI_API_KEY` for deep codebase reasoning and context synthesis.
- **GitHub Apps / PAT**: Hook `GitHubService` to fetch live issues, checkouts, and automate PR submission.
