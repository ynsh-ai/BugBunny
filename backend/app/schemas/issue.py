from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class IssueBase(BaseModel):
    """Base schema for GitHub issues."""

    github_url: str = Field(..., description="Full GitHub issue URL")
    title: str | None = Field(None, description="Issue title")
    description: str | None = Field(None, description="Issue description / Markdown body")


class IssueCreate(IssueBase):
    """Payload to submit a GitHub issue for agent investigation."""



class IssueResponse(IssueBase):
    """Response model for a tracked issue."""

    id: int
    repo_owner: str
    repo_name: str
    issue_number: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
