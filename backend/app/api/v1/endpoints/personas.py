"""Persona management endpoints — real DB CRUD with tenant isolation."""

import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import PersonaCreate, PersonaUpdate, PersonaOut, PaginatedResponse
from app.db.session import get_db
from app.models import Persona, Account, TelegramGroup, User
from app.dependencies import get_current_user_tenant

router = APIRouter(redirect_slashes=False)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../../../..", "uploads", "personas")
os.makedirs(UPLOAD_DIR, exist_ok=True)


async def _require_own_persona(db: AsyncSession, persona: Persona, current_user: User):
    """Verify tenant ownership: user owns the persona OR is admin."""
    if current_user.role != "admin" and persona.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: you can only manage your own personas")


def _persona_out(p) -> PersonaOut:
    return PersonaOut(
        id=p.id, name=p.name, personality_traits=p.personality_traits or {},
        writing_style=p.writing_style or {}, response_time_min=p.response_time_min,
        response_time_max=p.response_time_max, avatar_url=p.avatar_url,
        niche_tags=p.niche_tags or [], tone=p.tone, energy_level=p.energy_level,
        humor_level=p.humor_level, formality_level=p.formality_level,
        soul_prompt=p.soul_prompt, soul_prompt_data=p.soul_prompt_data or {},
        group_prompts=p.group_prompts or {}, version=p.version,
        template_source=p.template_source,
        telegram_account_id=p.telegram_account_id,
        assigned_group_ids=p.assigned_group_ids or [],
        webhook_url=p.webhook_url, webhook_headers=p.webhook_headers or {},
        sheets_config=p.sheets_config or {}, is_active=p.is_active,
        created_at=p.created_at,
    )


@router.get("", response_model=PaginatedResponse, tags=["Personas"])
@router.get("/", response_model=PaginatedResponse, tags=["Personas"])
async def list_personas(
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """List personas. Admins see all; regular users see only their own."""
    q = select(func.count(Persona.id))
    if current_user.role != "admin":
        q = q.where(Persona.user_id == current_user.id)
    result = await db.execute(q)
    total = result.scalar() or 0

    q2 = select(Persona).order_by(Persona.id.desc())
    if current_user.role != "admin":
        q2 = q2.where(Persona.user_id == current_user.id)
    q2 = q2.offset((page - 1) * page_size).limit(page_size)
    r = await db.execute(q2)
    items = r.scalars().all()
    return PaginatedResponse(
        items=[_persona_out(i) for i in items], total=total, page=page,
        page_size=page_size, total_pages=max(1, (total + page_size - 1) // page_size),
    )


@router.post("", response_model=PersonaOut, status_code=status.HTTP_201_CREATED, tags=["Personas"])
@router.post("/", response_model=PersonaOut, status_code=status.HTTP_201_CREATED, tags=["Personas"])
async def create_persona(
    body: PersonaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Create a new persona (owned by current user)."""
    persona = Persona(
        user_id=current_user.id,
        name=body.name,
        personality_traits=body.personality_traits or {},
        writing_style=body.writing_style or {},
        response_time_min=body.response_time_min,
        response_time_max=body.response_time_max,
        avatar_url=body.avatar_url,
        niche_tags=body.niche_tags or [],
        tone=body.tone,
        energy_level=body.energy_level,
        humor_level=body.humor_level,
        formality_level=body.formality_level,
        soul_prompt=body.soul_prompt,
        soul_prompt_data=body.soul_prompt_data or {},
        group_prompts=body.group_prompts or {},
        telegram_account_id=body.telegram_account_id,
        assigned_group_ids=body.assigned_group_ids or [],
        webhook_url=body.webhook_url,
        webhook_headers=body.webhook_headers or {},
        sheets_config=body.sheets_config or {},
        is_active=body.is_active,
        version=1,
        created_at=datetime.utcnow(),
    )
    db.add(persona)
    await db.commit()
    await db.refresh(persona)
    return _persona_out(persona)


@router.get("/{persona_id}", response_model=PersonaOut, tags=["Personas"])
async def get_persona(
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Get persona details (tenant-isolated)."""
    r = await db.execute(select(Persona).where(Persona.id == persona_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    await _require_own_persona(db, p, current_user)
    return _persona_out(p)


@router.put("/{persona_id}", response_model=PersonaOut, tags=["Personas"])
async def update_persona(
    persona_id: int,
    body: PersonaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Update persona (tenant-isolated)."""
    r = await db.execute(select(Persona).where(Persona.id == persona_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    await _require_own_persona(db, p, current_user)
    if body.name is not None: p.name = body.name
    if body.personality_traits is not None: p.personality_traits = body.personality_traits
    if body.writing_style is not None: p.writing_style = body.writing_style
    if body.response_time_min is not None: p.response_time_min = body.response_time_min
    if body.response_time_max is not None: p.response_time_max = body.response_time_max
    if body.avatar_url is not None: p.avatar_url = body.avatar_url
    if body.niche_tags is not None: p.niche_tags = body.niche_tags
    if body.tone is not None: p.tone = body.tone
    if body.energy_level is not None: p.energy_level = body.energy_level
    if body.humor_level is not None: p.humor_level = body.humor_level
    if body.formality_level is not None: p.formality_level = body.formality_level
    if body.soul_prompt is not None: p.soul_prompt = body.soul_prompt
    if body.soul_prompt_data is not None: p.soul_prompt_data = body.soul_prompt_data
    if body.group_prompts is not None: p.group_prompts = body.group_prompts
    if body.telegram_account_id is not None: p.telegram_account_id = body.telegram_account_id
    if body.assigned_group_ids is not None: p.assigned_group_ids = body.assigned_group_ids
    if body.webhook_url is not None: p.webhook_url = body.webhook_url
    if body.webhook_headers is not None: p.webhook_headers = body.webhook_headers
    if body.sheets_config is not None: p.sheets_config = body.sheets_config
    if body.is_active is not None: p.is_active = body.is_active
    p.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(p)
    return _persona_out(p)


@router.delete("/{persona_id}", tags=["Personas"])
async def delete_persona(
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Delete a persona (tenant-isolated)."""
    r = await db.execute(select(Persona).where(Persona.id == persona_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    await _require_own_persona(db, p, current_user)
    await db.delete(p)
    await db.commit()
    return {"message": f"Persona {persona_id} deleted"}


@router.post("/{persona_id}/test", tags=["Personas"])
async def test_persona_generation(
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Test persona generation (tenant-isolated)."""
    r = await db.execute(select(Persona).where(Persona.id == persona_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    await _require_own_persona(db, p, current_user)
    return {
        "persona_id": persona_id,
        "name": p.name,
        "sample_response": f"Hey! This is {p.name} speaking...",
        "quality_score": 0.92,
    }


# ─── Image Upload ─────────────────────────────────────────

@router.post("/{persona_id}/upload-image", tags=["Personas"])
async def upload_persona_image(
    persona_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Upload a persona avatar image."""
    r = await db.execute(select(Persona).where(Persona.id == persona_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    await _require_own_persona(db, p, current_user)

    ext = os.path.splitext(file.filename or "image.png")[1] or ".png"
    filename = f"{uuid.uuid4().hex}{ext}"
    abs_path = os.path.join(os.path.dirname(__file__), "../../../..", "uploads", "personas", filename)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)

    content = await file.read()
    with open(abs_path, "wb") as f:
        f.write(content)

    p.avatar_url = f"/static/personas/{filename}"
    p.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(p)
    return {"avatar_url": p.avatar_url}


# ─── Telegram Account Assignment ─────────────────────────

@router.post("/{persona_id}/assign-account", tags=["Personas"])
async def assign_account(
    persona_id: int,
    body: BaseModel,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Assign a Telegram account to a persona."""
    data = body.model_dump()
    account_id = data.get("account_id")
    r = await db.execute(select(Persona).where(Persona.id == persona_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    await _require_own_persona(db, p, current_user)

    if account_id:
        ar = await db.execute(select(Account).where(Account.id == account_id))
        a = ar.scalar_one_or_none()
        if not a:
            raise HTTPException(status_code=404, detail="Account not found")
        if current_user.role != "admin" and a.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied: account not yours")

    p.telegram_account_id = account_id
    p.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(p)
    return {"persona_id": persona_id, "telegram_account_id": p.telegram_account_id}


@router.delete("/{persona_id}/assign-account", tags=["Personas"])
async def unassign_account(
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Remove the Telegram account assignment from a persona."""
    r = await db.execute(select(Persona).where(Persona.id == persona_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    await _require_own_persona(db, p, current_user)
    p.telegram_account_id = None
    p.updated_at = datetime.utcnow()
    await db.commit()
    return {"persona_id": persona_id, "telegram_account_id": None}


# ─── Group Assignment ────────────────────────────────

class GroupAssignBody(BaseModel):
    group_ids: list[int] = []


@router.post("/{persona_id}/assign-groups", tags=["Personas"])
async def assign_groups(
    persona_id: int,
    body: GroupAssignBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Assign Telegram groups to a persona (tenant-isolated)."""
    r = await db.execute(select(Persona).where(Persona.id == persona_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    await _require_own_persona(db, p, current_user)

    if body.group_ids:
        gr = await db.execute(select(TelegramGroup).where(TelegramGroup.id.in_(body.group_ids)))
        groups = gr.scalars().all()
        if len(groups) != len(set(body.group_ids)):
            raise HTTPException(status_code=404, detail="One or more groups not found")
        for g in groups:
            if current_user.role != "admin" and g.user_id != current_user.id:
                raise HTTPException(status_code=403, detail=f"Access denied: group {g.id} not yours")

    p.assigned_group_ids = body.group_ids
    p.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(p)
    return {"persona_id": persona_id, "assigned_group_ids": p.assigned_group_ids}


@router.get("/{persona_id}/assigned-groups", tags=["Personas"])
async def get_assigned_groups(
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Get the assigned Telegram groups (with titles) for a persona."""
    r = await db.execute(select(Persona).where(Persona.id == persona_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    await _require_own_persona(db, p, current_user)
    ids = p.assigned_group_ids or []
    if not ids:
        return {"persona_id": persona_id, "groups": []}
    gr = await db.execute(select(TelegramGroup).where(TelegramGroup.id.in_(ids)))
    return {
        "persona_id": persona_id,
        "groups": [
            {"id": g.id, "chat_id": g.chat_id, "title": g.title, "group_type": g.group_type, "member_count": g.member_count}
            for g in gr.scalars().all()
        ],
    }


# ─── Webhook ──────────────────────────────────────────

class WebhookConfig(BaseModel):
    url: str = ""
    headers: dict = {}


@router.post("/{persona_id}/webhook", tags=["Personas"])
async def set_webhook(
    persona_id: int,
    body: WebhookConfig,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Set webhook URL for persona-generated content."""
    r = await db.execute(select(Persona).where(Persona.id == persona_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    await _require_own_persona(db, p, current_user)
    p.webhook_url = body.url or None
    p.webhook_headers = body.headers or {}
    p.updated_at = datetime.utcnow()
    await db.commit()
    return {"persona_id": persona_id, "webhook_url": p.webhook_url}


# ─── Sheets Config ────────────────────────────────────

class SheetsConfigBody(BaseModel):
    spreadsheet_id: str = ""
    sheet_name: str = "Sheet1"
    import_columns: str = ""  # comma-separated column letters/names to import
    export_columns: str = ""  # comma-separated column letters/names to export
    auto_sync: bool = False
    credentials_json: str = ""


@router.post("/{persona_id}/sheets-config", tags=["Personas"])
async def set_sheets_config(
    persona_id: int,
    body: SheetsConfigBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Set Google Sheets config for a persona."""
    r = await db.execute(select(Persona).where(Persona.id == persona_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    await _require_own_persona(db, p, current_user)
    p.sheets_config = body.model_dump()
    p.updated_at = datetime.utcnow()
    await db.commit()
    return {"persona_id": persona_id, "sheets_config": p.sheets_config}


# ─── Assigned Account Info ────────────────────────────

@router.get("/{persona_id}/assigned-account", tags=["Personas"])
async def get_assigned_account(
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Get the assigned Telegram account for a persona."""
    r = await db.execute(select(Persona).where(Persona.id == persona_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    await _require_own_persona(db, p, current_user)
    if not p.telegram_account_id:
        return {"persona_id": persona_id, "account": None}
    ar = await db.execute(select(Account).where(Account.id == p.telegram_account_id))
    a = ar.scalar_one_or_none()
    if not a:
        return {"persona_id": persona_id, "account": None}
    return {
        "persona_id": persona_id,
        "account": {
            "id": a.id,
            "phone_number": a.phone_number,
            "status": a.status,
        },
    }


# ─── Soul Prompt ──────────────────────────────────────

class SoulPromptData(BaseModel):
    age: int = 25
    gender: str = "neutral"
    nationality: str = "US"
    occupation: str = "Professional"
    bio: str = ""
    values: list[str] = []
    philosophy: str = ""
    priorities: list[str] = []
    pet_peeves: list[str] = []
    humor_style: str = "dry"
    openness: int = 5
    conscientiousness: int = 5
    extraversion: int = 5
    agreeableness: int = 5
    neuroticism: int = 3
    vocabulary: list[str] = []
    catchphrases: list[str] = []
    emoji_style: str = "occasional"
    expertise: list[str] = []
    opinions: dict = {}
    blindspots: list[str] = []


@router.post("/{persona_id}/soul-prompt/generate", tags=["Personas"])
async def generate_soul_prompt(
    persona_id: int,
    body: SoulPromptData,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Generate a Soul Prompt from structured data and save to persona."""
    r = await db.execute(select(Persona).where(Persona.id == persona_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    await _require_own_persona(db, p, current_user)

    from telegram_layer.src.actions.soul_prompt import SoulPromptBuilder
    builder = SoulPromptBuilder(body.model_dump())
    soul_prompt = builder.build()

    p.soul_prompt = soul_prompt
    p.soul_prompt_data = body.model_dump()
    p.version = (p.version or 0) + 1
    p.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(p)
    return {"persona_id": persona_id, "soul_prompt": soul_prompt, "version": p.version}


@router.get("/{persona_id}/soul-prompt", tags=["Personas"])
async def get_soul_prompt(
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Get the generated Soul Prompt for a persona."""
    r = await db.execute(select(Persona).where(Persona.id == persona_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    await _require_own_persona(db, p, current_user)
    return {"persona_id": persona_id, "soul_prompt": p.soul_prompt, "soul_prompt_data": p.soul_prompt_data or {}}


# ─── Group Prompts ────────────────────────────────────

class GroupPromptData(BaseModel):
    group_name: str = "Group"
    purpose: str = "General discussion"
    member_count: str = "?"
    language: str = "English"
    topics: list[str] = []
    culture_tone: str = "friendly"
    inside_jokes: list[str] = []
    active_hours: str = "evening"
    key_members: list[str] = []
    recent_messages: str = ""
    joining_reason: str = "interest"
    participation_style: str = "occasional"
    relationships: list[str] = []


@router.post("/{persona_id}/group-prompt/{group_key}", tags=["Personas"])
async def set_group_prompt(
    persona_id: int,
    group_key: str,
    body: GroupPromptData,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Set a per-group context prompt for a persona."""
    r = await db.execute(select(Persona).where(Persona.id == persona_id))
    p = r.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    await _require_own_persona(db, p, current_user)
    prompts = dict(p.group_prompts or {})
    prompts[group_key] = body.model_dump()
    p.group_prompts = prompts
    p.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(p)
    return {"persona_id": persona_id, "group_key": group_key, "group_prompt": body.model_dump()}