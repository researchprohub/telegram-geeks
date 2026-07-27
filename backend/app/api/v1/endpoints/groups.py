"""Group management endpoints — real DB CRUD with tenant isolation."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from telethon.sessions import StringSession

from app.schemas import GroupCreate, GroupOut, PaginatedResponse
from app.db.session import get_db
from app.models import TelegramGroup, Account, User
from app.dependencies import get_current_user_tenant

router = APIRouter(redirect_slashes=False)


async def _require_own_group(db: AsyncSession, group: TelegramGroup, current_user: User):
    """Verify tenant ownership: user owns the group OR is admin."""
    if current_user.role != "admin" and group.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: you can only manage your own groups")


def _group_out(g) -> GroupOut:
    return GroupOut(
        id=g.id, chat_id=g.chat_id, title=g.title, group_type=g.group_type,
        member_count=g.member_count, niche_tags=g.niche_tags or [],
        language=g.language, safety_score=g.safety_score, created_at=g.created_at,
    )


@router.get("", response_model=PaginatedResponse, tags=["Groups"])
@router.get("/", response_model=PaginatedResponse, tags=["Groups"])
async def list_groups(
    page: int = 1,
    page_size: int = 20,
    group_type: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """List groups. Admins see all; regular users see only their own."""
    q = select(func.count(TelegramGroup.id))
    if current_user.role != "admin":
        q = q.where(TelegramGroup.user_id == current_user.id)
    if group_type:
        q = q.where(TelegramGroup.group_type == group_type)
    result = await db.execute(q)
    total = result.scalar() or 0

    q2 = select(TelegramGroup).order_by(TelegramGroup.id.desc())
    if current_user.role != "admin":
        q2 = q2.where(TelegramGroup.user_id == current_user.id)
    if group_type:
        q2 = q2.where(TelegramGroup.group_type == group_type)
    q2 = q2.offset((page - 1) * page_size).limit(page_size)
    r = await db.execute(q2)
    items = r.scalars().all()
    return PaginatedResponse(
        items=[_group_out(i) for i in items], total=total, page=page,
        page_size=page_size, total_pages=max(1, (total + page_size - 1) // page_size),
    )


@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED, tags=["Groups"])
@router.post("/", response_model=GroupOut, status_code=status.HTTP_201_CREATED, tags=["Groups"])
async def create_group(
    body: GroupCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Register a new Telegram group (owned by current user)."""
    group = TelegramGroup(
        user_id=current_user.id,
        chat_id=body.chat_id,
        title=body.title,
        group_type=body.group_type,
        member_count=body.member_count,
        niche_tags=body.niche_tags or [],
        language=body.language,
        safety_score=100.0,
        created_at=datetime.utcnow(),
    )
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return _group_out(group)


@router.get("/{group_id}", response_model=GroupOut, tags=["Groups"])
async def get_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Get group details (tenant-isolated)."""
    r = await db.execute(select(TelegramGroup).where(TelegramGroup.id == group_id))
    g = r.scalar_one_or_none()
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    await _require_own_group(db, g, current_user)
    return _group_out(g)


@router.delete("/{group_id}", tags=["Groups"])
async def delete_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Delete a group (tenant-isolated)."""
    r = await db.execute(select(TelegramGroup).where(TelegramGroup.id == group_id))
    g = r.scalar_one_or_none()
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    await _require_own_group(db, g, current_user)
    await db.delete(g)
    await db.commit()
    return {"message": f"Group {group_id} deleted"}


@router.post("/{group_id}/scrape-members", tags=["Groups"])
async def scrape_members(
    group_id: int,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Scrape members of a group using user's best account."""
    r = await db.execute(select(TelegramGroup).where(TelegramGroup.id == group_id))
    g = r.scalar_one_or_none()
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    await _require_own_group(db, g, current_user)

    ar = await db.execute(
        select(Account).where(
            Account.user_id == current_user.id,
            Account.status == "active",
            Account.session_string.isnot(None),
        ).order_by(Account.trust_score.desc()).limit(1)
    )
    best = ar.scalar_one_or_none()
    if not best:
        return {"message": "No active account with session available", "members_count": 0}

    members = []
    try:
        from telethon import TelegramClient
        client = TelegramClient(
            StringSession(best.session_string),
            best.api_id or 12345678,
            best.api_hash or "",
        )
        await client.connect()
        if not await client.is_user_authorized():
            return {"message": "Account not authorized", "members_count": 0}

        participants = await client.get_participants(g.chat_id, limit=limit)
        members = [
            {
                "user_id": p.id,
                "username": p.username,
                "first_name": p.first_name,
                "last_name": p.last_name,
                "phone": p.phone,
            }
            for p in participants
        ]
        g.member_count = len(members)
        await db.commit()
        await client.disconnect()
    except Exception as e:
        logger.error(f"Scrape error: {e}")
        return {"message": f"Scrape failed: {str(e)}", "members_count": 0}

    return {"message": f"Scraped {len(members)} members", "members_count": len(members), "members": members[:50]}


@router.post("/{group_id}/analyze", tags=["Groups"])
async def analyze_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Analyze a group (tenant-isolated)."""
    r = await db.execute(select(TelegramGroup).where(TelegramGroup.id == group_id))
    g = r.scalar_one_or_none()
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    await _require_own_group(db, g, current_user)
    return {
        "group_id": group_id,
        "title": g.title,
        "member_count": g.member_count,
        "safety_score": g.safety_score,
        "niche_tags": g.niche_tags or [],
    }
