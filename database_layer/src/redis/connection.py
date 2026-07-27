"""Redis connection and queue management."""

import json
import uuid
from typing import Optional

import redis.asyncio as aioredis
from loguru import logger


class RedisManager:
    """Manages Redis connections, queues, caching, and pub/sub."""

    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.redis_url = redis_url
        self._pool: Optional[aioredis.Redis] = None

    async def connect(self):
        """Establish Redis connection pool."""
        self._pool = aioredis.from_url(
            self.redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=50,
        )
        await self._pool.ping()
        logger.info("Connected to Redis")

    async def disconnect(self):
        """Close Redis connection."""
        if self._pool:
            await self._pool.close()
            logger.info("Disconnected from Redis")

    @property
    def client(self) -> aioredis.Redis:
        if not self._pool:
            raise RuntimeError("Redis not connected")
        return self._pool

    # ── Queue Operations ──────────────────────────────────────

    async def enqueue(self, queue_name: str, payload: dict, priority: int = 0) -> str:
        """Add a task to a Redis queue."""
        task_id = str(uuid.uuid4())
        task = {
            "id": task_id,
            "payload": payload,
            "priority": priority,
            "created_at": __import__("datetime").datetime.utcnow().isoformat(),
        }
        # Use ZSET for priority queue
        await self._pool.zadd(f"queue:{queue_name}", {json.dumps(task): -priority})
        return task_id

    async def dequeue(self, queue_name: str, timeout: int = 1) -> Optional[dict]:
        """Get and remove the highest-priority task from a queue."""
        result = await self._pool.zpopmin(f"queue:{queue_name}", count=1)
        if result:
            task_data, score = result[0]
            return json.loads(task_data)
        return None

    async def queue_length(self, queue_name: str) -> int:
        return await self._pool.zcard(f"queue:{queue_name}")

    # ── Cache Operations ──────────────────────────────────────

    async def cache_set(self, key: str, value: str, ttl: int = 300):
        await self._pool.setex(key, ttl, value)

    async def cache_get(self, key: str) -> Optional[str]:
        return await self._pool.get(key)

    async def cache_delete(self, key: str):
        await self._pool.delete(key)

    async def cache_increment(self, key: str, amount: int = 1) -> int:
        return await self._pool.incr(key, amount)

    # ── Pub/Sub ───────────────────────────────────────────────

    async def publish(self, channel: str, message: str):
        await self._pool.publish(channel, message)

    async def subscribe(self, channel: str):
        pubsub = self._pool.pubsub()
        await pubsub.subscribe(channel)
        return pubsub
