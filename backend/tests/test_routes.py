import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_issue_placeholder(client: AsyncClient):
    """Verify issue creation endpoint returns expected payload."""
    payload = {
        "github_url": "https://github.com/ynsh-ai/patchpilot-ai/issues/104",
        "title": "Fix memory leak in agent sandbox",
    }
    response = await client.post("/api/v1/issues/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["github_url"] == payload["github_url"]
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_trigger_run_placeholder(client: AsyncClient):
    """Verify triggering an agent run returns accepted status."""
    payload = {"issue_id": 1}
    response = await client.post("/api/v1/runs/", json=payload)
    assert response.status_code == 202
    data = response.json()
    assert data["issue_id"] == 1
    assert data["status"] == "initialized"
