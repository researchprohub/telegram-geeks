"""Payments router — Unified payment API for NowPayments and Oxapay."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from typing import Optional, Literal
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models import User, Order, Deposit, AuditLog, Subscription, ModuleAccess
from app.dependencies import get_current_user
from app.services import nowpayments_service, oxapay_service, manual_deposit_service
from app.services.settings_service import SettingsService
from datetime import datetime, timedelta

router = APIRouter(tags=["Payments"])


class CreatePaymentRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Payment amount in USD")
    currency: str = Field(default="USD", description="Price currency")
    pay_currency: Optional[str] = None
    order_id: str = Field(..., max_length=64, description="Your internal order ID")
    order_description: Optional[str] = None
    gateway: Literal["nowpayments", "oxapay"] = "nowpayments"
    ipn_callback_url: Optional[str] = None
    metadata: Optional[dict] = {}


class PaymentResponse(BaseModel):
    payment_id: str
    pay_address: str
    pay_amount: float
    price_amount: float
    currency: str
    expires_at: str
    status: str
    order_id: str


class ManualDepositRequest(BaseModel):
    currency: str
    network: str


class ManualDepositResponse(BaseModel):
    address: str
    currency: str
    network: str
    min_amount: float
    created_at: str


class PaymentStatusResponse(BaseModel):
    order_id: str
    status: str
    pay_amount: float
    overpaid_amount: float
    actual_amount: float
    pay_currency: str
    created_at: str
    confirmed_at: Optional[str] = None


# Module add-on subscriptions — monthly, sold separately from the base plan.
MODULE_PLANS = {
    "converter": {"name": "Converter", "price_monthly": 50},
    "booster": {"name": "Booster", "price_monthly": 80},
    "registrar": {"name": "Registrar", "price_monthly": 150},
    "duplicator": {"name": "Duplicator", "price_monthly": 80},
    "forwarder": {"name": "Forwarder", "price_monthly": 100},
    "interceptor": {"name": "Interceptor", "price_monthly": 80},
    "invite_via_admin": {"name": "Invite via Admin", "price_monthly": 80},
    "channel_cloner": {"name": "Channel Cloner", "price_monthly": 80},
    "reporter": {"name": "The Reporter", "price_monthly": 80},
    "chat_cloner": {"name": "Chat Cloner", "price_monthly": 80},
}


async def _upgrade_user_on_payment(db: AsyncSession, user_id: int, plan_tier: str = "pro"):
    # module add-ons never touch the base role
    if not plan_tier or plan_tier.startswith("module:"):
        return None
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user and user.role == "operator":
        user.role = plan_tier
    return user


async def _activate_module(db: AsyncSession, user_id: int, module_id: str, days: int = 30):
    """Upsert a user's module add-on, extending from now on every confirmed payment."""
    result = await db.execute(
        select(ModuleAccess).where(ModuleAccess.user_id == user_id, ModuleAccess.module_id == module_id)
    )
    access = result.scalar_one_or_none()
    now = datetime.utcnow()
    if not access:
        access = ModuleAccess(user_id=user_id, module_id=module_id, status="active", starts_at=now)
        db.add(access)
    access.status = "active"
    access.expires_at = now + timedelta(days=days)


@router.post("/create", response_model=PaymentResponse)
async def create_payment(
    body: CreatePaymentRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a crypto payment through NowPayments or Oxapay."""
    try:
        from app.services.settings_service import SettingsService
        svc = SettingsService(db)
        prices = await svc.get_all()
        plan_tier = body.metadata.get("plan_tier") if body.metadata else None
        billing_cycle = body.metadata.get("billing_cycle") if body.metadata else None
        if plan_tier and billing_cycle:
            price_key = f"{plan_tier}_price_{billing_cycle}"
            expected = float(prices.get(price_key, "0"))
            # ponytail: allow small rounding tolerance
            if expected > 0 and abs(body.amount - expected) > 0.5:
                raise HTTPException(status_code=400, detail=f"Price mismatch: expected {expected}, got {body.amount}")

        if body.gateway == "nowpayments":
            result = await nowpayments_service.create_payment(
                amount=body.amount, currency=body.currency,
                pay_currency=body.pay_currency,
                order_id=f"{user.id}_{body.order_id}",
                ipn_url=body.ipn_callback_url or "https://api.telegramgeeks.com/api/v1/payments/callback/nowpayments",
                metadata=body.metadata,
            )
        else:
            result = await oxapay_service.create_invoice(
                amount=body.amount, currency=body.currency,
                track_id=f"{user.id}_{body.order_id}",
                callback_url=body.ipn_callback_url or "https://api.telegramgeeks.com/api/v1/payments/callback/oxapay",
            )

        order = Order(
            user_id=user.id, order_id=f"{user.id}_{body.order_id}",
            amount=body.amount, currency=body.currency,
            crypto_currency=body.pay_currency, gateway=body.gateway,
            status="pending",
            plan_tier=body.metadata.get("plan_tier") if body.metadata else None,
            billing_cycle=body.metadata.get("billing_cycle") if body.metadata else None,
            gateway_order_id=str(result.get("payment_id") or result.get("invoice_id", "")),
        )
        db.add(order)
        await db.commit()
        return PaymentResponse(**result)
    except Exception as e:
        logger.error(f"Payment creation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Payment processing error")


@router.get("/status/{order_id}", response_model=PaymentStatusResponse)
async def get_payment_status(order_id: str, user: User = Depends(get_current_user)):
    try:
        result = await nowpayments_service.get_payment_status(order_id)
        return PaymentStatusResponse(**result)
    except Exception:
        try:
            result = await oxapay_service.get_payment_status(order_id)
            return PaymentStatusResponse(**result)
        except Exception as e:
            logger.error(f"Payment status lookup failed for {order_id}: {e}")
            raise HTTPException(status_code=404, detail="Payment not found")


@router.post("/callback/nowpayments")
async def nowpayments_callback(
    request: Request, payload: dict, db: AsyncSession = Depends(get_db)
):
    """Handle NowPayments IPN webhook with idempotency + signature verification."""
    # ponytail: idempotency via ipn_id + processed flag, signature via x-api-key header
    ipn_id = payload.get("ipn_id", "")
    if ipn_id:
        existing = await db.execute(select(Order).where(Order.idempotency_key == ipn_id))
        if existing.scalar_one_or_none():
            return {"status": "ok", "note": "duplicate"}
    try:
        signature = request.headers.get("x-nowpayments-sig", "")
        if signature:
            api_key = await SettingsService(db).get("nowpayments_api_key") or ""
            svc = nowpayments_service.NowPaymentsService(api_key=api_key)
            valid = await svc.validate_ipn_signature(payload, signature)
            if not valid:
                logger.warning(f"Invalid NowPayments signature for IPN {ipn_id}")
    except Exception as e:
        logger.warning(f"NowPayments signature verification failed: {e}")

    try:
        order_id = payload.get("order_id", "")
        payment_status = payload.get("payment_status", "")
        if not order_id:
            return {"status": "ok", "note": "no order_id"}
        order = (await db.execute(select(Order).where(Order.order_id == order_id))).scalar_one_or_none()
        if not order or order.processed:
            return {"status": "ok", "note": "processed or not found"}
        order.status = "completed" if payment_status in ("confirmed", "finished") else payment_status
        order.tx_hash = payload.get("tx_hash") or payload.get("txid")
        order.crypto_amount = payload.get("pay_amount")
        order.paid_at = datetime.utcnow()
        if ipn_id:
            order.idempotency_key = ipn_id
        if payment_status in ("confirmed", "finished"):
            order.confirmed_at = datetime.utcnow()
            order.processed = True
            if order.plan_tier and order.plan_tier.startswith("module:"):
                await _activate_module(db, order.user_id, order.plan_tier.split(":", 1)[1])
            await _upgrade_user_on_payment(db, order.user_id, order.plan_tier or "pro")
            db.add(AuditLog(
                user_id=order.user_id, action="payment_completed",
                resource="order", resource_id=str(order.order_id),
                details={"gateway": "nowpayments", "amount": order.amount},
            ))
        await db.commit()
        logger.info(f"Order {order_id} updated: {payment_status}")
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"NowPayments IPN error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/callback/oxapay")
async def oxapay_callback(payload: dict, db: AsyncSession = Depends(get_db)):
    """Handle Oxapay webhook callback with idempotency."""
    track_id = payload.get("trackId", "")
    tx_id = payload.get("txId", "")
    idem_key = f"oxapay_{track_id}_{tx_id}"
    existing = await db.execute(select(Order).where(Order.idempotency_key == idem_key))
    if existing.scalar_one_or_none():
        return {"status": "ok", "note": "duplicate"}
    try:
        status = payload.get("status", "")
        if not track_id:
            return {"status": "ok", "note": "no trackId"}
        order = (await db.execute(select(Order).where(Order.order_id == track_id))).scalar_one_or_none()
        if not order or order.processed:
            return {"status": "ok", "note": "processed or not found"}
        order.status = "completed" if status == "Completed" else status.lower()
        order.tx_hash = payload.get("txId")
        order.crypto_amount = payload.get("amount")
        order.paid_at = datetime.utcnow()
        order.idempotency_key = idem_key
        if status == "Completed":
            order.confirmed_at = datetime.utcnow()
            order.processed = True
            if order.plan_tier and order.plan_tier.startswith("module:"):
                await _activate_module(db, order.user_id, order.plan_tier.split(":", 1)[1])
            await _upgrade_user_on_payment(db, order.user_id, order.plan_tier or "pro")
            db.add(AuditLog(
                user_id=order.user_id, action="payment_completed",
                resource="order", resource_id=str(order.order_id),
                details={"gateway": "oxapay", "amount": order.amount},
            ))
        await db.commit()
        logger.info(f"Oxapay order {track_id} updated: {status}")
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Oxapay callback error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/manual-deposit", response_model=ManualDepositResponse)
async def create_manual_deposit(
    body: ManualDepositRequest, user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await manual_deposit_service.create_address(
            user_id=user.id, currency=body.currency, network=body.network,
        )
        deposit = Deposit(
            user_id=user.id, address=result.get("address", ""),
            currency=body.currency, network=body.network,
            expected_amount=result.get("min_amount", 0), status="pending",
        )
        db.add(deposit)
        await db.commit()
        return ManualDepositResponse(**result)
    except Exception as e:
        logger.error(f"Manual deposit creation failed: {e}")
        raise HTTPException(status_code=500, detail="Payment processing error")


@router.get("/manual-deposit/{address}")
async def check_manual_deposit(address: str):
    try:
        return await manual_deposit_service.check_deposit(address)
    except Exception as e:
        logger.error(f"Manual deposit check failed for {address}: {e}")
        raise HTTPException(status_code=404, detail="Not found")


@router.post("/manual-deposit/confirm")
async def confirm_manual_deposit(
    deposit_id: str, tx_hash: str, amount: float,
    user: User = Depends(get_current_user),
):
    try:
        return await manual_deposit_service.confirm_deposit(
            deposit_id=deposit_id, tx_hash=tx_hash, amount=amount,
        )
    except Exception as e:
        logger.error(f"Manual deposit confirmation failed: {e}")
        raise HTTPException(status_code=400, detail="Payment processing error")


# ─── Subscription & Billing ────────────────────────────────────


class PlanInfo(BaseModel):
    id: str
    name: str
    price_monthly: float
    price_yearly: float
    accounts: int
    campaigns: int
    team_seats: int
    pro_modules: bool


class SubscriptionOut(BaseModel):
    plan_tier: str
    status: str
    started_at: Optional[str] = None
    expires_at: Optional[str] = None
    billing_cycle: str
    auto_renew: bool
    max_accounts: int
    max_campaigns: int
    team_seats: int


class OrderHistoryOut(BaseModel):
    order_id: str
    amount: float
    currency: str
    plan_tier: Optional[str] = None
    billing_cycle: Optional[str] = None
    status: str
    created_at: str


PLANS = [
    PlanInfo(id="starter", name="Base", price_monthly=0, price_yearly=0, accounts=5, campaigns=3, team_seats=1, pro_modules=False),
    PlanInfo(id="pro_1mo", name="1 Month", price_monthly=120, price_yearly=120, accounts=50, campaigns=20, team_seats=5, pro_modules=True),
    PlanInfo(id="pro_1yr", name="1 Year", price_monthly=0, price_yearly=550, accounts=100, campaigns=50, team_seats=10, pro_modules=True),
    PlanInfo(id="pro_2yr", name="2 Years", price_monthly=0, price_yearly=1050, accounts=200, campaigns=100, team_seats=20, pro_modules=True),
    PlanInfo(id="pro_3yr", name="3 Years", price_monthly=0, price_yearly=1350, accounts=500, campaigns=200, team_seats=50, pro_modules=True),
]


@router.get("/plans", response_model=list[PlanInfo])
async def list_plans():
    return PLANS


@router.get("/subscription", response_model=SubscriptionOut)
async def get_subscription(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id).order_by(Subscription.created_at.desc()).limit(1)
    )
    sub = result.scalar_one_or_none()
    if sub:
        return SubscriptionOut(
            plan_tier=sub.plan_tier, status=sub.status,
            started_at=sub.created_at.isoformat() if sub.created_at else None,
            expires_at=sub.expires_at.isoformat() if sub.expires_at else None,
            billing_cycle=sub.billing_cycle, auto_renew=sub.auto_renew,
            max_accounts=sub.max_accounts, max_campaigns=sub.max_campaigns, team_seats=sub.team_seats,
        )
    return SubscriptionOut(
        plan_tier="starter", status="active",
        started_at=None, expires_at=None,
        billing_cycle="monthly", auto_renew=False,
        max_accounts=5, max_campaigns=3, team_seats=1,
    )


@router.get("/orders", response_model=list[OrderHistoryOut])
async def list_orders(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).where(Order.user_id == user.id).order_by(Order.created_at.desc()).limit(50)
    )
    return [
        OrderHistoryOut(
            order_id=o.order_id, amount=o.amount, currency=o.currency,
            plan_tier=o.plan_tier, billing_cycle=o.billing_cycle,
            status=o.status, created_at=o.created_at.isoformat(),
        )
        for o in result.scalars().all()
    ]


@router.post("/upgrade")
async def upgrade_plan(
    plan_id: str = Query(..., description="Plan ID from /plans"),
    billing_cycle: str = Query("yearly", description="monthly or yearly"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    plan = next((p for p in PLANS if p.id == plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    if plan_id == "starter":
        # ponytail: free tier — just create sub, no payment
        existing = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
        sub = existing.scalar_one_or_none()
        if not sub:
            sub = Subscription(user_id=user.id, plan_tier="starter", status="active", billing_cycle="monthly",
                               max_accounts=5, max_campaigns=3, team_seats=1)
            db.add(sub)
            await db.commit()
        return {"status": "ok", "plan": "starter"}
    amount = plan.price_yearly if billing_cycle == "yearly" else plan.price_monthly
    order_id = f"plan_{user.id}_{int(datetime.utcnow().timestamp())}"
    result = await nowpayments_service.create_payment(
        amount=amount, currency="USD", pay_currency="USDT",
        order_id=order_id,
        ipn_url="https://api.telegramgeeks.com/api/v1/payments/callback/nowpayments",
        metadata={"plan_tier": plan_id, "billing_cycle": billing_cycle},
    )
    order = Order(
        user_id=user.id, order_id=order_id,
        amount=amount, currency="USD",
        crypto_currency="USDT", gateway="nowpayments",
        status="pending",
        plan_tier=plan_id, billing_cycle=billing_cycle,
        gateway_order_id=str(result.get("payment_id", "")),
    )
    db.add(order)
    await db.commit()
    return {
        "status": "payment_required",
        "payment_url": result.get("payment_url", ""),
        "pay_address": result.get("pay_address", ""),
        "pay_amount": result.get("pay_amount", 0),
        "order_id": order_id,
    }


# ─── Module Add-on Subscriptions ───────────────────────────────


class ModulePlanOut(BaseModel):
    module_id: str
    name: str
    price_monthly: float


class ModuleAccessOut(BaseModel):
    module_id: str
    status: str
    expires_at: Optional[str] = None


class ModuleListOut(BaseModel):
    plans: list[ModulePlanOut]
    active: list[str]


@router.get("/modules", response_model=ModuleListOut)
async def list_module_plans(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    plans = [
        ModulePlanOut(module_id=mid, name=info["name"], price_monthly=info["price_monthly"])
        for mid, info in MODULE_PLANS.items()
    ]
    result = await db.execute(
        select(ModuleAccess).where(ModuleAccess.user_id == user.id, ModuleAccess.status == "active")
    )
    active = [
        a.module_id for a in result.scalars().all()
        if a.expires_at is None or a.expires_at > datetime.utcnow()
    ]
    return ModuleListOut(plans=plans, active=active)


@router.post("/module-subscribe")
async def subscribe_module(
    module_id: str = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a monthly module add-on subscription (payment required)."""
    plan = MODULE_PLANS.get(module_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Module not found")
    order_id = f"module_{user.id}_{int(datetime.utcnow().timestamp())}"
    result = await nowpayments_service.create_payment(
        amount=plan["price_monthly"], currency="USD", pay_currency="USDT",
        order_id=order_id,
        ipn_url="https://api.telegramgeeks.com/api/v1/payments/callback/nowpayments",
        metadata={"plan_tier": f"module:{module_id}", "billing_cycle": "monthly"},
    )
    order = Order(
        user_id=user.id, order_id=order_id,
        amount=plan["price_monthly"], currency="USD",
        crypto_currency="USDT", gateway="nowpayments",
        status="pending",
        plan_tier=f"module:{module_id}", billing_cycle="monthly",
        gateway_order_id=str(result.get("payment_id", "")),
    )
    db.add(order)
    await db.commit()
    return {
        "status": "payment_required",
        "module_id": module_id,
        "payment_url": result.get("payment_url", ""),
        "pay_address": result.get("pay_address", ""),
        "pay_amount": result.get("pay_amount", 0),
        "order_id": order_id,
    }
