"""Persona & Group Prompt Template Marketplace — publish, rate, review."""

from datetime import datetime, timezone
from typing import Optional
from loguru import logger


class MarketplaceManager:
    """User-submitted template marketplace with ratings and reviews."""

    def __init__(self, ai_engine=None):
        self.ai_engine = ai_engine
        self.templates: dict[str, dict] = {}
        self.reviews: dict[str, list[dict]] = {}
        self._next_id = 1

    def publish(self, author: str, name: str, template_type: str, content: dict, price: float = 0.0, description: str = "") -> dict:
        template_id = f"tmpl_{self._next_id}"
        self._next_id += 1
        entry = {
            "id": template_id,
            "author": author,
            "name": name,
            "type": template_type,
            "content": content,
            "price": price,
            "description": description or name,
            "rating_avg": 0.0,
            "rating_count": 0,
            "downloads": 0,
            "published_at": datetime.now(timezone.utc).isoformat(),
            "status": "active",
        }
        self.templates[template_id] = entry
        self.reviews[template_id] = []
        logger.info(f"Marketplace published: {template_id} ({name}) by {author}")
        return entry

    def list_templates(self, template_type: Optional[str] = None, sort_by: str = "newest") -> list[dict]:
        items = list(self.templates.values())
        if template_type:
            items = [t for t in items if t["type"] == template_type]
        sort_keys = {
            "newest": lambda t: t["published_at"],
            "rating": lambda t: t["rating_avg"],
            "popular": lambda t: t["downloads"],
        }
        key_fn = sort_keys.get(sort_by, sort_keys["newest"])
        items.sort(key=key_fn, reverse=True)
        return items

    def get_template(self, template_id: str) -> Optional[dict]:
        return self.templates.get(template_id)

    def download(self, template_id: str) -> Optional[dict]:
        t = self.templates.get(template_id)
        if t and t["status"] == "active":
            t["downloads"] += 1
            return t["content"]
        return None

    def add_review(self, template_id: str, user_id: str, rating: int, comment: str = "") -> dict:
        if template_id not in self.templates:
            return {"error": "Template not found"}
        if rating < 1 or rating > 5:
            return {"error": "Rating must be 1-5"}
        review = {
            "user_id": user_id,
            "rating": rating,
            "comment": comment,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self.reviews[template_id].append(review)
        t = self.templates[template_id]
        ratings = [r["rating"] for r in self.reviews[template_id]]
        t["rating_avg"] = round(sum(ratings) / len(ratings), 2)
        t["rating_count"] = len(ratings)
        return {"template_id": template_id, "rating_avg": t["rating_avg"], "rating_count": t["rating_count"]}

    def get_reviews(self, template_id: str) -> list[dict]:
        return self.reviews.get(template_id, [])

    def unpublish(self, template_id: str, author: str) -> bool:
        t = self.templates.get(template_id)
        if t and t["author"] == author:
            t["status"] = "archived"
            return True
        return False

    def search(self, query: str) -> list[dict]:
        q = query.lower()
        return [t for t in self.templates.values() if t["status"] == "active" and (q in t["name"].lower() or q in t["description"].lower())]

    async def ai_generate_template(self, keywords: list[str], template_type: str, ai_engine=None) -> dict:
        """Generate a template using AI engine."""
        engine = ai_engine or self.ai_engine
        prompt = (
            f"Generate a {template_type} template for Telegram based on these keywords: {', '.join(keywords)}. "
            f"Return a JSON object with: name, description, and content object matching the {template_type} structure."
        )
        if engine:
            try:
                import json
                raw = await engine.generate(prompt)
                data = json.loads(raw) if isinstance(raw, str) else raw
                return {
                    "name": data.get("name", "AI Generated"),
                    "description": data.get("description", ""),
                    "content": data.get("content", {}),
                    "generated_by": "ai",
                }
            except Exception:
                pass
        return {
            "name": " ".join(keywords).title(),
            "description": f"A {template_type} template based on: {', '.join(keywords)}",
            "content": {},
            "generated_by": "fallback",
        }
