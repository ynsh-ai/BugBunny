"""Pydantic schemas for read-only GitHub integration and repository inspection."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field


class GitHubRepoImportRequest(BaseModel):
    """Payload to import a public GitHub repository."""

    url: str = Field(
        ...,
        description="Public GitHub repository URL (e.g. 'https://github.com/psf/requests')",
        examples=["https://github.com/psf/requests"],
    )


class GitHubIssueImportRequest(BaseModel):
    """Payload to import a public GitHub issue."""

    url: str = Field(
        ...,
        description="Public GitHub issue URL (e.g. 'https://github.com/psf/requests/issues/1234')",
        examples=["https://github.com/psf/requests/issues/1234"],
    )


class RepositoryFileItem(BaseModel):
    """Single file entry in a repository tree."""

    path: str = Field(..., description="Relative file path")
    type: str = Field(default="blob", description="Item type: blob or tree")
    size: int | None = Field(default=None, description="Size in bytes")


class RepositoryFilesResponse(BaseModel):
    """Response containing bounded file tree for an imported repository."""

    repository_id: UUID
    repository_name: str
    owner: str
    github_url: str
    default_branch: str
    mode: str = "connected_read_only"
    file_count: int
    files: list[RepositoryFileItem] = []


class SystemModeResponse(BaseModel):
    """System-level agent execution mode and provider status."""

    mode: str = Field(..., description="Configured agent mode: 'demo' or 'live'")
    live_available: bool = Field(..., description="Whether live model credentials are valid")
    provider: str = Field(..., description="Provider name (gemini, demo, openai)")
    model: str = Field(..., description="Active model name")
    message: str = Field(..., description="Informational message regarding mode availability")
