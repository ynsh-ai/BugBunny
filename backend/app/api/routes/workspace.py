"""Workspace summary and aggregate statistics API endpoint.

Provides real database-backed counts for repositories, issues, investigations,
and awaiting human approval items.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.investigation import Investigation
from app.models.issue import Issue
from app.models.repository import Repository
from app.schemas.enums import InvestigationStatusEnum

router = APIRouter(prefix="/workspace", tags=["Workspace"])

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


class WorkspaceSummaryResponse(BaseModel):
    repositories_count: int
    issues_count: int
    investigations_count: int
    awaiting_approval_count: int


@router.get(
    "/summary",
    response_model=WorkspaceSummaryResponse,
    summary="Get Workspace Summary Statistics",
)
async def get_workspace_summary(
    db: DatabaseSession,
) -> WorkspaceSummaryResponse:
    """Returns real, database-backed summary statistics for the workspace.

    Zero synthetic metrics or simulated counters.
    """
    repo_cnt = await db.scalar(select(func.count(Repository.id))) or 0
    issue_cnt = await db.scalar(select(func.count(Issue.id))) or 0
    inv_cnt = await db.scalar(select(func.count(Investigation.id))) or 0
    approval_cnt = (
        await db.scalar(
            select(func.count(Investigation.id)).where(
                Investigation.status == InvestigationStatusEnum.AWAITING_APPROVAL.value
            )
        )
        or 0
    )

    return WorkspaceSummaryResponse(
        repositories_count=repo_cnt,
        issues_count=issue_cnt,
        investigations_count=inv_cnt,
        awaiting_approval_count=approval_cnt,
    )
