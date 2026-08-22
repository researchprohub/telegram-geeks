"""Licenses API Endpoints.

Handles license key generation, administrative management, batch exports,
and client activation / heartbeat verification.
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Body
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.services.license_service import license_service
from app.dependencies import get_current_user
from app.models import User, Subscription

router = APIRouter(tags=["Licenses"])


class GenerateLicenseRequest(BaseModel):
    plan_tier: str = Field(default="1yr", description="Plan duration preset: demo, 1mo, 1yr, 2yr, 3yr, lifetime")
    duration_days: Optional[int] = Field(default=None, description="Custom days (overrides preset)")
    max_accounts: Optional[int] = Field(default=None)
    max_campaigns: Optional[int] = Field(default=None)
    team_seats: Optional[int] = Field(default=None)
    allowed_modules: Optional[List[str]] = Field(default=None)
    customer_email: Optional[str] = Field(default=None)
    hwid: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)
    batch_count: int = Field(default=1, ge=1, le=100)


class ActivateLicenseRequest(BaseModel):
    key: str = Field(..., description="License key string (TGGEEKS-...)")
    hwid: Optional[str] = Field(default=None, description="Machine Hardware ID")


class ExtendLicenseRequest(BaseModel):
    extra_days: int = Field(default=30, ge=1, le=3650)


def _require_admin(user: User = Depends(get_current_user)) -> User:
    if getattr(user, "role", "") != "admin":
        raise HTTPException(status_code=403, detail="Administrator privileges required.")
    return user


# ─── Admin Endpoints ──────────────────────────────────────────────────────────

@router.post("/admin/generate")
async def generate_license_endpoint(
    body: GenerateLicenseRequest,
    admin: User = Depends(_require_admin),
):
    """Generate 1 or batch license keys with specified privileges."""
    try:
        if body.batch_count > 1:
            keys = license_service.generate_batch(
                count=body.batch_count,
                plan_tier=body.plan_tier,
                duration_days=body.duration_days,
                max_accounts=body.max_accounts,
                max_campaigns=body.max_campaigns,
                team_seats=body.team_seats,
                allowed_modules=body.allowed_modules,
                customer_email=body.customer_email,
                hwid=body.hwid,
                notes=body.notes,
            )
            return {"status": "success", "count": len(keys), "licenses": keys}
        else:
            lic = license_service.generate_license(
                plan_tier=body.plan_tier,
                duration_days=body.duration_days,
                max_accounts=body.max_accounts,
                max_campaigns=body.max_campaigns,
                team_seats=body.team_seats,
                allowed_modules=body.allowed_modules,
                customer_email=body.customer_email,
                hwid=body.hwid,
                notes=body.notes,
            )
            return {"status": "success", "license": lic}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/admin/list")
async def list_licenses_endpoint(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    plan_tier: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    admin: User = Depends(_require_admin),
):
    """List all generated licenses with optional search and filters."""
    try:
        items = license_service.list_licenses(
            search=search,
            status=status,
            plan_tier=plan_tier,
            limit=limit,
        )
        return {"status": "success", "total": len(items), "licenses": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/{key}/revoke")
async def revoke_license_endpoint(
    key: str,
    reason: str = Body(default="Revoked by Administrator", embed=True),
    admin: User = Depends(_require_admin),
):
    """Revoke an active license."""
    try:
        return license_service.revoke_license(key, reason=reason)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/admin/{key}/extend")
async def extend_license_endpoint(
    key: str,
    body: ExtendLicenseRequest,
    admin: User = Depends(_require_admin),
):
    """Extend the duration of a license."""
    try:
        return license_service.extend_license(key, extra_days=body.extra_days)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/admin/{key}/unbind-hwid")
async def unbind_hwid_endpoint(
    key: str,
    admin: User = Depends(_require_admin),
):
    """Unbind machine hardware ID from license key."""
    try:
        return license_service.unbind_hwid(key)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Client Endpoints ─────────────────────────────────────────────────────────

@router.post("/activate")
async def activate_license(body: ActivateLicenseRequest):
    """Activate license key and permanently bind to client machine HWID."""
    try:
        result = license_service.activate_license(body.key.strip(), hwid=body.hwid)
        return {"status": "success", "license": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Activation failed")


@router.post("/verify")
async def verify_license(body: ActivateLicenseRequest):
    """Test and verify license key status, HMAC validity, HWID match, and remaining days without activation."""
    try:
        result = license_service.verify_license(body.key.strip(), hwid=body.hwid)
        return {"status": result.get("status", "valid"), "valid": result.get("valid", False), "license": result}
    except Exception as e:
        return {"status": "invalid", "valid": False, "message": str(e)}


# ─── User Self-Service License Endpoints (1 per Paid Plan) ─────────────────────

PAID_ROLES = {"admin", "pro", "agency", "enterprise", "starter", "lifetime"}


@router.get("/my-license")
async def get_my_license(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve the single desktop license assigned to the current user."""
    lic = license_service.get_license_by_email(current_user.email)
    
    is_paid = current_user.role in PAID_ROLES
    if not is_paid:
        res = await db.execute(
            select(Subscription).where(
                Subscription.user_id == current_user.id,
                Subscription.status == "active"
            )
        )
        if res.scalar_one_or_none():
            is_paid = True

    return {
        "status": "success",
        "has_license": lic is not None,
        "is_paid": is_paid,
        "user_role": current_user.role,
        "license": lic,
    }


@router.post("/my-license/generate")
async def generate_my_license(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate exactly 1 desktop license according to the user's active paid subscription."""
    # 1. Check if user already has an active license generated
    existing = license_service.get_license_by_email(current_user.email)
    if existing:
        return {
            "status": "success",
            "message": "You have already generated your 1 included desktop license.",
            "license": existing,
            "already_generated": True,
        }

    # 2. Verify paid status
    role = getattr(current_user, "role", "operator")
    plan_tier = "1yr"
    duration_days = 365
    max_accs = 100
    max_camps = 50
    team_seats = 5

    res = await db.execute(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == "active"
        ).order_by(Subscription.id.desc())
    )
    sub = res.scalar_one_or_none()

    if sub:
        tier = sub.plan_tier or "pro_1yr"
        if "1mo" in tier:
            plan_tier = "1mo"
            duration_days = 30
        elif "2yr" in tier:
            plan_tier = "2yr"
            duration_days = 730
        elif "3yr" in tier:
            plan_tier = "3yr"
            duration_days = 1095
        elif "lifetime" in tier:
            plan_tier = "lifetime"
            duration_days = 36500
        else:
            plan_tier = "1yr"
            duration_days = 365
        max_accs = sub.max_accounts or 100
        max_camps = sub.max_campaigns or 50
        team_seats = sub.team_seats or 5
    elif role in PAID_ROLES:
        if role == "admin":
            plan_tier = "lifetime"
            duration_days = 36500
            max_accs = 9999
            max_camps = 9999
            team_seats = 99
        elif role in ("agency", "enterprise"):
            plan_tier = "1yr"
            duration_days = 365
            max_accs = 500
            max_camps = 200
            team_seats = 20
        elif role == "starter":
            plan_tier = "1mo"
            duration_days = 30
            max_accs = 20
            max_camps = 10
            team_seats = 1
        else:  # pro
            plan_tier = "1yr"
            duration_days = 365
            max_accs = 100
            max_camps = 50
            team_seats = 5
    else:
        raise HTTPException(
            status_code=403,
            detail="An active paid subscription (Starter, Pro, Agency, or Lifetime) is required to generate your desktop application license. Please upgrade your plan in Billing."
        )

    lic = license_service.generate_license(
        plan_tier=plan_tier,
        duration_days=duration_days,
        max_accounts=max_accs,
        max_campaigns=max_camps,
        team_seats=team_seats,
        allowed_modules=["*"],
        customer_email=current_user.email,
        notes=f"User Self-Service License ({current_user.email}, Tier: {plan_tier})",
    )

    # Dispatch License Delivery Email asynchronously
    try:
        from app.services.email_service import email_service
        import asyncio
        lic_tmpl = email_service.build_license_delivery_email(
            user_name=current_user.full_name or current_user.email,
            license_key=lic["key"],
            plan_tier=plan_tier,
            max_accounts=max_accs,
        )
        asyncio.create_task(
            email_service.send_email(
                to_email=current_user.email,
                subject=lic_tmpl["subject"],
                html_content=lic_tmpl["html"],
                text_content=lic_tmpl["text"],
                db=db,
            )
        )
    except Exception:
        pass

    return {
        "status": "success",
        "message": f"Successfully generated your {plan_tier.upper()} Desktop Application License!",
        "license": lic,
        "already_generated": False,
    }


@router.post("/my-license/unbind-hwid")
async def unbind_my_hwid(
    current_user: User = Depends(get_current_user),
):
    """Allow a paying user to clear their machine HWID binding when switching computers."""
    lic = license_service.get_license_by_email(current_user.email)
    if not lic:
        raise HTTPException(status_code=404, detail="No desktop license found for your account.")
    
    result = license_service.unbind_hwid(lic["key"])
    return {
        "status": "success",
        "message": "Hardware ID lock successfully cleared. You can now activate on your new device.",
        "license": license_service.get_license_by_email(current_user.email),
    }


