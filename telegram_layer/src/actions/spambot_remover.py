"""SpamBot remover — Remove spam restrictions via Telegram's @SpamBot."""

import asyncio
import random
from loguru import logger


APPEAL_TEMPLATES = [
    {
        "reason": "mistake",
        "text": "I believe my account was blocked by mistake. I was actively communicating with friends and colleagues. Please review my case.",
    },
    {
        "reason": "new_user",
        "text": "I just created this account to keep in touch with my family. I haven't sent any unsolicited messages. Please unblock me.",
    },
    {
        "reason": "mass_message",
        "text": "I sent a message to a few friends at once because I was organizing a surprise party. I understand now that this looks like spam, but it was a one-time thing.",
    },
    {
        "reason": "group_invite",
        "text": "I was added to multiple groups by a friend without my consent. I understand that Telegram may have flagged this activity. I have asked my friend to stop adding me.",
    },
    {
        "reason": "api_usage",
        "text": "I was testing a third-party client to customize my Telegram experience. I didn't realize it would trigger anti-spam measures. I've since deleted that client.",
    },
    {
        "reason": "cleanup",
        "text": "I've cleaned up my account and removed any suspicious activity. I'll follow all Telegram rules moving forward. Please give me another chance.",
    },
]


class SpamBotRemoverService:
    """Remove spam block/freeze restrictions via @SpamBot with multi-strategy appeal system."""

    def __init__(self, client_manager, captcha_solver: str = "2captcha"):
        self.client_manager = client_manager
        self.captcha_solver = captcha_solver

    async def check_spam_status(self, phone: str) -> dict:
        """Check if an account is blocked by SpamBot."""
        client = await self.client_manager.get_client(phone)
        if not client:
            return {"error": "Account not connected"}
        try:
            spam_bot_result = await client.get_users(["spam_bot"])
            if spam_bot_result:
                bot = spam_bot_result[0]
                await client.send_message(bot, "/start")
                await asyncio.sleep(2)
                messages = await client.get_messages(bot, limit=1)
                if messages:
                    text = messages[0].text or ""
                    if "blocked" in text.lower() or "limited" in text.lower():
                        return {"status": "blocked", "message": text}
                    elif "not blocked" in text.lower() or "Congratulations" in text:
                        return {"status": "clean", "message": text}
                    return {"status": "unknown", "message": text}
            return {"status": "unknown", "message": "Could not reach SpamBot"}
        except Exception as e:
            logger.error(f"Check spam status error: {e}")
            return {"error": str(e)}

    async def submit_appeal(self, phone: str, strategy: str = "auto") -> dict:
        """Submit an appeal to SpamBot using a chosen strategy.

        Strategies:
          - mistake: classic "blocked by mistake"
          - new_user: family/contacts only
          - mass_message: one-time group message
          - group_invite: added by friend
          - api_usage: third-party client
          - cleanup: cleaned up, won't repeat
          - auto: picks a random template
          - humanized: slow typing with a follow-up message
          - multi_round: sends start, waits for bot prompt, replies accordingly
        """
        client = await self.client_manager.get_client(phone)
        if not client:
            return {"error": "Account not connected"}
        try:
            spam_bot_result = await client.get_users(["spam_bot"])
            if not spam_bot_result:
                return {"error": "SpamBot not found"}
            bot = spam_bot_result[0]

            if strategy == "auto":
                strategy = random.choice(["mistake", "new_user", "mass_message", "group_invite", "api_usage", "cleanup"])
            if strategy == "humanized":
                return await self._appeal_humanized(client, bot, phone)
            if strategy == "multi_round":
                return await self._appeal_multi_round(client, bot, phone)

            template = next((t for t in APPEAL_TEMPLATES if t["reason"] == strategy), APPEAL_TEMPLATES[0])
            appeal_text = template["text"]
            await client.send_message(bot, appeal_text)
            await asyncio.sleep(random.uniform(3, 6))
            messages = await client.get_messages(bot, limit=1)
            response = messages[0].text if messages else "No response"
            result = {"status": "appeal_sent", "strategy": strategy, "response": response, "phone": phone}
            logger.info(f"Appeal submitted for {phone} (strategy={strategy})")
            return result
        except Exception as e:
            logger.error(f"Submit appeal error: {e}")
            return {"error": str(e)}

    async def _appeal_humanized(self, client, bot, phone: str) -> dict:
        """Send a human-like appeal with typing delays and follow-up."""
        await asyncio.sleep(random.uniform(2, 5))
        template = random.choice(APPEAL_TEMPLATES)
        # Simulate typing by sending word-by-word
        words = template["text"].split()
        chunk_size = random.randint(3, 7)
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i + chunk_size])
            await client.send_message(bot, chunk)
            await asyncio.sleep(random.uniform(1.5, 4.0))
        await asyncio.sleep(random.uniform(3, 8))
        # Send a follow-up
        follow_ups = [
            "Please, I really need my account back.",
            "I promise to follow the rules from now on.",
            "Can you please review my case? Thank you.",
            "This account is important for my work.",
        ]
        await client.send_message(bot, random.choice(follow_ups))
        await asyncio.sleep(3)
        messages = await client.get_messages(bot, limit=1)
        response = messages[0].text if messages else "No response"
        logger.info(f"Humanized appeal submitted for {phone}: {str(response)[:80]}")
        return {"status": "appeal_sent", "strategy": "humanized", "response": response, "phone": phone}

    async def _appeal_multi_round(self, client, bot, phone: str) -> dict:
        """Engage in a multi-round conversation with SpamBot."""
        conversation_log = []
        # Step 1: Start
        await client.send_message(bot, "/start")
        await asyncio.sleep(random.uniform(2, 4))
        reply = await self._get_last_bot_message(client, bot)
        conversation_log.append({"round": "start", "bot": reply})
        # Step 2: Report
        await client.send_message(bot, "/report")
        await asyncio.sleep(random.uniform(2, 4))
        reply = await self._get_last_bot_message(client, bot)
        conversation_log.append({"round": "report", "bot": reply})
        # Step 3: Appeal reason
        template = random.choice(APPEAL_TEMPLATES)
        await client.send_message(bot, template["text"])
        await asyncio.sleep(random.uniform(3, 6))
        reply = await self._get_last_bot_message(client, bot)
        conversation_log.append({"round": "reason", "bot": reply})
        # Step 4: Final plea if still restricted
        plea = "I understand. I'll be more careful. Please restore my account."
        await client.send_message(bot, plea)
        await asyncio.sleep(3)
        reply = await self._get_last_bot_message(client, bot)
        conversation_log.append({"round": "plea", "bot": reply})
        logger.info(f"Multi-round appeal completed for {phone}: {len(conversation_log)} rounds")
        return {"status": "appeal_completed", "strategy": "multi_round", "conversation": conversation_log, "phone": phone}

    async def _get_last_bot_message(self, client, bot) -> str:
        """Fetch the most recent message from SpamBot."""
        try:
            messages = await client.get_messages(bot, limit=1)
            return messages[0].text if messages else ""
        except Exception:
            return ""

    async def solve_captcha(self, phone: str, captcha_url: str) -> str:
        """Solve captcha via 2captcha or other solver."""
        import aiohttp
        if self.captcha_solver == "2captcha":
            api_key = None
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://2captcha.com/in.php",
                    params={"key": api_key, "method": "base64", "body": captcha_url},
                ) as resp:
                    data = await resp.text()
                    task_id = data.split("|")[1] if "|" in data else ""
                for _ in range(60):
                    await asyncio.sleep(5)
                    async with session.get(
                        "https://2captcha.com/res.php",
                        params={"key": api_key, "action": "get", "id": task_id},
                    ) as resp:
                        result = await resp.text()
                        if result.startswith("OK|"):
                            return result.split("|")[1]
            return "TIMEOUT"
        return "UNSOLVED"

    async def remove_restrictions(self, phone: str, strategy: str = "auto", max_attempts: int = 3) -> dict:
        """Complete flow: check status → submit appeal (with retries) → verify.

        Tries different strategies on each retry for higher success rates.
        """
        status = await self.check_spam_status(phone)
        if status.get("status") == "clean":
            return {"status": "already_clean", "message": "Account is not blocked"}
        history = []
        for attempt in range(max_attempts):
            logger.info(f"Restriction removal attempt {attempt + 1}/{max_attempts} for {phone}")
            if strategy == "auto":
                attempt_strategies = ["mistake", "humanized", "new_user", "multi_round", "mass_message", "cleanup"]
                chosen = attempt_strategies[attempt % len(attempt_strategies)]
            else:
                chosen = strategy
            appeal = await self.submit_appeal(phone, strategy=chosen)
            history.append({"attempt": attempt + 1, "strategy": chosen, "response": str(appeal.get("response", ""))[:100]})
            await asyncio.sleep(30)
            new_check = await self.check_spam_status(phone)
            history[-1]["result"] = new_check.get("status")
            if new_check.get("status") == "clean":
                logger.success(f"Restrictions removed for {phone} after {attempt + 1} attempts")
                return {"status": "removed", "phone": phone, "attempts": attempt + 1, "history": history}
            cooloff = random.randint(60, 180)
            logger.info(f"Still restricted, cooloff {cooloff}s before retry {attempt + 2}")
            await asyncio.sleep(cooloff)
        return {"status": "failed", "phone": phone, "max_attempts": max_attempts, "history": history}

    async def batch_remove_restrictions(self, phones: list[str], max_workers: int = 3) -> list[dict]:
        """Run remove_restrictions across multiple accounts concurrently."""
        sem = asyncio.Semaphore(max_workers)
        async def _worker(phone: str) -> dict:
            async with sem:
                return await self.remove_restrictions(phone)
        return await asyncio.gather(*[_worker(p) for p in phones])
