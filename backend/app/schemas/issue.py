from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.investigation import InvestigationSummary
from app.schemas.repository import RepositoryResponse


class GitHubIssueBase(BaseModel):
    issue_key: str = Field(..., description="Project issue identifier, e.g. PP-101")
    title: str = Field(..., description="Issue title")
    description: str | None = Field(default=None, description="Issue Markdown body")
    author: str = Field(default="developer", description="Issue creator")
    status: str = Field(default="open", description="Issue status: open, investigating, completed")
    priority: str = Field(default="high", description="Priority: critical, high, medium, low")
    github_issue_number: int | None = Field(default=None, description="GitHub issue number if synced")


class GitHubIssueCreate(GitHubIssueBase):
    repository_id: int


class GitHubIssueListItem(BaseModel):
    id: int
    issue_key: str
    repository_id: int
    repository_name: str
    github_issue_number: int | None = None
    title: str
    author: str
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime
    latest_investigation_id: int | None = None
    latest_investigation_status: str | None = None

    model_config = ConfigDict(from_attributes=True)


class GitHubIssueDetail(BaseModel):
    id: int
    issue_key: str
    repository: RepositoryResponse
    github_issue_number: int | None = None
    title: str
    description: str | None = None
    author: str
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime
    investigations: list[InvestigationSummary] = []

    model_config = ConfigDict(from_attributes=True)
