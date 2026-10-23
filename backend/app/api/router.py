from fastapi import APIRouter

from app.api.routes import health, investigations, issues, runs

api_router = APIRouter()

# Mount feature routers under API
api_router.include_router(health.router)
api_router.include_router(issues.router)
api_router.include_router(investigations.router)
api_router.include_router(runs.router)
