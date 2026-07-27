"""Cleanup — digital footprint removal for accounts."""

from loguru import logger


class CleanupService:
    def __init__(self):
        self.cleanup_log: list[dict] = []

    def get_cleanup_plan(self, phone: str) -> dict:
        return {
            "phone": phone,
            "steps": [
                {"action": "clear_dialogs", "description": "Delete all private dialogs"},
                {"action": "leave_groups", "description": "Leave all groups"},
                {"action": "unsubscribe_channels", "description": "Unsubscribe from all channels"},
                {"action": "delete_contacts", "description": "Delete all contacts"},
                {"action": "clear_profile", "description": "Reset profile photo, name, bio"},
            ],
            "estimated_time_min": 15,
        }

    async def execute_cleanup(self, phone: str, steps: list[str] | None = None) -> dict:
        all_steps = self.get_cleanup_plan(phone)["steps"]
        performed = []
        for s in all_steps:
            if steps is None or s["action"] in steps:
                performed.append(s["action"])
        record = {"phone": phone, "steps_performed": performed, "ts": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()}
        self.cleanup_log.append(record)
        return {"status": "completed", "phone": phone, "steps_performed": performed, "count": len(performed)}

    def get_history(self, phone: str | None = None) -> list:
        if phone:
            return [r for r in self.cleanup_log if r["phone"] == phone]
        return self.cleanup_log
