"""Advanced Analytics API — Multi-dimensional reporting and insights."""

import asyncio
import csv
import json
import io
import math
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, PlainTextResponse
from pydantic import BaseModel
from typing import Optional, Any, List, Dict
from datetime import datetime, timedelta
from loguru import logger
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.db.session import get_db
from app.models import User, Account, Campaign, Conversation, TelegramGroup, EventLog, AnalyticsRecord

router = APIRouter(tags=["Advanced Analytics"])

# ponytail: in-memory alert store, swap to DB if persistence needed
_alerts_store: list[dict] = []
_alert_id_seq = 0

_ws_connections: dict[int, list[WebSocket]] = {}


class EngagementMetrics(BaseModel):
    total_messages: int = 0
    total_reactions: int = 0
    total_views: int = 0
    unique_participants: int = 0
    response_rate: float = 0.0
    avg_response_time_seconds: float = 0.0


class AccountHealthScore(BaseModel):
    account_id: str
    trust_score: float
    message_velocity: float
    ban_risk: float
    overall_score: float
    recommendations: List[str] = []


class CampaignInsight(BaseModel):
    campaign_id: str
    insight_type: str  # "positive_trend", "warning", "opportunity"
    message: str
    confidence: float
    suggested_action: Optional[str] = None


@router.get("/engagement-summary", tags=["Engagement"])
async def get_engagement_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get overall engagement summary across all accounts."""
    total = await db.execute(select(func.count(Account.id)))
    active = await db.execute(select(func.count(Account.id)).where(Account.status == "active"))
    msgs = await db.execute(select(func.count(Conversation.id)))
    total_accounts = total.scalar() or 0
    return {
        "total_accounts": total_accounts,
        "active_accounts": active.scalar() or 0,
        "total_messages_sent": msgs.scalar() or 0,
        "period": "last_30_days",
    }


@router.get("/account-health/{account_id}", tags=["Health"])
async def get_account_health(
    account_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed health score for an account."""
    r = await db.execute(select(Account).where(Account.id == account_id))
    a = r.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Account not found")

    recs = []
    if a.flood_wait_until:
        recs.append("Account is in flood wait — reduce message frequency")
    if a.trust_score < 50:
        recs.append("Low trust score — run warm-up cycles")
    if a.daily_message_count > 30:
        recs.append("High daily message count — consider slowing down")
    if not recs:
        recs = ["Maintain current activity level"]

    ban_risk = "high" if a.status == "banned" else "low"
    return {
        "account_id": account_id,
        "trust_score": a.trust_score,
        "message_velocity": round(min(1.0, a.daily_message_count / 50), 2),
        "ban_risk": ban_risk,
        "overall_score": round(min(100, a.trust_score * 0.7 + max(0, 50 - a.daily_message_count) * 0.3), 1),
        "recommendations": recs,
    }


@router.get("/ai-insights", tags=["AI Insights"])
async def get_ai_insights(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get AI-generated insights about account performance."""
    total = (await db.execute(select(func.count(Account.id)))).scalar() or 0
    flood = (await db.execute(
        select(func.count(Account.id)).where(Account.flood_wait_until.isnot(None))
    )).scalar() or 0
    low_trust = (await db.execute(
        select(func.count(Account.id)).where(Account.trust_score < 50)
    )).scalar() or 0
    insights = []
    if flood:
        insights.append({
            "type": "warning",
            "message": f"{flood} account(s) currently in flood wait.",
            "confidence": 0.9,
            "suggested_action": "Reduce message frequency for affected accounts.",
        })
    if low_trust:
        insights.append({
            "type": "warning",
            "message": f"{low_trust} account(s) have low trust scores.",
            "confidence": 0.85,
            "suggested_action": "Run warm-up cycles for low-trust accounts.",
        })
    if total and not flood and not low_trust:
        insights.append({
            "type": "positive_trend",
            "message": f"All {total} account(s) appear healthy.",
            "confidence": 0.8,
            "suggested_action": "Maintain current engagement patterns.",
        })
    if not insights:
        insights.append({
            "type": "info",
            "message": "No account data available yet.",
            "confidence": 1.0,
            "suggested_action": "Add accounts to start tracking.",
        })
    return {"insights": insights, "generated_at": datetime.now().isoformat()}


@router.get("/roi-calculator", tags=["Calculators"])
async def get_roi_calculator(
    messages_sent: int = 1000,
    conversions: int = 50,
    cost_per_account: float = 5.0,
    revenue_per_conversion: float = 25.0,
    total_accounts: int = 5,
    user: User = Depends(get_current_user),
):
    """Calculate campaign ROI."""
    from telegram_layer.src.actions.calculator_reports import CalculatorReportsService

    calc = CalculatorReportsService()
    roi = calc.calculate_roi(
        messages_sent, conversions, cost_per_account,
        revenue_per_conversion, total_accounts
    )
    return roi


@router.get("/engagement-score", tags=["Calculators"])
async def get_engagement_score(
    total_messages: int = 100,
    total_reactions: int = 50,
    total_views: int = 500,
    unique_participants: int = 30,
    total_members: int = 100,
    user: User = Depends(get_current_user),
):
    """Calculate engagement score 0-100."""
    from telegram_layer.src.actions.calculator_reports import CalculatorReportsService

    calc = CalculatorReportsService()
    score = calc.calculate_engagement_score(
        total_messages, total_reactions, total_views,
        unique_participants, total_members
    )
    return {"engagement_score": score, "max_score": 100}


@router.get("/performance-trend", tags=["Trends"])
async def get_performance_trend(
    days: int = 30,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get performance trend data for visualization."""
    since = datetime.utcnow() - timedelta(days=days)
    daily = await db.execute(
        select(
            func.date_trunc('day', Conversation.created_at).label('day'),
            func.count(Conversation.id).label('cnt'),
        ).where(Conversation.created_at >= since)
        .group_by(func.date_trunc('day', Conversation.created_at))
        .order_by(func.date_trunc('day', Conversation.created_at))
    )
    rows = daily.all()
    data_map = {str(r[0])[:10]: r[1] for r in rows} if rows else {}
    return {
        "period_days": days,
        "data_points": [
            {
                "date": (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d"),
                "messages": data_map.get((datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d"), 0),
                "reactions": 0,
                "new_contacts": 0,
            }
            for i in range(days)
        ],
    }


# ── Predictions ──────────────────────────────────────────────────────────

@router.get("/predictions", tags=["Analytics"])
async def get_predictions(
    metric: str = Query("messages", description="Metric to forecast"),
    days: int = Query(30, description="Historical days"),
    forecast_days: int = Query(7, description="Days to forecast"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Forecast metrics using linear regression on historical data."""
    since = datetime.utcnow() - timedelta(days=days)
    if metric == "messages":
        rows = (await db.execute(
            select(func.date_trunc('day', Conversation.created_at).label('day'),
                   func.count(Conversation.id).label('cnt'))
            .where(Conversation.created_at >= since)
            .group_by(func.date_trunc('day', Conversation.created_at))
        )).all()
    elif metric == "accounts":
        rows = (await db.execute(
            select(func.date_trunc('day', Account.created_at).label('day'),
                   func.count(Account.id).label('cnt'))
            .where(Account.created_at >= since)
            .group_by(func.date_trunc('day', Account.created_at))
        )).all()
    else:
        rows = (await db.execute(
            select(AnalyticsRecord.metric_name, AnalyticsRecord.metric_value, AnalyticsRecord.timestamp)
            .where(and_(AnalyticsRecord.metric_name == metric, AnalyticsRecord.timestamp >= since))
        )).all()

    data_map = {str(r[0])[:10]: int(r[1]) for r in rows} if rows else {}

    points = []
    for i in range(days):
        d = (datetime.utcnow() - timedelta(days=days - i - 1)).strftime("%Y-%m-%d")
        points.append({"date": d, "value": data_map.get(d, 0)})

    n = len(points)
    if n < 2:
        return {"historical": points, "forecast": [], "trend": "insufficient_data"}

    xs = list(range(n))
    ys = [p["value"] for p in points]
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    den = sum((x - mean_x) ** 2 for x in xs)
    slope = num / den if den else 0
    intercept = mean_y - slope * mean_x

    forecast = []
    for i in range(1, forecast_days + 1):
        pred = max(0, int(slope * (n + i) + intercept))
        d = (datetime.utcnow() + timedelta(days=i)).strftime("%Y-%m-%d")
        forecast.append({"date": d, "value": pred})

    trend = "up" if slope > 0.1 else "down" if slope < -0.1 else "stable"
    return {"historical": points, "forecast": forecast, "trend": trend, "slope": round(slope, 4)}


@router.get("/predictions/summary", tags=["Analytics"])
async def get_predictions_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Quick forecast summary across key metrics."""
    since = datetime.utcnow() - timedelta(days=30)
    today = datetime.utcnow().strftime("%Y-%m-%d")

    msg_rows = (await db.execute(
        select(func.date_trunc('day', Conversation.created_at).label('day'),
               func.count(Conversation.id).label('cnt'))
        .where(Conversation.created_at >= since)
        .group_by(func.date_trunc('day', Conversation.created_at))
    )).all()
    msg_map = {str(r[0])[:10]: int(r[1]) for r in msg_rows}

    n = max(len(msg_map), 1)
    vals = list(msg_map.values())
    avg = sum(vals) / n if vals else 0
    last_7 = sum(list(msg_map.values())[-7:]) if len(vals) >= 7 else sum(vals)
    prev_7 = sum(list(msg_map.values())[-14:-7]) if len(vals) >= 14 else 0

    projected = int(avg * 30)
    return {
        "daily_average": round(avg, 1),
        "last_7_total": last_7,
        "prev_7_total": prev_7,
        "projected_30_day": projected,
        "change_pct": round(((last_7 - prev_7) / max(prev_7, 1)) * 100, 1),
        "generated_at": datetime.utcnow().isoformat(),
    }


# ── Alerts ───────────────────────────────────────────────────────────────

class AlertCreate(BaseModel):
    metric: str
    condition: str  # gt | lt | eq
    threshold: float
    label: str = ""
    enabled: bool = True


@router.get("/alerts", tags=["Analytics"])
async def list_alerts(user: User = Depends(get_current_user)):
    return {"alerts": _alerts_store}


@router.post("/alerts", tags=["Analytics"])
async def create_alert(body: AlertCreate, user: User = Depends(get_current_user)):
    global _alert_id_seq
    _alert_id_seq += 1
    alert = {
        "id": _alert_id_seq,
        "metric": body.metric,
        "condition": body.condition,
        "threshold": body.threshold,
        "label": body.label or f"{body.metric} {body.condition} {body.threshold}",
        "enabled": body.enabled,
        "created_at": datetime.utcnow().isoformat(),
    }
    _alerts_store.append(alert)
    return alert


@router.delete("/alerts/{alert_id}", tags=["Analytics"])
async def delete_alert(alert_id: int, user: User = Depends(get_current_user)):
    global _alerts_store
    _alerts_store = [a for a in _alerts_store if a["id"] != alert_id]
    return {"ok": True}


# ── Charts ───────────────────────────────────────────────────────────────

@router.get("/charts/campaign-comparison", tags=["Analytics"])
async def chart_campaign_comparison(
    campaign_ids: str = Query("", description="Comma-separated campaign IDs"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Comparison bar chart data across campaigns."""
    ids = [int(x.strip()) for x in campaign_ids.split(",") if x.strip()]
    if not ids:
        c = (await db.execute(select(Campaign).limit(5))).scalars().all()
        ids = [x.id for x in c]

    datasets = []
    for cid in ids:
        r = await db.execute(select(Campaign).where(Campaign.id == cid))
        camp = r.scalar_one_or_none()
        if not camp:
            continue
        c = await db.execute(select(func.count(Conversation.id)).where(Conversation.campaign_id == cid))
        msgs = c.scalar() or 0
        e = await db.execute(select(func.count(EventLog.id)).where(EventLog.campaign_id == cid))
        evts = e.scalar() or 0
        datasets.append({
            "campaign_id": cid,
            "name": camp.name,
            "messages": msgs,
            "events": evts,
            "status": camp.status,
        })

    return {"type": "bar", "datasets": datasets}


@router.get("/charts/daily-trends", tags=["Analytics"])
async def chart_daily_trends(
    days: int = 30,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Daily line chart data for message volume."""
    since = datetime.utcnow() - timedelta(days=days)
    rows = (await db.execute(
        select(func.date_trunc('day', Conversation.created_at).label('day'),
               func.count(Conversation.id).label('cnt'))
        .where(Conversation.created_at >= since)
        .group_by(func.date_trunc('day', Conversation.created_at))
        .order_by(func.date_trunc('day', Conversation.created_at))
    )).all()

    data_map = {str(r[0])[:10]: int(r[1]) for r in rows} if rows else {}
    labels = [(datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days - 1, -1, -1)]

    return {
        "type": "line",
        "labels": labels,
        "datasets": [
            {"label": "Messages", "data": [data_map.get(d, 0) for d in labels]},
        ],
    }


@router.get("/charts/pie-account-status", tags=["Analytics"])
async def chart_account_status_pie(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pie chart of account status distribution."""
    rows = (await db.execute(
        select(Account.status, func.count(Account.id))
        .group_by(Account.status)
    )).all()
    return {
        "type": "pie",
        "labels": [r[0] for r in rows],
        "data": [int(r[1]) for r in rows],
    }


@router.get("/charts/account-health-histogram", tags=["Analytics"])
async def chart_health_histogram(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Histogram of account trust scores."""
    rows = (await db.execute(select(Account.trust_score).where(Account.trust_score.isnot(None)))).scalars().all()
    buckets = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    for s in rows:
        if s <= 20: buckets["0-20"] += 1
        elif s <= 40: buckets["21-40"] += 1
        elif s <= 60: buckets["41-60"] += 1
        elif s <= 80: buckets["61-80"] += 1
        else: buckets["81-100"] += 1
    return {"type": "histogram", "buckets": buckets}


# ── Comparisons ──────────────────────────────────────────────────────────

@router.get("/compare/periods", tags=["Analytics"])
async def compare_periods(
    period_a_days: int = Query(30, alias="a"),
    period_b_days: int = Query(7, alias="b"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Compare two time periods side by side."""
    async def _period_data(days_back: int):
        since = datetime.utcnow() - timedelta(days=days_back)
        m = await db.execute(
            select(func.count(Conversation.id))
            .where(Conversation.created_at >= since)
        )
        a = await db.execute(
            select(func.count(Account.id))
            .where(Account.created_at >= since)
        )
        return {"messages": m.scalar() or 0, "accounts": a.scalar() or 0}

    p_a = await _period_data(period_a_days)
    p_b = await _period_data(period_b_days)

    return {
        "period_a": {"label": f"Last {period_a_days}d", **p_a},
        "period_b": {"label": f"Last {period_b_days}d", **p_b},
        "growth": {
            "messages_pct": 0,
            "accounts_pct": 0,
        },
    }


# ── Export ───────────────────────────────────────────────────────────────

@router.get("/export/{campaign_id}", tags=["Analytics"])
async def export_analytics_data(
    campaign_id: int,
    format: str = Query("json", regex="^(json|csv)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export analytics data for a campaign as JSON or CSV."""
    r = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    camp = r.scalar_one_or_none()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    convos = (await db.execute(
        select(Conversation).where(Conversation.campaign_id == campaign_id)
    )).scalars().all()

    rows = []
    for c in convos:
        rows.append({
            "conversation_id": c.id,
            "group_id": c.group_id,
            "created_at": c.created_at.isoformat() if c.created_at else "",
            "quality_score": c.quality_score,
        })

    if format == "csv":
        output = io.StringIO()
        w = csv.DictWriter(output, fieldnames=["conversation_id", "group_id", "created_at", "quality_score"])
        w.writeheader()
        w.writerows(rows)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=campaign_{campaign_id}_export.csv"},
        )

    return {"campaign": {"id": camp.id, "name": camp.name}, "conversations": rows, "total": len(rows)}


@router.get("/export/all", tags=["Analytics"])
async def export_all_analytics(
    format: str = Query("json", regex="^(json|csv)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export aggregate analytics across everything."""
    t = await db.execute(select(func.count(Account.id)))
    a = await db.execute(select(func.count(Account.id)).where(Account.status == "active"))
    m = await db.execute(select(func.count(Conversation.id)))
    campaigns = (await db.execute(select(Campaign))).scalars().all()

    data = {
        "generated_at": datetime.utcnow().isoformat(),
        "totals": {
            "accounts": t.scalar() or 0,
            "active_accounts": a.scalar() or 0,
            "conversations": m.scalar() or 0,
        },
        "campaigns": [
            {"id": c.id, "name": c.name, "status": c.status} for c in campaigns
        ],
    }

    if format == "csv":
        output = io.StringIO()
        w = csv.writer(output)
        w.writerow(["metric", "value"])
        w.writerow(["total_accounts", data["totals"]["accounts"]])
        w.writerow(["active_accounts", data["totals"]["active_accounts"]])
        w.writerow(["total_conversations", data["totals"]["conversations"]])
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=analytics_export.csv"},
        )

    return data


# ── Real-time WebSocket ──────────────────────────────────────────────────

@router.websocket("/ws/{user_id}")
async def analytics_ws(websocket: WebSocket, user_id: int):
    """Real-time analytics events via WebSocket."""
    await websocket.accept()
    if user_id not in _ws_connections:
        _ws_connections[user_id] = []
    _ws_connections[user_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({
                "type": "ack",
                "received": data,
                "timestamp": datetime.utcnow().isoformat(),
            })
    except WebSocketDisconnect:
        _ws_connections[user_id].remove(websocket)
        if not _ws_connections[user_id]:
            del _ws_connections[user_id]


# ── Real-time SSE ────────────────────────────────────────────────────────

# ponytail: stub — heartbeat-only SSE, wire to real event bus if needed
@router.get("/stream/{user_id}", tags=["Analytics"])
async def analytics_sse(user_id: int):
    """Server-Sent Events stream for analytics updates."""
    async def event_stream():
        seq = 0
        while True:
            seq += 1
            yield f"id: {seq}\nevent: heartbeat\ndata: {json.dumps({'ts': datetime.utcnow().isoformat()})}\n\n"
            await asyncio.sleep(15)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
