"""Security utilities for safe path validation and workspace containment.

Enforces strict rules to prevent path traversal, access to environment secrets,
credentials, system directories, and massive dependency trees.
"""

from __future__ import annotations

from pathlib import Path


class SecurityError(ValueError):
    """Raised when a path or command violates security boundaries."""



# Default disallowed sensitive file patterns and extensions
DISALLOWED_PATTERNS = {
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
    ".env.test",
    "id_rsa",
    "id_ed25519",
}

DISALLOWED_EXTENSIONS = {
    ".pem",
    ".key",
    ".pfx",
    ".p12",
}

# Directories completely off-limits to agent reading/searching
DISALLOWED_DIRECTORIES = {
    ".git",
    "node_modules",
    ".venv",
    "venv",
    "__pycache__",
    ".next",
    "dist",
    "build",
}

SYSTEM_DIRECTORIES = {
    "/etc",
    "/proc",
    "/sys",
    "/dev",
    "/root",
    "/var",
    "/private",
}


def get_default_workspace_root() -> Path:
    """Return the absolute path of the repository/workspace root."""
    # backend/app/tools/safe_paths.py -> 3 levels up to backend, 4 levels to BugBunny
    current_file = Path(__file__).resolve()
    # /Users/mac/BugBunny/backend/app/tools/safe_paths.py
    workspace_root = current_file.parents[3]
    return workspace_root


def validate_safe_path(
    path: str | Path,
    base_dir: str | Path | None = None,
    allow_subdirs: bool = True,
) -> Path:
    """Validate that a target path is safely within the workspace and non-sensitive.

    Args:
        path: Path string or Path object to validate.
        base_dir: Allowed base directory (defaults to workspace root).
        allow_subdirs: Whether subdirectories inside base_dir are permitted.

    Returns:
        The resolved absolute Path if valid.

    Raises:
        SecurityError: If path violates security constraints or directory boundaries.
    """
    if not path or not str(path).strip():
        raise SecurityError("Path cannot be empty.")

    raw_str = str(path).strip()

    # Reject null bytes or suspicious characters
    if "\x00" in raw_str:
        raise SecurityError("Path contains illegal null bytes.")

    base = Path(base_dir).resolve() if base_dir else get_default_workspace_root()

    # If relative, resolve relative to base
    target = Path(raw_str)
    if not target.is_absolute():
        target = (base / target).resolve()
    else:
        target = target.resolve()

    # Ensure path stays within base_dir
    try:
        relative_to_base = target.relative_to(base)
    except ValueError:
        raise SecurityError(
            f"Path traversal detected: '{raw_str}' resolves outside base directory '{base}'."
        )

    # Check for disallowed system roots
    target_str = str(target)
    for sys_dir in SYSTEM_DIRECTORIES:
        if target_str.startswith(sys_dir):
            raise SecurityError(f"Access to system directory '{sys_dir}' is blocked.")

    # Check parts for sensitive directory names
    parts = relative_to_base.parts
    for part in parts:
        if part in DISALLOWED_DIRECTORIES:
            raise SecurityError(
                f"Access to protected directory '{part}' is strictly prohibited."
            )

    # Check file name and extension
    file_name = target.name.lower()
    if file_name in DISALLOWED_PATTERNS or file_name.startswith(".env"):
        raise SecurityError(f"Access to sensitive configuration file '{target.name}' is prohibited.")

    if any(file_name.endswith(ext) for ext in DISALLOWED_EXTENSIONS):
        raise SecurityError(f"Access to private key/certificate '{target.name}' is prohibited.")

    if "secret" in file_name or "credential" in file_name:
        raise SecurityError(f"Access to sensitive file '{target.name}' is prohibited.")

    return target


def is_safe_path(path: str | Path, base_dir: str | Path | None = None) -> tuple[bool, str]:
    """Test if a path is safe without raising an exception."""
    try:
        validate_safe_path(path, base_dir)
        return True, ""
    except SecurityError as err:
        return False, str(err)
