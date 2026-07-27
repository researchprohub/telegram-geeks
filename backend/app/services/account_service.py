"""Account lifecycle service."""

from app.models import Account, AccountStatus
from app.exceptions import AccountNotFoundError, AccountBannedError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


class AccountService:
    """Business logic for account management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_account(self, account_id: int) -> Account:
        result = await self.db.execute(select(Account).where(Account.id == account_id))
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
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_account(self, phone_number: str, session_string: str | None = None) -> Account:
        account = Account(
            phone_number=phone_number,
            session_string=session_string,
            status=AccountStatus.WARMING,
        )
        self.db.add(account)
        await self.db.flush()
        await self.db.refresh(account)
        return account

    async def update_status(self, account_id: int, status: AccountStatus):
        account = await self.get_account(account_id)
        account.status = status
        await self.db.flush()

    async def suspend_account(self, account_id: int, reason: str | None = None):
        account = await self.get_account(account_id)
        account.status = AccountStatus.SUSPENDED
        account.ban_reason = reason
        await self.db.flush()

    async def check_health(self, account_id: int) -> dict:
        account = await self.get_account(account_id)
        return {
            "account_id": account.id,
            "status": account.status.value,
            "trust_score": account.trust_score,
            "daily_messages": account.daily_message_count,
            "flood_wait": account.flood_wait_until.isoformat() if account.flood_wait_until else None,
            "is_banned": account.status == AccountStatus.BANNED,
        }
