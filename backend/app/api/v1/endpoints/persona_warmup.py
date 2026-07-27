"""Persona Warm-Up Sequence API."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.models import User
from telegram_layer.src.actions.persona_warmup import warmup_orchestrator

router = APIRouter(prefix="/api/v1/persona-warmup", tags=["Persona Warmup"])


class StartWarmupRequest(BaseModel):
    persona_id: str
    group_ids: Optional[list[str]] = None


@router.post("/start")
async def start_warmup(body: StartWarmupRequest, user: User = Depends(get_current_user)):
    w = warmup_orchestrator.start_warmup(body.persona_id, body.group_ids)
    return w.get_progress()


@router.get("/progress/{persona_id}")
async def get_progress(persona_id: str, user: User = Depends(get_current_user)):
    w = warmup_orchestrator.get_warmup(persona_id)
    if not w:
        return {"error": "No warmup found for this persona"}
    return w.get_progress()


@router.get("/allowed-actions/{persona_id}")
async def get_allowed_actions(persona_id: str, group_id: Optional[str] = None, user: User = Depends(get_current_user)):
    w = warmup_orchestrator.get_warmup(persona_id)
    if not w:
        return {"error": "No warmup found"}
    return w.get_allowed_actions(group_id)


@router.get("/summary")
async def get_summary(user: User = Depends(get_current_user)):
    return {"summary": warmup_orchestrator.get_phase_summary(), "all": warmup_orchestrator.get_all_warmups()}
