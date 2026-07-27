"""Database initialization script."""

import asyncio
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from app.models.base import Base
from app.core.config import settings


async def init_db():
    """Create all database tables."""
    engine = create_async_engine(settings.database_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("✅ Database tables created successfully")


if __name__ == "__main__":
    asyncio.run(init_db())
