"""Account management endpoints — real DB CRUD with tenant isolation."""

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from loguru import logger
from sqlalchemy import select, func, update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import AccountCreate, AccountUpdate, AccountOut, AccountHealth, PaginatedResponse, AccountHealthResult, BulkHealthJob, BulkStatusUpdate
from app.db.session import get_db
from app.models import Account, User
from app.dependencies import get_current_user_tenant
from app.services.account_health import check_single, check_bulk

router = APIRouter(redirect_slashes=False)


async def _require_own_account(db: AsyncSession, account: Account, current_user: User):
    """Verify tenant ownership: user owns the account OR is admin."""
    if current_user.role != "admin" and account.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: you can only manage your own accounts")


def _account_out(a) -> AccountOut:
    return AccountOut(
        id=a.id,
        phone_number=a.phone_number,
        status=a.status,
        proxy_config=a.proxy_config or {},
        last_activity=a.last_activity,
        flood_wait_until=a.flood_wait_until,
        ban_reason=a.ban_reason,
        trust_score=a.trust_score,
        daily_message_count=a.daily_message_count,
        created_at=a.created_at,
        spamblock_until=a.spamblock_until,
        health_check_at=a.health_check_at,
        health_score=a.health_score,
        dc_id=a.dc_id,
        ping_ms=a.ping_ms,
    )


@router.get("", response_model=PaginatedResponse, tags=["Accounts"])
@router.get("/", response_model=PaginatedResponse, tags=["Accounts"])
async def list_accounts(
    page: int = 1,
    page_size: int = 20,
    status_filter: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """List accounts. Admins see all; regular users see only their own."""
    q = select(func.count(Account.id))
    if current_user.role != "admin":
        q = q.where(Account.user_id == current_user.id)
    if status_filter:
        q = q.where(Account.status == status_filter)
    result = await db.execute(q)
    total = result.scalar() or 0

    q2 = select(Account).order_by(Account.id.desc())
    if current_user.role != "admin":
        q2 = q2.where(Account.user_id == current_user.id)
    if status_filter:
        q2 = q2.where(Account.status == status_filter)
    q2 = q2.offset((page - 1) * page_size).limit(page_size)
    result2 = await db.execute(q2)
    items = result2.scalars().all()

    return PaginatedResponse(
        items=[_account_out(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, (total + page_size - 1) // page_size),
    )


@router.get("/status-counts", tags=["Accounts"])
async def account_status_counts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Return counts per status folder for the folder tabs."""
    q = select(Account.status, func.count(Account.id))
    if current_user.role != "admin":
        q = q.where(Account.user_id == current_user.id)
    q = q.group_by(Account.status)
    result = await db.execute(q)
    rows = result.all()
    counts = {row[0]: row[1] for row in rows}
    counts["all"] = sum(counts.values())
    return counts


@router.post("", response_model=AccountOut, status_code=status.HTTP_201_CREATED, tags=["Accounts"])
@router.post("/", response_model=AccountOut, status_code=status.HTTP_201_CREATED, tags=["Accounts"])
async def create_account(
    body: AccountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Register a new Telegram account (owned by current user)."""
    existing = await db.execute(select(Account).where(Account.phone_number == body.phone_number))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone number already exists")

    account = Account(
        user_id=current_user.id,
        phone_number=body.phone_number,
        session_string=body.session_string,
        proxy_config=body.proxy_config or {},
        status="warming",
        trust_score=0.0,
        daily_message_count=0,
        created_at=datetime.utcnow(),
    )
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return _account_out(account)


@router.get("/{account_id}", response_model=AccountOut, tags=["Accounts"])
async def get_account(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Get details for a specific account (tenant-isolated)."""
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    await _require_own_account(db, account, current_user)
    return _account_out(account)


@router.put("/{account_id}", response_model=AccountOut, tags=["Accounts"])
async def update_account(
    account_id: int,
    body: AccountUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Update account settings (tenant-isolated)."""
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    await _require_own_account(db, account, current_user)

    if body.session_string is not None:
        account.session_string = body.session_string
    if body.proxy_config is not None:
        account.proxy_config = body.proxy_config
    if body.status is not None:
        account.status = body.status
    account.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(account)
    return _account_out(account)


@router.delete("/{account_id}", tags=["Accounts"])
async def delete_account(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Soft-delete an account (tenant-isolated)."""
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    await _require_own_account(db, account, current_user)
    account.status = "deleted"
    account.deleted_at = datetime.utcnow()
    await db.commit()
    return {"message": f"Account {account_id} deleted"}


@router.post("/{account_id}/health", response_model=AccountHealth, tags=["Accounts"])
async def check_account_health(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Check the health status of a specific account (tenant-isolated)."""
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    await _require_own_account(db, account, current_user)

    return AccountHealth(
        account_id=account_id,
        is_connected=account.status in ("active", "warming"),
        is_banned=account.status == "banned",
        is_spamblocked=False,
        trust_score=account.trust_score,
        daily_messages_sent=account.daily_message_count,
    )


@router.post("/{account_id}/warmup", tags=["Accounts"])
async def start_warmup(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Start the account warm-up process (tenant-isolated)."""
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    await _require_own_account(db, account, current_user)
    account.status = "warming"
    await db.commit()
    return {"message": f"Warm-up started for account {account_id}"}


@router.post("/{account_id}/suspend", tags=["Accounts"])
async def suspend_account(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Suspend an account temporarily (tenant-isolated)."""
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    await _require_own_account(db, account, current_user)
    account.status = "suspended"
    await db.commit()
    return {"message": f"Account {account_id} suspended"}


@router.post("/{account_id}/unsuspend", tags=["Accounts"])
async def unsuspend_account(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Resume a suspended account (tenant-isolated)."""
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    await _require_own_account(db, account, current_user)
    account.status = "active"
    await db.commit()
    return {"message": f"Account {account_id} unsuspended"}


# ─── Sprint-01: Account Status Folder System ────────────────────


@router.post("/health-check/bulk", tags=["Accounts"])
async def bulk_health_check(
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Run health check on multiple (or all) accounts."""
    q = select(Account)
    if current_user.role != "admin":
        q = q.where(Account.user_id == current_user.id)
    if body.get("select_all"):
        pass
    elif body.get("account_ids"):
        q = q.where(Account.id.in_(body["account_ids"]))
    else:
        raise HTTPException(status_code=400, detail="Provide account_ids or select_all=true")

    result = await db.execute(q)
    accounts = list(result.scalars().all())
    ids = [a.id for a in accounts]
    job_id = str(uuid.uuid4())

    results = await check_bulk(db, ids)

    return {
        "job_id": job_id,
        "status": "completed",
        "results": results["results"],
        "total": results["total"],
        "success": results["success"],
        "failed": results["failed"],
    }


@router.patch("/{account_id}/status", tags=["Accounts"])
async def update_account_status(
    account_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Manually update account status (e.g. archive)."""
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    await _require_own_account(db, account, current_user)

    new_status = body.get("status")
    valid_moves = {"archived", "active"}
    if new_status not in valid_moves:
        raise HTTPException(status_code=400, detail=f"Cannot manually set status to {new_status}")
    account.status = new_status
    account.updated_at = datetime.utcnow()
    await db.commit()
    return {"message": f"Account {account_id} status → {new_status}"}


@router.post("/bulk-status", tags=["Accounts"])
async def bulk_update_status(
    body: BulkStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Bulk update account status (archive/delete)."""
    q = select(Account).where(Account.id.in_(body.account_ids))
    if current_user.role != "admin":
        q = q.where(Account.user_id == current_user.id)
    result = await db.execute(q)
    accounts = list(result.scalars().all())

    for acct in accounts:
        acct.status = body.status
        acct.updated_at = datetime.utcnow()
    await db.commit()

    return {"message": f"{len(accounts)} accounts updated to {body.status}"}


@router.post("/flood-resume", tags=["Accounts"])
async def resume_flood_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Resume all flood-wait accounts whose wait time has expired."""
    from app.services.flood_resume_service import resume_flood_accounts as do_resume
    result = await do_resume(db)
    return result


# ─── Interactive Account Login (QR + Phone number) ─────────────────
# ponytail: pending logins held in-process; move to per-uid store when
# running multiple uvicorn workers.
_login_store: dict = {}


def _new_client(api_id: int, api_hash: str):
    from telethon import TelegramClient
    from telethon.sessions import StringSession
    return TelegramClient(StringSession(), api_id, api_hash)


def _make_svg_data_uri(url: str) -> str:
    import base64, io
    import qrcode
    import qrcode.image.svg
    img = qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage)
    buf = io.BytesIO()
    img.save(buf)
    return "data:image/svg+xml;base64," + base64.b64encode(buf.getvalue()).decode()


async def _drop_entry(entry_id: str):
    entry = _login_store.pop(entry_id, None)
    if entry and entry.get("_client"):
        try:
            await entry["_client"].disconnect()
        except Exception:
            pass


async def _safe_disconnect(client):
    try:
        await client.disconnect()
    except Exception:
        pass


def _get_entry(entry_id: str, current_user_id: int) -> dict:
    entry = _login_store.get(entry_id)
    if not entry or entry.get("user_id") != current_user_id:
        raise HTTPException(status_code=404, detail="Login session not found or expired")
    return entry


async def _finalize_login(db, user_id, client, phone, api_id, api_hash) -> dict:
    """Persist an authenticated session as an Account row."""
    session_string = client.session.save()
    if not phone:
        try:
            me = await client.get_me()
            phone = getattr(me, "phone", "") or ""
        except Exception:
            phone = ""
    if not phone:
        # phone_number is NOT NULL + unique — reject rather than write a bad row
        await _safe_disconnect(client)
        raise HTTPException(status_code=400, detail="Could not determine the account phone number — try the QR method instead")
    account = Account(
        user_id=user_id, phone_number=phone,
        session_string=session_string, status="active",
        api_id=api_id, api_hash=api_hash,
    )
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return {"account_id": account.id, "phone": phone, "status": "authorized"}


class LoginApiIn(BaseModel):
    api_id: int
    api_hash: str


class QRPasswordIn(BaseModel):
    password: str


class PhoneSendCodeIn(BaseModel):
    api_id: int
    api_hash: str
    phone: str


class PhoneVerifyIn(BaseModel):
    code: str
    password: str | None = None


@router.post("/login/qr/start", tags=["Accounts"])
async def qr_login_start(
    body: LoginApiIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Start a QR login — returns a QR to scan with the Telegram app."""
    from telethon.errors import ApiIdInvalidError
    entry_id = uuid.uuid4().hex
    client = _new_client(body.api_id, body.api_hash)
    try:
        await client.connect()
        qr = await client.qr_login()
        _login_store[entry_id] = {
            "_client": client, "qr": qr,
            "api_id": body.api_id, "api_hash": body.api_hash,
            "method": "qr", "user_id": current_user.id,
            "created": datetime.utcnow(),
        }
        return {
            "login_id": entry_id,
            "qr_data_uri": _make_svg_data_uri(qr.url),
            "instructions": "Scan with Telegram > Settings > Devices > Link Desktop Device",
        }
    except ApiIdInvalidError:
        await _safe_disconnect(client)
        raise HTTPException(status_code=400, detail="Invalid API ID / Hash from my.telegram.org")
    except Exception:
        await _safe_disconnect(client)
        logger.exception("QR login start failed")
        raise HTTPException(status_code=500, detail="QR login failed — check API ID / Hash")


@router.get("/login/qr/status/{entry_id}", tags=["Accounts"])
async def qr_login_status(
    entry_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Poll QR scan status. Returns authorized once the session is persisted."""
    from telethon.errors import SessionPasswordNeededError
    entry = _get_entry(entry_id, current_user.id)
    client, qr = entry["_client"], entry["qr"]
    try:
        await qr.wait(poll_interval=2, timeout=8)
    except SessionPasswordNeededError:
        return {"status": "awaiting_password", "login_id": entry_id}
    except Exception:
        return {"status": "pending", "login_id": entry_id}

    if await client.is_user_authorized():
        try:
            result = await _finalize_login(
                db, current_user.id, client,
                entry.get("phone", ""), entry["api_id"], entry["api_hash"],
            )
            await _drop_entry(entry_id)
            return {"status": "authorized", **result}
        except Exception:
            logger.exception("QR finalize failed")
            await _drop_entry(entry_id)
            raise HTTPException(status_code=500, detail="Failed to save account after login")
    return {"status": "pending", "login_id": entry_id}


@router.post("/login/qr/password/{entry_id}", tags=["Accounts"])
async def qr_login_password(
    entry_id: str,
    body: QRPasswordIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Submit 2FA password for a QR login that requires it."""
    entry = _get_entry(entry_id, current_user.id)
    client = entry["_client"]
    try:
        await client.sign_in(password=body.password)
    except Exception:
        logger.exception("2FA password rejected")
        raise HTTPException(status_code=400, detail="Invalid 2FA password")
    result = await _finalize_login(
        db, current_user.id, client,
        entry.get("phone", ""), entry["api_id"], entry["api_hash"],
    )
    await _drop_entry(entry_id)
    return {"status": "authorized", **result}


@router.post("/login/qr/cancel/{entry_id}", tags=["Accounts"])
async def qr_login_cancel(
    entry_id: str, current_user: User = Depends(get_current_user_tenant),
):
    _get_entry(entry_id, current_user.id)
    await _drop_entry(entry_id)
    return {"status": "cancelled"}


@router.post("/login/phone/send-code", tags=["Accounts"])
async def phone_login_send_code(
    body: PhoneSendCodeIn,
    current_user: User = Depends(get_current_user_tenant),
):
    """Request an SMS/call login code for a phone number."""
    from telethon.errors import ApiIdInvalidError, PhoneNumberInvalidError, PhoneNumberBannedError
    entry_id = uuid.uuid4().hex
    client = _new_client(body.api_id, body.api_hash)
    try:
        await client.connect()
        await client.send_code_request(body.phone)
        _login_store[entry_id] = {
            "_client": client, "phone": body.phone,
            "api_id": body.api_id, "api_hash": body.api_hash,
            "method": "phone", "user_id": current_user.id,
            "created": datetime.utcnow(),
        }
        return {"login_id": entry_id, "status": "code_sent", "phone": body.phone}
    except (ApiIdInvalidError,):
        await _safe_disconnect(client)
        raise HTTPException(status_code=400, detail="Invalid API ID / Hash from my.telegram.org")
    except PhoneNumberInvalidError:
        await _safe_disconnect(client)
        raise HTTPException(status_code=400, detail="Invalid phone number (use international format, e.g. +1234567890)")
    except PhoneNumberBannedError:
        await _safe_disconnect(client)
        raise HTTPException(status_code=400, detail="This phone number is banned on Telegram")
    except Exception:
        await _safe_disconnect(client)
        logger.exception("Phone send-code failed")
        raise HTTPException(status_code=500, detail="Failed to send login code")


@router.post("/login/phone/verify/{entry_id}", tags=["Accounts"])
async def phone_login_verify(
    entry_id: str,
    body: PhoneVerifyIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_tenant),
):
    """Complete phone login with the received code (and 2FA password if required)."""
    from telethon.errors import SessionPasswordNeededError, PhoneCodeInvalidError, PhoneCodeExpiredError
    entry = _get_entry(entry_id, current_user.id)
    client = entry["_client"]
    try:
        await client.sign_in(entry["phone"], code=body.code)
    except SessionPasswordNeededError:
        if not body.password:
            return {"status": "awaiting_password", "login_id": entry_id}
        try:
            await client.sign_in(password=body.password)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid 2FA password")
    except PhoneCodeInvalidError:
        raise HTTPException(status_code=400, detail="Invalid code — check the code you entered")
    except PhoneCodeExpiredError:
        await _drop_entry(entry_id)
        raise HTTPException(status_code=400, detail="Code expired — request a new one")

    result = await _finalize_login(
        db, current_user.id, client,
        entry["phone"], entry["api_id"], entry["api_hash"],
    )
    await _drop_entry(entry_id)
    return {"status": "authorized", **result}


@router.post("/login/phone/cancel/{entry_id}", tags=["Accounts"])
async def phone_login_cancel(
    entry_id: str, current_user: User = Depends(get_current_user_tenant),
):
    _get_entry(entry_id, current_user.id)
    await _drop_entry(entry_id)
    return {"status": "cancelled"}
