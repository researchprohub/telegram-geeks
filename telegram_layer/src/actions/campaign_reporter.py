"""Campaign Reporter — per-campaign reporting and analytics."""

from datetime import datetime, timezone
from loguru import logger


class CampaignReporterService:
    def __init__(self):
        self.reports: dict[str, list] = {}

    def record_event(self, campaign_id: str, event_type: str, details: dict = {}) -> dict:
        event = {"ts": datetime.now(timezone.utc).isoformat(), "type": event_type, "details": details}
        if campaign_id not in self.reports:
            self.reports[campaign_id] = []
        self.reports[campaign_id].append(event)
        return event

    def generate_report(self, campaign_id: str) -> dict:
        events = self.reports.get(campaign_id, [])
        total = len(events)
        by_type = {}
        for e in events:
            t = e["type"]
            by_type[t] = by_type.get(t, 0) + 1
        return {
            "campaign_id": campaign_id,
            "total_events": total,
            "events_by_type": by_type,
            "first_event": events[0]["ts"] if events else None,
            "last_event": events[-1]["ts"] if events else None,
            "summary": f"{total} events recorded across {len(by_type)} types",
        }

    def compare_campaigns(self, campaign_ids: list[str]) -> dict:
        result = {}
        for cid in campaign_ids:
            events = self.reports.get(cid, [])
            result[cid] = {"total_events": len(events), "types": len(set(e["type"] for e in events))}
        return {"campaigns": result, "comparison": f"Compared {len(campaign_ids)} campaigns"}
