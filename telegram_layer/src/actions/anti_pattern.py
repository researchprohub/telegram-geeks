"""Anti-pattern — repetitive behavior detection for safety."""

from collections import defaultdict
from datetime import datetime, timezone
from loguru import logger


class AntiPatternService:
    PATTERNS = {
        "same_message": {"description": "Same message sent multiple times", "threshold": 5},
        "rapid_fire": {"description": "Messages sent too quickly in succession", "threshold": 3, "window_s": 60},
        "copy_paste": {"description": "Identical messages across different chats", "threshold": 3},
        "spam_like": {"description": "Suspicious link frequency", "threshold": 10},
    }

    def __init__(self):
        self.message_log: list[dict] = []
        self.flags: list[dict] = []

    def check_message(self, account_id: str, chat_id: str, text: str) -> dict:
        now = datetime.now(timezone.utc)
        record = {"account_id": account_id, "chat_id": chat_id, "text": text, "ts": now.isoformat()}
        self.message_log.append(record)
        if len(self.message_log) > 10000:
            self.message_log = self.message_log[-5000:]

        flags = []
        recent = [m for m in self.message_log if m["account_id"] == account_id and (now - datetime.fromisoformat(m["ts"])).total_seconds() < 300]

        same = [m for m in recent if m["text"] == text]
        if len(same) >= self.PATTERNS["same_message"]["threshold"]:
            flags.append({"pattern": "same_message", "count": len(same), "severity": "high"})

        recent_60s = [m for m in recent if (now - datetime.fromisoformat(m["ts"])).total_seconds() < 60]
        if len(recent_60s) >= self.PATTERNS["rapid_fire"]["threshold"]:
            flags.append({"pattern": "rapid_fire", "count": len(recent_60s), "severity": "medium"})

        links = [m for m in recent if "http" in m.get("text", "")]
        if len(links) >= self.PATTERNS["spam_like"]["threshold"]:
            flags.append({"pattern": "spam_like", "count": len(links), "severity": "medium"})

        if flags:
            self.flags.append({"account_id": account_id, "flags": flags, "ts": now.isoformat()})

        return {"has_flags": len(flags) > 0, "flags": flags, "message_count_5min": len(recent)}

    def get_account_report(self, account_id: str) -> dict:
        acc_flags = [f for f in self.flags if f["account_id"] == account_id]
        pattern_counts = defaultdict(int)
        for f in acc_flags:
            for flag in f["flags"]:
                pattern_counts[flag["pattern"]] += 1
        return {"account_id": account_id, "total_flags": len(acc_flags), "patterns": dict(pattern_counts)}
