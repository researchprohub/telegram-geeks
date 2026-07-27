"""Session duplicator — Clone sessions across devices (Telegram Expert clone)."""

import asyncio
from loguru import logger


class DuplicatorService:
    """Duplicates/create copies of sessions for multi-device usage."""

    def __init__(self, client_manager):
        self.client_manager = client_manager

    async def duplicate_session(self, account_id: str, api_id: int | None = None, api_hash: str | None = None, device_model: str = "Desktop") -> dict:
        """Duplicate a session as if it were a new device."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Source account not connected"}
        try:
            me = await client.get_me()
            session_string = await client.session.save()
            api_id = api_id or self.client_manager.config.api_id
            api_hash = api_hash or self.client_manager.config.api_hash
            return {
                "account_id": account_id,
                "phone": me.phone if me else "unknown",
                "device_model": device_model,
                "session_string": session_string,
                "api_id": api_id,
                "api_hash": api_hash,
            }
        except Exception as e:
            logger.error(f"Duplicate session error: {e}")
            return {"error": str(e)}

    async def export_qr_code(self, account_id: str) -> dict:
        """Generate QR code data for login."""
        return {"info": "QR generation available via Telethon login flow", "account_id": account_id}

    async def clone_to_device(self, account_id: str, session_string: str, device_name: str = "Clone") -> dict:
        """Register a duplicated session under a new device name."""
        try:
            await self.client_manager.connect_account(f"{account_id}_{device_name}", session_string)
            return {"account_id": account_id, "cloned_as": f"{account_id}_{device_name}", "status": "connected"}
        except Exception as e:
            return {"error": str(e)}

    async def list_devices(self, account_id: str) -> list[dict]:
        """List all active sessions/devices for an account."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return []
        try:
            from telethon.tl.functions.account import GetAuthorizationsRequest
            auths = await client(GetAuthorizationsRequest())
            return [
                {
                    "hash": a.hash,
                    "device": a.device_model,
                    "platform": a.platform,
                    "app_version": a.app_version,
                    "date_created": str(a.date_created),
                    "date_active": str(a.date_active),
                    "ip": a.ip,
                    "country": a.country,
                    "region": a.region,
                }
                for a in auths.authorizations
            ]
        except Exception as e:
            logger.error(f"List devices error: {e}")
            return []

    async def terminate_device(self, account_id: str, device_hash: int) -> dict:
        """Terminate a remote session by its hash."""
        try:
            from telethon.tl.functions.account import ResetAuthorizationRequest
            client = await self.client_manager.get_client(account_id)
            if client:
                await client(ResetAuthorizationRequest(device_hash))
                return {"terminated": device_hash}
            return {"error": "Account not connected"}
        except Exception as e:
            return {"error": str(e)}
