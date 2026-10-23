import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.database import AsyncSessionLocal, Base, engine
from app.core.seeder import seed_demo_data
from app.schemas.health import HealthResponse

# Configure structured logging
logging.basicConfig(
    level=settings.LOG_LEVEL.upper(),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("bugbunny")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown event lifecycle."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    try:
        # Create database tables if they do not exist
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Seed initial demo repository and issue
        async with AsyncSessionLocal() as session:
            await seed_demo_data(session)
    except Exception as e:  # noqa: BLE001
        logger.warning(f"Database initialization / auto-seed deferred: {e}")

    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}")


def create_application() -> FastAPI:
    """Factory creating and configuring the FastAPI instance."""
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Autonomous multi-agent software engineering assistant API.",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Cross-Origin Resource Sharing (CORS)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Direct top-level health check endpoint: GET /health
    @application.get(
        "/health",
        response_model=HealthResponse,
        tags=["Health"],
        summary="Service Health Check",
    )
    async def direct_health() -> HealthResponse:
        return HealthResponse(
            status="healthy",
            service=settings.PROJECT_NAME,
            version=settings.VERSION,
            environment=settings.ENVIRONMENT,
        )

    # Top-level index route
    @application.get("/", tags=["Root"], summary="Root Index")
    async def root():
        return {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "docs": "/docs",
            "health": "/health",
            "api": "/api",
        }

    # Mount API router under /api
    application.include_router(api_router, prefix="/api")

    # Optional alias /api/v1 for backwards compatibility
    application.include_router(api_router, prefix="/api/v1")

    return application


app = create_application()
