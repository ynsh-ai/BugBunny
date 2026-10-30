import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.seeder import seed_demo_data

logger = logging.getLogger("bugbunny.api.dev")

router = APIRouter(prefix="/dev", tags=["Development"])

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


@router.post(
    "/seed",
    status_code=status.HTTP_201_CREATED,
    summary="Seed Development Demo Data",
    description="Idempotently populates the database with the six demo dashboard issues including PP-101.",
)
async def seed_database(
    db: DatabaseSession,
    reset: bool = Query(default=False, description="Whether to clear and reload demo records"),
) -> dict[str, Any]:
    """Development-only seed endpoint populating demo issues marked with mode: demo."""
    result = await seed_demo_data(db, reset=reset)
    return {
        "message": "Demo dataset successfully initialized.",
        **result,
    }


@router.post(
    "/reset",
    status_code=status.HTTP_200_OK,
    summary="Reset Development Database",
    description="Explicitly resets database records to an empty state for testing clean onboarding.",
)
async def reset_database_endpoint(
    db: DatabaseSession,
) -> dict[str, Any]:
    """Wipes issues, repositories, and cascades to investigations/runs/artifacts."""
    from sqlalchemy import delete

    from app.models.agent_artifact import AgentArtifact
    from app.models.agent_run import AgentRun
    from app.models.approval import ApprovalDecision
    from app.models.conversation_memory import ConversationMemory
    from app.models.investigation import Investigation
    from app.models.issue import Issue
    from app.models.repository import Repository

    await db.execute(delete(ConversationMemory))
    await db.execute(delete(ApprovalDecision))
    await db.execute(delete(AgentArtifact))
    await db.execute(delete(AgentRun))
    await db.execute(delete(Investigation))
    res_issues = await db.execute(delete(Issue))
    res_repos = await db.execute(delete(Repository))
    await db.commit()

    logger.info(
        f"Database reset executed: {res_issues.rowcount} issues, "
        f"{res_repos.rowcount} repositories removed."
    )
    return {
        "message": "Database successfully reset to empty state.",
        "deleted_issues": res_issues.rowcount,
        "deleted_repositories": res_repos.rowcount,
    }

