"""API Integration tests for Investigation Runs, Artifacts, and Human Approval Decisions."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_investigation_runs_endpoint(client: AsyncClient):
    """Verify GET /api/v1/investigations/{id}/runs retrieves runs history."""
    # First trigger investigation on PP-101
    inv_res = await client.post("/api/v1/issues/PP-101/investigations", json={})
    assert inv_res.status_code == 201
    inv_id = inv_res.json()["id"]

    # Fetch runs
    runs_res = await client.get(f"/api/v1/investigations/{inv_id}/runs")
    assert runs_res.status_code == 200
    runs = runs_res.json()
    assert isinstance(runs, list)
    assert len(runs) == 6

    stages = [r["stage"] for r in runs]
    assert stages == [
        "Requirements Analysis",
        "Bug Investigation",
        "Solution Planning",
        "Patch Engineering",
        "Testing",
        "Code Review",
    ]


@pytest.mark.asyncio
async def test_investigation_artifacts_endpoint(client: AsyncClient):
    """Verify GET /api/v1/investigations/{id}/artifacts returns audit artifacts."""
    inv_res = await client.post("/api/v1/issues/PP-101/investigations", json={})
    inv_id = inv_res.json()["id"]

    artifacts_res = await client.get(f"/api/v1/investigations/{inv_id}/artifacts")
    assert artifacts_res.status_code == 200
    artifacts = artifacts_res.json()
    assert isinstance(artifacts, list)
    assert len(artifacts) >= 6

    types = {a["artifact_type"] for a in artifacts}
    assert "diff" in types
    assert "plan" in types
    assert "test_results" in types


@pytest.mark.asyncio
async def test_human_approval_decision_guard(client: AsyncClient):
    """Verify approval decision transitions audit state to approved_for_export without mutating disk."""
    inv_res = await client.post("/api/v1/issues/PP-101/investigations", json={})
    inv_id = inv_res.json()["id"]

    # Submit approval
    approval_payload = {
        "decision": "approved_for_export",
        "reviewer": "Security Lead",
        "notes": "Verified sandbox constraints and zero regression risk.",
    }
    dec_res = await client.post(f"/api/v1/investigations/{inv_id}/decision", json=approval_payload)
    assert dec_res.status_code == 201
    dec_data = dec_res.json()
    assert dec_data["decision"] == "approved_for_export"
    assert dec_data["reviewer"] == "Security Lead"

    # Verify investigation record state updated
    detail_res = await client.get(f"/api/v1/investigations/{inv_id}")
    assert detail_res.status_code == 200
    inv_detail = detail_res.json()
    assert inv_detail["status"] == "approved_for_export"

    # Verify issue status updated to Approved
    issue_res = await client.get("/api/v1/issues/PP-101")
    assert issue_res.status_code == 200
    assert issue_res.json()["status"] == "Approved"


@pytest.mark.asyncio
async def test_human_rejection_decision(client: AsyncClient):
    """Verify rejection decision updates investigation to rejected."""
    inv_res = await client.post("/api/v1/issues/PP-102/investigations", json={})
    inv_id = inv_res.json()["id"]

    rejection_payload = {
        "decision": "rejected",
        "reviewer": "QA Lead",
        "notes": "Needs additional stress testing under high socket load.",
    }
    dec_res = await client.post(f"/api/v1/investigations/{inv_id}/decision", json=rejection_payload)
    assert dec_res.status_code == 201
    assert dec_res.json()["decision"] == "rejected"

    detail_res = await client.get(f"/api/v1/investigations/{inv_id}")
    assert detail_res.json()["status"] == "rejected"
