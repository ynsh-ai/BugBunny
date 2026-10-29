"""System diagnostic and mode inspection endpoints."""

from fastapi import APIRouter

from app.agents.model_provider import model_provider
from app.core.config import settings
from app.schemas.github import SystemModeResponse

router = APIRouter(prefix="/system", tags=["System"])


@router.get("/mode", response_model=SystemModeResponse, summary="Get Agent Orchestration Mode")
async def get_system_mode() -> SystemModeResponse:
    """Returns active agent orchestration mode and whether live Gemini credentials are valid.

    Guarantees no API keys or secrets are returned to the client.
    """
    is_live_valid = model_provider.validate_live_credentials()
    mode = "live" if is_live_valid and settings.AGENT_MODE.lower() == "live" else "demo"

    if is_live_valid and mode == "live":
        msg = f"Live Gemini mode is active ({model_provider.model_name})."
    elif settings.AGENT_MODE.lower() == "live" and not is_live_valid:
        msg = "Live mode requested but GEMINI_API_KEY is missing or invalid. Falling back to Demo Mode."
    else:
        msg = "Deterministic Demo Mode is active (zero external API calls)."

    return SystemModeResponse(
        mode=mode,
        live_available=is_live_valid,
        provider=model_provider.provider_name,
        model=model_provider.model_name,
        message=msg,
    )
