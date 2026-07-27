"""Booster module — Account warm-up via smart dialogs (Telegram Expert clone)."""

import asyncio
import random
from datetime import datetime, timezone
from loguru import logger


class BoosterService:
    """Automated account warm-up to increase trust score."""

    WARMUP_SCHEDULE = {
        "read_only": {"msgs": 0, "reactions": 5, "replies": 0, "shares": 0, "min_delay": 300},
        "react": {"msgs": 0, "reactions": 10, "replies": 0, "shares": 0, "min_delay": 120},
        "brief_reply": {"msgs": 3, "reactions": 15, "replies": 2, "shares": 0, "min_delay": 60},
        "reply": {"msgs": 8, "reactions": 20, "replies": 5, "shares": 0, "min_delay": 30},
        "share": {"msgs": 12, "reactions": 25, "replies": 8, "shares": 3, "min_delay": 15},
        "full": {"msgs": 20, "reactions": 40, "replies": 15, "shares": 5, "min_delay": 10},
    }

    REPLY_TEMPLATES = [
        "Interesting take! I hadn't considered that angle.",
        "Great point. Do you have any sources for this?",
        "Totally agree with you on this one 👍",
        "This is really valuable info, thanks for sharing.",
        "Hmm, I'm not sure I completely agree. Here's why...",
        "Nice! We should definitely discuss this more.",
        "Fair point. I've seen similar discussions lately.",
        "That's a solid argument. What about the counter-perspective?",
        "Really insightful observation. Bookmarked for reference.",
        "Couldn't have said it better myself! 💯",
    ]

    def __init__(self, client_manager, ai_engine=None):
        self.client_manager = client_manager
        self.ai_engine = ai_engine
        self.active_warmups: dict[str, dict] = {}  # account_id -> state

    def get_schedule_for_day(self, day: int) -> dict:
        """Get warm-up schedule for a specific day."""
        if day <= 3:
            return self.WARMUP_SCHEDULE["read_only"]
        elif day <= 7:
            return self.WARMUP_SCHEDULE["react"]
        elif day <= 14:
            return self.WARMUP_SCHEDULE["brief_reply"]
        elif day <= 21:
            return self.WARMUP_SCHEDULE["reply"]
        elif day <= 30:
            return self.WARMUP_SCHEDULE["share"]
        else:
            return self.WARMUP_SCHEDULE["full"]

    async def warmup_step(self, phone: str, day: int, target_groups: list[dict]) -> dict:
        """Execute one warm-up step for an account."""
        schedule = self.get_schedule_for_day(day)
        results = {"reactions": 0, "replies": 0, "reads": 0, "errors": 0}

        if not target_groups:
            return results

        # React to messages
        for _ in range(schedule["reactions"]):
            group = random.choice(target_groups)
            try:
                client = await self.client_manager.get_client(phone)
                if not client:
                    results["errors"] += 1
                    continue
                messages = await self.client_manager.get_chat_history(phone, group["chat_id"], limit=10)
                if messages:
                    msg = random.choice(messages)
                    emojis = ["👍", "❤️", "🔥", "👏", "😂", "💯"]
                    emoji = random.choice(emojis)
                    # Try to add reaction
                    try:
                        from telethon.tl.functions.messages import AddReactionRequest
                        await client(AddReactionRequest(group["chat_id"], msg["id"], emoji))
                        results["reactions"] += 1
                    except Exception:
                        results["errors"] += 1
            except Exception as e:
                results["errors"] += 1

            await asyncio.sleep(random.uniform(5, 60))

        # Send brief replies
        for _ in range(schedule["replies"]):
            group = random.choice(target_groups)
            try:
                client = await self.client_manager.get_client(phone)
                if not client:
                    results["errors"] += 1
                    continue
                messages = await self.client_manager.get_chat_history(phone, group["chat_id"], limit=20)
                if messages:
                    msg = random.choice(messages)
                    reply_text = random.choice(self.REPLY_TEMPLATES)
                    await self.client_manager.send_message(
                        phone, group["chat_id"], reply_text, reply_to=msg["id"]
                    )
                    results["replies"] += 1
            except Exception as e:
                results["errors"] += 1

            await asyncio.sleep(random.uniform(30, 300))

        results["reads"] = schedule["msgs"] + schedule["reactions"] + schedule["replies"]
        logger.info(f"Warmup day {day} for {phone}: {results}")
        return results

    async def start_warmup(self, phone: str, target_groups: list[dict], duration_days: int = 30) -> dict:
        """Start the warm-up process for an account."""
        self.active_warmups[phone] = {
            "started_at": datetime.now(timezone.utc).isoformat(),
            "duration_days": duration_days,
            "current_day": 1,
            "target_groups": target_groups,
            "total_steps": 0,
            "successful_steps": 0,
        }

        logger.info(f"Started warm-up for {phone}: {duration_days} days")
        return self.active_warmups[phone]

    async def run_warmup_cycle(self, phone: str) -> dict:
        """Run one warm-up cycle (one day's worth of activity)."""
        state = self.active_warmups.get(phone)
        if not state:
            return {"error": "No warm-up in progress"}

        day = state["current_day"]
        results = await self.warmup_step(phone, day, state["target_groups"])

        state["total_steps"] += 1
        state["successful_steps"] += (results["reactions"] + results["replies"])
        state["current_day"] = min(day + 1, state["duration_days"] + 1)

        is_complete = day >= state["duration_days"]
        if is_complete:
            del self.active_warmups[phone]
            logger.info(f"Warm-up complete for {phone} after {day} days")

        return {**results, "day": day, "is_complete": is_complete}

    def get_progress(self, phone: str) -> dict:
        """Get warm-up progress for an account."""
        state = self.active_warmups.get(phone)
        if not state:
            return {"status": "idle", "progress": 100.0, "current_day": state["duration_days"] if state else 0}

        progress = (state["current_day"] / state["duration_days"]) * 100
        return {
            "status": "running",
            "progress": round(progress, 1),
            "current_day": state["current_day"],
            "total_days": state["duration_days"],
            "started_at": state["started_at"],
            "successful_steps": state["successful_steps"],
        }
