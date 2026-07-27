"""Real-time streaming — SSE and WebSocket metrics."""

import asyncio
import json
from datetime import datetime, timezone
from loguru import logger


class RealtimeService:
    """Real-time data streaming for dashboards."""

    def __init__(self):
        self.subscribers: dict[str, list] = {}  # campaign_id -> list of async queues

    async def stream_events(self, campaign_id: str, event_queue: asyncio.Queue):
        """Server-Sent Events stream for live event feed."""
        # Subscribe to events
        if campaign_id not in self.subscribers:
            self.subscribers[campaign_id] = []
        self.subscribers[campaign_id].append(event_queue)

        try:
            while True:
                event = await event_queue.get()
                yield f"data: {json.dumps(event)}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if campaign_id in self.subscribers:
                self.subscribers[campaign_id].remove(event_queue)

    async def stream_metrics(self, campaign_id: str) -> dict:
        """Get real-time metrics snapshot."""
        return {
            "campaign_id": campaign_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "live_messages": 0,
            "live_reactions": 0,
            "active_accounts": 0,
            "conversations_active": 0,
        }

    async def push_notification(self, event: dict):
        """Push notification for significant events."""
        logger.info(f"Push notification: {event.get('type', 'unknown')}")
        # Broadcast to all subscribers
        campaign_id = event.get("campaign_id")
        if campaign_id in self.subscribers:
            for queue in self.subscribers[campaign_id]:
                await queue.put(event)

    async def get_live_dashboard(self, campaign_id: str) -> dict:
        """Get real-time dashboard data."""
        return {
            "campaign_id": campaign_id,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "metrics": {
                "messages_per_minute": 0,
                "reactions_per_minute": 0,
                "conversions_per_hour": 0,
            },
            "alerts": [],
            "account_status": {},
        }

    async def broadcast_event(self, campaign_id: str, event_type: str, data: dict):
        """Broadcast an event to all subscribers."""
        event = {
            "type": event_type,
            "campaign_id": campaign_id,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await self.push_notification(event)
