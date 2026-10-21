from fastapi import APIRouter, HTTPException, status

from app.schemas.agent import AgentRunResponse, AgentRunTrigger

router = APIRouter(prefix="/runs", tags=["Agent Runs"])


@router.post("/", response_model=AgentRunResponse, status_code=status.HTTP_202_ACCEPTED, summary="Trigger Agent Pipeline")
async def trigger_agent_run(payload: AgentRunTrigger):
    """Placeholder endpoint: Initiates an autonomous multi-agent pipeline session."""
    # Future integration: Spawns OpenAI Agents SDK orchestrator loop in background task
    return AgentRunResponse(
        id=1,
        issue_id=payload.issue_id,
        status="initialized",
        current_stage="requirements_analysis",
        requirements_spec=None,
        implementation_plan=None,
        unified_patch=None,
        test_run_results=None,
        review_feedback=None,
        started_at="2026-10-21T00:00:00Z",
        completed_at=None,
    )


@router.get("/{run_id}", response_model=AgentRunResponse, summary="Get Agent Run Status")
async def get_agent_run(run_id: int):
    """Placeholder endpoint: Retrieves live progress and artifacts for a pipeline run."""
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Run {run_id} not found")
