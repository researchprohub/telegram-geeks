"""Persona Memory System API — 3-tier memory (short-term, long-term, episodic)."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.models import User
try:
    from telegram_layer.src.actions.persona_memory import memory_system
except ImportError:
    try:
        from app.telegram_layer.src.actions.persona_memory import memory_system
    except ImportError:
        class DummyMemorySystem:
            def remember_conversation(self, *a, **kw): pass
            def retrieve_context(self, *a, **kw): return {}
        memory_system = DummyMemorySystem()

router = APIRouter(prefix="/api/v1/persona-memory", tags=["Persona Memory"])


class MemoryRequest(BaseModel):
    persona_id: str
    group_id: str
    member: str
    message: str


@router.post("/remember")
async def remember(body: MemoryRequest, user: User = Depends(get_current_user)):
    memory_system.remember_conversation(body.persona_id, body.group_id, body.member, body.message)
    return {"status": "remembered"}


@router.get("/context/{persona_id}/{group_id}")
async def get_context(persona_id: str, group_id: str, topic: str = "", user: User = Depends(get_current_user)):
    ctx = memory_system.get_context_for_generation(persona_id, group_id, topic)
    return {"persona_id": persona_id, "group_id": group_id, "context": ctx}


class EpisodicRequest(BaseModel):
    persona_id: str
    group_id: str
    episode: dict


@router.post("/episodic/record")
async def record_episodic(body: EpisodicRequest, user: User = Depends(get_current_user)):
    memory_system.episodic.record(body.persona_id, body.group_id, body.episode)
    return {"status": "recorded"}


@router.get("/episodic/{persona_id}/{group_id}")
async def get_episodic(persona_id: str, group_id: str, limit: int = 10, user: User = Depends(get_current_user)):
    return {"episodes": memory_system.episodic.get_episodes(persona_id, group_id, limit)}


@router.delete("/{persona_id}")
async def clear_memory(persona_id: str, user: User = Depends(get_current_user)):
    memory_system.clear_persona(persona_id)
    return {"persona_id": persona_id, "cleared": True}
