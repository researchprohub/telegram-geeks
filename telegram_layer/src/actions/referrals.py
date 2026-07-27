"""Referrals module — Referral links to bots and Mini Apps (Telegram Expert clone)."""

import asyncio
from loguru import logger


class ReferralService:
    """Create and manage referral links for bots and Mini Apps."""

    def __init__(self, client_manager):
        self.client_manager = client_manager

    async def create_referral_link(self, account_id: str, bot_username: str, creator_user_id: int) -> dict:
        """Create a referral link for a bot."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        try:
            bot = await client.get_entity(bot_username)
            # Create a share link with ref parameter
            ref_tag = f"ref_{account_id}_{int(asyncio.get_event_loop().time())}"
            share_url = f"https://t.me/{bot_username}?start={ref_tag}"

            logger.info(f"Created referral link for {bot_username}: {share_url}")
            return {
                "bot_username": bot_username,
                "ref_tag": ref_tag,
                "url": share_url,
                "creator_id": creator_user_id,
                "status": "created",
            }
        except Exception as e:
            logger.error(f"Create referral link error: {e}")
            return {"error": str(e)}

    async def create_mini_app_referral(self, account_id: str, mini_app_url: str, ref_tag: str) -> dict:
        """Create a Mini App referral link."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        try:
            # Append ref parameter to Mini App URL
            separator = "&" if "?" in mini_app_url else "?"
            referral_url = f"{mini_app_url}{separator}ref={ref_tag}"

            logger.info(f"Created Mini App referral: {referral_url}")
            return {
                "mini_app_url": mini_app_url,
                "ref_tag": ref_tag,
                "referral_url": referral_url,
                "status": "created",
            }
        except Exception as e:
            logger.error(f"Create Mini App referral error: {e}")
            return {"error": str(e)}

    async def get_referral_stats(self, account_id: str, bot_username: str) -> dict:
        """Get referral statistics for a bot."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        try:
            # Query bot for referral stats (via BotFather API)
            botfather = await client.get_entity("BotFather")
            await client.send_message(botfather, f"/stats {bot_username}")
            await asyncio.sleep(3)
            messages = await client.get_messages(botfather, limit=1)
            response = messages[0].text if messages else ""

            # Parse stats from response
            import re
            clicks = int(re.search(r'(\d+)\s+clicks?', response) or (0,))
            joins = int(re.search(r'(\d+)\s+joins?', response) or (0,))

            return {
                "bot_username": bot_username,
                "clicks": clicks,
                "joins": joins,
                "conversion_rate": round(joins / max(clicks, 1) * 100, 1),
            }
        except Exception as e:
            logger.error(f"Get referral stats error: {e}")
            return {"error": str(e)}

    async def revoke_referral_link(self, account_id: str, bot_username: str, link_hash: str) -> bool:
        """Revoke a specific referral link."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return False

        try:
            botfather = await client.get_entity("BotFather")
            await client.send_message(botfather, f"/revoke {bot_username}")
            await asyncio.sleep(1)
            await client.send_message(botfather, link_hash)
            await asyncio.sleep(2)
            logger.info(f"Revoked referral link {link_hash}")
            return True
        except Exception as e:
            logger.error(f"Revoke referral link error: {e}")
            return False

    async def list_referral_links(self, account_id: str, bot_username: str) -> list[dict]:
        """List all referral links for a bot."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return []

        try:
            botfather = await client.get_entity("BotFather")
            await client.send_message(botfather, f"/mybots")
            await asyncio.sleep(2)
            messages = await client.get_messages(botfather, limit=1)
            response = messages[0].text if messages else ""

            import re
            links = re.findall(r'(https?://t\.me/[^\s?]+\?start=[^\s]+)', response)
            return [{"url": l} for l in links]
        except Exception as e:
            logger.error(f"List referral links error: {e}")
            return []
