import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_issues_api_v1(client: AsyncClient):
    """Verify GET /api/v1/issues returns seeded issues including PP-101 with mode=demo."""
    response = await client.get("/api/v1/issues")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

    pp101 = next((item for item in data if item["issue_key"] == "PP-101"), None)
    assert pp101 is not None
    assert pp101["title"] == "Profile update returns 500 error"
    assert pp101["repository_name"] == "demo-ecommerce-app"
    assert pp101["mode"] == "demo"
    assert pp101["priority"] == "high"
    assert isinstance(pp101["timeline"], list)
    assert len(pp101["timeline"]) == 6


@pytest.mark.asyncio
async def test_get_issue_by_key_api_v1(client: AsyncClient):
    """Verify GET /api/v1/issues/{issue_id} retrieves PP-101 with full details."""
    response = await client.get("/api/v1/issues/PP-101")
    assert response.status_code == 200
    data = response.json()

    assert data["issue_key"] == "PP-101"
    assert data["title"] == "Profile update returns 500 error"
    assert data["repository"]["name"] == "demo-ecommerce-app"
    assert data["mode"] == "demo"
    assert data["author"] == "alex.chen@company.internal"
    assert isinstance(data["investigations"], list)
    assert len(data["investigations"]) >= 1
    assert "deadlock" in data["root_cause_summary"].lower()
    assert len(data["timeline"]) == 6


@pytest.mark.asyncio
async def test_get_issue_by_uuid(client: AsyncClient):
    """Verify GET /api/v1/issues/{issue_id} works with UUID string."""
    list_res = await client.get("/api/v1/issues")
    pp101 = next(item for item in list_res.json() if item["issue_key"] == "PP-101")
    uuid_id = pp101["id"]

    response = await client.get(f"/api/v1/issues/{uuid_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == uuid_id
    assert data["issue_key"] == "PP-101"


@pytest.mark.asyncio
async def test_get_nonexistent_issue(client: AsyncClient):
    """Verify GET /api/v1/issues/{issue_id} returns 404 for unknown issues."""
    response = await client.get("/api/v1/issues/NONEXISTENT-999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_dev_seed_endpoint(client: AsyncClient):
    """Verify POST /api/v1/dev/seed populates all six demo dashboard issues."""
    response = await client.post("/api/v1/dev/seed?reset=true")
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "seeded"
    assert data["mode"] == "demo"
    assert data["issues_count"] == 6

    # Verify that listing now returns exactly all 6 demo issues
    list_res = await client.get("/api/v1/issues")
    assert list_res.status_code == 200
    issues = list_res.json()
    assert len(issues) == 6

    issue_keys = {item["issue_key"] for item in issues}
    expected_keys = {"PP-101", "PP-102", "PP-103", "PP-104", "PP-105", "PP-106"}
    assert expected_keys.issubset(issue_keys)

    # Ensure every single issue is tagged with mode: demo
    for item in issues:
        assert item["mode"] == "demo"


@pytest.mark.asyncio
async def test_create_investigation_on_issue(client: AsyncClient):
    """Verify POST /api/v1/issues/{issue_id}/investigations triggers a new investigation."""
    payload = {"branch_name": "bugbunny/test-investigation-branch"}
    response = await client.post("/api/v1/issues/PP-101/investigations", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["issue_key"] == "PP-101"
    assert data["status"] == "in_progress"
    assert data["branch_name"] == "bugbunny/test-investigation-branch"
    assert "id" in data
    assert isinstance(data["agent_runs"], list)
    assert len(data["agent_runs"]) == 6


@pytest.mark.asyncio
async def test_get_investigation_details(client: AsyncClient):
    """Verify GET /api/v1/investigations/{investigation_id} retrieves full investigation artifacts."""
    issue_res = await client.get("/api/v1/issues/PP-101")
    inv_summary = issue_res.json()["investigations"][0]
    inv_id = inv_summary["id"]

    response = await client.get(f"/api/v1/investigations/{inv_id}")
    assert response.status_code == 200
    data = response.json()

    assert data["id"] == inv_id
    assert data["issue_key"] == "PP-101"
    assert data["repository_name"] == "demo-ecommerce-app"
    assert "deadlock" in data["root_cause_summary"].lower()
    assert isinstance(data["agent_runs"], list)
    assert len(data["agent_runs"]) == 6


@pytest.mark.asyncio
async def test_get_nonexistent_investigation(client: AsyncClient):
    """Verify GET /api/v1/investigations/{investigation_id} returns 404 for unknown ID."""
    response = await client.get("/api/v1/investigations/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
