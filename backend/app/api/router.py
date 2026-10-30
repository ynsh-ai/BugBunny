from fastapi import APIRouter

from app.api.routes import (
    dev,
    github,
    health,
    investigations,
    issues,
    repositories,
    runs,
    system,
    workspace,
)

api_router = APIRouter()

# Mount feature routers under API
api_router.include_router(health.router)
api_router.include_router(issues.router)
api_router.include_router(investigations.router)
api_router.include_router(runs.router)
api_router.include_router(github.router)
api_router.include_router(repositories.router)
api_router.include_router(workspace.router)
api_router.include_router(system.router)
api_router.include_router(dev.router)

