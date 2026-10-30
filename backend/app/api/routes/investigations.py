"""Investigations API Routes.

Exposes endpoints for retrieving investigation details, agent run execution history,
persisted artifacts, and recording human-in-the-loop audit decisions.
"""

import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.agent_artifact import AgentArtifact
from app.models.agent_run import AgentRun
from app.models.approval import ApprovalDecision
from app.models.investigation import Investigation
from app.models.issue import Issue
from app.schemas.agent_artifact import AgentArtifactResponse
from app.schemas.agent_run import AgentRunResponse
from app.schemas.approval import ApprovalDecisionCreate, ApprovalDecisionResponse
from app.schemas.enums import ApprovalDecisionEnum, InvestigationStatusEnum
from app.schemas.investigation import InvestigationResponse

router = APIRouter(prefix="/investigations", tags=["Investigations"])

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


def _parse_uuid_or_404(raw_id: str, resource_name: str = "Investigation") -> uuid.UUID:
    """Safely parse UUID or raise 404 HTTP exception."""
    try:
        return uuid.UUID(raw_id)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name} '{raw_id}' not found",
        )


@router.get(
    "",
    response_model=list[InvestigationResponse],
    summary="List Investigations",
)
async def list_investigations(
    db: DatabaseSession,
) -> list[InvestigationResponse]:
    """Retrieve all investigations ordered by started_at desc."""
    stmt = (
        select(Investigation)
        .options(
            selectinload(Investigation.issue).selectinload(Issue.repository),
            selectinload(Investigation.agent_runs),
            selectinload(Investigation.artifacts),
            selectinload(Investigation.decisions),
            selectinload(Investigation.memories),
        )
        .order_by(Investigation.started_at.desc())
    )
    result = await db.execute(stmt)
    invs = result.scalars().all()
    return [
        InvestigationResponse(
            id=inv.id,
            issue_id=inv.issue_id,
            issue_key=inv.issue.issue_key if inv.issue else None,
            repository_name=(
                inv.issue.repository.name if inv.issue and inv.issue.repository else None
            ),
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
        for inv in invs
    ]


@router.get(
    "/{investigation_id}",
    response_model=InvestigationResponse,
    summary="Get Investigation Details",
)
async def get_investigation(
    investigation_id: str,
    db: DatabaseSession,
) -> InvestigationResponse:
    """Retrieve full artifacts and progression for an investigation session."""
    parsed_uuid = _parse_uuid_or_404(investigation_id)

    stmt = (
        select(Investigation)
        .options(
            selectinload(Investigation.issue).selectinload(Issue.repository),
            selectinload(Investigation.agent_runs),
            selectinload(Investigation.artifacts),
            selectinload(Investigation.decisions),
            selectinload(Investigation.memories),
        )
        .where(Investigation.id == parsed_uuid)
    )
    result = await db.execute(stmt)
    inv = result.scalar_one_or_none()

    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found",
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


@router.get(
    "/{investigation_id}/runs",
    response_model=list[AgentRunResponse],
    summary="Get Investigation Agent Runs",
)
async def get_investigation_runs(
    investigation_id: str,
    db: DatabaseSession,
) -> list[AgentRunResponse]:
    """Retrieve all specialist agent runs executed during this investigation session."""
    parsed_uuid = _parse_uuid_or_404(investigation_id)

    # Verify investigation exists
    inv_check = await db.execute(select(Investigation.id).where(Investigation.id == parsed_uuid))
    if not inv_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found",
        )

    stmt = (
        select(AgentRun)
        .where(AgentRun.investigation_id == parsed_uuid)
        .order_by(AgentRun.started_at.asc())
    )
    result = await db.execute(stmt)
    runs = result.scalars().all()
    return [AgentRunResponse.model_validate(r) for r in runs]


@router.get(
    "/{investigation_id}/artifacts",
    response_model=list[AgentArtifactResponse],
    summary="Get Investigation Artifacts",
)
async def get_investigation_artifacts(
    investigation_id: str,
    db: DatabaseSession,
) -> list[AgentArtifactResponse]:
    """Retrieve all structured audit artifacts generated across all agent stages."""
    parsed_uuid = _parse_uuid_or_404(investigation_id)

    # Verify investigation exists
    inv_check = await db.execute(select(Investigation.id).where(Investigation.id == parsed_uuid))
    if not inv_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found",
        )

    stmt = (
        select(AgentArtifact)
        .where(AgentArtifact.investigation_id == parsed_uuid)
        .order_by(AgentArtifact.created_at.asc())
    )
    result = await db.execute(stmt)
    artifacts = result.scalars().all()
    return [AgentArtifactResponse.model_validate(a) for a in artifacts]


@router.post(
    "/{investigation_id}/decision",
    response_model=ApprovalDecisionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Human Approval Decision",
)
async def submit_approval_decision(
    investigation_id: str,
    payload: ApprovalDecisionCreate,
    db: DatabaseSession,
) -> ApprovalDecisionResponse:
    """Record a human-in-the-loop approval or rejection decision.

    SECURITY GUARANTEE: Approval changes the audit state to 'approved_for_export'
    and never modifies files on disk or automatically applies commits.
    """
    parsed_uuid = _parse_uuid_or_404(investigation_id)

    stmt = (
        select(Investigation)
        .options(selectinload(Investigation.issue))
        .where(Investigation.id == parsed_uuid)
    )
    result = await db.execute(stmt)
    inv = result.scalar_one_or_none()

    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found",
        )

    norm_decision = str(payload.decision).lower()

    # Transition investigation state based on decision
    if norm_decision in {
        ApprovalDecisionEnum.APPROVED.value,
        ApprovalDecisionEnum.APPROVED_FOR_EXPORT.value,
        "approve",
        "approved",
    }:
        inv.status = InvestigationStatusEnum.APPROVED_FOR_EXPORT.value
        if inv.issue:
            inv.issue.status = "Approved"
        recorded_decision = ApprovalDecisionEnum.APPROVED_FOR_EXPORT.value
    elif norm_decision in {ApprovalDecisionEnum.REJECTED.value, "reject", "rejected"}:
        inv.status = "rejected"
        if inv.issue:
            inv.issue.status = "Rejected"
        recorded_decision = ApprovalDecisionEnum.REJECTED.value
    else:
        recorded_decision = ApprovalDecisionEnum.COMMENT.value

    decision = ApprovalDecision(
        investigation_id=inv.id,
        decision=recorded_decision,
        reviewer=payload.reviewer,
        notes=payload.notes,
        mode=inv.mode,
        created_at=datetime.now(UTC),
    )
    db.add(decision)
    await db.commit()
    await db.refresh(decision)

    return ApprovalDecisionResponse.model_validate(decision)
