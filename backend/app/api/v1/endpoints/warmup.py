"""Warmup API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db, async_session_factory
from app.dependencies import get_current_user
from app.models import User, WarmupJob, WarmupJobStatus
from app.telegram_layer.booster import TelegramBooster

router = APIRouter(prefix="/warmup", tags=["Warmup Engine"])


class StartWarmupRequest(BaseModel):
    account_ids: List[str] = Field(..., description="List of account IDs to warm")
    duration_days: int = Field(7, ge=1, le=90)
    interval_min: int = Field(30, ge=5)
    interval_max: int = Field(120, ge=10)
    actions: Optional[List[str]] = None
    partner_accounts: Optional[List[str]] = None


class StopWarmupRequest(BaseModel):
    account_ids: List[str] = Field(..., description="List of account IDs to stop warming")


@router.post("/start", status_code=status.HTTP_200_OK)
async def start_warmup(
    payload: StartWarmupRequest,
    current_user: User = Depends(get_current_user),
):
    """Start background MTProto warming loops for specified accounts."""
    job_ids = await TelegramBooster.start(
        account_ids=payload.account_ids,
        duration_days=payload.duration_days,
        interval_min=payload.interval_min,
        interval_max=payload.interval_max,
        actions=payload.actions,
        partner_accounts=payload.partner_accounts,
    )
    return {
        "status": "started",
        "job_ids": job_ids,
        "count": len(job_ids),
        "message": f"Started {len(job_ids)} warming jobs successfully.",
    }


@router.post("/stop", status_code=status.HTTP_200_OK)
async def stop_warmup(
    payload: StopWarmupRequest,
    current_user: User = Depends(get_current_user),
):
    """Stop active warming jobs for specified accounts."""
    stopped = await TelegramBooster.stop(payload.account_ids)
    return {
        "status": "stopped",
        "stopped_count": stopped,
        "message": f"Stopped {stopped} warming jobs.",
    }


@router.get("/jobs")
async def list_warmup_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all account warmup jobs and their live progress."""
    result = await db.execute(
        select(WarmupJob).order_by(WarmupJob.started_at.desc()).limit(100)
    )
    jobs = result.scalars().all()
    return {
        "jobs": [
            {
                "id": j.id,
                "account_id": j.account_id,
                "status": j.status,
                "duration_days": j.duration_days,
                "interval_range": f"{j.interval_min}-{j.interval_max}s",
                "actions": j.actions,
                "actions_completed": j.actions_completed,
                "logs": j.logs or [],
                "failure_reason": j.failure_reason,
                "started_at": j.started_at.isoformat() if j.started_at else None,
                "last_action_at": j.last_action_at.isoformat() if j.last_action_at else None,
                "ends_at": j.ends_at.isoformat() if j.ends_at else None,
                "stopped_at": j.stopped_at.isoformat() if j.stopped_at else None,
                "completed_at": j.completed_at.isoformat() if j.completed_at else None,
            }
            for j in jobs
        ],
        "total": len(jobs),
    }


@router.get("/jobs/{job_id}")
async def get_warmup_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch details and logs for a single warmup job."""
    job = await db.get(WarmupJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Warmup job not found")
    return {
        "id": job.id,
        "account_id": job.account_id,
        "status": job.status,
        "duration_days": job.duration_days,
        "actions": job.actions,
        "actions_completed": job.actions_completed,
        "logs": job.logs or [],
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "ends_at": job.ends_at.isoformat() if job.ends_at else None,
    }
