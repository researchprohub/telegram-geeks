"""Postbot Integration — persona-aware posting, scheduling, content templates."""

import asyncio
import random
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from loguru import logger


CONTENT_TEMPLATES = {
    "greeting": [
        "Good morning everyone! ☀️ Hope you're having a great day!",
        "Hey everyone! Just checking in — how's it going?",
        "Hello everyone! Excited to be here!",
    ],
    "discussion": [
        "What do you all think about {topic}? I've been reading about it lately.",
        "Has anyone here tried {topic}? I'd love to hear your experiences.",
        "Quick question for the group — any thoughts on {topic}?",
    ],
    "opinion": [
        "I personally think {topic} is really underrated. Here's why: {reason}",
        "Unpopular opinion: {topic} is actually better than most people realize.",
        "I've been using {topic} for a while now and I have to say — {reason}",
    ],
    "share": [
        "Just found this interesting article about {topic} — thought I'd share!",
        "Check this out! Found something cool related to {topic}: {link}",
        "I came across this today and it reminded me of our discussion about {topic}.",
    ],
    "poll": [
        "Quick poll: Who here prefers {option_a} over {option_b}?",
        "Let's settle this — {option_a} or {option_b}? Drop your answer below!",
        "Curious to know: how many of you use {option_a} vs {option_b}?",
    ],
}


class PostbotService:
    """Create persona-aware posts via @postbot with scheduling and content templates."""

    def __init__(self, client_manager):
        self.client_manager = client_manager
        self.created_posts: List[Dict] = []
        self.scheduled_posts: List[Dict] = []

    async def create_posts(
        self,
        account_phones: List[str],
        text: str = "",
        media_path: Optional[str] = None,
        media_type: str = "none",
        buttons: Optional[List[Dict]] = None,
        buttons_per_row: int = 1,
        link_preview: bool = True,
        delay_range: tuple = (5, 15),
        posts_per_account: tuple = (1, 5),
        thread_count: int = 10,
        groups: Optional[List[str]] = None,
        persona: Optional[str] = None,
    ) -> Dict:
        """Create posts via @postbot.

        Args:
            account_phones: List of account phone numbers
            text: Post text (spintax, {topic}, {reason}, {link} placeholders supported)
            media_path: Path to media file
            media_type: Type of media
            buttons: List of button dicts with 'text' and 'url'
            buttons_per_row: Number of buttons per row
            link_preview: Enable link preview
            delay_range: Min/max delay between posts
            posts_per_account: Min/max posts per account
            thread_count: Number of concurrent accounts
            groups: Target group usernames (if None, posts in postbot chat)
            persona: Persona name for styling
        """
        logger.info(f"Creating posts: {len(account_phones)} accounts, persona={persona}, groups={bool(groups)}")
        results = {
            "status": "completed",
            "accounts_processed": 0,
            "posts_created": 0,
            "post_ids": [],
            "failures": 0,
            "post_details": [],
        }
        clients = {}
        for phone in account_phones:
            client = await self.client_manager.get_client(phone)
            if client:
                clients[phone] = client
        if not clients:
            return {"status": "error", "message": "No active accounts available"}
        semaphore = asyncio.Semaphore(thread_count)
        async def create_from_account(phone: str, client) -> Dict:
            async with semaphore:
                return await self._create_from_single_account(
                    phone, client, text, media_path, media_type,
                    buttons, buttons_per_row, link_preview,
                    delay_range, posts_per_account, groups, persona,
                )
        tasks = [create_from_account(phone, c) for phone, c in clients.items()]
        for task in asyncio.as_completed(tasks):
            result = await task
            results["post_details"].append(result)
            results["accounts_processed"] += 1
            results["posts_created"] += result.get("posts_created", 0)
            results["post_ids"].extend(result.get("post_ids", []))
            results["failures"] += result.get("failures", 0)
        self.created_posts.extend(results["post_details"])
        logger.info(f"Posts created: {results['posts_created']} total")
        return results

    async def _create_from_single_account(
        self,
        phone: str, client, text: str, media_path: Optional[str],
        media_type: str, buttons: Optional[List[Dict]],
        buttons_per_row: int, link_preview: bool,
        delay_range: tuple, posts_per_account: tuple,
        groups: Optional[List[str]], persona: Optional[str],
    ) -> Dict:
        posts_created = 0
        failures = 0
        post_ids = []
        num_posts = random.randint(posts_per_account[0], posts_per_account[1])
        for i in range(num_posts):
            try:
                processed_text = self._apply_spintax(text)
                
                # Fetch dynamic media based on persona configuration
                current_media_path = media_path
                current_media_type = media_type
                if not current_media_path and persona:
                    from telegram_layer.src.actions.persona_manager import orchestrator
                    from telegram_layer.src.actions.media_fetcher import media_fetcher
                    persona_obj = orchestrator.get_persona(persona)
                    if persona_obj:
                        fetched_media = await media_fetcher.fetch_media_for_persona(persona_obj, processed_text)
                        if fetched_media:
                            current_media_path = fetched_media
                            if current_media_type == "none":
                                current_media_type = "photo"
                
                post_id = await self._create_post_via_postbot(
                    client, processed_text, current_media_path, current_media_type,
                    buttons, buttons_per_row, link_preview, groups, persona,
                )
                if post_id:
                    post_ids.append(post_id)
                    posts_created += 1
                    self.created_posts.append({
                        "phone": phone, "post_id": post_id,
                        "text": processed_text[:50],
                        "media_type": media_type,
                        "buttons": len(buttons) if buttons else 0,
                        "groups": groups,
                        "persona": persona,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    })
                delay = random.uniform(delay_range[0], delay_range[1])
                await asyncio.sleep(delay)
            except Exception as e:
                logger.debug(f"Post creation error: {e}")
                failures += 1
        return {"phone": phone, "posts_created": posts_created, "post_ids": post_ids, "failures": failures}

    async def _create_post_via_postbot(
        self, client, text: str, media_path: Optional[str],
        media_type: str, buttons: Optional[List[Dict]],
        buttons_per_row: int, link_preview: bool,
        groups: Optional[List[str]], persona: Optional[str],
    ) -> Optional[str]:
        try:
            target_entities = []
            if groups:
                for g in groups:
                    try:
                        entity = await client.get_entity(g)
                        target_entities.append(entity)
                    except Exception as e:
                        logger.debug(f"Could not resolve group {g}: {e}")
                if not target_entities:
                    logger.warning("No valid groups found, falling back to postbot")
                    target_entities = [await client.get_entity("postbot")]
            else:
                target_entities = [await client.get_entity("postbot")]
            for target in target_entities:
                send_kwargs = {"message": text, "link_preview": link_preview}
                if media_path:
                    send_kwargs["file"] = media_path
                
                if buttons:
                    from telethon.tl.types import (
                        KeyboardButtonURL, InlineKeyboardMarkup, KeyboardButtonRow,
                    )
                    rows = []
                    current_row = []
                    for btn in buttons:
                        current_row.append(KeyboardButtonURL(text=btn["text"], url=btn["url"]))
                        if len(current_row) >= buttons_per_row:
                            rows.append(KeyboardButtonRow(current_row))
                            current_row = []
                    if current_row:
                        rows.append(KeyboardButtonRow(current_row))
                    markup = InlineKeyboardMarkup(rows)
                    send_kwargs["reply_markup"] = markup
                
                await client.send_message(target, **send_kwargs)
            # ponytail: simplistic post ID, replace with parsing postbot's real response if needed
            post_id = f"post_{int(datetime.now(timezone.utc).timestamp())}"
            return post_id
        except Exception as e:
            logger.error(f"Postbot error: {e}")
            return None

    def _apply_spintax(self, text: str) -> str:
        import re
        def replace(match):
            return random.choice(match.group(1).split("|"))
        return re.sub(r'\{([^}]+)\}', replace, text)

    # ─── Content Templates ───────────────────────────────────────

    def render_template(self, template_name: str, **kwargs) -> str:
        """Render a content template with variable substitution."""
        options = CONTENT_TEMPLATES.get(template_name)
        if not options:
            logger.warning(f"Unknown template: {template_name}")
            return ""
        text = random.choice(options)
        return text.format(**kwargs) if kwargs else text

    def list_templates(self) -> dict:
        return {name: len(options) for name, options in CONTENT_TEMPLATES.items()}

    # ─── Scheduling ──────────────────────────────────────────────

    async def schedule_post(
        self,
        account_phones: List[str],
        text: str,
        publish_at: datetime,
        groups: Optional[List[str]] = None,
        media_path: Optional[str] = None,
        buttons: Optional[List[Dict]] = None,
        persona: Optional[str] = None,
    ) -> dict:
        """Schedule a post for future publishing."""
        if publish_at.tzinfo is None:
            publish_at = publish_at.replace(tzinfo=timezone.utc)
        entry = {
            "id": f"sched_{len(self.scheduled_posts) + 1}",
            "account_phones": account_phones,
            "text": text,
            "groups": groups,
            "media_path": media_path,
            "buttons": buttons,
            "persona": persona,
            "publish_at": publish_at.isoformat(),
            "status": "scheduled",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self.scheduled_posts.append(entry)
        logger.info(f"Post scheduled for {publish_at.isoformat()}: {entry['id']}")
        return entry

    async def run_scheduler(self, interval_seconds: int = 60) -> None:
        """Background loop: publish scheduled posts whose time has come."""
        while True:
            now = datetime.now(timezone.utc)
            due = [p for p in self.scheduled_posts
                   if p["status"] == "scheduled"
                   and datetime.fromisoformat(p["publish_at"]) <= now]
            for post in due:
                try:
                    result = await self.create_posts(
                        post["account_phones"], text=post["text"],
                        media_path=post.get("media_path"),
                        buttons=post.get("buttons"),
                        groups=post.get("groups"),
                        persona=post.get("persona"),
                    )
                    post["status"] = "published" if result.get("posts_created", 0) > 0 else "failed"
                    post["result"] = result
                except Exception as e:
                    post["status"] = "failed"
                    post["error"] = str(e)
            await asyncio.sleep(interval_seconds)

    # ─── Query ──────────────────────────────────────────────────

    def get_created_posts(self, limit: int = 100) -> List[Dict]:
        return self.created_posts[-limit:]

    def get_scheduled_posts(self, status: Optional[str] = None) -> List[Dict]:
        if status:
            return [p for p in self.scheduled_posts if p["status"] == status]
        return list(self.scheduled_posts)

    def cancel_scheduled(self, post_id: str) -> bool:
        for p in self.scheduled_posts:
            if p["id"] == post_id and p["status"] == "scheduled":
                p["status"] = "cancelled"
                return True
        return False

    def export_post_ids(self) -> List[str]:
        return [p.get("post_id") for p in self.created_posts if p.get("post_id")]
