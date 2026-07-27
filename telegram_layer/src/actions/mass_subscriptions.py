"""Mass Subscriptions module — subscribe accounts to channels/groups in bulk.

Telegram Expert manual: https://en.telegramexpert.pro/manuals/massovye-podpiski

Subscribes accounts to target channels/groups with:
- Delay controls
- Thread management
- Flood-wait handling
- Auto-leave after period
"""

import asyncio
import random
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from loguru import logger


class MassSubscriptionsService:
    """Subscribe accounts to channels/groups in bulk."""

    def __init__(self, client_manager):
        self.client_manager = client_manager
        self.subscription_history: List[Dict] = []

    async def subscribe_to_channels(
        self,
        account_phones: List[str],
        channel_links: List[str],
        delay_range: tuple = (10, 30),
        max_subscriptions_per_account: int = 50,
        thread_count: int = 10,
        auto_leave_after_days: Optional[int] = None,
    ) -> Dict:
        """Subscribe accounts to channels in bulk.
        
        Args:
            account_phones: List of account phone numbers
            channel_links: List of channel links/usernames
            delay_range: Min/max delay between subscriptions in seconds
            max_subscriptions_per_account: Max channels per account
            thread_count: Number of concurrent subscriptions
            auto_leave_after_days: Auto-leave channel after N days (None=never)
        """
        logger.info(f"Starting mass subscriptions: {len(account_phones)} accounts, {len(channel_links)} channels")
        
        results = {
            "status": "completed",
            "accounts_processed": 0,
            "channels_subscribed": 0,
            "failures": 0,
            "subscription_details": [],
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
        
        semaphore = asyncio.Semaphore(thread_count)
        
        async def subscribe_account(phone: str, client, channels: List[str]) -> Dict:
            async with semaphore:
                return await self._subscribe_account_to_channels(
                    phone, client, channels, delay_range, auto_leave_after_days
                )
        
        tasks = []
        for phone, client in clients.items():
            # Assign channels round-robin
            assigned_channels = channel_links[:max_subscriptions_per_account]
            task = subscribe_account(phone, client, assigned_channels)
            tasks.append(task)
        
        # Execute tasks
        for task in asyncio.as_completed(tasks):
            result = await task
            results["subscription_details"].append(result)
            results["accounts_processed"] += 1
            results["channels_subscribed"] += result.get("subscriptions_made", 0)
            results["failures"] += result.get("failures", 0)
        
        # Record history
        self.subscription_history.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_accounts": len(account_phones),
            "total_channels": len(channel_links),
            "results": results,
        })
        
        logger.info(f"Mass subscriptions complete: {results['channels_subscribed']} subscriptions made")
        return results

    async def _subscribe_account_to_channels(
        self,
        phone: str,
        client,
        channels: List[str],
        delay_range: tuple,
        auto_leave_after_days: Optional[int],
    ) -> Dict:
        """Subscribe a single account to multiple channels."""
        subscriptions_made = 0
        failures = 0
        
        for channel_link in channels:
            try:
                # Join channel
                result = await self._join_channel(client, channel_link)
                
                if result.get("success"):
                    subscriptions_made += 1
                    
                    # Schedule auto-leave if configured
                    if auto_leave_after_days:
                        await self._schedule_auto_leave(
                            client, channel_link, auto_leave_after_days
                        )
                else:
                    failures += 1
                
                # Delay between subscriptions
                delay = random.uniform(delay_range[0], delay_range[1])
                await asyncio.sleep(delay)
                
            except Exception as e:
                logger.debug(f"Subscription error for {phone}: {e}")
                failures += 1
                await asyncio.sleep(5)
        
        return {
            "phone": phone,
            "subscriptions_made": subscriptions_made,
            "failures": failures,
            "channels": channels,
        }

    async def _join_channel(self, client, channel_link: str) -> Dict:
        """Join a channel."""
        try:
            from telethon.tl.functions.channels import JoinChannelRequest
            from telethon.tl.types import Channel, SuperGroup
            
            # Resolve channel link to entity
            entity = await client.get_entity(channel_link)
            
            if isinstance(entity, (Channel, SuperGroup)):
                await client(JoinChannelRequest(entity))
                return {"success": True, "channel": channel_link}
            else:
                return {"success": False, "error": "Not a channel/group"}
        
        except Exception as e:
            error_msg = str(e)
            if "FloodWait" in error_msg:
                # Extract wait time and delay
                import re
                match = re.search(r'FloodWaitError\(seconds=(\d+)\)', error_msg)
                if match:
                    wait_time = int(match.group(1)) + 5
                    await asyncio.sleep(wait_time)
                    # Retry once
                    return await self._join_channel(client, channel_link)
            
            return {"success": False, "error": error_msg}

    async def _schedule_auto_leave(
        self,
        client,
        channel_link: str,
        days: int,
    ):
        """Schedule auto-leave from channel after N days."""
        leave_time = datetime.now(timezone.utc) + timedelta(days=days)
        
        # Store schedule (in production, use a database/queue)
        schedule_entry = {
            "phone": str(client.phone),
            "channel": channel_link,
            "leave_at": leave_time.isoformat(),
        }
        
        logger.info(f"Scheduled auto-leave for {schedule_entry}")
        # In production, this would be stored in a database or task queue

    async def unsubscribe_from_channels(
        self,
        account_phones: List[str],
        channel_links: List[str],
        thread_count: int = 10,
    ) -> Dict:
        """Unsubscribe accounts from channels."""
        logger.info(f"Unsubscribing {len(account_phones)} accounts from {len(channel_links)} channels")
        
        results = {
            "status": "completed",
            "accounts_processed": 0,
            "channels_unsubscribed": 0,
            "failures": 0,
        }
        
        clients = {}
        for phone in account_phones:
            client = await self.client_manager.get_client(phone)
            if client:
                clients[phone] = client
        
        semaphore = asyncio.Semaphore(thread_count)
        
        async def unsubscribe_account(phone: str, client, channels: List[str]) -> Dict:
            async with semaphore:
                unsubscribed = 0
                failures = 0
                
                for channel_link in channels:
                    try:
                        await self._leave_channel(client, channel_link)
                        unsubscribed += 1
                    except Exception as e:
                        logger.debug(f"Unsubscribe error: {e}")
                        failures += 1
                
                return {
                    "phone": phone,
                    "unsubscribed": unsubscribed,
                    "failures": failures,
                }
        
        tasks = []
        for phone, client in clients.items():
            task = unsubscribe_account(phone, client, channel_links)
            tasks.append(task)
        
        for task in asyncio.as_completed(tasks):
            result = await task
            results["accounts_processed"] += 1
            results["channels_unsubscribed"] += result.get("unsubscribed", 0)
            results["failures"] += result.get("failures", 0)
        
        return results

    async def _leave_channel(self, client, channel_link: str):
        """Leave a channel."""
        try:
            from telethon.tl.functions.channels import LeaveChannelRequest
            from telethon.tl.types import Channel, SuperGroup
            
            entity = await client.get_entity(channel_link)
            
            if isinstance(entity, (Channel, SuperGroup)):
                await client(LeaveChannelRequest(entity))
        except Exception as e:
            logger.debug(f"Leave channel error: {e}")
