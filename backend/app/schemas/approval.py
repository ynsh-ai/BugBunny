from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ApprovalDecisionCreate(BaseModel):
    decision: str = Field(..., description="Decision: 'approved' or 'rejected'")
    reviewer: str = Field(default="developer", description="Reviewer identifier")
    notes: str | None = Field(default=None, description="Optional review notes")


class ApprovalDecisionResponse(BaseModel):
    id: int
    investigation_id: int
    decision: str
    reviewer: str
    notes: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
