from datetime import UTC, datetime

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response payload schema."""

    status: str = Field(default="healthy", description="Operational status of the API")
    service: str = Field(default="bugbunny-backend", description="Service identifier")
    version: str = Field(default="0.1.0-alpha", description="Deployed application version")
    environment: str = Field(default="development", description="Current operating environment")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(UTC), description="UTC timestamp of the check"
    )
