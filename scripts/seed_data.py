"""Seed demo data for development."""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_session_factory
from app.models import Account, Persona, Campaign, CampaignType, CampaignStatus, User, UserRole
from app.core.security import hash_password


async def seed():
    """Insert demo data."""
    async with async_session_factory() as session:
        # Create admin user
        user = User(
            email="admin@example.com",
            hashed_password=hash_password("admin123"),
            full_name="Admin User",
            role=UserRole.ADMIN,
        )
        session.add(user)
        await session.flush()

        # Create demo personas
        personas = [
            Persona(
                name="Alex",
                personality_traits={"openness": 0.8, "agreeableness": 0.7},
                writing_style={"style": "casual", "length": "short"},
                tone="friendly",
                energy_level=0.7,
                humor_level=0.5,
                formality_level=0.2,
                niche_tags=["tech", "crypto", "web3"],
            ),
            Persona(
                name="Jordan",
                personality_traits={"openness": 0.6, "agreeableness": 0.5},
                writing_style={"style": "analytical", "length": "medium"},
                tone="professional",
                energy_level=0.5,
                humor_level=0.2,
                formality_level=0.6,
                niche_tags=["finance", "investing", "business"],
            ),
            Persona(
                name="Sam",
                personality_traits={"openness": 0.9, "agreeableness": 0.8},
                writing_style={"style": "enthusiastic", "length": "long"},
                tone="excited",
                energy_level=0.9,
                humor_level=0.7,
                formality_level=0.1,
                niche_tags=["gaming", "nft", "memes"],
            ),
        ]
        for p in personas:
            session.add(p)

        await session.flush()

        # Create demo campaign
        campaign = Campaign(
            name="Tech Community Engagement",
            description="Engage in tech-related Telegram groups",
            campaign_type=CampaignType.ENGAGEMENT,
            status=CampaignStatus.DRAFT,
            config={"cycle_delay_min": 120, "cycle_delay_max": 300},
            target_groups=[1, 2, 3],
            allowed_hours=list(range(8, 23)),
            timezone="UTC",
            persona_ids=[p.id for p in personas],
            created_by=user.id,
        )
        session.add(campaign)

        await session.commit()
        print(f"✅ Seeded: 1 user, {len(personas)} personas, 1 campaign")


if __name__ == "__main__":
    asyncio.run(seed())
