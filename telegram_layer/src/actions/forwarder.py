"""Forwarder module — Reply routing from accounts to working group (Telegram Expert clone)."""

import asyncio
import random
from loguru import logger


class ForwarderService:
    """Route incoming DMs from multiple accounts into a single working group."""

    def __init__(self, client_manager):
        self.client_manager = client_manager
        self.routing: dict[str, dict] = {}  # account_id -> {working_group_id, chat_log: {chat_id: msg_id}}
        self.running: dict[str, bool] = {}

    def start_forwarding(self, account_ids: list[str], working_group_id: int) -> dict:
        """Start forwarding messages from accounts to a working group."""
        for account_id in account_ids:
            self.routing[account_id] = {
                "working_group_id": working_group_id,
                "chat_log": {},  # chat_id -> last_message_id
                "messages_forwarded": 0,
                "messages_replied": 0,
            }
            self.running[account_id] = True

        # Start monitoring loops
        for account_id in account_ids:
            asyncio.create_task(self._monitor_loop(account_id))

        logger.info(f"Started forwarding for {len(account_ids)} accounts to group {working_group_id}")
        return {"accounts": account_ids, "working_group": working_group_id}

    def stop_forwarding(self, account_id: str | None = None):
        """Stop forwarding for an account or all accounts."""
        if account_id:
            self.running[account_id] = False
            self.routing.pop(account_id, None)
        else:
            for aid in list(self.routing.keys()):
                self.running[aid] = False
            self.routing.clear()
        logger.info(f"Stopped forwarding{' for ' + account_id if account_id else ''}")

    async def _monitor_loop(self, account_id: str):
        """Monitor incoming messages and forward to working group."""
        while self.running.get(account_id, False):
            try:
                client = await self.client_manager.get_client(account_id)
                if not client:
                    await asyncio.sleep(30)
                    continue

                # Get recent messages from all chats
                messages = await self.client_manager.get_chat_history(account_id, account_id, limit=10)
                # Note: In production, this would use Telethon's get_dialogs + message listeners

                # Process new messages and forward
                for msg in messages:
                    if msg and msg.get("from_id"):
                        # Forward to working group
                        await self.client_manager.send_message(
                            account_id,
                            self.routing[account_id]["working_group_id"],
                            f"[From {msg.get('from_id')}] {msg.get('text', '')}",
                        )
                        self.routing[account_id]["messages_forwarded"] += 1

            except Exception as e:
                logger.error(f"Forwarder loop error for {account_id}: {e}")

            await asyncio.sleep(random.uniform(15, 60))

    async def route_reply(self, from_group_id: int, reply_text: str, original_account: str) -> bool:
        """Route a reply from the working group back to the original sender."""
        if original_account not in self.routing:
            return False

        working_group = self.routing[original_account]["working_group_id"]
        # In production: parse the reply to find target chat_id
        # For now, send to working group for manual routing
        try:
            await self.client_manager.send_message(
                original_account,
                working_group,
                f"[Reply] {reply_text}",
            )
            self.routing[original_account]["messages_replied"] += 1
            return True
        except Exception as e:
            logger.error(f"Route reply error: {e}")
            return False

    def get_status(self) -> dict:
        """Get forwarding status for all accounts."""
        return {
            account_id: {
                "working_group": config["working_group_id"],
                "messages_forwarded": config["messages_forwarded"],
                "messages_replied": config["messages_replied"],
                "running": self.running.get(account_id, False),
            }
            for account_id, config in self.routing.items()
        }
