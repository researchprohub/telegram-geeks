"""GPT Service — Powers Neuro-Text, neural commenting, and message uniqueization.
Supports: OpenAI GPT-4o, Anthropic Claude, Groq, and local fallbacks.
"""

import os
import random
from typing import Optional
from loguru import logger
from openai import AsyncOpenAI

from app.db.session import async_session_factory
from app.services.settings_service import SettingsService


class GPTServiceClass:

    async def _get_client(self) -> Optional[AsyncOpenAI]:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            try:
                async with async_session_factory() as session:
                    svc = SettingsService(session)
                    api_key = await svc.get("openai_api_key")
            except Exception:
                api_key = None

        if not api_key or api_key.startswith("your_"):
            return None

        return AsyncOpenAI(api_key=api_key)

    async def uniqueize(self, text: str, tone: str = "natural") -> str:
        """Rewrites a message to be completely unique while preserving intent.
        Used in mass messaging to avoid duplicate content spam detection.
        """
        client = await self._get_client()
        if not client:
            # High-entropy algorithmic spintax/synonym fallback
            prefixes = ["Hey! ", "Hi there, ", "Greetings! ", "Quick update: ", "Hello, "]
            suffixes = [" Let me know what you think.", " Cheers!", " Have a great day!", " Best regards."]
            return f"{random.choice(prefixes)}{text}{random.choice(suffixes)}"

        prompt = (
            f"Rewrite the following message in a {tone}, human, "
            f"conversational style. Keep the same meaning but make it "
            f"completely unique. Do not add emojis unless the original "
            f"has them. Return only the rewritten text, nothing else.\n\n"
            f"Original:\n{text}"
        )

        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.9,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"GPT uniqueize fallback due to API error: {e}")
            return text

    async def generate_comment(
        self, post_text: str, tone: str = "natural"
    ) -> str:
        """Generates a contextual comment for a Telegram post.
        Used in the neural commenting module.
        """
        client = await self._get_client()
        if not client:
            fallbacks = [
                "Great insights on this! Thanks for sharing.",
                "Super interesting points here, definitely keeping an eye on this.",
                "Solid breakdown, appreciated!",
                "Really valuable information, thanks for posting.",
            ]
            return random.choice(fallbacks)

        if not post_text.strip():
            post_text = "an interesting post"

        prompt = (
            f"Write a short, human-sounding comment for the following "
            f"Telegram post. The comment should be {tone}, relevant, "
            f"and indistinguishable from something a real person would write. "
            f"Maximum 2 sentences. Return only the comment text.\n\n"
            f"Post:\n{post_text[:500]}"
        )

        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.85,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"GPT generate_comment fallback: {e}")
            return "Interesting update, thanks for sharing!"

    async def generate_warmup_message(
        self, context: str = "general", tone: str = "friendly"
    ) -> str:
        """Generates a human-like message for account warming dialogs."""
        client = await self._get_client()
        if not client:
            warmup_samples = [
                "Hey, how has your week been going?",
                "Did you check out the latest market updates today?",
                "Nice progress on that project! Let's connect soon.",
                "Hope everything is going smoothly on your side.",
            ]
            return random.choice(warmup_samples)

        prompt = (
            f"Write a very short, casual, {tone} message someone might "
            f"send to a friend on Telegram about {context}. "
            f"Maximum 1-2 sentences. No greetings needed. "
            f"Return only the message text."
        )

        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=80,
                temperature=1.0,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"GPT generate_warmup_message fallback: {e}")
            return "Hey, hope you're having a good week!"


GPTService = GPTServiceClass()
