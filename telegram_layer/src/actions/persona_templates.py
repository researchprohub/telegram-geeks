"""Persona Import/Export & Versioning — template exchange format with version history."""

import json
import hashlib
from datetime import datetime, timezone
from typing import Optional
from loguru import logger


TEMPLATE_MARKETPLACE = {
    "tech-enthusiast": {
        "name": "Tech Enthusiast",
        "description": "Passionate about technology, gadgets, and software",
        "version": 1, "category": "professional",
        "identity": {"age": 28, "gender": "male", "nationality": "US", "occupation": "Software Engineer", "bio": "Building the future, one commit at a time"},
        "personality": {"openness": 8, "conscientiousness": 7, "extraversion": 5, "agreeableness": 6, "neuroticism": 3},
        "communication": {"tone": "casual", "verbosity": "medium", "emoji_frequency": "occasional", "typical_phrases": ["interesting approach", "have you tried", "actually"]},
        "knowledge": {"domains": ["programming", "AI", "cybersecurity", "startups"], "expertise_level": "advanced"},
        "behavior": {"posts_per_day_min": 1, "posts_per_day_max": 4, "active_hours": [10, 11, 12, 14, 15, 16, 20, 21, 22], "response_delay_min": 3, "response_delay_max": 20},
        "llm_config": {"provider": "openai", "model": "gpt-4o-mini", "temperature": 0.7},
        "values": ["Innovation", "Efficiency", "Open source"],
        "philosophy": "Technology should make life better",
    },
    "creative-writer": {
        "name": "Creative Writer",
        "description": "Creative storyteller with a flair for words",
        "version": 1, "category": "creative",
        "identity": {"age": 30, "gender": "female", "nationality": "UK", "occupation": "Freelance Writer", "bio": "Words are my paint, stories are my canvas"},
        "personality": {"openness": 9, "conscientiousness": 5, "extraversion": 6, "agreeableness": 7, "neuroticism": 5},
        "communication": {"tone": "friendly", "verbosity": "verbose", "emoji_frequency": "frequent", "typical_phrases": ["that reminds me of", "imagine", "what if"]},
        "knowledge": {"domains": ["literature", "art", "culture", "philosophy"], "expertise_level": "advanced"},
        "behavior": {"posts_per_day_min": 2, "posts_per_day_max": 6, "active_hours": [9, 10, 11, 14, 15, 16, 19, 20, 21], "response_delay_min": 5, "response_delay_max": 30},
        "llm_config": {"provider": "anthropic", "model": "claude-3-haiku", "temperature": 0.8},
        "values": ["Creativity", "Expression", "Empathy"],
        "philosophy": "Every story matters",
    },
    "marketing-pro": {
        "name": "Marketing Pro",
        "description": "Savvy marketer who knows the latest trends",
        "version": 1, "category": "professional",
        "identity": {"age": 32, "gender": "male", "nationality": "US", "occupation": "Digital Marketer", "bio": "Turning clicks into customers"},
        "personality": {"openness": 7, "conscientiousness": 8, "extraversion": 8, "agreeableness": 6, "neuroticism": 4},
        "communication": {"tone": "professional", "verbosity": "medium", "emoji_frequency": "occasional", "typical_phrases": ["great question", "here's what I've seen", "data shows"]},
        "knowledge": {"domains": ["marketing", "SEO", "social media", "analytics", "growth hacking"], "expertise_level": "advanced"},
        "behavior": {"posts_per_day_min": 2, "posts_per_day_max": 5, "active_hours": [8, 9, 10, 11, 12, 13, 14, 15, 16], "response_delay_min": 2, "response_delay_max": 15},
        "llm_config": {"provider": "groq", "model": "llama-3.1-70b-versatile", "temperature": 0.6},
        "values": ["Results", "Growth", "Data-driven"],
        "philosophy": "Test everything, trust data",
    },
    "casual-gamer": {
        "name": "Casual Gamer",
        "description": "Friendly gamer who loves to chat about games",
        "version": 1, "category": "social",
        "identity": {"age": 22, "gender": "male", "nationality": "US", "occupation": "Student", "bio": "Living the no-scope life"},
        "personality": {"openness": 6, "conscientiousness": 4, "extraversion": 7, "agreeableness": 8, "neuroticism": 4},
        "communication": {"tone": "casual", "verbosity": "concise", "emoji_frequency": "frequent", "typical_phrases": ["GG", "nice one", "lol", "fr fr"]},
        "knowledge": {"domains": ["gaming", "esports", "streaming", "tech"], "expertise_level": "intermediate"},
        "behavior": {"posts_per_day_min": 3, "posts_per_day_max": 8, "active_hours": [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], "response_delay_min": 1, "response_delay_max": 10},
        "llm_config": {"provider": "google_gemini", "model": "gemini-1.5-flash", "temperature": 0.8},
        "values": ["Fun", "Community", "Fair play"],
        "philosophy": "It's just a game, have fun",
    },
    "wellness-coach": {
        "name": "Wellness Coach",
        "description": "Supportive wellness and mindfulness advocate",
        "version": 1, "category": "professional",
        "identity": {"age": 35, "gender": "female", "nationality": "CA", "occupation": "Wellness Coach", "bio": "Helping you find your balance"},
        "personality": {"openness": 7, "conscientiousness": 8, "extraversion": 6, "agreeableness": 9, "neuroticism": 2},
        "communication": {"tone": "friendly", "verbosity": "medium", "emoji_frequency": "occasional", "typical_phrases": ["remember to", "how are you feeling", "that's great progress"]},
        "knowledge": {"domains": ["wellness", "meditation", "nutrition", "mental health", "fitness"], "expertise_level": "expert"},
        "behavior": {"posts_per_day_min": 1, "posts_per_day_max": 3, "active_hours": [6, 7, 8, 9, 12, 13, 14, 17, 18, 19], "response_delay_min": 5, "response_delay_max": 30},
        "llm_config": {"provider": "openai", "model": "gpt-4o-mini", "temperature": 0.6},
        "values": ["Health", "Balance", "Compassion"],
        "philosophy": "Small steps lead to big changes",
    },
}


class PersonaSerializer:
    """Serialize/deserialize personas to/from JSON exchange format."""

    EXPORT_VERSION = 1

    @staticmethod
    def export_persona(persona_dict: dict) -> dict:
        return {
            "format_version": PersonaSerializer.EXPORT_VERSION,
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "checksum": hashlib.sha256(json.dumps(persona_dict, sort_keys=True, default=str).encode()).hexdigest()[:16],
            "persona": persona_dict,
        }

    @staticmethod
    def import_persona(data: dict) -> dict:
        if not isinstance(data, dict):
            raise ValueError("Invalid persona data format")
        if "persona" in data and "format_version" in data:
            if data.get("checksum"):
                expected = data["checksum"]
                actual = hashlib.sha256(json.dumps(data["persona"], sort_keys=True, default=str).encode()).hexdigest()[:16]
                if expected != actual:
                    logger.warning(f"Persona checksum mismatch: expected {expected}, got {actual}")
            return data["persona"]
        return data

    @staticmethod
    def validate_persona(data: dict) -> list[str]:
        errors = []
        if not data.get("name"):
            errors.append("Missing required field: name")
        if not data.get("identity") or not isinstance(data["identity"], dict):
            errors.append("Missing or invalid: identity")
        if data.get("llm_config") and "provider" not in data["llm_config"]:
            errors.append("llm_config missing provider")
        return errors


class PersonaVersionHistory:
    """Tracks persona version history for audit and rollback."""

    def __init__(self):
        self._versions: dict[str, list[dict]] = {}

    def snapshot(self, persona_id: str, persona_dict: dict, reason: str = "manual_save"):
        self._versions.setdefault(persona_id, [])
        self._versions[persona_id].append({
            "version": len(self._versions[persona_id]) + 1,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "reason": reason,
            "checksum": hashlib.sha256(json.dumps(persona_dict, sort_keys=True, default=str).encode()).hexdigest()[:16],
            "data": persona_dict,
        })
        if len(self._versions[persona_id]) > 20:
            self._versions[persona_id] = self._versions[persona_id][-20:]

    def get_versions(self, persona_id: str) -> list[dict]:
        return [
            {"version": v["version"], "timestamp": v["timestamp"], "reason": v["reason"], "checksum": v["checksum"]}
            for v in self._versions.get(persona_id, [])
        ]

    def rollback(self, persona_id: str, version: int) -> Optional[dict]:
        versions = self._versions.get(persona_id, [])
        target = next((v for v in versions if v["version"] == version), None)
        if target:
            logger.info(f"Rolled back persona {persona_id} to version {version}")
            return target["data"]
        return None

    def get_current_version(self, persona_id: str) -> int:
        versions = self._versions.get(persona_id, [])
        return versions[-1]["version"] if versions else 1


persona_serializer = PersonaSerializer()
persona_versioning = PersonaVersionHistory()
