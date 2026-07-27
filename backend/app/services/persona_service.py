"""Persona management service."""

from app.models import Persona
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


class PersonaService:
    """Business logic for persona management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_persona(
        self,
        name: str,
        personality_traits: dict | None = None,
        writing_style: dict | None = None,
        response_time_min: int = 30,
        response_time_max: int = 300,
        tone: str = "casual",
        niche_tags: list[str] | None = None,
    ) -> Persona:
        persona = Persona(
            name=name,
            personality_traits=personality_traits or {},
            writing_style=writing_style or {},
            response_time_min=response_time_min,
            response_time_max=response_time_max,
            tone=tone,
            niche_tags=niche_tags or [],
        )
        self.db.add(persona)
        await self.db.flush()
        await self.db.refresh(persona)
        return persona

    async def get_persona(self, persona_id: int) -> Persona:
        result = await self.db.execute(select(Persona).where(Persona.id == persona_id))
        return result.scalar_one_or_none()

    async def list_personas(self, skip: int = 0, limit: int = 50):
        result = await self.db.execute(
            select(Persona).offset(skip).limit(limit).order_by(Persona.created_at.desc())
        )
        return list(result.scalars().all())

    async def delete_persona(self, persona_id: int) -> bool:
        persona = await self.get_persona(persona_id)
        if persona:
            await self.db.delete(persona)
            await self.db.flush()
            return True
        return False
