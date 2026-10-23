# BugBunny — Local Development Guide

This guide details how to set up, run, and test BugBunny services locally on your machine. Both the Next.js frontend and FastAPI backend are architected to be completely independently runnable.

---

## 1. Prerequisites

Ensure your development machine has the following tools installed:
- **Node.js**: v20.0.0 or later (v20+ LTS recommended)
- **Python**: 3.11 or later (Python 3.12 recommended)
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
CORS_ORIGINS=http://localhost:3000

PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> [!NOTE]
> Never commit real API keys or credentials to version control. The `.env` file is excluded in `.gitignore`.

---

## 3. Database Setup (PostgreSQL)

You can run PostgreSQL locally using the standalone infrastructure compose file:

```bash
# Start PostgreSQL 16 container in the background
docker compose -f infra/docker-compose.yml up -d

# Verify container health
docker compose -f infra/docker-compose.yml ps
```

To stop the database:
```bash
docker compose -f infra/docker-compose.yml down
```

---

## 4. Backend Setup (FastAPI)

The backend application lives in `backend/` and uses standard Python virtual environment tooling.

### 4.1 Setup Virtual Environment & Install Dependencies
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4.2 Database Migrations with Alembic
When the backend starts up, it automatically verifies and seeds demo data. If you modify SQLAlchemy models in `backend/app/models/`, use Alembic to generate and apply migrations:

```bash
# Generate a new migration revision
alembic revision --autogenerate -m "Add new column or model"

# Apply pending migrations to the database
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

### 4.3 Start the FastAPI Development Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API endpoints will be accessible at:
- **Service Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **Interactive OpenAPI (Swagger) Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Issues API**: [http://localhost:8000/api/issues](http://localhost:8000/api/issues)

### 4.4 Run Backend Tests & Linting
```bash
# Run pytest async test suite (11 passing tests)
pytest tests/ -v

# Run Ruff linter across backend
ruff check .
```

---

## 5. Frontend Setup (Next.js 16)

The frontend is a standalone Next.js App Router application located in `frontend/`.

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
- **Overview Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Issue List**: [http://localhost:3000/issues](http://localhost:3000/issues)
- **PP-101 Investigation View**: [http://localhost:3000/issues/PP-101](http://localhost:3000/issues/PP-101)

### 5.3 Run Frontend Linting & Production Build
```bash
# Run ESLint checks
npm run lint

# Run Next.js production build and type checking
npm run build
```

---

## 6. Monorepo Quality Verification Matrix

Run these commands from the repository root to verify all layers:

| Layer | Command | Expected Result |
| :--- | :--- | :--- |
| **Backend Tests** | `./backend/.venv/bin/pytest backend/tests -v` | All 11 async tests pass |
| **Backend Linter**| `./backend/.venv/bin/ruff check backend` | All checks pass |
| **Frontend Lint** | `cd frontend && npm run lint` | Zero errors or warnings |
| **Frontend Build**| `cd frontend && npm run build` | Standalone optimized production build succeeds |
| **Docker Compose**| `docker compose config` | Valid YAML specification |
