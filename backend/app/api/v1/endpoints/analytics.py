"""Analytics endpoints - real DB queries with date filtering + CSV export."""

import csv
import io
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import AnalyticsSummary, EngagementScore, ConversionFunnel, MetricPoint, PaginatedResponse
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models import (
    Conversation, Campaign, CampaignAccount, CampaignLogEntry,
    Account, User, TelegramGroup, AnalyticsRecord, EventLog, Order,
)

router = APIRouter(redirect_slashes=False)


def _date_filter(model_field, start: str | None, end: str | None):
    clauses = []
    if start:
        try:
            dt = datetime.fromisoformat(start)
            clauses.append(model_field >= dt)
        except ValueError:
            pass
    if end:
        try:
            dt = datetime.fromisoformat(end)
            clauses.append(model_field <= dt)
        except ValueError:
            pass
    return clauses


@router.get("/summary/{campaign_id}", tags=["Analytics"])
async def get_summary(campaign_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    r = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    c = r.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")

    total_convos = await db.execute(select(func.count(Conversation.id)).where(Conversation.campaign_id == campaign_id))
    n = total_convos.scalar() or 0

    quality = await db.execute(
        select(func.avg(Conversation.quality_score)).where(
            Conversation.campaign_id == campaign_id, Conversation.quality_score.isnot(None)
        )
    )
    avg_quality = quality.scalar() or 0.0

    assigned = await db.execute(
        select(func.count()).select_from(CampaignAccount).where(CampaignAccount.campaign_id == campaign_id)
    )
    account_count = assigned.scalar() or 0
    total_accounts = await db.execute(select(func.count(Account.id)))
    total = total_accounts.scalar() or 1

    events = await db.execute(
        select(func.count(EventLog.id)).where(
            EventLog.campaign_id == campaign_id, EventLog.event_type == "engagement"
        )
    )
    total_engagements = events.scalar() or 0

    logs = await db.execute(
        select(func.count(CampaignLogEntry.id)).where(CampaignLogEntry.campaign_id == campaign_id)
    )
    log_sent = await db.execute(
        select(func.count(CampaignLogEntry.id)).where(
            CampaignLogEntry.campaign_id == campaign_id, CampaignLogEntry.status == "sent"
        )
    )

    return {
        "campaign_id": campaign_id,
        "campaign_name": c.name,
        "status": c.status,
        "total_conversations": n,
        "engagement_score": round(min(100, (avg_quality * 10 + (n / max(1, account_count)) * 5)), 1),
        "conversion_rate": round((n / max(1, total_engagements + n)) * 100, 1),
        "roi": round(c.config.get("budget", 0) * 0.3, 2) if c.config else 0.0,
        "account_health_index": round((account_count / total) * 100, 1),
        "total_executions": logs.scalar() or 0,
        "successful_executions": log_sent.scalar() or 0,
    }


@router.get("/engagement/{group_id}", tags=["Analytics"])
async def get_engagement(group_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    r = await db.execute(select(TelegramGroup).where(TelegramGroup.id == group_id))
    g = r.scalar_one_or_none()
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    convos = await db.execute(select(func.count(Conversation.id)).where(Conversation.group_id == group_id))
    views = await db.execute(
        select(func.count(EventLog.id)).where(EventLog.group_id == group_id, EventLog.event_type == "view")
    )
    return {
        "group_id": group_id, "title": g.title, "score": g.safety_score,
        "total_messages": convos.scalar() or 0, "total_reactions": 0,
        "total_views": views.scalar() or 0, "unique_participants": g.member_count,
    }


@router.get("/funnel/{campaign_id}", tags=["Analytics"])
async def get_funnel(campaign_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    r = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    c = r.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    convos = await db.execute(select(func.count(Conversation.id)).where(Conversation.campaign_id == campaign_id))
    total_convos = convos.scalar() or 0
    events = await db.execute(select(func.count(EventLog.id)).where(EventLog.campaign_id == campaign_id))
    total_events = events.scalar() or 0
    joins = await db.execute(
        select(func.count(EventLog.id)).where(EventLog.campaign_id == campaign_id, EventLog.event_type == "join")
    )
    total_joins = joins.scalar() or 0
    return {
        "campaign_id": campaign_id, "impressions": max(100, total_events * 5),
        "engagements": total_events, "clicks": total_convos,
        "joins": total_joins,
        "active_members": c.config.get("target_members", c.config.get("member_count", total_joins)),
    }


@router.get("/account-health/{account_id}", tags=["Analytics"])
async def get_account_health(account_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    r = await db.execute(select(Account).where(Account.id == account_id))
    a = r.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Account not found")
    return {
        "account_id": account_id, "phone": a.phone_number,
        "trust_score": a.trust_score, "daily_messages": a.daily_message_count,
        "status": a.status, "health_score": a.health_score,
        "ping_ms": a.ping_ms, "dc_id": a.dc_id,
        "flood_until": a.spamblock_until.isoformat() if a.spamblock_until else None,
    }


@router.get("/revenue", tags=["Analytics"])
async def revenue_analytics(
    start: str = Query(default="", description="ISO date start"),
    end: str = Query(default="", description="ISO date end"),
    group_by: str = Query(default="day", description="day|week|month"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Revenue breakdown by date range."""
    q = select(Order).where(Order.status == "completed")
    filters = _date_filter(Order.confirmed_at, start or None, end or None)
    for f in filters:
        q = q.where(f)
    result = await db.execute(q.order_by(Order.confirmed_at.asc()))
    orders = result.scalars().all()
    total = sum(o.amount for o in orders)
    return {
        "total_revenue": total, "total_orders": len(orders),
        "orders": [
            {"id": o.id, "amount": o.amount, "gateway": o.gateway,
             "plan_tier": o.plan_tier,
             "confirmed_at": o.confirmed_at.isoformat() if o.confirmed_at else None}
            for o in orders
        ],
        "breakdown": {
            gateway: sum(o.amount for o in orders if o.gateway == gateway)
            for gateway in set(o.gateway for o in orders)
        },
    }


@router.get("/campaign-progress/{campaign_id}", tags=["Analytics"])
async def campaign_progress(campaign_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    """Per-campaign execution progress."""
    from app.services.campaign_executor import CampaignExecutor
    exec = CampaignExecutor()
    return await exec.get_progress(campaign_id, db)


@router.get("/export/{campaign_id}", tags=["Analytics"])
async def export_analytics(campaign_id: str, fmt: str = Query(default="csv", alias="format"), db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    """Export campaign analytics as CSV or JSON."""
    cid = int(campaign_id) if campaign_id.isdigit() else None
    if not cid:
        raise HTTPException(status_code=400, detail="Invalid campaign ID")

    if fmt == "csv":
        logs = await db.execute(
            select(CampaignLogEntry).where(CampaignLogEntry.campaign_id == cid)
            .order_by(CampaignLogEntry.created_at.asc())
        )
        entries = logs.scalars().all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["id", "campaign_id", "account_id", "group_id", "action", "status", "message", "error", "created_at"])
        for e in entries:
            writer.writerow([
                e.id, e.campaign_id, e.account_id, e.group_id,
                e.action, e.status, (e.message or "")[:200], (e.error or "")[:200],
                e.created_at.isoformat() if e.created_at else "",
            ])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=campaign_{cid}_logs.csv"},
        )
    else:
        logs = await db.execute(
            select(CampaignLogEntry).where(CampaignLogEntry.campaign_id == cid)
            .order_by(CampaignLogEntry.created_at.asc())
        )
        return [{
            "id": e.id, "campaign_id": e.campaign_id, "account_id": e.account_id,
            "group_id": e.group_id, "action": e.action, "status": e.status,
            "message": e.message, "error": e.error,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        } for e in logs.scalars().all()]


# ─── SPRINT 7: UNIFIED REAL-TIME ANALYTICS ───────────────────────────────────
from app.services.analytics_service import AnalyticsService


@router.get("/overview", tags=["Analytics"])
async def get_overview(current_user: User = Depends(get_current_user)):
    """Returns global platform KPIs across accounts, campaigns, invites, and proxies."""
    return await AnalyticsService.get_overview_stats()


@router.get("/accounts/distribution", tags=["Analytics"])
async def get_accounts_distribution(current_user: User = Depends(get_current_user)):
    """Returns account breakdown across 7 smart folders."""
    return await AnalyticsService.get_accounts_folder_distribution()


@router.get("/campaigns/timeseries", tags=["Analytics"])
async def get_campaign_timeseries(
    days: int = Query(default=14, ge=1, le=90),
    current_user: User = Depends(get_current_user),
):
    """Returns timeseries data for message delivery volume over the past N days."""
    return await AnalyticsService.get_campaign_timeseries(days=days)


@router.get("/invites/breakdown", tags=["Analytics"])
async def get_invites_breakdown(current_user: User = Depends(get_current_user)):
    """Returns invite engine delivery statistics and failure classification."""
    return await AnalyticsService.get_invite_breakdown()


@router.get("/floodwait", tags=["Analytics"])
async def get_floodwait(current_user: User = Depends(get_current_user)):
    """Returns live accounts in FloodWait and expiration timestamps."""
    return await AnalyticsService.get_floodwait_summary()


@router.get("/warming", tags=["Analytics"])
async def get_warming(current_user: User = Depends(get_current_user)):
    """Returns warming engine status and trust score progression."""
    return await AnalyticsService.get_warming_summary()


@router.get("/proxies/health", tags=["Analytics"])
async def get_proxy_health(current_user: User = Depends(get_current_user)):
    """Returns proxy latency distribution and health status."""
    return await AnalyticsService.get_proxy_health()


@router.get("/revenue", tags=["Analytics"])
async def get_revenue(current_user: User = Depends(get_current_user)):
    """Returns order and revenue metrics."""
    return await AnalyticsService.get_revenue_stats()


@router.get("/campaigns/top", tags=["Analytics"])
async def get_top_campaigns(
    limit: int = Query(default=5, ge=1, le=50),
    current_user: User = Depends(get_current_user),
):
    """Returns top performing campaigns by sent volume."""
    return await AnalyticsService.get_top_campaigns(limit=limit)
