"""Campaign Export — live snapshot with progress data mid-campaign."""

import json
from datetime import datetime, timezone
from typing import Optional
from loguru import logger


class CampaignExporter:
    """Export campaign progress snapshots mid-execution."""

    @staticmethod
    def export_snapshot(campaign: dict, accounts: list[dict], stats: dict) -> dict:
        """Build a mid-campaign progress snapshot."""
        return {
            "snapshot_at": datetime.now(timezone.utc).isoformat(),
            "campaign": {
                "id": campaign.get("id"),
                "name": campaign.get("name", "Unnamed"),
                "type": campaign.get("campaign_type", campaign.get("type", "unknown")),
                "status": campaign.get("status", "unknown"),
                "started_at": campaign.get("started_at"),
                "total_duration_hours": campaign.get("duration_hours", 0),
                "elapsed_hours": stats.get("elapsed_hours", 0),
            },
            "accounts": {
                "total": len(accounts),
                "active": sum(1 for a in accounts if a.get("status") == "active"),
                "completed": sum(1 for a in accounts if a.get("status") == "completed"),
                "failed": sum(1 for a in accounts if a.get("status") == "failed"),
                "paused": sum(1 for a in accounts if a.get("status") == "paused"),
                "list": [{"phone": a.get("phone_number", a.get("phone", "")), "status": a.get("status", "unknown"), "progress": a.get("progress", 0)} for a in accounts],
            },
            "performance": {
                "messages_sent": stats.get("messages_sent", 0),
                "replies_received": stats.get("replies_received", 0),
                "reactions_received": stats.get("reactions_received", 0),
                "unique_conversations": stats.get("unique_conversations", 0),
                "success_rate": round(stats.get("success_rate", 0), 2),
                "avg_response_time_min": round(stats.get("avg_response_time_min", 0), 1),
            },
            "summary": CampaignExporter._build_summary(stats),
        }

    @staticmethod
    def _build_summary(stats: dict) -> str:
        total = stats.get("messages_sent", 0)
        replies = stats.get("replies_received", 0)
        rate = stats.get("success_rate", 0)
        status = "excellent" if rate >= 80 else "good" if rate >= 50 else "needs_attention" if rate >= 20 else "poor"
        return f"Sent {total} messages, received {replies} replies. Success rate: {rate}%. Status: {status}."

    @staticmethod
    def to_json(snapshot: dict, indent: int = 2) -> str:
        return json.dumps(snapshot, indent=indent, default=str)

    @staticmethod
    def to_csv(snapshot: dict) -> str:
        lines = ["account_phone,status,progress"]
        for a in snapshot.get("accounts", {}).get("list", []):
            lines.append(f"{a.get('phone','')},{a.get('status','')},{a.get('progress',0)}")
        return "\n".join(lines)
