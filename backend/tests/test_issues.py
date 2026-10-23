import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_issues_contains_seeded_demo_issue(client: AsyncClient):
    """Verify GET /api/issues returns the seeded demo-ecommerce-app issue PP-101."""
    response = await client.get("/api/issues")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

    pp101 = next((item for item in data if item["issue_key"] == "PP-101"), None)
    assert pp101 is not None
    assert pp101["title"] == "Profile update returns 500 error"
    assert pp101["repository_name"] == "demo-ecommerce-app"
    assert pp101["status"] in ["completed", "investigating"]
    assert pp101["priority"] == "high"


@pytest.mark.asyncio
async def test_get_issue_by_key(client: AsyncClient):
    """Verify GET /api/issues/{issue_id} retrieves PP-101 with repository and investigations."""
    response = await client.get("/api/issues/PP-101")
    assert response.status_code == 200
    data = response.json()

    assert data["issue_key"] == "PP-101"
    assert data["title"] == "Profile update returns 500 error"
    assert data["repository"]["name"] == "demo-ecommerce-app"
    assert data["author"] == "alex.chen@company.internal"
    assert isinstance(data["investigations"], list)
    assert len(data["investigations"]) >= 1


@pytest.mark.asyncio
async def test_get_issue_by_numeric_id(client: AsyncClient):
    """Verify GET /api/issues/{issue_id} also works with integer ID."""
    # First get issue list to find PP-101's integer ID
    list_res = await client.get("/api/issues")
    pp101 = next(item for item in list_res.json() if item["issue_key"] == "PP-101")
    numeric_id = pp101["id"]

    response = await client.get(f"/api/issues/{numeric_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == numeric_id
    assert data["issue_key"] == "PP-101"


@pytest.mark.asyncio
async def test_get_nonexistent_issue(client: AsyncClient):
    """Verify GET /api/issues/{issue_id} returns 404 for unknown issues."""
    response = await client.get("/api/issues/NONEXISTENT-999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_investigation_on_issue(client: AsyncClient):
    """Verify POST /api/issues/{issue_id}/investigations triggers a new investigation."""
    payload = {"branch_name": "bugbunny/test-investigation-branch"}
    response = await client.post("/api/issues/PP-101/investigations", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["issue_key"] == "PP-101"
    assert data["status"] == "in_progress"
    assert data["branch_name"] == "bugbunny/test-investigation-branch"
    assert "id" in data
    assert isinstance(data["agent_runs"], list)
    assert len(data["agent_runs"]) == 6  # 6 specialist pipeline stages

    # Check stage sequence
    stages = [r["stage"] for r in data["agent_runs"]]
    assert "Requirements Analysis" in stages
    assert "Bug Investigation" in stages
    assert "Coding Assistant" in stages
    assert "Testing" in stages
    assert "Code Review" in stages
    assert "Documentation" in stages


@pytest.mark.asyncio
async def test_create_investigation_on_nonexistent_issue(client: AsyncClient):
    """Verify POST /api/issues/{issue_id}/investigations returns 404 for unknown issue."""
    response = await client.post("/api/issues/NONEXISTENT-999/investigations", json={})
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_investigation_details(client: AsyncClient):
    """Verify GET /api/investigations/{investigation_id} retrieves full investigation artifacts."""
    # Retrieve PP-101 issue to get its seeded investigation ID
    issue_res = await client.get("/api/issues/PP-101")
    inv_summary = issue_res.json()["investigations"][0]
    inv_id = inv_summary["id"]

    response = await client.get(f"/api/investigations/{inv_id}")
    assert response.status_code == 200
    data = response.json()

    assert data["id"] == inv_id
    assert data["issue_key"] == "PP-101"
    assert data["repository_name"] == "demo-ecommerce-app"
    assert "deadlock" in data["root_cause_summary"].lower()

    # Verify structured artifacts
    assert isinstance(data["evidence"], list)
    assert len(data["evidence"]) >= 1
    assert isinstance(data["proposed_plan"], list)
    assert len(data["proposed_plan"]) >= 1
    assert data["code_diff"] is not None
    assert "services/user_service.py" in data["code_diff"]

    # Verify agent runs
    assert isinstance(data["agent_runs"], list)
    assert len(data["agent_runs"]) == 6


@pytest.mark.asyncio
async def test_get_nonexistent_investigation(client: AsyncClient):
    """Verify GET /api/investigations/{investigation_id} returns 404 for unknown ID."""
    response = await client.get("/api/investigations/999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
