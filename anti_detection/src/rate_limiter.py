"""Intelligent rate limiter with adaptive thresholds."""

import time
from collections import defaultdict
from typing import Optional


class IntelligentRateLimiter:
    """Adaptive rate limiter based on account age and history."""

    def __init__(self):
        self.action_history: dict[str, list[float]] = defaultdict(list)
        self.rate_limits: dict[str, int] = {
            "send_message": 10,       # per 10 min
            "invite": 5,              # per 10 min
            "react": 20,              # per 10 min
            "subscribe": 3,           # per 10 min
            "default": 15,            # per 10 min
        }

    def check_rate_limit(self, account_id: str, action_type: str) -> bool:
        """Check if an action is within rate limits."""
        limit = self.rate_limits.get(action_type, self.rate_limits["default"])
        window = 600  # 10 minutes

        now = time.time()
        cutoff = now - window

        # Clean old entries
        self.action_history[account_id] = [
            t for t in self.action_history[account_id] if t > cutoff
        ]

        return len(self.action_history[account_id]) < limit

    def record_action(self, account_id: str, action_type: str):
        """Record an action for rate limiting."""
        self.action_history[account_id].append(time.time())

    def calculate_safe_rate(self, account_id: str, account_age_days: int, past_violations: int = 0) -> dict:
        """Calculate safe action rates based on account characteristics."""
        # Younger accounts need lower rates
        age_multiplier = min(account_age_days / 30, 1.0)  # Full rate after 30 days
        # Past violations reduce rate further
        violation_penalty = max(0, 1.0 - past_violations * 0.15)

        multiplier = age_multiplier * violation_penalty

        return {
            "send_message": int(10 * multiplier),
            "invite": int(5 * multiplier),
            "react": int(20 * multiplier),
            "subscribe": int(3 * multiplier),
            "age_multiplier": round(age_multiplier, 2),
            "violation_penalty": round(violation_penalty, 2),
        }

    def get_account_velocity(self, account_id: str, window_minutes: int = 60) -> int:
        """Get current action velocity for an account."""
        cutoff = time.time() - (window_minutes * 60)
        recent = [t for t in self.action_history.get(account_id, []) if t > cutoff]
        return len(recent)

    def predict_flood_wait_risk(self, account_id: str, planned_actions: int) -> str:
        """Predict if planned actions will cause a flood wait."""
        velocity = self.get_account_velocity(account_id, window_minutes=10)
        total = velocity + planned_actions
        if total > 20:
            return "high"
        elif total > 10:
            return "medium"
        return "low"

    def enforce_cooldown(self, account_id: str, violation_type: str, duration: int):
        """Enforce a cooldown period for a specific violation."""
        now = time.time()
        if "cooldowns" not in self.__dict__:
            self.__dict__["cooldowns"] = {}
        self.__dict__["cooldowns"][account_id] = now + duration

    def is_on_cooldown(self, account_id: str) -> Optional[int]:
        """Check if account is on cooldown. Returns remaining seconds or None."""
        cooldowns = self.__dict__.get("cooldowns", {})
        if account_id in cooldowns:
            remaining = cooldowns[account_id] - time.time()
            if remaining > 0:
                return int(remaining)
            del cooldowns[account_id]
        return None
