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

    # Future integration keys (placeholders - optional)
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GITHUB_TOKEN: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
