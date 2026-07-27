"""Admin dashboard API endpoints."""

import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from typing import Optional
from loguru import logger
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import User, Campaign, Account, TelegramGroup, Persona, SystemSetting, Order, Deposit, Alert, AuditLog
from app.services.settings_service import SettingsService
from app.dependencies import get_current_user
from app.schemas import PLAN_TIERS

router = APIRouter(tags=["Admin"])


# ---- Models ----

class UserListResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: str
    campaigns_count: int = 0
    orders_count: int = 0


class UserUpdateRequest(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
    full_name: Optional[str] = None


class UserCreditRequest(BaseModel):
    amount: float = Field(..., gt=0)
    description: str = ""


class OrderStatusUpdate(BaseModel):
    status: str  # pending, confirmed, completed, failed, expired


class DepositConfirmRequest(BaseModel):
    tx_hash: str
    amount: float


class SystemSettings(BaseModel):
    platform_name: str = "TelegramGeeks"
    maintenance_mode: bool = False
    registration_enabled: bool = True
    starter_price_monthly: float = 29.0
    starter_price_yearly: float = 290.0
    pro_price_monthly: float = 79.0
    pro_price_yearly: float = 790.0
    agency_price_monthly: float = 199.0
    agency_price_yearly: float = 1990.0
    supported_cryptos: list[str] = ["BTC", "ETH", "USDT", "USDC", "LTC", "DOGE", "BNB", "SOL", "XRP", "TRX"]
    nowpayments_api_key: Optional[str] = None
    oxapay_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    polling_interval: int = 30
    telegram_api_id: int = 12345678
    telegram_api_hash: str = "your_api_hash"
    session_storage_path: str = "./sessions"


class AnalyticsOverview(BaseModel):
    total_users: int
    active_users: int
    total_revenue: float
    total_orders: int
    pending_orders: int
    total_campaigns: int
    active_campaigns: int
    conversion_rate: float
    avg_order_value: float
    total_accounts: int
    total_groups: int
    total_personas: int


# ---- Helper ----

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ---- User Management ----

@router.get("/users", response_model=list[UserListResponse], tags=["Admin"])
async def list_users(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with search, filter, and pagination."""
    query = select(User).where(User.is_active == True)
    
    if search:
        query = query.where(
            or_(
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%"),
            )
        )
    if role:
        query = query.where(User.role == role)
    if status == "inactive":
        query = query.where(User.is_active == False)

    total = await db.execute(select(func.count()).select_from(query.subquery()))
    total_count = total.scalar() or 0

    query = query.offset((page - 1) * page_size).limit(page_size).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()

    return [
        UserListResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=str(u.role),
            is_active=u.is_active,
            created_at=u.created_at.isoformat(),
        )
        for u in users
    ]


@router.get("/users/{user_id}", response_model=UserListResponse, tags=["Admin"])
async def get_user(
    user_id: int,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get user details."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserListResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=str(user.role),
        is_active=user.is_active,
        created_at=user.created_at.isoformat(),
    )


@router.put("/users/{user_id}", tags=["Admin"])
async def update_user(
    user_id: int,
    body: UserUpdateRequest,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update user details."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.role:
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.full_name is not None:
        user.full_name = body.full_name

    await db.commit()
    logger.info(f"Admin updated user {user_id}")
    return {"message": "User updated", "user_id": user_id}


@router.post("/users/{user_id}/ban", tags=["Admin"])
async def ban_user(
    user_id: int,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Ban a user account."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    await db.commit()
    logger.warning(f"Admin banned user {user_id}")
    return {"message": f"User {user_id} banned"}


@router.post("/users/{user_id}/credit", tags=["Admin"])
async def credit_user(
    user_id: int,
    body: UserCreditRequest,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Add credits to a user's account."""
    # TODO: Implement credit/balance system
    logger.info(f"Admin credited user {user_id}: {body.amount} ({body.description})")
    return {"message": f"Credited ${body.amount} to user {user_id}"}


@router.delete("/users/{user_id}", tags=["Admin"])
async def delete_user(
    user_id: int,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    user.email = f"deleted_{user_id}@deleted.invalid"
    await db.commit()
    logger.warning(f"Admin deleted user {user_id}")
    return {"message": f"User {user_id} deleted"}


# ---- Orders/Payments Management ----

@router.get("/orders", tags=["Admin"])
async def list_orders(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    gateway: Optional[str] = None,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all payment orders."""
    query = select(Order).order_by(Order.created_at.desc())
    if status:
        query = query.where(Order.status == status)
    if gateway:
        query = query.where(Order.gateway == gateway)

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar() or 0

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    orders = result.scalars().all()

    return {
        "orders": [
            {
                "id": o.id,
                "order_id": o.order_id,
                "user_id": o.user_id,
                "amount": o.amount,
                "currency": o.currency,
                "crypto_currency": o.crypto_currency,
                "crypto_amount": o.crypto_amount,
                "gateway": o.gateway,
                "status": o.status,
                "plan_tier": o.plan_tier,
                "tx_hash": o.tx_hash,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "paid_at": o.paid_at.isoformat() if o.paid_at else None,
            }
            for o in orders
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/orders/pending", tags=["Admin"])
async def list_pending_orders(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List pending orders awaiting confirmation."""
    result = await db.execute(
        select(Order).where(Order.status == "pending").order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    return {"pending_orders": len(orders), "orders": [{"id": o.id, "order_id": o.order_id, "amount": o.amount, "gateway": o.gateway, "created_at": o.created_at.isoformat() if o.created_at else None} for o in orders]}


@router.put("/orders/{order_id}/status", tags=["Admin"])
async def update_order_status(
    order_id: str,
    body: OrderStatusUpdate,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Manually update order status."""
    result = await db.execute(select(Order).where(Order.order_id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        result = await db.execute(select(Order).where(Order.id == int(order_id)))
        order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = body.status
    if body.status in ("confirmed", "completed"):
        order.confirmed_at = func.now()
    await db.commit()
    logger.info(f"Admin updated order {order_id} to {body.status}")
    return {"message": f"Order {order_id} status updated to {body.status}"}


# ---- Analytics ----

@router.get("/analytics/overview", response_model=AnalyticsOverview, tags=["Admin"])
async def get_analytics_overview(_admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Get system-wide analytics overview."""
    total_users_result = await db.execute(select(func.count(User.id)))
    active_users_result = await db.execute(select(func.count(User.id)).where(User.is_active == True))
    total_campaigns_result = await db.execute(select(func.count(Campaign.id)))
    active_campaigns_result = await db.execute(
        select(func.count(Campaign.id)).where(Campaign.status == "running")
    )

    total_accounts_result = await db.execute(select(func.count(Account.id)))
    total_groups_result = await db.execute(select(func.count(TelegramGroup.id)))
    total_personas_result = await db.execute(select(func.count(Persona.id)))

    total_orders_result = await db.execute(select(func.count(Order.id)))
    pending_orders_q = await db.execute(
        select(func.count(Order.id)).where(Order.status == "pending")
    )
    total_revenue_result = await db.execute(
        select(func.coalesce(func.sum(Order.amount), 0)).where(Order.status == "completed")
    )

    total_revenue = float(total_revenue_result.scalar() or 0)
    total_orders = total_orders_result.scalar() or 0
    pending_orders = pending_orders_q.scalar() or 0

    return AnalyticsOverview(
        total_users=total_users_result.scalar() or 0,
        active_users=active_users_result.scalar() or 0,
        total_revenue=total_revenue,
        total_orders=total_orders,
        pending_orders=pending_orders,
        total_campaigns=total_campaigns_result.scalar() or 0,
        active_campaigns=active_campaigns_result.scalar() or 0,
        conversion_rate=0.0,
        avg_order_value=0.0,
        total_accounts=total_accounts_result.scalar() or 0,
        total_groups=total_groups_result.scalar() or 0,
        total_personas=total_personas_result.scalar() or 0,
    )


# ---- Manual Deposits ----

@router.get("/deposits/pending", tags=["Admin"])
async def list_pending_deposits(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all pending manual deposits."""
    result = await db.execute(
        select(Deposit).where(Deposit.status == "pending").order_by(Deposit.created_at.desc())
    )
    deposits = result.scalars().all()
    return {
        "deposits": [
            {
                "id": d.id,
                "user_id": d.user_id,
                "address": d.address,
                "currency": d.currency,
                "expected_amount": d.expected_amount,
                "received_amount": d.received_amount,
                "tx_hash": d.tx_hash,
                "status": d.status,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in deposits
        ]
    }


@router.post("/deposits/{deposit_id}/confirm", tags=["Admin"])
async def confirm_deposit(
    deposit_id: str,
    body: DepositConfirmRequest,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Confirm a manual deposit."""
    result = await db.execute(select(Deposit).where(Deposit.id == int(deposit_id)))
    deposit = result.scalar_one_or_none()
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")

    deposit.status = "confirmed"
    deposit.tx_hash = body.tx_hash
    deposit.received_amount = body.amount
    deposit.confirmed_at = func.now()
    await db.commit()

    from app.schemas import PLAN_TIERS
    from app.services.settings_service import SettingsService
    svc = SettingsService(db)
    settings_raw = await svc.get_all()
    user_result = await db.execute(select(User).where(User.id == deposit.user_id))
    user = user_result.scalar_one_or_none()
    if user:
        order = Order(
            user_id=deposit.user_id,
            order_id=f"DEP-{deposit.id}-{deposit.user_id}",
            amount=deposit.expected_amount,
            currency="USD",
            gateway="manual",
            status="completed",
            tx_hash=body.tx_hash,
            confirmed_at=func.now(),
        )
        db.add(order)
        if user.role == "operator":
            user.role = "pro"
        logger.info(f"Deposit {deposit_id} confirmed, user {deposit.user_id} upgraded")
    await db.commit()
    return {"message": f"Deposit {deposit_id} confirmed"}


@router.post("/deposits/{deposit_id}/reject", tags=["Admin"])
async def reject_deposit(
    deposit_id: str,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    reason: str = "",
):
    """Reject a manual deposit."""
    result = await db.execute(select(Deposit).where(Deposit.id == int(deposit_id)))
    deposit = result.scalar_one_or_none()
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")

    deposit.status = "rejected"
    await db.commit()
    logger.info(f"Deposit {deposit_id} rejected: {reason}")
    return {"message": f"Deposit {deposit_id} rejected: {reason}"}


# ---- System Settings ----

@router.get("/settings", response_model=SystemSettings, tags=["Admin"])
async def get_settings(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get system settings from DB with defaults."""
    svc = SettingsService(db)
    raw = await svc.get_all()
    return SystemSettings(
        platform_name=raw.get("platform_name", "TelegramGeeks"),
        maintenance_mode=raw.get("maintenance_mode", "false") == "true",
        registration_enabled=raw.get("registration_enabled", "true") == "true",
        starter_price_monthly=float(raw.get("starter_price_monthly", 29)),
        starter_price_yearly=float(raw.get("starter_price_yearly", 290)),
        pro_price_monthly=float(raw.get("pro_price_monthly", 79)),
        pro_price_yearly=float(raw.get("pro_price_yearly", 790)),
        agency_price_monthly=float(raw.get("agency_price_monthly", 199)),
        agency_price_yearly=float(raw.get("agency_price_yearly", 1990)),
        supported_cryptos=json.loads(raw.get("supported_cryptos", '["BTC","ETH","USDT"]')),
        polling_interval=int(raw.get("polling_interval", 30)),
        telegram_api_id=int(raw.get("telegram_api_id", 12345678)),
        telegram_api_hash=raw.get("telegram_api_hash", "your_api_hash"),
        session_storage_path=raw.get("session_storage_path", "./sessions"),
        openai_api_key=raw.get("openai_api_key"),
        anthropic_api_key=raw.get("anthropic_api_key"),
        groq_api_key=raw.get("groq_api_key"),
    )


@router.post("/reload-infrastructure", tags=["Admin"])
async def reload_infrastructure(
    request: Request,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Reload infrastructure with updated Telegram API settings from DB."""
    from app.services.infrastructure import Infrastructure
    from app.services.module_dispatcher import dispatcher

    svc = SettingsService(db)
    raw = await svc.get_all()

    if request.app.state.infrastructure:
        old = request.app.state.infrastructure
        if getattr(old, 'client_manager', None) and hasattr(old.client_manager, 'disconnect_all'):
            await old.client_manager.disconnect_all()

    try:
        infra = Infrastructure(
            telegram_api_id=int(raw.get("telegram_api_id", 12345678)),
            telegram_api_hash=raw.get("telegram_api_hash", "your_api_hash"),
            session_storage_path=raw.get("session_storage_path", "./sessions"),
            ai_provider=raw.get("default_ai_provider", "openai"),
            ai_model=raw.get("default_ai_model", "gpt-4o-mini"),
            openai_api_key=raw.get("openai_api_key"),
            anthropic_api_key=raw.get("anthropic_api_key"),
            groq_api_key=raw.get("groq_api_key"),
            ollama_base_url=raw.get("ollama_base_url", "http://localhost:11434"),
            sms_api_keys={},
        )
        dispatcher.infrastructure = infra
        dispatcher._service_cache.clear()
        request.app.state.infrastructure = infra
        logger.info("Infrastructure reloaded with updated settings")
        return {"status": "ok", "message": "Infrastructure reloaded", "details": infra.status()}
    except Exception as e:
        logger.error(f"Failed to reload infrastructure: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reload infrastructure: {e}")


@router.get("/flood-wait", tags=["Admin"])
async def flood_wait_dashboard(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Flood-wait accounts dashboard."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    flooded = await db.execute(
        select(Account).where(Account.status == "spamblock_temp").order_by(Account.spamblock_until.asc().nullslast())
    )
    accounts = flooded.scalars().all()
    return {
        "total_flooded": len(accounts),
        "accounts": [
            {
                "id": a.id, "phone": a.phone_number,
                "flood_until": a.spamblock_until.isoformat() if a.spamblock_until else None,
                "remaining_seconds": max(0, int((a.spamblock_until - now).total_seconds())) if a.spamblock_until else None,
                "ready_resume": a.spamblock_until is not None and a.spamblock_until <= now,
            }
            for a in accounts
        ],
    }


@router.get("/alerts", tags=["Admin"])
async def list_alerts(
    acknowledged: bool = False,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List system alerts (health drops, flood spikes, etc.)."""
    q = select(Alert).order_by(Alert.created_at.desc()).limit(100)
    if not acknowledged:
        q = q.where(Alert.acknowledged == False)
    result = await db.execute(q)
    alerts = result.scalars().all()
    return {
        "alerts": [
            {
                "id": a.id, "type": a.alert_type, "severity": a.severity,
                "title": a.title, "message": a.message,
                "data": a.data, "acknowledged": a.acknowledged,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in alerts
        ],
        "total": len(alerts),
    }


@router.post("/alerts/{alert_id}/acknowledge", tags=["Admin"])
async def acknowledge_alert(
    alert_id: int,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.acknowledged = True
    alert.acknowledged_at = datetime.now(timezone.utc).replace(tzinfo=None)
    alert.acknowledged_by = _admin.id
    await db.commit()
    return {"message": f"Alert {alert_id} acknowledged"}


@router.get("/health/run", tags=["Admin"])
async def trigger_health_check(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Trigger a manual health check on all accounts."""
    from app.services.account_health import check_all_health
    result = await check_all_health(db)
    return result


@router.get("/audit-log", tags=["Admin"])
async def list_audit_log(
    limit: int = 50,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin audit trail."""
    result = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit))
    logs = result.scalars().all()
    return {
        "logs": [
            {
                "id": l.id, "user_id": l.user_id, "action": l.action,
                "resource": l.resource, "resource_id": l.resource_id,
                "details": l.details, "ip_address": l.ip_address,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in logs
        ]
    }


@router.put("/settings", response_model=SystemSettings, tags=["Admin"])
async def update_settings(
    body: SystemSettings,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update system settings."""
    svc = SettingsService(db)
    await svc.update_all(body.model_dump())
    logger.info(f"Admin updated system settings")
    raw = await svc.get_all()
    return SystemSettings(
        platform_name=raw.get("platform_name", "TelegramGeeks"),
        maintenance_mode=raw.get("maintenance_mode", "false") == "true",
        registration_enabled=raw.get("registration_enabled", "true") == "true",
        starter_price_monthly=float(raw.get("starter_price_monthly", 29)),
        starter_price_yearly=float(raw.get("starter_price_yearly", 290)),
        pro_price_monthly=float(raw.get("pro_price_monthly", 79)),
        pro_price_yearly=float(raw.get("pro_price_yearly", 790)),
        agency_price_monthly=float(raw.get("agency_price_monthly", 199)),
        agency_price_yearly=float(raw.get("agency_price_yearly", 1990)),
        supported_cryptos=json.loads(raw.get("supported_cryptos", '["BTC","ETH","USDT"]')),
        polling_interval=int(raw.get("polling_interval", 30)),
        telegram_api_id=int(raw.get("telegram_api_id", 12345678)),
        telegram_api_hash=raw.get("telegram_api_hash", "your_api_hash"),
        session_storage_path=raw.get("session_storage_path", "./sessions"),
        openai_api_key=raw.get("openai_api_key"),
        anthropic_api_key=raw.get("anthropic_api_key"),
        groq_api_key=raw.get("groq_api_key"),
    )
