"""Neuro-Text Engine endpoints — spintax templates, preview, GPT generation."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models import User, SpintaxTemplate
from app.schemas import SpintaxTemplateCreate, SpintaxTemplateOut, SpintaxPreviewRequest, SpintaxGenerateRequest
from app.services.neuro_text_bridge import NeuroTextBridge

router = APIRouter(tags=["Neuro-Text"])
bridge = NeuroTextBridge()


@router.get("/spintax-templates", response_model=list[SpintaxTemplateOut])
async def list_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(SpintaxTemplate).order_by(SpintaxTemplate.id.desc())
    if current_user.role != "admin":
        q = q.where(SpintaxTemplate.user_id == current_user.id)
    r = await db.execute(q)
    return r.scalars().all()


@router.post("/spintax-templates", response_model=SpintaxTemplateOut, status_code=201)
async def create_template(
    body: SpintaxTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tpl = SpintaxTemplate(user_id=current_user.id, name=body.name, template_text=body.template_text, tone=body.tone)
    db.add(tpl)
    await db.commit()
    await db.refresh(tpl)
    return tpl


@router.delete("/spintax-templates/{template_id}")
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = await db.execute(select(SpintaxTemplate).where(SpintaxTemplate.id == template_id))
    tpl = r.scalar_one_or_none()
    if not tpl:
        raise HTTPException(404, "Template not found")
    if current_user.role != "admin" and tpl.user_id != current_user.id:
        raise HTTPException(403, "Access denied")
    await db.delete(tpl)
    await db.commit()
    return {"ok": True}


@router.post("/spintax/preview")
async def preview_spintax(body: SpintaxPreviewRequest):
    return await bridge.preview(body.template, body.count)


@router.post("/spintax/generate")
async def generate_spintax(body: SpintaxGenerateRequest):
    return await bridge.generate(body.prompt, body.tone, body.persona_context, body.spin_count)
