"""Codebase Investigator Specialist Agent.

Role: Searches repository files, reads bounded excerpts, traces code symbols,
isolates root cause, and collects structured evidence.
Hands off to Solution Planner.
"""

from __future__ import annotations

from typing import Any

from agents import Agent, handoff

from app.schemas.agent_outputs import EvidenceDetail, InvestigationEvidence
from app.tools.codebase_tools import read_file_excerpt, search_codebase
from app.tools.context_tools import get_investigation_memory, save_agent_artifact

INSTRUCTIONS = """
You are the Codebase Investigator Agent in the BugBunny triage pipeline.
Your role:
1. Search the codebase for symbols, function definitions, and error log fragments.
2. Read bounded excerpts of candidate source files to inspect logic.
3. Isolate the exact root cause of the defect.
4. Document inspected files, relevant symbols, and verified evidence.
5. Formulate a validated hypothesis for remediation.
6. Hand off your structured investigation evidence to the Solution Planner Agent.

Security boundaries:
- Use search_codebase and read_file_excerpt strictly within the repository boundaries.
- Never inspect .env files or credentials.
- Read only bounded excerpts needed to verify the bug.
"""


def create_investigator_agent(
    model: str | Any | None = None,
    next_agent: Agent | None = None,
) -> Agent:
    """Build and configure the Codebase Investigator Agent."""
    handoffs = [handoff(next_agent)] if next_agent else []
    return Agent(
        name="Codebase Investigator",
        instructions=INSTRUCTIONS,
        tools=[search_codebase, read_file_excerpt, get_investigation_memory, save_agent_artifact],
        output_type=InvestigationEvidence,
        handoffs=handoffs,
        model=model,
    )


def generate_demo_investigation(
    issue_data: dict[str, Any],
    requirements_summary: str | None = None,
) -> InvestigationEvidence:
    """Generate deterministic, high-fidelity investigation evidence for Demo Mode."""
    key = issue_data.get("key", "PP-101")
    title = issue_data.get("title", "")

    if "PP-101" in key or "profile" in title.lower():
        ev1 = EvidenceDetail(
            id="ev-1",
            type="stack_trace",
            title="PIL.UnidentifiedImageError: cannot identify image file",
            location="backend/app/services/image_service.py:54",
            timestamp="2026-10-29T14:12:00Z",
            description="Unhandled exception raised by Pillow Image.open() when parsing truncated PNG header stream.",
            snippet="""File "backend/app/services/image_service.py", line 54, in verify_stream
    image = Image.open(stream)
    image.verify()
PIL.UnidentifiedImageError: cannot identify image file <_io.BytesIO object at 0x10a2f8b0>""",
        )
        ev2 = EvidenceDetail(
            id="ev-2",
            type="code_reference",
            title="ImageSanitizer.verify_stream narrow catch block",
            location="backend/app/services/image_service.py:51-58",
            timestamp="2026-10-29T14:15:00Z",
            description="Existing try/except only traps OSError, allowing UnidentifiedImageError and ValueError to escape unhandled.",
            snippet="""try:
    image = Image.open(stream)
    image.verify()
except OSError as err:
    raise ImageValidationException(f"Invalid image: {err}")""",
        )

        return InvestigationEvidence(
            summary="Located root cause in ImageSanitizer.verify_stream(): Missing exception handling for PIL.UnidentifiedImageError and truncated chunk streams.",
            confidence=0.97,
            risks=[
                "Third-party image libraries could raise platform-dependent decoding exceptions.",
            ],
            assumptions=[
                "Pillow library 10.x is utilized across all application environments.",
            ],
            references=[
                "backend/app/services/image_service.py:L54",
                "backend/app/api/routes/users.py:L158",
            ],
            root_cause="backend/app/services/image_service.py line 54 invokes PIL.Image.open(io_buffer).verify() inside a try-block that catches only OSError, while Pillow raises PIL.UnidentifiedImageError and ValueError when reading truncated multi-part chunks.",
            evidence_items=[ev1, ev2],
            suspect_files=[
                "backend/app/services/image_service.py",
                "backend/app/api/routes/users.py",
            ],
            call_hierarchy=[
                "app.api.routes.users.update_avatar",
                "app.services.image_service.ImageSanitizer.verify_stream",
                "PIL.Image.open",
                "PIL.Image.verify",
            ],
            reproduction_command="pytest backend/tests/test_image_service.py -k test_truncated_image",
        )

    # Generic fallback evidence
    ev_gen = EvidenceDetail(
        id="ev-gen-1",
        type="code_reference",
        title=f"Code reference for {key}",
        location="backend/app/main.py:42",
        timestamp="2026-10-29T14:00:00Z",
        description=f"Identified code path handling {title}.",
        snippet="if not payload:\n    raise ValueError('Missing required payload')",
    )
    return InvestigationEvidence(
        summary=f"Inspected source files for {key}. Located target module and traced invocation flow.",
        confidence=0.92,
        risks=["Ensure surrounding error handling does not mask database transaction aborts."],
        assumptions=["Default configuration and service dependencies are active."],
        references=["backend/app/main.py", "backend/app/api/router.py"],
        root_cause=f"Unhandled edge case in service layer handling {title}.",
        evidence_items=[ev_gen],
        suspect_files=["backend/app/services/orchestrator.py", "backend/app/api/router.py"],
        call_hierarchy=["app.api.router.dispatch", "app.services.handler.process"],
        reproduction_command="pytest backend/tests",
    )
