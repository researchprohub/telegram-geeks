"""Persona Performance Analytics API."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.models import User
from telegram_layer.src.actions.persona_analytics import persona_analytics

router = APIRouter(prefix="/api/v1/persona-analytics", tags=["Persona Analytics"])


class AnalyticsEvent(BaseModel):
    persona_id: str
    event_type: str
    group_id: Optional[str] = None
    meta: Optional[dict] = {}


@router.post("/event")
async def record_event(body: AnalyticsEvent, user: User = Depends(get_current_user)):
    persona_analytics.record_event(body.persona_id, body.event_type, body.group_id, body.meta)
    return {"status": "recorded"}


@router.get("/metrics/{persona_id}")
async def get_metrics(persona_id: str, hours: Optional[int] = None, user: User = Depends(get_current_user)):
    return persona_analytics.get_metrics(persona_id, hours)


@router.get("/quality/{persona_id}")
async def get_quality(persona_id: str, user: User = Depends(get_current_user)):
    return persona_analytics.get_quality_score(persona_id)


@router.get("/group-breakdown/{persona_id}")
async def get_group_breakdown(persona_id: str, hours: Optional[int] = None, user: User = Depends(get_current_user)):
    return persona_analytics.get_group_breakdown(persona_id, hours)


class CompareRequest(BaseModel):
    persona_ids: list[str]
    hours: Optional[int] = None


@router.post("/compare")
async def compare(body: CompareRequest, user: User = Depends(get_current_user)):
    return persona_analytics.compare_personas(body.persona_ids, body.hours)


@router.get("/leaderboard")
async def leaderboard(hours: Optional[int] = None, user: User = Depends(get_current_user)):
    return {"leaderboard": persona_analytics.get_leaderboard(hours)}
