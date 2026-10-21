from fastapi import APIRouter

from app.api.routes import health, issues, runs

api_router = APIRouter()

# Mount feature routers
api_router.include_router(health.router)
api_router.include_router(issues.router)
api_router.include_router(runs.router)
