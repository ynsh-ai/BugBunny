# BugBunny — Production & Multi-Service Deployment Guide

This guide describes how to build, containerize, and deploy the **BugBunny** monorepo across all three core tiers:
1. **Frontend**: Next.js 16 (App Router, Standalone Output, React 19)
2. **Backend**: FastAPI (Python 3.12, Uvicorn, Asynchronous SQLAlchemy)
3. **Database**: PostgreSQL 16 Alpine with health check and persistent volumes

---

## 1. Architecture & Network Topology

```mermaid
flowchart TD
    Client[Browser / Client] -->|Port 3000| FE[BugBunny Frontend (Next.js Standalone)]
    Client -->|Port 8000| BE[BugBunny Backend Gateway (FastAPI)]
    FE -->|Server-side / Client API calls| BE
    BE -->|Port 5432 / asyncpg| DB[(PostgreSQL 16 Alpine)]

    subgraph Docker Network: bugbunny-net
        FE
        BE
        DB
    end

    subgraph Host / Ingress
        P3000[Host Port 3000] -.-> FE
        P8000[Host Port 8000] -.-> BE
        P5432[Host Port 5432] -.-> DB
    end
```

---

## 2. Quick Deploy with Docker Compose

The root `docker-compose.yml` orchestrates all services with automatic health checking and service dependency ordering (`backend` waits for `postgres` to be healthy, `frontend` starts after `backend`).

### 2.1 Copy Environment Configuration
```bash
cp .env.example .env
```

Ensure production database credentials and domain origins are configured in `.env`:
```ini
POSTGRES_USER=bugbunny
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=bugbunny_db
POSTGRES_PORT=5432
DATABASE_URL=postgresql+asyncpg://bugbunny:your_secure_password_here@postgres:5432/bugbunny_db
SYNC_DATABASE_URL=postgresql://bugbunny:your_secure_password_here@postgres:5432/bugbunny_db
CORS_ORIGINS=https://bugbunny.example.com,http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2.2 Build and Start All Containers
```bash
docker compose up -d --build
```

### 2.3 Verify Service Health
```bash
docker compose ps
```
All services should report `Up (healthy)` or `Up`:
- `bugbunny-postgres` (Port 5432)
- `bugbunny-backend` (Port 8000)
- `bugbunny-frontend` (Port 3000)

### 2.4 Verify Endpoints
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **Interactive OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Issues API**: [http://localhost:8000/api/issues](http://localhost:8000/api/issues)

---

## 3. Container Specifications

### 3.1 Backend Container (`backend/Dockerfile`)
- **Base**: `python:3.12-slim`
- **Security**: Runs under non-root user `bugbunny` (UID 1001)
- **Healthcheck**: In-container curl probe on `http://localhost:8000/health` every 15s
- **Auto-migrations**: On startup, database tables and initial demo seeds are safely verified via lifespan lifecycle.

To manually trigger Alembic migrations inside the running container:
```bash
docker compose exec backend alembic upgrade head
```

### 3.2 Frontend Container (`frontend/Dockerfile`)
- **Base**: `node:20-alpine` (multi-stage build)
- **Build Mode**: Next.js `output: 'standalone'` ensures only traced dependencies are bundled, reducing the image size to ~120MB.
- **Security**: Runs under non-root user `nextjs` (UID 1001)
- **Healthcheck**: In-container wget probe on `http://localhost:3000` every 15s

### 3.3 PostgreSQL Database
- **Base**: `postgres:16-alpine`
- **Volume**: `bugbunny_postgres_data` persistent named volume
- **Healthcheck**: Uses `pg_isready -U bugbunny -d bugbunny_db`

---

## 4. Production Cloud Deployment Options

### Option A: Single VPS with Docker & Nginx / Caddy (Recommended)
1. Provision an Ubuntu / Debian VPS (DigitalOcean Droplet, AWS EC2, Hetzner, Linode).
2. Install Docker Engine and Docker Compose v2.
3. Clone repository and run `docker compose up -d --build`.
4. Configure Caddy or Nginx with Let's Encrypt SSL:

**Sample Caddyfile**:
```caddy
bugbunny.yourdomain.com {
    reverse_proxy localhost:3000
}

api.bugbunny.yourdomain.com {
    reverse_proxy localhost:8000
}
```

### Option B: Managed Cloud Platforms (Render / Railway / Fly.io)
- **Database**: Spin up a managed PostgreSQL 16 instance. Copy the connection string to `DATABASE_URL` and `SYNC_DATABASE_URL`.
- **Backend Service**:
  - Root directory: `backend/`
  - Build command: `pip install .`
  - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Frontend Service**:
  - Root directory: `frontend/`
  - Build command: `npm run build`
  - Start command: `npm run start`
  - Environment variable: `NEXT_PUBLIC_API_URL=https://api.bugbunny.yourdomain.com`

---

## 5. Maintenance Commands

```bash
# View aggregated real-time logs across all services
docker compose logs -f

# View backend logs specifically
docker compose logs -f backend

# Stop services cleanly
docker compose down

# Stop services and remove persistent database volume (DATA LOSS WARNING)
docker compose down -v

# Rebuild only the frontend after code changes
docker compose build frontend && docker compose up -d frontend

# Rebuild only the backend after code changes
docker compose build backend && docker compose up -d backend
```
