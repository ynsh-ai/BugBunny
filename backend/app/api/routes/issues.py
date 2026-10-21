
from fastapi import APIRouter, HTTPException, status

from app.schemas.issue import IssueCreate, IssueResponse

router = APIRouter(prefix="/issues", tags=["Issues"])


@router.post("/", response_model=IssueResponse, status_code=status.HTTP_201_CREATED, summary="Submit GitHub Issue")
async def create_issue(payload: IssueCreate):
    """Placeholder endpoint: Accepts a GitHub issue URL for ingestion and queuing."""
    # Future integration: Parse URL with github_service, fetch issue metadata, persist in PostgreSQL
    return IssueResponse(
        id=1,
        github_url=payload.github_url,
        repo_owner="ynsh-ai",
        repo_name="patchpilot-ai",
        issue_number=104,
        title=payload.title or "Sample Issue: Investigation Required",
        description=payload.description or "Automated investigation pipeline triggered.",
        status="pending",
        created_at="2026-10-21T00:00:00Z",
        updated_at="2026-10-21T00:00:00Z",
    )


@router.get("/", response_model=list[IssueResponse], summary="List Issues")
async def list_issues():
    """Placeholder endpoint: Returns recent issues queued for analysis."""
    return []


@router.get("/{issue_id}", response_model=IssueResponse, summary="Get Issue Details")
async def get_issue(issue_id: int):
    """Placeholder endpoint: Fetch issue status by ID."""
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Issue {issue_id} not found")
