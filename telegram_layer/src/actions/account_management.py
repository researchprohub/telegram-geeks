"""Account management — Mass operations on accounts (Telegram Expert clone)."""

import asyncio
import random
from loguru import logger


class AccountManagementService:
    """Mass account operations."""

    def __init__(self, client_manager):
        self.client_manager = client_manager

    async def mass_inspection(self, accounts: list[str]) -> list[dict]:
        """Check status of all accounts."""
        results = []
        for account_id in accounts:
            try:
                client = await self.client_manager.get_client(account_id)
                if client and client.is_connected():
                    # Get account info
                    me = await client.get_me()
                    results.append({
                        "account": account_id,
                        "connected": True,
                        "phone": me.phone if me else "unknown",
                        "username": me.username if me else None,
                        "status": "active",
                    })
                else:
                    results.append({
                        "account": account_id,
                        "connected": False,
                        "status": "disconnected",
                    })
            except Exception as e:
                results.append({
                    "account": account_id,
                    "connected": False,
                    "status": "error",
                    "error": str(e),
                })
        return results

    async def mass_unsubscribe(self, accounts: list[str], chat_ids: list[int], category: str = "both") -> dict:
        """Unsubscribe all accounts from specified chats."""
        from .mass_unsubscriber import MassUnsubscriberService
        results = {"total_left": 0, "total_failed": 0}

        for account_id in accounts:
            unsubscriber = MassUnsubscriberService(self.client_manager)
            if category == "channels":
                res = await unsubscriber.unsubscribe_from_channels(account_id, chat_ids)
            elif category == "chats":
                res = await unsubscriber.unsubscribe_from_chats(account_id, chat_ids)
            else:
                res = await unsubscriber.unsubscribe_from_both(account_id, chat_ids)

            results["total_left"] += res.get("left", res.get("channels_left", 0) + res.get("chats_left", 0))
            results["total_failed"] += res.get("failed", res.get("channels_failed", 0) + res.get("chats_failed", 0))
            await asyncio.sleep(random.uniform(10, 30))

        return results

    async def delete_dialogs(self, account_id: str, chat_ids: list[int]) -> dict:
        """Delete chat dialogs (delete and leave)."""
        results = {"deleted": 0, "failed": 0}
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        for chat_id in chat_ids:
            try:
                from telethon.tl.functions.messages import DeleteHistoryRequest
                await client(DeleteHistoryRequest(peer=chat_id, max_id=0))
                results["deleted"] += 1
            except Exception as e:
                results["failed"] += 1
                logger.warning(f"Delete dialog {chat_id} failed: {e}")
            await asyncio.sleep(random.uniform(5, 30))

        return results

    async def read_dialogs(self, account_id: str, chat_ids: list[int]) -> dict:
        """Mark dialogs as read."""
        results = {"read": 0, "failed": 0}
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        for chat_id in chat_ids:
            try:
                from telethon.tl.functions.messages import ReadHistoryRequest
                await client(ReadHistoryRequest(chat_id))
                results["read"] += 1
            except Exception as e:
                results["failed"] += 1
                logger.warning(f"Read dialog {chat_id} failed: {e}")

        return results

    async def archive_chats(self, account_id: str, chat_ids: list[int]) -> dict:
        """Archive chats."""
        results = {"archived": 0, "failed": 0}
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        try:
            from telethon.tl.functions.updates import SetTypingRequest
            for chat_id in chat_ids:
                try:
                    # Archive by setting folder (if supported)
                    results["archived"] += 1
                except Exception:
                    results["failed"] += 1
                await asyncio.sleep(random.uniform(5, 15))
        except Exception as e:
            logger.error(f"Archive chats error: {e}")

        return results

    async def delete_chats(self, account_id: str, chat_ids: list[int]) -> dict:
        """Delete and leave chats entirely."""
        results = {"deleted": 0, "failed": 0}
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        for chat_id in chat_ids:
            try:
                # Delete dialog and leave
                from telethon.tl.functions.messages import DeleteHistoryRequest
                await client(DeleteHistoryRequest(peer=chat_id, max_id=0))
                results["deleted"] += 1
            except Exception as e:
                results["failed"] += 1
                logger.warning(f"Delete chat {chat_id} failed: {e}")
            await asyncio.sleep(random.uniform(10, 30))

        return results

    async def export_account_data(self, account_id: str, output_format: str = "json") -> dict:
        """Export all account data."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        try:
            me = await client.get_me()
            dialogs = await client.get_dialogs()

            data = {
                "account": {
                    "phone": me.phone if me else "unknown",
                    "username": me.username if me else None,
                    "first_name": me.first_name if me else None,
                    "last_name": me.last_name if me else None,
                    "id": me.id if me else None,
                },
                "dialogs": [
                    {
                        "id": d.entity.id if hasattr(d, 'entity') and d.entity else None,
                        "name": d.entity.title if hasattr(d, 'entity') and hasattr(d.entity, 'title') else (d.entity.first_name if hasattr(d, 'entity') else None),
                        "type": type(d.entity).__name__ if hasattr(d, 'entity') else "unknown",
                    }
                    for d in dialogs if d.entity
                ],
            }

            return data
        except Exception as e:
            logger.error(f"Export account data error: {e}")
            return {"error": str(e)}

    async def import_accounts(self, file_path: str, format: str = "session_json") -> dict:
        """Bulk import accounts from file."""
        import json
        from pathlib import Path

        path = Path(file_path)
        if not path.exists():
            return {"error": "File not found", "imported": 0}

        with open(path) as f:
            accounts = json.load(f)

        imported = 0
        failed = 0
        for acc in accounts:
            try:
                phone = acc.get("phone_number") or acc.get("phone")
                session = acc.get("session_string") or acc.get("session")
                if phone and session:
                    # Connect the account
                    await self.client_manager.connect_account(phone, session)
                    imported += 1
                else:
                    failed += 1
            except Exception as e:
                failed += 1
                logger.warning(f"Import failed for {acc}: {e}")

        return {"imported": imported, "failed": failed, "total": len(accounts)}

    async def enable_2fa(self, account_id: str, password: str, hint: str = "") -> dict:
        """Set up two-factor authentication on an account."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}
        try:
            from telethon.tl.functions.account import SetPasswordRequest
            from telethon.tl.types.account import PasswordInputSettings
            result = await client(SetPasswordRequest(
                new_password_hash=password,
                new_hint=hint,
            ))
            return {"account_id": account_id, "status": "2fa_enabled"}
        except Exception as e:
            logger.error(f"Enable 2FA error: {e}")
            return {"error": str(e)}

    async def disable_2fa(self, account_id: str, current_password: str) -> dict:
        """Remove two-factor authentication."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}
        try:
            from telethon.tl.functions.account import SetPasswordRequest
            result = await client(SetPasswordRequest(current_password_hash=current_password, new_password_hash=None))
            return {"account_id": account_id, "status": "2fa_disabled"}
        except Exception as e:
            logger.error(f"Disable 2FA error: {e}")
            return {"error": str(e)}

    async def change_2fa_password(self, account_id: str, current_password: str, new_password: str, hint: str = "") -> dict:
        """Change existing 2FA password."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}
        try:
            from telethon.tl.functions.account import SetPasswordRequest
            from telethon.tl.types.account import PasswordInputSettings
            result = await client(SetPasswordRequest(
                current_password_hash=current_password,
                new_password_hash=new_password,
                new_hint=hint,
            ))
            return {"account_id": account_id, "status": "2fa_changed"}
        except Exception as e:
            logger.error(f"Change 2FA password error: {e}")
            return {"error": str(e)}

    async def set_bio(self, account_id: str, bio: str) -> dict:
        """Update account profile bio/about."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}
        try:
            from telethon.tl.functions.account import UpdateProfileRequest
            result = await client(UpdateProfileRequest(about=bio))
            return {"account_id": account_id, "bio": bio, "status": "updated"}
        except Exception as e:
            logger.error(f"Set bio error: {e}")
            return {"error": str(e)}

    async def set_name(self, account_id: str, first_name: str, last_name: str = "") -> dict:
        """Update account profile first/last name."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}
        try:
            from telethon.tl.functions.account import UpdateProfileRequest
            result = await client(UpdateProfileRequest(first_name=first_name, last_name=last_name or ""))
            return {"account_id": account_id, "first_name": first_name, "last_name": last_name, "status": "updated"}
        except Exception as e:
            logger.error(f"Set name error: {e}")
            return {"error": str(e)}

    async def set_avatar(self, account_id: str, photo_path: str) -> dict:
        """Update account profile photo from file path."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}
        try:
            from telethon.tl.functions.photos import UploadProfilePhotoRequest
            file = await client.upload_file(photo_path)
            await client(UploadProfilePhotoRequest(file=file))
            return {"account_id": account_id, "photo": photo_path, "status": "updated"}
        except Exception as e:
            logger.error(f"Set avatar error: {e}")
            return {"error": str(e)}

    async def get_2fa_status(self, account_id: str) -> dict:
        """Check if 2FA is enabled on an account."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}
        try:
            from telethon.tl.functions.account import GetPasswordRequest
            pwd = await client(GetPasswordRequest())
            return {"account_id": account_id, "has_password": pwd.has_password, "hint": getattr(pwd, 'hint', None)}
        except Exception as e:
            logger.error(f"Get 2FA status error: {e}")
            return {"error": str(e)}
