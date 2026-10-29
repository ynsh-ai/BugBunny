"""Unit and integration tests for read-only GitHub integration."""


import httpx
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.github_service import GitHubService


def test_parse_github_repo_urls():
    """Verify strict URL validation for public repositories."""
    # Valid formats
    assert GitHubService.parse_repo_url("https://github.com/psf/requests") == ("psf", "requests")
    assert GitHubService.parse_repo_url("https://www.github.com/torvalds/linux.git") == ("torvalds", "linux")
    assert GitHubService.parse_repo_url("http://github.com/encode/fastapi") == ("encode", "fastapi")

    # Invalid domains
    with pytest.raises(ValueError, match="Only 'github.com' URLs are supported"):
        GitHubService.parse_repo_url("https://gitlab.com/owner/repo")

    with pytest.raises(ValueError, match="Only 'github.com' URLs are supported"):
        GitHubService.parse_repo_url("https://malicious-github.com/owner/repo")

    # Invalid paths
    with pytest.raises(ValueError, match="Invalid GitHub repository path"):
        GitHubService.parse_repo_url("https://github.com/onlyowner")

    with pytest.raises(ValueError, match="Path traversal sequences are strictly forbidden"):
        GitHubService.parse_repo_url("https://github.com/owner/../repo")

    with pytest.raises(ValueError, match="illegal characters"):
        GitHubService.parse_repo_url("https://github.com/owner/<script>")


def test_parse_github_issue_urls():
    """Verify strict URL validation for public issues."""
    # Valid formats
    assert GitHubService.parse_issue_url("https://github.com/psf/requests/issues/1234") == ("psf", "requests", 1234)
    assert GitHubService.parse_issue_url("https://www.github.com/encode/starlette/issues/99") == ("encode", "starlette", 99)

    # Invalid paths
    with pytest.raises(ValueError, match="Invalid GitHub issue path"):
        GitHubService.parse_issue_url("https://github.com/owner/repo/pull/123")

    with pytest.raises(ValueError, match="numeric"):
        GitHubService.parse_issue_url("https://github.com/owner/repo/issues/not-a-number")


def test_filter_safe_tree_blocks_sensitive_and_large_files():
    """Verify that file tree indexing skips sensitive files, lockfiles, binaries, and large files."""
    service = GitHubService()
    raw_items = [
        {"path": "src/main.py", "type": "blob", "size": 1024},
        {"path": "src/utils.py", "type": "blob", "size": 2048},
        {"path": ".env", "type": "blob", "size": 200},
        {"path": "config/.env.production", "type": "blob", "size": 300},
        {"path": "package-lock.json", "type": "blob", "size": 50000},
        {"path": "yarn.lock", "type": "blob", "size": 40000},
        {"path": "assets/logo.png", "type": "blob", "size": 15000},
        {"path": "binary/app.wasm", "type": "blob", "size": 80000},
        {"path": "node_modules/express/index.js", "type": "blob", "size": 500},
        {"path": ".venv/lib/site.py", "type": "blob", "size": 500},
        {"path": "huge_dataset.csv", "type": "blob", "size": 500 * 1024},  # > 100 KB
    ]

    safe_tree = service.filter_safe_tree(raw_items)
    safe_paths = [item["path"] for item in safe_tree]

    assert "src/main.py" in safe_paths
    assert "src/utils.py" in safe_paths
    assert ".env" not in safe_paths
    assert "config/.env.production" not in safe_paths
    assert "package-lock.json" not in safe_paths
    assert "yarn.lock" not in safe_paths
    assert "assets/logo.png" not in safe_paths
    assert "binary/app.wasm" not in safe_paths
    assert "node_modules/express/index.js" not in safe_paths
    assert ".venv/lib/site.py" not in safe_paths
    assert "huge_dataset.csv" not in safe_paths


@pytest.mark.asyncio
async def test_github_service_strictly_read_only_no_write_methods():
    """Verify that GitHubService never calls write HTTP methods (POST, PUT, PATCH, DELETE)."""
    mock_calls: list[str] = []

    def mock_handler(request: httpx.Request) -> httpx.Response:
        mock_calls.append(request.method)
        if "/repos/testowner/testrepo/issues/42" in str(request.url):
            return httpx.Response(200, json={
                "number": 42,
                "title": "Fix critical buffer overflow",
                "body": "Detailed issue description",
                "user": {"login": "octocat"},
                "state": "open",
                "html_url": "https://github.com/testowner/testrepo/issues/42",
            })
        if "/repos/testowner/testrepo/git/trees" in str(request.url):
            return httpx.Response(200, json={"tree": [{"path": "src/core.py", "type": "blob", "size": 500}]})
        if "/repos/testowner/testrepo" in str(request.url):
            return httpx.Response(200, json={
                "name": "testrepo",
                "html_url": "https://github.com/testowner/testrepo",
                "default_branch": "main",
                "private": False,
            })
        return httpx.Response(404, json={"message": "Not found"})

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(mock_handler))
    service = GitHubService(http_client=mock_client)

    # Perform repository and issue fetching
    repo_meta = await service.fetch_repository("testowner", "testrepo")
    issue_meta = await service.fetch_issue("testowner", "testrepo", 42)

    assert repo_meta["name"] == "testowner/testrepo"
    assert issue_meta["number"] == 42

    # Formal Proof: Only GET requests were dispatched
    assert len(mock_calls) > 0
    assert all(method == "GET" for method in mock_calls)
    assert "POST" not in mock_calls
    assert "PUT" not in mock_calls
    assert "PATCH" not in mock_calls
    assert "DELETE" not in mock_calls


@pytest.mark.asyncio
async def test_import_public_repository_endpoint(client: AsyncClient, test_session: AsyncSession):
    """Test POST /api/v1/github/import-repository with mocked GitHub response."""
    def mock_handler(request: httpx.Request) -> httpx.Response:
        if "/git/trees" in str(request.url):
            return httpx.Response(200, json={"tree": [
                {"path": "package.json", "type": "blob", "size": 300},
                {"path": "src/index.js", "type": "blob", "size": 1200},
            ]})
        return httpx.Response(200, json={
            "name": "public-library",
            "html_url": "https://github.com/acme/public-library",
            "default_branch": "main",
            "private": False,
            "description": "Awesome public utility",
        })

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(mock_handler))

    # Monkeypatch GitHubService client
    from app.services import github_service
    orig_init = github_service.GitHubService.__init__

    def patch_init(self, http_client=None):
        orig_init(self, http_client=mock_client)

    github_service.GitHubService.__init__ = patch_init

    try:
        resp = await client.post(
            "/api/v1/github/import-repository",
            json={"url": "https://github.com/acme/public-library"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "acme/public-library"
        assert data["mode"] == "connected_read_only"
        assert data["file_count"] == 2

        # Check file retrieval endpoint
        repo_id = data["id"]
        files_resp = await client.get(f"/api/v1/repositories/{repo_id}/files")
        assert files_resp.status_code == 200
        files_data = files_resp.json()
        assert files_data["repository_id"] == repo_id
        assert files_data["file_count"] == 2
        assert any(f["path"] == "src/index.js" for f in files_data["files"])
    finally:
        github_service.GitHubService.__init__ = orig_init


@pytest.mark.asyncio
async def test_import_public_issue_endpoint(client: AsyncClient, test_session: AsyncSession):
    """Test POST /api/v1/github/import-issue with mocked GitHub response."""
    def mock_handler(request: httpx.Request) -> httpx.Response:
        if "/issues/105" in str(request.url):
            return httpx.Response(200, json={
                "number": 105,
                "title": "Memory leak when closing websocket sessions",
                "body": "Reproduction steps: open 1000 connections...",
                "user": {"login": "janedoe"},
                "state": "open",
                "html_url": "https://github.com/acme/ws-server/issues/105",
                "labels": [{"name": "bug"}, {"name": "priority:high"}],
            })
        if "/git/trees" in str(request.url):
            return httpx.Response(200, json={"tree": [{"path": "server.py", "type": "blob", "size": 2500}]})
        return httpx.Response(200, json={
            "name": "ws-server",
            "html_url": "https://github.com/acme/ws-server",
            "default_branch": "main",
            "private": False,
        })

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(mock_handler))

    from app.services import github_service
    orig_init = github_service.GitHubService.__init__

    def patch_init(self, http_client=None):
        orig_init(self, http_client=mock_client)

    github_service.GitHubService.__init__ = patch_init

    try:
        resp = await client.post(
            "/api/v1/github/import-issue",
            json={"url": "https://github.com/acme/ws-server/issues/105"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Memory leak when closing websocket sessions"
        assert data["author"] == "janedoe"
        assert data["mode"] == "connected_read_only"
        assert data["repository_name"] == "acme/ws-server"
    finally:
        github_service.GitHubService.__init__ = orig_init


@pytest.mark.asyncio
async def test_private_repository_rejected(client: AsyncClient):
    """Test that private repositories are rejected with clear error."""
    def mock_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={
            "name": "secret-repo",
            "html_url": "https://github.com/acme/secret-repo",
            "default_branch": "main",
            "private": True,  # Private repository!
        })

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(mock_handler))

    from app.services import github_service
    orig_init = github_service.GitHubService.__init__

    def patch_init(self, http_client=None):
        orig_init(self, http_client=mock_client)

    github_service.GitHubService.__init__ = patch_init

    try:
        resp = await client.post(
            "/api/v1/github/import-repository",
            json={"url": "https://github.com/acme/secret-repo"},
        )
        assert resp.status_code == 400
        assert "private" in resp.json()["detail"].lower()
    finally:
        github_service.GitHubService.__init__ = orig_init
