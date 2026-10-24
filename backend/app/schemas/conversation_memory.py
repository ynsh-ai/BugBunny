from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.enums import MemoryRoleEnum


class ConversationMemoryBase(BaseModel):
    role: MemoryRoleEnum | str
    agent_name: str | None = None
    content: str
    metadata_json: dict[str, Any] | None = None
    mode: str = "demo"


class ConversationMemoryCreate(ConversationMemoryBase):
    investigation_id: UUID


class ConversationMemoryResponse(ConversationMemoryBase):
    id: UUID
    investigation_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
