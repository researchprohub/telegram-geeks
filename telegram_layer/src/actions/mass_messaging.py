"""Mass messaging module — All SMS sending methods (Telegram Expert clone)."""

import re
import random
import json
from pathlib import Path
from loguru import logger
from typing import Optional


# ─── Spin Syntax Parser ──────────────────────────────────────

def apply_spin_syntax(text: str) -> str:
    """Parse {option1|option2|option3} and randomly pick one."""
    pattern = r'\{([^}]+)\}'
    def replace(match):
        options = match.group(1).split('|')
        return random.choice(options)
    return re.sub(pattern, replace, text)


def parse_spin_syntax(text: str) -> list[dict]:
    """Parse spin syntax into structured groups."""
    groups = []
    pattern = r'\{([^}]+)\}'
    for match in re.finditer(pattern, text):
        groups.append({
            "start": match.start(),
            "end": match.end(),
            "options": match.group(1).split('|'),
        })
    return groups


# ─── Text Formatting ─────────────────────────────────────────

def format_bold(text: str) -> str:
    return f"**{text}**"

def format_italic(text: str) -> str:
    return f"*{text}*"

def format_strikethrough(text: str) -> str:
    return f"~~{text}~~"

def format_inline_code(text: str) -> str:
    return f"`{text}`"

def format_link(text: str, url: str) -> str:
    return f"[{text}]({url})"

def format_mention(username: str) -> str:
    return f"<a href='tg://user?id={username}'>{username}</a>"


class TextFormatter:
    """Apply formatting and spin syntax to message text."""

    @staticmethod
    def apply(text: str, bold: bool = False, italic: bool = False,
              strikethrough: bool = False, inline_code: bool = False,
              links: list[tuple[str, str]] | None = None) -> str:
        """Apply multiple formatting options."""
        if bold:
            text = format_bold(text)
        if italic:
            text = format_italic(text)
        if strikethrough:
            text = format_strikethrough(text)
        if inline_code:
            text = format_inline_code(text)
        if links:
            for label, url in links:
                text = text.replace(f"[[{label}]]", format_link(label, url))
        return text

    @staticmethod
    def preview(text: str) -> str:
        """Show what the formatted text will look like."""
        # Remove markdown for preview
        preview = text.replace("**", "").replace("*", "").replace("~~", "")
        preview = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', preview)
        return preview


# ─── Style Rewriter ──────────────────────────────────────────

STYLE_TEMPLATES = {
    "casual": ["Hey!", "So,", "Anyway,", "BTW,", "Like,", "You know,"],
    "formal": ["Greetings,", "Furthermore,", "Additionally,", "In conclusion,", "Respectfully,"],
    "friendly": ["Hello friend!", "Great to see you!", "Happy to help!", "Cheers!", "Take care!"],
    "professional": ["Dear colleague,", "Per our discussion,", "Regarding your inquiry,", "Best regards,"],
    "humorous": ["LOL!", "Just kidding!", "Plot twist:", "Spoiler alert:", "Fun fact:"],
    "enthusiastic": ["Amazing!", "Incredible!", "Wow!", "Fantastic!", "Absolutely!"],
}


def rewrite_in_style(text: str, style: str) -> str:
    """Rewrite text in the given style by adjusting opening/closing phrases."""
    starters = STYLE_TEMPLATES.get(style, STYLE_TEMPLATES["casual"])
    if random.random() < 0.3:
        return f"{random.choice(starters)} {text}"
    return text


# ─── Mass Messaging Service ──────────────────────────────────

class MassMessagingService:
    """Mass messaging (SMS) to contacts, databases, numbers, IDs."""

    def __init__(self, client_manager):
        self.client_manager = client_manager

    async def send_to_database(
        self, account_id: str, database_path: str, text: str,
        spin_syntax: bool = True, style: str = "casual",
        silent: bool = False
    ) -> dict:
        """Mass DM to user database file."""
        results = {"sent": 0, "failed": 0, "skipped": 0}
        db_file = Path(database_path)
        if not db_file.exists():
            return {"error": f"Database file not found: {database_path}"}

        # Load database (CSV/JSON/TXT)
        users = self._load_database(db_file)
        total = len(users)

        for i, user in enumerate(users):
            try:
                peer = user.get("username") or user.get("phone") or user.get("user_id")
                if not peer:
                    results["skipped"] += 1
                    continue

                # Apply spin syntax and style
                msg = text
                if spin_syntax:
                    msg = apply_spin_syntax(msg)
                msg = rewrite_in_style(msg, style)

                await self.client_manager.send_message(account_id, peer, msg, silent=silent)
                results["sent"] += 1

                # Anti-detection delay
                await self._delay(results["sent"])

            except Exception as e:
                results["failed"] += 1
                logger.warning(f"Send to {user.get('username', '?')} failed: {e}")

            if i % 10 == 0:
                logger.info(f"Mass DM progress: {results['sent']}/{total}")

        return {"total": total, **results}

    async def send_by_id(
        self, account_id: str, chat_ids: list[int], text: str,
        formatting: bool = True, silent: bool = False
    ) -> dict:
        """Send to specific chat IDs."""
        results = {"sent": 0, "failed": 0}
        for chat_id in chat_ids:
            try:
                msg = text
                if formatting:
                    msg = TextFormatter.apply(msg, bold=True, italic=True)
                await self.client_manager.send_message(account_id, chat_id, msg, silent=silent)
                results["sent"] += 1
                await self._delay(results["sent"])
            except Exception as e:
                results["failed"] += 1
                logger.warning(f"Send to {chat_id} failed: {e}")
        return results

    async def send_by_numbers(
        self, account_id: str, phone_numbers: list[str], text: str,
        silent: bool = False
    ) -> dict:
        """Send to phone numbers."""
        results = {"sent": 0, "failed": 0, "not_found": 0}
        for phone in phone_numbers:
            try:
                # Resolve phone to Telegram user
                from telethon.tl.functions.contacts import ResolveUsernameRequest
                client = await self.client_manager.get_client(account_id)
                if not client:
                    results["failed"] += 1
                    continue

                # Try sending directly (works if user has privacy off)
                await self.client_manager.send_message(account_id, phone, text, silent=silent)
                results["sent"] += 1
                await self._delay(results["sent"])
            except Exception as e:
                results["not_found"] += 1
                logger.warning(f"Number {phone} not found: {e}")
        return results

    async def send_to_contacts(
        self, account_id: str, text: str, style: str = "casual",
        silent: bool = False
    ) -> dict:
        """Send to all contacts of an account."""
        client = await self.client_manager.get_client(account_id)
        if not client:
            return {"error": "Account not connected"}

        results = {"sent": 0, "failed": 0}
        try:
            contacts = await client.get_contacts()
            for contact in contacts:
                if hasattr(contact, 'user_id') and contact.user_id:
                    msg = text
                    msg = apply_spin_syntax(msg)
                    msg = rewrite_in_style(msg, style)
                    await self.client_manager.send_message(
                        account_id, contact.user_id, msg, silent=silent
                    )
                    results["sent"] += 1
                    await self._delay(results["sent"])
        except Exception as e:
            results["error"] = str(e)
            logger.error(f"Send to contacts error: {e}")

        return results

    def _load_database(self, db_file: Path) -> list[dict]:
        """Load database from file."""
        if db_file.suffix == '.json':
            with open(db_file) as f:
                return json.load(f)
        elif db_file.suffix == '.csv':
            import csv
            with open(db_file) as f:
                reader = csv.DictReader(f)
                return list(reader)
        else:
            # TXT: one user per line (user_id, @username, or phone)
            with open(db_file) as f:
                return [{"identifier": line.strip()} for line in f if line.strip()]

    async def _delay(self, count: int):
        """Anti-detection delay."""
        # Longer delays as count increases
        base = 10 + (count * 2)
        delay = base + random.uniform(-5, 15)
        await asyncio.sleep(max(5, delay))

    async def preview_message(self, text: str, spin: bool = True, style: str = "casual") -> dict:
        """Preview a message after spin syntax and style application."""
        msg = text
        if spin:
            msg = apply_spin_syntax(msg)
        msg = rewrite_in_style(msg, style)
        formatted = TextFormatter.apply(msg, bold=True)
        return {
            "original": text,
            "after_spin": apply_spin_syntax(text),
            "with_style": msg,
            "formatted": formatted,
            "preview": TextFormatter.preview(formatted),
        }


import asyncio
