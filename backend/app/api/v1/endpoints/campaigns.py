"""Campaign management endpoints — real DB CRUD with tenant isolation."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import CampaignCreate, CampaignUpdate, CampaignOut, PaginatedResponse
from app.db.session import get_db
from app.models import Campaign, Conversation, User
from app.dependencies import get_current_user_tenant

router = APIRouter(redirect_slashes=False)


async def _require_own_campaign(db: AsyncSession, campaign: Campaign, current_user: User):
    """Verify tenant ownership: user owns the campaign OR is admin."""
    if current_user.role != "admin" and campaign.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: you can only manage your own campaigns")


def _campaign_out(c) -> CampaignOut:
    return CampaignOut(
        id=c.id, name=c.name, description=c.description, campaign_type=c.campaign_type,
        status=c.status, config=c.config or {}, target_groups=c.target_groups or [],
        allowed_hours=c.allowed_hours or [], timezone=c.timezone,
        persona_ids=c.persona_ids or [], created_by=c.created_by,
        created_at=c.created_at,
    )


@router.get("", response_model=PaginatedResponse, tags=["Campaigns"])
@router.get("/", response_model=PaginatedResponse, tags=["Campaigns"])
async def list_campaigns(
    page: int = 1,
    page_size: int = 20,
    status_filter: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """List campaigns. Admins see all; regular users see only their own."""
    q = select(func.count(Campaign.id))
    if current_user.role != "admin":
        q = q.where(Campaign.user_id == current_user.id)
    if status_filter:
        q = q.where(Campaign.status == status_filter)
    result = await db.execute(q)
    total = result.scalar() or 0

    q2 = select(Campaign).order_by(Campaign.id.desc())
    if current_user.role != "admin":
        q2 = q2.where(Campaign.user_id == current_user.id)
    if status_filter:
        q2 = q2.where(Campaign.status == status_filter)
    q2 = q2.offset((page - 1) * page_size).limit(page_size)
    r = await db.execute(q2)
    items = r.scalars().all()
    return PaginatedResponse(
        items=[_campaign_out(i) for i in items], total=total, page=page,
        page_size=page_size, total_pages=max(1, (total + page_size - 1) // page_size),
    )


@router.post("", response_model=CampaignOut, status_code=status.HTTP_201_CREATED, tags=["Campaigns"])
@router.post("/", response_model=CampaignOut, status_code=status.HTTP_201_CREATED, tags=["Campaigns"])
async def create_campaign(
    body: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Create a new campaign (owned by current user)."""
    campaign = Campaign(
        user_id=current_user.id,
        name=body.name,
        description=body.description,
        campaign_type=body.campaign_type,
        status="draft",
        config=body.config or {},
        target_groups=body.target_groups or [],
        allowed_hours=body.allowed_hours or [],
        timezone=body.timezone,
        persona_ids=body.persona_ids or [],
        created_at=datetime.utcnow(),
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return _campaign_out(campaign)


@router.get("/{campaign_id}", response_model=CampaignOut, tags=["Campaigns"])
async def get_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Get campaign details (tenant-isolated)."""
    r = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    c = r.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    await _require_own_campaign(db, c, current_user)
    return _campaign_out(c)


@router.put("/{campaign_id}", response_model=CampaignOut, tags=["Campaigns"])
async def update_campaign(
    campaign_id: int,
    body: CampaignUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Update campaign (tenant-isolated)."""
    r = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    c = r.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    await _require_own_campaign(db, c, current_user)
    if body.name is not None: c.name = body.name
    if body.description is not None: c.description = body.description
    if body.status is not None: c.status = body.status
    if body.config is not None: c.config = body.config
    if body.target_groups is not None: c.target_groups = body.target_groups
    if body.allowed_hours is not None: c.allowed_hours = body.allowed_hours
    if body.persona_ids is not None: c.persona_ids = body.persona_ids
    c.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(c)
    return _campaign_out(c)


@router.delete("/{campaign_id}", tags=["Campaigns"])
async def delete_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Delete a campaign (tenant-isolated)."""
    r = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    c = r.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    await _require_own_campaign(db, c, current_user)
    await db.delete(c)
    await db.commit()
    return {"message": f"Campaign {campaign_id} deleted"}


@router.post("/{campaign_id}/start", tags=["Campaigns"])
async def start_campaign(
    request: Request,
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Start a campaign (tenant-isolated). Executes first tick immediately."""
    r = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    c = r.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    await _require_own_campaign(db, c, current_user)

    executor = getattr(request.app.state, 'campaign_executor', None)
    if executor:
        result = await executor.execute_tick(c, db)

    c.status = "running"
    c.started_at = datetime.utcnow()
    await db.commit()
    return {"message": f"Campaign {campaign_id} started", "status": "running", "tick": result if executor else "no executor"}


@router.post("/{campaign_id}/pause", tags=["Campaigns"])
async def pause_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Pause a campaign (tenant-isolated)."""
    r = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    c = r.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    await _require_own_campaign(db, c, current_user)
    c.status = "paused"
    await db.commit()
    return {"message": f"Campaign {campaign_id} paused", "status": "paused"}


@router.post("/{campaign_id}/stop", tags=["Campaigns"])
async def stop_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Stop a campaign (tenant-isolated)."""
    r = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    c = r.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    await _require_own_campaign(db, c, current_user)
    c.status = "stopped"
    await db.commit()
    return {"message": f"Campaign {campaign_id} stopped", "status": "stopped"}


@router.get("/{campaign_id}/conversations", tags=["Campaigns"])
async def list_campaign_conversations(
    campaign_id: int,
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """List conversations for a campaign (tenant-isolated)."""
    r = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    c = r.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    await _require_own_campaign(db, c, current_user)
    q = select(Conversation).where(Conversation.campaign_id == campaign_id).order_by(Conversation.created_at.desc())
    total_q = await db.execute(select(func.count(Conversation.id)).where(Conversation.campaign_id == campaign_id))
    total = total_q.scalar() or 0
    q = q.offset((page - 1) * page_size).limit(page_size)
    r = await db.execute(q)
    items = r.scalars().all()
    return {
        "items": [
            {
                "id": i.id, "group_id": i.group_id, "message_id": i.message_id,
                "status": i.status, "response_text": i.response_text,
                "ai_model_used": i.ai_model_used, "quality_score": i.quality_score,
                "created_at": i.created_at.isoformat() if i.created_at else None,
            }
            for i in items
        ],
        "total": total, "page": page, "page_size": page_size,
    }


@router.get("/{campaign_id}/threads", tags=["Campaigns"])
async def list_campaign_threads(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """List threads for a campaign (tenant-isolated)."""
    r = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    c = r.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    await _require_own_campaign(db, c, current_user)
    q = select(Conversation).where(
        Conversation.campaign_id == campaign_id,
        Conversation.thread_parent_id.isnot(None),
    ).order_by(Conversation.created_at.desc()).limit(50)
    r = await db.execute(q)
    threads = r.scalars().all()
    return {"threads": [{"id": t.id, "parent_id": t.thread_parent_id, "status": t.status, "created_at": t.created_at.isoformat() if t.created_at else None} for t in threads]}
