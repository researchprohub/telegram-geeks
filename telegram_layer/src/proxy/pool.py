"""Database-backed proxy pool with health checking and assignment."""

import asyncio
import time
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, or_, select

from app.models import Proxy


class ProxyPool:
    """Database-backed proxy pool with health checking, assignment, and rotation."""

    def __init__(self, db_session_factory, check_interval: int = 300, config_service=None):
        self._session_factory = db_session_factory
        self._check_interval = check_interval
        self._lock = asyncio.Lock()
        self._config_service = config_service

    async def get_healthy_proxy(self, account_id: int, country: str | None = None) -> dict | None:
        """Find and assign a healthy (or slow) proxy to the given account."""
        async with self._session_factory() as session:
            now = datetime.now(timezone.utc)
            conditions = [
                or_(Proxy.expires_at.is_(None), Proxy.expires_at > now),
                or_(
                    Proxy.allocated_to_account_id.is_(None),
                    Proxy.allocated_to_account_id == account_id,
                ),
                Proxy.status.in_(["healthy", "slow"]),
            ]
            if country:
                conditions.append(Proxy.country == country)

            stmt = (
                select(Proxy)
                .where(and_(*conditions))
                .order_by(Proxy.last_checked.asc().nullsfirst())
                .limit(1)
            )
            result = await session.execute(stmt)
            proxy = result.scalar_one_or_none()
            if proxy is None:
                return None

            proxy.allocated_to_account_id = account_id
            proxy.allocated_at = datetime.now(timezone.utc)
            await session.commit()
            return self._to_dict(proxy)

    async def release_proxy(self, proxy_id: int) -> None:
        """Release a proxy from its assigned account."""
        async with self._session_factory() as session:
            result = await session.execute(select(Proxy).where(Proxy.id == proxy_id))
            proxy = result.scalar_one_or_none()
            if proxy is None:
                return
            proxy.allocated_to_account_id = None
            proxy.allocated_at = None
            await session.commit()

    async def check_proxy(self, proxy_id: int) -> dict:
        """Check a single proxy's connectivity and update health status."""
        async with self._session_factory() as session:
            result = await session.execute(select(Proxy).where(Proxy.id == proxy_id))
            proxy = result.scalar_one_or_none()
            if proxy is None:
                raise ValueError(f"Proxy {proxy_id} not found")

            timeout = self._cfg("timeout", 10)
            start = time.monotonic()
            try:
                _, writer = await asyncio.wait_for(
                    asyncio.open_connection(proxy.host, proxy.port),
                    timeout=timeout,
                )
                writer.close()
                await writer.wait_closed()
                response_time_ms = int((time.monotonic() - start) * 1000)
                proxy.success_count = (proxy.success_count or 0) + 1
            except (asyncio.TimeoutError, ConnectionError, OSError):
                response_time_ms = int((time.monotonic() - start) * 1000)
                proxy.fail_count = (proxy.fail_count or 0) + 1

            proxy.status = self._compute_status(proxy, response_time_ms)
            proxy.response_time_ms = response_time_ms
            proxy.last_checked = datetime.now(timezone.utc)
            await session.commit()
            return self._to_dict(proxy)

    async def run_health_checks(self) -> None:
        """Check all proxies due for a health check (not dead, not recently checked)."""
        async with self._lock:
            cutoff = datetime.now(timezone.utc) - timedelta(seconds=self._check_interval)
            async with self._session_factory() as session:
                stmt = select(Proxy.id).where(
                    and_(
                        or_(Proxy.expires_at.is_(None), Proxy.expires_at > datetime.now(timezone.utc)),
                        Proxy.status != "dead",
                        or_(
                            Proxy.last_checked.is_(None),
                            Proxy.last_checked < cutoff,
                        ),
                    )
                )
                result = await session.execute(stmt)
                proxy_ids = [row[0] for row in result]

            sem = asyncio.Semaphore(20)

            async def _check(pid: int):
                async with sem:
                    await self.check_proxy(pid)

            await asyncio.gather(*[_check(pid) for pid in proxy_ids])

    async def get_stats(self) -> dict:
        """Return pool stats grouped by status, provider, and country."""
        async with self._session_factory() as session:
            now = datetime.now(timezone.utc)
            active = or_(Proxy.expires_at.is_(None), Proxy.expires_at > now)

            status_counts = dict(
                (
                    await session.execute(
                        select(Proxy.status, func.count(Proxy.id))
                        .where(active)
                        .group_by(Proxy.status)
                    )
                ).all()
            )
            provider_counts = dict(
                (
                    await session.execute(
                        select(Proxy.provider, func.count(Proxy.id))
                        .where(active)
                        .group_by(Proxy.provider)
                    )
                ).all()
            )
            country_counts = dict(
                (
                    await session.execute(
                        select(Proxy.country, func.count(Proxy.id))
                        .where(active)
                        .group_by(Proxy.country)
                    )
                ).all()
            )
            total = (
                await session.execute(select(func.count(Proxy.id)).where(active))
            ).scalar()

            return {
                "total": total,
                "by_status": status_counts,
                "by_provider": provider_counts,
                "by_country": country_counts,
            }

    def _cfg(self, key: str, default):
        return self._config_service.get("proxy", key) if self._config_service else default

    def _compute_status(self, proxy, response_time_ms: int) -> str:
        total = (proxy.success_count or 0) + (proxy.fail_count or 0)
        fail_rate = (proxy.fail_count or 0) / total if total > 0 else 0
        if (proxy.fail_count or 0) >= 10:
            return "dead"
        if fail_rate > 0.5:
            return "failing"
        if response_time_ms > 5000:
            return "slow"
        return "healthy"

    def _to_dict(self, proxy) -> dict:
        d = {c.name: getattr(proxy, c.name) for c in proxy.__table__.columns}
        for k, v in d.items():
            if isinstance(v, datetime):
                d[k] = v.isoformat()
        return d
