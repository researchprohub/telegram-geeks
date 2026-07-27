"""Settings service — key-value persistence for system settings."""

import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import SystemSetting
from app.core.encryption import encrypt, decrypt, is_encrypted

ENCRYPTED_KEYS = {"nowpayments_api_key", "oxapay_api_key", "telegram_api_hash", "telegram_api_id"}

DEFAULTS = {
    "platform_name": "TelegramGeeks",
    "maintenance_mode": "false",
    "registration_enabled": "true",
    "starter_price_monthly": "29.0",
    "starter_price_yearly": "290.0",
    "pro_price_monthly": "79.0",
    "pro_price_yearly": "790.0",
    "agency_price_monthly": "199.0",
    "agency_price_yearly": "1990.0",
    "supported_cryptos": '["BTC","ETH","USDT","USDC","LTC","DOGE","BNB","SOL","XRP","TRX"]',
    "polling_interval": "30",
}


class SettingsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> dict:
        result = await self.db.execute(select(SystemSetting))
        rows = {}
        for r in result.scalars().all():
            val = r.value
            if r.key in ENCRYPTED_KEYS and val and is_encrypted(val):
                val = decrypt(val)
            rows[r.key] = val
        return {**DEFAULTS, **rows}

    async def get(self, key: str) -> str | None:
        result = await self.db.execute(select(SystemSetting).where(SystemSetting.key == key))
        r = result.scalar_one_or_none()
        val = r.value if r else DEFAULTS.get(key)
        if key in ENCRYPTED_KEYS and val and is_encrypted(val):
            val = decrypt(val)
        return val

    async def set(self, key: str, value: str):
        if key in ENCRYPTED_KEYS and value:
            value = encrypt(value)
        result = await self.db.execute(select(SystemSetting).where(SystemSetting.key == key))
        r = result.scalar_one_or_none()
        if r:
            r.value = value
        else:
            self.db.add(SystemSetting(key=key, value=value))
        await self.db.commit()

    async def update_all(self, settings: dict):
        for key, value in settings.items():
            if key in DEFAULTS:
                str_val = str(value).lower() if isinstance(value, bool) else str(value)
                await self.set(key, str_val)
