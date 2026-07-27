"""Interceptor module — Keyword-based message monitoring and forwarding."""

import asyncio
import random
from loguru import logger


class InterceptorService:
    """Monitor groups/channels for keyword-triggered messages and forward them."""

    def __init__(self, client_manager):
        self.client_manager = client_manager
        self.monitors: dict[str, dict] = {}  # monitor_id -> config
        self.running: dict[str, bool] = {}

    def add_keyword(self, monitor_id: str, keyword: str, target_chat_id: int):
        """Add a keyword to an existing monitor."""
        if monitor_id in self.monitors:
            self.monitors[monitor_id]["keywords"][keyword.lower()] = target_chat_id
            logger.info(f"Added keyword '{keyword}' to monitor {monitor_id}")

    def remove_keyword(self, monitor_id: str, keyword: str):
        """Remove a keyword from a monitor."""
        if monitor_id in self.monitors:
            self.monitors[monitor_id]["keywords"].pop(keyword.lower(), None)
            logger.info(f"Removed keyword '{keyword}' from monitor {monitor_id}")

    def list_keywords(self, monitor_id: str) -> dict:
        """List all keywords for a monitor."""
        if monitor_id in self.monitors:
            return self.monitors[monitor_id]["keywords"]
        return {}

    def intercept_message(self, message_text: str, keywords: dict) -> dict | None:
        """Check if a message matches any keywords."""
        text_lower = message_text.lower()
        matched = {}
        for keyword, target in keywords.items():
            if keyword in text_lower:
                matched[keyword] = target
        return matched if matched else None

    async def start_monitoring(
        self,
        monitor_id: str,
        account_id: str,
        source_chats: list[int],
        keywords: dict[str, int],  # keyword -> target_chat_id
        target_chat_id: int,
    ) -> dict:
        """Start monitoring source chats for keyword matches."""
        self.monitors[monitor_id] = {
            "account_id": account_id,
            "source_chats": source_chats,
            "keywords": keywords,
            "target_chat_id": target_chat_id,
            "messages_forwarded": 0,
            "messages_filtered": 0,
        }
        self.running[monitor_id] = True

        # Start background monitoring loop
        asyncio.create_task(self._monitor_loop(monitor_id))
        logger.info(f"Started monitoring {monitor_id}: {len(source_chats)} sources, {len(keywords)} keywords")

        return self.monitors[monitor_id]

    async def _monitor_loop(self, monitor_id: str):
        """Background loop to monitor source chats."""
        monitor = self.monitors.get(monitor_id)
        if not monitor:
            return

        while self.running.get(monitor_id, False):
            try:
                for chat_id in monitor["source_chats"]:
                    try:
                        client = await self.client_manager.get_client(monitor["account_id"])
                        if not client:
                            break

                        messages = await self.client_manager.get_chat_history(
                            monitor["account_id"], chat_id, limit=50
                        )

                        for msg in messages:
                            if not msg.get("text"):
                                continue

                            matched = self.intercept_message(msg["text"], monitor["keywords"])
                            if matched:
                                # Forward matching message to target
                                try:
                                    await self.client_manager.send_message(
                                        monitor["account_id"],
                                        monitor["target_chat_id"],
                                        f"[Matched: {', '.join(matched.keys())}]\n{msg['text']}",
                                    )
                                    monitor["messages_forwarded"] += 1
                                except Exception as e:
                                    logger.error(f"Forward error: {e}")
                            else:
                                monitor["messages_filtered"] += 1

                    except Exception as e:
                        logger.warning(f"Monitor chat error: {e}")

            except Exception as e:
                logger.error(f"Monitor loop error: {e}")

            # Check between cycles
            await asyncio.sleep(random.uniform(30, 120))

    async def stop_monitoring(self, monitor_id: str):
        """Stop a monitoring session."""
        self.running[monitor_id] = False
        logger.info(f"Stopped monitoring: {monitor_id}")
