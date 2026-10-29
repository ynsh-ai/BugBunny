from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application runtime configuration parsed from environment variables."""

    # Project metadata
    PROJECT_NAME: str = "BugBunny"
    VERSION: str = "0.1.0-alpha"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "info"

    # Server binding
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    # CORS origins allowed to communicate with the API
    CORS_ORIGINS: str | list[str] = ["http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Database configuration
    POSTGRES_USER: str = "bugbunny"
    POSTGRES_PASSWORD: str = "bugbunny_password"
    POSTGRES_DB: str = "bugbunny_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = (
        "postgresql+asyncpg://bugbunny:bugbunny_password@localhost:5432/bugbunny_db"
    )
    SYNC_DATABASE_URL: str = (
        "postgresql://bugbunny:bugbunny_password@localhost:5432/bugbunny_db"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        """Normalizes cloud database URLs (Neon, Supabase, Render) to asyncpg format."""
        if not v:
            return v
        v = v.strip()
        if v.startswith("postgres://"):
            v = "postgresql+asyncpg://" + v[len("postgres://") :]
        elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            v = "postgresql+asyncpg://" + v[len("postgresql://") :]
        return v

    @field_validator("SYNC_DATABASE_URL", mode="before")
    @classmethod
    def normalize_sync_database_url(cls, v: str) -> str:
        """Normalizes sync URLs for Alembic migrations."""
        if not v:
            return v
        v = v.strip()
        if v.startswith("postgres://"):
            v = "postgresql://" + v[len("postgres://") :]
        return v

    # Multi-agent workflow configuration
    AGENT_MODE: str = "demo"  # demo | live
    AGENT_PROVIDER: str = "gemini"  # gemini | openai
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-pro"
    OPENAI_API_KEY: str = ""
    GITHUB_TOKEN: str = ""

    @property
    def is_demo_mode(self) -> bool:
        """Determines whether multi-agent pipeline operates in safe offline demo mode."""
        return self.AGENT_MODE.lower() == "demo" or not (
            self.GEMINI_API_KEY or self.OPENAI_API_KEY
        )

    @property
    def is_live_gemini_available(self) -> bool:
        """Returns True if live Gemini mode is configured and valid."""
        return (
            self.AGENT_MODE.lower() == "live"
            and self.AGENT_PROVIDER.lower() == "gemini"
            and bool(self.GEMINI_API_KEY and self.GEMINI_API_KEY.strip())
        )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
