"""Calculator and Reports module (Telegram Expert clone)."""

import json
from datetime import datetime, timezone
from loguru import logger


class CalculatorReportsService:
    """ROI calculator, engagement score, and report generator."""

    @staticmethod
    def calculate_roi(
        messages_sent: int,
        conversions: int,
        cost_per_account: float,
        revenue_per_conversion: float,
        total_accounts: int = 1,
    ) -> dict:
        """Calculate campaign ROI."""
        total_cost = cost_per_account * total_accounts
        total_revenue = conversions * revenue_per_conversion
        profit = total_revenue - total_cost
        roi = (profit / max(total_cost, 1)) * 100
        cost_per_conversion = total_cost / max(conversions, 1)

        return {
            "total_cost": round(total_cost, 2),
            "total_revenue": round(total_revenue, 2),
            "profit": round(profit, 2),
            "roi_percentage": round(roi, 1),
            "cost_per_conversion": round(cost_per_conversion, 2),
            "conversions": conversions,
            "messages_sent": messages_sent,
            "message_to_conversion_ratio": round(conversions / max(messages_sent, 1) * 100, 2),
        }

    @staticmethod
    def calculate_engagement_score(
        total_messages: int,
        total_reactions: int,
        total_views: int,
        unique_participants: int,
        total_members: int,
    ) -> float:
        """Calculate engagement score 0-100."""
        if total_members == 0 or total_views == 0:
            return 0.0

        message_ratio = min(total_messages / max(total_members, 1), 1.0) * 30
        reaction_ratio = min(total_reactions / max(total_views, 1), 1.0) * 30
        participation_ratio = min(unique_participants / max(total_members, 1), 1.0) * 25
        view_depth = min(total_views / max(total_members * 3, 1), 1.0) * 15

        return round(min(100.0, message_ratio + reaction_ratio + participation_ratio + view_depth), 1)

    def generate_report(self, campaign_id: str, date_range: dict, metrics: dict) -> dict:
        """Generate a full campaign report."""
        return {
            "campaign_id": campaign_id,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "date_range": date_range,
            "metrics": metrics,
            "summary": {
                "total_messages": metrics.get("messages_sent", 0),
                "total_reactions": metrics.get("reactions", 0),
                "total_views": metrics.get("views", 0),
                "total_conversions": metrics.get("conversions", 0),
                "engagement_score": metrics.get("engagement_score", 0),
                "roi": metrics.get("roi", 0),
            },
        }

    def generate_summary_report(self, accounts: list[dict], campaigns: list[dict]) -> dict:
        """System-wide summary report."""
        total_accounts = len(accounts)
        active_accounts = sum(1 for a in accounts if a.get("status") == "active")
        banned_accounts = sum(1 for a in accounts if a.get("status") == "banned")
        avg_trust = sum(a.get("trust_score", 0) for a in accounts) / max(total_accounts, 1)

        total_messages = sum(c.get("messages_sent", 0) for c in campaigns)
        total_conversions = sum(c.get("conversions", 0) for c in campaigns)
        total_roi = sum(c.get("roi", 0) for c in campaigns) / max(len(campaigns), 1)

        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "accounts": {
                "total": total_accounts,
                "active": active_accounts,
                "banned": banned_accounts,
                "avg_trust_score": round(avg_trust, 1),
            },
            "campaigns": {
                "total": len(campaigns),
                "total_messages": total_messages,
                "total_conversions": total_conversions,
                "avg_roi": round(total_roi, 1),
            },
            "overall_health": "good" if avg_trust > 60 and banned_accounts / max(total_accounts, 1) < 0.1 else "warning" if avg_trust > 40 else "critical",
        }

    def export_report(self, report: dict, fmt: str = "json") -> str:
        """Export report to specified format."""
        if fmt == "json":
            return json.dumps(report, indent=2, default=str)
        elif fmt == "csv":
            lines = ["metric,value"]
            for key, value in report.items():
                if isinstance(value, (int, float, str)):
                    lines.append(f"{key},{value}")
            return "\n".join(lines)
        elif fmt == "text":
            lines = [f"=== Report ===", f"Generated: {report.get('generated_at', 'N/A')}"]
            for key, value in report.items():
                lines.append(f"  {key}: {value}")
            return "\n".join(lines)
        return json.dumps(report, default=str)

    def generator_reports(
        self,
        accounts: list[dict],
        campaigns: list[dict],
        date_range: dict,
        report_type: str = "full",
    ) -> dict:
        """Generate comprehensive reports.
        
        Args:
            accounts: List of account dicts
            campaigns: List of campaign dicts
            date_range: Date range for report
            report_type: "summary", "detailed", "financial", "engagement"
        """
        logger.info(f"Generating {report_type} report")
        
        if report_type == "summary":
            return self.generate_summary_report(accounts, campaigns)
        elif report_type == "detailed":
            return self._generate_detailed_report(accounts, campaigns, date_range)
        elif report_type == "financial":
            return self._generate_financial_report(campaigns)
        elif report_type == "engagement":
            return self._generate_engagement_report(accounts, campaigns)
        else:
            return self.generate_summary_report(accounts, campaigns)

    def _generate_detailed_report(
        self,
        accounts: list[dict],
        campaigns: list[dict],
        date_range: dict,
    ) -> dict:
        """Generate detailed report with per-account and per-campaign breakdown."""
        report = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "date_range": date_range,
            "report_type": "detailed",
            "accounts_breakdown": [],
            "campaigns_breakdown": [],
            "overall_metrics": {},
        }
        
        # Per-account breakdown
        for account in accounts:
            account_report = {
                "phone": account.get("phone", "unknown"),
                "status": account.get("status", "unknown"),
                "trust_score": account.get("trust_score", 0),
                "messages_sent": account.get("messages_sent", 0),
                "bounces": account.get("bounces", 0),
                "complaints": account.get("complaints", 0),
            }
            report["accounts_breakdown"].append(account_report)
        
        # Per-campaign breakdown
        for campaign in campaigns:
            campaign_report = {
                "id": campaign.get("id", "unknown"),
                "name": campaign.get("name", "unknown"),
                "status": campaign.get("status", "unknown"),
                "messages_sent": campaign.get("messages_sent", 0),
                "conversions": campaign.get("conversions", 0),
                "roi": campaign.get("roi", 0),
                "engagement_score": campaign.get("engagement_score", 0),
            }
            report["campaigns_breakdown"].append(campaign_report)
        
        # Overall metrics
        total_accounts = len(accounts)
        active_accounts = sum(1 for a in accounts if a.get("status") == "active")
        total_messages = sum(c.get("messages_sent", 0) for c in campaigns)
        total_conversions = sum(c.get("conversions", 0) for c in campaigns)
        
        report["overall_metrics"] = {
            "total_accounts": total_accounts,
            "active_accounts": active_accounts,
            "total_campaigns": len(campaigns),
            "total_messages": total_messages,
            "total_conversions": total_conversions,
            "overall_roi": sum(c.get("roi", 0) for c in campaigns) / max(len(campaigns), 1),
        }
        
        return report

    def _generate_financial_report(self, campaigns: list[dict]) -> dict:
        """Generate financial report."""
        total_revenue = sum(c.get("revenue", 0) for c in campaigns)
        total_cost = sum(c.get("cost", 0) for c in campaigns)
        total_profit = total_revenue - total_cost
        
        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "report_type": "financial",
            "revenue": total_revenue,
            "cost": total_cost,
            "profit": total_profit,
            "profit_margin": round((total_profit / max(total_revenue, 1)) * 100, 1),
            "campaigns_analyzed": len(campaigns),
        }

    def _generate_engagement_report(
        self,
        accounts: list[dict],
        campaigns: list[dict],
    ) -> dict:
        """Generate engagement report."""
        total_messages = sum(c.get("messages_sent", 0) for c in campaigns)
        total_reactions = sum(c.get("reactions", 0) for c in campaigns)
        total_views = sum(c.get("views", 0) for c in campaigns)
        total_unique = sum(c.get("unique_participants", 0) for c in campaigns)
        total_members = sum(c.get("total_members", 0) for c in campaigns)
        
        engagement_score = self.calculate_engagement_score(
            total_messages, total_reactions, total_views, total_unique, total_members
        )
        
        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "report_type": "engagement",
            "engagement_score": engagement_score,
            "total_messages": total_messages,
            "total_reactions": total_reactions,
            "total_views": total_views,
            "unique_participants": total_unique,
            "total_members": total_members,
            "accounts_analyzed": len(accounts),
            "campaigns_analyzed": len(campaigns),
        }
