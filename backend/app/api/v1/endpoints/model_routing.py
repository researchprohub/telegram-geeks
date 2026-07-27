"""Multi-Model Routing API — per-persona AI provider routing."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.models import User
from telegram_layer.src.actions.model_routing import model_router, PROVIDER_CAPABILITIES

router = APIRouter(prefix="/api/v1/model-routing", tags=["Model Routing"])


@router.get("/providers")
async def list_providers(user: User = Depends(get_current_user)):
    return {"providers": model_router.get_available_providers()}


class RouteRequest(BaseModel):
    persona_id: str
    task_type: str = "casual_reply"
    persona_provider: Optional[str] = None


@router.post("/route")
async def route_request(body: RouteRequest, user: User = Depends(get_current_user)):
    decision = model_router.route(body.persona_id, body.task_type, body.persona_provider)
    return {"decision": decision}


@router.post("/persona/{persona_id}/provider/{provider}")
async def set_persona_provider(persona_id: str, provider: str, user: User = Depends(get_current_user)):
    try:
        model_router.set_persona_provider(persona_id, provider)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"persona_id": persona_id, "provider": provider}


@router.delete("/persona/{persona_id}/provider")
async def clear_persona_provider(persona_id: str, user: User = Depends(get_current_user)):
    model_router.clear_persona_override(persona_id)
    return {"persona_id": persona_id, "provider": "auto"}


@router.get("/usage")
async def get_usage(user: User = Depends(get_current_user)):
    return {"usage": model_router.get_usage_stats()}
