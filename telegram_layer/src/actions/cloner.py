"""Cloner module — Channel/Chat content cloning (Telegram Expert clone)."""

import asyncio
import random
from loguru import logger


class ClonerService:
    """Clone content from channels/groups, including protected content."""

    def __init__(self, client_manager):
        self.client_manager = client_manager
        self.progress_callback = None

    async def clone_channel(
        self,
        source_channel_id: int,
        target_channel_id: int,
        account_id: str,
        start_msg_id: int = 0,
        limit: int = 100,
        with_reposts: bool = True,
    ) -> dict:
        """Clone posts from a source channel to a target channel."""
        results = {"copied": 0, "failed": 0, "skipped": 0}

        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": f"Account {account_id} not connected"}

        try:
            messages = await client.get_messages(
                source_channel_id, limit=limit, offset=start_msg_id, reverse=True
            )

            for msg in messages:
                if not msg:
                    results["skipped"] += 1
                    continue

                try:
                    # Forward or copy the message
                    if with_reposts:
                        # Try forwarding first
                        await client.forward_messages(
                            target_channel_id, messages=[msg.id], from_peer=source_channel_id
                        )
                    else:
                        # Copy without forward attribution
                        await client.send_message(
                            target_channel_id,
                            msg.text or "",
                            media=msg.media,
                        )

                    results["copied"] += 1

                    if self.progress_callback:
                        self.progress_callback(results["copied"], len(list(messages)))

                    # Anti-detection delay
                    await asyncio.sleep(random.uniform(5, 30))

                except Exception as e:
                    results["failed"] += 1
                    logger.warning(f"Failed to copy message {msg.id}: {e}")

        except Exception as e:
            logger.error(f"Clone channel error: {e}")
            results["error"] = str(e)

        return results

    async def clone_group(
        self,
        source_group_id: int,
        target_group_id: int,
        account_id: str,
        start_msg_id: int = 0,
        limit: int = 100,
    ) -> dict:
        """Clone messages from a source group to a target group."""
        results = {"copied": 0, "failed": 0, "skipped": 0}

        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": f"Account {account_id} not connected"}

        try:
            messages = await client.get_messages(
                source_group_id, limit=limit, offset=start_msg_id, reverse=True
            )

            for msg in messages:
                if not msg:
                    results["skipped"] += 1
                    continue

                try:
                    # Copy with reply context
                    await client.send_message(
                        target_group_id,
                        msg.text or "",
                        media=msg.media,
                        reply_to=msg.id if msg.reply_to else None,
                    )
                    results["copied"] += 1

                    if self.progress_callback:
                        self.progress_callback(results["copied"], len(list(messages)))

                    await asyncio.sleep(random.uniform(10, 60))

                except Exception as e:
                    results["failed"] += 1
                    logger.warning(f"Failed to clone message {msg.id}: {e}")

        except Exception as e:
            logger.error(f"Clone group error: {e}")
            results["error"] = str(e)

        return results

    async def clone_with_progress(
        self,
        source_id: int,
        target_id: int,
        account_id: str,
        total_messages: int,
        callback,
    ) -> dict:
        """Clone with real-time progress reporting."""
        self.progress_callback = callback
        chunk_size = 50
        copied = 0
        failed = 0
        offset = 0

        while offset < total_messages:
            result = await self.clone_channel(source_id, target_id, account_id, start_msg_id=offset, limit=chunk_size)
            copied += result.get("copied", 0)
            failed += result.get("failed", 0)
            offset += chunk_size

            if callback:
                callback(copied, total_messages)

        return {"total_copied": copied, "total_failed": failed}
