"""Account health checking service — real Telethon calls + status transitions + caching."""
import asyncio
import time
from datetime import datetime, timezone, timedelta
from typing import Optional

from loguru import logger
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Account, AccountStatus, Alert


_cache: dict[int, tuple[dict, float]] = {}
_cache_ttl = 120  # seconds


def _compute_health_score(account: Account, ping_ms: Optional[int] = None) -> int:
    score = 50
    if account.status == AccountStatus.ACTIVE.value:
        score = 85
    elif account.status == AccountStatus.SPAMBLOCK_TEMP.value:
        score = 30
    elif account.status == AccountStatus.SPAMBLOCK_PERM.value:
        score = 10
    elif account.status == AccountStatus.FROZEN.value:
        score = 15
    elif account.status == AccountStatus.BANNED.value:
        score = 0
    elif account.status == AccountStatus.WARMING.value:
        score = 40
    elif account.status == AccountStatus.ARCHIVED.value:
        score = 0
    score = min(100, max(0, score + int(account.trust_score * 10)))
    if ping_ms and ping_ms < 100:
        score = min(100, score + 5)
    elif ping_ms and ping_ms > 500:
        score = max(0, score - 10)
    return score


def _transition_status(account: Account, api_error: Optional[str]) -> str:
    if not api_error:
        return AccountStatus.ACTIVE.value
    err = api_error.upper()
    if "FLOOD_WAIT" in err:
        import re
        m = re.search(r"FLOOD_WAIT_(\d+)", err)
        seconds = int(m.group(1)) if m else 300
        account.spamblock_until = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(seconds=seconds)
        return AccountStatus.SPAMBLOCK_TEMP.value
    if "AUTH_KEY_INVALID" in err or "AUTH_KEY_UNREGISTERED" in err:
        return AccountStatus.BANNED.value
    if "SESSION_REVOKED" in err or "SESSION_PASSWORD_NEEDED" in err:
        return AccountStatus.FROZEN.value
    if "USER_DEACTIVATED" in err or "USER_DEACTIVATED_BAN" in err:
        return AccountStatus.BANNED.value
    return account.status


async def check_single(db: AsyncSession, account: Account, force: bool = False) -> dict:
    cached = _cache.get(account.id)
    if cached and not force and time.monotonic() - cached[1] < _cache_ttl:
        return cached[0]
    old_status = account.status
    dc_id = account.dc_id
    ping_ms = None
    api_error = None
    if account.session_string and account.api_id and account.api_hash:
        try:
            from telethon import TelegramClient
            from telethon.errors import FloodWaitError, AuthKeyInvalidError, SessionRevokedError
            client = TelegramClient(f"health_{account.id}", account.api_id, account.api_hash)
            await client.connect()
            start = time.monotonic()
            if await client.is_user_authenticated():
                me = await client.get_me()
                dc_id = me.dc_id if hasattr(me, 'dc_id') else dc_id
                ping_ms = int((time.monotonic() - start) * 1000)
            else:
                api_error = "AUTH_KEY_INVALID"
            await client.disconnect()
        except FloodWaitError as e:
            api_error = f"FLOOD_WAIT_{e.seconds}"
        except AuthKeyInvalidError:
            api_error = "AUTH_KEY_INVALID"
        except SessionRevokedError:
            api_error = "SESSION_REVOKED"
        except Exception as e:
            api_error = str(e)
    else:
        api_error = "No session string" if not account.session_string else None
    new_status = _transition_status(account, api_error)
    changed = old_status != new_status
    account.status = new_status
    account.health_check_at = datetime.now(timezone.utc).replace(tzinfo=None)
    account.health_score = _compute_health_score(account, ping_ms)
    if dc_id:
        account.dc_id = dc_id
    if ping_ms:
        account.ping_ms = ping_ms
    result = {
        "account_id": account.id, "old_status": old_status,
        "new_status": new_status, "changed": changed,
        "ping_ms": ping_ms, "dc_id": dc_id, "error": api_error,
    }
    _cache[account.id] = (result, time.monotonic())
    if changed and new_status in ("ban", "frozen", "spamblock_temp"):
        db.add(Alert(
            alert_type="health_drop", severity="warning",
            title=f"Account {account.phone_number} status changed",
            message=f"Changed from {old_status} to {new_status}: {api_error}",
            data={"account_id": account.id, "old": old_status, "new": new_status},
        ))
    return result


async def check_bulk(db: AsyncSession, account_ids: list[int], max_workers: int = 20) -> dict:
    result = await db.execute(select(Account).where(Account.id.in_(account_ids)))
    accounts = list(result.scalars().all())
    semaphore = asyncio.Semaphore(max_workers)
    async def _check(acct: Account) -> dict:
        async with semaphore:
            return await check_single(db, acct)
    results = await asyncio.gather(*[_check(a) for a in accounts], return_exceptions=True)
    out = []
    for i, r in enumerate(results):
        if isinstance(r, Exception):
            out.append({"account_id": accounts[i].id if i < len(accounts) else -1, "error": str(r)})
        else:
            out.append(r)
    await db.commit()
    return {"results": out, "total": len(out), "success": sum(1 for r in out if r.get("error") is None), "failed": sum(1 for r in out if r.get("error") is not None)}


async def scheduled_health_check(db_factory, interval_seconds: int = 1800):
    while True:
        try:
            async with db_factory() as db:
                result = await db.execute(select(Account.id))
                ids = [r[0] for r in result.all()]
                if ids:
                    await check_bulk(db, ids)
                    logger.info(f"Scheduled health check: {len(ids)} accounts")
        except Exception as e:
            logger.warning(f"Scheduled health check error: {e}")
        await asyncio.sleep(interval_seconds)


async def check_all_health(db: AsyncSession) -> dict:
    result = await db.execute(select(Account.id))
    ids = [r[0] for r in result.all()]
    if not ids:
        return {"total": 0, "results": []}
    return await check_bulk(db, ids)
