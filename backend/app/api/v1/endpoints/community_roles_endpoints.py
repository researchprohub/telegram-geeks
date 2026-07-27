from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.models import User
from telegram_layer.src.actions.persona_emotions import CommunityRoleManager, COMMUNITY_ROLES

router = APIRouter(prefix="/api/v1/community-roles", tags=["Community Roles"])
_role_managers: dict[str, CommunityRoleManager] = {}


def _get_rm(group_id: str) -> CommunityRoleManager:
    if group_id not in _role_managers:
        _role_managers[group_id] = CommunityRoleManager(group_id)
    return _role_managers[group_id]


class AssignRequest(BaseModel):
    persona_id: str
    role: str


@router.post("/assign/{group_id}")
async def assign_role(group_id: str, body: AssignRequest, user: User = Depends(get_current_user)):
    rm = _get_rm(group_id)
    result = rm.assign(body.persona_id, body.role)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"group_id": group_id, **result}


@router.delete("/unassign/{group_id}/{persona_id}")
async def unassign_role(group_id: str, persona_id: str, user: User = Depends(get_current_user)):
    rm = _get_rm(group_id)
    ok = rm.unassign(persona_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Persona not found in group")
    return {"group_id": group_id, "persona_id": persona_id, "unassigned": True}


@router.get("/get/{group_id}/{persona_id}")
async def get_role(group_id: str, persona_id: str, user: User = Depends(get_current_user)):
    rm = _get_rm(group_id)
    entry = rm.get(persona_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Persona not found in group")
    return {"group_id": group_id, **entry}


class SuggestRequest(BaseModel):
    available_personas: list[str]


@router.post("/suggest/{group_id}")
async def auto_suggest(group_id: str, body: SuggestRequest, user: User = Depends(get_current_user)):
    rm = _get_rm(group_id)
    suggestions = rm.auto_suggest(body.available_personas)
    return {"group_id": group_id, "suggestions": suggestions}


class RecordActionRequest(BaseModel):
    action: str  # post | reply | reaction


@router.post("/record/{group_id}/{persona_id}")
async def record_action(group_id: str, persona_id: str, body: RecordActionRequest,
                        user: User = Depends(get_current_user)):
    rm = _get_rm(group_id)
    rm.record_action(persona_id, body.action)
    return {"group_id": group_id, "persona_id": persona_id, "action": body.action}


@router.get("/report/{group_id}")
async def get_report(group_id: str, user: User = Depends(get_current_user)):
    rm = _get_rm(group_id)
    return rm.get_report()


@router.get("/roles")
async def list_roles(user: User = Depends(get_current_user)):
    return {"roles": COMMUNITY_ROLES}
