from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.enums import AgentStageEnum, RunStatusEnum


class AgentRunBase(BaseModel):
    stage: AgentStageEnum | str
    agent_name: str
    status: RunStatusEnum | str = RunStatusEnum.PENDING
    model: str = "Gemini 1.5 Pro"
    duration: str | None = None
    summary: str | None = None
    artifacts: Any | None = None
    mode: str = "demo"


class AgentRunCreate(AgentRunBase):
    investigation_id: UUID


class AgentRunResponse(AgentRunBase):
    id: UUID
    investigation_id: UUID
    started_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
