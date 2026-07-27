"""Persona Performance Analytics — engagement, conversion, quality metrics per persona."""

from datetime import datetime, timezone, timedelta
from typing import Optional
from loguru import logger


class PersonaAnalyticsTracker:
    """Tracks and computes performance metrics per persona."""

    def __init__(self):
        self._events: dict[str, list[dict]] = {}  # persona_id -> events

    def record_event(self, persona_id: str, event_type: str, group_id: Optional[str] = None, meta: Optional[dict] = None):
        self._events.setdefault(persona_id, [])
        self._events[persona_id].append({
            "event_type": event_type, "group_id": group_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "meta": meta or {},
        })

    def record_post(self, persona_id: str, group_id: str, topic: str, post_length: int):
        self.record_event(persona_id, "post", group_id, {"topic": topic, "length": post_length})

    def record_reply(self, persona_id: str, group_id: str, replied_to: str, reply_length: int):
        self.record_event(persona_id, "reply", group_id, {"replied_to": replied_to, "length": reply_length})

    def record_reaction_received(self, persona_id: str, group_id: str, post_type: str, reaction_type: str):
        self.record_event(persona_id, "reaction_received", group_id, {"post_type": post_type, "reaction": reaction_type})

    def record_reply_received(self, persona_id: str, group_id: str, post_type: str):
        self.record_event(persona_id, "reply_received", group_id, {"post_type": post_type})

    def record_conversion(self, persona_id: str, group_id: str, conversion_type: str):
        self.record_event(persona_id, "conversion", group_id, {"conversion_type": conversion_type})

    def get_metrics(self, persona_id: str, hours: Optional[int] = None) -> dict:
        events = self._events.get(persona_id, [])
        if hours:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
            events = [e for e in events if e["timestamp"] >= cutoff.isoformat()]

        total = len(events)
        posts = sum(1 for e in events if e["event_type"] == "post")
        replies = sum(1 for e in events if e["event_type"] == "reply")
        reactions = sum(1 for e in events if e["event_type"] == "reaction_received")
        reply_received = sum(1 for e in events if e["event_type"] == "reply_received")
        conversions = sum(1 for e in events if e["event_type"] == "conversion")

        engagement_rate = (reactions + reply_received) / max(posts + replies, 1)
        conversion_rate = conversions / max(posts + replies, 1)

        return {
            "persona_id": persona_id,
            "period_hours": hours,
            "total_events": total,
            "posts": posts,
            "replies": replies,
            "reactions_received": reactions,
            "replies_received": reply_received,
            "conversions": conversions,
            "engagement_rate": round(engagement_rate, 3),
            "conversion_rate": round(conversion_rate, 3),
            "avg_daily_activity": round(total / max(hours / 24, 1), 1) if hours else None,
        }

    def get_group_breakdown(self, persona_id: str, hours: Optional[int] = None) -> dict:
        events = self._events.get(persona_id, [])
        if hours:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
            events = [e for e in events if e["timestamp"] >= cutoff.isoformat()]

        groups: dict[str, dict] = {}
        for e in events:
            gid = e.get("group_id", "unknown")
            groups.setdefault(gid, {"posts": 0, "replies": 0, "reactions": 0, "conversions": 0})
            groups[gid][e["event_type"]] = groups[gid].get(e["event_type"], 0) + 1

        return {"persona_id": persona_id, "groups": groups}

    def get_quality_score(self, persona_id: str) -> dict:
        events = self._events.get(persona_id, [])
        if len(events) < 5:
            return {"persona_id": persona_id, "score": 0.5, "confidence": "low", "reason": "Not enough data"}

        metrics = self.get_metrics(persona_id)
        engagement = metrics["engagement_rate"]
        conversion = metrics["conversion_rate"]
        diversity = len(set(e.get("group_id") for e in events if e.get("group_id")))

        score = 0.0
        score += min(engagement * 2, 0.4)
        score += min(conversion * 10, 0.3)
        score += min(diversity * 0.05, 0.2)
        score += 0.1

        return {
            "persona_id": persona_id,
            "score": round(score, 3),
            "engagement_component": round(min(engagement * 2, 0.4), 3),
            "conversion_component": round(min(conversion * 10, 0.3), 3),
            "diversity_component": round(min(diversity * 0.05, 0.2), 3),
            "base_component": 0.1,
            "total_events": len(events),
            "unique_groups": diversity,
        }

    def compare_personas(self, persona_ids: list[str], hours: Optional[int] = None) -> list[dict]:
        return [self.get_metrics(pid, hours) for pid in persona_ids]

    def get_leaderboard(self, hours: Optional[int] = None) -> list[dict]:
        scores = []
        for pid in self._events:
            scores.append(self.get_quality_score(pid))
        return sorted(scores, key=lambda x: x["score"], reverse=True)

    def clear_persona(self, persona_id: str):
        self._events.pop(persona_id, None)


persona_analytics = PersonaAnalyticsTracker()
