"""Reactions module — add/remove/get reactions."""

from telethon.errors import FloodWaitError
from loguru import logger


class ReactionsService:
    """Handle Telegram reaction operations."""

    def __init__(self, client_manager):
        self.client_manager = client_manager

    async def add_reaction(self, phone: str, chat_id: int, message_id: int, emoji: str) -> bool:
        """Add a reaction to a message."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return False

        try:
            from telethon.tl.functions.messages import AddReactionRequest
            await client(AddReactionRequest(chat_id, message_id, emoji))
            return True
        except FloodWaitError as e:
            import asyncio
            await asyncio.sleep(e.seconds + 5)
            return await self.add_reaction(phone, chat_id, message_id, emoji)
        except Exception as e:
            logger.error(f"Add reaction error: {e}")
            return False

    async def remove_reaction(self, phone: str, chat_id: int, message_id: int) -> bool:
        """Remove own reaction from a message."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return False

        try:
            from telethon.tl.functions.messages import RevokeReactionRequest
            await client(RevokeReactionRequest(peer=chat_id, id=[message_id]))
            return True
        except Exception as e:
            logger.error(f"Remove reaction error: {e}")
            return False

    async def get_reactions(self, phone: str, chat_id: int, message_id: int) -> list[dict]:
        """Get all reactions on a message."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return []

        try:
            from telethon.tl.functions.messages import GetReactionsRequest
            result = await client(GetReactionsRequest(
                peer=chat_id, id=[message_id],
                limit=100, add_offset="", hash=0,
            ))
            return [
                {
                    "user_id": r.user_id,
                    "emoji": r.reaction,
                }
                for r in getattr(result, "results", [])
            ]
        except Exception as e:
            logger.error(f"Get reactions error: {e}")
            return []
