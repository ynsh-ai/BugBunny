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
