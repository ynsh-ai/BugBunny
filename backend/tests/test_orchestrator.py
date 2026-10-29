"""Unit tests for Milestone 2 Multi-Agent Orchestrator Service."""

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.issue import Issue
from app.services.orchestrator import OrchestrationService


@pytest.mark.asyncio
async def test_orchestrator_six_stage_execution(test_session: AsyncSession):
    """Verify that OrchestrationService executes all six stages and persists runs, artifacts, and memory."""
    orchestrator = OrchestrationService(test_session)

    # Execute workflow on seeded issue PP-101
    inv = await orchestrator.run_investigation_workflow(
        issue_id="PP-101",
        branch_name="bugbunny/pp-101-test-fix",
    )

    assert inv is not None
    assert inv.status == "awaiting_approval"
    assert inv.completed_at is not None
    assert inv.branch_name == "bugbunny/pp-101-test-fix"
    assert inv.root_cause_summary is not None
    assert "UnidentifiedImageError" in inv.root_cause_summary

    # 1. Verify six AgentRun records
    runs = inv.agent_runs
    assert len(runs) == 6
    expected_stages = [
        "Requirements Analysis",
        "Bug Investigation",
        "Solution Planning",
        "Patch Engineering",
        "Testing",
        "Code Review",
    ]
    actual_stages = [r.stage for r in runs]
    assert actual_stages == expected_stages

    for run in runs:
        assert run.status == "complete"
        assert run.duration is not None
        assert run.summary is not None
        assert run.model is not None
        assert run.completed_at is not None

    # 2. Verify AgentArtifact records
    artifacts = inv.artifacts
    assert len(artifacts) >= 6
    artifact_types = {a.artifact_type for a in artifacts}
    assert {"plan", "evidence", "diff", "test_results", "review", "documentation"}.issubset(artifact_types)

    for art in artifacts:
        assert art.name is not None
        assert art.content is not None
        assert art.mode == "demo"

    # 3. Verify ConversationMemory records
    memories = inv.memories
    assert len(memories) >= 6
    for mem in memories:
        assert mem.role == "agent"
        assert mem.agent_name is not None
        assert len(mem.content) > 10

    # 4. Verify Issue status updated to "Review required"
    stmt = select(Issue).where(Issue.issue_key == "PP-101")
    res = await test_session.execute(stmt)
    issue = res.scalar_one()
    assert issue.status == "Review required"


@pytest.mark.asyncio
async def test_orchestrator_nonexistent_issue_raises(test_session: AsyncSession):
    """Verify that OrchestrationService safely raises ValueError when given an unknown issue."""
    orchestrator = OrchestrationService(test_session)
    with pytest.raises(ValueError) as exc_info:
        await orchestrator.run_investigation_workflow("NONEXISTENT-999")
    assert "not found" in str(exc_info.value).lower()
