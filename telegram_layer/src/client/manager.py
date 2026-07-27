"""Telegram client manager — handles multi-account Telethon sessions."""

import asyncio
from typing import Optional
from loguru import logger
from telethon import TelegramClient, events
from telethon.errors import FloodWaitError, PeerFloodError, UserBannedInChannelError
from telethon.tl.types import PeerChat, PeerChannel, User

from ..config import TelegramConfig


class TelegramClientManager:
    """Manages multiple concurrent Telegram client sessions."""

    def __init__(self, config: TelegramConfig | None = None):
        self.config = config or TelegramConfig()
        self.clients: dict[str, TelegramClient] = {}  # phone -> client
        self._lock = asyncio.Lock()

    async def connect_account(
        self, phone: str, session_string: str, proxy: dict | None = None
    ) -> TelegramClient:
        """Connect a Telegram account using a session string."""
        async with self._lock:
            if phone in self.clients:
                client = self.clients[phone]
                if client.is_connected():
                    return client

        # Build client
        client = TelegramClient(
            f"sessions/{phone}",
            self.config.api_id,
            self.config.api_hash,
            reconnect_delay=5,
            auto_reconnect=True,
            sleep_threshold=60,
            encode_timestamp=True,
        )

        # Configure proxy if provided
        if proxy:
            from telethon.tl.functions.help import GetConfigRequest
            proxy_type = proxy.get("type", "socks5")
            if proxy_type == "socks5":
                from telethon.tl.functions.channels import JoinChannelRequest
                import asyncio
                socks5_proxy = (
                    proxy.get("host", "localhost"),
                    proxy.get("port", 1080),
                )
                if proxy.get("username"):
                    socks5_proxy = socks5_proxy + (proxy["username"], proxy["password"])
                client.set_proxy(
                    proxy=("socks5", *socks5_proxy[:2]),
                    username=proxy.get("username"),
                    password=proxy.get("password"),
                )

        try:
            await client.connect()
            is_authenticated = await client.is_user_authenticated()
            if not is_authenticated:
                raise RuntimeError(f"Failed to authenticate account: {phone}")
            async with self._lock:
                self.clients[phone] = client
            logger.info(f"Connected Telegram account: {phone}")
            return client
        except Exception as e:
            logger.error(f"Failed to connect account {phone}: {e}")
            raise

    async def disconnect_account(self, phone: str):
        """Disconnect and clean up a Telegram client."""
        async with self._lock:
            client = self.clients.pop(phone, None)
        if client:
            await client.disconnect()
            logger.info(f"Disconnected account: {phone}")

    async def disconnect_all(self):
        """Disconnect all connected accounts."""
        async with self._lock:
            phones = list(self.clients.keys())

        for phone in phones:
            try:
                await self.disconnect_account(phone)
            except Exception as e:
                logger.error(f"Error disconnecting {phone}: {e}")

        logger.info(f"All accounts disconnected. Total: {len(phones)}")

    async def get_client(self, phone: str) -> Optional[TelegramClient]:
        """Get an existing client or None."""
        async with self._lock:
            return self.clients.get(phone)

    async def get_all_clients(self) -> dict[str, TelegramClient]:
        """Get all connected clients."""
        async with self._lock:
            return dict(self.clients)

    async def send_message(
        self,
        phone: str,
        peer: str | int,
        message: str,
        **kwargs,
    ) -> Optional[int]:
        """Send a message from a specific account."""
        client = await self.get_client(phone)
        if not client:
            raise RuntimeError(f"Account {phone} not connected")

        try:
            result = await client.send_message(peer, message, **kwargs)
            return result.id if result else None
        except FloodWaitError as e:
            logger.warning(f"FloodWait on {phone}: {e.seconds}s")
            await asyncio.sleep(e.seconds + 5)
            return await self.send_message(phone, peer, message, **kwargs)
        except PeerFloodError:
            logger.error(f"PeerFlood on {phone} — account likely blocked")
            return None
        except Exception as e:
            logger.error(f"Send message error on {phone}: {e}")
            return None

    async def get_group_members(self, phone: str, chat_id: int, limit: int = 100) -> list[dict]:
        """Get members of a group/channel."""
        client = await self.get_client(phone)
        if not client:
            raise RuntimeError(f"Account {phone} not connected")

        try:
            participants = await client.get_participants(chat_id, limit=limit)
            return [
                {
                    "id": p.id,
                    "username": getattr(p, "username", None),
                    "first_name": getattr(p, "first_name", None),
                    "last_name": getattr(p, "last_name", None),
                    "phone": getattr(p, "phone", None),
                }
                for p in participants
                if isinstance(p, User)
            ]
        except Exception as e:
            logger.error(f"Get members error: {e}")
            return []

    async def invite_to_group(self, phone: str, chat_id: int, user_id: int) -> bool:
        """Invite a user to a group."""
        client = await self.get_client(phone)
        if not client:
            return False

        try:
            await client(functions.channels.InviteToChannelRequest(
                channel=chat_id,
                users=[user_id],
            ))
            return True
        except FloodWaitError as e:
            await asyncio.sleep(e.seconds + 5)
            return await self.invite_to_group(phone, chat_id, user_id)
        except Exception as e:
            logger.error(f"Invite error: {e}")
            return False

    async def get_chat_history(
        self, phone: str, chat_id: int, limit: int = 50, offset: int = 0
    ) -> list[dict]:
        """Get recent messages from a chat."""
        client = await self.get_client(phone)
        if not client:
            raise RuntimeError(f"Account {phone} not connected")

        try:
            messages = await client.get_messages(chat_id, limit=limit, offset=offset)
            return [
                {
                    "id": m.id,
                    "text": m.text or "",
                    "date": m.date.isoformat() if m.date else None,
                    "from_id": m.from_id.user_id if m.from_id else None,
                    "replies": m.replies,
                    "views": m.views,
                }
                for m in messages if m
            ]
        except Exception as e:
            logger.error(f"Get history error: {e}")
            return []
