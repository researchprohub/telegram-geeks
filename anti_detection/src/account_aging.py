"""Account aging simulation — older accounts behave differently."""

import random
from datetime import datetime, timedelta
from loguru import logger


class AccountAging:
    """Simulates realistic account aging and behavior adaptation."""

    @staticmethod
    def calculate_trust_score(days_active: int, daily_messages_sent: int, violations: int = 0) -> float:
        """Calculate trust score 0-100 based on account age and behavior."""
        # Age component (0-40 points)
        age_score = min(days_active / 365 * 40, 40)

        # Activity component (0-30 points) — moderate activity is best
        daily_ratio = daily_messages_sent / 50 if daily_messages_sent > 0 else 0
        if 0.1 <= daily_ratio <= 0.8:
            activity_score = 30
        elif daily_ratio < 0.1:
            activity_score = 10  # Too quiet
        else:
            activity_score = max(0, 30 - (daily_ratio - 0.8) * 100)

        # Violation penalty (0-30 points deducted)
        violation_penalty = violations * 10

        return max(0.0, min(100.0, age_score + activity_score - violation_penalty))

    @staticmethod
    def adjust_behavior_by_age(account_age_days: int) -> dict:
        """Return behavior adjustments based on account age."""
        if account_age_days < 7:
            # New account — very cautious
            return {
                "max_daily_messages": 10,
                "min_delay_between_actions": 120,  # 2 minutes
                "avoid_direct_links": True,
                "avoid_mass_actions": True,
                "interaction_ratio": 0.9,  # 90% reading, 10% posting
            }
        elif account_age_days < 30:
            # Young account — moderately cautious
            return {
                "max_daily_messages": 25,
                "min_delay_between_actions": 60,
                "avoid_direct_links": True,
                "avoid_mass_actions": False,
                "interaction_ratio": 0.7,
            }
        elif account_age_days < 90:
            # Established account — relaxed
            return {
                "max_daily_messages": 40,
                "min_delay_between_actions": 30,
                "avoid_direct_links": False,
                "avoid_mass_actions": False,
                "interaction_ratio": 0.5,
            }
        else:
            # Mature account — fully relaxed
            return {
                "max_daily_messages": 50,
                "min_delay_between_actions": 15,
                "avoid_direct_links": False,
                "avoid_mass_actions": False,
                "interaction_ratio": 0.4,
            }

    @staticmethod
    def warm_up_schedule(days: int) -> dict:
        """Define progressive warm-up schedule."""
        schedule = {}
        for day in range(1, days + 1):
            if day <= 3:
                schedule[day] = {
                    "actions": ["read_only"],
                    "messages_per_day": random.randint(1, 3),
                    "likes_per_day": random.randint(2, 5),
                    "joins": 0,
                }
            elif day <= 7:
                schedule[day] = {
                    "actions": ["read", "react", "brief_reply"],
                    "messages_per_day": random.randint(3, 8),
                    "likes_per_day": random.randint(5, 15),
                    "joins": random.randint(0, 2),
                }
            elif day <= 14:
                schedule[day] = {
                    "actions": ["read", "react", "reply", "share"],
                    "messages_per_day": random.randint(5, 15),
                    "likes_per_day": random.randint(10, 30),
                    "joins": random.randint(0, 5),
                }
            elif day <= 30:
                schedule[day] = {
                    "actions": ["read", "react", "reply", "share", "invite"],
                    "messages_per_day": random.randint(10, 30),
                    "likes_per_day": random.randint(15, 50),
                    "joins": random.randint(1, 10),
                }
            else:
                schedule[day] = {
                    "actions": ["read", "react", "reply", "share", "invite", "post"],
                    "messages_per_day": random.randint(15, 50),
                    "likes_per_day": random.randint(20, 80),
                    "joins": random.randint(2, 15),
                }
        return schedule

    @staticmethod
    def simulate_account_aging(account_id: str, days_active: int) -> dict:
        """Get full aging profile for an account."""
        behavior = AccountAging.adjust_behavior_by_age(days_active)
        trust = AccountAging.calculate_trust_score(days_active, behavior["max_daily_messages"])
        warmup = AccountAging.warm_up_schedule(min(days_active, 30))

        return {
            "account_id": account_id,
            "days_active": days_active,
            "trust_score": trust,
            "behavior": behavior,
            "current_warmup_day": min(days_active, 30),
            "warmup_progress": min(days_active / 30 * 100, 100),
        }
