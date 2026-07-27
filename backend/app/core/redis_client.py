"""Async Redis client singleton — for refresh token rotation and rate limiting."""
import redis.asyncio as aioredis
from app.core.config import settings
from loguru import logger

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis | None:
    global _redis
    if _redis is None:
        try:
            _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
            await _redis.ping()
        except Exception as e:
            logger.warning(f"Redis unavailable — refresh token rotation disabled: {e}")
            _redis = None
    return _redis


async def close_redis():
    global _redis
    if _redis:
        await _redis.aclose()
        _redis = None
