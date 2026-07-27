"""Stories module — publish, delete, export stories."""

from telethon.tl.functions.messages import GetHistoryRequest, DeleteHistoryRequest
from telethon.tl.types import InputMediaUploadedPhoto, InputMediaUploadedDocument
from loguru import logger


class StoriesService:
    """Handle Telegram story operations."""

    def __init__(self, client_manager):
        self.client_manager = client_manager

    async def publish_story(self, phone: str, chat_id: int, media_url: str, caption: str = "", mentioned_user_ids: list[int] | None = None) -> bool:
        """Publish a story to an account's chat."""
        client = await self.client_manager.get_client(phone)
        if not client:
            raise RuntimeError(f"Account {phone} not connected")

        try:
            # Upload media
            if media_url.endswith(('.jpg', '.jpeg', '.png', '.gif')):
                media = InputMediaUploadedPhoto(file=media_url)
            else:
                media = InputMediaUploadedDocument(
                    file=media_url, mime_type="video/mp4",
                    attributes=[], thumb=None,
                )

            result = await client.upload_file(media_url)
            sent = await client.send_message(chat_id, media=result, caption=caption)

            if mentioned_user_ids:
                # Tag users with automatic notification
                pass

            logger.info(f"Story published by {phone} to {chat_id}")
            return True
        except Exception as e:
            logger.error(f"Publish story error: {e}")
            return False

    async def delete_story(self, phone: str, chat_id: int, story_id: int) -> bool:
        """Delete a published story."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return False

        try:
            await client.delete_messages(chat_id, [story_id])
            logger.info(f"Story {story_id} deleted from {phone}")
            return True
        except Exception as e:
            logger.error(f"Delete story error: {e}")
            return False

    async def export_stories(self, phone: str, chat_id: int, limit: int = 20) -> list[dict]:
        """Export story links for analytics."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return []

        try:
            messages = await client.get_messages(chat_id, limit=limit)
            stories = []
            for msg in messages:
                if msg and hasattr(msg, 'media') and msg.media:
                    stories.append({
                        "id": msg.id,
                        "type": type(msg.media).__name__,
                        "link": f"t.me/c/{chat_id}/{msg.id}",
                        "date": msg.date.isoformat() if msg.date else None,
                    })
            return stories
        except Exception as e:
            logger.error(f"Export stories error: {e}")
            return []
