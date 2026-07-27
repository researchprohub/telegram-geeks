"""Bot creator module — BotFather automation (Telegram Expert clone)."""

import asyncio
import random
from loguru import logger


class BotCreatorService:
    """Create and manage Telegram bots via BotFather."""

    def __init__(self, client_manager):
        self.client_manager = client_manager

    async def create_bot(self, account_id: str, bot_name: str, bot_description: str, bot_username: str) -> dict:
        """Create a new bot via BotFather."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        try:
            # Find BotFather
            botfather = await client.get_entity("BotFather")
            if not botfather:
                return {"error": "BotFather not found"}

            # Send /newbot command
            await client.send_message(botfather, "/newbot")
            await asyncio.sleep(2)

            # Send bot name
            await client.send_message(botfather, bot_name)
            await asyncio.sleep(2)

            # Send username
            await client.send_message(botfather, bot_username)
            await asyncio.sleep(3)

            # Get the response with bot token
            messages = await client.get_messages(botfather, limit=1)
            response = messages[0].text if messages else ""

            # Extract token from response
            import re
            token_match = re.search(r'https?://t\.me/[^\s]+', response)
            token = token_match.group(0).replace('https://t.me/', '') if token_match else ""

            logger.info(f"Created bot: {bot_username}")
            return {
                "bot_name": bot_name,
                "bot_username": bot_username,
                "bot_token": token,
                "description": bot_description,
                "status": "created",
            }
        except Exception as e:
            logger.error(f"Create bot error: {e}")
            return {"error": str(e)}

    async def set_bot_commands(self, account_id: str, bot_token: str, commands: list[dict]) -> bool:
        """Set bot /commands via BotFather API."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return False

        try:
            from telethon.tl.functions.bot import BotCommandRequest
            # Use BotFather to set commands
            botfather = await client.get_entity("BotFather")
            cmd_text = "/setcommands " + bot_token + "\n" + "\n".join(
                f"{cmd['command']} - {cmd['description']}" for cmd in commands
            )
            await client.send_message(botfather, cmd_text)
            await asyncio.sleep(2)
            logger.info(f"Set commands for bot {bot_token}")
            return True
        except Exception as e:
            logger.error(f"Set bot commands error: {e}")
            return False

    async def set_bot_photo(self, account_id: str, bot_token: str, photo_path: str) -> bool:
        """Set bot profile photo."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return False

        try:
            botfather = await client.get_entity("BotFather")
            await client.send_message(botfather, f"/setuserpic {bot_token}")
            await asyncio.sleep(2)
            await client.send_photo(botfather, photo_path)
            logger.info(f"Set photo for bot {bot_token}")
            return True
        except Exception as e:
            logger.error(f"Set bot photo error: {e}")
            return False

    async def delete_bot(self, account_id: str, bot_token: str) -> bool:
        """Delete a bot via BotFather."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return False

        try:
            botfather = await client.get_entity("BotFather")
            await client.send_message(botfather, f"/deletebot {bot_token}")
            await asyncio.sleep(2)
            logger.info(f"Deleted bot {bot_token}")
            return True
        except Exception as e:
            logger.error(f"Delete bot error: {e}")
            return False

    async def list_bots(self, account_id: str) -> list[dict]:
        """List all bots owned by the account."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return []

        try:
            botfather = await client.get_entity("BotFather")
            await client.send_message(botfather, "/mybots")
            await asyncio.sleep(2)
            messages = await client.get_messages(botfather, limit=1)
            response = messages[0].text if messages else ""
            # Parse bot list from response
            import re
            bots = re.findall(r'(@\w+)', response)
            return [{"username": b} for b in bots]
        except Exception as e:
            logger.error(f"List bots error: {e}")
            return []

    async def update_bot_info(self, account_id: str, bot_token: str, name: str, description: str, about: str) -> bool:
        """Update bot info via BotFather."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return False

        try:
            botfather = await client.get_entity("BotFather")
            # Set description
            await client.send_message(botfather, f"/setdescription {bot_token}")
            await asyncio.sleep(1)
            await client.send_message(botfather, description)
            await asyncio.sleep(1)

            # Set about
            await client.send_message(botfather, f"/setabout {bot_token}")
            await asyncio.sleep(1)
            await client.send_message(botfather, about)

            logger.info(f"Updated bot info for {bot_token}")
            return True
        except Exception as e:
            logger.error(f"Update bot info error: {e}")
            return False
