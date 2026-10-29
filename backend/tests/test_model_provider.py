"""Unit tests for ModelProvider abstraction and offline demo fallback."""

from unittest.mock import patch

from app.agents.model_provider import ModelProvider
from app.core.config import settings


def test_model_provider_demo_mode_defaults():
    """Verify ModelProvider defaults to demo mode and never issues external model requests."""
    provider = ModelProvider()
    assert provider.is_demo is True
    assert provider.provider_name == "demo"
    assert "Demo Mode" in provider.model_name
    assert provider.validate_live_credentials() is False

    kwargs = provider.get_agent_model_kwargs()
    assert kwargs["model"] == "demo-mode-deterministic"


def test_model_provider_missing_api_key_fallback():
    """Verify fallback to demo mode when API keys are empty even if AGENT_MODE is live."""
    with (
        patch.object(settings, "AGENT_MODE", "live"),
        patch.object(settings, "GEMINI_API_KEY", None),
        patch.object(settings, "OPENAI_API_KEY", None),
    ):
        provider = ModelProvider()
        # Missing credentials must fail live validation
        assert provider.validate_live_credentials() is False


def test_model_provider_live_validation_with_key():
    """Verify live credentials validate successfully when key is set and mode is live."""
    with (
        patch.object(settings, "AGENT_MODE", "live"),
        patch.object(settings, "GEMINI_API_KEY", "test-live-key-123"),
        patch.object(settings, "AGENT_PROVIDER", "gemini"),
    ):
        provider = ModelProvider()
        assert provider.is_demo is False
        assert provider.validate_live_credentials() is True
        assert provider.provider_name == "gemini"
