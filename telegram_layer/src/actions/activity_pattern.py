"""Activity Pattern — natural daily activity profile generator."""

import random
from datetime import datetime, timezone
from loguru import logger


class ActivityPatternService:
    ACTIVITY_CURVES = {
        "morning_person": {h: max(0, 100 - abs(h - 9) * 12) for h in range(24)},
        "night_owl": {h: max(0, 100 - abs(h - 1) * 10) for h in range(24)},
        "balanced": {h: max(0, 80 - abs(h - 14) * 5) for h in range(24)},
        "worker": {h: max(0, 100 - abs(h - 19) * 8) if h < 9 or h > 17 else 30 for h in range(24)},
    }

    def generate_profile(self, name: str, pattern: str = "balanced") -> dict:
        curve = self.ACTIVITY_CURVES.get(pattern, self.ACTIVITY_CURVES["balanced"])
        profile = {
            "name": name,
            "pattern": pattern,
            "hourly_activity": curve,
            "peak_hour": max(curve, key=curve.get),
            "active_hours": [h for h, v in curve.items() if v > 30],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        return profile

    def get_activity_score(self, profile_name: str, pattern: str = "balanced") -> float:
        hour = datetime.now(timezone.utc).hour
        curve = self.ACTIVITY_CURVES.get(pattern, self.ACTIVITY_CURVES["balanced"])
        return curve.get(hour, 0) / 100.0

    def get_suggested_actions(self, profile_name: str, pattern: str = "balanced") -> dict:
        hour = datetime.now(timezone.utc).hour
        curve = self.ACTIVITY_CURVES.get(pattern, self.ACTIVITY_CURVES["balanced"])
        score = curve.get(hour, 0) / 100.0
        max_actions = int(score * 20)
        return {
            "current_activity": round(score, 2),
            "suggested_max_actions": max_actions,
            "suggested_min_delay_s": max(5, int((1 - score) * 60)),
            "is_peak_hour": score > 0.7,
        }
