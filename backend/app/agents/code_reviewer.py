"""Code Reviewer & Documentation Specialist Agent.

Role: Performs holistic review of the proposed patch, evaluates security,
maintainability, and performance impact, generates documentation updates,
and routes the investigation to the Human Approval Gate.
"""

from __future__ import annotations

from typing import Any

from agents import Agent

from app.schemas.agent_outputs import CodeReviewReport, DocumentationUpdate, ReviewCheckItem
from app.tools.codebase_tools import read_file_excerpt
from app.tools.context_tools import get_investigation_memory, save_agent_artifact

INSTRUCTIONS = """
You are the Code Reviewer & Documentation Agent in the BugBunny triage pipeline.
Your role:
1. Conduct a rigorous, production-grade audit of the proposed patch and test results.
2. Evaluate code quality, security posture, backwards compatibility, and performance.
3. Formulate recommendations for release notes, documentation, and migration guides.
4. Issue a structured review verdict ('approved', 'changes_requested', 'needs_discussion').
5. Route the completed investigation artifact package to the Human Approval Gate.

CRITICAL SECURITY CONSTRAINT:
- You have ABSOLUTELY NO AUTHORITY to merge code, push branches, or apply patches.
- The pipeline stops here for human inspection and authorization.
"""


def create_code_reviewer_agent(
    model: str | Any | None = None,
) -> Agent:
    """Build and configure the Code Reviewer & Documentation Agent."""
    return Agent(
        name="Code Reviewer & Documentation",
        instructions=INSTRUCTIONS,
        tools=[read_file_excerpt, get_investigation_memory, save_agent_artifact],
        output_type=CodeReviewReport,
        handoffs=[],
        model=model,
    )


def generate_demo_review(
    issue_data: dict[str, Any],
    patch_summary: str | None = None,
) -> tuple[CodeReviewReport, DocumentationUpdate]:
    """Generate deterministic code review and documentation update for Demo Mode."""
    key = issue_data.get("key", "PP-101")
    branch = f"bugbunny/{key.lower()}-fix"

    if "PP-101" in key:
        checks = [
            ReviewCheckItem(category="Security", description="Safe path boundaries and file input constraints verified", status="pass"),
            ReviewCheckItem(category="Performance", description="Zero latency impact; stream buffers processed in-memory", status="pass"),
            ReviewCheckItem(category="Correctness", description="UnidentifiedImageError and ValueError mapped to HTTP 422", status="pass"),
            ReviewCheckItem(category="Maintainability", description="Type annotations and structured logging conform to repository style", status="pass"),
        ]

        review = CodeReviewReport(
            summary="Patch adheres to coding standards, introduces zero security regressions, and gracefully translates unhandled PIL exceptions into HTTP 422 with comprehensive test coverage.",
            confidence=0.98,
            risks=[
                "Confirm client web frontend displays friendly toast notification when receiving HTTP 422.",
            ],
            assumptions=[
                "FastAPI global exception handler formats 422 responses as application/json.",
            ],
            references=[
                "backend/app/services/image_service.py",
                "backend/tests/test_image_service.py",
            ],
            overall_score=94,
            recommendation="Approve",
            checks=checks,
            security_audit="Zero credential exposure. File size ceiling and mime verification prevent image decompression exploits.",
            performance_audit="Stream parsing verified under 10ms with zero memory leaks.",
        )

        doc_update = DocumentationUpdate(
            summary="Updated API error response documentation for Avatar Upload endpoint to document HTTP 422 validation response.",
            confidence=0.99,
            risks=[],
            assumptions=["OpenAPI schema regenerates automatically."],
            references=["docs/api.md", "backend/app/api/routes/users.py"],
            pr_title=f"fix(users): return HTTP 422 on corrupted or truncated avatar uploads ({key})",
            pr_body=f"""### Summary
Resolves {key} where uploading truncated or corrupted image buffers resulted in an unhandled 500 error.

### Root Cause
`ImageSanitizer.verify_stream` caught only `OSError`, leaving `PIL.UnidentifiedImageError` and `ValueError` unhandled.

### Remediations
- Catch `(OSError, UnidentifiedImageError, ValueError)` in `ImageSanitizer.verify_stream`.
- Translate to `ImageValidationException` with HTTP 422.
- Added regression test `test_truncated_image_upload_returns_422`.

### Human Gate
Staged as audit artifact awaiting human approval for branch export.""",
            branch_name=branch,
            target_branch="main",
            changelog_entry="Fixed unhandled PIL.UnidentifiedImageError on truncated avatar uploads (HTTP 500 -> 422).",
            release_notes="Hardened user avatar upload validation to reject truncated or corrupted image payloads with HTTP 422.",
            affected_components=["backend/app/services/image_service.py", "docs/api.md"],
        )
        return review, doc_update

    # Generic review
    checks_gen = [
        ReviewCheckItem(category="Security", description="Safe workspace boundaries enforced", status="pass"),
        ReviewCheckItem(category="Correctness", description="Exception boundary prevents unhandled errors", status="pass"),
    ]
    review = CodeReviewReport(
        summary=f"Automated code review completed for {key}. Changes are clean and scoped.",
        confidence=0.94,
        risks=[],
        assumptions=["Standard code style."],
        references=["backend/app/services/orchestrator.py"],
        overall_score=90,
        recommendation="Approve",
        checks=checks_gen,
        security_audit="No security vulnerabilities detected.",
        performance_audit="No performance degradation observed.",
    )
    doc_update = DocumentationUpdate(
        summary=f"Documentation update for {key}.",
        confidence=0.95,
        risks=[],
        assumptions=[],
        references=["docs/api.md"],
        pr_title=f"fix: address issue {key}",
        pr_body=f"Automated resolution patch for {key}.",
        branch_name=branch,
        target_branch="main",
        changelog_entry=f"Resolved issue {key}.",
        release_notes=f"Resolved issue {key}.",
        affected_components=["backend/app/services/orchestrator.py"],
    )
    return review, doc_update
