"""Read-Only GitHub Integration Service.

Provides safe, authenticated/unauthenticated read-only access to public GitHub repositories
and issues. Never writes, commits, merges, or mutates any repository.
"""

from __future__ import annotations

import logging
import re
from typing import Any
from urllib.parse import urlparse

import httpx
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.issue import Issue
from app.models.repository import Repository
from app.tools.safe_paths import is_safe_path

logger = logging.getLogger("bugbunny.services.github")

# Safe bounds
MAX_FILE_TREE_ITEMS = 150
MAX_FILE_SIZE_BYTES = 100 * 1024  # 100 KB
GITHUB_API_BASE = "https://api.github.com"

# Disallowed extensions and lockfiles
BINARY_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".ico",
    ".svg",
    ".pdf",
    ".zip",
    ".tar",
    ".gz",
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".wasm",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".mp4",
    ".mp3",
    ".mov",
    ".avi",
    ".pyc",
}

LOCKFILES = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "cargo.lock",
    "poetry.lock",
    "pipfile.lock",
    "gemfile.lock",
}

BLOCKED_SEGMENTS = {
    "node_modules",
    ".venv",
    "venv",
    "__pycache__",
    ".git",
    "dist",
    "build",
    "target",
}


from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager


class GitHubServiceError(Exception):
    """Sanitized safe error raised when GitHub API operations fail."""


class GitHubService:
    """Read-only client and importer for public GitHub repositories and issues."""

    def __init__(self, http_client: httpx.AsyncClient | None = None):
        self._custom_client = http_client

    @asynccontextmanager
    async def _get_client_session(self) -> AsyncGenerator[httpx.AsyncClient, None]:
        """Provide a safe client session without prematurely closing shared test clients."""
        if self._custom_client is not None:
            yield self._custom_client
        else:
            async with httpx.AsyncClient(timeout=15.0) as client:
                yield client

    def _get_headers(self) -> dict[str, str]:
        """Construct read-only request headers, never exposing credentials."""
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "BugBunny-ReadOnly-Security-Agent/0.2.0",
        }
        if settings.GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
        return headers

    @staticmethod
    def parse_repo_url(url: str) -> tuple[str, str]:
        """Strictly validate and extract (owner, repo) from a GitHub repository URL.

        Allows only `github.com/{owner}/{repo}` format. Rejects other domains and paths.
        """
        if not url or not isinstance(url, str):
            raise ValueError("Repository URL must be a non-empty string.")

        clean_url = url.strip()
        if ".." in clean_url:
            raise ValueError("Path traversal sequences are strictly forbidden.")

        parsed = urlparse(clean_url)

        if parsed.scheme not in ("http", "https"):
            raise ValueError("Repository URL must use http or https scheme.")

        netloc = parsed.netloc.lower()
        if netloc not in ("github.com", "www.github.com"):
            raise ValueError(f"Only 'github.com' URLs are supported. Found domain: '{netloc}'.")

        path = parsed.path.strip("/")
        parts = [p for p in path.split("/") if p]

        if len(parts) != 2:
            raise ValueError(
                f"Invalid GitHub repository path: '{path}'. Expected format: 'github.com/{{owner}}/{{repo}}'."
            )

        owner, repo = parts[0], parts[1]
        repo = repo.removesuffix(".git")

        # Validate alphanumerics and hyphens/underscores
        name_pattern = re.compile(r"^[a-zA-Z0-9_.-]+$")
        if not name_pattern.match(owner) or not name_pattern.match(repo):
            raise ValueError(
                f"Repository path contains illegal characters: owner='{owner}', repo='{repo}'."
            )

        return owner, repo

    @staticmethod
    def parse_issue_url(url: str) -> tuple[str, str, int]:
        """Strictly validate and extract (owner, repo, issue_number) from a GitHub issue URL.

        Allows only `github.com/{owner}/{repo}/issues/{number}` format.
        """
        if not url or not isinstance(url, str):
            raise ValueError("Issue URL must be a non-empty string.")

        clean_url = url.strip()
        parsed = urlparse(clean_url)

        if parsed.scheme not in ("http", "https"):
            raise ValueError("Issue URL must use http or https scheme.")

        netloc = parsed.netloc.lower()
        if netloc not in ("github.com", "www.github.com"):
            raise ValueError(f"Only 'github.com' URLs are supported. Found domain: '{netloc}'.")

        path = parsed.path.strip("/")
        parts = [p for p in path.split("/") if p]

        if len(parts) != 4 or parts[2].lower() != "issues":
            raise ValueError(
                f"Invalid GitHub issue path: '{path}'. Expected format: 'github.com/{{owner}}/{{repo}}/issues/{{number}}'."
            )

        owner, repo, _, number_str = parts
        if not number_str.isdigit():
            raise ValueError(f"Issue identifier must be numeric, got: '{number_str}'.")

        name_pattern = re.compile(r"^[a-zA-Z0-9_.-]+$")
        if not name_pattern.match(owner) or not name_pattern.match(repo):
            raise ValueError(
                f"Issue repository contains illegal characters: owner='{owner}', repo='{repo}'."
            )

        return owner, repo, int(number_str)

    async def _get(self, client: httpx.AsyncClient, endpoint: str) -> dict[str, Any]:
        """Execute a safe, read-only GET request against the GitHub API."""
        url = f"{GITHUB_API_BASE}{endpoint}"
        try:
            resp = await client.get(url, headers=self._get_headers())
        except httpx.RequestError as exc:
            logger.error(f"GitHub network connection error for {endpoint}: {exc}")
            raise GitHubServiceError("Failed to connect to GitHub API. Please check your network connection.") from exc

        if resp.status_code == 404:
            raise GitHubServiceError("The requested GitHub resource was not found or is private.")
        if resp.status_code in (401, 403):
            # Check if rate limit
            msg = resp.text.lower()
            if "rate limit" in msg:
                raise GitHubServiceError(
                    "GitHub API rate limit exceeded. Please wait a few minutes or set a server-side GITHUB_TOKEN."
                )
            raise GitHubServiceError("GitHub access was denied. Ensure the repository is public.")
        if resp.status_code >= 400:
            raise GitHubServiceError(f"GitHub API request failed with status code {resp.status_code}.")

        try:
            return resp.json()
        except Exception as exc:
            raise GitHubServiceError("Invalid JSON returned by GitHub API.") from exc

    def filter_safe_tree(self, tree_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Filter out sensitive, binary, lockfiles, and oversized files from tree."""
        safe_files: list[dict[str, Any]] = []

        for item in tree_items:
            # We only track blobs (files)
            if item.get("type") != "blob":
                continue

            path = item.get("path", "")
            size = item.get("size", 0)

            if not path or not is_safe_path(path):
                continue

            # Check segments for blocked folders
            segments = set(path.lower().split("/"))
            if segments & BLOCKED_SEGMENTS:
                continue

            filename = path.split("/")[-1].lower()

            # Skip lockfiles and environment files
            if filename in LOCKFILES or filename.startswith(".env"):
                continue

            # Skip binary extensions
            ext = "." + filename.split(".")[-1] if "." in filename else ""
            if ext in BINARY_EXTENSIONS:
                continue

            # Skip files larger than 100 KB
            if size and size > MAX_FILE_SIZE_BYTES:
                continue

            safe_files.append(
                {
                    "path": path,
                    "type": "blob",
                    "size": size,
                }
            )

            if len(safe_files) >= MAX_FILE_TREE_ITEMS:
                break

        return safe_files

    async def fetch_repository(self, owner: str, repo: str) -> dict[str, Any]:
        """Fetch public repository metadata and bounded file tree via read-only GET requests."""
        async with self._get_client_session() as client:
            repo_data = await self._get(client, f"/repos/{owner}/{repo}")

            if repo_data.get("private", False):
                raise GitHubServiceError(
                    f"Repository '{owner}/{repo}' is private. BugBunny operates strictly on public repositories."
                )

            default_branch = repo_data.get("default_branch", "main")
            tree_data = {}
            try:
                tree_data = await self._get(client, f"/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1")
            except Exception as e:  # noqa: BLE001
                logger.warning(f"Could not fetch full git tree for {owner}/{repo}: {e}")

            raw_tree = tree_data.get("tree", []) if isinstance(tree_data, dict) else []
            filtered_tree = self.filter_safe_tree(raw_tree)

            return {
                "name": f"{owner}/{repo}",
                "owner": owner,
                "github_url": repo_data.get("html_url", f"https://github.com/{owner}/{repo}"),
                "default_branch": default_branch,
                "description": repo_data.get("description") or "",
                "file_tree": filtered_tree,
                "file_count": len(filtered_tree),
                "mode": "connected_read_only",
            }

    async def fetch_issue(self, owner: str, repo: str, issue_number: int) -> dict[str, Any]:
        """Fetch issue details via read-only GET requests."""
        async with self._get_client_session() as client:
            issue_data = await self._get(client, f"/repos/{owner}/{repo}/issues/{issue_number}")

            return {
                "number": issue_data.get("number", issue_number),
                "title": issue_data.get("title", f"Issue #{issue_number}"),
                "body": issue_data.get("body") or "",
                "author": issue_data.get("user", {}).get("login", "github-user"),
                "state": issue_data.get("state", "open"),
                "html_url": issue_data.get("html_url", ""),
                "labels": [lbl.get("name", "") for lbl in issue_data.get("labels", []) if isinstance(lbl, dict)],
            }

    async def import_repository(self, db: AsyncSession, url: str) -> Repository:
        """Validate, fetch, and persist public GitHub repository metadata and bounded file tree."""
        owner, repo = self.parse_repo_url(url)
        metadata = await self.fetch_repository(owner, repo)

        repo_name = metadata["name"]
        stmt = select(Repository).where(
            or_(Repository.name == repo_name, Repository.github_url == metadata["github_url"])
        )
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()

        if existing:
            existing.default_branch = metadata["default_branch"]
            existing.mode = "connected_read_only"
            existing.file_tree = metadata["file_tree"]
            await db.commit()
            await db.refresh(existing)
            return existing

        new_repo = Repository(
            name=repo_name,
            owner=metadata["owner"],
            github_url=metadata["github_url"],
            default_branch=metadata["default_branch"],
            is_active=True,
            mode="connected_read_only",
            file_tree=metadata["file_tree"],
        )
        db.add(new_repo)
        await db.commit()
        await db.refresh(new_repo)
        logger.info(f"Imported read-only GitHub repository: {new_repo.name}")
        return new_repo

    async def import_issue(self, db: AsyncSession, url: str) -> Issue:
        """Validate, fetch, and persist public GitHub issue with cached repository linkage."""
        owner, repo_name, issue_num = self.parse_issue_url(url)

        # 1. Ensure repository is imported and cached
        repo_url = f"https://github.com/{owner}/{repo_name}"
        repository = await self.import_repository(db, repo_url)

        # 2. Fetch issue metadata
        issue_meta = await self.fetch_issue(owner, repo_name, issue_num)

        # 3. Create unique key, e.g. GH-REQ-123
        repo_prefix = re.sub(r"[^A-Za-z0-9]", "", repo_name)[:4].upper()
        clean_key = f"GH-{repo_prefix}-{issue_num}"

        stmt = select(Issue).options(selectinload(Issue.repository)).where(
            or_(
                Issue.issue_key == clean_key,
                (Issue.repository_id == repository.id) & (Issue.github_issue_number == issue_num),
            )
        )
        res = await db.execute(stmt)
        existing_issue = res.scalar_one_or_none()

        if existing_issue:
            existing_issue.title = issue_meta["title"]
            existing_issue.description = issue_meta["body"]
            existing_issue.mode = "connected_read_only"
            await db.commit()
            stmt = select(Issue).options(selectinload(Issue.repository)).where(Issue.id == existing_issue.id)
            res = await db.execute(stmt)
            return res.scalar_one()

        new_issue = Issue(
            issue_key=clean_key,
            repository_id=repository.id,
            github_issue_number=issue_num,
            title=issue_meta["title"],
            description=issue_meta["body"],
            author=issue_meta["author"],
            status="In progress",
            priority="medium",
            assigned_agent="Requirements Analyst",
            branch=f"bugbunny/gh-{issue_num}-fix",
            target_commit="HEAD",
            mode="connected_read_only",
        )
        db.add(new_issue)
        await db.commit()
        stmt = select(Issue).options(selectinload(Issue.repository)).where(Issue.id == new_issue.id)
        res = await db.execute(stmt)
        loaded = res.scalar_one()
        logger.info(f"Imported read-only GitHub issue: {loaded.issue_key} ({loaded.title})")
        return loaded

