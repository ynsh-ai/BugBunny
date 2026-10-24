import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.agent_run import AgentRun
from app.models.investigation import Investigation
from app.models.issue import Issue
from app.schemas.investigation import (
    InvestigationResponse,
    InvestigationTriggerRequest,
)
from app.schemas.issue import (
    IssueDetail,
    IssueListItem,
)
from app.schemas.repository import RepositoryResponse

router = APIRouter(prefix="/issues", tags=["Issues"])

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=list[IssueListItem], summary="List Tracked Issues")
async def list_issues(
    db: DatabaseSession,
    repository: str | None = Query(default=None, description="Filter issues by repository name"),
    mode: str | None = Query(default=None, description="Filter issues by mode (e.g. demo)"),
) -> list[IssueListItem]:
    """Retrieve all tracked issues with repository info and latest investigation status."""
    stmt = (
        select(Issue)
        .options(
            selectinload(Issue.repository),
            selectinload(Issue.investigations).selectinload(Investigation.agent_runs),
        )
        .order_by(Issue.created_at.desc(), Issue.issue_key.asc())
    )
    if mode:
        stmt = stmt.where(Issue.mode == mode)

    result = await db.execute(stmt)
    issues = result.scalars().all()

    items: list[IssueListItem] = []
    for issue in issues:
        if (
            repository
            and repository != "all"
            and (not issue.repository or issue.repository.name != repository)
        ):
            continue

        latest_inv = issue.investigations[-1] if issue.investigations else None
        timeline: list[dict] = []
        if latest_inv and latest_inv.agent_runs:
            for r in latest_inv.agent_runs:
                timeline.append(
                    {
                        "stage": r.stage,
                        "agentName": r.agent_name,
                        "status": r.status,
                        "duration": r.duration or "",
                        "model": r.model,
                        "summary": r.summary or "",
                    }
                )

        items.append(
            IssueListItem(
                id=issue.id,
                issue_key=issue.issue_key,
                repository_id=issue.repository_id,
                repository_name=issue.repository.name if issue.repository else "unknown",
                github_issue_number=issue.github_issue_number,
                title=issue.title,
                author=issue.author,
                status=issue.status,
                priority=issue.priority,
                assigned_agent=issue.assigned_agent,
                branch=issue.branch,
                target_commit=issue.target_commit,
                mode=issue.mode,
                created_at=issue.created_at,
                updated_at=issue.updated_at,
                latest_investigation_id=latest_inv.id if latest_inv else None,
                latest_investigation_status=latest_inv.status if latest_inv else None,
                timeline=timeline,
            )
        )

    return items


@router.get("/{issue_id}", response_model=IssueDetail, summary="Get Issue Details")
async def get_issue(issue_id: str, db: DatabaseSession) -> IssueDetail:
    """Retrieve full details of an issue by UUID or issue key (e.g. 'PP-101')."""
    # Check if issue_id is valid UUID
    parsed_uuid: uuid.UUID | None = None
    try:
        parsed_uuid = uuid.UUID(issue_id)
    except (ValueError, AttributeError):
        parsed_uuid = None

    if parsed_uuid:
        query_filter = or_(Issue.id == parsed_uuid, func.lower(Issue.issue_key) == issue_id.lower())
    else:
        query_filter = func.lower(Issue.issue_key) == issue_id.lower()

    stmt = (
        select(Issue)
        .options(
            selectinload(Issue.repository),
            selectinload(Issue.investigations).selectinload(Investigation.agent_runs),
            selectinload(Issue.investigations).selectinload(Investigation.artifacts),
            selectinload(Issue.investigations).selectinload(Investigation.decisions),
            selectinload(Issue.investigations).selectinload(Investigation.memories),
        )
        .where(query_filter)
    )
    result = await db.execute(stmt)
    issue = result.scalar_one_or_none()

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue '{issue_id}' not found",
        )

    latest_inv = issue.investigations[-1] if issue.investigations else None
    timeline: list[dict] = []
    if latest_inv and latest_inv.agent_runs:
        for r in latest_inv.agent_runs:
            timeline.append(
                {
                    "stage": r.stage,
                    "agentName": r.agent_name,
                    "status": r.status,
                    "duration": r.duration or "",
                    "model": r.model,
                    "summary": r.summary or "",
                }
            )

    investigation_responses = [
        InvestigationResponse(
            id=inv.id,
            issue_id=inv.issue_id,
            issue_key=issue.issue_key,
            repository_name=issue.repository.name if issue.repository else None,
            status=inv.status,
            root_cause_summary=inv.root_cause_summary,
            evidence=inv.evidence or [],
            proposed_plan=inv.proposed_plan or [],
            code_diff=inv.code_diff,
            diffs=inv.diffs or [],
            test_results=inv.test_results,
            review_audit=inv.review_audit,
            documentation=inv.documentation,
            branch_name=inv.branch_name,
            target_commit=inv.target_commit,
            mode=inv.mode,
            started_at=inv.started_at,
            completed_at=inv.completed_at,
            agent_runs=inv.agent_runs,
            artifacts=inv.artifacts,
            decisions=inv.decisions,
            memories=inv.memories,
        )
        for inv in issue.investigations
    ]

    return IssueDetail(
        id=issue.id,
        issue_key=issue.issue_key,
        repository=RepositoryResponse.model_validate(issue.repository),
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
        investigations=investigation_responses,
        timeline=timeline,
        root_cause_summary=latest_inv.root_cause_summary if latest_inv else None,
        evidence=latest_inv.evidence or [] if latest_inv else [],
        proposed_plan=latest_inv.proposed_plan or [] if latest_inv else [],
        code_diff=latest_inv.code_diff if latest_inv else None,
        diffs=latest_inv.diffs or [] if latest_inv else [],
        test_results=latest_inv.test_results if latest_inv else None,
        review_audit=latest_inv.review_audit if latest_inv else None,
        documentation=latest_inv.documentation if latest_inv else None,
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
    parsed_uuid: uuid.UUID | None = None
    try:
        parsed_uuid = uuid.UUID(issue_id)
    except (ValueError, AttributeError):
        parsed_uuid = None

    if parsed_uuid:
        query_filter = or_(Issue.id == parsed_uuid, func.lower(Issue.issue_key) == issue_id.lower())
    else:
        query_filter = func.lower(Issue.issue_key) == issue_id.lower()

    stmt = select(Issue).options(selectinload(Issue.repository)).where(query_filter)
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
        else f"bugbunny/{issue.issue_key.lower()}-investigation"
    )

    # Initialize new Investigation entity
    investigation = Investigation(
        issue_id=issue.id,
        status="in_progress",
        branch_name=branch,
        target_commit="HEAD",
        mode=issue.mode,
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
            mode=issue.mode,
            started_at=now if agent_status == "in_progress" else None,
        )
        db.add(run)

    # Update issue status
    issue.status = "In progress"
    await db.commit()

    # Re-query with eager loading
    stmt = (
        select(Investigation)
        .options(
            selectinload(Investigation.issue).selectinload(Issue.repository),
            selectinload(Investigation.agent_runs),
            selectinload(Investigation.artifacts),
            selectinload(Investigation.decisions),
            selectinload(Investigation.memories),
        )
        .where(Investigation.id == investigation.id)
    )
    res = await db.execute(stmt)
    inv = res.scalar_one()

    return InvestigationResponse(
        id=inv.id,
        issue_id=inv.issue_id,
        issue_key=inv.issue.issue_key,
        repository_name=inv.issue.repository.name if inv.issue and inv.issue.repository else None,
        status=inv.status,
        branch_name=inv.branch_name,
        target_commit=inv.target_commit,
        mode=inv.mode,
        started_at=inv.started_at,
        completed_at=inv.completed_at,
        agent_runs=inv.agent_runs,
        artifacts=inv.artifacts,
        decisions=inv.decisions,
        memories=inv.memories,
    )
