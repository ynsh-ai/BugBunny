from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import IssuePriorityEnum, IssueStatusEnum
from app.schemas.investigation import InvestigationResponse
from app.schemas.repository import RepositoryResponse


class IssueBase(BaseModel):
    issue_key: str = Field(..., description="Project issue identifier, e.g. PP-101")
    title: str = Field(..., description="Issue title")
    description: str | None = Field(default=None, description="Issue Markdown body")
    author: str = Field(default="developer", description="Issue creator")
    status: IssueStatusEnum | str = Field(
        default=IssueStatusEnum.IN_PROGRESS,
        description="Issue status: In progress, Investigation complete, Testing, etc.",
    )
    priority: IssuePriorityEnum | str = Field(
        default=IssuePriorityEnum.HIGH,
        description="Priority: critical, high, medium, low",
    )
    github_issue_number: int | None = Field(default=None, description="GitHub issue number if synced")
    assigned_agent: str | None = Field(default=None, description="Assigned specialist agent")
    branch: str | None = Field(default=None, description="Working branch")
    target_commit: str | None = Field(default=None, description="Target commit SHA")
    mode: str = Field(default="demo", description="Operation mode: demo or live")


class IssueCreate(IssueBase):
    repository_id: UUID


class IssueListItem(BaseModel):
    id: UUID
    issue_key: str
    repository_id: UUID
    repository_name: str
    github_issue_number: int | None = None
    title: str
    author: str
    status: str
    priority: str
    assigned_agent: str | None = None
    branch: str | None = None
    target_commit: str | None = None
    mode: str = "demo"
    created_at: datetime
    updated_at: datetime
    latest_investigation_id: UUID | None = None
    latest_investigation_status: str | None = None
    timeline: list[dict[str, Any]] = []

    model_config = ConfigDict(from_attributes=True)


class IssueDetail(BaseModel):
    id: UUID
    issue_key: str
    repository: RepositoryResponse
    repository_name: str | None = None
    github_issue_number: int | None = None
    title: str
    description: str | None = None
    author: str
    status: str
    priority: str
    assigned_agent: str | None = None
    branch: str | None = None
    target_commit: str | None = None
    mode: str = "demo"
    created_at: datetime
    updated_at: datetime
    investigations: list[InvestigationResponse] = []
    timeline: list[dict[str, Any]] = []
    root_cause_summary: str | None = None
    evidence: list[dict[str, Any]] = []
    proposed_plan: list[dict[str, Any]] = []
    code_diff: str | None = None
    diffs: list[dict[str, Any]] = []
    test_results: dict[str, Any] | None = None
    review_audit: dict[str, Any] | None = None
    documentation: dict[str, Any] | None = None

    model_config = ConfigDict(from_attributes=True)


# Backwards compatibility aliases
GitHubIssueBase = IssueBase
GitHubIssueCreate = IssueCreate
GitHubIssueListItem = IssueListItem
GitHubIssueDetail = IssueDetail
