"""Bridge to telegram_layer NeuroTextEngine for API endpoints."""

import sys, os
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
tl_path = os.path.join(base_dir, "telegram_layer")
if tl_path not in sys.path:
    sys.path.insert(0, tl_path)

from loguru import logger

try:
    from telegram_layer.src.actions.neuro_text import neuro_engine
    HAS_ENGINE = True
except ImportError as e:
    logger.warning(f"NeuroTextEngine not available: {e}")
    neuro_engine = None
    HAS_ENGINE = False


class NeuroTextBridge:
    async def preview(self, template: str, count: int = 5) -> dict:
        if not HAS_ENGINE or not neuro_engine:
            return self._fallback_preview(template, count)
        try:
            return await neuro_engine.preview_spintax(template=template, count=count)
        except Exception as e:
            logger.error(f"Spintax preview error: {e}")
            return self._fallback_preview(template, count)

    async def generate(self, prompt: str, tone: str = "casual", persona_context: dict = None, spin_count: int = 3) -> dict:
        if not HAS_ENGINE or not neuro_engine:
            return self._fallback_generate(prompt, tone)
        try:
            return await neuro_engine.generate_with_spintax(prompt=prompt, tone=tone, persona_context=persona_context or {}, spin_count=spin_count)
        except Exception as e:
            logger.error(f"Spintax generate error: {e}")
            return self._fallback_generate(prompt, tone)

    def _fallback_preview(self, template: str, count: int) -> dict:
        import random, re
        variants = []
        for _ in range(count):
            def repl(m):
                choices = [c.strip() for c in m.group(1).split("|")]
                return random.choice(choices)
            v = re.sub(r"\{([^}]+)}", repl, template)
            variants.append(v)
        return {"variants": variants, "count": len(variants), "estimated": count * 5}

    def _fallback_generate(self, prompt: str, tone: str) -> dict:
        spintax = f"{{Hello|Hi|Hey}}! {{I wanted to|Let me}} share {{some thoughts|an idea}} about {prompt}."
        import random, re
        variants = []
        for _ in range(5):
            def repl(m):
                choices = [c.strip() for c in m.group(1).split("|")]
                return random.choice(choices)
            v = re.sub(r"\{([^}]+)}", repl, spintax)
            variants.append(v)
        return {"prompt": prompt, "tone": tone, "spintax": spintax, "variants": variants}
