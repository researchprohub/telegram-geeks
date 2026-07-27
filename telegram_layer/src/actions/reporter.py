"""Mass Reporter module — file complaints against users/channels/messages."""

from telethon.errors import FloodWaitError
from loguru import logger


class ReporterService:
    """Mass report users, channels, groups, or messages."""

    def __init__(self, client_manager):
        self.client_manager = client_manager

    async def report_user(self, phone: str, target_user_id: int, reason: str = "spam") -> bool:
        """Report a user to Telegram moderators."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return False

        try:
            from telethon.tl.functions.report_spam import ReportSpamRequest
            await client(functions=ReportSpamRequest(peer=target_user_id))
            logger.info(f"User {target_user_id} reported by {phone}")
            return True
        except FloodWaitError as e:
            import asyncio
            await asyncio.sleep(e.seconds + 5)
            return await self.report_user(phone, target_user_id, reason)
        except Exception as e:
            logger.error(f"Report user error: {e}")
            return False

    async def report_message(self, phone: str, chat_id: int, message_id: int, reason: str = "spam") -> bool:
        """Report a specific message."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return False

        try:
            from telethon.tl.functions.messages import ReportRequest
            from telethon.tl.types import InputReportReasonSpam
            await client(functions=ReportRequest(
                peer=chat_id,
                id=[message_id],
                reason=InputReportReasonSpam(),
            ))
            logger.info(f"Message {message_id} in {chat_id} reported by {phone}")
            return True
        except FloodWaitError as e:
            import asyncio
            await asyncio.sleep(e.seconds + 5)
            return await self.report_message(phone, chat_id, message_id, reason)
        except Exception as e:
            logger.error(f"Report message error: {e}")
            return False

    async def report_channel(self, phone: str, channel_id: int, reason: str = "spam") -> bool:
        """Report a channel."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return False

        try:
            from telethon.tl.functions.report_spam import ReportSpamRequest
            from telethon.tl.types import InputChannel
            await client(functions=ReportSpamRequest(
                peer=InputChannel(channel_id, 0),
            ))
            logger.info(f"Channel {channel_id} reported by {phone}")
            return True
        except FloodWaitError as e:
            import asyncio
            await asyncio.sleep(e.seconds + 5)
            return await self.report_channel(phone, channel_id, reason)
        except Exception as e:
            logger.error(f"Report channel error: {e}")
            return False

    async def mass_report(
        self,
        accounts: list[str],
        targets: list[int],
        target_type: str = "user",  # user, message, channel
        delays: tuple[int, int] = (5, 30),
    ) -> dict:
        """Mass report multiple targets from multiple accounts with anti-detection."""
        import asyncio
        import random
        results = {"reported": 0, "failed": 0, "blocked": 0}

        for account_phone in accounts:
            for target in targets:
                try:
                    if target_type == "user":
                        success = await self.report_user(account_phone, target)
                    elif target_type == "message":
                        success = await self.report_message(account_phone, target["chat_id"], target["message_id"])
                    elif target_type == "channel":
                        success = await self.report_channel(account_phone, target)
                    else:
                        continue

                    if success:
                        results["reported"] += 1
                    else:
                        results["failed"] += 1

                    # Anti-detection delay
                    delay = random.randint(delays[0], delays[1])
                    await asyncio.sleep(delay)

                except Exception:
                    results["failed"] += 1

        return results
