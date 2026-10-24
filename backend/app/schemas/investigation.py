from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.agent_artifact import AgentArtifactResponse
from app.schemas.agent_run import AgentRunResponse
from app.schemas.approval import ApprovalDecisionResponse
from app.schemas.conversation_memory import ConversationMemoryResponse
from app.schemas.enums import InvestigationStatusEnum


class InvestigationTriggerRequest(BaseModel):
    branch_name: str | None = Field(default=None, description="Optional target branch to investigate")


class InvestigationSummary(BaseModel):
    id: UUID
    issue_id: UUID
    status: str
    branch_name: str | None = None
    mode: str = "demo"
    started_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class InvestigationResponse(BaseModel):
    id: UUID
    issue_id: UUID
    issue_key: str | None = None
    repository_name: str | None = None
    status: InvestigationStatusEnum | str = InvestigationStatusEnum.IN_PROGRESS
    root_cause_summary: str | None = None
    evidence: list[dict[str, Any]] | None = None
    proposed_plan: list[dict[str, Any]] | None = None
    code_diff: str | None = None
    diffs: list[dict[str, Any]] | None = None
    test_results: dict[str, Any] | None = None
    review_audit: dict[str, Any] | None = None
    documentation: dict[str, Any] | None = None
    branch_name: str | None = None
    target_commit: str | None = None
    mode: str = "demo"
    started_at: datetime
    completed_at: datetime | None = None

    agent_runs: list[AgentRunResponse] = []
    artifacts: list[AgentArtifactResponse] = []
    decisions: list[ApprovalDecisionResponse] = []
    memories: list[ConversationMemoryResponse] = []

    model_config = ConfigDict(from_attributes=True)
