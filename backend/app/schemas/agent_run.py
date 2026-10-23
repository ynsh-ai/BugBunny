from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class AgentRunResponse(BaseModel):
    id: int
    investigation_id: int
    stage: str
    agent_name: str
    status: str
    model: str
    duration: str | None = None
    summary: str | None = None
    artifacts: dict[str, Any] | list[Any] | None = None
    started_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
