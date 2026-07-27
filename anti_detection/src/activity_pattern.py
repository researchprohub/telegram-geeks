"""Activity Pattern — Natural daily activity profiles."""

import random
from datetime import datetime, timedelta
from loguru import logger


class ActivityPatternService:
    """Generate and manage natural daily activity patterns."""

    def generate_daily_activity_profile(self, account_id: str, timezone: str = "UTC") -> dict:
        """Generate a realistic daily activity profile for an account."""
        # Different account types have different patterns
        patterns = {
            "morning_person": {"peak": [8, 9, 10, 11], "moderate": [14, 15, 16], "low": [22, 23, 0, 1, 2, 3, 4, 5]},
            "evening_person": {"peak": [19, 20, 21, 22], "moderate": [15, 16, 17], "low": [5, 6, 7, 8, 9, 10, 11, 12]},
            "night_owl": {"peak": [23, 0, 1, 2, 3], "moderate": [18, 19, 20, 21], "low": [8, 9, 10, 11, 12, 13, 14, 15]},
            "balanced": {"peak": [10, 11, 14, 15, 19, 20], "moderate": [8, 9, 12, 13, 16, 17, 18, 21], "low": [0, 1, 2, 3, 4, 5, 6, 7]},
        }

        pattern_type = random.choice(list(patterns.keys()))
        pattern = patterns[pattern_type]

        profile = {
            "account_id": account_id,
            "timezone": timezone,
            "pattern_type": pattern_type,
            "peak_hours": pattern["peak"],
            "moderate_hours": pattern["moderate"],
            "low_hours": pattern["low"],
            "away_periods": [
                {"start": f"{h:02d}:00", "end": f"{(h+1) % 24:02d}:00"}
                for h in random.sample(pattern["low"], min(4, len(pattern["low"])))
            ],
            "weekend_modifier": random.uniform(0.7, 1.3),  # Weekend activity multiplier
        }

        logger.info(f"Generated activity profile for {account_id}: {pattern_type}")
        return profile

    def detect_unusual_activity(self, account_id: str, profile: dict, recent_hours: list[int]) -> list[dict]:
        """Flag unusual activity outside normal patterns."""
        anomalies = []
        for hour in recent_hours:
            if hour in profile["low_hours"]:
                anomalies.append({
                    "type": "low_activity_hour",
                    "hour": hour,
                    "severity": "low",
                    "detail": f"Active during typically low hour {hour}:00",
                })
        return anomalies

    def simulate_realistic_usage(self, account_id: str, profile: dict, hours_to_simulate: int = 24) -> list[dict]:
        """Generate fake background activity to make account look natural."""
        activities = []
        now = datetime.utcnow()

        for hour_offset in range(hours_to_simulate):
            hour = (now.hour + hour_offset) % 24
            is_weekend = now.weekday() >= 5

            # Determine activity probability for this hour
            if hour in profile["peak_hours"]:
                prob = 0.7
            elif hour in profile["moderate_hours"]:
                prob = 0.4
            elif hour in profile["low_hours"]:
                prob = 0.1
            else:
                prob = 0.2

            if is_weekend:
                prob *= profile["weekend_modifier"]

            if random.random() < prob:
                # Generate a realistic background activity
                activity_type = random.choice(["read", "react", "scroll", "view"])
                activities.append({
                    "account_id": account_id,
                    "type": activity_type,
                    "timestamp": (now + timedelta(hours=hour_offset)).isoformat(),
                    "hour": hour,
                })

        return activities

    def create_activity_mask(self, account_id: str, profile: dict, mask_type: str = "background") -> list[dict]:
        """Overlay fake activity during downtime periods."""
        activities = []
        now = datetime.utcnow()

        if mask_type == "background":
            # Add passive activities during away periods
            for period in profile.get("away_periods", []):
                start_hour = int(period["start"].split(":")[0])
                for h in range(start_hour, start_hour + 2):
                    if random.random() < 0.3:
                        activities.append({
                            "account_id": account_id,
                            "type": "passive_read",
                            "hour": h % 24,
                            "timestamp": (now + timedelta(hours=h - now.hour)).isoformat(),
                        })

        elif mask_type == "boost":
            # Add extra activity to make account look more engaged
            for hour in profile["peak_hours"]:
                for _ in range(random.randint(1, 3)):
                    activities.append({
                        "account_id": account_id,
                        "type": random.choice(["react", "view", "read"]),
                        "hour": hour,
                    })

        return activities

    def blend_activity(self, account_id: str, profile: dict, real_actions: list[dict], fake_actions: list[dict]) -> list[dict]:
        """Blend real and fake activities into a natural-looking timeline."""
        all_activities = real_actions + fake_actions
        all_activities.sort(key=lambda a: a.get("timestamp", ""))

        # Add slight randomization to timestamps
        for activity in all_activities:
            if "timestamp" in activity:
                ts = datetime.fromisoformat(activity["timestamp"])
                ts += timedelta(seconds=random.randint(-60, 60))
                activity["timestamp"] = ts.isoformat()

        return all_activities
