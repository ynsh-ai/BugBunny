# BugBunny — Backend API

FastAPI asynchronous API gateway and multi-agent orchestration service for BugBunny.

## Features
- **FastAPI Asynchronous Gateway**: High-throughput REST API with structured Pydantic v2 schemas.
- **SQLAlchemy 2.0 & AsyncPG**: Asynchronous PostgreSQL persistence with connection pooling.
- **Alembic Migrations**: Versioned database schemas and auto-seeding.
- **Multi-Agent Pipeline Ready**: Orchestrates Requirements Analysis, Codebase Investigation, Patch Engineering, Testing, Code Review, and Pull Request generation.

## Getting Started

### Local Setup
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Endpoints
- Direct Health Check: `GET /health`
- OpenAPI Documentation: `GET /docs`
- Issues: `GET /api/issues`
- Issue Details: `GET /api/issues/{issue_id}`
- Trigger Investigation: `POST /api/issues/{issue_id}/investigations`
- Investigation Details: `GET /api/investigations/{investigation_id}`

### Testing
```bash
pytest tests/ -v
```

### Docker
```bash
docker build -t bugbunny-backend .
docker run -p 8000:8000 bugbunny-backend
```
