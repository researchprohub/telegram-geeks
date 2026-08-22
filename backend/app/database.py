"""Database session compatibility alias."""

from app.db.session import engine, async_session_factory, get_db

AsyncSessionLocal = async_session_factory
