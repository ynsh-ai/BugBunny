"""Tests for workspace summary, investigations list, repositories list, and dev reset."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_workspace_summary_endpoint(client: AsyncClient):
    """Verify GET /api/v1/workspace/summary returns real database counts."""
    res = await client.get("/api/v1/workspace/summary")
    assert res.status_code == 200
    data = res.json()
    assert "repositories_count" in data
    assert "issues_count" in data
    assert "investigations_count" in data
    assert "awaiting_approval_count" in data
    assert isinstance(data["repositories_count"], int)
    assert isinstance(data["issues_count"], int)


@pytest.mark.asyncio
async def test_list_repositories_endpoint(client: AsyncClient):
    """Verify GET /api/v1/repositories lists repositories."""
    res = await client.get("/api/v1/repositories")
    assert res.status_code == 200
    repos = res.json()
    assert isinstance(repos, list)
    if repos:
        assert "id" in repos[0]
        assert "name" in repos[0]
        assert "github_url" in repos[0]


@pytest.mark.asyncio
async def test_list_investigations_endpoint(client: AsyncClient):
    """Verify GET /api/v1/investigations lists all investigations."""
    res = await client.get("/api/v1/investigations")
    assert res.status_code == 200
    invs = res.json()
    assert isinstance(invs, list)


@pytest.mark.asyncio
async def test_dev_reset_endpoint(client: AsyncClient):
    """Verify POST /api/v1/dev/reset cleanly empties all database records."""
    res = await client.post("/api/v1/dev/reset")
    assert res.status_code == 200
    data = res.json()
    assert "deleted_issues" in data
    assert "deleted_repositories" in data

    # After reset, workspace summary must be 0 across all items
    summary_res = await client.get("/api/v1/workspace/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["repositories_count"] == 0
    assert summary["issues_count"] == 0
    assert summary["investigations_count"] == 0
    assert summary["awaiting_approval_count"] == 0
