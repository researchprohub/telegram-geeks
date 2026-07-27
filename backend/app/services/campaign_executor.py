"""Campaign execution engine — executes campaign actions via Telegram."""
import asyncio
import random
import time
from datetime import datetime, timezone
from loguru import logger
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Campaign, Account, CampaignLogEntry, CampaignStatus


class RateLimiter:
    """Per-account rate limiter — tracks sends per window."""
    def __init__(self, max_per_minute: int = 5):
        self.max_per_minute = max_per_minute
        self.buckets: dict[int, list[float]] = {}

    def check(self, account_id: int) -> bool:
        now = time.monotonic()
        timestamps = self.buckets.get(account_id, [])
        timestamps = [t for t in timestamps if now - t < 60]
        if len(timestamps) >= self.max_per_minute:
            return False
        timestamps.append(now)
        self.buckets[account_id] = timestamps
        return True

    async def wait(self, account_id: int):
        while not self.check(account_id):
            await asyncio.sleep(5)


class CampaignExecutor:
    def __init__(self, client_manager=None, ai_engine=None):
        self.client_manager = client_manager
        self.ai_engine = ai_engine
        self._tasks: dict[int, asyncio.Task] = {}
        self._running: set[int] = set()
        self._rate_limiter = RateLimiter()
        self._pause_events: dict[int, asyncio.Event] = {}

    async def execute_tick(self, campaign: Campaign, db: AsyncSession) -> dict:
        if campaign.id in self._pause_events:
            await self._pause_events[campaign.id].wait()
        if campaign.status != CampaignStatus.RUNNING.value:
            return {"status": "skipped", "reason": "campaign not running"}
        config = campaign.config or {}
        ctype = campaign.campaign_type
        targets = campaign.target_groups or []
        if not targets:
            return {"status": "skipped", "reason": "no target groups"}
        accts = await db.execute(
            select(Account).where(
                Account.status.in_(["active", "warming"]),
                Account.deleted_at.is_(None),
            )
        )
        accounts = [a for a in accts.scalars().all() if self._rate_limiter.check(a.id)]
        if not accounts:
            return {"status": "skipped", "reason": "no rate-available accounts"}
        acc = random.choice(accounts)
        gid = random.choice(targets)
        results = []
        handler = {
            "messaging": self._msg,
            "engagement": self._engage,
            "invite": self._invite,
            "social_proof": self._boost,
        }.get(ctype)
        if handler:
            r = await handler(campaign, acc, gid, config, db)
            results.append(r)
        self._running.discard(campaign.id)
        return {"status": "ok", "results": results}

    def pause(self, campaign_id: int):
        self._pause_events[campaign_id] = asyncio.Event()
        self._pause_events[campaign_id].clear()

    def resume(self, campaign_id: int):
        ev = self._pause_events.pop(campaign_id, None)
        if ev:
            ev.set()

    def stop(self, campaign_id: int):
        self._pause_events.pop(campaign_id, None)
        self._running.discard(campaign_id)

    async def _log(self, db: AsyncSession, campaign_id: int, account_id: int | None,
                   group_id: int | None, action: str, status: str,
                   message: str | None = None, error: str | None = None, meta: dict | None = None):
        db.add(CampaignLogEntry(
            campaign_id=campaign_id, account_id=account_id, group_id=group_id,
            action=action, status=status, message=message, error=error, meta=meta,
        ))

    async def _msg(self, campaign: Campaign, acc: Account, gid: int, config: dict, db: AsyncSession) -> dict:
        text = config.get("message_template", "Hello!")
        if self.ai_engine and config.get("ai_generated"):
            text = await self.ai_engine.generate(
                f"Write a short group message about {config.get('topic', 'general')}", max_tokens=100
            )
        if self.client_manager and acc.session_string:
            try:
                await self._rate_limiter.wait(acc.id)
                mid = await self.client_manager.send_message(acc.phone_number, gid, text)
                acc.daily_message_count = (acc.daily_message_count or 0) + 1
                await self._log(db, campaign.id, acc.id, gid, "sent", "sent", text[:200])
                await db.commit()
                return {"action": "sent", "account": acc.phone_number, "group": gid}
            except Exception as e:
                err = str(e)
                await self._log(db, campaign.id, acc.id, gid, "sent", "failed", error=err)
                if "ban" in err.lower() or "auth_key" in err.lower():
                    acc.status = "ban"
                    acc.ban_reason = err[:200]
                await db.commit()
                return {"action": "failed", "error": err}
        return {"action": "skipped", "reason": "no client"}

    async def _engage(self, campaign: Campaign, acc: Account, gid: int, config: dict, db: AsyncSession) -> dict:
        if self.client_manager and acc.session_string:
            try:
                await self._rate_limiter.wait(acc.id)
                rxn = config.get("reaction", random.choice(["👍", "❤️", "🔥"]))
                client = await self.client_manager.get_client(acc.phone_number)
                if client:
                    msgs = await client.get_messages(gid, limit=3)
                    for m in msgs:
                        if m and not m.out:
                            from telethon.tl.functions.messages import SendReactionRequest
                            await client(SendReactionRequest(peer=gid, msg_id=m.id, reaction=rxn))
                            await asyncio.sleep(3)
                            break
                    await self._log(db, campaign.id, acc.id, gid, "reacted", "sent", meta={"reaction": rxn})
                    await db.commit()
                    return {"action": "reacted", "account": acc.phone_number, "reaction": rxn}
            except Exception as e:
                err = str(e)
                await self._log(db, campaign.id, acc.id, gid, "reacted", "failed", error=err)
                if "ban" in err.lower() or "auth_key" in err.lower():
                    acc.status = "ban"
                    acc.ban_reason = err[:200]
                await db.commit()
                return {"action": "failed", "error": err}
        return {"action": "skipped"}

    async def _invite(self, campaign: Campaign, acc: Account, gid: int, config: dict, db: AsyncSession) -> dict:
        if self.client_manager and acc.session_string:
            try:
                await self._rate_limiter.wait(acc.id)
                members = config.get("target_users", [])
                if not members:
                    # Grab recent members from the group
                    client = await self.client_manager.get_client(acc.phone_number)
                    if client:
                        participants = await client.get_participants(gid, limit=5)
                        members = [p.id for p in participants if p.id]
                invited = 0
                for uid in members[:5]:
                    try:
                        await self.client_manager.invite_to_group(acc.phone_number, gid, [uid])
                        invited += 1
                        await asyncio.sleep(random.uniform(5, 15))
                    except Exception:
                        pass
                await self._log(db, campaign.id, acc.id, gid, "invited", "sent", meta={"count": invited})
                await db.commit()
                return {"action": "invited", "account": acc.phone_number, "count": invited}
            except Exception as e:
                err = str(e)
                await self._log(db, campaign.id, acc.id, gid, "invited", "failed", error=err)
                if "ban" in err.lower():
                    acc.status = "ban"
                    acc.ban_reason = err[:200]
                await db.commit()
                return {"action": "failed", "error": err}
        return {"action": "skipped"}

    async def _boost(self, campaign: Campaign, acc: Account, gid: int, config: dict, db: AsyncSession) -> dict:
        # ponytail: simple view/join boost, proper view-bot if needed later
        if self.client_manager and acc.session_string:
            try:
                await self._rate_limiter.wait(acc.id)
                client = await self.client_manager.get_client(acc.phone_number)
                if client:
                    await client.get_messages(gid, limit=1)
                    await self._log(db, campaign.id, acc.id, gid, "boosted", "sent")
                    await db.commit()
                    return {"action": "boosted", "account": acc.phone_number}
            except Exception as e:
                await self._log(db, campaign.id, acc.id, gid, "boosted", "failed", error=str(e))
                await db.commit()
                return {"action": "failed", "error": str(e)}
        return {"action": "skipped"}

    async def get_progress(self, campaign_id: int, db: AsyncSession) -> dict:
        total = await db.execute(
            select(func.count(CampaignLogEntry.id)).where(CampaignLogEntry.campaign_id == campaign_id)
        )
        sent = await db.execute(
            select(func.count(CampaignLogEntry.id)).where(
                CampaignLogEntry.campaign_id == campaign_id, CampaignLogEntry.status == "sent"
            )
        )
        failed = await db.execute(
            select(func.count(CampaignLogEntry.id)).where(
                CampaignLogEntry.campaign_id == campaign_id, CampaignLogEntry.status == "failed"
            )
        )
        return {
            "campaign_id": campaign_id,
            "total": total.scalar() or 0,
            "sent": sent.scalar() or 0,
            "failed": failed.scalar() or 0,
        }
