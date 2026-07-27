"""Persona Import/Export & Versioning API — template exchange and version history."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.db.session import get_db
from app.models import User
from telegram_layer.src.actions.persona_templates import persona_serializer, persona_versioning, TEMPLATE_MARKETPLACE

router = APIRouter(prefix="/api/v1/persona-templates", tags=["Persona Templates"])


class ExportRequest(BaseModel):
    persona_dict: dict


@router.post("/export")
async def export_persona(body: ExportRequest, user: User = Depends(get_current_user)):
    return persona_serializer.export_persona(body.persona_dict)


class ImportRequest(BaseModel):
    data: dict


@router.post("/import")
async def import_persona(body: ImportRequest, user: User = Depends(get_current_user)):
    errors = persona_serializer.validate_persona(body.data.get("persona", body.data))
    if errors:
        raise HTTPException(status_code=400, detail={"validation_errors": errors})
    result = persona_serializer.import_persona(body.data)
    return {"persona": result}


@router.get("/marketplace")
async def list_marketplace(category: Optional[str] = None, user: User = Depends(get_current_user)):
    templates = TEMPLATE_MARKETPLACE
    if category:
        templates = {k: v for k, v in templates.items() if v.get("category") == category}
    return {
        "total": len(templates),
        "categories": sorted(set(v.get("category", "general") for v in TEMPLATE_MARKETPLACE.values())),
        "templates": [
            {"id": tid, "name": t["name"], "description": t["description"],
             "category": t.get("category", "general"), "version": t.get("version", 1)}
            for tid, t in templates.items()
        ],
    }


@router.get("/marketplace/{template_id}")
async def get_marketplace_template(template_id: str, user: User = Depends(get_current_user)):
    t = TEMPLATE_MARKETPLACE.get(template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"id": template_id, **t}


@router.post("/snapshot/{persona_id}")
async def snapshot_persona(
    persona_id: int,
    reason: str = "manual_save",
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models import Persona
    from sqlalchemy import select
    r = await db.execute(select(Persona).where(Persona.id == persona_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    from app.api.v1.endpoints.personas import _persona_out
    persona_dict = _persona_out(p).model_dump()
    persona_versioning.snapshot(str(persona_id), persona_dict, reason)
    return {"persona_id": persona_id, "version": persona_versioning.get_current_version(str(persona_id)), "reason": reason}


@router.get("/versions/{persona_id}")
async def get_versions(persona_id: str, user: User = Depends(get_current_user)):
    return {"persona_id": persona_id, "versions": persona_versioning.get_versions(persona_id)}


@router.post("/rollback/{persona_id}/{version}")
async def rollback_persona(persona_id: str, version: int, user: User = Depends(get_current_user)):
    data = persona_versioning.rollback(persona_id, version)
    if not data:
        raise HTTPException(status_code=404, detail=f"Version {version} not found")
    return {"persona_id": persona_id, "version": version, "data": data}
