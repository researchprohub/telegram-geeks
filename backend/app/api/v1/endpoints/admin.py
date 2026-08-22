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

from app.core.security import hash_password
from app.services.license_service import license_service

router = APIRouter(tags=["Admin"])


# ---- Models ----

class UserListResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: str
    last_login: Optional[str] = None
    campaigns_count: int = 0
    accounts_count: int = 0
    groups_count: int = 0
    personas_count: int = 0
    license_key: Optional[str] = None
    license_tier: Optional[str] = None
    license_status: Optional[str] = None
    license_expires_at: Optional[str] = None
    license_hwid: Optional[str] = None


class UserDetailResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: str
    last_login: Optional[str] = None
    campaigns_count: int = 0
    accounts_count: int = 0
    groups_count: int = 0
    personas_count: int = 0
    license: Optional[dict] = None
    accounts_summary: list[dict] = []
    campaigns_summary: list[dict] = []
    personas_summary: list[dict] = []


class AdminCreateUserRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    role: str = "operator"
    subscription_tier: Optional[str] = "free"  # free, starter, pro, agency


class UserUpdateRequest(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    subscription_tier: Optional[str] = None


class AdminLicenseActionRequest(BaseModel):
    action: str  # 'generate', 'upgrade', 'reset_hwid', 'revoke'
    plan_tier: Optional[str] = "pro"
    duration_days: Optional[int] = 30


class UserStatusToggleRequest(BaseModel):
    is_active: bool
    reason: Optional[str] = None


class UserPasswordResetRequest(BaseModel):
    new_password: str


class UserCreditRequest(BaseModel):
    amount: float = Field(..., gt=0)
    description: str = ""


class OrderStatusUpdate(BaseModel):
    status: str  # pending, confirmed, completed, failed, expired


class DepositConfirmRequest(BaseModel):
    tx_hash: str
    amount: float


class SystemSettings(BaseModel):
    platform_name: str = "TelegramGeeks Pro"
    maintenance_mode: bool = False
    registration_enabled: bool = True
    starter_price_monthly: float = 29.0
    starter_price_yearly: float = 290.0
    pro_price_monthly: float = 79.0
    pro_price_yearly: float = 790.0
    agency_price_monthly: float = 199.0
    agency_price_yearly: float = 1990.0
    supported_cryptos: list[str] = ["BTC", "ETH", "USDT", "USDC", "LTC", "DOGE", "BNB", "SOL", "XMR", "TRX", "TON"]
    # Configured Deposit Wallet Addresses
    wallet_sol: str = "9HWxxL9duEamX7xPbmdAEc26frc3RzMGewfzwqEe5duN"
    wallet_xmr: str = "428fAZEbHjvQ4eUGzhUKbDhhF43zyDPSqYrvdmn4jasgd1iLPfX3mAfcGq6L1bW6esNxda3ntBGfaZ2uLDXeAohoE8u3u4d"
    wallet_eth: str = "0x96d294E27D4Bb2959897aC11FFCE03606324380B"
    wallet_btc: str = "bc1qjy9v9jnq3cdupghzlc29m3wpft7pnxjpurda23"
    wallet_trx: str = "TQQcN4KhNKc6c4BPWzCDjhNm4YPGSWLrqi"
    wallet_usdt_trc20: str = "TQQcN4KhNKc6c4BPWzCDjhNm4YPGSWLrqi"
    wallet_usdt_erc20: str = "0x96d294E27D4Bb2959897aC11FFCE03606324380B"
    wallet_ton: str = "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N"
    # Gateway & AI Keys
    nowpayments_api_key: Optional[str] = None
    oxapay_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    polling_interval: int = 30
    telegram_api_id: int = 12345678
    telegram_api_hash: str = "your_api_hash"
    session_storage_path: str = "./sessions"
    # Email Settings
    email_provider: str = "disabled"  # 'smtp' | 'resend' | 'mailtrap' | 'disabled'
    email_from_name: str = "TelegramGeeks Pro"
    email_from_address: str = "notifications@telegramgeekspro.com"
    smtp_host: str = "smtp.mailtrap.io"
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_tls: bool = True
    smtp_ssl: bool = False
    resend_api_key: Optional[str] = None
    resend_from_email: Optional[str] = None
    mailtrap_api_token: Optional[str] = None
    mailtrap_inbox_id: Optional[str] = None
    mailtrap_is_sandbox: bool = True
    email_notifications_enabled: bool = True


class EmailTestRequest(BaseModel):
    recipient_email: str
    provider: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_tls: Optional[bool] = None
    smtp_ssl: Optional[bool] = None
    resend_api_key: Optional[str] = None
    resend_from_email: Optional[str] = None
    mailtrap_api_token: Optional[str] = None
    mailtrap_inbox_id: Optional[str] = None
    mailtrap_is_sandbox: Optional[bool] = None
    from_name: Optional[str] = None
    from_address: Optional[str] = None


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

@router.get("/users/stats/summary", tags=["Admin"])
async def get_user_stats_summary(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return high-level user demographic and subscription analytics."""
    total_res = await db.execute(select(func.count(User.id)))
    total_users = total_res.scalar() or 0

    active_res = await db.execute(select(func.count(User.id)).where(User.is_active == True))
    active_users = active_res.scalar() or 0

    admin_res = await db.execute(select(func.count(User.id)).where(User.role == "admin", User.is_active == True))
    admin_users = admin_res.scalar() or 0

    operator_res = await db.execute(select(func.count(User.id)).where(User.role == "operator", User.is_active == True))
    operator_users = operator_res.scalar() or 0

    banned_res = await db.execute(select(func.count(User.id)).where(User.is_active == False))
    banned_users = banned_res.scalar() or 0

    all_licenses = license_service.list_licenses()
    active_licenses = [l for l in all_licenses if l.get("status") == "active"]
    tier_counts = {
        "starter": sum(1 for l in active_licenses if l.get("plan_tier") == "starter"),
        "pro": sum(1 for l in active_licenses if l.get("plan_tier") == "pro"),
        "agency": sum(1 for l in active_licenses if l.get("plan_tier") == "agency"),
    }

    return {
        "total_users": total_users,
        "active_users": active_users,
        "banned_users": banned_users,
        "admin_users": admin_users,
        "operator_users": operator_users,
        "paid_subscribers": len(active_licenses),
        "tier_distribution": tier_counts,
    }


@router.get("/users", tags=["Admin"])
async def list_users(
    page: int = 1,
    page_size: int = 25,
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    plan_tier: Optional[str] = None,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with enriched telemetry, desktop license mapping, search, and filters."""
    query = select(User)
    
    if search:
        query = query.where(
            or_(
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%"),
            )
        )
    if role:
        query = query.where(User.role == role)
    if status == "active":
        query = query.where(User.is_active == True)
    elif status == "inactive" or status == "banned":
        query = query.where(User.is_active == False)

    # Count total matching users
    total_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total_count = total_res.scalar() or 0

    query = query.offset((page - 1) * page_size).limit(page_size).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()

    user_responses = []
    for u in users:
        # Fetch related telemetry counts
        acc_count = (await db.execute(select(func.count(Account.id)).where(Account.user_id == u.id))).scalar() or 0
        camp_count = (await db.execute(select(func.count(Campaign.id)).where(Campaign.user_id == u.id))).scalar() or 0
        grp_count = (await db.execute(select(func.count(TelegramGroup.id)).where(TelegramGroup.user_id == u.id))).scalar() or 0
        pers_count = (await db.execute(select(func.count(Persona.id)).where(Persona.user_id == u.id))).scalar() or 0

        # Query user license
        lic = license_service.get_user_license(u.email)
        lic_tier = lic.get("plan_tier") if lic else "free"
        lic_key = lic.get("key") if lic else None
        lic_status = lic.get("status") if lic else None
        lic_expires = lic.get("expires_at") if lic else None
        lic_hwid = lic.get("hwid") if lic else None

        # Filter by plan if requested
        if plan_tier and plan_tier != "all":
            if plan_tier == "free" and lic:
                continue
            elif plan_tier != "free" and lic_tier != plan_tier:
                continue

        user_responses.append(
            UserListResponse(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                role=str(u.role),
                is_active=u.is_active,
                created_at=u.created_at.isoformat() if u.created_at else datetime.now(timezone.utc).isoformat(),
                last_login=u.last_login.isoformat() if getattr(u, "last_login", None) else None,
                campaigns_count=camp_count,
                accounts_count=acc_count,
                groups_count=grp_count,
                personas_count=pers_count,
                license_key=lic_key,
                license_tier=lic_tier,
                license_status=lic_status,
                license_expires_at=lic_expires,
                license_hwid=lic_hwid,
            )
        )

    return {
        "status": "success",
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size if page_size > 0 else 1,
        "users": user_responses,
    }


@router.post("/users", tags=["Admin"])
async def create_user(
    body: AdminCreateUserRequest,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint to manually register a new platform user with optional subscription tier."""
    existing = await db.execute(select(User).where(User.email == body.email.strip().lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        email=body.email.strip().lower(),
        hashed_password=hash_password(body.password),
        full_name=body.full_name.strip() if body.full_name else None,
        role=body.role,
        is_active=True,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # If paid subscription tier specified, generate license
    created_license = None
    if body.subscription_tier and body.subscription_tier in ("starter", "pro", "agency"):
        created_license = license_service.generate_license(
            plan_tier=body.subscription_tier,
            duration_days=30,
            customer_email=new_user.email,
            notes=f"Admin created user #{new_user.id}",
        )

    logger.info(f"Admin created user {new_user.id} ({new_user.email})")
    return {
        "status": "success",
        "message": f"User {new_user.email} created successfully",
        "user_id": new_user.id,
        "license": created_license,
    }


@router.get("/users/{user_id}/detail", response_model=UserDetailResponse, tags=["Admin"])
async def get_user_detail(
    user_id: int,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get full deep-dive profile of a user with connected assets, campaigns, and licenses."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch accounts summary
    acc_res = await db.execute(select(Account).where(Account.user_id == user_id).limit(10))
    accounts = acc_res.scalars().all()
    accounts_summary = [
        {"id": a.id, "phone_number": a.phone_number, "status": a.status, "trust_score": a.trust_score}
        for a in accounts
    ]

    # Fetch campaigns summary
    camp_res = await db.execute(select(Campaign).where(Campaign.user_id == user_id).limit(10))
    campaigns = camp_res.scalars().all()
    campaigns_summary = [
        {"id": c.id, "name": c.name, "status": getattr(c, "status", "draft"), "created_at": c.created_at.isoformat() if c.created_at else ""}
        for c in campaigns
    ]

    # Fetch personas summary
    pers_res = await db.execute(select(Persona).where(Persona.user_id == user_id).limit(10))
    personas = pers_res.scalars().all()
    personas_summary = [
        {"id": p.id, "name": p.name, "created_at": p.created_at.isoformat() if p.created_at else ""}
        for p in personas
    ]

    # Telemetry counts
    acc_count = (await db.execute(select(func.count(Account.id)).where(Account.user_id == user_id))).scalar() or 0
    camp_count = (await db.execute(select(func.count(Campaign.id)).where(Campaign.user_id == user_id))).scalar() or 0
    grp_count = (await db.execute(select(func.count(TelegramGroup.id)).where(TelegramGroup.user_id == user_id))).scalar() or 0
    pers_count = (await db.execute(select(func.count(Persona.id)).where(Persona.user_id == user_id))).scalar() or 0

    lic = license_service.get_user_license(user.email)

    return UserDetailResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=str(user.role),
        is_active=user.is_active,
        created_at=user.created_at.isoformat() if user.created_at else "",
        last_login=user.last_login.isoformat() if getattr(user, "last_login", None) else None,
        campaigns_count=camp_count,
        accounts_count=acc_count,
        groups_count=grp_count,
        personas_count=pers_count,
        license=lic,
        accounts_summary=accounts_summary,
        campaigns_summary=campaigns_summary,
        personas_summary=personas_summary,
    )


@router.put("/users/{user_id}", tags=["Admin"])
async def update_user(
    user_id: int,
    body: UserUpdateRequest,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update user details, roles, password, or subscription tier."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.role:
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.full_name is not None:
        user.full_name = body.full_name.strip() if body.full_name else None
    if body.password:
        user.hashed_password = hash_password(body.password)

    # Subscription tier management
    if body.subscription_tier:
        if body.subscription_tier in ("starter", "pro", "agency"):
            existing_lic = license_service.get_user_license(user.email)
            if existing_lic:
                # Upgrade existing license
                license_service.extend_license(existing_lic["key"], additional_days=30)
            else:
                license_service.generate_license(
                    plan_tier=body.subscription_tier,
                    duration_days=30,
                    customer_email=user.email,
                    notes=f"Admin assigned {body.subscription_tier}",
                )

    await db.commit()
    logger.info(f"Admin updated user {user_id} ({user.email})")
    return {"status": "success", "message": "User updated successfully", "user_id": user_id}


@router.post("/users/{user_id}/status", tags=["Admin"])
async def toggle_user_status(
    user_id: int,
    body: UserStatusToggleRequest,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Toggle user active / suspended / banned status."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = body.is_active
    await db.commit()
    status_label = "activated" if body.is_active else "suspended"
    logger.warning(f"Admin {status_label} user {user_id} ({user.email})")
    return {"status": "success", "message": f"User {status_label}", "is_active": user.is_active}


@router.post("/users/{user_id}/reset-password", tags=["Admin"])
async def reset_user_password(
    user_id: int,
    body: UserPasswordResetRequest,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin direct password reset for a user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(body.new_password)
    await db.commit()
    logger.info(f"Admin reset password for user {user_id} ({user.email})")
    return {"status": "success", "message": f"Password reset for {user.email}"}


@router.post("/users/{user_id}/license", tags=["Admin"])
async def manage_user_license(
    user_id: int,
    body: AdminLicenseActionRequest,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Perform desktop license actions (generate, upgrade, reset_hwid, revoke) on user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_lic = license_service.get_user_license(user.email)

    if body.action == "generate":
        if user_lic:
            return {"status": "exists", "message": "User already has an active license", "license": user_lic}
        lic = license_service.generate_license(
            plan_tier=body.plan_tier or "pro",
            duration_days=body.duration_days or 30,
            customer_email=user.email,
            notes=f"Admin generated for user #{user.id}",
        )
        return {"status": "success", "message": "License generated", "license": lic}

    elif body.action == "reset_hwid":
        if not user_lic:
            raise HTTPException(status_code=404, detail="No license found for user")
        res = license_service.reset_hwid(user_lic["key"])
        return {"status": "success", "message": "Hardware ID binding cleared", "result": res}

    elif body.action == "revoke":
        if not user_lic:
            raise HTTPException(status_code=404, detail="No license found for user")
        res = license_service.revoke_license(user_lic["key"], reason="Admin manual revocation")
        return {"status": "success", "message": "License revoked", "result": res}

    elif body.action == "upgrade":
        if not user_lic:
            lic = license_service.generate_license(
                plan_tier=body.plan_tier or "pro",
                duration_days=body.duration_days or 30,
                customer_email=user.email,
            )
            return {"status": "success", "message": "New license created", "license": lic}
        license_service.extend_license(
            user_lic["key"],
            extra_days=body.duration_days or 30,
            new_plan_tier=body.plan_tier if body.plan_tier else None,
        )
        updated = license_service.get_user_license(user.email)
        return {"status": "success", "message": "License updated", "license": updated}

    raise HTTPException(status_code=400, detail="Invalid action")


@router.delete("/users/{user_id}", tags=["Admin"])
async def delete_user(
    user_id: int,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a user and revoke their desktop license."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Revoke license if any
    user_lic = license_service.get_user_license(user.email)
    if user_lic:
        license_service.revoke_license(user_lic["key"], reason="User account deleted")

    user.is_active = False
    user.email = f"deleted_{user_id}_{int(datetime.now().timestamp())}@deleted.invalid"
    await db.commit()
    logger.warning(f"Admin deleted user {user_id}")
    return {"status": "success", "message": f"User {user_id} deleted"}


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
        platform_name=raw.get("platform_name", "TelegramGeeks Pro"),
        maintenance_mode=raw.get("maintenance_mode", "false") == "true",
        registration_enabled=raw.get("registration_enabled", "true") == "true",
        starter_price_monthly=float(raw.get("starter_price_monthly", 29)),
        starter_price_yearly=float(raw.get("starter_price_yearly", 290)),
        pro_price_monthly=float(raw.get("pro_price_monthly", 79)),
        pro_price_yearly=float(raw.get("pro_price_yearly", 790)),
        agency_price_monthly=float(raw.get("agency_price_monthly", 199)),
        agency_price_yearly=float(raw.get("agency_price_yearly", 1990)),
        supported_cryptos=json.loads(raw.get("supported_cryptos", '["BTC","ETH","USDT","USDC","LTC","DOGE","BNB","SOL","XMR","TRX","TON"]')),
        # Configured Deposit Wallet Addresses
        wallet_sol=raw.get("wallet_sol", "9HWxxL9duEamX7xPbmdAEc26frc3RzMGewfzwqEe5duN"),
        wallet_xmr=raw.get("wallet_xmr", "428fAZEbHjvQ4eUGzhUKbDhhF43zyDPSqYrvdmn4jasgd1iLPfX3mAfcGq6L1bW6esNxda3ntBGfaZ2uLDXeAohoE8u3u4d"),
        wallet_eth=raw.get("wallet_eth", "0x96d294E27D4Bb2959897aC11FFCE03606324380B"),
        wallet_btc=raw.get("wallet_btc", "bc1qjy9v9jnq3cdupghzlc29m3wpft7pnxjpurda23"),
        wallet_trx=raw.get("wallet_trx", "TQQcN4KhNKc6c4BPWzCDjhNm4YPGSWLrqi"),
        wallet_usdt_trc20=raw.get("wallet_usdt_trc20", "TQQcN4KhNKc6c4BPWzCDjhNm4YPGSWLrqi"),
        wallet_usdt_erc20=raw.get("wallet_usdt_erc20", "0x96d294E27D4Bb2959897aC11FFCE03606324380B"),
        wallet_ton=raw.get("wallet_ton", "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N"),
        polling_interval=int(raw.get("polling_interval", 30)),
        telegram_api_id=int(raw.get("telegram_api_id", 12345678)),
        telegram_api_hash=raw.get("telegram_api_hash", "your_api_hash"),
        session_storage_path=raw.get("session_storage_path", "./sessions"),
        openai_api_key=raw.get("openai_api_key"),
        anthropic_api_key=raw.get("anthropic_api_key"),
        groq_api_key=raw.get("groq_api_key"),
        # Email settings
        email_provider=raw.get("email_provider", "disabled"),
        email_from_name=raw.get("email_from_name", "TelegramGeeks Pro"),
        email_from_address=raw.get("email_from_address", "notifications@telegramgeekspro.com"),
        smtp_host=raw.get("smtp_host", "smtp.mailtrap.io"),
        smtp_port=int(raw.get("smtp_port", 587)),
        smtp_user=raw.get("smtp_user"),
        smtp_password=raw.get("smtp_password"),
        smtp_tls=raw.get("smtp_tls", "true") == "true",
        smtp_ssl=raw.get("smtp_ssl", "false") == "true",
        resend_api_key=raw.get("resend_api_key"),
        resend_from_email=raw.get("resend_from_email"),
        mailtrap_api_token=raw.get("mailtrap_api_token"),
        mailtrap_inbox_id=raw.get("mailtrap_inbox_id"),
        mailtrap_is_sandbox=raw.get("mailtrap_is_sandbox", "true") == "true",
        email_notifications_enabled=raw.get("email_notifications_enabled", "true") == "true",
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
        platform_name=raw.get("platform_name", "TelegramGeeks Pro"),
        maintenance_mode=raw.get("maintenance_mode", "false") == "true",
        registration_enabled=raw.get("registration_enabled", "true") == "true",
        starter_price_monthly=float(raw.get("starter_price_monthly", 29)),
        starter_price_yearly=float(raw.get("starter_price_yearly", 290)),
        pro_price_monthly=float(raw.get("pro_price_monthly", 79)),
        pro_price_yearly=float(raw.get("pro_price_yearly", 790)),
        agency_price_monthly=float(raw.get("agency_price_monthly", 199)),
        agency_price_yearly=float(raw.get("agency_price_yearly", 1990)),
        supported_cryptos=json.loads(raw.get("supported_cryptos", '["BTC","ETH","USDT","USDC","LTC","DOGE","BNB","SOL","XMR","TRX","TON"]')),
        # Configured Deposit Wallet Addresses
        wallet_sol=raw.get("wallet_sol", "9HWxxL9duEamX7xPbmdAEc26frc3RzMGewfzwqEe5duN"),
        wallet_xmr=raw.get("wallet_xmr", "428fAZEbHjvQ4eUGzhUKbDhhF43zyDPSqYrvdmn4jasgd1iLPfX3mAfcGq6L1bW6esNxda3ntBGfaZ2uLDXeAohoE8u3u4d"),
        wallet_eth=raw.get("wallet_eth", "0x96d294E27D4Bb2959897aC11FFCE03606324380B"),
        wallet_btc=raw.get("wallet_btc", "bc1qjy9v9jnq3cdupghzlc29m3wpft7pnxjpurda23"),
        wallet_trx=raw.get("wallet_trx", "TQQcN4KhNKc6c4BPWzCDjhNm4YPGSWLrqi"),
        wallet_usdt_trc20=raw.get("wallet_usdt_trc20", "TQQcN4KhNKc6c4BPWzCDjhNm4YPGSWLrqi"),
        wallet_usdt_erc20=raw.get("wallet_usdt_erc20", "0x96d294E27D4Bb2959897aC11FFCE03606324380B"),
        wallet_ton=raw.get("wallet_ton", "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N"),
        polling_interval=int(raw.get("polling_interval", 30)),
        telegram_api_id=int(raw.get("telegram_api_id", 12345678)),
        telegram_api_hash=raw.get("telegram_api_hash", "your_api_hash"),
        session_storage_path=raw.get("session_storage_path", "./sessions"),
        openai_api_key=raw.get("openai_api_key"),
        anthropic_api_key=raw.get("anthropic_api_key"),
        groq_api_key=raw.get("groq_api_key"),
        # Email settings
        email_provider=raw.get("email_provider", "disabled"),
        email_from_name=raw.get("email_from_name", "TelegramGeeks Pro"),
        email_from_address=raw.get("email_from_address", "notifications@telegramgeekspro.com"),
        smtp_host=raw.get("smtp_host", "smtp.mailtrap.io"),
        smtp_port=int(raw.get("smtp_port", 587)),
        smtp_user=raw.get("smtp_user"),
        smtp_password=raw.get("smtp_password"),
        smtp_tls=raw.get("smtp_tls", "true") == "true",
        smtp_ssl=raw.get("smtp_ssl", "false") == "true",
        resend_api_key=raw.get("resend_api_key"),
        resend_from_email=raw.get("resend_from_email"),
        mailtrap_api_token=raw.get("mailtrap_api_token"),
        mailtrap_inbox_id=raw.get("mailtrap_inbox_id"),
        mailtrap_is_sandbox=raw.get("mailtrap_is_sandbox", "true") == "true",
        email_notifications_enabled=raw.get("email_notifications_enabled", "true") == "true",
    )


# ---- Email Administration & Template Hub ----

@router.post("/email/test", tags=["Admin"])
async def send_test_email(
    body: EmailTestRequest,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Send a diagnostic test email to verify SMTP / Resend / Mailtrap credentials."""
    from app.services.email_service import email_service
    
    # Build override config if specific values were supplied in test form
    override_config = None
    if body.provider:
        override_config = {
            "provider": body.provider,
            "from_name": body.from_name or "TelegramGeeks Pro",
            "from_address": body.from_address or "notifications@telegramgeekspro.com",
            "smtp_host": body.smtp_host or "smtp.mailtrap.io",
            "smtp_port": str(body.smtp_port or 587),
            "smtp_user": body.smtp_user or "",
            "smtp_password": body.smtp_password or "",
            "smtp_tls": str(body.smtp_tls if body.smtp_tls is not None else True).lower(),
            "smtp_ssl": str(body.smtp_ssl if body.smtp_ssl is not None else False).lower(),
            "resend_api_key": body.resend_api_key or "",
            "resend_from_email": body.resend_from_email or body.from_address or "notifications@telegramgeekspro.com",
            "mailtrap_api_token": body.mailtrap_api_token or "",
            "mailtrap_inbox_id": body.mailtrap_inbox_id or "",
            "mailtrap_is_sandbox": str(body.mailtrap_is_sandbox if body.mailtrap_is_sandbox is not None else True).lower(),
            "enabled": "true",
        }
    
    provider_name = (override_config.get("provider") if override_config else None) or "configured"
    tmpl = email_service.build_test_email(recipient=body.recipient_email, provider_name=provider_name)
    
    try:
        res = await email_service.send_email(
            to_email=body.recipient_email,
            subject=tmpl["subject"],
            html_content=tmpl["html"],
            text_content=tmpl["text"],
            db=db,
            override_config=override_config,
        )
        return {
            "status": "success",
            "message": f"Test email successfully dispatched to {body.recipient_email}!",
            "details": res,
        }
    except Exception as e:
        logger.error(f"Test email failed: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Email delivery failed: {str(e)}",
        )


@router.get("/email/templates/preview", tags=["Admin"])
async def preview_email_template(
    template_type: str = Query("welcome", description="welcome, reset, license, payment, expiring, security, test"),
    _admin: User = Depends(require_admin),
):
    """Preview rendered responsive HTML email template for administration testing."""
    from fastapi.responses import HTMLResponse
    from app.services.email_service import email_service

    if template_type == "welcome":
        tmpl = email_service.build_welcome_email("Alex Developer", "alex@example.com")
    elif template_type == "reset":
        tmpl = email_service.build_password_reset_email("Alex Developer", "849201", expires_in_minutes=15)
    elif template_type == "license":
        tmpl = email_service.build_license_delivery_email(
            user_name="Alex Developer",
            license_key="TGGEEKS-DEMO-XXXX-YYYY-ZZZZ",
            plan_tier="pro_1yr",
            max_accounts=100,
        )
    elif template_type == "payment":
        tmpl = email_service.build_payment_receipt_email(
            user_name="Alex Developer",
            order_id="ORD-782914",
            amount=79.0,
            currency="USDT",
            plan_tier="pro_1mo",
            tx_hash="0x89ab12cd34ef567890abcdef1234567890abcdef",
        )
    elif template_type == "expiring":
        tmpl = email_service.build_subscription_expiring_email("Alex Developer", "pro_1yr", days_left=3)
    elif template_type == "security":
        tmpl = email_service.build_security_alert_email(
            user_name="Alex Developer",
            ip_address="192.168.1.100",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            location="London, United Kingdom",
        )
    else:
        tmpl = email_service.build_test_email("admin@telegramgeekspro.com", "Mailtrap Sandbox")

    return HTMLResponse(content=tmpl["html"])

