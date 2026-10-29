"""Model Provider Abstraction.

Manages LLM provider selection, credential guards, rate limiting, and safe fallback
between deterministic Demo Mode and live LLM inference (e.g. Gemini via OpenAI Agents SDK).
"""

from __future__ import annotations

import logging
import time
from typing import Any

from agents import Model, OpenAIProvider

from app.core.config import settings

logger = logging.getLogger("bugbunny.agents.model_provider")

# Free Gemini Tier Constraints
FREE_TIER_RPM_LIMIT = 15
FREE_TIER_WINDOW_SECONDS = 60.0
MAX_INPUT_CHARS = 12000
MAX_OUTPUT_TOKENS = 2048


class RateLimitExceededError(Exception):
    """Raised when request frequency exceeds the free tier rate limit."""


class LiveProviderError(Exception):
    """Sanitized error raised during live model provider interactions."""


class ModelProvider:
    """Encapsulates model provider routing, authentication guards, rate limits, and demo fallbacks."""

    def __init__(self):
        self._provider = settings.AGENT_PROVIDER.lower()
        self._model = settings.GEMINI_MODEL
        self._api_key = settings.GEMINI_API_KEY or settings.OPENAI_API_KEY
        self._request_timestamps: list[float] = []

    @property
    def is_demo(self) -> bool:
        """Returns True if the system must operate strictly offline without external model requests."""
        return settings.is_demo_mode

    @property
    def is_live(self) -> bool:
        """Returns True if live model execution is configured and credentials are present."""
        return settings.AGENT_MODE.lower() == "live" and bool(
            settings.GEMINI_API_KEY or settings.OPENAI_API_KEY
        )

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
        return self._model or "gemini-1.5-pro"

    def get_model_name(self) -> str:
        """Returns active model identifier string."""
        return self.model_name

    def validate_live_credentials(self) -> bool:
        """Validates that necessary provider credentials exist for live model calls."""
        if settings.AGENT_MODE.lower() != "live":
            return False
        if self._provider == "gemini" and not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY is unset; live model execution unavailable.")
            return False
        if self._provider == "openai" and not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY is unset; live model execution unavailable.")
            return False
        return True

    def check_rate_limit(self) -> None:
        """Enforce rate limits suitable for free Gemini tier (15 RPM)."""
        now = time.time()
        # Prune timestamps older than 60 seconds
        self._request_timestamps = [
            ts for ts in self._request_timestamps if now - ts < FREE_TIER_WINDOW_SECONDS
        ]

        if len(self._request_timestamps) >= FREE_TIER_RPM_LIMIT:
            wait_time = int(FREE_TIER_WINDOW_SECONDS - (now - self._request_timestamps[0]))
            raise RateLimitExceededError(
                f"Gemini free tier rate limit reached (15 RPM). Please wait {max(1, wait_time)}s or switch to Demo Mode."
            )

        self._request_timestamps.append(now)

    def truncate_input(self, text: str, max_chars: int = MAX_INPUT_CHARS) -> str:
        """Bounds prompt and context length to stay safely within free tier context allowances."""
        if not text or len(text) <= max_chars:
            return text
        return text[:max_chars] + f"\n...[Truncated to {max_chars} characters for safe inference limits]"

    def get_agents_model(self) -> Model:
        """Instantiates an OpenAI Agents SDK Model adapter for live execution.

        Uses the standard OpenAI-compatible endpoints supported natively by Google Gemini.
        """
        if not self.validate_live_credentials():
            raise LiveProviderError(
                "Live Gemini Mode is not configured. Set GEMINI_API_KEY in the backend environment."
            )

        if self._provider == "gemini":
            provider = OpenAIProvider(
                api_key=settings.GEMINI_API_KEY,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                use_responses=False,
            )
            return provider.get_model(self._model or "gemini-1.5-pro")

        # Fallback to direct OpenAI if provider is openai
        provider = OpenAIProvider(
            api_key=settings.OPENAI_API_KEY,
            use_responses=False,
        )
        return provider.get_model(self._model or "gpt-4o-mini")

    def sanitize_error(self, exc: Exception) -> str:
        """Sanitizes raw provider errors to ensure no keys or internal payloads leak to the client."""
        raw_msg = str(exc)
        logger.error(f"Live model error encountered: {raw_msg}")

        # Check for rate limiting
        if "429" in raw_msg or "RESOURCE_EXHAUSTED" in raw_msg or "rate limit" in raw_msg.lower():
            return "Gemini free tier rate limit or quota exceeded. Please wait a minute before retrying or use Demo Mode."

        # Check for auth failure
        if "401" in raw_msg or "403" in raw_msg or "API_KEY_INVALID" in raw_msg:
            return "Gemini authentication failed. Please verify that your GEMINI_API_KEY is valid."

        # Check for connection timeout
        if "timeout" in raw_msg.lower():
            return "Gemini request timed out. Please check your network connection and retry."

        return "Live model inference failed safely without exposing provider credentials."

    def extract_usage(self, raw_responses: list[Any] | None) -> dict[str, Any]:
        """Extracts token and cost metadata from OpenAI Agents SDK response items."""
        if not raw_responses:
            return {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0, "cost_usd": 0.0}

        total_input = 0
        total_output = 0

        for resp in raw_responses:
            usage = getattr(resp, "usage", None)
            if usage:
                total_input += getattr(usage, "input_tokens", 0)
                total_output += getattr(usage, "output_tokens", 0)

        total_tokens = total_input + total_output
        # Free Gemini tier cost is $0.00
        return {
            "input_tokens": total_input,
            "output_tokens": total_output,
            "total_tokens": total_tokens,
            "cost_usd": 0.0,
        }

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
