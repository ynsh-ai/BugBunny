from collections.abc import AsyncGenerator

from sqlalchemy.engine.url import make_url
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

from app.core.config import settings

# Base class for all SQLAlchemy declarative models
Base = declarative_base()


def _build_async_engine():
    """Builds the AsyncEngine with automatic SSL negotiation for cloud databases (Neon, Supabase)."""
    raw_url = settings.DATABASE_URL
    url_obj = make_url(raw_url)
    connect_args: dict = {}

    query_params = dict(url_obj.query)
    # Pop libpq-specific parameters (like sslmode, channel_binding) that asyncpg rejects
    needs_ssl = (
        query_params.pop("sslmode", None) in ("require", "verify-ca", "verify-full")
        or query_params.pop("ssl", None) in ("require", "true", "True")
        or (
            url_obj.host
            and not any(h in url_obj.host for h in ["localhost", "127.0.0.1", "postgres"])
            and settings.ENVIRONMENT != "development"
        )
    )

    for libpq_key in ("channel_binding", "target_session_attrs", "sslcert", "sslkey", "sslrootcert"):
        query_params.pop(libpq_key, None)

    if needs_ssl:
        connect_args["ssl"] = True

    sanitized_url = url_obj._replace(query=query_params).render_as_string(hide_password=False)

    return create_async_engine(
        sanitized_url,
        echo=settings.ENVIRONMENT == "development",
        future=True,
        pool_pre_ping=True,
        connect_args=connect_args,
    )


# Async database engine initialized from environment settings
engine = _build_async_engine()

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency provider yielding an asynchronous database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
