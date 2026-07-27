"""Autoposting module — Scheduled content posting (Telegram Expert clone)."""

import asyncio
import random
from datetime import datetime, timezone, timedelta
from loguru import logger
from pydantic import BaseModel


class ScheduledPost(BaseModel):
    id: str = ""
    account_id: str = ""
    target_ids: list[int] = []
    text: str = ""
    schedule_time: datetime = datetime.now(timezone.utc)
    repeat: bool = False
    repeat_interval: str = "daily"  # daily, weekly, monthly, custom
    media_url: str | None = None
    media_type: str = "none"  # none, photo, video, document
    buttons: list[dict] = []
    cancelled: bool = False


class AutopostingService:
    """Automatically post content to chats and channels."""

    def __init__(self, client_manager):
        self.client_manager = client_manager
        self.scheduled_posts: dict[str, list[ScheduledPost]] = {}  # account_id -> posts
        self._running = False

    async def post_to_chats_v1(
        self, account_id: str, chat_ids: list[int], text: str,
        schedule_time: datetime, repeat: bool = False,
        repeat_interval: str = "daily"
    ) -> dict:
        """Post to specific chats (V1: user specifies chat list)."""
        post = ScheduledPost(
            id=f"post_{len(self.scheduled_posts.get(account_id, [])) + 1}",
            account_id=account_id,
            target_ids=chat_ids,
            text=text,
            schedule_time=schedule_time,
            repeat=repeat,
            repeat_interval=repeat_interval,
        )

        if account_id not in self.scheduled_posts:
            self.scheduled_posts[account_id] = []
        self.scheduled_posts[account_id].append(post)

        if not self._running:
            self._running = True
            asyncio.create_task(self._post_loop(account_id))

        logger.info(f"Scheduled post {post.id} to {len(chat_ids)} chats at {schedule_time}")
        return {"post_id": post.id, "status": "scheduled"}

    async def post_to_chats_v2(
        self, account_id: str, text: str,
        schedule_time: datetime, repeat: bool = False
    ) -> dict:
        """Post to ALL chats the account is a member of (V2: no list needed)."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        # Get all chats the account is in
        try:
            dialogs = await client.get_dialogs()
            chat_ids = [d.entity.id for d in dialogs if hasattr(d.entity, 'id')]
        except Exception as e:
            return {"error": f"Failed to get dialogs: {e}"}

        post = ScheduledPost(
            id=f"post_{len(self.scheduled_posts.get(account_id, [])) + 1}",
            account_id=account_id,
            target_ids=chat_ids,
            text=text,
            schedule_time=schedule_time,
            repeat=repeat,
            repeat_interval="daily",
        )

        if account_id not in self.scheduled_posts:
            self.scheduled_posts[account_id] = []
        self.scheduled_posts[account_id].append(post)

        if not self._running:
            self._running = True
            asyncio.create_task(self._post_loop(account_id))

        logger.info(f"V2 post {post.id} to {len(chat_ids)} chats")
        return {"post_id": post.id, "chats_count": len(chat_ids), "status": "scheduled"}

    async def post_to_channels(
        self, account_id: str, channel_ids: list[int], text: str,
        schedule_time: datetime, repeat: bool = False
    ) -> dict:
        """Post to specific channels."""
        post = ScheduledPost(
            id=f"post_{len(self.scheduled_posts.get(account_id, [])) + 1}",
            account_id=account_id,
            target_ids=channel_ids,
            text=text,
            schedule_time=schedule_time,
            repeat=repeat,
            repeat_interval="daily",
        )

        if account_id not in self.scheduled_posts:
            self.scheduled_posts[account_id] = []
        self.scheduled_posts[account_id].append(post)

        if not self._running:
            self._running = True
            asyncio.create_task(self._post_loop(account_id))

        logger.info(f"Channel post {post.id} to {len(channel_ids)} channels")
        return {"post_id": post.id, "status": "scheduled"}

    async def cancel_post(self, account_id: str, post_id: str) -> bool:
        """Cancel a scheduled post."""
        for post in self.scheduled_posts.get(account_id, []):
            if post.id == post_id:
                post.cancelled = True
                logger.info(f"Cancelled post {post_id}")
                return True
        return False

    def get_scheduled_posts(self, account_id: str) -> list[dict]:
        """List upcoming posts."""
        return [
            {
                "id": p.id,
                "target_count": len(p.target_ids),
                "text": p.text[:100],
                "schedule_time": p.schedule_time.isoformat(),
                "repeat": p.repeat,
                "cancelled": p.cancelled,
            }
            for p in self.scheduled_posts.get(account_id, [])
            if not p.cancelled
        ]

    async def _post_loop(self, account_id: str):
        """Background loop to execute scheduled posts."""
        while self._running:
            try:
                posts = self.scheduled_posts.get(account_id, [])
                now = datetime.now(timezone.utc)

                for post in posts:
                    if post.cancelled:
                        continue

                    if now >= post.schedule_time:
                        await self._execute_post(post, account_id)

                        # Handle repeat
                        if post.repeat:
                            next_time = self._calculate_next_repeat(
                                post.schedule_time, post.repeat_interval
                            )
                            new_post = ScheduledPost(
                                id=post.id,
                                account_id=account_id,
                                target_ids=post.target_ids,
                                text=post.text,
                                schedule_time=next_time,
                                repeat=True,
                                repeat_interval=post.repeat_interval,
                            )
                            posts.append(new_post)
                            logger.info(f"Post {post.id} repeated for {next_time}")

            except Exception as e:
                logger.error(f"Post loop error: {e}")

            await asyncio.sleep(10)

    async def _execute_post(self, post: ScheduledPost, account_id: str):
        """Execute a single post."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return

        for target_id in post.target_ids:
            try:
                await self.client_manager.send_message(
                    account_id, target_id, post.text,
                )
                logger.info(f"Posted to {target_id}")
            except Exception as e:
                logger.warning(f"Post to {target_id} failed: {e}")

            await asyncio.sleep(random.uniform(5, 30))

    def _calculate_next_repeat(self, last_time: datetime, interval: str) -> datetime:
        """Calculate next repeat time."""
        if interval == "daily":
            return last_time + timedelta(days=1)
        elif interval == "weekly":
            return last_time + timedelta(weeks=1)
        elif interval == "monthly":
            return last_time + timedelta(days=30)
        return last_time + timedelta(hours=1)
