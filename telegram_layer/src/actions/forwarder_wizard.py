"""Forwarder Setup Wizard — step-by-step supergroup forwarding configuration."""

from datetime import datetime, timezone
from typing import Optional
from loguru import logger


class ForwarderWizard:
    """Interactive step-by-step forwarding configuration."""

    STEPS = [
        "welcome",
        "select_source",
        "select_destination",
        "filter_config",
        "schedule_config",
        "review",
    ]

    def __init__(self, client_manager=None):
        self.client_manager = client_manager
        self.sessions: dict[str, dict] = {}

    def start_wizard(self, session_id: str, account_phone: str) -> dict:
        """Initialize a new wizard session."""
        self.sessions[session_id] = {
            "account_phone": account_phone,
            "current_step": "welcome",
            "completed_steps": [],
            "config": {},
            "started_at": datetime.now(timezone.utc).isoformat(),
        }
        return {"session_id": session_id, "step": "welcome", "message": "Welcome to Forwarder Setup! Let's configure message forwarding step by step."}

    def process_step(self, session_id: str, step: str, data: dict) -> dict:
        """Process a wizard step with user input."""
        session = self.sessions.get(session_id)
        if not session:
            return {"error": "Session not found. Start a new wizard."}
        if step != session["current_step"]:
            return {"error": f"Expected step '{session['current_step']}', got '{step}'"}

        validators = {
            "welcome": lambda d: d,
            "select_source": lambda d: {"source_chat_id": d.get("source_chat_id")} if d.get("source_chat_id") else None,
            "select_destination": lambda d: {"destination_chat_id": d.get("destination_chat_id")} if d.get("destination_chat_id") else None,
            "filter_config": lambda d: {
                "keywords_include": d.get("keywords_include", ""),
                "keywords_exclude": d.get("keywords_exclude", ""),
                "media_only": d.get("media_only", False),
                "sender_filter": d.get("sender_filter", ""),
            },
            "schedule_config": lambda d: {
                "active_hours_start": d.get("active_hours_start", 0),
                "active_hours_end": d.get("active_hours_end", 24),
                "delay_min": d.get("delay_min", 5),
                "delay_max": d.get("delay_max", 30),
                "days_of_week": d.get("days_of_week", [0, 1, 2, 3, 4, 5, 6]),
            },
            "review": lambda d: d if d.get("confirm") else None,
        }

        validated = validators.get(step, lambda d: d)(data)
        if validated is None:
            return {"error": f"Invalid input for step '{step}'"}
        session["config"].update(validated)
        session["completed_steps"].append(step)
        step_index = self.Steps.index(step)
        if step_index + 1 < len(self.Steps):
            session["current_step"] = self.Steps[step_index + 1]
        else:
            session["current_step"] = "done"
        return {"session_id": session_id, "step": session["current_step"], "config": session["config"], "completed": session["current_step"] == "done"}

    def get_summary(self, session_id: str) -> dict:
        session = self.sessions.get(session_id)
        if not session:
            return {"error": "Session not found"}
        c = session["config"]
        return {
            "account": session["account_phone"],
            "source_chat": c.get("source_chat_id"),
            "destination_chat": c.get("destination_chat_id"),
            "filters": {
                "keywords_include": c.get("keywords_include", ""),
                "keywords_exclude": c.get("keywords_exclude", ""),
                "media_only": c.get("media_only", False),
            },
            "schedule": {
                "active_hours": f"{c.get('active_hours_start', 0)}:00-{c.get('active_hours_end', 24)}:00",
                "delay_range": f"{c.get('delay_min', 5)}-{c.get('delay_max', 30)}s",
                "days": c.get("days_of_week", list(range(7))),
            },
            "steps_completed": len(session["completed_steps"]),
        }

    def finalize(self, session_id: str) -> dict:
        session = self.sessions.get(session_id)
        if not session or session["current_step"] != "done":
            return {"error": "Wizard not complete"}
        config = session["config"]
        result = {
            "status": "configured",
            "account_phone": session["account_phone"],
            "source_chat_id": config.get("source_chat_id"),
            "destination_chat_id": config.get("destination_chat_id"),
            "filters": {
                "keywords_include": config.get("keywords_include", ""),
                "keywords_exclude": config.get("keywords_exclude", ""),
                "media_only": config.get("media_only", False),
                "sender_filter": config.get("sender_filter", ""),
            },
            "schedule": {
                "active_hours_start": config.get("active_hours_start", 0),
                "active_hours_end": config.get("active_hours_end", 24),
                "delay_min": config.get("delay_min", 5),
                "delay_max": config.get("delay_max", 30),
                "days_of_week": config.get("days_of_week", [0, 1, 2, 3, 4, 5, 6]),
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        # Clear session after finalize
        self.sessions.pop(session_id, None)
        return result

    def cancel_wizard(self, session_id: str) -> bool:
        return bool(self.sessions.pop(session_id, None))
