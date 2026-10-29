"""GitHub Read-Only Integration Endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.github import GitHubIssueImportRequest, GitHubRepoImportRequest
from app.schemas.issue import IssueDetail
from app.schemas.repository import RepositoryResponse
from app.services.github_service import GitHubService, GitHubServiceError

router = APIRouter(prefix="/github", tags=["GitHub Read-Only"])

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


@router.post(
    "/import-repository",
    response_model=RepositoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Import Public GitHub Repository",
)
async def import_repository(
    payload: GitHubRepoImportRequest,
    db: DatabaseSession,
) -> RepositoryResponse:
    """Imports metadata and bounded safe file tree from a public GitHub repository.

    Strictly read-only: never modifies repository files, commits, branches, or PRs.
    """
    service = GitHubService()
    try:
        repo = await service.import_repository(db, payload.url)
        return RepositoryResponse(
            id=repo.id,
            name=repo.name,
            owner=repo.owner,
            github_url=repo.github_url,
            default_branch=repo.default_branch,
            is_active=repo.is_active,
            mode=repo.mode,
            file_count=len(repo.file_tree or []),
            file_tree=repo.file_tree,
            created_at=repo.created_at,
            updated_at=repo.updated_at,
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        ) from val_err
    except GitHubServiceError as gh_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(gh_err),
        ) from gh_err


@router.post(
    "/import-issue",
    response_model=IssueDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Import Public GitHub Issue",
)
async def import_issue(
    payload: GitHubIssueImportRequest,
    db: DatabaseSession,
) -> IssueDetail:
    """Imports a public GitHub issue and caches its repository context.

    Strictly read-only: never alters or edits GitHub issues.
    """
    service = GitHubService()
    try:
        issue = await service.import_issue(db, payload.url)
        return IssueDetail(
            id=issue.id,
            issue_key=issue.issue_key,
            repository=RepositoryResponse.model_validate(issue.repository) if issue.repository else None,
            repository_name=issue.repository.name if issue.repository else None,
            github_issue_number=issue.github_issue_number,
            title=issue.title,
            description=issue.description,
            author=issue.author,
            status=issue.status,
            priority=issue.priority,
            assigned_agent=issue.assigned_agent,
            branch=issue.branch,
            target_commit=issue.target_commit,
            mode=issue.mode,
            created_at=issue.created_at,
            updated_at=issue.updated_at,
            investigations=[],
            timeline=[],
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        ) from val_err
    except GitHubServiceError as gh_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(gh_err),
        ) from gh_err
