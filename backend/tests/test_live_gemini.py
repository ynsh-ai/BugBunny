"""Unit and integration tests for Live Gemini provider and safeguards."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.model_provider import RateLimitExceededError, model_provider
from app.core.config import settings
from app.models.issue import Issue
from app.models.repository import Repository
from app.services.orchestrator import OrchestrationService


@pytest.mark.asyncio
async def test_system_mode_endpoint_demo(client: AsyncClient):
    """Verify GET /api/v1/system/mode in default Demo Mode."""
    resp = await client.get("/api/v1/system/mode")
    assert resp.status_code == 200
    data = resp.json()
    assert data["mode"] == "demo"
    assert "provider" in data
    assert "model" in data
    assert "Deterministic Demo Mode" in data["message"]
    # Ensure no API key or credential is leaked
    assert "GEMINI_API_KEY" not in str(data)
    assert "AIza" not in str(data)


def test_configuration_validation():
    """Verify provider configuration validation for Demo vs Live Gemini."""
    orig_mode = settings.AGENT_MODE
    orig_provider = settings.AGENT_PROVIDER
    orig_key = settings.GEMINI_API_KEY

    try:
        # 1. Default Demo Mode
        settings.AGENT_MODE = "demo"
        settings.AGENT_PROVIDER = "gemini"
        settings.GEMINI_API_KEY = "AIzaSyTestKey123"
        assert not settings.is_live_gemini_available
        assert not model_provider.validate_live_credentials()

        # 2. Live mode with missing key
        settings.AGENT_MODE = "live"
        settings.GEMINI_API_KEY = ""
        assert not settings.is_live_gemini_available
        assert not model_provider.validate_live_credentials()

        # 3. Live mode with non-gemini provider
        settings.GEMINI_API_KEY = "AIzaSyTestKey123"
        settings.AGENT_PROVIDER = "anthropic"
        assert not settings.is_live_gemini_available

        # 4. Valid Live Gemini configuration
        settings.AGENT_PROVIDER = "gemini"
        assert settings.is_live_gemini_available
        assert model_provider.validate_live_credentials()
    finally:
        settings.AGENT_MODE = orig_mode
        settings.AGENT_PROVIDER = orig_provider
        settings.GEMINI_API_KEY = orig_key


@pytest.mark.asyncio
async def test_demo_mode_makes_zero_external_network_calls(test_session: AsyncSession, monkeypatch):
    """Verify that Demo Mode execution makes zero external HTTP network calls."""
    import httpx
    from sqlalchemy import select

    network_called = False

    async def mock_network_send(*args, **kwargs):
        nonlocal network_called
        network_called = True
        raise RuntimeError("External network call attempted in Demo Mode!")

    monkeypatch.setattr(httpx.AsyncClient, "send", mock_network_send)

    orchestrator = OrchestrationService(test_session)
    res = await test_session.execute(select(Issue).where(Issue.issue_key == "PP-101"))
    issue = res.scalar_one_or_none()
    assert issue is not None

    inv = await orchestrator.run_investigation_workflow(issue.id, mode="demo")
    assert inv.status == "awaiting_approval"
    assert not network_called


@pytest.mark.asyncio
async def test_live_mode_rejected_when_credentials_missing(client: AsyncClient, test_session: AsyncSession):
    """Verify that requesting Live Mode fails safely when GEMINI_API_KEY is not set."""
    # Ensure keys are empty
    orig_mode = settings.AGENT_MODE
    orig_key = settings.GEMINI_API_KEY
    settings.AGENT_MODE = "live"
    settings.GEMINI_API_KEY = ""

    try:
        resp = await client.post(
            "/api/v1/issues/PP-101/investigations",
            json={"mode": "live"},
        )
        assert resp.status_code == 400
        detail = resp.json()["detail"]
        assert "Live Gemini Mode is unavailable" in detail
        assert "GEMINI_API_KEY" in detail
    finally:
        settings.AGENT_MODE = orig_mode
        settings.GEMINI_API_KEY = orig_key


def test_model_provider_error_sanitization():
    """Verify that raw exceptions, secrets, and traceback bodies are sanitized."""
    # 429 quota exhaustion
    err_429 = Exception("Error 429: RESOURCE_EXHAUSTED quota exceeded for model gemini-1.5-pro")
    msg = model_provider.sanitize_error(err_429)
    assert "rate limit or quota exceeded" in msg.lower()
    assert "gemini-1.5-pro" not in msg

    # 401 invalid key with simulated key in raw error
    err_401 = Exception("401 Unauthorized: API_KEY_INVALID AIzaSyD987fakekeyispresent")
    msg = model_provider.sanitize_error(err_401)
    assert "authentication failed" in msg.lower()
    assert "AIzaSy" not in msg

    # Unknown exception
    err_unknown = Exception("Internal database server error /etc/passwd or socket failure")
    msg = model_provider.sanitize_error(err_unknown)
    assert "safely without exposing provider credentials" in msg
    assert "/etc/passwd" not in msg


def test_free_tier_rate_limiter():
    """Verify that rate limiter restricts requests to 15 RPM."""
    provider = model_provider
    provider._request_timestamps = []

    # First 15 calls must pass
    for _ in range(15):
        provider.check_rate_limit()

    # 16th call must raise RateLimitExceededError
    with pytest.raises(RateLimitExceededError, match="Gemini free tier rate limit reached"):
        provider.check_rate_limit()

    # Reset
    provider._request_timestamps = []


@pytest.mark.asyncio
async def test_orchestrator_imported_remote_issue_workflow(test_session: AsyncSession):
    """Verify full 6-stage workflow execution on an imported read-only GitHub issue."""
    # 1. Create mock imported repository marked connected_read_only
    repo = Repository(
        name="facebook/react",
        owner="facebook",
        github_url="https://github.com/facebook/react",
        default_branch="main",
        is_active=True,
        mode="connected_read_only",
        file_tree=[
            {"path": "packages/react/src/React.js", "type": "blob", "size": 1500},
            {"path": "packages/react-dom/src/client/ReactDOM.js", "type": "blob", "size": 3200},
        ],
    )
    test_session.add(repo)
    await test_session.flush()

    issue = Issue(
        issue_key="GH-REAC-9999",
        repository_id=repo.id,
        github_issue_number=9999,
        title="Concurrent transition state tearing in suspense boundary",
        description="Transitions under strict mode fail to flush before paint.",
        author="react-dev",
        status="In progress",
        priority="high",
        assigned_agent="Requirements Analyst",
        branch="bugbunny/gh-9999-fix",
        target_commit="HEAD",
        mode="connected_read_only",
    )
    test_session.add(issue)
    await test_session.commit()

    # Run workflow
    orchestrator = OrchestrationService(test_session)
    inv = await orchestrator.run_investigation_workflow(issue.id, mode="demo")

    assert inv.status == "awaiting_approval"
    assert issue.status == "Review required"

    # Verify 6 AgentRuns persisted
    assert len(inv.agent_runs) == 6
    stages = [r.stage for r in inv.agent_runs]
    assert stages == [
        "Requirements Analysis",
        "Bug Investigation",
        "Solution Planning",
        "Patch Engineering",
        "Testing",
        "Code Review",
    ]

    # Verify Testing stage respected remote code execution guard
    test_run = next(r for r in inv.agent_runs if r.stage == "Testing")
    assert "Remote Sandbox" in test_run.model
    assert "Arbitrary remote code execution skipped" in test_run.summary

    # Verify artifacts and memory
    assert len(inv.artifacts) >= 6
    assert len(inv.memories) >= 6
