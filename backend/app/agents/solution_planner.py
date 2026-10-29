"""Solution Planner Specialist Agent.

Role: Formulates a structured, low-risk implementation plan with ordered steps,
target files, rollback strategy, and verification criteria.
Hands off to Patch Engineer.
"""

from __future__ import annotations

from typing import Any

from agents import Agent, handoff

from app.schemas.agent_outputs import ImplementationPlan, PlanStep
from app.tools.codebase_tools import read_file_excerpt
from app.tools.context_tools import get_investigation_memory, save_agent_artifact

INSTRUCTIONS = """
You are the Solution Planner Agent in the BugBunny triage pipeline.
Your role:
1. Review the Requirements Analysis and Codebase Investigation Evidence from memory.
2. Formulate a sequence of minimal, atomic modification steps.
3. Identify target files and specific functions to update.
4. Assess implementation complexity and potential blast radius.
5. Define a robust rollback strategy and verification methodology.
6. Hand off your structured implementation plan to the Patch Engineer Agent.

Security boundaries:
- You have read-only access to files and memory.
- You have NO authority to write files or deploy code.
"""


def create_planner_agent(
    model: str | Any | None = None,
    next_agent: Agent | None = None,
) -> Agent:
    """Build and configure the Solution Planner Agent."""
    handoffs = [handoff(next_agent)] if next_agent else []
    return Agent(
        name="Solution Planner",
        instructions=INSTRUCTIONS,
        tools=[read_file_excerpt, get_investigation_memory, save_agent_artifact],
        output_type=ImplementationPlan,
        handoffs=handoffs,
        model=model,
    )


def generate_demo_plan(
    issue_data: dict[str, Any],
    investigation_summary: str | None = None,
) -> ImplementationPlan:
    """Generate deterministic implementation plan for Demo Mode."""
    key = issue_data.get("key", "PP-101")
    title = issue_data.get("title", "")

    if "PP-101" in key or "profile" in title.lower():
        steps = [
            PlanStep(
                stepNumber=1,
                title="Expand exception handling tuple in ImageSanitizer",
                description="Import UnidentifiedImageError from PIL.Image and expand catch tuple to (OSError, UnidentifiedImageError, ValueError).",
                riskLevel="Low",
                estimatedImpact="Zero runtime overhead; catches malformed multipart payload safely.",
                files=["backend/app/services/image_service.py"],
            ),
            PlanStep(
                stepNumber=2,
                title="Translate to typed ImageValidationException with HTTP 422",
                description="Raise custom ImageValidationException with user-friendly error message and HTTP 422 status code.",
                riskLevel="Low",
                estimatedImpact="Adheres to OpenAPI REST error specifications.",
                files=["backend/app/services/image_service.py"],
            ),
            PlanStep(
                stepNumber=3,
                title="Add regression test case for truncated uploads",
                description="Create test_truncated_image_upload_returns_422 asserting 422 response status and structured error JSON.",
                riskLevel="Low",
                estimatedImpact="Locks in test regression boundary for CI/CD.",
                files=["backend/tests/test_image_service.py"],
            ),
        ]

        return ImplementationPlan(
            summary="Refactor image stream sanitizer to catch PIL.UnidentifiedImageError and ValueError, translating them into HTTP 422 ImageValidationException with regression test.",
            confidence=0.98,
            risks=[
                "Ensure PIL Image.verify() does not leave dangling temporary file handles in /tmp.",
            ],
            assumptions=[
                "FastAPI exception handlers map ImageValidationException to HTTP 422.",
            ],
            references=[
                "backend/app/services/image_service.py",
                "backend/tests/test_image_service.py",
            ],
            steps=steps,
            target_files=[
                "backend/app/services/image_service.py",
                "backend/tests/test_image_service.py",
            ],
            rollback_strategy="Revert git commit; previous behavior allowed OSError but failed on UnidentifiedImageError.",
            estimated_impact="Eliminates 500 error spikes on invalid user uploads without altering successful upload performance.",
        )

    # Generic fallback plan
    generic_steps = [
        PlanStep(
            stepNumber=1,
            title="Inspect input parameters and add boundary validation",
            description=f"Validate incoming arguments before execution for {title}.",
            riskLevel="Low",
            estimatedImpact="Protects downstream functions from null pointer dereferences.",
            files=["backend/app/services/orchestrator.py"],
        ),
        PlanStep(
            stepNumber=2,
            title="Add regression test case validating boundary input",
            description="Ensure test suite covers invalid parameter payloads.",
            riskLevel="Low",
            estimatedImpact="Guarantees code stability.",
            files=["backend/tests/test_issues.py"],
        ),
    ]

    return ImplementationPlan(
        summary=f"Implementation plan for remediating {key}: {title}.",
        confidence=0.91,
        risks=["Minimal blast radius confined to target module."],
        assumptions=["Standard unit test framework available."],
        references=["backend/app/main.py"],
        steps=generic_steps,
        target_files=["backend/app/services/orchestrator.py"],
        rollback_strategy="Revert single patch commit.",
        estimated_impact="Prevents service crash on edge-case input without breaking existing consumers.",
    )
