"""Safety monitor — comprehensive account health assessment."""

import asyncio
from datetime import datetime, timedelta
from loguru import logger


class SafetyMonitor:
    """Real-time safety monitoring for all accounts."""

    def __init__(self):
        self.monitoring: dict[str, dict] = {}  # account_id -> status

    async def monitor_account_safety(self, account_id: str, metrics: dict) -> dict:
        """Run comprehensive safety check on an account."""
        risk_factors = []
        score = 100.0

        # Check daily message ratio
        daily_messages = metrics.get("daily_messages", 0)
        daily_limit = metrics.get("daily_limit", 50)
        usage_ratio = daily_messages / max(daily_limit, 1)
        if usage_ratio > 0.9:
            risk_factors.append("Near daily limit")
            score -= 30
        elif usage_ratio > 0.7:
            risk_factors.append("High message volume")
            score -= 15

        # Check flood waits
        flood_waits = metrics.get("flood_waits_today", 0)
        if flood_waits > 5:
            risk_factors.append("Excessive flood waits")
            score -= 25
        elif flood_waits > 2:
            risk_factors.append("Multiple flood waits")
            score -= 10

        # Check trust score
        trust = metrics.get("trust_score", 50)
        if trust < 30:
            risk_factors.append("Low trust score")
            score -= 20
        elif trust < 50:
            risk_factors.append("Below average trust")
            score -= 10

        # Check account age
        account_age = metrics.get("account_age_days", 0)
        if account_age < 7 and daily_messages > 10:
            risk_factors.append("New account with high activity")
            score -= 25

        # Check ban status
        if metrics.get("is_banned"):
            risk_factors.append("Account is banned")
            score = 0

        risk_level = "critical" if score < 20 else "high" if score < 40 else "medium" if score < 70 else "low"

        result = {
            "account_id": account_id,
            "safety_score": max(0, score),
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "should_pause": score < 30,
            "checked_at": datetime.utcnow().isoformat(),
        }

        self.monitoring[account_id] = result
        return result

    async def get_safety_report(self, account_id: str) -> dict:
        """Get the latest safety report for an account."""
        return self.monitoring.get(account_id, {"account_id": account_id, "no_report_yet": True})

    def get_all_reports(self) -> dict:
        """Get safety reports for all monitored accounts."""
        return dict(self.monitoring)

    def emergency_stop(self, account_id: str, reason: str):
        """Immediately stop all activity for an account."""
        logger.critical(f"EMERGENCY STOP: {account_id} — {reason}")
        if account_id in self.monitoring:
            self.monitoring[account_id]["emergency_stopped"] = True
            self.monitoring[account_id]["stop_reason"] = reason
            self.monitoring[account_id]["stop_time"] = datetime.utcnow().isoformat()
