"""Model Provider Abstraction.

Manages LLM provider selection and safe fallback between deterministic Demo Mode
and live LLM inference (e.g. Gemini via OpenAI-compatible endpoints or Google AI).
"""

import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger("bugbunny.agents.model_provider")


class ModelProvider:
    """Encapsulates model provider routing, authentication guards, and demo fallbacks."""

    def __init__(self):
        self._provider = settings.AGENT_PROVIDER.lower()
        self._model = settings.GEMINI_MODEL
        self._api_key = settings.GEMINI_API_KEY or settings.OPENAI_API_KEY

    @property
    def is_demo(self) -> bool:
        """Returns True if the system must operate strictly offline without external model requests."""
        return settings.is_demo_mode

    @property
    def provider_name(self) -> str:
        """Returns active provider name ('demo', 'gemini', or 'openai')."""
        if self.is_demo:
            return "demo"
        return self._provider

    @property
    def model_name(self) -> str:
        """Returns active model identifier for reporting and telemetry."""
        if self.is_demo:
            return f"Gemini 1.5 Pro ({settings.ENVIRONMENT.title()} Demo Mode)"
        return self._model

    def get_model_name(self) -> str:
        """Returns active model identifier string."""
        return self.model_name

    def validate_live_credentials(self) -> bool:
        """Validates that necessary provider credentials exist for live model calls."""
        if self.is_demo:
            return False
        if self._provider == "gemini" and not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY is unset; falling back to Demo Mode.")
            return False
        if self._provider == "openai" and not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY is unset; falling back to Demo Mode.")
            return False
        return True

    def get_agent_model_kwargs(self) -> dict[str, Any]:
        """Provides model parameters for OpenAI Agents SDK Agent instantiation."""
        if self.is_demo:
            return {
                "model": "demo-mode-deterministic",
            }
        return {
            "model": self._model,
        }


# Singleton model provider instance
model_provider = ModelProvider()
