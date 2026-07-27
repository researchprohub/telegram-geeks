"""AI Persona Generator & Group Prompt Generator — LLM-based from keywords."""

import json
import random
from typing import Optional
from loguru import logger

PERSONA_ARCHETYPES = {
    "crypto_trader": {
        "identity": {"occupation": "Crypto Trader", "nationality": "US", "age_range": (28, 50)},
        "personality": {"openness": 8, "extraversion": 7, "agreeableness": 5},
        "knowledge_domains": ["cryptocurrency", "blockchain", "DeFi", "trading"],
    },
    "software_dev": {
        "identity": {"occupation": "Software Developer", "nationality": "US", "age_range": (24, 45)},
        "personality": {"openness": 9, "conscientiousness": 8, "agreeableness": 4},
        "knowledge_domains": ["programming", "cloud computing", "AI/ML", "open source"],
    },
    "fitness_coach": {
        "identity": {"occupation": "Fitness Coach", "nationality": "US", "age_range": (25, 55)},
        "personality": {"extraversion": 8, "conscientiousness": 9, "agreeableness": 7},
        "knowledge_domains": ["fitness", "nutrition", "wellness", "sports science"],
    },
    "startup_founder": {
        "identity": {"occupation": "Startup Founder", "nationality": "US", "age_range": (22, 50)},
        "personality": {"openness": 9, "extraversion": 7, "conscientiousness": 8},
        "knowledge_domains": ["startups", "VC funding", "SaaS", "product management"],
    },
    "defi_analyst": {
        "identity": {"occupation": "DeFi Analyst", "nationality": "UK", "age_range": (26, 48)},
        "personality": {"openness": 7, "conscientiousness": 8, "agreeableness": 4},
        "knowledge_domains": ["DeFi", "yield farming", "liquidity pools", "protocol analysis"],
    },
    "tech_reviewer": {
        "identity": {"occupation": "Tech Reviewer", "nationality": "US", "age_range": (22, 40)},
        "personality": {"openness": 8, "extraversion": 6, "agreeableness": 6},
        "knowledge_domains": ["consumer tech", "gadgets", "software", "gaming"],
    },
    "marketing_pro": {
        "identity": {"occupation": "Marketing Specialist", "nationality": "US", "age_range": (24, 45)},
        "personality": {"extraversion": 8, "openness": 7, "agreeableness": 7},
        "knowledge_domains": ["digital marketing", "SEO", "social media", "brand strategy"],
    },
    "regional_russian": {
        "identity": {"occupation": "Entrepreneur", "nationality": "RU", "age_range": (26, 55)},
        "personality": {"openness": 6, "conscientiousness": 8, "extraversion": 6},
        "knowledge_domains": ["business", "technology", "cryptocurrency", "international trade"],
    },
    "regional_indian": {
        "identity": {"occupation": "Tech Professional", "nationality": "IN", "age_range": (22, 45)},
        "personality": {"openness": 8, "conscientiousness": 8, "agreeableness": 7},
        "knowledge_domains": ["software development", "IT services", "startups", "education"],
    },
    "regional_turkish": {
        "identity": {"occupation": "Market Trader", "nationality": "TR", "age_range": (25, 50)},
        "personality": {"openness": 7, "extraversion": 7, "agreeableness": 5},
        "knowledge_domains": ["trading", "forex", "cryptocurrency", "economics"],
    },
    "regional_vietnamese": {
        "identity": {"occupation": "E-commerce Seller", "nationality": "VN", "age_range": (22, 42)},
        "personality": {"openness": 7, "conscientiousness": 8, "agreeableness": 7},
        "knowledge_domains": ["e-commerce", "dropshipping", "manufacturing", "logistics"],
    },
}

GROUP_PROMPT_TEMPLATES = {
    "crypto_trading": "This is a {tone} cryptocurrency trading community. Members discuss market trends, trading strategies, and DeFi opportunities. {rules}",
    "defi_discussion": "This is a professional DeFi protocol discussion group. Focus is on yield farming, liquidity pools, and protocol analysis. {rules}",
    "stock_market": "This is a stock market analysis group for serious investors. Members share research, earnings analysis, and macro perspectives. {rules}",
    "real_estate": "This is a real estate investment group focused on property markets, REITs, and development opportunities. {rules}",
    "startup_founder": "This is a startup founders circle focused on building and scaling businesses. Topics include fundraising, product-market fit, and growth. {rules}",
    "gaming": "This is a {tone} gaming community. Members discuss games, hardware, and industry news. {rules}",
    "tech_enthusiast": "This is a technology discussion group for enthusiasts. Topics include gadgets, software, AI, and emerging tech. {rules}",
    "fitness": "This is a fitness and wellness community focused on workouts, nutrition, and healthy living. {rules}",
    "product_launch": "This group is warming up for a product launch. Conversations should naturally gravitate toward {topic}. {rules}",
    "brand_awareness": "This group exists to build brand awareness for {topic}. Discussions should highlight value and community benefits. {rules}",
    "lead_generation": "This is a lead generation community. Members engage with {topic} to identify potential customers naturally. {rules}",
    "support": "This is a customer support group for {topic}. Focus is on solving problems and building goodwill. {rules}",
}


class PersonaGenerator:
    """Generate complete personas from archetypes or keywords."""

    def __init__(self, ai_engine=None):
        self.ai_engine = ai_engine

    def from_archetype(self, archetype_id: str, name: str = "", tone: str = "casual") -> dict:
        """Generate a persona from a predefined archetype."""
        arch = PERSONA_ARCHETYPES.get(archetype_id)
        if not arch:
            return {"error": f"Unknown archetype '{archetype_id}'"}
        age = random.randint(*arch["identity"]["age_range"])
        name = name or self._random_name(arch["identity"]["nationality"])
        soul_prompt = self._build_soul_prompt(name, age, arch, tone)
        return {
            "name": name,
            "archetype": archetype_id,
            "soul_prompt": soul_prompt,
            "layers": {
                "identity": {"name": name, "age": age, "nationality": arch["identity"]["nationality"], "occupation": arch["identity"]["occupation"]},
                "personality": arch["personality"],
                "knowledge": {"domains": arch["knowledge_domains"]},
            },
        }

    async def from_keywords(self, keywords: list[str], ai_engine=None) -> dict:
        """Generate a persona using the AI engine from a list of keywords."""
        engine = ai_engine or self.ai_engine
        prompt = (
            f"Create a Telegram persona based on these keywords: {', '.join(keywords)}. "
            f"Return a JSON object with: name, age, nationality, occupation, "
            f"soul_prompt (a 3-4 sentence natural language description of who this person is), "
            f"and knowledge_domains (list of 3-5 expertise areas). "
            f"Make it realistic and specific."
        )
        if engine:
            try:
                raw = await engine.generate(prompt)
                parsed = json.loads(raw) if isinstance(raw, str) else raw
                return {"name": parsed.get("name", "AI Persona"), "soul_prompt": parsed.get("soul_prompt", ""), "layers": {"identity": parsed, "knowledge": {"domains": parsed.get("knowledge_domains", [])}}, "generated_by": "ai"}
            except Exception:
                pass
        return self.from_archetype(random.choice(list(PERSONA_ARCHETYPES.keys())))

    def list_archetypes(self) -> dict:
        return {k: {"occupation": v["identity"]["occupation"], "nationality": v["identity"]["nationality"], "domains": v["knowledge_domains"]} for k, v in PERSONA_ARCHETYPES.items()}

    def _build_soul_prompt(self, name: str, age: int, arch: dict, tone: str) -> str:
        adj_map = {"casual": "You keep things light and friendly", "professional": "You maintain a professional tone", "expert": "You speak with authority and data"}
        adj = adj_map.get(tone, adj_map["casual"])
        return f"You are {name}, a {age}-year-old {arch['identity']['occupation']} from {arch['identity']['nationality']}. {adj}. Your expertise covers {', '.join(arch['knowledge_domains'])}."

    @staticmethod
    def _random_name(nationality: str) -> str:
        names = {
            "US": ["Alex", "Jordan", "Morgan", "Casey", "Riley", "Taylor", "Sam"],
            "UK": ["Oliver", "Amelia", "Harry", "Isla", "Jack", "Grace"],
            "RU": ["Dmitri", "Olga", "Nikolai", "Anastasia", "Vladimir"],
            "IN": ["Arjun", "Priya", "Raj", "Meera", "Vikram", "Ananya"],
            "TR": ["Mehmet", "Ayse", "Can", "Elif", "Burak", "Zeynep"],
            "VN": ["Nguyen", "Linh", "Tuan", "Mai", "Huy", "Trang"],
            "AE": ["Omar", "Fatima", "Khalid", "Layla", "Zayed"],
            "BR": ["Lucas", "Ana", "Pedro", "Beatriz", "Gabriel"],
        }
        pool = names.get(nationality, names["US"])
        return random.choice(pool)


class GroupPromptGenerator:
    """Generate group context prompts from group type and topic."""

    TEMPLATES = GROUP_PROMPT_TEMPLATES

    def generate(self, group_type: str, topic: str = "", tone: str = "casual", rules: str = "") -> str:
        """Generate a group prompt from a template type."""
        template = self.TEMPLATES.get(group_type)
        if not template:
            return f"This is a group about {topic or 'general discussion'}. {rules}"
        tone_map = {"casual": "friendly and relaxed", "professional": "serious and professional", "expert": "highly technical and expert-level", "academic": "research-oriented and analytical"}
        tone_desc = tone_map.get(tone, "friendly and relaxed")
        default_rules = "Respect other members. Stay on topic."
        rules_text = rules or default_rules
        result = template.format(tone=tone_desc, topic=topic or "the group's focus", rules=rules_text)
        return result

    async def ai_generate(self, group_name: str, group_description: str = "", ai_engine=None) -> str:
        """Generate a group prompt using the AI engine."""
        prompt = (
            f"Write a group context prompt for a Telegram group. "
            f"Group name: {group_name}\n"
            f"Group description: {group_description or 'Not provided'}\n\n"
            f"Return a paragraph describing the group's purpose, tone, and ground rules. "
            f"Be specific and natural."
        )
        if ai_engine:
            try:
                return str(await ai_engine.generate(prompt))
            except Exception:
                pass
        return self.generate("general", topic=group_name)

    def list_templates(self) -> dict:
        return {k: v.split(".")[0] for k, v in self.TEMPLATES.items()}
