"""Persona Warm-Up Sequence — Gradual persona introduction to groups.

Phases:
1. Lurk (observe, no engagement)
2. Occasional react (emojis only)
3. Occasional reply (short, low-risk)
4. Regular engagement (normal participation)
5. Full engagement (all persona features active)
"""

import asyncio
import random
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Optional
from loguru import logger


class WarmupPhase(Enum):
    LURK = "lurk"
    OCCASIONAL_REACT = "occasional_react"
    OCCASIONAL_REPLY = "occasional_reply"
    REGULAR = "regular"
    FULL = "full"


PHASE_CONFIG = {
    WarmupPhase.LURK: {
        "duration_days": 2, "posts_per_day": 0, "replies_per_day": 0,
        "react_probability": 0.0, "reply_probability": 0.0,
        "description": "Only observing — no engagement",
    },
    WarmupPhase.OCCASIONAL_REACT: {
        "duration_days": 2, "posts_per_day": 0, "replies_per_day": 0,
        "react_probability": 0.2, "reply_probability": 0.0,
        "description": "Occasional emoji reactions, no replies",
    },
    WarmupPhase.OCCASIONAL_REPLY: {
        "duration_days": 3, "posts_per_day": 0, "replies_per_day": 1,
        "react_probability": 0.3, "reply_probability": 0.1,
        "description": "Short replies, still mostly observing",
    },
    WarmupPhase.REGULAR: {
        "duration_days": 3, "posts_per_day": 1, "replies_per_day": 2,
        "react_probability": 0.4, "reply_probability": 0.3,
        "description": "Normal group participation",
    },
    WarmupPhase.FULL: {
        "duration_days": 0, "posts_per_day": 3, "replies_per_day": 5,
        "react_probability": 0.5, "reply_probability": 0.5,
        "description": "Full persona capabilities active",
    },
}


class PersonaWarmup:
    """Manages warm-up sequence for a persona in specific groups."""

    def __init__(self, persona_id: str):
        self.persona_id = persona_id
        self.current_phase = WarmupPhase.LURK
        self.phase_started = datetime.now(timezone.utc)
        self._group_phase: dict[str, WarmupPhase] = {}  # group_id -> phase override
        self._group_started: dict[str, datetime] = {}
        self._daily_stats: dict[str, dict] = {}
        self._started_at = datetime.now(timezone.utc)

    def start(self):
        self.current_phase = WarmupPhase.LURK
        self.phase_started = datetime.now(timezone.utc)
        self._started_at = datetime.now(timezone.utc)
        logger.info(f"Warmup started for persona {self.persona_id}")

    def start_for_group(self, group_id: str):
        self._group_phase[group_id] = WarmupPhase.LURK
        self._group_started[group_id] = datetime.now(timezone.utc)
        logger.info(f"Warmup started for persona {self.persona_id} in group {group_id}")

    def get_phase_for_group(self, group_id: str) -> WarmupPhase:
        if group_id in self._group_phase:
            phase = self._group_phase[group_id]
            started = self._group_started.get(group_id, datetime.now(timezone.utc))
        else:
            phase = self.current_phase
            started = self.phase_started
        return self._check_phase_progress(phase, started)

    def get_phase(self) -> WarmupPhase:
        return self._check_phase_progress(self.current_phase, self.phase_started)

    def _check_phase_progress(self, current: WarmupPhase, started: datetime) -> WarmupPhase:
        phases = list(WarmupPhase)
        idx = phases.index(current)
        if idx >= len(phases) - 1:
            return current
        cfg = PHASE_CONFIG[current]
        elapsed = (datetime.now(timezone.utc) - started).total_seconds() / 86400
        if elapsed >= cfg["duration_days"]:
            next_phase = phases[idx + 1]
            if current == WarmupPhase.LURK:
                logger.info(f"Persona {self.persona_id} advancing to {next_phase.value}")
            return next_phase
        return current

    def should_post(self, group_id: Optional[str] = None) -> bool:
        phase = self.get_phase_for_group(group_id) if group_id else self.get_phase()
        cfg = PHASE_CONFIG[phase]
        if cfg["posts_per_day"] == 0:
            return False
        return random.random() < 0.3

    def should_react(self, group_id: Optional[str] = None) -> bool:
        phase = self.get_phase_for_group(group_id) if group_id else self.get_phase()
        cfg = PHASE_CONFIG[phase]
        return random.random() < cfg["react_probability"]

    def should_reply(self, group_id: Optional[str] = None) -> bool:
        phase = self.get_phase_for_group(group_id) if group_id else self.get_phase()
        cfg = PHASE_CONFIG[phase]
        return random.random() < cfg["reply_probability"]

    def get_allowed_actions(self, group_id: Optional[str] = None) -> dict:
        phase = self.get_phase_for_group(group_id) if group_id else self.get_phase()
        cfg = PHASE_CONFIG[phase]
        return {
            "phase": phase.value, "description": cfg["description"],
            "can_post": cfg["posts_per_day"] > 0,
            "can_reply": cfg["reply_probability"] > 0,
            "can_react": cfg["react_probability"] > 0,
            "posts_per_day": cfg["posts_per_day"],
            "replies_per_day": cfg["replies_per_day"],
        }

    def get_progress(self) -> dict:
        phase = self.get_phase()
        phases = list(WarmupPhase)
        idx = phases.index(phase)
        total = len(phases)
        elapsed = (datetime.now(timezone.utc) - self._started_at).total_seconds() / 86400
        return {
            "persona_id": self.persona_id,
            "current_phase": phase.value,
            "phase_index": idx,
            "total_phases": total,
            "progress_pct": round((idx / (total - 1)) * 100, 1),
            "days_elapsed": round(elapsed, 1),
            "config": PHASE_CONFIG[phase],
        }


class WarmupOrchestrator:
    """Manages warm-up sequences for multiple personas."""

    def __init__(self):
        self._warmups: dict[str, PersonaWarmup] = {}

    def start_warmup(self, persona_id: str, group_ids: Optional[list[str]] = None) -> PersonaWarmup:
        w = PersonaWarmup(persona_id)
        w.start()
        if group_ids:
            for gid in group_ids:
                w.start_for_group(gid)
        self._warmups[persona_id] = w
        return w

    def get_warmup(self, persona_id: str) -> Optional[PersonaWarmup]:
        return self._warmups.get(persona_id)

    def get_all_warmups(self) -> list[dict]:
        return [w.get_progress() for w in self._warmups.values()]

    def get_phase_summary(self) -> dict:
        summary = {}
        for pid, w in self._warmups.items():
            phase = w.get_phase().value
            summary.setdefault(phase, [])
            summary[phase].append(pid)
        return summary


warmup_orchestrator = WarmupOrchestrator()
