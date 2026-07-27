"""Alerts — Condition-based alerting system."""

import asyncio
from datetime import datetime, timezone
from loguru import logger


class AlertRule:
    """Represents a single alert rule."""
    def __init__(self, name: str, condition: str, threshold: float, action: str = "notify"):
        self.name = name
        self.condition = condition  # "ban_risk", "flood_spike", "engagement_drop", etc.
        self.threshold = threshold
        self.action = action  # "notify", "pause", "stop"
        self.enabled = True
        self.last_fired: str | None = None


class AlertService:
    """Condition-based alerting system."""

    def __init__(self):
        self.rules: dict[str, list[AlertRule]] = {}  # campaign_id -> rules
        self.active_alerts: list[dict] = []

    def set_alert_rule(self, campaign_id: str, rule: AlertRule):
        """Create or update an alert rule."""
        if campaign_id not in self.rules:
            self.rules[campaign_id] = []
        # Replace existing rule with same name
        self.rules[campaign_id] = [r for r in self.rules[campaign_id] if r.name != rule.name]
        self.rules[campaign_id].append(rule)
        logger.info(f"Alert rule set: {rule.name} for campaign {campaign_id}")

    def check_alert_conditions(self, campaign_id: str, metrics: dict) -> list[dict]:
        """Evaluate all alert rules against current metrics."""
        fired = []
        for rule in self.rules.get(campaign_id, []):
            if not rule.enabled:
                continue

            current_value = metrics.get(rule.condition, 0)
            if self._evaluate_condition(current_value, rule.condition, rule.threshold):
                alert = {
                    "rule": rule.name,
                    "condition": rule.condition,
                    "current_value": current_value,
                    "threshold": rule.threshold,
                    "fired_at": datetime.now(timezone.utc).isoformat(),
                    "action": rule.action,
                }
                fired.append(alert)
                self.active_alerts.append(alert)
                rule.last_fired = alert["fired_at"]
                logger.warning(f"Alert fired: {rule.name} — {rule.condition}={current_value} >= {rule.threshold}")

                # Execute action
                if rule.action == "pause":
                    self._pause_campaign(campaign_id)
                elif rule.action == "stop":
                    self._stop_campaign(campaign_id)

        return fired

    def get_active_alerts(self, campaign_id: str) -> list[dict]:
        """List current active alerts for a campaign."""
        return [a for a in self.active_alerts if a.get("campaign_id") == campaign_id]

    def _evaluate_condition(self, value: float, condition: str, threshold: float) -> bool:
        """Evaluate if a condition meets its threshold."""
        # Most conditions: value >= threshold triggers alert
        if condition in ("ban_risk", "flood_spike", "engagement_drop", "conversion_spike"):
            return value >= threshold
        # Inverted conditions
        if condition == "trust_score":
            return value <= threshold
        return value >= threshold

    def _pause_campaign(self, campaign_id: str):
        logger.warning(f"Auto-pausing campaign {campaign_id} due to alert")

    def _stop_campaign(self, campaign_id: str):
        logger.critical(f"Auto-stopping campaign {campaign_id} due to alert")

    def fire_alert(self, alert: dict):
        """Manually fire an alert."""
        self.active_alerts.append(alert)
        logger.warning(f"Manual alert fired: {alert.get('rule', 'unknown')}")
