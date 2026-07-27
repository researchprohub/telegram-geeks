"""Autoresponder module — Template-based auto-reply with spin syntax (Telegram Expert clone)."""

import re
import random
import asyncio
from datetime import datetime, timezone
from loguru import logger
from pydantic import BaseModel, Field
from typing import Optional


class ReplyTemplate(BaseModel):
    id: str = ""
    trigger_keyword: str = ""
    trigger_regex: str = ""
    response_text: str = ""
    enabled: bool = True
    delay_min: int = 5
    delay_max: int = 30
    max_replies_per_user_per_hour: int = 3
    match_type: str = "keyword"  # keyword, regex, wildcard


class AutoresponderService:
    """Automatically reply to incoming messages based on templates."""

    def __init__(self, client_manager):
        self.client_manager = client_manager
        self.templates: dict[str, list[ReplyTemplate]] = {}  # account_id -> templates
        self.reply_counts: dict[str, list[datetime]] = {}  # user_id -> timestamps

    def add_template(
        self, account_id: str, trigger: str, response: str,
        match_type: str = "keyword", delay_min: int = 5, delay_max: int = 30,
        max_replies: int = 3
    ) -> str:
        """Add an auto-reply template."""
        template_id = f"tpl_{len(self.templates.get(account_id, [])) + 1}"
        template = ReplyTemplate(
            id=template_id,
            trigger_keyword=trigger if match_type == "keyword" else "",
            trigger_regex=trigger if match_type == "regex" else "",
            response_text=response,
            enabled=True,
            delay_min=delay_min,
            delay_max=delay_max,
            max_replies_per_user_per_hour=max_replies,
            match_type=match_type,
        )

        if account_id not in self.templates:
            self.templates[account_id] = []
        self.templates[account_id].append(template)
        logger.info(f"Added template {template_id} for account {account_id}")
        return template_id

    def remove_template(self, account_id: str, template_id: str) -> bool:
        """Remove a template."""
        if account_id in self.templates:
            self.templates[account_id] = [
                t for t in self.templates[account_id] if t.id != template_id
            ]
            logger.info(f"Removed template {template_id}")
            return True
        return False

    def process_message(self, account_id: str, incoming_text: str, user_id: str) -> Optional[str]:
        """Match incoming message against templates and return response."""
        templates = self.templates.get(account_id, [])
        for template in templates:
            if not template.enabled:
                continue

            # Check reply rate limit
            if self._check_rate_limit(user_id, template.max_replies_per_user_per_hour):
                continue

            # Check trigger match
            if not self._matches_trigger(incoming_text, template):
                continue

            # Generate response with spin syntax
            response = self._apply_spin_syntax(template.response_text)

            # Apply random delay
            delay = random.randint(template.delay_min, template.delay_max)
            logger.info(f"Auto-reply triggered for {user_id}: '{incoming_text[:50]}...' -> '{response[:50]}...'")

            # Record reply
            self._record_reply(user_id)

            return response

        return None

    def list_templates(self, account_id: str) -> list[dict]:
        """List all templates for an account."""
        return [
            {
                "id": t.id,
                "trigger": t.trigger_keyword or t.trigger_regex,
                "response": t.response_text[:100],
                "enabled": t.enabled,
                "match_type": t.match_type,
            }
            for t in self.templates.get(account_id, [])
        ]

    def _matches_trigger(self, text: str, template: ReplyTemplate) -> bool:
        """Check if text matches the template trigger."""
        text_lower = text.lower()

        if template.match_type == "keyword":
            return template.trigger_keyword.lower() in text_lower
        elif template.match_type == "regex":
            return bool(re.search(template.trigger_regex, text_lower, re.IGNORECASE))
        elif template.match_type == "wildcard":
            pattern = template.trigger_keyword.lower().replace("*", ".*")
            return bool(re.match(f".*{pattern}.*", text_lower))
        return False

    def _apply_spin_syntax(self, text: str) -> str:
        """Apply spin syntax: {option1|option2|option3}."""
        pattern = r'\{([^}]+)\}'
        def replace(match):
            options = match.group(1).split('|')
            return random.choice(options)
        return re.sub(pattern, replace, text)

    def _check_rate_limit(self, user_id: str, max_replies: int) -> bool:
        """Check if user has exceeded reply rate limit."""
        now = datetime.now(timezone.utc)
        cutoff = now.timestamp() - 3600  # Last hour
        replies = self.reply_counts.get(user_id, [])
        recent = [t for t in replies if t > cutoff]
        return len(recent) >= max_replies

    def _record_reply(self, user_id: str):
        """Record a reply timestamp."""
        now = datetime.now(timezone.utc)
        if user_id not in self.reply_counts:
            self.reply_counts[user_id] = []
        self.reply_counts[user_id].append(now)

    async def start_monitoring(self, account_id: str, chat_ids: list[int]):
        """Start monitoring chats for auto-reply triggers."""
        while True:
            try:
                client = await self.client_manager.get_client(account_id)
                if not client:
                    await asyncio.sleep(30)
                    continue

                for chat_id in chat_ids:
                    messages = await self.client_manager.get_chat_history(account_id, chat_id, limit=10)
                    for msg in messages:
                        if msg and msg.get("from_id"):
                            response = self.process_message(
                                account_id,
                                msg.get("text", ""),
                                str(msg["from_id"]),
                            )
                            if response:
                                delay = random.randint(5, 30)
                                await asyncio.sleep(delay)
                                await self.client_manager.send_message(
                                    account_id, chat_id, response,
                                    reply_to=msg.get("id"),
                                )
            except Exception as e:
                logger.error(f"Autoresponder error: {e}")

            await asyncio.sleep(15)
