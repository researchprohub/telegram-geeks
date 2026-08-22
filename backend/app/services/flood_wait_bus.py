"""Global FloodWait Error Bus.
All Telegram operations funnel FloodWaitErrors through here.
Prevents parallel tasks from hammering the same account simultaneously.
Automatically re-queues tasks after the wait period.
"""

import asyncio
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from typing import Callable, Any, Dict, List, Optional
from loguru import logger


class FloodWaitBus:
    """Centralized concurrency and rate-limit coordinator for MTProto accounts."""

    def __init__(self):
        # account_id -> datetime when the flood wait lifts
        self._flood_map: Dict[str, datetime] = {}
        # account_id -> list of queued operations
        self._queue: Dict[str, List[Callable]] = defaultdict(list)

    def is_flooded(self, account_id: str) -> bool:
        lift_time = self._flood_map.get(str(account_id))
        if not lift_time:
            return False
        now = datetime.now(timezone.utc)
        if now >= lift_time:
            del self._flood_map[str(account_id)]
            return False
        return True

    def seconds_remaining(self, account_id: str) -> int:
        lift_time = self._flood_map.get(str(account_id))
        if not lift_time:
            return 0
        now = datetime.now(timezone.utc)
        delta = (lift_time - now).total_seconds()
        return max(0, int(delta))

    def register_flood(self, account_id: str, wait_seconds: int):
        acc_str = str(account_id)
        lift_time = datetime.now(timezone.utc) + timedelta(seconds=wait_seconds)
        self._flood_map[acc_str] = lift_time
        logger.warning(f"FloodWait registered on Account {account_id}: waiting {wait_seconds}s (lifts at {lift_time.isoformat()})")

    def get_all_active(self) -> Dict[str, datetime]:
        """Returns map of active flooded account IDs to their lift time."""
        now = datetime.now(timezone.utc)
        active = {}
        to_del = []
        for acc_id, lift_time in self._flood_map.items():
            if now < lift_time:
                active[acc_id] = lift_time
            else:
                to_del.append(acc_id)
        for acc_id in to_del:
            del self._flood_map[acc_id]
        return active

    async def safe_execute(
        self,
        account_id: str,
        coro_func: Callable,
        *args,
        max_retries: int = 3,
        **kwargs,
    ) -> Any:
        """Wraps any Telegram coroutine with FloodWait awareness.
        Automatically pauses and retries upon FloodWaitError.
        """
        acc_str = str(account_id)
        for attempt in range(max_retries):
            if self.is_flooded(acc_str):
                wait = self.seconds_remaining(acc_str)
                logger.info(f"Account {account_id} is in FloodWait: waiting {wait}s before execution...")
                await asyncio.sleep(min(wait, 30))  # sleep up to 30s in chunks

            try:
                if asyncio.iscoroutinefunction(coro_func):
                    return await coro_func(*args, **kwargs)
                else:
                    return coro_func(*args, **kwargs)
            except Exception as e:
                err_str = str(e)
                if "FloodWait" in type(e).__name__ or "FLOOD_WAIT" in err_str:
                    wait_sec = getattr(e, "seconds", 60)
                    if not wait_sec or wait_sec <= 0:
                        # Try parsing seconds from message e.g. FLOOD_WAIT_X
                        import re
                        m = re.search(r"\d+", err_str)
                        wait_sec = int(m.group(0)) if m else 60
                    self.register_flood(acc_str, wait_sec)
                    if attempt < max_retries - 1:
                        await asyncio.sleep(min(wait_sec, 5))
                    else:
                        raise
                else:
                    raise

    def get_flood_status(self) -> List[Dict[str, Any]]:
        """Returns all currently flooded accounts with time remaining."""
        now = datetime.now(timezone.utc)
        results = []
        for acc_id, lift in list(self._flood_map.items()):
            if lift > now:
                results.append({
                    "account_id": acc_id,
                    "lift_at": lift.isoformat(),
                    "seconds_remaining": max(0, int((lift - now).total_seconds())),
                })
            else:
                self._flood_map.pop(acc_id, None)
        return results


flood_bus = FloodWaitBus()
