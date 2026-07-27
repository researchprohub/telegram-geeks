"""Flood Guard — Predictive FloodWait protection."""

import time
from datetime import datetime, timedelta
from loguru import logger


class FloodGuard:
    """Predictive FloodWait protection with adaptive backoff."""

    def __init__(self):
        self.flood_history: dict[str, list[float]] = defaultdict(list)  # account_id -> timestamps
        self.current_flood_waits: dict[str, float] = {}  # account_id -> wait_end_timestamp

    def track_flood_history(self, account_id: str, wait_seconds: int):
        """Record a flood wait event."""
        now = time.time()
        self.flood_history[account_id].append(now)
        self.current_flood_waits[account_id] = now + wait_seconds
        # Keep only last 24 hours
        cutoff = now - 86400
        self.flood_history[account_id] = [t for t in self.flood_history[account_id] if t > cutoff]
        logger.warning(f"FloodWait tracked for {account_id}: {wait_seconds}s (total today: {len(self.flood_history[account_id])})")

    def predict_next_flood(self, account_id: str, planned_actions: int) -> dict:
        """Estimate if planned actions will trigger FloodWait."""
        history = self.flood_history.get(account_id, [])
        recent_waits = len([t for t in history if t > time.time() - 3600])  # last hour

        # Calculate risk based on recent flood frequency
        if recent_waits == 0:
            risk = "low" if planned_actions < 20 else "medium" if planned_actions < 40 else "high"
        elif recent_waits <= 2:
            risk = "medium" if planned_actions < 10 else "high"
        else:
            risk = "high"

        # Predict next flood window
        last_flood = history[-1] if history else 0
        next_safe = last_flood + 600  # 10 min buffer

        return {
            "risk": risk,
            "recent_waits": recent_waits,
            "planned_actions": planned_actions,
            "next_safe_window": datetime.fromtimestamp(next_safe).isoformat(),
            "recommendation": "pause" if risk == "high" else "proceed_caution" if risk == "medium" else "proceed",
        }

    def adaptive_backoff(self, account_id: str, current_wait: int) -> int:
        """Calculate optimal wait time based on history."""
        history = self.flood_history.get(account_id, [])
        recent_waits = [t for t in history if t > time.time() - 3600]

        # If many recent floods, add buffer
        buffer = len(recent_waits) * 30  # 30s extra per recent flood

        # Increase if current wait is unusually long
        if current_wait > 300:
            buffer += 120  # Extra 2 min buffer

        return current_wait + buffer

    def safe_send_window(self, account_id: str) -> tuple[float, float]:
        """Return (start, end) time window when it's safe to send."""
        now = time.time()

        # Check if currently in flood wait
        flood_end = self.current_flood_waits.get(account_id, 0)
        if flood_end > now:
            return (flood_end, flood_end + 60)

        # Check recent flood history
        recent = [t for t in self.flood_history.get(account_id, []) if t > now - 3600]
        if recent:
            last_flood = max(recent)
            safe_after = last_flood + 600  # 10 min after last flood
            return (safe_after, safe_after + 3600)

        # No history — safe now
        return (now, now + 3600)

    def calculate_risk_score(self, account_id: str, planned_actions: int) -> int:
        """Risk score 0-100."""
        score = 0
        history = self.flood_history.get(account_id, [])
        recent = len([t for t in history if t > time.time() - 3600])

        score += min(recent * 15, 40)  # Up to 40 from recent floods
        score += min(planned_actions * 2, 30)  # Up to 30 from planned volume
        score += 30 if account_id in self.current_flood_waits else 0

        return min(score, 100)
