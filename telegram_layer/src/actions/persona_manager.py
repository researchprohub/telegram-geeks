"""AI Persona Manager — 7-Layer Character Architecture for Telegram Engagement."""

import json
import random
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from loguru import logger

# Lazy imports for emotion, roles, group knowledge — avoids circular imports at module level
_emotion_manager = None
_group_knowledge = None


class PersonaLayer:
    """Base class for persona layers."""

    def __init__(self, data: Dict = None):
        self.data = data or {}

    def to_dict(self) -> Dict:
        return self.data

    def update(self, updates: Dict):
        self.data.update(updates)


class IdentityLayer(PersonaLayer):
    """Layer 1: Identity — Who is this persona?"""

    def __init__(self, data: Dict = None):
        super().__init__(data)
        self.name = self.data.get("name", "")
        self.age = self.data.get("age", 25)
        self.gender = self.data.get("gender", "neutral")
        self.nationality = self.data.get("nationality", "US")
        self.occupation = self.data.get("occupation", "Professional")
        self.avatar_url = self.data.get("avatar_url", "")
        self.bio = self.data.get("bio", "")

    def get_description(self) -> str:
        return f"{self.name}, {self.age}yo {self.occupation} from {self.nationality}"


class PersonalityLayer(PersonaLayer):
    """Layer 2: Personality — Big-5 Traits."""

    def __init__(self, data: Dict = None):
        super().__init__(data)
        self.openness = self.data.get("openness", 5)  # 1-10
        self.conscientiousness = self.data.get("conscientiousness", 5)
        self.extraversion = self.data.get("extraversion", 5)
        self.agreeableness = self.data.get("agreeableness", 5)
        self.neuroticism = self.data.get("neuroticism", 3)

    def get_trait_description(self) -> str:
        traits = []
        if self.openness >= 7:
            traits.append("creative and curious")
        if self.extraversion >= 7:
            traits.append("sociable and outgoing")
        if self.agreeableness >= 7:
            traits.append("collaborative and kind")
        if self.conscientiousness >= 7:
            traits.append("organized and reliable")
        if self.neuroticism <= 3:
            traits.append("calm and even-tempered")
        return ", ".join(traits) if traits else "balanced"


class CommunicationLayer(PersonaLayer):
    """Layer 3: Communication — How does this persona speak?"""

    def __init__(self, data: Dict = None):
        super().__init__(data)
        self.tone = self.data.get("tone", "casual")  # casual, formal, friendly, humorous
        self.verbosity = self.data.get("verbosity", "medium")  # concise, medium, verbose
        self.emoji_frequency = self.data.get("emoji_frequency", "occasional")  # none, occasional, frequent
        self.typical_phrases = self.data.get("typical_phrases", [])

    def get_system_prompt(self) -> str:
        parts = [f"Your tone is {self.tone}."]
        parts.append(f"You are {'concise' if self.verbosity == 'concise' else 'detailed' if self.verbosity == 'verbose' else 'moderately detailed'} in your responses.")
        if self.emoji_frequency == "frequent":
            parts.append("Use emojis frequently in your messages.")
        elif self.emoji_frequency == "occasional":
            parts.append("Occasionally use emojis to express emotion.")
        if self.typical_phrases:
            parts.append(f"Common phrases you use: {', '.join(self.typical_phrases[:5])}")
        return " ".join(parts)


class KnowledgeLayer(PersonaLayer):
    """Layer 4: Knowledge — What does this persona know?"""

    def __init__(self, data: Dict = None):
        super().__init__(data)
        self.domains = self.data.get("domains", [])  # e.g., ["marketing", "tech"]
        self.opinion_stances = self.data.get("opinion_stances", {})  # {topic: stance}
        self.expertise_level = self.data.get("expertise_level", "intermediate")

    def get_topic_authority(self, topic: str) -> str:
        for domain in self.domains:
            if topic.lower() in domain.lower():
                return self.expertise_level
        return "general"


class BehaviorLayer(PersonaLayer):
    """Layer 5: Behavior — When and how does this persona engage?"""

    def __init__(self, data: Dict = None):
        super().__init__(data)
        self.posts_per_day_min = self.data.get("posts_per_day_min", 1)
        self.posts_per_day_max = self.data.get("posts_per_day_max", 5)
        self.active_hours = self.data.get("active_hours", list(range(9, 22)))  # 9am-10pm default
        self.response_delay_min = self.data.get("response_delay_min", 5)  # minutes
        self.response_delay_max = self.data.get("response_delay_max", 30)
        self.reaction_probability = self.data.get("reaction_probability", 0.4)  # 0-1
        self.reply_to_replies = self.data.get("reply_to_replies", 0.6)

    def should_post_now(self, current_hour: int) -> bool:
        return current_hour in self.active_hours

    def get_next_post_time(self, last_post: Optional[datetime] = None) -> datetime:
        if last_post:
            delay = timedelta(minutes=random.randint(self.response_delay_min, self.response_delay_max))
            return last_post + delay
        return datetime.now(timezone.utc)

    def should_react(self) -> bool:
        return random.random() < self.reaction_probability

    def should_reply(self) -> bool:
        return random.random() < self.reply_to_replies


class MediaLayer(PersonaLayer):
    """Layer 6: Media — What kind of content does this persona share?"""

    def __init__(self, data: Dict = None):
        super().__init__(data)
        self.media_enabled = self.data.get("media_enabled", True)
        self.image_source = self.data.get("image_source", "none")  # none, ai_gen, google_drive, url, google_sheet, custom_api
        self.ai_image_model = self.data.get("ai_image_model", "dalle3")
        self.ai_image_prompt_template = self.data.get("ai_image_prompt_template", "")
        self.google_drive_folder_id = self.data.get("google_drive_folder_id", "")
        
        # New: Google Sheets Integration
        self.google_sheet_url = self.data.get("google_sheet_url", "")
        self.google_sheet_range = self.data.get("google_sheet_range", "A:A")
        
        # New: Custom API Integration
        self.custom_api_endpoint = self.data.get("custom_api_endpoint", "")
        self.custom_api_method = self.data.get("custom_api_method", "GET")
        self.custom_api_headers = self.data.get("custom_api_headers", {})
        self.custom_api_payload = self.data.get("custom_api_payload", {})
        self.custom_api_response_key = self.data.get("custom_api_response_key", "")
        
        self.post_with_image_frequency = self.data.get("post_with_image_frequency", 0.5)

    def get_image_prompt(self, context: str = "") -> str:
        if self.ai_image_prompt_template:
            return self.ai_image_prompt_template.format(context=context)
        return f"A professional photo related to: {context}"


class RelationshipLayer(PersonaLayer):
    """Layer 7: Relationships — How does this persona relate to others?"""

    def __init__(self, data: Dict = None):
        super().__init__(data)
        self.allies = self.data.get("allies", [])  # persona_ids that agree
        self.rivals = self.data.get("rivals", [])  # persona_ids that debate
        self.mentions_frequency = self.data.get("mentions_frequency", {})


class Persona:
    """Full 7-Layer AI Persona."""

    def __init__(self, data: Dict = None):
        self.id = data.get("id", "")
        self.name = data.get("name", "")
        self.user_id = data.get("user_id", "")
        self.created_at = data.get("created_at", datetime.now(timezone.utc).isoformat())
        self.updated_at = datetime.now(timezone.utc).isoformat()

        # 7 Layers
        self.identity = IdentityLayer(data.get("identity", {}))
        self.personality = PersonalityLayer(data.get("personality", {}))
        self.communication = CommunicationLayer(data.get("communication", {}))
        self.knowledge = KnowledgeLayer(data.get("knowledge", {}))
        self.behavior = BehaviorLayer(data.get("behavior", {}))
        self.media = MediaLayer(data.get("media", {}))
        self.relationships = RelationshipLayer(data.get("relationships", {}))

        # LLM Config
        self.llm_config = data.get("llm_config", {
            "provider": "openai",
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "max_tokens": 200,
        })

        # Soul Prompt (Layer 0)
        self.soul_prompt = data.get("soul_prompt", "")
        self.soul_prompt_data = data.get("soul_prompt_data", {})

        # Group-specific prompts
        self.group_prompts = data.get("group_prompts", {})

        # Versioning
        self.version = data.get("version", 1)
        self.template_source = data.get("template_source")

        # Emotion state (wired to EmotionEngine)
        self.emotion_state = data.get("emotion_state", "neutral")

        # Community role (wired to CommunityRoleManager)
        self.community_role = data.get("community_role", "core")

        # Assignments
        self.account_ids = data.get("account_ids", [])
        self.target_groups = data.get("target_groups", [])
        self.target_channels = data.get("target_channels", [])

    def get_full_system_prompt(self, group_context: Optional[dict] = None) -> str:
        """Generate complete system prompt for LLM.

        Assembles: Soul Prompt (Layer 0) + Group Context + Emotion State + Group Knowledge + Community Role.
        """
        global _emotion_manager, _group_knowledge

        # Build base prompt
        if self.soul_prompt:
            base = self.soul_prompt
            if group_context:
                from telegram_layer.src.actions.soul_prompt import GroupPromptBuilder
                group_prompt_str = GroupPromptBuilder(group_context).build()
                base = f"{base}\n\n{group_prompt_str}"
        else:
            parts = [
                f"You are {self.identity.get_description()}.",
                f"Personality: {self.personality.get_trait_description()}.",
                self.communication.get_system_prompt(),
            ]
            if self.knowledge.domains:
                parts.append(f"Expert in: {', '.join(self.knowledge.domains)}.")
            if self.knowledge.opinion_stances:
                stances = "; ".join([f"{k}: {v}" for k, v in list(self.knowledge.opinion_stances.items())[:5]])
                parts.append(f"Opinions: {stances}.")
            if group_context:
                from telegram_layer.src.actions.soul_prompt import GroupPromptBuilder
                parts.append(GroupPromptBuilder(group_context).build())
            base = " ".join(parts)

        # Append emotion state modifiers
        extras = []
        if _emotion_manager is None:
            from telegram_layer.src.actions.persona_emotions import EmotionManager
            _emotion_manager = EmotionManager()
        engine = _emotion_manager.get_engine(self.id)
        modifiers = engine.get_modifiers()
        if modifiers["emotion"] != "neutral":
            extras.append(f"> Emotion state: {modifiers['label']}")
        if self.communication.emoji_frequency in ("none",) and modifiers["emoji_mod"] < 0.2:
            extras.append("> No emojis in this state.")

        # Append community role behavior
        if self.community_role:
            from telegram_layer.src.actions.persona_emotions import ROLE_BEHAVIOR
            role_cfg = ROLE_BEHAVIOR.get(self.community_role, {})
            if role_cfg:
                extras.append(f"> Community role: {self.community_role} — {role_cfg.get('description', '')}")

        # Append group knowledge (RAG) if group_id available
        group_id = group_context.get("group_id") if group_context else None
        if group_id:
            if _group_knowledge is None:
                from telegram_layer.src.actions.persona_knowledge_base import PersonaKnowledgeBase
                _group_knowledge = PersonaKnowledgeBase()
            ctx = _group_knowledge.get_relevant_context(f"group:{group_id}:{self.id}", 500)
            if ctx:
                extras.append(f"> Group context: {ctx}")

        if extras:
            base = base + "\n\n" + "\n".join(extras)

        return base

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "user_id": self.user_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "identity": self.identity.to_dict(),
            "personality": self.personality.to_dict(),
            "communication": self.communication.to_dict(),
            "knowledge": self.knowledge.to_dict(),
            "behavior": self.behavior.to_dict(),
            "media": self.media.to_dict(),
            "relationships": self.relationships.to_dict(),
            "llm_config": self.llm_config,
            "soul_prompt": self.soul_prompt,
            "soul_prompt_data": self.soul_prompt_data,
            "group_prompts": self.group_prompts,
            "version": self.version,
            "template_source": self.template_source,
            "account_ids": self.account_ids,
            "target_groups": self.target_groups,
            "target_channels": self.target_channels,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> "Persona":
        return cls(data=data)


class PersonaOrchestrator:
    """Orchestrate multiple personas for engagement campaigns."""

    def __init__(self, personas: List[Persona] = None, ai_engine=None):
        self.personas = personas or []
        self.ai_engine = ai_engine
        self.active_campaigns: Dict[str, Dict] = {}  # job_id -> campaign state
        self.post_history: List[Dict] = []  # Recent posts for diversity check

    def add_persona(self, persona: Persona):
        self.personas.append(persona)
        logger.info(f"Added persona: {persona.name}")

    def remove_persona(self, persona_id: str):
        self.personas = [p for p in self.personas if p.id != persona_id]

    def get_persona(self, persona_id: str) -> Optional[Persona]:
        for p in self.personas:
            if p.id == persona_id:
                return p
        return None

    async def generate_post(self, persona: Persona, topic: str,
                             context: Optional[Dict] = None,
                             group_context: Optional[Dict] = None) -> str:
        """Generate a post in persona's voice. Wired: Dual Prompt + Emotion + Group Knowledge + Role."""
        system_prompt = persona.get_full_system_prompt(group_context)
        group_id = group_context.get("group_id") if group_context else ""

        # Emotion processing
        global _emotion_manager
        if _emotion_manager is None:
            from telegram_layer.src.actions.persona_emotions import EmotionManager
            _emotion_manager = EmotionManager()
        engine = _emotion_manager.get_engine(persona.id)
        engine.process_content(topic, group_id)

        if persona.soul_prompt and group_context:
            from telegram_layer.src.actions.soul_prompt import DualPromptMerger
            system_prompt, user_prompt = DualPromptMerger.merge_for_post(
                persona.to_dict(), group_context, topic)
        else:
            user_prompt = (
                f"Write a natural, engaging post about: {topic}\n\n"
                f"Context: {json.dumps(context) if context else 'None'}\n\n"
                f"Rules:\n"
                f"- Stay in character as {persona.identity.name}\n"
                f"- Keep it under 280 characters\n"
                f"- Sound like a real person, NOT AI\n"
                f"- Include relevant emojis if your style allows\n"
                f"- Add value, don't just repeat"
            )

        if self.ai_engine:
            return await self.ai_engine.generate(user_prompt, system=system_prompt,
                                                  max_tokens=300)
        else:
            return self._fallback_post(persona, topic)

    async def generate_reply(self, persona: Persona, incoming_message: str,
                              context: Optional[Dict] = None,
                              group_context: Optional[Dict] = None) -> str:
        """Generate an in-character reply. Wired: Emotion + Group Knowledge + Role."""
        system_prompt = persona.get_full_system_prompt(group_context)
        group_id = group_context.get("group_id") if group_context else ""

        # Emotion processing
        global _emotion_manager
        if _emotion_manager is None:
            from telegram_layer.src.actions.persona_emotions import EmotionManager
            _emotion_manager = EmotionManager()
        engine = _emotion_manager.get_engine(persona.id)
        engine.process_content(incoming_message, group_id)

        if persona.soul_prompt and group_context:
            from telegram_layer.src.actions.soul_prompt import DualPromptMerger
            system_prompt, user_prompt = DualPromptMerger.merge_for_reply(
                persona.to_dict(), group_context, incoming_message)
        else:
            user_prompt = (
                f"Reply naturally to this message as {persona.identity.name}:\n\n"
                f"'{incoming_message[:300]}'\n\n"
                f"Keep it friendly, relevant, and under 200 characters."
            )

        if self.ai_engine:
            return await self.ai_engine.generate(user_prompt, system=system_prompt,
                                                  max_tokens=250)
        else:
            return f"Thanks for sharing! Interesting perspective on this. 🤔"

    async def find_ppi_target(self, persona: Persona) -> Optional[Persona]:
        """Find another persona for PPI interaction. Wired: Community Roles + Relationships."""
        candidates = []
        role_hierarchy = {"leader": 4, "core": 3, "validator": 2, "newcomer": 1, "lurker": 0}

        # Prefer rivals for debate
        for rival_id in persona.relationships.rivals:
            rival = self.get_persona(rival_id)
            if rival and rival.community_role != "lurker":
                candidates.append((rival, "debate"))

        # Then allies for agreement
        for ally_id in persona.relationships.allies:
            ally = self.get_persona(ally_id)
            if ally and ally.community_role != "lurker":
                candidates.append((ally, "agree"))

        if candidates:
            # Prefer higher-role targets for better engagement
            scored = [(c, role_hierarchy.get(c[0].community_role, 0)) for c in candidates]
            scored.sort(key=lambda x: x[1], reverse=True)
            # Weighted random: top 3 or all
            pool = [c for c, s in scored[:3]]
            target, mode = random.choice(pool)
            return {"persona": target, "mode": mode}

        # Fallback: any non-lurker persona
        others = [p for p in self.personas if p.id != persona.id and p.community_role != "lurker"]
        if others:
            return {"persona": random.choice(others), "mode": "neutral"}

        return None

    async def generate_ppi_response(self, from_persona: Persona,
                                     target_persona: Persona,
                                     mode: str,
                                     context_post: str) -> str:
        """Generate PPI response (debate or agreement)."""
        if mode == "debate":
            system_prompt = (
                f"You are {from_persona.identity.name}. "
                f"You disagree with {target_persona.identity.name} on this topic. "
                f"Present a thoughtful counter-argument that sounds natural."
            )
            user_prompt = f"Counter-argue this point: '{context_post[:200]}'"
        else:
            system_prompt = (
                f"You are {from_persona.identity.name}. "
                f"You generally agree with {target_persona.identity.name}. "
                f"Add to the discussion with a supportive but unique perspective."
            )
            user_prompt = f"Add to this discussion: '{context_post[:200]}'"

        if self.ai_engine:
            return await self.ai_engine.generate(user_prompt, system=system_prompt,
                                                  max_tokens=250)
        else:
            return "Interesting point! I see where you're coming from. 🤝"

    def _fallback_post(self, persona: Persona, topic: str) -> str:
        """Fallback post generation without AI engine."""
        templates = {
            "casual": [
                f"Just thinking about {topic}... what do you all think? 🤔",
                f"Hey everyone! Had some thoughts on {topic}. Happy to discuss! 💬",
                f"Quick take on {topic}: it's pretty interesting stuff. Anyone else following this? 📈",
            ],
            "professional": [
                f"Here are my thoughts on {topic}. Would love to hear your perspectives.",
                f"Sharing some insights on {topic} based on my experience.",
            ],
            "friendly": [
                f"Love talking about {topic}! What's your take? 😊",
                f"Just came across something interesting about {topic}! 🌟",
            ],
        }

        tone = persona.communication.tone
        tone_templates = templates.get(tone, templates["casual"])
        return random.choice(tone_templates)

    def check_post_diversity(self, new_post: str, min_variations: int = 3) -> bool:
        """Check if a post is too similar to recent posts."""
        if len(self.post_history) < min_variations:
            return True

        recent = self.post_history[-min_variations:]
        new_words = set(new_post.lower().split())

        for old_post in recent:
            old_words = set(old_post.lower().split())
            overlap = len(new_words & old_words) / max(len(new_words | old_words), 1)
            if overlap > 0.7:  # 70% similarity threshold
                return False

        return True

    def record_post(self, persona_id: str, content: str, target: str):
        """Record a post for diversity checking."""
        self.post_history.append({
            "persona_id": persona_id,
            "content": content,
            "target": target,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        # Keep only last 100 posts
        if len(self.post_history) > 100:
            self.post_history = self.post_history[-100:]


# Singleton instance
orchestrator = PersonaOrchestrator()
