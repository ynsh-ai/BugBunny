"""Patch Engineer Specialist Agent.

Role: Crafts clean, minimal, production-grade unified diff patches addressing
the root cause according to the implementation plan.
Hands off to Test Runner.
"""

from __future__ import annotations

from typing import Any

from agents import Agent, handoff

from app.schemas.agent_outputs import PatchProposal
from app.tools.codebase_tools import read_file_excerpt
from app.tools.context_tools import (
    create_patch_proposal,
    get_investigation_memory,
    save_agent_artifact,
)

INSTRUCTIONS = """
You are the Patch Engineer Agent in the BugBunny triage pipeline.
Your role:
1. Review the Implementation Plan and target files.
2. Formulate minimal, surgical code modifications.
3. Call create_patch_proposal to register the unified diff artifact.
4. Verify diff formatting (--- a/..., +++ b/..., @@ ... @@).
5. Hand off your structured patch proposal to the Test Runner Agent.

SECURITY GUARANTEE & RESTRICTIONS:
- You have ABSOLUTELY NO AUTHORITY to write or apply patches to disk or Git.
- Never execute shell write commands or mutate workspace files.
- All code changes are proposed strictly as immutable audit artifacts.
"""


def create_patch_agent(
    model: str | Any | None = None,
    next_agent: Agent | None = None,
) -> Agent:
    """Build and configure the Patch Engineer Agent."""
    handoffs = [handoff(next_agent)] if next_agent else []
    return Agent(
        name="Patch Engineer",
        instructions=INSTRUCTIONS,
        tools=[
            read_file_excerpt,
            create_patch_proposal,
            get_investigation_memory,
            save_agent_artifact,
        ],
        output_type=PatchProposal,
        handoffs=handoffs,
        model=model,
    )


def generate_demo_patch(
    issue_data: dict[str, Any],
    plan_summary: str | None = None,
) -> PatchProposal:
    """Generate deterministic, high-quality unified diff patch for Demo Mode."""
    key = issue_data.get("key", "PP-101")
    title = issue_data.get("title", "")

    if "PP-101" in key or "profile" in title.lower():
        diff = """--- a/backend/app/services/image_service.py
+++ b/backend/app/services/image_service.py
@@ -51,8 +51,13 @@ class ImageSanitizer:
         try:
             stream.seek(0)
             image = Image.open(stream)
             image.verify()
-        except OSError as err:
-            raise ImageValidationException(f"Invalid image format: {err}")
+        except (OSError, UnidentifiedImageError, ValueError) as err:
+            logger.warning("Rejected invalid image stream", extra={"error": str(err)})
+            raise ImageValidationException(
+                detail="Uploaded file is corrupted or not a recognized image format.",
+                status_code=422,
+            ) from err
         finally:
             stream.seek(0)
"""
        return PatchProposal(
            summary="Catch UnidentifiedImageError and ValueError alongside OSError during stream verification, converting them to HTTP 422 ImageValidationException.",
            confidence=0.98,
            risks=[
                "Third-party image formats might return specialized exceptions if Pillow plugins are registered.",
            ],
            assumptions=[
                "ImageSanitizer is the single entry point for avatar file buffer validation.",
            ],
            references=[
                "backend/app/services/image_service.py:L51-L62",
            ],
            unified_diff=diff,
            modified_files=["backend/app/services/image_service.py"],
            change_rationale="Catches truncated or unidentifiable image headers without crashing ASGI worker with HTTP 500.",
            is_breaking_change=False,
            backward_compatible=True,
        )

    # Generic fallback patch
    generic_diff = """--- a/backend/app/services/orchestrator.py
+++ b/backend/app/services/orchestrator.py
@@ -18,6 +18,8 @@ def handle_request(payload: dict) -> dict:
+    if not payload:
+        raise ValueError("Payload cannot be empty")
     return process_payload(payload)
"""
    return PatchProposal(
        summary=f"Minimal patch adding input boundary checks for {key}.",
        confidence=0.92,
        risks=["Ensure callers supply valid input parameters."],
        assumptions=["Standard Python exception handling."],
        references=["backend/app/services/orchestrator.py"],
        unified_diff=generic_diff,
        modified_files=["backend/app/services/orchestrator.py"],
        change_rationale=f"Prevents unhandled exceptions for {title}.",
        is_breaking_change=False,
        backward_compatible=True,
    )
