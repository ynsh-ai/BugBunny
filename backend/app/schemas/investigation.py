from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.agent_run import AgentRunResponse
from app.schemas.approval import ApprovalDecisionResponse


class InvestigationTriggerRequest(BaseModel):
    branch_name: str | None = Field(default=None, description="Optional target branch to investigate")


class InvestigationSummary(BaseModel):
    id: int
    issue_id: int
    status: str
    started_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class InvestigationResponse(BaseModel):
    id: int
    issue_id: int
    issue_key: str | None = None
    repository_name: str | None = None
    status: str
    root_cause_summary: str | None = None
    evidence: list[dict[str, Any]] | None = None
    proposed_plan: list[dict[str, Any]] | None = None
    code_diff: str | None = None
    test_results: dict[str, Any] | None = None
    review_audit: dict[str, Any] | None = None
    documentation: dict[str, Any] | None = None
    branch_name: str | None = None
    target_commit: str | None = None
    started_at: datetime
    completed_at: datetime | None = None

    agent_runs: list[AgentRunResponse] = []
    decisions: list[ApprovalDecisionResponse] = []

    model_config = ConfigDict(from_attributes=True)
