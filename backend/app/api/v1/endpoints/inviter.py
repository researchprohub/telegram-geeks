"""Inviter API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models import User, InviteJob, InviteLog
from app.telegram_layer.inviter import TelegramInviter

router = APIRouter(prefix="/inviter", tags=["Inviter Engine"])


class StartInviteRequest(BaseModel):
    target_group: str = Field(..., description="Target group or channel link/username")
    user_ids: List[int] = Field(..., description="List of target Telegram user IDs")
    method: str = Field("standard", description="Invite method: standard | admin | link")
    account_ids: Optional[List[str]] = None
    delay_min: int = Field(15, ge=1)
    delay_max: int = Field(60, ge=2)
    max_per_account: int = Field(40, ge=1, le=200)


class GenerateInviteLinkRequest(BaseModel):
    target_group: str = Field(..., description="Target group or channel link/username")
    account_id: Optional[str] = None
    uses_limit: int = Field(0, ge=0)


@router.post("/invite", status_code=status.HTTP_200_OK)
async def start_invite(
    payload: StartInviteRequest,
    current_user: User = Depends(get_current_user),
):
    """Launch multi-account invite batch with safe concurrency and FloodWait bus."""
    result = await TelegramInviter.invite(
        target_group=payload.target_group,
        user_ids=payload.user_ids,
        method=payload.method,
        account_ids=payload.account_ids,
        delay_min=payload.delay_min,
        delay_max=payload.delay_max,
        max_per_account=payload.max_per_account,
    )
    return result


@router.get("/jobs")
async def list_invite_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List recent and running invite jobs with live progress."""
    result = await db.execute(
        select(InviteJob).order_by(InviteJob.started_at.desc()).limit(100)
    )
    jobs = result.scalars().all()
    return {
        "jobs": [
            {
                "id": j.id,
                "target_group": j.target_group,
                "method": j.method,
                "status": j.status,
                "total_targets": j.total_targets,
                "invited": j.invited,
                "failed": j.failed,
                "progress_pct": round(
                    (j.invited + j.failed) / max(j.total_targets, 1) * 100
                ),
                "started_at": j.started_at.isoformat() if j.started_at else None,
                "completed_at": j.completed_at.isoformat() if j.completed_at else None,
            }
            for j in jobs
        ],
        "total": len(jobs),
    }


@router.post("/invite-link", status_code=status.HTTP_200_OK)
async def generate_invite_link(
    payload: GenerateInviteLinkRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate and export a Telegram group/channel invite link."""
    result = await TelegramInviter.generate_invite_link(
        target_group=payload.target_group,
        account_id=payload.account_id,
        uses_limit=payload.uses_limit,
    )
    return result
