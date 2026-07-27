"""Spintax Editor + GPT Neuro-Text Engine — Content randomization and AI generation.

Features:
- Spintax parsing and rendering ({option1|option2|option3})
- Nested spintax support
- Variant estimation
- GPT-powered text generation with persona context
- Neuro-commenting on channel posts
- Text formatting (bold, italic, links, mentions)
"""

import re
import random
import asyncio
from typing import Dict, List, Optional, Any
from loguru import logger


class SpintaxEngine:
    """Full spintax parser and renderer with nested support."""

    @staticmethod
    def parse_spintax(text: str) -> List[str]:
        """Parse spintax and return all possible variants."""
        # Find all spintax blocks
        pattern = r'\{([^{}]+(?:\{[^{}]*\}[^{}]*)*)\}'
        matches = list(re.finditer(pattern, text))

        if not matches:
            return [text]

        # Extract options from each match
        all_options = []
        for match in matches:
            options_str = match.group(1)
            # Handle nested braces
            options = SpintaxEngine._split_nested(options_str)
            all_options.append(options)

        # Generate all combinations
        variants = SpintaxEngine._generate_combinations(all_options)
        return variants

    @staticmethod
    def _split_nested(text: str) -> List[str]:
        """Split spintax options handling nested braces."""
        options = []
        depth = 0
        current = []

        for char in text:
            if char == '{':
                depth += 1
                current.append(char)
            elif char == '}':
                depth -= 1
                current.append(char)
            elif char == '|' and depth == 0:
                options.append(''.join(current).strip())
                current = []
            else:
                current.append(char)

        if current:
            options.append(''.join(current).strip())

        return options if options else [text]

    @staticmethod
    def _generate_combinations(option_lists: List[List[str]]) -> List[str]:
        """Generate all combinations from option lists."""
        if not option_lists:
            return [""]

        if len(option_lists) == 1:
            return option_lists[0]

        combinations = []
        for opt in option_lists[0]:
            for rest in SpintaxEngine._generate_combinations(option_lists[1:]):
                combinations.append(opt + rest)

        return combinations

    @staticmethod
    def render_spintax(text: str) -> str:
        """Render spintax by randomly selecting one option from each block."""
        pattern = r'\{([^{}]+)\}'

        def replace_match(match):
            options = match.group(1).split('|')
            return random.choice(options)

        return re.sub(pattern, replace_match, text)

    @staticmethod
    def validate_spintax(text: str) -> Dict[str, Any]:
        """Validate spintax syntax and return errors."""
        errors = []
        depth = 0
        in_block = False

        for i, char in enumerate(text):
            if char == '{':
                depth += 1
                in_block = True
            elif char == '}':
                depth -= 1
                if depth < 0:
                    errors.append(f"Unclosed brace at position {i}")
                in_block = False
            elif char == '|' and not in_block:
                errors.append(f"Pipe outside spintax block at position {i}")

        if depth > 0:
            errors.append(f"Unclosed spintax block ({depth} unclosed)")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "depth": depth,
        }

    @staticmethod
    def estimate_variants(text: str) -> int:
        """Estimate the number of unique variants."""
        pattern = r'\{([^{}]+)\}'
        matches = re.findall(pattern, text)

        if not matches:
            return 1

        total = 1
        for match in matches:
            options = match.split('|')
            total *= len(options)

        return total

    @staticmethod
    def apply_formatting(text: str, bold: bool = False, italic: bool = False,
                         strikethrough: bool = False, inline_code: bool = False,
                         links: Optional[List[tuple]] = None) -> str:
        """Apply Telegram formatting to text."""
        if bold:
            text = f"**{text}**"
        if italic:
            text = f"*{text}*"
        if strikethrough:
            text = f"~~{text}~~"
        if inline_code:
            text = f"`{text}`"
        if links:
            for label, url in links:
                text = text.replace(f"[[{label}]]", f"[{label}]({url})")
        return text

    @staticmethod
    def format_mention(username: str, user_id: Optional[int] = None) -> str:
        """Format a Telegram mention."""
        if user_id:
            return f'<a href="tg://user?id={user_id}">{username}</a>'
        return f'<a href="tg://user?username={username}">{username}</a>'


class GPTContentEngine:
    """GPT-powered content generation with persona context."""

    def __init__(self, ai_engine=None):
        self.ai_engine = ai_engine

    async def generate_message(self, prompt: str, tone: str = "casual",
                                length: str = "medium",
                                persona_context: Optional[Dict] = None) -> str:
        """Generate a message using AI with persona context."""
        system_prompt = f"You are writing in a {tone} tone. Length should be {length}."

        if persona_context:
            personality = persona_context.get("personality", {})
            communication = persona_context.get("communication", {})
            system_prompt += (
                f"\n\nPersona: {persona_context.get('name', 'Anonymous')}, "
                f"{persona_context.get('occupation', '')}. "
                f"Big-5 traits: Openness={personality.get('openness', 5)}, "
                f"Extraversion={personality.get('extraversion', 5)}. "
                f"Tone: {communication.get('tone', 'casual')}. "
                f"Verbosity: {communication.get('verbosity', 'medium')}."
            )

        user_prompt = f"Generate text based on this prompt:\n\n{prompt}\n\nReturn ONLY the generated text, nothing else."

        if self.ai_engine:
            return await self.ai_engine.generate(user_prompt, system=system_prompt, max_tokens=500)
        else:
            # Fallback: simple template-based generation
            return self._fallback_generate(prompt, tone, length)

    async def generate_comment(self, post_content: str, persona_context: Optional[Dict] = None,
                                tone: str = "casual") -> str:
        """Generate a natural comment on a post."""
        prompt = (
            f"Write a natural, engaging comment on this post:\n\n{post_content[:500]}\n\n"
            f"The comment should be conversational, add value, and feel authentic. "
            f"Do NOT sound like AI. Keep it under 280 characters."
        )
        return await self.generate_message(prompt, tone=tone, length="short",
                                            persona_context=persona_context)

    async def generate_reply(self, incoming_message: str, persona_context: Optional[Dict] = None,
                              tone: str = "casual") -> str:
        """Generate an in-character reply to a message."""
        prompt = (
            f"Reply naturally to this message as if you're a real person:\n\n"
            f"'{incoming_message[:300]}'\n\n"
            f"Keep the reply friendly, relevant, and under 200 characters."
        )
        return await self.generate_message(prompt, tone=tone, length="short",
                                            persona_context=persona_context)

    async def rewrite_in_spintax(self, text: str, num_variants: int = 5) -> str:
        """Rewrite text with spintax for maximum variation."""
        words = text.split()
        if len(words) < 3:
            return text

        # Create spin groups for similar words
        spin_groups = []
        for i, word in enumerate(words):
            if i > 0 and i < len(words) - 1:  # Skip first and last
                # Find synonyms (simplified)
                alternatives = self._get_synonyms(word)
                if alternatives:
                    spin_groups.append((i, alternatives))

        # Apply spins
        result_words = words.copy()
        for idx, alternatives in spin_groups:
            result_words[idx] = "{" + "|".join([word] + alternatives) + "}"

        return " ".join(result_words)

    def _get_synonyms(self, word: str) -> List[str]:
        """Get simple synonym replacements (expandable with API)."""
        synonyms = {
            "great": ["awesome", "fantastic", "excellent", "amazing"],
            "good": ["nice", "solid", "decent", "fine"],
            "bad": ["terrible", "awful", "poor", "weak"],
            "important": ["crucial", "essential", "key", "vital"],
            "think": ["believe", "feel", "consider", "reckon"],
            "like": ["love", "enjoy", "appreciate", "prefer"],
            "want": ["need", "wish", "desire", "hope"],
            "get": ["obtain", "acquire", "receive", "grab"],
            "make": ["create", "build", "produce", "craft"],
            "use": ["utilize", "employ", "leverage", "apply"],
        }
        return synonyms.get(word.lower(), [])

    def _fallback_generate(self, prompt: str, tone: str, length: str) -> str:
        """Fallback text generation without AI engine."""
        templates = {
            "casual": [
                f"Hey! Just wanted to share my thoughts on: {prompt[:50]}...",
                f"What do you all think about this? {prompt[:50]}",
                f"Just came across this: {prompt[:50]}. Really interesting stuff!",
            ],
            "professional": [
                f"I'd like to share some insights regarding: {prompt[:50]}",
                f"Based on my experience, {prompt[:50]} is worth considering.",
            ],
            "friendly": [
                f"Hi there! {prompt[:50]} sounds great! 😊",
                f"Love this! {prompt[:50]} is exactly what I was thinking.",
            ],
        }

        tone_templates = templates.get(tone, templates["casual"])
        return random.choice(tone_templates)


class NeuroTextEngine:
    """Combined spintax + GPT content engine for messaging."""

    def __init__(self, ai_engine=None):
        self.spintax = SpintaxEngine()
        self.gpt = GPTContentEngine(ai_engine)

    async def preview_spintax(self, template: str, count: int = 5) -> Dict[str, Any]:
        """Preview multiple spintax variations."""
        variants = []
        for _ in range(count):
            variants.append(self.spintax.render_spintax(template))

        total_possible = self.spintax.estimate_variants(template)

        return {
            "template": template,
            "variants": variants,
            "total_possible_variants": total_possible,
        }

    async def generate_with_spintax(self, prompt: str, tone: str = "casual",
                                     persona_context: Optional[Dict] = None,
                                     spin_count: int = 3) -> Dict[str, Any]:
        """Generate AI text and convert to spintax."""
        # Generate base text
        base_text = await self.gpt.generate_message(prompt, tone=tone,
                                                      persona_context=persona_context)

        # Convert to spintax
        spintax_text = await self.gpt.rewrite_in_spintax(base_text, spin_count)

        # Preview variants
        preview = await self.preview_spintax(spintax_text, count=5)

        return {
            "base_text": base_text,
            "spintax_text": spintax_text,
            "preview": preview,
        }

    async def neuro_comment(self, post_url: str, post_content: str,
                             persona_context: Optional[Dict] = None) -> Dict[str, Any]:
        """Generate a neuro-comment on a post."""
        comment = await self.gpt.generate_comment(post_content, persona_context)

        # Optionally add spintax
        if random.random() < 0.5:
            comment = self.spintax.render_spintax(
                self.gpt._fallback_generate(comment, "casual", "short")
            )

        return {
            "post_url": post_url,
            "comment": comment,
            "persona": persona_context.get("name", "anonymous") if persona_context else None,
        }


# Singleton instance
neuro_engine = NeuroTextEngine()
