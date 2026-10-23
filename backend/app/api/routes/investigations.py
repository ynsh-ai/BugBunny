from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.approval import ApprovalDecision
from app.models.investigation import Investigation
from app.models.issue import GitHubIssue
from app.schemas.approval import ApprovalDecisionCreate, ApprovalDecisionResponse
from app.schemas.investigation import InvestigationResponse

router = APIRouter(prefix="/investigations", tags=["Investigations"])

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


@router.get(
    "/{investigation_id}",
    response_model=InvestigationResponse,
    summary="Get Investigation Details",
)
async def get_investigation(
    investigation_id: int,
    db: DatabaseSession,
) -> InvestigationResponse:
    """Retrieve full artifacts and progression for an investigation session."""
    stmt = (
        select(Investigation)
        .options(
            selectinload(Investigation.issue).selectinload(GitHubIssue.repository),
            selectinload(Investigation.agent_runs),
            selectinload(Investigation.decisions),
        )
        .where(Investigation.id == investigation_id)
    )
    result = await db.execute(stmt)
    inv = result.scalar_one_or_none()

    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation {investigation_id} not found",
        )

    return InvestigationResponse(
        id=inv.id,
        issue_id=inv.issue_id,
        issue_key=inv.issue.issue_key if inv.issue else None,
        repository_name=(
            inv.issue.repository.name if inv.issue and inv.issue.repository else None
        ),
        status=inv.status,
        root_cause_summary=inv.root_cause_summary,
        evidence=inv.evidence,
        proposed_plan=inv.proposed_plan,
        code_diff=inv.code_diff,
        test_results=inv.test_results,
        review_audit=inv.review_audit,
        documentation=inv.documentation,
        branch_name=inv.branch_name,
        target_commit=inv.target_commit,
        started_at=inv.started_at,
        completed_at=inv.completed_at,
        agent_runs=inv.agent_runs,
        decisions=inv.decisions,
    )


@router.post(
    "/{investigation_id}/decision",
    response_model=ApprovalDecisionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Approval Decision",
)
async def submit_approval_decision(
    investigation_id: int,
    payload: ApprovalDecisionCreate,
    db: DatabaseSession,
) -> ApprovalDecisionResponse:
    """Record a human-in-the-loop approval or rejection decision."""
    stmt = select(Investigation).where(Investigation.id == investigation_id)
    result = await db.execute(stmt)
    inv = result.scalar_one_or_none()

    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation {investigation_id} not found",
        )

    decision = ApprovalDecision(
        investigation_id=inv.id,
        decision=payload.decision.lower(),
        reviewer=payload.reviewer,
        notes=payload.notes,
        created_at=datetime.now(UTC),
    )
    db.add(decision)
    await db.commit()
    await db.refresh(decision)

    return ApprovalDecisionResponse.model_validate(decision)
