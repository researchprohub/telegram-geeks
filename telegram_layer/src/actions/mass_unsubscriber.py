"""Mass unsubscribing module (Telegram Expert clone)."""

import asyncio
import random
from loguru import logger


class MassUnsubscriberService:
    """Mass unsubscribe from channels, chats, or both."""

    def __init__(self, client_manager):
        self.client_manager = client_manager

    async def unsubscribe_from_channels(self, account_id: str, chat_ids: list[int]) -> dict:
        """Unsubscribe from channels only."""
        results = {"left": 0, "failed": 0}
        for chat_id in chat_ids:
            try:
                client = await self.client_manager.get_client(account_id)
                if not client:
                    results["failed"] += 1
                    continue
                from telethon.tl.functions.channels import LeaveChannelRequest
                await client(LeaveChannelRequest(chat_id))
                results["left"] += 1
                await asyncio.sleep(random.uniform(10, 60))
            except Exception as e:
                results["failed"] += 1
                logger.warning(f"Unsub from channel {chat_id} failed: {e}")
        return results

    async def unsubscribe_from_chats(self, account_id: str, chat_ids: list[int]) -> dict:
        """Unsubscribe from chats only."""
        results = {"left": 0, "failed": 0}
        for chat_id in chat_ids:
            try:
                client = await self.client_manager.get_client(account_id)
                if not client:
                    results["failed"] += 1
                    continue
                from telethon.tl.functions.messages import DeleteChatUsersRequest
                # For groups, we delete the chat entirely
                await client(functions=DeleteChatUsersRequest(chat_id=chat_id, user_ids=[]))
                results["left"] += 1
                await asyncio.sleep(random.uniform(10, 60))
            except Exception as e:
                results["failed"] += 1
                logger.warning(f"Unsub from chat {chat_id} failed: {e}")
        return results

    async def unsubscribe_from_both(self, account_id: str, chat_ids: list[int]) -> dict:
        """Unsubscribe from both channels and chats."""
        ch_results = await self.unsubscribe_from_channels(account_id, chat_ids)
        chat_results = await self.unsubscribe_from_chats(account_id, chat_ids)
        return {
            "channels_left": ch_results["left"],
            "channels_failed": ch_results["failed"],
            "chats_left": chat_results["left"],
            "chats_failed": chat_results["failed"],
        }

    async def leave_all_chats(self, account_id: str, min_members: int = 100, exclude_ids: list[int] | None = None) -> dict:
        """Leave all chats above min_members size, excluding specified IDs."""
        exclude_ids = exclude_ids or []
        results = {"left": 0, "skipped": 0, "failed": 0}

        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        try:
            dialogs = await client.get_dialogs()
            for dialog in dialogs:
                if not hasattr(dialog, 'entity') or not dialog.entity:
                    continue

                entity = dialog.entity
                chat_id = entity.id

                # Skip excluded
                if chat_id in exclude_ids:
                    results["skipped"] += 1
                    continue

                # Only leave groups (not channels, not private chats)
                if hasattr(entity, 'megasupergroup') or hasattr(entity, 'broadcast'):
                    continue

                member_count = getattr(entity, 'participants_count', 0)
                if member_count >= min_members:
                    try:
                        from telethon.tl.functions.messages import DeleteHistoryRequest
                        await client(DeleteHistoryRequest(peer=chat_id, max_id=0))
                        results["left"] += 1
                        await asyncio.sleep(random.uniform(15, 90))
                    except Exception:
                        results["failed"] += 1
        except Exception as e:
            logger.error(f"Leave all chats error: {e}")

        return results

    async def unsubscribe_from_all_channels(self, account_id: str) -> dict:
        """Leave all channels."""
        results = {"left": 0, "failed": 0}
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        try:
            dialogs = await client.get_dialogs()
            for dialog in dialogs:
                if hasattr(dialog, 'entity') and hasattr(dialog.entity, 'broadcast') and dialog.entity.broadcast:
                    try:
                        from telethon.tl.functions.channels import LeaveChannelRequest
                        await client(LeaveChannelRequest(dialog.entity.id))
                        results["left"] += 1
                        await asyncio.sleep(random.uniform(10, 60))
                    except Exception:
                        results["failed"] += 1
        except Exception as e:
            logger.error(f"Leave all channels error: {e}")

        return results
