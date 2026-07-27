"""Smart proxy rotator with health monitoring."""

import asyncio
import random
from typing import Optional
from loguru import logger


class ProxyRotator:
    """Rotates proxies per account with health tracking."""

    def __init__(self, max_pool_size: int = 50):
        self.pool: list[dict] = []
        self._account_proxies: dict[str, int] = {}  # account_id -> pool index
        self._max_pool_size = max_pool_size

    def add_proxy(self, proxy: dict) -> bool:
        """Add a proxy to the rotation pool."""
        if len(self.pool) >= self._max_pool_size:
            return False
        proxy.setdefault("healthy", True)
        proxy.setdefault("usage_count", 0)
        self.pool.append(proxy)
        logger.info(f"Added proxy: {proxy.get('host')}:{proxy.get('port')}")
        return True

    def get_proxy_for_account(self, account_id: str) -> Optional[dict]:
        """Get a rotating proxy for a specific account."""
        if not self.pool:
            return None

        if account_id not in self._account_proxies:
            self._account_proxies[account_id] = random.randint(0, len(self.pool) - 1)

        # Rotate to next healthy proxy
        start_idx = self._account_proxies[account_id]
        for i in range(len(self.pool)):
            idx = (start_idx + i) % len(self.pool)
            if self.pool[idx].get("healthy", True):
                self._account_proxies[account_id] = idx
                self.pool[idx]["usage_count"] += 1
                return self.pool[idx]

        return None

    def mark_unhealthy(self, proxy_index: int):
        """Mark a proxy as unhealthy."""
        if 0 <= proxy_index < len(self.pool):
            self.pool[proxy_index]["healthy"] = False
            logger.warning(f"Proxy {proxy_index} marked unhealthy")

    def rotate_account_proxy(self, account_id: str):
        """Force rotate an account's proxy."""
        if self.pool:
            self._account_proxies[account_id] = random.randint(0, len(self.pool) - 1)
            logger.info(f"Rotated proxy for account {account_id}")

    def get_stats(self) -> dict:
        return {
            "total_proxies": len(self.pool),
            "healthy": sum(1 for p in self.pool if p.get("healthy")),
            "accounts_with_proxy": len(self._account_proxies),
        }
