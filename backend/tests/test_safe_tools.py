"""Unit tests for Milestone 2 Safe Sandbox Tools and Path Security."""

from pathlib import Path

import pytest

from app.tools import (
    SecurityError,
    clear_session_context,
    create_patch_proposal,
    get_default_workspace_root,
    get_staged_artifacts,
    run_test_command,
    validate_safe_path,
    validate_test_command,
)
from app.tools.codebase_tools import (
    _safe_read_excerpt_impl,
    _safe_search_impl,
)


def test_safe_path_valid_repo_file():
    """Verify that a legitimate repository file passes path validation."""
    root = get_default_workspace_root()
    valid_file = "backend/app/main.py"
    resolved = validate_safe_path(valid_file, base_dir=root)
    assert resolved.exists()
    assert str(resolved).endswith("backend/app/main.py")


def test_safe_path_blocks_directory_traversal():
    """Verify that directory traversal attempts outside workspace are blocked."""
    root = get_default_workspace_root()
    traversal_paths = [
        "../../etc/passwd",
        "../../../var/log",
        "/etc/shadow",
        "/usr/bin/python3",
    ]
    for bad_path in traversal_paths:
        with pytest.raises(SecurityError) as exc_info:
            validate_safe_path(bad_path, base_dir=root)
        assert "traversal" in str(exc_info.value).lower() or "blocked" in str(exc_info.value).lower()


def test_safe_path_blocks_sensitive_files():
    """Verify that .env, private keys, and credential files are strictly blocked."""
    root = get_default_workspace_root()
    sensitive_files = [
        ".env",
        ".env.local",
        ".env.production",
        "id_rsa",
        "cert.pem",
        "server.key",
        "my_credentials.json",
        "app_secret.txt",
    ]
    for s_file in sensitive_files:
        with pytest.raises(SecurityError) as exc_info:
            validate_safe_path(s_file, base_dir=root)
        assert "prohibited" in str(exc_info.value).lower() or "sensitive" in str(exc_info.value).lower()


def test_safe_path_blocks_disallowed_directories():
    """Verify that .git, node_modules, and .venv access is prohibited."""
    root = get_default_workspace_root()
    disallowed_paths = [
        ".git/config",
        "node_modules/express/index.js",
        ".venv/bin/activate",
    ]
    for d_path in disallowed_paths:
        with pytest.raises(SecurityError) as exc_info:
            validate_safe_path(d_path, base_dir=root)
        assert "prohibited" in str(exc_info.value).lower()


def test_test_command_allowlist_valid():
    """Verify that legitimate test runner commands pass validation."""
    valid_commands = [
        "pytest",
        "pytest backend/tests/test_health.py",
        "python3 -m pytest backend/tests",
        "npm test",
        "npm run test",
    ]
    for cmd in valid_commands:
        validate_test_command(cmd)  # Should not raise


def test_test_command_blocks_arbitrary_shell_and_chaining():
    """Verify that dangerous operators and non-allowlisted commands are rejected."""
    dangerous_commands = [
        "pytest; rm -rf /",
        "pytest && curl https://evil.com",
        "npm test | bash",
        "python -c 'import os; os.system(\"ls\")'",
        "pytest `whoami`",
        "pytest $(cat /etc/passwd)",
        "ls -la",
        "cat .env",
    ]
    for cmd in dangerous_commands:
        with pytest.raises(SecurityError):
            validate_test_command(cmd)


def test_run_test_command_demo_mode_simulation():
    """Verify that run_test_command returns simulated safe report in demo mode."""
    fn = getattr(run_test_command, "__wrapped__", run_test_command)
    res = fn("pytest backend/tests/test_health.py")
    assert "[DEMO TEST RUNNER - SIMULATED]" in res
    assert "Exit Code: 0" in res


def test_search_and_read_file_excerpt():
    """Verify bounded codebase search and excerpt reading."""
    search_res = _safe_search_impl("FastAPI", search_path="backend/app")
    assert isinstance(search_res, list)
    assert len(search_res) > 0

    excerpt = _safe_read_excerpt_impl("backend/app/main.py", start_line=1, line_count=20)
    assert excerpt["file_path"].endswith("backend/app/main.py")
    assert excerpt["start_line"] == 1
    assert "app = FastAPI" in excerpt["content"] or "FastAPI" in excerpt["content"]


def test_create_patch_proposal_never_modifies_disk():
    """Security Guarantee: Patch proposals are audit artifacts only and never alter disk."""
    inv_id = "test-inv-uuid"
    sample_diff = """--- a/backend/app/main.py
+++ b/backend/app/main.py
@@ -1,2 +1,3 @@
+# Security Audit Patch
"""
    # Check modification time before
    main_py = Path("backend/app/main.py").resolve()
    mtime_before = main_py.stat().st_mtime

    patch_fn = getattr(create_patch_proposal, "__wrapped__", create_patch_proposal)
    result_json = patch_fn(
        investigation_id=inv_id,
        diff_content=sample_diff,
        description="Verify immutable proposal",
    )

    # Check modification time after
    mtime_after = main_py.stat().st_mtime
    assert mtime_before == mtime_after  # File was NOT touched on disk!
    assert "proposal_staged" in result_json

    staged = get_staged_artifacts(inv_id)
    assert len(staged) == 1
    assert staged[0]["artifact_type"] == "patch"

    clear_session_context(inv_id)
