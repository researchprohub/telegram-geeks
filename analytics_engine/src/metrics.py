"""Core metrics calculation for the analytics engine."""

from typing import Optional


class MetricsCalculator:
    """Calculates engagement, conversion, and ROI metrics."""

    @staticmethod
    def engagement_score(
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

    @staticmethod
    def conversion_rate(impressions: int, engagements: int, clicks: int, joins: int) -> float:
        """Calculate conversion rate as percentage."""
        if impressions == 0:
            return 0.0
        return round((joins / impressions) * 100, 2)

    @staticmethod
    def funnel_rates(impressions: int, engagements: int, clicks: int, joins: int) -> dict:
        """Calculate each step of the conversion funnel."""
        return {
            "impression_to_engage": round((engagements / max(impressions, 1)) * 100, 2) if impressions else 0,
            "engage_to_click": round((clicks / max(engagements, 1)) * 100, 2) if engagements else 0,
            "click_to_join": round((joins / max(clicks, 1)) * 100, 2) if clicks else 0,
            "overall": round((joins / max(impressions, 1)) * 100, 2) if impressions else 0,
        }

    @staticmethod
    def roi_calculation(
        total_investment: float,
        conversions: int,
        revenue_per_conversion: float,
    ) -> float:
        """Calculate ROI as a ratio."""
        if total_investment == 0:
            return 0.0
        revenue = conversions * revenue_per_conversion
        return round(((revenue - total_investment) / total_investment) * 100, 2)

    @staticmethod
    def account_health_index(
        trust_score: float,
        daily_messages: int,
        daily_limit: int,
        flood_waits: int,
        ban_risk: str,
    ) -> float:
        """Calculate account health index 0-100."""
        score = trust_score

        # Penalize for approaching daily limit
        usage_ratio = daily_messages / max(daily_limit, 1)
        if usage_ratio > 0.8:
            score -= 20
        elif usage_ratio > 0.6:
            score -= 10

        # Penalize for flood waits
        score -= flood_waits * 5

        # Ban risk penalty
        if ban_risk == "high":
            score -= 30
        elif ban_risk == "medium":
            score -= 15

        return max(0.0, min(100.0, round(score, 1)))

    @staticmethod
    def sentiment_trend(sentiments: list[dict]) -> dict:
        """Calculate sentiment trend from a list of {timestamp, sentiment, score}."""
        if not sentiments:
            return {"positive": 0, "negative": 0, "neutral": 0, "average": 0.0}

        counts = {"positive": 0, "negative": 0, "neutral": 0}
        total_score = 0.0

        for s in sentiments:
            label = s.get("sentiment", "neutral")
            counts[label] = counts.get(label, 0) + 1
            total_score += s.get("score", 0.5)

        n = len(sentiments)
        return {
            "positive": round(counts["positive"] / n * 100, 1),
            "negative": round(counts["negative"] / n * 100, 1),
            "neutral": round(counts["neutral"] / n * 100, 1),
            "average": round(total_score / n, 2),
        }
