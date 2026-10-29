"""Requirements Analyst Specialist Agent.

Role: Ingests raw GitHub issues, extracts structured problem statements,
reproduction steps, acceptance criteria, and identified components.
Hands off to Codebase Investigator.
"""

from __future__ import annotations

from typing import Any

from agents import Agent, handoff

from app.schemas.agent_outputs import RequirementsAnalysis
from app.tools.context_tools import get_investigation_memory, get_issue_context, save_agent_artifact

INSTRUCTIONS = """
You are the Requirements Analyst Agent in the BugBunny autonomous triage pipeline.
Your role:
1. Ingest the GitHub issue description and metadata.
2. Deconstruct the reported behavior into a clear problem statement.
3. Identify reproducible steps and conditions that trigger the bug.
4. Define explicit, testable criteria of satisfaction for downstream agents.
5. Identify candidate affected components or subsystems.
6. Hand off your structured output to the Codebase Investigator Agent.

Security boundaries:
- You have read-only access to issue context and memory.
- You have NO authority to push code, modify files, or alter GitHub issues.
"""


def create_requirements_agent(
    model: str | Any | None = None,
    next_agent: Agent | None = None,
) -> Agent:
    """Build and configure the Requirements Analyst Agent."""
    handoffs = [handoff(next_agent)] if next_agent else []
    return Agent(
        name="Requirements Analyst",
        instructions=INSTRUCTIONS,
        tools=[get_issue_context, get_investigation_memory, save_agent_artifact],
        output_type=RequirementsAnalysis,
        handoffs=handoffs,
        model=model,
    )


def generate_demo_requirements(issue_data: dict[str, Any]) -> RequirementsAnalysis:
    """Generate deterministic, high-quality requirements analysis for Demo Mode."""
    key = issue_data.get("key", "PP-101")
    title = issue_data.get("title", "Reported Issue")
    description = issue_data.get("description", "")

    # Tailor based on issue key / title
    if "PP-101" in key or "profile" in title.lower():
        return RequirementsAnalysis(
            summary="User avatar upload endpoint throws HTTP 500 when receiving multi-part PNGs due to unhandled PIL EOF/truncation exceptions in image sanitizer.",
            confidence=0.96,
            risks=[
                "Image decompression bombs or corrupted chunks could bypass validation if catch block is too broad.",
                "Client-side retry storms may degrade authentication service latency.",
            ],
            assumptions=[
                "FastAPI multipart form uploads store temporary files in /tmp before Pillow parsing.",
                "Max allowed file size is 5MB as per API gateway spec.",
            ],
            references=[
                "backend/app/api/routes/users.py:L142-L175",
                "backend/app/services/image_service.py:L48-L82",
            ],
            issue_key=key,
            problem_statement="Profile avatar upload endpoint crashes with unhandled PIL.UnidentifiedImageError on truncated multi-part file uploads.",
            symptom_description="HTTP 500 Internal Server Error returned to clients with unhandled PIL.UnidentifiedImageError stack trace.",
            acceptance_criteria=[
                "Endpoint returns HTTP 422 with descriptive error message when given corrupted or truncated images.",
                "Valid PNG and JPEG files up to 5MB continue to be resized and stored properly.",
                "Zero 500 Internal Server Errors in backend server logs on invalid user inputs.",
            ],
            reproduction_steps=[
                "Authenticate as standard user with valid JWT.",
                "Send POST /api/v1/users/avatar with multipart/form-data containing an intentionally truncated PNG header.",
                "Observe HTTP 500 error instead of graceful 422 validation failure.",
            ],
            affected_components=["app.api.routes.users", "app.services.image_service", "storage.s3_client"],
            severity_assessment="high",
        )

    if "PP-102" in key or "memory" in title.lower() or "leak" in title.lower():
        return RequirementsAnalysis(
            summary="Unclosed WebSocket connections during dashboard real-time log streaming cause gradual file descriptor exhaustion and worker memory growth.",
            confidence=0.94,
            risks=[
                "Abrupt disconnection cleanup could trigger race conditions during active message broadcasting.",
            ],
            assumptions=[
                "Uvicorn workers are managed with auto-restart on memory thresholds.",
            ],
            references=["backend/app/api/routes/logs.py:L89-L130"],
            issue_key=key,
            problem_statement="WebSocket connection listener fails to deregister client sockets upon client-side abrupt TCP disconnection.",
            symptom_description="Linear increase in RSS memory and open socket file descriptors over sustained streaming sessions.",
            acceptance_criteria=[
                "WebSocket disconnect hook explicitly cleans up connection manager sets.",
                "Connection manager heartbeat terminates stale sessions after 30 seconds of silence.",
            ],
            reproduction_steps=[
                "Open 50 concurrent WebSocket connections to /ws/logs.",
                "Terminate client TCP sockets abruptly without sending CloseFrame.",
                "Inspect open file descriptors via lsof and observe unreleased socket handles.",
            ],
            affected_components=["app.api.routes.logs", "app.services.socket_manager"],
            severity_assessment="high",
        )

    # Generic deterministic fallback
    return RequirementsAnalysis(
        summary=f"Analysis of issue '{key}: {title}'. Requirements isolated for deterministic triage.",
        confidence=0.90,
        risks=["Downstream side-effects in dependent API consumers if contract changes."],
        assumptions=["Standard production runtime environment and relational database consistency."],
        references=["backend/app/api/router.py", "backend/app/main.py"],
        issue_key=key,
        problem_statement=description or f"Defect reported in {title}.",
        symptom_description=f"Observed anomalous behavior in {title}.",
        acceptance_criteria=[
            "Root cause isolated and patched without breaking API contract.",
            "Regression test added covering the fault condition.",
            "All unit and integration tests passing cleanly.",
        ],
        reproduction_steps=[
            f"Trigger the workflow described in {key}.",
            "Observe unexpected error or failure state.",
        ],
        affected_components=["backend.app.api", "backend.app.services"],
        severity_assessment="medium",
    )
