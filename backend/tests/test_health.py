import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_direct_health_endpoint(client: AsyncClient):
    """Verify that top-level /health endpoint returns 200 OK with expected structure."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "PatchPilot AI"
    assert "version" in data
    assert "environment" in data
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_api_health_endpoint(client: AsyncClient):
    """Verify that /api/health endpoint returns 200 OK."""
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_root_index(client: AsyncClient):
    """Verify that root endpoint provides discoverability links."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["health"] == "/health"
    assert data["docs"] == "/docs"
    assert data["api"] == "/api"
