from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AgentRunTrigger(BaseModel):
    """Payload to trigger an agent orchestration pipeline on an issue."""

    issue_id: int = Field(..., description="ID of the tracked issue")
    branch_name: str | None = Field(None, description="Optional target Git branch")


class AgentRunResponse(BaseModel):
    """Response payload for an agent run session."""

    id: int
    issue_id: int | None
    status: str
    current_stage: str
    requirements_spec: dict[str, Any] | None = None
    implementation_plan: str | None = None
    unified_patch: str | None = None
    test_run_results: dict[str, Any] | None = None
    review_feedback: str | None = None
    started_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
