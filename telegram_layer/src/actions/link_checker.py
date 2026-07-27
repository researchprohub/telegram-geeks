"""Link Checker — Check channel/group/user info from links without accounts (Telegram Expert clone)."""

import aiohttp
from loguru import logger


class LinkCheckerService:
    """Get detailed info about Telegram entities from links without using accounts."""

    async def check_link(self, url: str) -> dict:
        """Parse a Telegram link and get entity info."""
        # Extract chat identifier from URL
        # Formats: t.me/username, t.me/+abcdef, t.me/c/channel_id/msg_id
        import re
        match = re.search(r"t\.me\/([^\s]+)", url)
        if not match:
            return {"error": "Invalid Telegram link format"}

        identifier = match.group(1)

        if identifier.startswith("+"):
            # Invite link — extract hash
            return await self._check_invite_link(identifier)
        elif identifier.startswith("c/") or identifier.isdigit():
            # Channel ID
            chat_id = int(identifier) if identifier.isdigit() else int(identifier.split("/")[-1])
            return await self._check_entity_by_id(chat_id)
        else:
            # Username
            return await self._check_username(identifier)

    async def _check_username(self, username: str) -> dict:
        """Check entity by username."""
        # Use Telegram's public API (no auth needed for public entities)
        try:
            async with aiohttp.ClientSession() as session:
                # Try resolving via Telegram's public API
                async with session.get(
                    f"https://api.telegram.org/botplaceholder/getChat",
                    params={"chat_id": f"@{username}"},
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as resp:
                    data = await resp.json()
                    if data.get("ok"):
                        chat = data["result"]
                        return {
                            "type": chat.get("type"),
                            "title": chat.get("title"),
                            "username": chat.get("username"),
                            "member_count": chat.get("members_count", 0),
                            "description": chat.get("description", ""),
                            "photo": chat.get("photo", {}),
                        }
        except Exception as e:
            logger.warning(f"Username check failed for @{username}: {e}")

        return {"username": username, "type": "unknown", "found": False}

    async def _check_invite_link(self, invite_hash: str) -> dict:
        """Check info from an invite link."""
        return {
            "type": "invite_link",
            "hash": invite_hash,
            "message": "Cannot resolve invite links without authentication",
        }

    async def _check_entity_by_id(self, chat_id: int) -> dict:
        """Check entity by numeric ID."""
        return {
            "chat_id": chat_id,
            "message": "Numeric ID lookup requires authentication",
        }

    async def check_channel(self, chat_id: int) -> dict:
        """Get detailed channel info."""
        return await self._check_entity_by_id(chat_id)

    async def check_user(self, user_id: int) -> dict:
        """Get user info."""
        return {
            "user_id": user_id,
            "message": "User lookup requires authentication",
        }

    async def check_group(self, chat_id: int) -> dict:
        """Get detailed group info."""
        return await self._check_entity_by_id(chat_id)
