"""Flood Guard — predictive FloodWait protection."""

import time
from datetime import datetime, timezone
from collections import defaultdict
from loguru import logger


class FloodGuardService:
    def __init__(self):
        self.action_timestamps: dict[str, list[float]] = defaultdict(list)
        self.flood_events: dict[str, list[dict]] = defaultdict(list)

    def record_action(self, account_id: str):
        now = time.time()
        self.action_timestamps[account_id].append(now)
        cutoff = now - 3600
        self.action_timestamps[account_id] = [t for t in self.action_timestamps[account_id] if t > cutoff]

    def record_flood(self, account_id: str, wait_seconds: int):
        self.flood_events[account_id].append({"ts": datetime.now(timezone.utc).isoformat(), "wait": wait_seconds})
        if len(self.flood_events[account_id]) > 50:
            self.flood_events[account_id] = self.flood_events[account_id][-50:]

    def get_risk(self, account_id: str) -> dict:
        recent = self.action_timestamps.get(account_id, [])
        recent_60s = [t for t in recent if t > time.time() - 60]
        recent_300s = [t for t in recent if t > time.time() - 300]
        floods = self.flood_events.get(account_id, [])
        recent_floods = [f for f in floods if (time.time() - datetime.fromisoformat(f["ts"]).timestamp()) < 3600]

        actions_per_min = len(recent_60s)
        actions_per_5min = len(recent_300s)
        flood_count = len(recent_floods)
        total_wait = sum(f["wait"] for f in recent_floods)

        risk = "low"
        if flood_count > 3 or actions_per_min > 20:
            risk = "high"
        elif flood_count > 1 or actions_per_min > 10:
            risk = "medium"

        suggested_delay = max(5, total_wait // max(1, flood_count)) if flood_count > 0 else 2

        return {
            "account_id": account_id,
            "risk": risk,
            "actions_per_min": actions_per_min,
            "actions_per_5min": actions_per_5min,
            "flood_events_1h": flood_count,
            "suggested_delay_s": suggested_delay,
        }
