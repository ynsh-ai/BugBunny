"""BugBunny Tools Package.

Provides secure, sandboxed tools for the multi-agent orchestration pipeline.
"""

from agents.tool import FunctionTool


def _tool_call(self, *args, **kwargs):
    return getattr(self, "__wrapped__", lambda *a, **k: None)(*args, **kwargs)


FunctionTool.__call__ = _tool_call

from app.tools.codebase_tools import (
    read_file_excerpt,
    run_test_command,
    search_codebase,
    validate_test_command,
)
from app.tools.context_tools import (
    clear_session_context,
    create_patch_proposal,
    get_investigation_memory,
    get_issue_context,
    get_staged_artifacts,
    get_staged_patches,
    register_session_context,
    save_agent_artifact,
)
from app.tools.safe_paths import (
    SecurityError,
    get_default_workspace_root,
    is_safe_path,
    validate_safe_path,
)

__all__ = [
    "SecurityError",
    "clear_session_context",
    "create_patch_proposal",
    "get_default_workspace_root",
    "get_investigation_memory",
    "get_issue_context",
    "get_staged_artifacts",
    "get_staged_patches",
    "is_safe_path",
    "read_file_excerpt",
    "register_session_context",
    "run_test_command",
    "save_agent_artifact",
    "search_codebase",
    "validate_safe_path",
    "validate_test_command",
]
