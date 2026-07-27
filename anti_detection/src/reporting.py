"""Safety Reporting — System-wide and per-account reports."""

from datetime import datetime
from loguru import logger


class SafetyReporter:
    """Generate comprehensive safety and compliance reports."""

    def generate_system_safety_report(self, all_accounts: list[dict]) -> dict:
        """Overall system health across all accounts."""
        total = len(all_accounts)
        if total == 0:
            return {"status": "no_accounts"}

        active = sum(1 for a in all_accounts if a.get("status") == "active")
        suspended = sum(1 for a in all_accounts if a.get("status") == "suspended")
        banned = sum(1 for a in all_accounts if a.get("status") == "banned")

        avg_trust = sum(a.get("trust_score", 0) for a in all_accounts) / max(total, 1)
        avg_daily_msgs = sum(a.get("daily_messages", 0) for a in all_accounts) / max(total, 1)

        return {
            "generated_at": datetime.utcnow().isoformat(),
            "total_accounts": total,
            "active": active,
            "suspended": suspended,
            "banned": banned,
            "ban_rate": round(banned / max(total, 1) * 100, 1),
            "avg_trust_score": round(avg_trust, 1),
            "avg_daily_messages": round(avg_daily_msgs, 1),
            "overall_risk": "critical" if banned > total * 0.2 else "high" if banned > total * 0.1 else "medium" if avg_trust < 50 else "low",
        }

    def generate_account_report(self, account_id: str, account_data: dict) -> dict:
        """Per-account safety breakdown."""
        return {
            "account_id": account_id,
            "generated_at": datetime.utcnow().isoformat(),
            "status": account_data.get("status"),
            "trust_score": account_data.get("trust_score", 0),
            "daily_messages": account_data.get("daily_messages", 0),
            "daily_limit": account_data.get("daily_limit", 50),
            "usage_ratio": round(account_data.get("daily_messages", 0) / max(account_data.get("daily_limit", 50), 1) * 100, 1),
            "flood_waits_today": account_data.get("flood_waits", 0),
            "ban_risk": account_data.get("ban_risk", "unknown"),
            "geo_match": account_data.get("geo_match", True),
            "timing_anomaly": account_data.get("timing_anomaly", False),
            "content_diversity": account_data.get("content_diversity", 100),
            "overall_safety": self._calculate_account_safety(account_data),
        }

    def calculate_campaign_risk_score(self, campaign_data: dict) -> int:
        """Campaign-level risk assessment 0-100."""
        score = 0
        accounts = campaign_data.get("accounts", [])
        for acct in accounts:
            score += max(0, 100 - acct.get("trust_score", 50))
            score += acct.get("flood_waits", 0) * 5
            if acct.get("ban_risk") == "high":
                score += 20
            elif acct.get("ban_risk") == "medium":
                score += 10

        avg_score = score / max(len(accounts), 1)
        return min(100, int(avg_score))

    def export_compliance_report(self, campaign_id: str, campaign_data: dict, fmt: str = "json") -> str:
        """Export compliance report."""
        report = {
            "campaign_id": campaign_id,
            "generated_at": datetime.utcnow().isoformat(),
            "total_accounts": len(campaign_data.get("accounts", [])),
            "active_accounts": sum(1 for a in campaign_data.get("accounts", []) if a.get("status") == "active"),
            "banned_accounts": sum(1 for a in campaign_data.get("accounts", []) if a.get("status") == "banned"),
            "total_messages_sent": sum(a.get("total_messages", 0) for a in campaign_data.get("accounts", [])),
            "total_flood_waits": sum(a.get("flood_waits", 0) for a in campaign_data.get("accounts", [])),
            "avg_trust_score": round(
                sum(a.get("trust_score", 0) for a in campaign_data.get("accounts", [])) / max(len(campaign_data.get("accounts", [])), 1), 1
            ),
            "risk_score": self.calculate_campaign_risk_score(campaign_data),
            "compliance_status": "compliant" if self.calculate_campaign_risk_score(campaign_data) < 50 else "at_risk",
        }

        import json
        return json.dumps(report, indent=2)

    def _calculate_account_safety(self, account_data: dict) -> str:
        trust = account_data.get("trust_score", 0)
        flood_waits = account_data.get("flood_waits", 0)
        ban_risk = account_data.get("ban_risk", "unknown")

        if ban_risk == "high" or trust < 20:
            return "critical"
        elif ban_risk == "medium" or trust < 40 or flood_waits > 5:
            return "warning"
        elif trust < 60:
            return "caution"
        return "safe"
