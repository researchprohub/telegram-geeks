"""Persona Emotion States — state machine with auto-triggers + Community Roles."""

import random
from datetime import datetime, timezone
from typing import Optional
from loguru import logger

# ─── Emotion State Machine ─────────────────────────────────────

EMOTION_STATES = {
    "neutral":     {"label": "Neutral",     "description": "Default behavior", "frequency_mod": 1.0, "emoji_mod": 0.3, "length_mod": 1.0},
    "excited":     {"label": "Excited",     "description": "More frequent, enthusiastic, higher emoji", "frequency_mod": 1.5, "emoji_mod": 0.7, "length_mod": 0.8},
    "analytical":  {"label": "Analytical",  "description": "Longer posts, more data, less humor", "frequency_mod": 0.8, "emoji_mod": 0.1, "length_mod": 1.4},
    "cautious":    {"label": "Cautious",    "description": "Less frequent, hedged language", "frequency_mod": 0.5, "emoji_mod": 0.2, "length_mod": 0.7},
    "combative":   {"label": "Combative",   "description": "Challenges more, debates rivals", "frequency_mod": 1.3, "emoji_mod": 0.2, "length_mod": 1.2},
    "inspired":    {"label": "Inspired",    "description": "Creative, more original ideas", "frequency_mod": 1.2, "emoji_mod": 0.5, "length_mod": 1.1},
    "skeptical":   {"label": "Skeptical",   "description": "Questions everything, data-driven rebuttals", "frequency_mod": 1.1, "emoji_mod": 0.1, "length_mod": 1.3},
}

AUTO_TRIGGERS = {
    "excited":    {"keywords": ["bullish", "moon", "pump", "amazing", "breakthrough", "launch"], "min_activity": 50},
    "analytical": {"keywords": ["market", "price", "analysis", "chart", "data", "report", "statistics"], "min_activity": 0},
    "cautious":   {"keywords": ["flood", "limit", "restriction", "block", "ban", "spam"], "min_activity": 0},
    "combative":  {"keywords": ["rival", "disagree", "wrong", "debate", "actually", "false"], "min_activity": 0},
    "skeptical":  {"keywords": ["guaranteed", "100%", "risk-free", "scam", "fake"], "min_activity": 0},
}

COMMUNITY_ROLES = ["leader", "core", "newcomer", "lurker", "validator"]

ROLE_BEHAVIOR = {
    "leader":    {"initiate_posts": True,  "reply_rate": 0.8, "post_frequency": 1.0, "react_frequency": 0.4, "description": "Posts most, initiates discussions"},
    "core":      {"initiate_posts": True,  "reply_rate": 0.6, "post_frequency": 0.6, "react_frequency": 0.5, "description": "Regulars who debate and reply"},
    "newcomer":  {"initiate_posts": False, "reply_rate": 0.2, "post_frequency": 0.2, "react_frequency": 0.3, "description": "Ask questions, shorter posts, auto warm-up"},
    "lurker":    {"initiate_posts": False, "reply_rate": 0.0, "post_frequency": 0.0, "react_frequency": 0.8, "description": "Reactions only — social proof"},
    "validator": {"initiate_posts": False, "reply_rate": 0.7, "post_frequency": 0.0, "react_frequency": 0.6, "description": "Agree and amplify core members, never initiate"},
}


class EmotionEngine:
    """Persona emotion state machine with auto-triggers."""

    def __init__(self, persona_id: str):
        self.persona_id = persona_id
        self.current_state = "neutral"
        self.previous_state = "neutral"
        self.transitioned_at = datetime.now(timezone.utc).isoformat()
        self.state_history: list[dict] = []
        self._trigger_counters: dict[str, int] = {}
        self.group_activity: dict[str, int] = {}

    def get_modifiers(self) -> dict:
        """Return frequency/emoji/length modifiers for current state."""
        state = EMOTION_STATES.get(self.current_state, EMOTION_STATES["neutral"])
        return {
            "emotion": self.current_state,
            "frequency_mod": state["frequency_mod"],
            "emoji_mod": state["emoji_mod"],
            "length_mod": state["length_mod"],
            "label": state["label"],
        }

    def process_content(self, text: str, group_id: str = "") -> str:
        """Evaluate content against auto-triggers and potentially shift state."""
        text_lower = text.lower()
        for emotion, trigger in AUTO_TRIGGERS.items():
            if any(kw in text_lower for kw in trigger["keywords"]):
                activity = self.group_activity.get(group_id, 0)
                if activity >= trigger["min_activity"]:
                    self._trigger_counters[emotion] = self._trigger_counters.get(emotion, 0) + 1
        # Check if any trigger crossed threshold
        for emotion, count in self._trigger_counters.items():
            if count >= 2:  # Two trigger hits = shift
                self._shift_state(emotion, f"keyword trigger ({emotion})")
                self._trigger_counters[emotion] = 0
                break
        return text

    def shift_to(self, state: str, reason: str = "manual"):
        self._shift_state(state, reason)

    def _shift_state(self, new_state: str, reason: str):
        if new_state not in EMOTION_STATES or new_state == self.current_state:
            return
        self.previous_state = self.current_state
        self.current_state = new_state
        self.transitioned_at = datetime.now(timezone.utc).isoformat()
        entry = {"from": self.previous_state, "to": new_state, "reason": reason, "at": self.transitioned_at}
        self.state_history.append(entry)
        logger.debug(f"Emotion shift [{self.persona_id}]: {self.previous_state} → {new_state} ({reason})")

    def get_state_history(self, limit: int = 20) -> list[dict]:
        return self.state_history[-limit:]

    def reset(self):
        self.current_state = "neutral"
        self.previous_state = "neutral"
        self._trigger_counters = {}


class EmotionManager:
    """Factory/singleton for EmotionEngine instances. Module-dispatcher safe."""

    def __init__(self):
        self._engines: dict[str, EmotionEngine] = {}

    def get_engine(self, persona_id: str) -> EmotionEngine:
        if persona_id not in self._engines:
            self._engines[persona_id] = EmotionEngine(persona_id)
        return self._engines[persona_id]

    def get_modifiers(self, persona_id: str) -> dict:
        return self.get_engine(persona_id).get_modifiers()

    def process_content(self, text: str, group_id: str = "", persona_id: str = "") -> str:
        return self.get_engine(persona_id).process_content(text, group_id)

    def shift_to(self, persona_id: str, state: str, reason: str = "manual"):
        self.get_engine(persona_id).shift_to(state, reason)

    def get_state_history(self, persona_id: str, limit: int = 20) -> list[dict]:
        return self.get_engine(persona_id).get_state_history(limit)

    def list_engines(self) -> dict:
        return {pid: e.current_state for pid, e in self._engines.items()}


class CommunityRoleManager:
    """Assign and manage community roles for PPI engagement."""

    def __init__(self, group_id: str):
        self.group_id = group_id
        self.members: dict[str, dict] = {}  # persona_id -> role info

    def assign(self, persona_id: str, role: str) -> dict:
        if role not in COMMUNITY_ROLES:
            return {"error": f"Invalid role '{role}'. Valid: {COMMUNITY_ROLES}"}
        behavior = ROLE_BEHAVIOR[role]
        entry = {
            "persona_id": persona_id,
            "role": role,
            "behavior": behavior,
            "assigned_at": datetime.now(timezone.utc).isoformat(),
            "post_count": 0,
            "reply_count": 0,
            "reaction_count": 0,
        }
        self.members[persona_id] = entry
        logger.info(f"Role assigned [{group_id}]: {persona_id} → {role}")
        return entry

    def unassign(self, persona_id: str) -> bool:
        if persona_id in self.members:
            del self.members[persona_id]
            return True
        return False

    def get(self, persona_id: str) -> Optional[dict]:
        return self.members.get(persona_id)

    def get_role_count(self) -> dict:
        counts = {}
        for m in self.members.values():
            counts[m["role"]] = counts.get(m["role"], 0) + 1
        return counts

    def auto_suggest(self, available_personas: list[str]) -> dict:
        """Suggest optimal role distribution for a set of personas."""
        suggestions = {}
        num = len(available_personas)
        if num == 0:
            return suggestions
        # One leader, up to 2 core, rest distributed
        candidates = list(available_personas)
        random.shuffle(candidates)
        if candidates:
            suggestions[candidates.pop(0)] = "leader"
        for _ in range(min(2, len(candidates))):
            if candidates:
                suggestions[candidates.pop(0)] = "core"
        for _ in range(min(2, len(candidates))):
            if candidates:
                suggestions[candidates.pop(0)] = "newcomer"
        for p in candidates:
            suggestions[p] = random.choice(["validator", "lurker"])
        return suggestions

    def record_action(self, persona_id: str, action: str):
        m = self.members.get(persona_id)
        if not m:
            return
        if action == "post":
            m["post_count"] += 1
        elif action == "reply":
            m["reply_count"] += 1
        elif action == "reaction":
            m["reaction_count"] += 1

    def get_report(self) -> dict:
        return {
            "group_id": self.group_id,
            "total_members": len(self.members),
            "roles": self.get_role_count(),
            "members": list(self.members.values()),
        }
