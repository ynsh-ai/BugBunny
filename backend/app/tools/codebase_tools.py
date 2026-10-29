"""Codebase inspection and safe test execution tools for multi-agent workflows.

All tools enforce strict workspace sandboxing, path validation, output size limits,
and allowlists to prevent arbitrary code execution and data exfiltration.
"""

from __future__ import annotations

import os
import shlex
import subprocess
from typing import Any

from agents import function_tool

from app.core.config import settings
from app.tools.safe_paths import SecurityError, get_default_workspace_root, validate_safe_path

# Maximum output constraints
MAX_SEARCH_RESULTS = 50
MAX_EXCERPT_LINES = 200
MAX_EXCERPT_BYTES = 64 * 1024  # 64 KB limit

# Safe command prefixes for the test runner allowlist
ALLOWED_TEST_COMMAND_PREFIXES = (
    "pytest",
    "python -m pytest",
    "python3 -m pytest",
    "npm test",
    "npm run test",
    "npx jest",
    "npx vitest",
    "yarn test",
    "pnpm test",
)

# Shell operators that must never appear in test commands
DANGEROUS_SHELL_TOKENS = (
    ";",
    "&&",
    "||",
    "|",
    "`",
    "$",
    ">",
    "<",
    "&",
    "\n",
    "\r",
)


def _safe_search_impl(
    query: str,
    search_path: str = ".",
    max_results: int = 20,
) -> list[dict[str, Any]]:
    """Internal implementation for codebase search with security validation."""
    if not query or not query.strip():
        return []

    target_dir = validate_safe_path(search_path)
    if not target_dir.is_dir():
        # If it's a file, search only within this file
        if target_dir.is_file():
            results = []
            try:
                content = target_dir.read_text(encoding="utf-8", errors="replace")
                for idx, line in enumerate(content.splitlines(), start=1):
                    if query.lower() in line.lower():
                        results.append(
                            {
                                "file": str(target_dir.relative_to(get_default_workspace_root())),
                                "line_number": idx,
                                "snippet": line.strip()[:200],
                            }
                        )
                        if len(results) >= max_results:
                            break
            except (OSError, UnicodeDecodeError):
                pass
            return results
        return []

    results: list[dict[str, Any]] = []
    limit = min(max(1, max_results), MAX_SEARCH_RESULTS)
    workspace_root = get_default_workspace_root()

    # Walk directory while skipping protected folders
    for root, dirs, files in os.walk(target_dir):
        # Exclude directories in-place
        dirs[:] = [
            d
            for d in dirs
            if not d.startswith(".")
            and d not in {"node_modules", "venv", ".venv", "__pycache__", "dist", "build"}
        ]

        for file in files:
            if file.startswith(".") or file.endswith((".pyc", ".png", ".jpg", ".svg", ".lock")):
                continue

            file_path = os.path.join(root, file)
            try:
                valid_path = validate_safe_path(file_path)
            except SecurityError:
                continue

            try:
                # Skip large files > 1 MB
                if os.path.getsize(valid_path) > 1024 * 1024:
                    continue

                text = valid_path.read_text(encoding="utf-8", errors="replace")
                for line_no, line in enumerate(text.splitlines(), start=1):
                    if query.lower() in line.lower():
                        rel_path = str(valid_path.relative_to(workspace_root))
                        results.append(
                            {
                                "file": rel_path,
                                "line_number": line_no,
                                "snippet": line.strip()[:200],
                            }
                        )
                        if len(results) >= limit:
                            return results
            except (OSError, UnicodeDecodeError):
                continue

    return results


@function_tool
def search_codebase(
    query: str,
    search_path: str = ".",
    max_results: int = 20,
) -> str:
    """Search for a text pattern or symbol across files in the allowed workspace.

    Args:
        query: Substring or keyword to search for.
        search_path: Directory or file path relative to workspace root.
        max_results: Maximum number of matches to return (max 50).

    Returns:
        Formatted string containing file paths, line numbers, and line snippets.
    """
    try:
        matches = _safe_search_impl(query, search_path, max_results)
        if not matches:
            return f"No matches found for query: '{query}' in path '{search_path}'."

        lines = [f"Found {len(matches)} match(es) for '{query}':"]
        for match in matches:
            lines.append(f"{match['file']}:{match['line_number']}: {match['snippet']}")
        return "\n".join(lines)
    except SecurityError as sec_err:
        return f"Security Error: {sec_err}"
    except Exception as exc:  # noqa: BLE001
        return f"Search Error: {exc}"


def _safe_read_excerpt_impl(
    file_path: str,
    start_line: int = 1,
    line_count: int = 50,
) -> dict[str, Any]:
    """Read bounded line range from a safe file."""
    validated = validate_safe_path(file_path)

    if not validated.exists():
        raise FileNotFoundError(f"File not found: '{file_path}'")

    if not validated.is_file():
        raise ValueError(f"Path is not a regular file: '{file_path}'")

    start = max(1, start_line)
    count = min(max(1, line_count), MAX_EXCERPT_LINES)

    text = validated.read_text(encoding="utf-8", errors="replace")
    all_lines = text.splitlines()
    total_lines = len(all_lines)

    selected_lines = all_lines[start - 1 : start - 1 + count]
    content = "\n".join(selected_lines)

    # Enforce byte limit
    if len(content.encode("utf-8")) > MAX_EXCERPT_BYTES:
        content = content[:MAX_EXCERPT_BYTES] + "\n...[truncated: excerpt exceeded maximum byte limit]"

    workspace_root = get_default_workspace_root()
    rel_path = str(validated.relative_to(workspace_root))

    return {
        "file_path": rel_path,
        "start_line": start,
        "end_line": min(start + len(selected_lines) - 1, total_lines),
        "total_lines": total_lines,
        "content": content,
    }


@function_tool
def read_file_excerpt(
    file_path: str,
    start_line: int = 1,
    line_count: int = 50,
) -> str:
    """Read a specific line range from a safe codebase file.

    Args:
        file_path: Relative path to the file inside workspace.
        start_line: 1-indexed starting line number.
        line_count: Number of lines to read (capped at 200).

    Returns:
        Content of the requested line excerpt with line numbers and file header.
    """
    try:
        data = _safe_read_excerpt_impl(file_path, start_line, line_count)
        output = [
            f"--- {data['file_path']} (lines {data['start_line']}-{data['end_line']} of {data['total_lines']}) ---"
        ]
        curr_line = data["start_line"]
        for line in data["content"].splitlines():
            output.append(f"{curr_line:4d} | {line}")
            curr_line += 1
        return "\n".join(output)
    except SecurityError as sec_err:
        return f"Security Error: {sec_err}"
    except Exception as exc:  # noqa: BLE001
        return f"Read Error: {exc}"


def validate_test_command(command: str) -> None:
    """Validate that a test command strictly complies with allowlists."""
    if not command or not command.strip():
        raise SecurityError("Test command cannot be empty.")

    cleaned = command.strip()

    # Block dangerous shell operators
    for token in DANGEROUS_SHELL_TOKENS:
        if token in cleaned:
            raise SecurityError(
                f"Test command rejected: Contains forbidden shell operator '{token}'."
            )

    # Must start with an allowed prefix
    if not any(cleaned.startswith(prefix) for prefix in ALLOWED_TEST_COMMAND_PREFIXES):
        allowed_list = ", ".join(f"'{p}'" for p in ALLOWED_TEST_COMMAND_PREFIXES)
        raise SecurityError(
            f"Test command '{cleaned}' is not in allowlist. Allowed prefixes: {allowed_list}"
        )


@function_tool
def run_test_command(test_command: str) -> str:
    """Execute or simulate a safe test command from the strict allowlist.

    Only pytest or npm test commands are permitted. Dangerous shell operators are blocked.
    In Demo Mode, returns deterministic simulated test results to guarantee safety.

    Args:
        test_command: Command to execute (e.g., 'pytest tests/test_auth.py').

    Returns:
        Formatted execution report including exit code, stdout, and status.
    """
    try:
        validate_test_command(test_command)
    except SecurityError as sec_err:
        return f"Security Error: {sec_err}"

    # If demo mode is active, simulate test run safely
    if settings.is_demo_mode:
        return (
            f"[DEMO TEST RUNNER - SIMULATED]\n"
            f"Command: {test_command}\n"
            f"Exit Code: 0 (Passed)\n"
            f"Stdout: 3 passed, 0 failed, 0 errors in 0.42s\n"
            f"Note: Executed in safe offline deterministic mode without spawning shell."
        )

    # In live mode with local safety, execute command in isolated subprocess with timeout
    try:
        parts = shlex.split(test_command)
        proc = subprocess.run(
            parts,
            cwd=str(get_default_workspace_root()),
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
        return (
            f"Command: {test_command}\n"
            f"Exit Code: {proc.returncode}\n"
            f"Stdout:\n{proc.stdout[:2000]}\n"
            f"Stderr:\n{proc.stderr[:1000]}"
        )
    except subprocess.TimeoutExpired:
        return f"Execution Error: Test command '{test_command}' timed out after 30 seconds."
    except Exception as exc:  # noqa: BLE001
        return f"Execution Error: {exc}"

