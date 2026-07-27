"""Anomaly Detector — detect behavioral deviations from baseline."""

import statistics
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from typing import Any
from loguru import logger


class AnomalyDetectorService:
    def __init__(self):
        self.baselines: dict[str, dict] = {}
        self.events: list[dict] = []

    def record_event(self, account_id: str, action: str, value: float):
        self.events.append({"account_id": account_id, "action": action, "value": value, "ts": datetime.now(timezone.utc).isoformat()})
        if len(self.events) > 10000:
            self.events = self.events[-5000:]

    def build_baseline(self, account_id: str, hours: int = 24) -> dict:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        acc_events = [e for e in self.events if e["account_id"] == account_id and datetime.fromisoformat(e["ts"]) > cutoff]
        by_action = defaultdict(list)
        for e in acc_events:
            by_action[e["action"]].append(e["value"])
        baseline = {}
        for action, vals in by_action.items():
            if len(vals) >= 3:
                baseline[action] = {"mean": statistics.mean(vals), "stdev": statistics.stdev(vals) if len(vals) > 1 else 0, "count": len(vals)}
        self.baselines[account_id] = baseline
        return baseline

    def check_anomaly(self, account_id: str, action: str, value: float) -> dict:
        baseline = self.baselines.get(account_id, {}).get(action)
        if not baseline:
            return {"is_anomaly": False, "reason": "insufficient_baseline", "z_score": 0}
        z = (value - baseline["mean"]) / baseline["stdev"] if baseline["stdev"] > 0 else 0
        return {"is_anomaly": abs(z) > 3, "z_score": round(z, 2), "mean": round(baseline["mean"], 2), "stdev": round(baseline["stdev"], 2)}

    def get_report(self, account_id: str) -> dict:
        return {
            "account_id": account_id,
            "baseline_actions": len(self.baselines.get(account_id, {})),
            "total_events": len([e for e in self.events if e["account_id"] == account_id]),
        }
