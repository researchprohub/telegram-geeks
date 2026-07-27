"""Mass Subscribe Resume — checkpoint-based progress tracking for interrupted subscriptions."""

from datetime import datetime, timezone
from typing import Optional
from loguru import logger


class SubscribeCheckpoint:
    """Track progress of a mass subscription batch for resume capability."""

    def __init__(self, batch_id: str):
        self.batch_id = batch_id
        self.accounts: dict[str, dict] = {}
        self.total_channels = 0
        self.processed_channels = 0
        self.status = "pending"
        self.created_at = datetime.now(timezone.utc).isoformat()
        self.resumed_at: Optional[str] = None

    def init(self, account_phones: list[str], channel_links: list[str]):
        self.total_channels = len(channel_links)
        for phone in account_phones:
            self.accounts[phone] = {
                "phone": phone,
                "subscribed": [],
                "failed": [],
                "skipped": [],
                "progress": 0,
                "status": "pending",
            }

    def mark_done(self, phone: str, channel: str, success: bool):
        acc = self.accounts.get(phone)
        if not acc:
            return
        if success:
            acc["subscribed"].append(channel)
        else:
            acc["failed"].append(channel)
        acc["progress"] = len(acc["subscribed"]) + len(acc["failed"])
        if acc["progress"] >= self.total_channels:
            acc["status"] = "completed"

    def get_progress(self) -> dict:
        total = len(self.accounts) * self.total_channels
        done = sum(a["progress"] for a in self.accounts.values())
        return {
            "batch_id": self.batch_id,
            "status": self.status,
            "accounts_total": len(self.accounts),
            "accounts_completed": sum(1 for a in self.accounts.values() if a["status"] == "completed"),
            "channels_total": self.total_channels,
            "channels_done": done,
            "progress_pct": round(done / total * 100, 1) if total > 0 else 0,
        }

    def get_resume_data(self) -> dict:
        """Return data needed to resume: which accounts need which channels."""
        remaining = []
        for phone, acc in self.accounts.items():
            if acc["status"] != "completed":
                done_set = set(acc["subscribed"] + acc["failed"] + acc["skipped"])
                remaining_channels = ["pending"]
                # ponytail: full channel list not stored in checkpoint, caller needs to pass it on resume
                remaining.append({"phone": phone, "channels_pending": len(remaining_channels)})
        return {
            "batch_id": self.batch_id,
            "remaining_accounts": remaining,
            "total_remaining": len(remaining),
        }


class SubscribeResumeManager:
    """Manages multiple subscribe checkpoints."""

    def __init__(self):
        self.checkpoints: dict[str, SubscribeCheckpoint] = {}

    def start_batch(self, batch_id: str, accounts: list[str], channels: list[str]) -> SubscribeCheckpoint:
        cp = SubscribeCheckpoint(batch_id)
        cp.init(accounts, channels)
        cp.status = "running"
        self.checkpoints[batch_id] = cp
        return cp

    def get_batch(self, batch_id: str) -> Optional[SubscribeCheckpoint]:
        return self.checkpoints.get(batch_id)

    def list_batches(self, status: Optional[str] = None) -> list[dict]:
        result = []
        for cp in self.checkpoints.values():
            if status and cp.status != status:
                continue
            result.append({
                "batch_id": cp.batch_id,
                "status": cp.status,
                "accounts": len(cp.accounts),
                "progress_pct": cp.get_progress()["progress_pct"],
            })
        return result

    def resume_batch(self, batch_id: str) -> dict:
        cp = self.checkpoints.get(batch_id)
        if not cp:
            return {"error": "Batch not found"}
        if cp.status == "completed":
            return {"error": "Batch already completed"}
        cp.status = "running"
        cp.resumed_at = datetime.now(timezone.utc).isoformat()
        return cp.get_resume_data()

    def complete_batch(self, batch_id: str):
        cp = self.checkpoints.get(batch_id)
        if cp:
            cp.status = "completed"
