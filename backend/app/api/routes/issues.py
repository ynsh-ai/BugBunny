from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.agent_run import AgentRun
from app.models.investigation import Investigation
from app.models.issue import GitHubIssue
from app.schemas.investigation import (
    InvestigationResponse,
    InvestigationSummary,
    InvestigationTriggerRequest,
)
from app.schemas.issue import (
    GitHubIssueDetail,
    GitHubIssueListItem,
)
from app.schemas.repository import RepositoryResponse

router = APIRouter(prefix="/issues", tags=["Issues"])

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=list[GitHubIssueListItem], summary="List GitHub Issues")
async def list_issues(db: DatabaseSession) -> list[GitHubIssueListItem]:
    """Retrieve all tracked issues with repository info and latest investigation status."""
    stmt = (
        select(GitHubIssue)
        .options(selectinload(GitHubIssue.repository), selectinload(GitHubIssue.investigations))
        .order_by(GitHubIssue.id.asc())
    )
    result = await db.execute(stmt)
    issues = result.scalars().all()

    items: list[GitHubIssueListItem] = []
    for issue in issues:
        latest_inv = issue.investigations[-1] if issue.investigations else None
        items.append(
            GitHubIssueListItem(
                id=issue.id,
                issue_key=issue.issue_key,
                repository_id=issue.repository_id,
                repository_name=issue.repository.name if issue.repository else "unknown",
                github_issue_number=issue.github_issue_number,
                title=issue.title,
                author=issue.author,
                status=issue.status,
                priority=issue.priority,
                created_at=issue.created_at,
                updated_at=issue.updated_at,
                latest_investigation_id=latest_inv.id if latest_inv else None,
                latest_investigation_status=latest_inv.status if latest_inv else None,
            )
        )

    return items


@router.get("/{issue_id}", response_model=GitHubIssueDetail, summary="Get Issue Details")
async def get_issue(issue_id: str, db: DatabaseSession) -> GitHubIssueDetail:
    """Retrieve full details of an issue by ID or issue key (e.g. 'PP-101' or '1')."""
    if issue_id.isdigit():
        query_filter = or_(GitHubIssue.id == int(issue_id), GitHubIssue.issue_key == issue_id)
    else:
        query_filter = GitHubIssue.issue_key == issue_id

    stmt = (
        select(GitHubIssue)
        .options(selectinload(GitHubIssue.repository), selectinload(GitHubIssue.investigations))
        .where(query_filter)
    )
    result = await db.execute(stmt)
    issue = result.scalar_one_or_none()

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue '{issue_id}' not found",
        )

    return GitHubIssueDetail(
        id=issue.id,
        issue_key=issue.issue_key,
        repository=RepositoryResponse.model_validate(issue.repository),
        github_issue_number=issue.github_issue_number,
        title=issue.title,
        description=issue.description,
        author=issue.author,
        status=issue.status,
        priority=issue.priority,
        created_at=issue.created_at,
        updated_at=issue.updated_at,
        investigations=[
            InvestigationSummary.model_validate(inv) for inv in issue.investigations
        ],
    )


@router.post(
    "/{issue_id}/investigations",
    response_model=InvestigationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Trigger Automated Investigation",
)
async def create_investigation(
    issue_id: str,
    db: DatabaseSession,
    payload: InvestigationTriggerRequest | None = None,
) -> InvestigationResponse:
    """Creates and initiates a new automated multi-agent investigation session on the issue."""
    if issue_id.isdigit():
        query_filter = or_(GitHubIssue.id == int(issue_id), GitHubIssue.issue_key == issue_id)
    else:
        query_filter = GitHubIssue.issue_key == issue_id

    stmt = select(GitHubIssue).options(selectinload(GitHubIssue.repository)).where(query_filter)
    result = await db.execute(stmt)
    issue = result.scalar_one_or_none()

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue '{issue_id}' not found",
        )

    now = datetime.now(UTC)
    branch = (
        payload.branch_name
        if payload and payload.branch_name
        else f"patchpilot/{issue.issue_key.lower()}-investigation"
    )

    # Initialize new Investigation entity
    investigation = Investigation(
        issue_id=issue.id,
        status="in_progress",
        branch_name=branch,
        target_commit="HEAD",
        started_at=now,
    )
    db.add(investigation)
    await db.flush()

    # Create initial agent stages
    initial_stages = [
        ("Requirements Analysis", "RequirementsAnalystAgent", "in_progress", "Gemini 1.5 Pro"),
        ("Bug Investigation", "CodeInvestigatorAgent", "pending", "Gemini 1.5 Pro"),
        ("Coding Assistant", "PatchEngineerAgent", "pending", "Gemini 1.5 Pro"),
        ("Testing", "TestRunnerAgent", "pending", "Isolated Runner Sandbox"),
        ("Code Review", "CodeReviewerAgent", "pending", "Gemini 1.5 Pro"),
        ("Documentation", "DocGeneratorAgent", "pending", "Gemini 1.5 Flash"),
    ]

    for stage, agent, agent_status, model in initial_stages:
        run = AgentRun(
            investigation_id=investigation.id,
            stage=stage,
            agent_name=agent,
            status=agent_status,
            model=model,
            started_at=now if agent_status == "in_progress" else None,
        )
        db.add(run)

    # Update issue status
    issue.status = "investigating"
    await db.commit()

    # Re-query with eager loading
    stmt = (
        select(Investigation)
        .options(
            selectinload(Investigation.issue).selectinload(GitHubIssue.repository),
            selectinload(Investigation.agent_runs),
            selectinload(Investigation.decisions),
        )
        .where(Investigation.id == investigation.id)
    )
    res = await db.execute(stmt)
    inv = res.scalar_one()

    return InvestigationResponse(
        id=inv.id,
        issue_id=inv.issue_id,
        issue_key=inv.issue.issue_key,
        repository_name=inv.issue.repository.name if inv.issue.repository else None,
        status=inv.status,
        branch_name=inv.branch_name,
        target_commit=inv.target_commit,
        started_at=inv.started_at,
        completed_at=inv.completed_at,
        agent_runs=inv.agent_runs,
        decisions=inv.decisions,
    )
