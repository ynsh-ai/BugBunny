"""Context and memory tools for multi-agent workflows.

Provides typed function tools for retrieving issue context, accessing accumulated
investigation memory, staging artifacts, and creating audit-only patch proposals.
"""

from __future__ import annotations

import json
import re
from typing import Any

from agents import function_tool

# In-memory staging context for active investigation sessions
_ACTIVE_CONTEXTS: dict[str, dict[str, Any]] = {}


def register_session_context(
    investigation_id: str,
    issue_data: dict[str, Any],
    memories: list[dict[str, Any]] | None = None,
    file_tree: list[dict[str, Any]] | None = None,
    is_remote_repo: bool = False,
) -> None:
    """Register active investigation context for agent tools to access."""
    _ACTIVE_CONTEXTS[str(investigation_id)] = {
        "issue": issue_data,
        "memories": memories or [],
        "staged_artifacts": [],
        "patch_proposals": [],
        "file_tree": file_tree or [],
        "is_remote_repo": is_remote_repo,
    }


def clear_session_context(investigation_id: str) -> None:
    """Clean up registered session context after workflow completion."""
    _ACTIVE_CONTEXTS.pop(str(investigation_id), None)


def is_active_session_remote() -> bool:
    """Check if any currently active investigation session targets a remote repository."""
    return any(ctx.get("is_remote_repo", False) for ctx in _ACTIVE_CONTEXTS.values())


def get_active_session_file_tree() -> list[dict[str, Any]]:
    """Get bounded file tree from active investigation session if available."""
    for ctx in _ACTIVE_CONTEXTS.values():
        tree = ctx.get("file_tree")
        if tree:
            return tree
    return []


def get_staged_artifacts(investigation_id: str) -> list[dict[str, Any]]:
    """Retrieve artifacts staged during agent execution."""
    ctx = _ACTIVE_CONTEXTS.get(str(investigation_id), {})
    return list(ctx.get("staged_artifacts", []))


def get_staged_patches(investigation_id: str) -> list[dict[str, Any]]:
    """Retrieve patch proposals generated during agent execution."""
    ctx = _ACTIVE_CONTEXTS.get(str(investigation_id), {})
    return list(ctx.get("patch_proposals", []))


@function_tool
def get_issue_context(issue_id: str) -> str:
    """Retrieve complete issue details and repository metadata.

    Args:
        issue_id: ID or Key of the issue (e.g., 'PP-101' or UUID).

    Returns:
        JSON string containing issue title, key, description, status, priority, and repository.
    """
    for ctx in _ACTIVE_CONTEXTS.values():
        issue = ctx.get("issue", {})
        if str(issue.get("id")) == str(issue_id) or str(issue.get("key")) == str(issue_id):
            return json.dumps(issue, indent=2)

    # Fallback response if session context not registered
    return json.dumps(
        {
            "id": issue_id,
            "status": "not_found_in_active_session",
            "message": f"Active session context for issue {issue_id} not mounted.",
        }
    )


@function_tool
def get_investigation_memory(investigation_id: str) -> str:
    """Retrieve chronological memories and summaries accumulated across prior agent stages.

    Args:
        investigation_id: ID of the current investigation.

    Returns:
        JSON string list of prior agent findings, plans, and hypotheses.
    """
    ctx = _ACTIVE_CONTEXTS.get(str(investigation_id))
    if not ctx:
        return json.dumps([])

    memories = ctx.get("memories", [])
    return json.dumps(memories, indent=2)


@function_tool
def save_agent_artifact(
    investigation_id: str,
    artifact_type: str,
    name: str,
    content: str,
) -> str:
    """Stage an agent artifact (evidence, plan, review notes, etc.) for database persistence.

    Args:
        investigation_id: Current investigation ID.
        artifact_type: Type enum (e.g., 'evidence', 'plan', 'patch', 'test_results', 'review_comments').
        name: Human-readable name for the artifact.
        content: Text or JSON serialized content of the artifact.

    Returns:
        Status message confirming the artifact was staged.
    """
    ctx = _ACTIVE_CONTEXTS.setdefault(
        str(investigation_id),
        {"staged_artifacts": [], "patch_proposals": [], "memories": [], "issue": {}},
    )

    artifact_record = {
        "investigation_id": investigation_id,
        "artifact_type": artifact_type,
        "name": name,
        "content": content,
    }
    ctx.setdefault("staged_artifacts", []).append(artifact_record)
    return f"Artifact '{name}' of type '{artifact_type}' successfully staged for persistence."


@function_tool
def create_patch_proposal(
    investigation_id: str,
    diff_content: str,
    description: str,
) -> str:
    """Propose a code patch as an immutable audit artifact.

    SECURITY GUARANTEE: This tool NEVER writes or applies changes to the repository files.
    The diff is strictly recorded as a proposed artifact awaiting human review.

    Args:
        investigation_id: Current investigation ID.
        diff_content: Standard unified diff formatted patch string.
        description: Rationale and technical summary of the proposed patch.

    Returns:
        Structured confirmation with parsed files touched and change metrics.
    """
    if not diff_content or not diff_content.strip():
        return "Error: Diff content cannot be empty."

    # Analyze unified diff files touched
    files_touched = re.findall(r"^\+\+\+ [b/]*(.*?)$", diff_content, re.MULTILINE)
    additions = len([line for line in diff_content.splitlines() if line.startswith("+") and not line.startswith("+++")])
    deletions = len([line for line in diff_content.splitlines() if line.startswith("-") and not line.startswith("---")])

    proposal = {
        "investigation_id": investigation_id,
        "diff_content": diff_content,
        "description": description,
        "files_touched": files_touched,
        "additions": additions,
        "deletions": deletions,
        "safety_audit": "Immutable artifact only - no disk alterations performed.",
    }

    ctx = _ACTIVE_CONTEXTS.setdefault(
        str(investigation_id),
        {"staged_artifacts": [], "patch_proposals": [], "memories": [], "issue": {}},
    )
    ctx.setdefault("patch_proposals", []).append(proposal)

    # Also automatically register as an artifact
    ctx.setdefault("staged_artifacts", []).append(
        {
            "investigation_id": investigation_id,
            "artifact_type": "patch",
            "name": f"Patch Proposal: {description[:40]}",
            "content": diff_content,
        }
    )

    return json.dumps(
        {
            "status": "proposal_staged",
            "files_touched": files_touched,
            "additions": additions,
            "deletions": deletions,
            "message": "Patch proposal recorded safely as an artifact. Awaiting Human Approval Gate.",
        },
        indent=2,
    )
