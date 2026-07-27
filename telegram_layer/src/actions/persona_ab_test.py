"""A/B Testing for Personas — clone, run variants, declare winner."""

import copy
import random
import statistics
from datetime import datetime, timezone, timedelta
from typing import Optional
from loguru import logger


class PersonaABTest:
    """Run A/B tests comparing two persona variants."""

    def __init__(self, test_id: str, persona_a: dict, persona_b: dict, group_id: str, duration_hours: int = 168):
        self.test_id = test_id
        self.variant_a = {"label": "A", "persona": persona_a}
        self.variant_b = {"label": "B", "persona": persona_b}
        self.group_id = group_id
        self.duration = timedelta(hours=duration_hours)
        self.started_at = datetime.now(timezone.utc)
        self.ends_at = self.started_at + self.duration
        self.status = "running"
        self.metrics_a: list[dict] = []
        self.metrics_b: list[dict] = []
        self.winner: Optional[str] = None

    def record_interaction(self, variant: str, metric: str, value: float = 1.0):
        if self.status != "running":
            return
        target = self.metrics_a if variant == "A" else self.metrics_b
        target.append({"metric": metric, "value": value, "at": datetime.now(timezone.utc).isoformat()})

    def get_scores(self) -> dict:
        def _avg(metrics: list[dict], key: str) -> float:
            vals = [m["value"] for m in metrics if m["metric"] == key]
            return statistics.mean(vals) if vals else 0.0

        return {
            "A": {
                "total_interactions": len(self.metrics_a),
                "avg_reply_rate": _avg(self.metrics_a, "reply"),
                "avg_reaction_rate": _avg(self.metrics_a, "reaction"),
                "engagement_score": _avg(self.metrics_a, "reply") * 0.5 + _avg(self.metrics_a, "reaction") * 0.3 + _avg(self.metrics_a, "depth") * 0.2,
            },
            "B": {
                "total_interactions": len(self.metrics_b),
                "avg_reply_rate": _avg(self.metrics_b, "reply"),
                "avg_reaction_rate": _avg(self.metrics_b, "reaction"),
                "engagement_score": _avg(self.metrics_b, "reply") * 0.5 + _avg(self.metrics_b, "reaction") * 0.3 + _avg(self.metrics_b, "depth") * 0.2,
            },
        }

    def declare_winner(self) -> Optional[str]:
        scores = self.get_scores()
        score_a = scores["A"]["engagement_score"]
        score_b = scores["B"]["engagement_score"]
        if datetime.now(timezone.utc) < self.ends_at and self.status == "running":
            return None
        self.status = "completed"
        if score_a > score_b:
            self.winner = "A"
        elif score_b > score_a:
            self.winner = "B"
        else:
            self.winner = "tie"
        logger.info(f"A/B test {self.test_id} completed: winner = {self.winner} (A={score_a:.2f}, B={score_b:.2f})")
        return self.winner

    def get_report(self) -> dict:
        return {
            "test_id": self.test_id,
            "status": self.status,
            "group_id": self.group_id,
            "started_at": self.started_at.isoformat(),
            "ends_at": self.ends_at.isoformat(),
            "elapsed_hours": (datetime.now(timezone.utc) - self.started_at).total_seconds() / 3600,
            "scores": self.get_scores(),
            "winner": self.winner,
            "variants": {
                "A": self.variant_a["persona"].get("name", "Variant A"),
                "B": self.variant_b["persona"].get("name", "Variant B"),
            },
        }

    def export(self) -> dict:
        return {
            "test_id": self.test_id,
            "persona_a": self.variant_a["persona"],
            "persona_b": self.variant_b["persona"],
            "group_id": self.group_id,
            "duration_hours": self.duration.total_seconds() / 3600,
            "status": self.status,
            "winner": self.winner,
            "metrics_a": self.metrics_a,
            "metrics_b": self.metrics_b,
        }


class ABTestManager:
    """Manages multiple A/B tests."""

    def __init__(self):
        self.tests: dict[str, PersonaABTest] = {}

    def create_test(self, test_id: str, persona_a: dict, persona_b: dict, group_id: str, duration_hours: int = 168) -> PersonaABTest:
        test = PersonaABTest(test_id, persona_a, persona_b, group_id, duration_hours)
        self.tests[test_id] = test
        logger.info(f"A/B test created: {test_id} ({duration_hours}h)")
        return test

    def get_test(self, test_id: str) -> Optional[PersonaABTest]:
        return self.tests.get(test_id)

    def list_tests(self, status: Optional[str] = None) -> list[dict]:
        result = []
        for t in self.tests.values():
            if status and t.status != status:
                continue
            result.append({
                "test_id": t.test_id,
                "status": t.status,
                "group_id": t.group_id,
                "winner": t.winner,
            })
        return result

    def auto_resolve(self) -> list[str]:
        """Declare winners for all overdue tests."""
        resolved = []
        for t in self.tests.values():
            if t.status == "running" and datetime.now(timezone.utc) >= t.ends_at:
                t.declare_winner()
                resolved.append(t.test_id)
        return resolved

    def clone_persona(self, persona: dict, changes: dict) -> dict:
        """Clone a persona with specific changes for A/B testing."""
        cloned = copy.deepcopy(persona)
        _deep_update(cloned, changes)
        return cloned


def _deep_update(d, u):
    for k, v in u.items():
        if isinstance(v, dict) and k in d and isinstance(d[k], dict):
            _deep_update(d[k], v)
        else:
            d[k] = v
