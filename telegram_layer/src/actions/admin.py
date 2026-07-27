"""Admin actions — create/manage chats, channels, admins."""

from loguru import logger


class AdminService:
    """Handle administrative Telegram operations."""

    def __init__(self, client_manager):
        self.client_manager = client_manager

    async def create_chat(self, phone: str, title: str, description: str = "") -> dict | None:
        """Create a new group chat."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return None

        try:
            from telethon.tl.functions.messages import CreateChatRequest
            result = await client(CreateChatRequest(
                title=title,
                users=[],  # Will be empty initially
            ))
            logger.info(f"Created chat: {title} by {phone}")
            return {"id": result.chats[0].id, "title": title}
        except Exception as e:
            logger.error(f"Create chat error: {e}")
            return None

    async def create_channel(self, phone: str, title: str, description: str = "", username: str = "") -> dict | None:
        """Create a new channel."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return None

        try:
            from telethon.tl.functions.channels import CreateChannelRequest
            result = await client(CreateChannelRequest(
                title=title,
                about=description,
                username=username,
            ))
            logger.info(f"Created channel: {title} by {phone}")
            return {"id": result.chats[0].id, "title": title}
        except Exception as e:
            logger.error(f"Create channel error: {e}")
            return None

    async def add_admin(self, phone: str, chat_id: int, user_id: int, can_manage_chat: bool = True,
                        can_change_info: bool = False, can_post_messages: bool = False) -> bool:
        """Add an admin to a group/channel."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return False

        try:
            from telethon.tl.functions.channels import EditAdminRequest
            from telethon.tl.types import ChannelAdminRights
            rights = ChannelAdminRights(
                change_info=can_change_info,
                post_messages=can_post_messages,
                manage_chat=can_manage_chat,
            )
            await client(EditAdminRequest(
                channel=chat_id,
                user_id=user_id,
                admin_rights=rights,
            ))
            return True
        except Exception as e:
            logger.error(f"Add admin error: {e}")
            return False

    async def remove_admin(self, phone: str, chat_id: int, user_id: int) -> bool:
        """Remove an admin from a group/channel."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return False

        try:
            from telethon.tl.functions.channels import EditAdminRequest
            from telethon.tl.types import ChannelAdminRights
            rights = ChannelAdminRights()  # Empty = no rights
            await client(EditAdminRequest(
                channel=chat_id,
                user_id=user_id,
                admin_rights=rights,
            ))
            return True
        except Exception as e:
            logger.error(f"Remove admin error: {e}")
            return False

    async def set_chat_photo(self, phone: str, chat_id: int, photo_path: str) -> bool:
        """Set group/channel photo."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return False

        try:
            from telethon.tl.functions.photos import UploadProfilePhotoRequest
            photo = await client.upload_file(photo_path)
            await client(UploadProfilePhotoRequest(photo=photo))
            return True
        except Exception as e:
            logger.error(f"Set chat photo error: {e}")
            return False

    async def set_chat_description(self, phone: str, chat_id: int, description: str) -> bool:
        """Set group/channel description."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return False

        try:
            from telethon.tl.functions.messages import EditChatAboutRequest
            await client(EditChatAboutRequest(chat=chat_id, about=description))
            return True
        except Exception as e:
            logger.error(f"Set chat description error: {e}")
            return False
