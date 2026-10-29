"""Repository inspection and file listing endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.repository import Repository
from app.schemas.github import RepositoryFileItem, RepositoryFilesResponse

router = APIRouter(prefix="/repositories", tags=["Repositories"])

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


@router.get(
    "/{repository_id}/files",
    response_model=RepositoryFilesResponse,
    summary="Get Repository Bounded Safe Files",
)
async def get_repository_files(
    repository_id: str,
    db: DatabaseSession,
) -> RepositoryFilesResponse:
    """Retrieve safe, bounded file tree metadata for a tracked or imported repository."""
    parsed_uuid: uuid.UUID | None = None
    try:
        parsed_uuid = uuid.UUID(repository_id)
    except (ValueError, AttributeError):
        parsed_uuid = None

    if parsed_uuid:
        query_filter = or_(Repository.id == parsed_uuid, Repository.name == repository_id)
    else:
        query_filter = Repository.name == repository_id

    stmt = select(Repository).where(query_filter)
    result = await db.execute(stmt)
    repo = result.scalar_one_or_none()

    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository '{repository_id}' not found.",
        )

    file_tree = repo.file_tree or []
    items = [
        RepositoryFileItem(
            path=f.get("path", ""),
            type=f.get("type", "blob"),
            size=f.get("size"),
        )
        for f in file_tree
        if isinstance(f, dict)
    ]

    return RepositoryFilesResponse(
        repository_id=repo.id,
        repository_name=repo.name,
        owner=repo.owner,
        github_url=repo.github_url,
        default_branch=repo.default_branch,
        mode=repo.mode,
        file_count=len(items),
        files=items,
    )
