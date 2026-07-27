"""Persona Memory System — 3-tier memory (short-term, long-term, episodic)."""

from datetime import datetime, timezone, timedelta
from typing import Optional
from loguru import logger


class ShortTermMemory:
    """Recent conversation history — last N exchanges per group per persona."""

    def __init__(self, max_per_group: int = 20):
        self._store: dict[str, list[dict]] = {}  # key: "persona_id:group_id" -> messages
        self.max_per_group = max_per_group

    def _key(self, persona_id: str, group_id: str) -> str:
        return f"{persona_id}:{group_id}"

    def add(self, persona_id: str, group_id: str, role: str, content: str, meta: Optional[dict] = None):
        key = self._key(persona_id, group_id)
        self._store.setdefault(key, [])
        self._store[key].append({
            "role": role, "content": content, "timestamp": datetime.now(timezone.utc).isoformat(),
            "meta": meta or {},
        })
        if len(self._store[key]) > self.max_per_group:
            self._store[key] = self._store[key][-self.max_per_group:]

    def get_recent(self, persona_id: str, group_id: str, count: int = 10) -> list[dict]:
        key = self._key(persona_id, group_id)
        return self._store.get(key, [])[-count:]

    def get_context_string(self, persona_id: str, group_id: str, count: int = 5) -> str:
        msgs = self.get_recent(persona_id, group_id, count)
        return "\n".join([f"{m['role']}: {m['content'][:200]}" for m in msgs])

    def clear_group(self, persona_id: str, group_id: str):
        key = self._key(persona_id, group_id)
        self._store.pop(key, None)

    def clear_persona(self, persona_id: str):
        keys = [k for k in self._store if k.startswith(f"{persona_id}:")]
        for k in keys:
            del self._store[k]


class LongTermMemory:
    """Persistent facts learned about other members, topics, and group dynamics."""

    def __init__(self):
        self._store: dict[str, list[dict]] = {}  # key: "persona_id" -> facts

    def add_fact(self, persona_id: str, fact_type: str, subject: str, fact: str, confidence: float = 0.5):
        self._store.setdefault(persona_id, [])
        self._store[persona_id].append({
            "type": fact_type, "subject": subject, "fact": fact,
            "confidence": confidence, "created_at": datetime.now(timezone.utc).isoformat(),
            "last_updated": datetime.now(timezone.utc).isoformat(),
        })

    def learn_from_conversation(self, persona_id: str, member_name: str, message: str):
        facts = []
        lower = message.lower()

        fact_patterns = [
            ("preference", ["i like", "i love", "my favorite", "i enjoy"]),
            ("opinion", ["i think", "in my opinion", "i believe", "i feel"]),
            ("personal", ["i work", "i live", "i study", "i am from"]),
            ("interest", ["i'm into", "i follow", "i read", "i watch"]),
        ]

        for fact_type, patterns in fact_patterns:
            for p in patterns:
                if p in lower:
                    start = lower.find(p)
                    snippet = message[start:min(start + 100, len(message))]
                    facts.append((fact_type, member_name, snippet))

        for fact_type, subject, snippet in facts:
            self.add_fact(persona_id, fact_type, subject, snippet, confidence=0.4)

    def get_facts(self, persona_id: str, fact_type: Optional[str] = None) -> list[dict]:
        facts = self._store.get(persona_id, [])
        if fact_type:
            facts = [f for f in facts if f["type"] == fact_type]
        return facts

    def get_facts_about(self, persona_id: str, subject: str) -> list[dict]:
        return [f for f in self._store.get(persona_id, []) if f["subject"] == subject]

    def get_facts_string(self, persona_id: str, max_facts: int = 10) -> str:
        facts = self._store.get(persona_id, [])[-max_facts:]
        if not facts:
            return ""
        lines = [f"- {f['subject']}: {f['fact']} (confidence: {f['confidence']:.0%})" for f in facts]
        return "What I know about people:\n" + "\n".join(lines)

    def clear_persona(self, persona_id: str):
        self._store.pop(persona_id, None)


class EpisodicMemory:
    """Full conversation episodes with context, emotion, and outcomes."""

    def __init__(self):
        self._store: dict[str, list[dict]] = {}

    def record(self, persona_id: str, group_id: str, episode: dict):
        self._store.setdefault(persona_id, [])
        self._store[persona_id].append({
            "group_id": group_id,
            "episode": episode,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        if len(self._store[persona_id]) > 50:
            self._store[persona_id] = self._store[persona_id][-50:]

    def get_episodes(self, persona_id: str, group_id: Optional[str] = None, limit: int = 10) -> list[dict]:
        episodes = self._store.get(persona_id, [])
        if group_id:
            episodes = [e for e in episodes if e["group_id"] == group_id]
        return episodes[-limit:]

    def get_relevant_context(self, persona_id: str, topic: str) -> str:
        episodes = self._store.get(persona_id, [])[-20:]
        relevant = []
        for ep in episodes:
            content = str(ep.get("episode", {}))
            if topic.lower() in content.lower():
                relevant.append(ep)
        if not relevant:
            return ""
        parts = []
        for r in relevant[-3:]:
            ep_data = r.get("episode", {})
            parts.append(f"[{r['timestamp'][:10]}] {ep_data.get('summary', str(ep_data)[:100])}")
        return "Related past experiences:\n" + "\n".join(parts)

    def clear_persona(self, persona_id: str):
        self._store.pop(persona_id, None)


class PersonaMemorySystem:
    """Full 3-tier memory for a persona."""

    def __init__(self):
        self.short_term = ShortTermMemory()
        self.long_term = LongTermMemory()
        self.episodic = EpisodicMemory()

    def remember_conversation(self, persona_id: str, group_id: str, member: str, message: str):
        self.short_term.add(persona_id, group_id, member, message)
        self.long_term.learn_from_conversation(persona_id, member, message)

    def get_context_for_generation(self, persona_id: str, group_id: str, topic: str = "") -> str:
        parts = []
        recent = self.short_term.get_context_string(persona_id, group_id, 5)
        if recent:
            parts.append("Recent conversation:\n" + recent)
        facts = self.long_term.get_facts_string(persona_id, 5)
        if facts:
            parts.append(facts)
        episodic = self.episodic.get_relevant_context(persona_id, topic)
        if episodic:
            parts.append(episodic)
        return "\n\n".join(parts)

    def clear_persona(self, persona_id: str):
        self.short_term.clear_persona(persona_id)
        self.long_term.clear_persona(persona_id)
        self.episodic.clear_persona(persona_id)


memory_system = PersonaMemorySystem()
