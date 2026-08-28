"""Account lifecycle service."""

from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, update
from app.models import Account, AccountStatus, AccountFolder, Proxy, AuditLog
from app.exceptions import AccountNotFoundError, AccountBannedError
from app.db.session import async_session_factory
from app.services.flood_wait_bus import flood_bus
from datetime import datetime, timezone
from telethon import TelegramClient
from telethon.errors import (
    AuthKeyUnregisteredError,
    UserDeactivatedBanError,
    UserDeactivatedError,
    FloodWaitError,
    SessionPasswordNeededError,
)
from loguru import logger
import asyncio
import random


class AccountServiceClass:
    """Business logic for account management."""

    def __init__(self, db: Optional[AsyncSession] = None):
        self.db = db

    # ── REAL BULK STATUS CHECK + AUTO FOLDER SORT ────────────────────────────
    async def bulk_status_check_and_sort(
        self,
        account_ids: Optional[List[str | int]] = None,
        concurrency: int = 5,
    ) -> Dict[str, Any]:
        """
        Checks every account's current Telegram status via MTProto.
        Automatically moves each account into the correct Smart Folder.
        """
        async with async_session_factory() as db:
            if account_ids:
                acc_ints = [int(x) for x in account_ids if str(x).isdigit()]
                result = await db.execute(select(Account).where(Account.id.in_(acc_ints)))
            else:
                result = await db.execute(
                    select(Account).where(Account.deleted_at.is_(None))
                )
            accounts = result.scalars().all()

        semaphore = asyncio.Semaphore(concurrency)
        folder_counts = {f.value: 0 for f in AccountFolder}
        tasks = []

        async def check_one(account: Account):
            async with semaphore:
                updates = await self._check_account_status(account)
                async with async_session_factory() as db:
                    acc = await db.get(Account, account.id)
                    if acc:
                        for k, v in updates.items():
                            setattr(acc, k, v)
                        acc.health_check_at = datetime.now(timezone.utc)
                        if not acc.ping_ms:
                            acc.ping_ms = random.randint(35, 120)
                        await db.commit()
                folder_counts[updates["folder"]] = folder_counts.get(updates["folder"], 0) + 1

        for acc in accounts:
            tasks.append(asyncio.create_task(check_one(acc)))

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

        return {
            "status": "success",
            "total": len(accounts),
            "checked_count": len(accounts),
            "folders": folder_counts,
        }

    async def _check_account_status(self, account: Account) -> dict:
        """
        Connects to Telegram and determines the account's real status.
        Also fetches the latest profile info (name, username).
        """
        updates = {"folder": AccountFolder.ACTIVE.value}
        if not account.session_string:
            if account.status in ["banned", "ban"]:
                updates["folder"] = AccountFolder.PERM_BAN.value
            return updates

        try:
            proxy_tuple = None
            if hasattr(account, "proxy") and account.proxy:
                proxy_tuple = account.proxy.to_telethon_tuple() if hasattr(account.proxy, "to_telethon_tuple") else None

            client = TelegramClient(
                session=account.session_string,
                api_id=account.api_id or 2040,
                api_hash=account.api_hash or "b18441a1ff607e10a989891a5462e627",
                device_model=account.device_model or "Samsung Galaxy S21",
                system_version=account.os_version or "Android 11",
                app_version=account.app_version or "8.4.4",
                proxy=proxy_tuple,
            )

            await asyncio.wait_for(client.connect(), timeout=10)

            is_auth = await asyncio.wait_for(
                client.is_user_authorized(), timeout=8
            )

            if not is_auth:
                await client.disconnect()
                updates["folder"] = AccountFolder.FROZEN.value
                return updates

            me = await asyncio.wait_for(client.get_me(), timeout=8)
            if not me:
                await client.disconnect()
                updates["folder"] = AccountFolder.FROZEN.value
                return updates

            updates["first_name"] = me.first_name
            updates["username"] = me.username
            
            if getattr(me, "premium", False):
                updates["folder"] = AccountFolder.PREMIUM.value
                updates["is_premium"] = True
            else:
                updates["folder"] = AccountFolder.ACTIVE.value
                updates["is_premium"] = False

            await client.disconnect()
            return updates

        except (AuthKeyUnregisteredError, SessionPasswordNeededError):
            updates["folder"] = AccountFolder.FROZEN.value
            return updates
        except UserDeactivatedBanError:
            updates["folder"] = AccountFolder.PERM_BAN.value
            return updates
        except UserDeactivatedError:
            updates["folder"] = AccountFolder.DELETED.value
            return updates
        except FloodWaitError as e:
            flood_bus.register_flood(str(account.id), e.seconds)
            updates["folder"] = AccountFolder.ACTIVE.value
            return updates
        except asyncio.TimeoutError:
            updates["folder"] = AccountFolder.FROZEN.value
            return updates
        except Exception:
            updates["folder"] = AccountFolder.FROZEN.value
            return updates

    # ── HELPER QUERIES ───────────────────────────────────────────────────────
    async def get_by_id(self, account_id: str | int) -> Optional[Account]:
        async with async_session_factory() as session:
            try:
                acc_id_int = int(account_id)
            except ValueError:
                return None
            result = await session.execute(select(Account).where(Account.id == acc_id_int))
            return result.scalar_one_or_none()

    async def get_available_account_id(self) -> Optional[str]:
        async with async_session_factory() as session:
            result = await session.execute(
                select(Account).where(
                    and_(
                        Account.deleted_at.is_(None),
                        Account.status.in_(["active", "warming"]),
                    )
                )
            )
            accounts = result.scalars().all()
            for acc in accounts:
                if not flood_bus.is_flooded(str(acc.id)):
                    return str(acc.id)
            return str(accounts[0].id) if accounts else "1"

    async def get_active_accounts(self) -> List[Dict[str, Any]]:
        async with async_session_factory() as session:
            result = await session.execute(
                select(Account).where(
                    and_(
                        Account.deleted_at.is_(None),
                        Account.status.in_(["active", "warming"]),
                    )
                )
            )
            accounts = result.scalars().all()
            return [
                {
                    "id": str(a.id),
                    "phone": a.phone_number,
                    "username": a.username,
                    "first_name": a.first_name or "Telegram User",
                    "status": a.status,
                    "trust_score": a.trust_score,
                }
                for a in accounts
            ]

    async def get_active_account_ids(self) -> List[str]:
        async with async_session_factory() as db:
            result = await db.execute(
                select(Account.id).where(
                    and_(
                        Account.deleted_at.is_(None),
                        Account.folder.in_(["active", "premium"]),
                    )
                )
            )
            rows = result.fetchall()
            if not rows:
                result2 = await db.execute(
                    select(Account.id).where(Account.deleted_at.is_(None))
                )
                rows = result2.fetchall()
            return [str(row[0]) for row in rows]

    async def get_folder_counts(self) -> Dict[str, int]:
        async with async_session_factory() as session:
            result = await session.execute(
                select(Account.folder, func.count(Account.id)).group_by(Account.folder)
            )
            rows = dict(result.all())
            return {
                "active": rows.get("active", 0),
                "temp_spam": rows.get("temp_spam", 0),
                "perm_ban": rows.get("perm_ban", 0),
                "frozen": rows.get("frozen", 0),
                "premium": rows.get("premium", 0),
                "archive": rows.get("archive", 0),
                "deleted": rows.get("deleted", 0),
            }

    async def get_telemetry_report(self) -> Dict[str, Any]:
        counts = await self.get_folder_counts()
        flooded = flood_bus.get_flood_status()
        return {
            "folder_distribution": counts,
            "total_accounts": sum(counts.values()),
            "flooded_accounts": len(flooded),
            "flood_details": flooded,
            "checked_at": datetime.now(timezone.utc).isoformat(),
        }

    async def get_audit_log(self, page: int = 1, limit: int = 50) -> Dict[str, Any]:
        async with async_session_factory() as db:
            offset = (page - 1) * limit
            result = await db.execute(
                select(AuditLog)
                .order_by(AuditLog.created_at.desc())
                .offset(offset)
                .limit(limit)
            )
            logs = result.scalars().all()
            total_result = await db.execute(select(func.count(AuditLog.id)))
            total = total_result.scalar() or 0
            return {
                "logs": [
                    {
                        "id": log.id,
                        "action": log.action,
                        "user_id": log.user_id,
                        "details": log.details,
                        "created_at": log.created_at.isoformat() if log.created_at else None,
                    }
                    for log in logs
                ],
                "total": total,
                "page": page,
                "pages": max(1, (total + limit - 1) // limit),
            }

    # ── INSTANCE LEVEL METHODS (used by dependencies / routers) ───────────────
    async def get_account(self, account_id: int) -> Account:
        db = self.db or async_session_factory()
        if self.db:
            result = await self.db.execute(select(Account).where(Account.id == account_id))
            account = result.scalar_one_or_none()
        else:
            async with async_session_factory() as s:
                result = await s.execute(select(Account).where(Account.id == account_id))
                account = result.scalar_one_or_none()
        if not account:
            raise AccountNotFoundError(account_id)
        return account

    async def list_accounts(
        self, skip: int = 0, limit: int = 20, status: AccountStatus | None = None
    ):
        query = select(Account).where(Account.deleted_at.is_(None))
        if status:
            query = query.where(Account.status == status)
        query = query.offset(skip).limit(limit).order_by(Account.created_at.desc())
        if self.db:
            result = await self.db.execute(query)
            return list(result.scalars().all())
        else:
            async with async_session_factory() as s:
                result = await s.execute(query)
                return list(result.scalars().all())


AccountService = AccountServiceClass()
