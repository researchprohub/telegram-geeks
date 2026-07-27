"""Comments in Channels module — boost comments in Telegram channels.

Telegram Expert manual: Comments in channels

Posts comments in channels where commenting is enabled:
- All subscribed channels
- Specific channels
- With text randomizer and spintax support
"""

import asyncio
import random
from datetime import datetime, timezone
from typing import Dict, List, Optional
from loguru import logger


class ChannelCommentsService:
    """Boost comments in Telegram channels."""

    def __init__(self, client_manager):
        self.client_manager = client_manager

    async def post_comments(
        self,
        account_phones: List[str],
        channel_links: List[str],
        comments: List[str],
        delay_range: tuple = (5, 15),
        thread_count: int = 10,
        comments_per_post: int = 3,
        randomize_order: bool = True,
    ) -> Dict:
        """Post comments in channels.
        
        Args:
            account_phones: List of account phone numbers
            channel_links: List of channel links
            comments: List of comment texts (spintax supported)
            delay_range: Min/max delay between comments
            thread_count: Number of concurrent accounts
            comments_per_post: Comments per post
            randomize_order: Randomize comment order
        """
        logger.info(f"Posting comments: {len(account_phones)} accounts, {len(channel_links)} channels, {len(comments)} comment options")
        
        results = {
            "status": "completed",
            "accounts_processed": 0,
            "comments_posted": 0,
            "channels_used": 0,
            "failures": 0,
            "comment_details": [],
        }
        
        # Get clients
        clients = {}
        for phone in account_phones:
            client = await self.client_manager.get_client(phone)
            if client:
                clients[phone] = client
        
        if not clients:
            return {
                "status": "error",
                "message": "No active accounts available",
            }
        
        # Randomize comment order if requested
        if randomize_order:
            comments = comments.copy()
            random.shuffle(comments)
        
        semaphore = asyncio.Semaphore(thread_count)
        
        async def post_from_account(phone: str, client, channels: List[str]) -> Dict:
            async with semaphore:
                return await self._post_from_single_account(
                    phone, client, channels, comments, delay_range, comments_per_post
                )
        
        tasks = []
        for phone, client in clients.items():
            # Assign channels round-robin
            assigned_channels = channels[:min(len(channels), len(clients))]
            task = post_from_account(phone, client, assigned_channels)
            tasks.append(task)
        
        for task in asyncio.as_completed(tasks):
            result = await task
            results["comment_details"].append(result)
            results["accounts_processed"] += 1
            results["comments_posted"] += result.get("comments_posted", 0)
            results["channels_used"] += result.get("channels_used", 0)
            results["failures"] += result.get("failures", 0)
        
        logger.info(f"Comments posted: {results['comments_posted']} total")
        return results

    async def _post_from_single_account(
        self,
        phone: str,
        client,
        channels: List[str],
        comments: List[str],
        delay_range: tuple,
        comments_per_post: int,
    ) -> Dict:
        """Post comments from a single account."""
        comments_posted = 0
        channels_used = 0
        failures = 0
        
        for channel_link in channels:
            try:
                # Get channel entity
                entity = await client.get_entity(channel_link)
                
                # Check if commenting is enabled
                if not self._can_comment(entity):
                    logger.debug(f"Commenting not enabled in {channel_link}")
                    continue
                
                # Find recent posts to comment on
                messages = await client.get_messages(entity, limit=10)
                
                for msg in messages:
                    if not msg or not hasattr(msg, 'id'):
                        continue
                    
                    # Post comments on this message
                    for i in range(min(comments_per_post, len(comments))):
                        try:
                            comment_text = self._apply_spintax(comments[i])
                            await self._post_comment(client, entity, msg.id, comment_text)
                            comments_posted += 1
                            
                            delay = random.uniform(delay_range[0], delay_range[1])
                            await asyncio.sleep(delay)
                            
                        except Exception as e:
                            logger.debug(f"Comment post error: {e}")
                            failures += 1
                    
                    channels_used += 1
                    
            except Exception as e:
                logger.debug(f"Channel error: {e}")
                failures += 1
        
        return {
            "phone": phone,
            "comments_posted": comments_posted,
            "channels_used": channels_used,
            "failures": failures,
        }

    def _can_comment(self, entity) -> bool:
        """Check if commenting is enabled on entity."""
        try:
            from telethon.tl.types import Channel, Chat, Group, ChannelForbidden, ChatForbidden
            
            if isinstance(entity, (Channel, Chat, Group)):
                # Check if comments are enabled
                if hasattr(entity, 'comments'):
                    return bool(entity.comments)
                elif hasattr(entity, 'forbid'):
                    return not entity.forbid
                else:
                    return True  # Assume commenting enabled
            return False
        except:
            return True

    async def _post_comment(
        self,
        client,
        entity,
        reply_to_msg_id: int,
        text: str,
    ):
        """Post a comment reply."""
        try:
            await client.send_message(
                entity,
                text,
                reply_to=reply_to_msg_id,
            )
        except Exception as e:
            logger.debug(f"Send comment error: {e}")
            raise

    def _apply_spintax(self, text: str) -> str:
        """Apply spintax syntax to text."""
        import re
        
        pattern = r'\{([^}]+)\}'
        
        def replace(match):
            options = match.group(1).split('|')
            return random.choice(options)
        
        return re.sub(pattern, replace, text)

    async def get_channel_comment_status(
        self,
        channel_link: str,
    ) -> Dict:
        """Check if commenting is enabled on a channel."""
        try:
            # This would require an active client
            # For now, return basic info
            return {
                "channel": channel_link,
                "commenting_enabled": True,  # Placeholder
                "comment_thread_id": None,
            }
        except Exception as e:
            return {
                "channel": channel_link,
                "commenting_enabled": False,
                "error": str(e),
            }
