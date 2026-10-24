from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.enums import ApprovalDecisionEnum


class ApprovalDecisionBase(BaseModel):
    decision: ApprovalDecisionEnum | str
    reviewer: str = "developer"
    notes: str | None = None
    mode: str = "demo"


class ApprovalDecisionCreate(ApprovalDecisionBase):
    pass


class ApprovalDecisionResponse(ApprovalDecisionBase):
    id: UUID
    investigation_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
