from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.models import User
from telegram_layer.src.actions.persona_emotions import EmotionManager

router = APIRouter(prefix="/api/v1/persona-emotions", tags=["Persona Emotions"])
_emotion_manager = EmotionManager()


@router.get("/engines")
async def list_engines(user: User = Depends(get_current_user)):
    return {"engines": _emotion_manager.list_engines()}


class ModifiersResponse(BaseModel):
    persona_id: str
    emotion: str
    frequency_mod: float
    emoji_mod: float
    length_mod: float
    label: str


@router.get("/modifiers/{persona_id}")
async def get_modifiers(persona_id: str, user: User = Depends(get_current_user)):
    mods = _emotion_manager.get_modifiers(persona_id)
    return {"persona_id": persona_id, "modifiers": mods}


@router.get("/history/{persona_id}")
async def get_history(persona_id: str, limit: int = 20, user: User = Depends(get_current_user)):
    return {"persona_id": persona_id, "history": _emotion_manager.get_state_history(persona_id, limit)}


class ShiftRequest(BaseModel):
    state: str
    reason: str = "manual"


@router.post("/shift/{persona_id}")
async def shift_state(persona_id: str, body: ShiftRequest, user: User = Depends(get_current_user)):
    valid_states = ["neutral", "excited", "analytical", "cautious", "combative", "inspired", "skeptical"]
    if body.state not in valid_states:
        raise HTTPException(status_code=400, detail=f"Invalid state. Valid: {valid_states}")
    _emotion_manager.shift_to(persona_id, body.state, body.reason)
    return {"persona_id": persona_id, "state": body.state, "reason": body.reason}


@router.post("/process/{persona_id}")
async def process_content(persona_id: str, text: str, group_id: str = "",
                          user: User = Depends(get_current_user)):
    _emotion_manager.process_content(text, group_id, persona_id)
    return {"persona_id": persona_id, "status": "processed"}


@router.post("/reset/{persona_id}")
async def reset_engine(persona_id: str, user: User = Depends(get_current_user)):
    engine = _emotion_manager.get_engine(persona_id)
    engine.reset()
    return {"persona_id": persona_id, "state": "neutral"}
