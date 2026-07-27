"""Audience collection module — Collect users from comments, accounts, replies (Telegram Expert clone)."""

import asyncio
from loguru import logger


class AudienceCollectorService:
    """Collect audience members from various sources."""

    def __init__(self, client_manager):
        self.client_manager = client_manager

    async def collect_from_comments(self, account_id: str, chat_id: int, message_id: int, limit: int = 100) -> list[dict]:
        """Collect users who commented on a message."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return []

        try:
            messages = await client.get_messages(chat_id, limit=limit, offset=message_id)
            users = []
            for msg in messages:
                if msg and msg.from_id and msg.text:
                    user = msg.from_id.user_id
                    users.append({
                        "user_id": user,
                        "username": getattr(msg.sender, 'username', None),
                        "first_name": getattr(msg.sender, 'first_name', None),
                        "last_name": getattr(msg.sender, 'last_name', None),
                        "comment": msg.text[:100],
                    })
            return users
        except Exception as e:
            logger.error(f"Collect from comments error: {e}")
            return []

    async def collect_from_account(self, account_id: str, target_user_id: int, limit: int = 100) -> list[dict]:
        """Collect followers or following of a target account."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return []

        try:
            # Get mutual contacts or followers
            users = []
            for peer in await client.get_followers(target_user_id, limit=limit):
                if hasattr(peer, 'user_id'):
                    users.append({
                        "user_id": peer.user_id,
                        "username": getattr(peer, 'username', None),
                        "first_name": getattr(peer, 'first_name', None),
                        "last_name": getattr(peer, 'last_name', None),
                    })
            return users
        except Exception as e:
            logger.error(f"Collect from account error: {e}")
            return []

    async def collect_from_replies(self, account_id: str, chat_id: int, limit: int = 50) -> list[dict]:
        """Collect users who replied to messages in a chat."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return []

        try:
            messages = await client.get_messages(chat_id, limit=limit)
            users = []
            for msg in messages:
                if msg and msg.reply_to and msg.reply_to.reply_to_msg_id:
                    from_id = msg.from_id
                    if from_id and from_id.user_id:
                        users.append({
                            "user_id": from_id.user_id,
                            "username": getattr(from_id, 'username', None),
                            "first_name": getattr(from_id, 'first_name', None),
                            "last_name": getattr(from_id, 'last_name', None),
                            "replied_to": msg.reply_to.reply_to_msg_id,
                        })
            return users
        except Exception as e:
            logger.error(f"Collect from replies error: {e}")
            return []

    async def collect_new_chat_members(self, account_id: str, chat_id: int, limit: int = 100) -> list[dict]:
        """Collect recently joined members of a chat."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return []

        try:
            participants = await client.get_participants(chat_id, limit=limit)
            users = []
            for p in participants:
                if hasattr(p, 'id'):
                    users.append({
                        "user_id": p.id,
                        "username": getattr(p, 'username', None),
                        "first_name": getattr(p, 'first_name', None),
                        "last_name": getattr(p, 'last_name', None),
                        "phone": getattr(p, 'phone', None),
                    })
            return users
        except Exception as e:
            logger.error(f"Collect new members error: {e}")
            return []

    async def collect_by_hashtag(self, account_id: str, hashtag: str, limit: int = 50) -> list[dict]:
        """Collect users who posted messages with a specific hashtag."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return []

        try:
            # Search for hashtag in global search
            results = await client.search(q=hashtag, limit=limit)
            users = []
            for msg in results:
                if msg and msg.from_id and msg.from_id.user_id:
                    users.append({
                        "user_id": msg.from_id.user_id,
                        "username": getattr(msg.from_id, 'username', None),
                        "first_name": getattr(msg.from_id, 'first_name', None),
                        "last_name": getattr(msg.from_id, 'last_name', None),
                        "message": msg.text[:100],
                    })
            return users
        except Exception as e:
            logger.error(f"Collect by hashtag error: {e}")
            return []

    def deduplicate(self, users: list[dict]) -> list[dict]:
        """Remove duplicate users by user_id."""
        seen = set()
        unique = []
        for user in users:
            uid = user.get("user_id")
            if uid and uid not in seen:
                seen.add(uid)
                unique.append(user)
        return unique

    async def collect_active_writers(self, account_id: str, chat_id: int, hours: int = 24, limit: int = 50) -> list[dict]:
        """Collect users who have written messages recently."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return []
        try:
            messages = await client.get_messages(chat_id, limit=limit)
            seen = set()
            users = []
            for msg in messages:
                if msg and msg.from_id and msg.from_id.user_id:
                    uid = msg.from_id.user_id
                    if uid not in seen:
                        seen.add(uid)
                        users.append({
                            "user_id": uid,
                            "username": getattr(msg.sender, 'username', None),
                            "first_name": getattr(msg.sender, 'first_name', None),
                            "last_name": getattr(msg.sender, 'last_name', None),
                            "last_message": msg.text[:100] if msg.text else "",
                            "date": str(msg.date),
                        })
            return users
        except Exception as e:
            logger.error(f"Collect active writers error: {e}")
            return []

    @staticmethod
    def auto_assign_accounts(links: list[str], available_accounts: list[str]) -> list[dict]:
        """1 task = 1 account = 1 link auto-assignment."""
        assignments = []
        for i, link in enumerate(links):
            account = available_accounts[i] if i < len(available_accounts) else available_accounts[-1] if available_accounts else None
            assignments.append({"link": link, "assigned_account": account, "index": i})
        return assignments
