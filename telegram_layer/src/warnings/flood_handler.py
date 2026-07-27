"""Telegram layer — FloodWait and ban handling."""

import asyncio
from datetime import datetime, timedelta
from loguru import logger


class FloodWaitHandler:
    """Handles Telegram FloodWait errors with adaptive backoff."""

    def __init__(self):
        self.flood_history: dict[str, list[datetime]] = {}  # account_id -> timestamps

    def record_flood_wait(self, account_id: str, wait_seconds: int):
        """Record a flood wait event for an account."""
        now = datetime.utcnow()
        if account_id not in self.flood_history:
            self.flood_history[account_id] = []
        self.flood_history[account_id].append(now)
        # Keep only last 24 hours
        cutoff = now - timedelta(hours=24)
        self.flood_history[account_id] = [
            t for t in self.flood_history[account_id] if t > cutoff
        ]
        logger.warning(
            f"FloodWait recorded for {account_id}: {wait_seconds}s "
            f"(total today: {len(self.flood_history[account_id])})"
        )

    def get_safe_delay(self, account_id: str, base_delay: int = 1) -> int:
        """Calculate a safe delay based on account's flood history."""
        floods = len(self.flood_history.get(account_id, []))
        # More floods = longer delay
        multiplier = 1 + (floods * 0.5)
        return int(base_delay * multiplier)

    def should_pause(self, account_id: str, threshold: int = 10) -> bool:
        """Check if account should be paused due to excessive floods."""
        floods = len(self.flood_history.get(account_id, []))
        return floods >= threshold

    def get_last_flood_time(self, account_id: str) -> datetime | None:
        """Get the timestamp of the last flood wait."""
        history = self.flood_history.get(account_id, [])
        return history[-1] if history else None


class BanDetector:
    """Detects and handles account bans."""

    def __init__(self):
        self.banned_accounts: set[str] = set()
        self.spamblocked_accounts: set[str] = set()

    def record_ban(self, account_id: str, reason: str = ""):
        """Mark an account as banned."""
        self.banned_accounts.add(account_id)
        logger.error(f"Account {account_id} banned: {reason}")

    def record_spamblock(self, account_id: str):
        """Mark an account as spamblocked."""
        self.spamblocked_accounts.add(account_id)
        logger.warning(f"Account {account_id} spamblocked")

    def is_banned(self, account_id: str) -> bool:
        return account_id in self.banned_accounts

    def is_spamblocked(self, account_id: str) -> bool:
        return account_id in self.spamblocked_accounts

    def get_blocked_accounts(self) -> dict:
        return {
            "banned": list(self.banned_accounts),
            "spamblocked": list(self.spamblocked_accounts),
        }
