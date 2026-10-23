# ==============================================================================
# BugBunny Backend - Production Container Image
# Multi-stage lightweight Python runtime with non-root security context
# ==============================================================================

FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install curl for container health checks
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Copy dependency definition and install packages
COPY pyproject.toml .
RUN pip install --upgrade pip && \
    pip install .

# Copy application code, configuration, and migrations
COPY alembic.ini .
COPY alembic/ ./alembic/
COPY app/ ./app/

# Create and switch to non-privileged application user
RUN useradd -m -u 1001 bugbunny && \
    chown -R bugbunny:bugbunny /app
USER bugbunny

EXPOSE 8000

# Container health check against /health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Launch production server via Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
