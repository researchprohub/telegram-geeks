"""Flood auto-resume service — resumes accounts after flood_wait expires."""
from datetime import datetime, timezone

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Account


async def resume_flood_accounts(db: AsyncSession) -> dict:
    """Resume all flood-wait accounts whose wait time has expired."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    result = await db.execute(
        select(Account).where(
            Account.status == "spamblock_temp",
            Account.spamblock_until.isnot(None),
            Account.spamblock_until <= now,
        )
    )
    accounts = result.scalars().all()

    resumed = 0
    for acct in accounts:
        acct.status = "active"
        acct.spamblock_until = None
        logger.info(f"Auto-resumed account {acct.id} ({acct.phone_number}) from flood wait")
        resumed += 1

    if resumed:
        await db.commit()
        logger.info(f"Flood auto-resume: {resumed} accounts resumed")

    return {"resumed": resumed, "total_flooded": len(accounts)}


async def count_flooded_accounts(db: AsyncSession) -> dict:
    """Count accounts currently in flood wait."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    total = await db.execute(
        select(Account).where(Account.status == "spamblock_temp")
    )
    expired = await db.execute(
        select(Account).where(
            Account.status == "spamblock_temp",
            Account.spamblock_until.isnot(None),
            Account.spamblock_until <= now,
        )
    )
    return {
        "total_flooded": len(total.scalars().all()),
        "expired_ready_resume": len(expired.scalars().all()),
    }
