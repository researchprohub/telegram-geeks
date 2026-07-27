"""Comparisons — Cross-campaign and account comparisons."""

from loguru import logger


class ComparisonService:
    """Compare campaigns, accounts, and groups."""

    def compare_campaigns(self, campaigns: list[dict]) -> dict:
        """Side-by-side metrics comparison."""
        comparison = []
        for c in campaigns:
            comparison.append({
                "id": c.get("id"),
                "name": c.get("name"),
                "status": c.get("status"),
                "conversations": c.get("conversations", 0),
                "engagement_score": c.get("engagement_score", 0),
                "conversion_rate": c.get("conversion_rate", 0),
                "roi": c.get("roi", 0),
                "account_health": c.get("account_health", 0),
            })

        # Rankings
        ranked_by_engagement = sorted(comparison, key=lambda x: x["engagement_score"], reverse=True)
        ranked_by_conversion = sorted(comparison, key=lambda x: x["conversion_rate"], reverse=True)

        return {
            "campaigns": comparison,
            "rankings": {
                "by_engagement": [{"id": c["id"], "name": c["name"], "score": c["engagement_score"]} for c in ranked_by_engagement[:5]],
                "by_conversion": [{"id": c["id"], "name": c["name"], "rate": c["conversion_rate"]} for c in ranked_by_conversion[:5]],
            },
        }

    def compare_account_performance(self, accounts: list[dict]) -> dict:
        """Rank accounts by performance metrics."""
        ranked = sorted(accounts, key=lambda a: a.get("trust_score", 0), reverse=True)
        return {
            "accounts": ranked,
            "best_trust": ranked[0] if ranked else None,
            "worst_trust": ranked[-1] if ranked else None,
            "avg_trust": round(sum(a.get("trust_score", 0) for a in accounts) / max(len(accounts), 1), 1),
        }

    def compare_group_engagement(self, groups: list[dict]) -> dict:
        """Rank groups by engagement activity."""
        ranked = sorted(groups, key=lambda g: g.get("activity_score", 0), reverse=True)
        return {
            "groups": ranked,
            "top_group": ranked[0] if ranked else None,
            "avg_activity": round(sum(g.get("activity_score", 0) for g in groups) / max(len(groups), 1), 2),
        }

    def benchmark_against_industry(self, niche: str, metrics: dict) -> dict:
        """Compare campaign metrics against industry benchmarks."""
        benchmarks = {
            "tech": {"avg_engagement": 65, "avg_conversion": 0.08, "avg_roi": 2.5},
            "crypto": {"avg_engagement": 55, "avg_conversion": 0.05, "avg_roi": 1.8},
            "gaming": {"avg_engagement": 70, "avg_conversion": 0.12, "avg_roi": 3.0},
            "business": {"avg_engagement": 50, "avg_conversion": 0.06, "avg_roi": 2.0},
        }
        bench = benchmarks.get(niche, benchmarks["tech"])
        return {
            "niche": niche,
            "your_metrics": metrics,
            "benchmarks": bench,
            "vs_engagement": f"{'+' if metrics.get('engagement_score', 0) > bench['avg_engagement'] else '-'}{abs(metrics.get('engagement_score', 0) - bench['avg_engagement'])}%",
            "vs_conversion": f"{'+' if metrics.get('conversion_rate', 0) > bench['avg_conversion'] else '-'}{abs(metrics.get('conversion_rate', 0) - bench['avg_conversion']) * 100}pp",
        }
