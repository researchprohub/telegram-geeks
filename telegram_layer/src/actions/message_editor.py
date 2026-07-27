"""Message Editor — Edit sent messages within 48h and pin messages (Telegram Expert clone)."""

from loguru import logger


class MessageEditorService:
    """Edit and pin messages in Telegram chats."""

    def __init__(self, client_manager):
        self.client_manager = client_manager

    async def edit_message(self, phone: str, chat_id: int, message_id: int, new_text: str) -> bool:
        """Edit a sent message within 48 hours."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return False

        try:
            from telethon.errors import MessageNotModifiedError
            await client.edit_message(chat_id, message_id, new_text)
            logger.info(f"Edited message {message_id} in {chat_id} by {phone}")
            return True
        except MessageNotModifiedError:
            logger.warning(f"Message {message_id} unchanged in {chat_id}")
            return False
        except Exception as e:
            logger.error(f"Edit message error: {e}")
            return False

    async def pin_message(self, phone: str, chat_id: int, message_id: int, disable_notification: bool = False) -> bool:
        """Pin a message in a chat."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return False

        try:
            await client.pin_message(chat_id, message_id, disable_notification=disable_notification)
            logger.info(f"Pinned message {message_id} in {chat_id} by {phone}")
            return True
        except Exception as e:
            logger.error(f"Pin message error: {e}")
            return False

    async def unpin_message(self, phone: str, chat_id: int, message_id: int = 0) -> bool:
        """Unpin a message in a chat."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return False

        try:
            if message_id:
                await client.unpin_message(chat_id, message_id)
            else:
                await client.unpin_message(chat_id)
            logger.info(f"Unpinned message in {chat_id} by {phone}")
            return True
        except Exception as e:
            logger.error(f"Unpin message error: {e}")
            return False

    async def edit_and_pin(self, phone: str, chat_id: int, message_id: int, new_text: str, disable_notification: bool = False) -> dict:
        """Edit a message and immediately pin it."""
        edited = await self.edit_message(phone, chat_id, message_id, new_text)
        pinned = False
        if edited:
            pinned = await self.pin_message(phone, chat_id, message_id, disable_notification)
        return {"edited": edited, "pinned": pinned}

    async def batch_edit(self, phone: str, chat_id: int, edits: list[dict]) -> dict:
        """Batch edit multiple messages. Each edit: {message_id, new_text}."""
        results = {"success": 0, "failed": 0}
        for edit in edits:
            success = await self.edit_message(phone, chat_id, edit["message_id"], edit["new_text"])
            if success:
                results["success"] += 1
            else:
                results["failed"] += 1
        return results
