"""Policy-driven proxy assignment layer on top of ProxyPool."""

import time
from typing import TypedDict


class ProxyAssignmentPolicy(TypedDict, total=False):
    geo_targeting: bool
    rotation_interval: int
    sticky: bool
    fail_over_threshold: int
    max_proxies_per_account: int


DEFAULT_POLICY: ProxyAssignmentPolicy = {
    "geo_targeting": True,
    "rotation_interval": 1800,
    "sticky": True,
    "fail_over_threshold": 3,
    "max_proxies_per_account": 5,
}


class ProxyAssignmentEngine:
    """Thin policy layer on top of ProxyPool for account-level proxy assignment."""

    def __init__(self, pool, hub):
        self._pool = pool
        self._hub = hub
        self._assignments: dict[int, list[dict]] = {}

    async def assign_for_account(
        self,
        account_id: int,
        country: str | None = None,
        policy: ProxyAssignmentPolicy | None = None,
    ) -> dict | None:
        policy = policy or DEFAULT_POLICY

        if policy.get("sticky", True):
            for p in self._assignments.get(account_id, []):
                if p.get("status") in ("healthy", "slow"):
                    return p

        max_proxies = policy.get("max_proxies_per_account", 5)
        if len(self._assignments.get(account_id, [])) >= max_proxies:
            return None

        geo = country if policy.get("geo_targeting", True) else None
        proxy = await self._pool.get_healthy_proxy(account_id, geo)
        if proxy is None:
            return None

        proxy["assigned_at"] = time.time()
        proxy["policy"] = dict(policy)
        self._assignments.setdefault(account_id, []).append(proxy)
        return proxy

    async def release_account(self, account_id: int) -> None:
        for p in self._assignments.pop(account_id, []):
            await self._pool.release_proxy(p["id"])

    async def get_account_proxies(self, account_id: int) -> list[dict]:
        return self._assignments.get(account_id, [])

    async def run_policy_checks(self) -> None:
        now = time.time()
        for account_id in list(self._assignments.keys()):
            kept = []
            for p in self._assignments[account_id]:
                policy = p.get("policy", DEFAULT_POLICY)
                interval = policy.get("rotation_interval", 1800)
                if (now - p.get("assigned_at", 0)) >= interval:
                    await self._pool.release_proxy(p["id"])
                    continue
                threshold = policy.get("fail_over_threshold", 3)
                if (p.get("fail_count") or 0) >= threshold:
                    await self._pool.release_proxy(p["id"])
                    continue
                kept.append(p)
            if kept:
                self._assignments[account_id] = kept
            else:
                del self._assignments[account_id]

    async def get_assignment_stats(self) -> dict:
        total = sum(len(v) for v in self._assignments.values())
        return {
            "total_assignments": total,
            "active_assignments": total,
            "accounts_count": len(self._assignments),
        }
