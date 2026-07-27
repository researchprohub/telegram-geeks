"""Anomaly Detector — Baseline behavior tracking + deviation detection."""

import math
from collections import defaultdict
from datetime import datetime, timedelta
from loguru import logger


class AnomalyDetector:
    """Track baseline behavior and detect anomalies."""

    def __init__(self):
        self.baselines: dict[str, dict] = {}  # account_id -> baseline stats
        self.alerts: list[dict] = []

    def baseline_behavior(self, account_id: str, activities: list[dict]) -> dict:
        """Establish baseline from first N days of activity."""
        if not activities:
            return {"status": "no_data"}

        timestamps = [datetime.fromisoformat(a["timestamp"]) for a in activities if "timestamp" in a]
        if not timestamps:
            return {"status": "no_timestamps"}

        # Calculate stats
        hours = [t.hour for t in timestamps]
        intervals = []
        for i in range(1, len(timestamps)):
            intervals.append((timestamps[i] - timestamps[i-1]).total_seconds())

        baseline = {
            "account_id": account_id,
            "created_at": datetime.utcnow().isoformat(),
            "avg_interval": sum(intervals) / max(len(intervals), 1),
            "std_interval": self._std(intervals),
            "avg_hour": sum(hours) / max(len(hours), 1),
            "hour_variance": self._variance(hours),
            "total_activities": len(activities),
            "peak_hours": sorted(set(hours), key=lambda h: hours.count(h), reverse=True)[:5],
            "min_interval": min(intervals) if intervals else 0,
            "max_interval": max(intervals) if intervals else 0,
        }

        self.baselines[account_id] = baseline
        logger.info(f"Baseline established for {account_id}: avg_interval={baseline['avg_interval']:.0f}s")
        return baseline

    def detect_deviation(self, account_id: str, new_activity: dict) -> dict:
        """Check if new activity deviates from baseline."""
        baseline = self.baselines.get(account_id)
        if not baseline:
            return {"deviated": False, "reason": "no_baseline"}

        deviations = []
        activity_time = datetime.fromisoformat(new_activity.get("timestamp", ""))
        activity_hour = activity_time.hour
        activity_type = new_activity.get("type", "unknown")

        # Check timing deviation
        expected_hour = baseline["avg_hour"]
        hour_diff = abs(activity_hour - expected_hour)
        if hour_diff > 4:  # More than 4 hours from typical
            deviations.append({
                "type": "timing",
                "severity": "medium",
                "detail": f"Activity at hour {activity_hour}, baseline avg is {expected_hour:.0f}",
            })

        # Check interval deviation
        if new_activity.get("interval_seconds"):
            interval = new_activity["interval_seconds"]
            z_score = abs(interval - baseline["avg_interval"]) / max(baseline["std_interval"], 1)
            if z_score > 3:  # More than 3 standard deviations
                deviations.append({
                    "type": "interval",
                    "severity": "high" if z_score > 5 else "medium",
                    "detail": f"Interval {interval:.0f}s vs baseline {baseline['avg_interval']:.0f}s (z={z_score:.1f})",
                })

        # Check for robotic patterns (exact intervals)
        if new_activity.get("interval_seconds") and baseline.get("std_interval", 999) < 2:
            deviations.append({
                "type": "robotic",
                "severity": "critical",
                "detail": "Exact intervals detected — highly suspicious pattern",
            })

        deviated = len(deviations) > 0
        if deviated:
            alert = {
                "account_id": account_id,
                "timestamp": datetime.utcnow().isoformat(),
                "deviations": deviations,
            }
            self.alerts.append(alert)
            self._alert_on_anomaly(account_id, deviations)

        return {"deviated": deviated, "deviations": deviations}

    def learn_and_adapt(self, account_id: str, new_activities: list[dict]) -> dict:
        """Update baseline with new activity data."""
        baseline = self.baselines.get(account_id)
        if not baseline:
            return {"status": "no_baseline"}

        # Incorporate new data with exponential moving average
        alpha = 0.1  # Learning rate
        for activity in new_activities:
            if "interval_seconds" in activity:
                old_avg = baseline["avg_interval"]
                baseline["avg_interval"] = alpha * activity["interval_seconds"] + (1 - alpha) * old_avg

                if "hour" in activity:
                    old_hour = baseline["avg_hour"]
                    baseline["avg_hour"] = alpha * activity["hour"] + (1 - alpha) * old_hour

        baseline["total_activities"] += len(new_activities)
        logger.info(f"Adapted baseline for {account_id}: new avg_interval={baseline['avg_interval']:.0f}s")
        return baseline

    def _alert_on_anomaly(self, account_id: str, deviations: list[dict]):
        """Notify on detected anomalies."""
        for dev in deviations:
            severity = dev["severity"]
            if severity in ("critical", "high"):
                logger.warning(f"ANOMALY on {account_id}: {dev['detail']}")

    @staticmethod
    def _std(values: list[float]) -> float:
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        return math.sqrt(sum((x - mean) ** 2 for x in values) / (len(values) - 1))

    @staticmethod
    def _variance(values: list[int]) -> float:
        if not values:
            return 0.0
        mean = sum(values) / len(values)
        return sum((x - mean) ** 2 for x in values) / len(values)
