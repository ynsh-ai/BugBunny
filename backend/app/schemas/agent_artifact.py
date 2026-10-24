from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.enums import ArtifactTypeEnum


class AgentArtifactBase(BaseModel):
    artifact_type: ArtifactTypeEnum | str
    name: str
    content: Any
    mode: str = "demo"


class AgentArtifactCreate(AgentArtifactBase):
    investigation_id: UUID
    agent_run_id: UUID | None = None


class AgentArtifactResponse(AgentArtifactBase):
    id: UUID
    investigation_id: UUID
    agent_run_id: UUID | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
