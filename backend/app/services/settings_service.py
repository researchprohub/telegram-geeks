"""Settings service — key-value persistence for system settings."""

import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import SystemSetting
from app.core.encryption import encrypt, decrypt, is_encrypted

ENCRYPTED_KEYS = {
    "nowpayments_api_key",
    "oxapay_api_key",
    "telegram_api_hash",
    "telegram_api_id",
    "smtp_password",
    "resend_api_key",
    "mailtrap_api_token",
}

DEFAULTS = {
    "platform_name": "TelegramGeeks Pro",
    "maintenance_mode": "false",
    "registration_enabled": "true",
    "starter_price_monthly": "29.0",
    "starter_price_yearly": "290.0",
    "pro_price_monthly": "79.0",
    "pro_price_yearly": "790.0",
    "agency_price_monthly": "199.0",
    "agency_price_yearly": "1990.0",
    "supported_cryptos": '["BTC","ETH","USDT","USDC","LTC","DOGE","BNB","SOL","XMR","TRX","TON"]',
    "polling_interval": "30",
    # Wallet Addresses
    "wallet_sol": "9HWxxL9duEamX7xPbmdAEc26frc3RzMGewfzwqEe5duN",
    "wallet_xmr": "428fAZEbHjvQ4eUGzhUKbDhhF43zyDPSqYrvdmn4jasgd1iLPfX3mAfcGq6L1bW6esNxda3ntBGfaZ2uLDXeAohoE8u3u4d",
    "wallet_eth": "0x96d294E27D4Bb2959897aC11FFCE03606324380B",
    "wallet_btc": "bc1qjy9v9jnq3cdupghzlc29m3wpft7pnxjpurda23",
    "wallet_trx": "TQQcN4KhNKc6c4BPWzCDjhNm4YPGSWLrqi",
    "wallet_usdt_trc20": "TQQcN4KhNKc6c4BPWzCDjhNm4YPGSWLrqi",
    "wallet_usdt_erc20": "0x96d294E27D4Bb2959897aC11FFCE03606324380B",
    "wallet_ton": "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N",
    # Email Notification Settings
    "email_provider": "disabled",  # 'smtp' | 'resend' | 'mailtrap' | 'disabled'
    "email_from_name": "TelegramGeeks Pro",
    "email_from_address": "notifications@telegramgeekspro.com",
    "smtp_host": "smtp.mailtrap.io",
    "smtp_port": "587",
    "smtp_user": "",
    "smtp_password": "",
    "smtp_tls": "true",
    "smtp_ssl": "false",
    "resend_api_key": "",
    "resend_from_email": "notifications@telegramgeekspro.com",
    "mailtrap_api_token": "",
    "mailtrap_inbox_id": "",
    "mailtrap_is_sandbox": "true",
    "email_notifications_enabled": "true",
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
