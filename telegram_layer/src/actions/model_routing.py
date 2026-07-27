"""Multi-Model Routing — Per-persona AI provider routing with cost/quality awareness.

Routes each persona's generation to the optimal AI provider based on:
- Persona's configured provider preference
- Task type (casual reply vs expert analysis)
- Cost budget (free vs paid providers)
- Quality requirements
"""

from dataclasses import dataclass, field
from typing import Optional
from loguru import logger


PROVIDER_CAPABILITIES = {
    "openai": {"models": ["gpt-4o-mini", "gpt-4o"], "free": False, "quality": 9, "speed": 8, "cost_per_1k": 0.15},
    "anthropic": {"models": ["claude-3-haiku", "claude-3-sonnet"], "free": False, "quality": 9, "speed": 7, "cost_per_1k": 0.25},
    "groq": {"models": ["llama-3.1-8b-instant", "llama-3.1-70b-versatile"], "free": True, "quality": 7, "speed": 10, "cost_per_1k": 0.0},
    "ollama": {"models": ["llama3", "mistral", "phi3"], "free": True, "quality": 6, "speed": 5, "cost_per_1k": 0.0},
    "google_gemini": {"models": ["gemini-pro", "gemini-1.5-flash"], "free": True, "quality": 8, "speed": 8, "cost_per_1k": 0.0},
    "mistral_ai": {"models": ["mistral-small", "mistral-large"], "free": False, "quality": 8, "speed": 8, "cost_per_1k": 0.1},
    "cohere": {"models": ["command-r", "command-r-plus"], "free": False, "quality": 7, "speed": 7, "cost_per_1k": 0.15},
    "siliconflow": {"models": ["Qwen/Qwen2.5-7B-Instruct"], "free": True, "quality": 7, "speed": 7, "cost_per_1k": 0.0},
    "cerebras": {"models": ["llama-3.1-8b"], "free": True, "quality": 7, "speed": 9, "cost_per_1k": 0.0},
    "nvidia_nim": {"models": ["meta/llama-3.1-8b-instruct"], "free": True, "quality": 7, "speed": 7, "cost_per_1k": 0.0},
    "openrouter": {"models": ["openrouter/auto"], "free": False, "quality": 8, "speed": 7, "cost_per_1k": 0.2},
}

TASK_TYPE_REQUIREMENTS = {
    "casual_reply": {"min_quality": 4, "prefer_free": True, "max_cost": 0.1},
    "conversation_starter": {"min_quality": 5, "prefer_free": True, "max_cost": 0.1},
    "opinion": {"min_quality": 6, "prefer_free": True, "max_cost": 0.15},
    "expert_analysis": {"min_quality": 8, "prefer_free": False, "max_cost": 0.5},
    "ppi_debate": {"min_quality": 7, "prefer_free": False, "max_cost": 0.3},
    "ppi_agreement": {"min_quality": 6, "prefer_free": True, "max_cost": 0.15},
    "sentiment": {"min_quality": 5, "prefer_free": True, "max_cost": 0.05},
    "topic_detection": {"min_quality": 5, "prefer_free": True, "max_cost": 0.05},
}


@dataclass
class RoutingDecision:
    provider: str
    model: str
    reason: str
    estimated_cost: float


class ModelRouter:
    """Routes generation requests to optimal AI provider per persona and task."""

    def __init__(self, api_keys: dict[str, str] = None, budget_mode: str = "balanced"):
        self.api_keys = api_keys or {}
        self.budget_mode = budget_mode  # "economy", "balanced", "quality"
        self._persona_overrides: dict[str, str] = {}  # persona_id -> provider
        self._usage: dict[str, int] = {}

    def set_persona_provider(self, persona_id: str, provider: str):
        if provider not in PROVIDER_CAPABILITIES:
            raise ValueError(f"Unknown provider: {provider}")
        self._persona_overrides[persona_id] = provider
        logger.info(f"Persona {persona_id} routed to {provider}")

    def get_persona_provider(self, persona_id: str) -> Optional[str]:
        return self._persona_overrides.get(persona_id)

    def clear_persona_override(self, persona_id: str):
        self._persona_overrides.pop(persona_id, None)

    def route(self, persona_id: str, task_type: str, persona_provider: Optional[str] = None) -> RoutingDecision:
        if persona_id in self._persona_overrides:
            provider_id = self._persona_overrides[persona_id]
            info = PROVIDER_CAPABILITIES.get(provider_id)
            if info:
                return RoutingDecision(
                    provider=provider_id, model=info["models"][0],
                    reason=f"Persona override for {persona_id}",
                    estimated_cost=info["cost_per_1k"],
                )

        if persona_provider and persona_provider in PROVIDER_CAPABILITIES:
            info = PROVIDER_CAPABILITIES[persona_provider]
            if info["configured"] if hasattr(info, 'configured') else True:
                return RoutingDecision(
                    provider=persona_provider, model=info["models"][0],
                    reason="Persona's configured provider",
                    estimated_cost=info["cost_per_1k"],
                )

        requirements = TASK_TYPE_REQUIREMENTS.get(task_type, TASK_TYPE_REQUIREMENTS["casual_reply"])
        candidates = []

        for pid, info in PROVIDER_CAPABILITIES.items():
            configured = pid in self.api_keys or info["free"]
            if not configured:
                continue
            if info["quality"] < requirements["min_quality"]:
                continue
            if requirements["prefer_free"] and info["cost_per_1k"] > 0 and self.budget_mode == "economy":
                continue
            if info["cost_per_1k"] > requirements["max_cost"] and self.budget_mode != "quality":
                continue
            candidates.append((pid, info))

        if not candidates:
            candidates = [(pid, info) for pid, info in PROVIDER_CAPABILITIES.items() if info["free"]]

        if self.budget_mode == "economy":
            candidates.sort(key=lambda x: (x[1]["cost_per_1k"], -x[1]["speed"]))
        elif self.budget_mode == "quality":
            candidates.sort(key=lambda x: (-x[1]["quality"], x[1]["cost_per_1k"]))
        else:
            candidates.sort(key=lambda x: (-x[1]["quality"] / max(x[1]["cost_per_1k"], 0.01), x[1]["speed"]))

        if not candidates:
            return RoutingDecision(provider="ollama", model="llama3", reason="Last resort fallback", estimated_cost=0.0)

        best = candidates[0]
        self._usage[best[0]] = self._usage.get(best[0], 0) + 1
        return RoutingDecision(provider=best[0], model=best[1]["models"][0], reason=f"Auto-routed ({self.budget_mode})", estimated_cost=best[1]["cost_per_1k"])

    def get_usage_stats(self) -> dict:
        return dict(self._usage)

    def get_available_providers(self) -> list[dict]:
        return [
            {"id": pid, **info, "configured": pid in self.api_keys or info["free"], "personas_assigned": sum(1 for v in self._persona_overrides.values() if v == pid)}
            for pid, info in PROVIDER_CAPABILITIES.items()
        ]


model_router = ModelRouter()
