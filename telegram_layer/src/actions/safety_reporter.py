"""Safety Reporter — system-wide safety reports and monitoring."""

from datetime import datetime, timezone
from collections import defaultdict
from loguru import logger


class SafetyReporterService:
    def __init__(self):
        self.reports: list[dict] = []
        self.incidents: list[dict] = []

    def record_incident(self, account_id: str, incident_type: str, details: str) -> dict:
        inc = {"account_id": account_id, "type": incident_type, "details": details, "ts": datetime.now(timezone.utc).isoformat()}
        self.incidents.append(inc)
        return inc

    def generate_report(self, scope: str = "all") -> dict:
        now = datetime.now(timezone.utc)
        recent = [i for i in self.incidents if (now - datetime.fromisoformat(i["ts"])).total_seconds() < 86400 * 7]
        by_type = defaultdict(int)
        by_account = defaultdict(int)
        for i in recent:
            by_type[i["type"]] += 1
            by_account[i["account_id"]] += 1
        return {
            "generated_at": now.isoformat(),
            "scope": scope,
            "total_incidents_7d": len(recent),
            "incidents_by_type": dict(by_type),
            "accounts_with_incidents": len(by_account),
            "top_accounts": sorted(by_account.items(), key=lambda x: -x[1])[:5],
            "status": "healthy" if len(recent) < 10 else "warning" if len(recent) < 50 else "critical",
        }
