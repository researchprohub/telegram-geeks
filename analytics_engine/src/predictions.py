"""Predictions — ML-powered campaign optimizations."""

from loguru import logger


class PredictionService:
    """Generate predictions for campaign optimization."""

    def predict_account_ban_risk(self, account_id: str, account_data: dict, next_24h_actions: int = 20) -> dict:
        """Predict probability of account ban in next 24 hours."""
        risk_factors = []
        risk_score = 0

        # Daily message ratio
        daily_ratio = account_data.get("daily_messages", 0) / max(account_data.get("daily_limit", 50), 1)
        if daily_ratio > 0.8:
            risk_factors.append({"factor": "high_daily_usage", "weight": 30})
            risk_score += 30
        elif daily_ratio > 0.6:
            risk_factors.append({"factor": "elevated_daily_usage", "weight": 15})
            risk_score += 15

        # Planned actions
        if next_24h_actions > 40:
            risk_factors.append({"factor": "excessive_planned_actions", "weight": 25})
            risk_score += 25

        # Trust score
        trust = account_data.get("trust_score", 50)
        if trust < 30:
            risk_factors.append({"factor": "low_trust", "weight": 20})
            risk_score += 20
        elif trust < 50:
            risk_factors.append({"factor": "below_avg_trust", "weight": 10})
            risk_score += 10

        # Flood wait history
        floods = account_data.get("flood_waits_today", 0)
        risk_score += min(floods * 5, 20)
        if floods > 3:
            risk_factors.append({"factor": "frequent_flood_waits", "weight": floods * 5})

        # Account age
        age = account_data.get("account_age_days", 0)
        if age < 7 and next_24h_actions > 15:
            risk_factors.append({"factor": "new_account_high_activity", "weight": 15})
            risk_score += 15

        risk_level = "critical" if risk_score > 70 else "high" if risk_score > 50 else "medium" if risk_score > 30 else "low"

        return {
            "account_id": account_id,
            "risk_score": min(risk_score, 100),
            "risk_level": risk_level,
            "probability": round(min(risk_score / 100, 1.0), 2),
            "risk_factors": risk_factors,
            "recommendation": "stop" if risk_level == "critical" else "reduce_activity" if risk_level == "high" else "proceed",
        }

    def predict_optimal_send_time(self, campaign_id: str, group_data: dict) -> dict:
        """Predict best time to send messages for maximum engagement."""
        peak_hours = group_data.get("peak_hours", [10, 14, 18, 21])
        activity_score = group_data.get("activity_score", 0.5)

        # Score each potential send time
        time_scores = []
        for hour in range(24):
            score = 0
            if hour in peak_hours:
                score += 50
            # Time of day modifier
            if 9 <= hour <= 22:
                score += 20
            elif 6 <= hour <= 23:
                score += 10
            else:
                score -= 20  # Night hours

            score *= activity_score
            time_scores.append({"hour": hour, "score": round(score, 1)})

        best_times = sorted(time_scores, key=lambda x: x["score"], reverse=True)[:3]
        return {
            "campaign_id": campaign_id,
            "optimal_hours": [t["hour"] for t in best_times],
            "scores": best_times,
            "confidence": round(activity_score, 2),
        }

    def predict_conversion_probability(self, user_data: dict, campaign_id: str) -> float:
        """Predict likelihood a user will convert (join target group)."""
        score = 0.0

        # Engagement signals
        if user_data.get("reactions_count", 0) > 0:
            score += 0.2
        if user_data.get("messages_sent", 0) > 0:
            score += 0.3
        if user_data.get("time_in_group_days", 0) > 7:
            score += 0.15
        if user_data.get("profile_complete", False):
            score += 0.1

        # Negative signals
        if user_data.get("is_bot", False):
            score -= 0.5
        if user_data.get("joined_recently", True):
            score -= 0.1

        return round(max(0.0, min(1.0, score)), 2)

    def forecast_growth(self, campaign_id: str, current_metrics: dict, days_ahead: int = 7) -> dict:
        """Project campaign growth over next N days."""
        current_joins = current_metrics.get("total_joins", 0)
        current_days = current_metrics.get("days_running", 1)
        daily_rate = current_joins / max(current_days, 1)

        # Apply growth curve (decelerating)
        projected = []
        cumulative = current_joins
        for day in range(1, days_ahead + 1):
            decay = 1 - (0.02 * day)  # 2% daily decay
            daily_projection = daily_rate * decay
            cumulative += daily_projection
            projected.append({
                "day": day,
                "projected_joins": round(daily_projection, 1),
                "cumulative_joins": round(cumulative, 1),
            })

        return {
            "campaign_id": campaign_id,
            "days_ahead": days_ahead,
            "current_joins": current_joins,
            "projected_total": round(cumulative, 1),
            "growth_rate": round((cumulative - current_joins) / max(current_joins, 1) * 100, 1),
            "daily_forecast": projected,
        }
