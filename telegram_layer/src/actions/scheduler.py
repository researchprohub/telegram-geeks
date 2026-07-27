"""Scheduler — periodic task scheduling for campaigns and operations."""

import asyncio
from datetime import datetime, timedelta, timezone
from loguru import logger


class SchedulerService:
    def __init__(self):
        self.tasks: dict[str, dict] = {}
        self.execution_log: list[dict] = []

    def add_task(self, task_id: str, operation: str, module_id: str, params: dict, interval_min: int, max_executions: int = 0) -> dict:
        self.tasks[task_id] = {
            "task_id": task_id,
            "operation": operation,
            "module_id": module_id,
            "params": params,
            "interval_min": interval_min,
            "max_executions": max_executions,
            "execution_count": 0,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "next_run": (datetime.now(timezone.utc) + timedelta(minutes=interval_min)).isoformat(),
        }
        return self.tasks[task_id]

    def remove_task(self, task_id: str) -> dict:
        if task_id in self.tasks:
            self.tasks[task_id]["status"] = "cancelled"
            return {"ok": True}
        return {"ok": False, "error": "not found"}

    def list_tasks(self) -> list:
        return list(self.tasks.values())

    def get_due_tasks(self) -> list:
        now = datetime.now(timezone.utc)
        due = []
        for tid, t in list(self.tasks.items()):
            if t["status"] != "active":
                continue
            if t["max_executions"] > 0 and t["execution_count"] >= t["max_executions"]:
                t["status"] = "completed"
                continue
            next_run = datetime.fromisoformat(t["next_run"])
            if now >= next_run:
                due.append(t)
        return due

    def mark_executed(self, task_id: str):
        t = self.tasks.get(task_id)
        if not t:
            return
        t["execution_count"] += 1
        t["next_run"] = (datetime.now(timezone.utc) + timedelta(minutes=t["interval_min"])).isoformat()
        self.execution_log.append({"task_id": task_id, "ts": datetime.now(timezone.utc).isoformat(), "execution": t["execution_count"]})

    def get_stats(self) -> dict:
        active = sum(1 for t in self.tasks.values() if t["status"] == "active")
        return {"total_tasks": len(self.tasks), "active": active, "total_executions": len(self.execution_log)}
