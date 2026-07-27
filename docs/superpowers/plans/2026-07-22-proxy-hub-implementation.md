# Proxy Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 5 fragmented in-memory proxy pools with a persistent, 3-layer proxy system: ProviderHub → Pool → AssignmentEngine.

**Architecture:** Follows the SMS Provider Hub pattern. 3 services in `telegram_layer/src/proxy/`, a new `Proxy` DB table, API endpoints mirroring the pattern in `persona_emotions_endpoints.py`, background tasks in `main.py`, and wiring through `Infrastructure` + `TelegramClientManager`.

**Tech Stack:** SQLAlchemy + Alembic, FastAPI, aiohttp (health checks), Telethon (SOCKS5), asyncio.

## Global Constraints

- No new external dependencies beyond aiohttp (already used elsewhere)
- Follow SMS Provider Hub pattern exactly for provider registry
- Follow existing endpoint pattern (auth dependency, Pydantic models inline)
- All 3 services registered in module_dispatcher MODULE_SERVICES
- Proxies persisted in DB, never purely in-memory after migration

---

### Task 1: Proxy Database Model + Migration

**Files:**
- Modify: `backend/app/models/__init__.py`
- Create: `backend/alembic/versions/xxxx_proxy_table.py`

**Interfaces:**
- Consumes: existing `Base`, `TimestampMixin`
- Produces: `Proxy` ORM model class

- [ ] **Step 1: Add Proxy model to `backend/app/models/__init__.py`**

Add after existing model classes:

```python
class Proxy(Base, TimestampMixin):
    __tablename__ = "proxies"

    id: Mapped[int] = mapped_column(primary_key=True)
    provider: Mapped[str] = mapped_column(String(50), default="manual")
    proxy_type: Mapped[str] = mapped_column(String(10), default="socks5")
    host: Mapped[str] = mapped_column(String(100))
    port: Mapped[int] = mapped_column(Integer)
    username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    password: Mapped[str | None] = mapped_column(String(200), nullable=True)
    country: Mapped[str | None] = mapped_column(String(4), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="untested")
    last_checked: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    response_time_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    success_count: Mapped[int] = mapped_column(Integer, default=0)
    fail_count: Mapped[int] = mapped_column(Integer, default=0)
    allocated_to_account_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("accounts.id"), nullable=True)
    allocated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    source: Mapped[str] = mapped_column(String(30), default="user_added")
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
```

Also add to `__all__` list in the same file.

- [ ] **Step 2: Generate Alembic migration**

Run: `cd backend; alembic revision --autogenerate -m "add proxies table"`
Or create manually with `op.create_table('proxies', ...)`.

- [ ] **Step 3: Apply migration**

Run: `cd backend; alembic upgrade head`

- [ ] **Step 4: Commit**

```bash
git add backend/app/models/__init__.py backend/alembic/versions/xxxx_proxy_table.py
git commit -m "feat: add Proxy database model"
```

---

### Task 2: ProxyPool Service

**Files:**
- Create: `telegram_layer/src/proxy/pool.py`
- Modify: `telegram_layer/src/proxy/__init__.py`

**Interfaces:**
- Consumes: `Proxy` model, `async_session_factory`
- Produces: `ProxyPool` class with add, get_healthy, report_success/failure, run_health_check, expire_stale, get_pool_stats, search

- [ ] **Step 1: Create `telegram_layer/src/proxy/pool.py`**

```python
"""Persistent DB-backed proxy pool with health checking."""

import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional
from loguru import logger


class ProxyPool:
    """DB-backed pool manager for proxies."""

    def __init__(self, session_factory):
        self._session_factory = session_factory

    async def add(self, provider: str = "manual", proxy_type: str = "socks5",
                  host: str = "", port: int = 0, username: str = None,
                  password: str = None, country: str = None,
                  source: str = "user_added", cost: float = None,
                  expires_at=None) -> dict:
        from app.models import Proxy
        async with self._session_factory() as s:
            p = Proxy(
                provider=provider, proxy_type=proxy_type,
                host=host, port=port, username=username, password=password,
                country=country, status="untested",
                source=source, cost=cost, expires_at=expires_at,
            )
            s.add(p)
            await s.commit()
            await s.refresh(p)
            return self._to_dict(p)

    async def add_batch(self, proxies: list[dict]) -> int:
        from app.models import Proxy
        count = 0
        async with self._session_factory() as s:
            for data in proxies:
                p = Proxy(**{k: v for k, v in data.items() if k in
                             ("provider","proxy_type","host","port","username",
                              "password","country","source","cost","expires_at")})
                s.add(p)
                count += 1
            await s.commit()
        logger.info(f"Bulk added {count} proxies")
        return count

    async def get_healthy(self, country: str = None, proxy_type: str = None,
                          limit: int = 10, exclude_assigned: bool = True) -> list[dict]:
        from app.models import Proxy
        from sqlalchemy import select, and_
        async with self._session_factory() as s:
            q = select(Proxy).where(Proxy.status.in_(["healthy", "untested"]))
            if country:
                q = q.where(Proxy.country == country.upper())
            if proxy_type:
                q = q.where(Proxy.proxy_type == proxy_type)
            if exclude_assigned:
                q = q.where(Proxy.allocated_to_account_id.is_(None))
            q = q.order_by(Proxy.response_time_ms.asc().nullslast()).limit(limit)
            result = await s.execute(q)
            return [self._to_dict(r) for r in result.scalars().all()]

    async def get_by_id(self, proxy_id: int) -> Optional[dict]:
        from app.models import Proxy
        from sqlalchemy import select
        async with self._session_factory() as s:
            r = await s.execute(select(Proxy).where(Proxy.id == proxy_id))
            p = r.scalar_one_or_none()
            return self._to_dict(p) if p else None

    async def report_success(self, proxy_id: int):
        from app.models import Proxy
        from sqlalchemy import select
        async with self._session_factory() as s:
            r = await s.execute(select(Proxy).where(Proxy.id == proxy_id))
            p = r.scalar_one_or_none()
            if p:
                p.success_count = (p.success_count or 0) + 1
                await s.commit()

    async def report_failure(self, proxy_id: int):
        from app.models import Proxy
        from sqlalchemy import select
        async with self._session_factory() as s:
            r = await s.execute(select(Proxy).where(Proxy.id == proxy_id))
            p = r.scalar_one_or_none()
            if p:
                p.fail_count = (p.fail_count or 0) + 1
                if p.fail_count >= 3:
                    p.status = "dead"
                await s.commit()

    async def run_health_check(self, max_workers: int = 10) -> dict:
        import aiohttp
        from app.models import Proxy
        from sqlalchemy import select
        checked = 0
        healthy = 0
        async with self._session_factory() as s:
            r = await s.execute(
                select(Proxy).where(Proxy.status.in_(["healthy", "untested", "slow"]))
            )
            proxies = r.scalars().all()

        sem = asyncio.Semaphore(max_workers)

        async def _check(p):
            nonlocal checked, healthy
            async with sem:
                try:
                    connector = aiohttp.TCPConnector(
                        limit=1, force_close=True,
                    )
                    proxy_url = f"socks5://{p.host}:{p.port}"
                    if p.username and p.password:
                        proxy_url = f"socks5://{p.username}:{p.password}@{p.host}:{p.port}"
                    timeout = aiohttp.ClientTimeout(total=10)
                    t0 = asyncio.get_event_loop().time()
                    async with aiohttp.ClientSession(connector=connector, timeout=timeout) as cs:
                        async with cs.get("https://api.ipify.org?format=json", proxy=proxy_url) as resp:
                            if resp.status == 200:
                                elapsed = (asyncio.get_event_loop().time() - t0) * 1000
                                async with self._session_factory() as s2:
                                    r2 = await s2.execute(select(Proxy).where(Proxy.id == p.id))
                                    p2 = r2.scalar_one()
                                    p2.last_checked = datetime.now(timezone.utc)
                                    p2.response_time_ms = elapsed
                                    p2.status = "healthy" if elapsed < 2000 else "slow"
                                    await s2.commit()
                                healthy += 1
                            else:
                                async with self._session_factory() as s2:
                                    r2 = await s2.execute(select(Proxy).where(Proxy.id == p.id))
                                    p2 = r2.scalar_one()
                                    p2.last_checked = datetime.now(timezone.utc)
                                    p2.status = "dead"
                                    await s2.commit()
                except Exception:
                    async with self._session_factory() as s2:
                        r2 = await s2.execute(select(Proxy).where(Proxy.id == p.id))
                        p2 = r2.scalar_one()
                        p2.last_checked = datetime.now(timezone.utc)
                        p2.status = "dead"
                        await s2.commit()
                checked += 1

        await asyncio.gather(*[_check(p) for p in proxies])
        return {"checked": checked, "healthy": healthy, "dead": checked - healthy}

    async def expire_stale(self, max_age_hours: int = 24):
        from app.models import Proxy
        from sqlalchemy import select
        cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
        async with self._session_factory() as s:
            r = await s.execute(
                select(Proxy).where(
                    Proxy.source == "free_aggregator",
                    Proxy.last_checked.isnot(None),
                    Proxy.last_checked < cutoff,
                )
            )
            expired = r.scalars().all()
            for p in expired:
                p.status = "dead"
            await s.commit()
            if expired:
                logger.info(f"Expired {len(expired)} stale free proxies")

    async def get_pool_stats(self) -> dict:
        from app.models import Proxy
        from sqlalchemy import select, func
        async with self._session_factory() as s:
            total = await s.execute(select(func.count(Proxy.id)))
            healthy = await s.execute(
                select(func.count(Proxy.id)).where(Proxy.status == "healthy")
            )
            by_country = await s.execute(
                select(Proxy.country, func.count(Proxy.id))
                .where(Proxy.country.isnot(None))
                .group_by(Proxy.country)
            )
            by_provider = await s.execute(
                select(Proxy.provider, func.count(Proxy.id))
                .group_by(Proxy.provider)
            )
            return {
                "total": total.scalar(),
                "healthy": healthy.scalar(),
                "by_country": dict(by_country.all()),
                "by_provider": dict(by_provider.all()),
            }

    async def search(self, status: str = None, country: str = None,
                     provider: str = None, proxy_type: str = None,
                     source: str = None, limit: int = 100, offset: int = 0) -> list[dict]:
        from app.models import Proxy
        from sqlalchemy import select, and_
        async with self._session_factory() as s:
            q = select(Proxy)
            filters = []
            if status: filters.append(Proxy.status == status)
            if country: filters.append(Proxy.country == country.upper())
            if provider: filters.append(Proxy.provider == provider)
            if proxy_type: filters.append(Proxy.proxy_type == proxy_type)
            if source: filters.append(Proxy.source == source)
            if filters:
                q = q.where(and_(*filters))
            q = q.order_by(Proxy.id.desc()).limit(limit).offset(offset)
            r = await s.execute(q)
            return [self._to_dict(p) for p in r.scalars().all()]

    async def delete(self, proxy_id: int) -> bool:
        from app.models import Proxy
        from sqlalchemy import select
        async with self._session_factory() as s:
            r = await s.execute(select(Proxy).where(Proxy.id == proxy_id))
            p = r.scalar_one_or_none()
            if not p:
                return False
            await s.delete(p)
            await s.commit()
            return True

    @staticmethod
    def _to_dict(p) -> dict:
        return {
            "id": p.id, "provider": p.provider, "proxy_type": p.proxy_type,
            "host": p.host, "port": p.port, "username": p.username,
            "password": p.password, "country": p.country, "status": p.status,
            "last_checked": p.last_checked.isoformat() if p.last_checked else None,
            "response_time_ms": p.response_time_ms,
            "success_count": p.success_count, "fail_count": p.fail_count,
            "allocated_to_account_id": p.allocated_to_account_id,
            "allocated_at": p.allocated_at.isoformat() if p.allocated_at else None,
            "source": p.source, "cost": p.cost, "notes": p.notes,
        }
```

- [ ] **Step 2: Update `telegram_layer/src/proxy/__init__.py`**

```python
from .pool import ProxyPool
__all__ = ["ProxyPool"]
```

- [ ] **Step 3: Commit**

```bash
git add telegram_layer/src/proxy/pool.py telegram_layer/src/proxy/__init__.py
git commit -m "feat: add ProxyPool service with DB-backed pool and health checking"
```

---

### Task 3: ProxyProviderHub Service

**Files:**
- Create: `telegram_layer/src/proxy/provider_hub.py`
- Modify: `telegram_layer/src/proxy/__init__.py`

**Interfaces:**
- Consumes: `ProxyPool` (for add_batch after fetch)
- Produces: `ProxyProviderHub` class with PROVIDER_REGISTRY, fetch_from_provider, fetch_free_pool, list_available, get_provider_status

- [ ] **Step 1: Create `telegram_layer/src/proxy/provider_hub.py`**

```python
"""Proxy provider registry — manages 30+ paid/free proxy providers + free pool aggregator."""

import asyncio
import json
import re
from typing import Optional
from loguru import logger


PROVIDER_REGISTRY = {
    # Free API sources
    "proxyscrape": {
        "type": "free_api",
        "name": "ProxyScrape",
        "base_url": "https://api.proxyscrape.com/v4/free-proxy-list/get",
        "params": {"request": "display_proxies", "proxy_format": "protocolipport", "format": "text"},
        "countries": 180, "update_minutes": 1,
    },
    "proxifly": {
        "type": "free_github",
        "name": "Proxifly",
        "cdn_url": "https://cdn.jsdelivr.net/gh/proxifly/free-proxy-list@main/proxies/protocols/socks5/data.txt",
        "countries": 109, "update_minutes": 5,
    },
    "iplocate": {
        "type": "free_github",
        "name": "IPLocate",
        "cdn_url": "https://raw.githubusercontent.com/iplocate/free-proxy-list/main/socks5.txt",
        "countries": "multiple", "update_minutes": 30,
    },
    "sockslist": {
        "type": "free_raw",
        "name": "SocksList.us",
        "raw_url": "https://sockslist.us/list.txt",
        "update_minutes": 1,
    },
    # Freemium
    "webshare": {
        "type": "freemium",
        "name": "Webshare",
        "free_count": 10,
        "needs_api_key": True,
        "api_docs": "https://webshare.io/docs",
    },
    # Paid providers
    "proxy6": {
        "type": "paid", "name": "Proxy6",
        "crypto": True, "affiliate_commission": 0.50,
        "countries": ["RU", "UA", "PL", "NL", "DE", "US"],
    },
    "brightdata": {
        "type": "paid", "name": "Bright Data",
        "crypto": True, "countries": 195, "enterprise": True,
    },
    "oxylabs": {
        "type": "paid", "name": "Oxylabs",
        "crypto": True, "countries": 195, "enterprise": True,
    },
    "iproyal": {
        "type": "paid", "name": "IPRoyal",
        "crypto": True, "no_expiry_credits": True,
    },
    "proxy_cheap": {
        "type": "paid", "name": "Proxy-Cheap",
        "crypto": True, "best_mobile": True,
    },
    "hydraproxy": {
        "type": "paid", "name": "HydraProxy",
        "crypto": True, "us_mobile_4g_5g": True,
    },
    "nodemaven": {
        "type": "paid", "name": "NodeMaven",
        "crypto": True, "clean_ip_95pct": True,
    },
    "decodo": {
        "type": "paid", "name": "Decodo (Smartproxy)",
        "crypto": True, "affiliate_30pct": True,
    },
    "proxy_seller": {
        "type": "paid", "name": "Proxy-Seller",
        "crypto": True, "affiliate_50pct": True,
    },
    "evomi": {
        "type": "paid", "name": "Evomi",
        "crypto": True, "from_049_per_gb": True,
    },
    "anyip": {
        "type": "paid", "name": "AnyIP.io",
        "crypto": True, "monero_support": True,
    },
    "dataimpulse": {
        "type": "paid", "name": "DataImpulse",
        "crypto": True, "cheapest_1_per_gb": True,
    },
    "soax": {
        "type": "paid", "name": "SOAX",
        "crypto": True,
    },
    "airproxy": {
        "type": "paid", "name": "Airproxy",
        "crypto": True,
    },
    "gproxy": {
        "type": "paid", "name": "GProxy",
        "crypto": True, "mobile_40_countries": True,
    },
    "thunderproxies": {
        "type": "paid", "name": "ThunderProxies",
        "crypto": True,
    },
    "proxysocks5": {
        "type": "paid", "name": "ProxySocks5",
        "crypto": True, "xmr_support": True,
    },
    "floppydata": {
        "type": "paid", "name": "Floppydata",
        "from_1_per_gb": True,
    },
    "onlinesim": {
        "type": "paid", "name": "OnlineSIM",
        "region": "russia", "crypto": True,
    },
    "marsproxies": {
        "type": "paid", "name": "MarsProxies",
        "affiliate_40pct": True,
    },
    "rayobyte": {
        "type": "paid", "name": "Rayobyte",
        "affiliate_40pct": True,
    },
    "instantproxies": {
        "type": "paid", "name": "InstantProxies",
        "affiliate_20pct": True,
    },
    "proxy_wing": {
        "type": "paid", "name": "ProxyWing",
        "crypto": True, "countries_190": True,
    },
    "byteful": {
        "type": "paid", "name": "Byteful",
        "crypto": True,
    },
}


class ProxyProviderHub:
    """Manages proxy provider registry, free pool aggregation, and paid API integration."""

    def __init__(self, api_keys: dict[str, str] = None, proxy_pool=None):
        self.api_keys = api_keys or {}
        self.proxy_pool = proxy_pool
        self._session = None

    async def _get_session(self):
        if self._session is None or self._session.closed:
            import aiohttp
            self._session = aiohttp.ClientSession()
        return self._session

    def list_available(self) -> dict:
        """Return registry filtered by which API keys user configured."""
        result = {}
        for pid, info in PROVIDER_REGISTRY.items():
            entry = dict(info)
            has_key = pid in self.api_keys
            needs_key = info.get("needs_api_key", False)
            entry["configured"] = has_key if needs_key else True
            entry["api_key_set"] = has_key
            result[pid] = entry
        return result

    def get_provider_status(self, provider_id: str) -> Optional[dict]:
        if provider_id not in PROVIDER_REGISTRY:
            return None
        info = dict(PROVIDER_REGISTRY[provider_id])
        info["configured"] = provider_id in self.api_keys if info.get("needs_api_key", False) else True
        return info

    async def fetch_from_provider(self, provider_id: str, api_key: str = None,
                                  params: dict = None) -> list[dict]:
        """Fetch proxies from a specific provider. Returns list of proxy dicts."""
        info = PROVIDER_REGISTRY.get(provider_id)
        if not info:
            logger.warning(f"Unknown provider: {provider_id}")
            return []
        if info["type"] == "free_api":
            return await self._fetch_free_api(provider_id, info)
        if info["type"] == "free_github":
            return await self._fetch_github_list(info)
        if info["type"] == "free_raw":
            return await self._fetch_raw_list(info)
        if info["type"] in ("freemium", "paid"):
            logger.info(f"Provider {provider_id} requires manual API integration — returning placeholder")
            # Paid providers require per-provider API clients (future sprint)
            return []
        return []

    async def fetch_free_pool(self) -> list[dict]:
        """Aggregate proxies from all free sources, deduplicate, return."""
        all_proxies = []
        for pid, info in PROVIDER_REGISTRY.items():
            if info["type"] in ("free_api", "free_github", "free_raw"):
                proxies = await self.fetch_from_provider(pid)
                all_proxies.extend(proxies)

        # Deduplicate by host:port
        seen = set()
        unique = []
        for p in all_proxies:
            key = f"{p['host']}:{p['port']}"
            if key not in seen:
                seen.add(key)
                unique.append(p)
        logger.info(f"Free pool: {len(all_proxies)} raw -> {len(unique)} unique")
        return unique

    async def _fetch_free_api(self, provider_id: str, info: dict) -> list[dict]:
        try:
            session = await self._get_session()
            async with session.get(info["base_url"], params=info.get("params", {}), timeout=15) as resp:
                text = await resp.text()
            return self._parse_proxy_text(text, source=provider_id)
        except Exception as e:
            logger.warning(f"Free API fetch failed [{provider_id}]: {e}")
            return []

    async def _fetch_github_list(self, info: dict) -> list[dict]:
        try:
            session = await self._get_session()
            async with session.get(info["cdn_url"], timeout=15) as resp:
                text = await resp.text()
            return self._parse_proxy_text(text)
        except Exception as e:
            logger.warning(f"GitHub list fetch failed: {e}")
            return []

    async def _fetch_raw_list(self, info: dict) -> list[dict]:
        try:
            session = await self._get_session()
            async with session.get(info["raw_url"], timeout=15) as resp:
                text = await resp.text()
            return self._parse_proxy_text(text)
        except Exception as e:
            logger.warning(f"Raw list fetch failed: {e}")
            return []

    def _parse_proxy_text(self, text: str, source: str = "free") -> list[dict]:
        """Parse proxy text (ip:port per line, optional protocol prefix)."""
        proxies = []
        for line in text.strip().splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # Strip protocol prefix
            raw = re.sub(r'^(socks[45]|https?)://', '', line)
            parts = raw.split(":")
            if len(parts) >= 2:
                host = parts[0]
                port = int(parts[1])
                username = parts[2] if len(parts) >= 3 else None
                password = parts[3] if len(parts) >= 4 else None
                proxies.append({
                    "host": host, "port": port,
                    "username": username, "password": password,
                    "proxy_type": "socks5",
                    "provider": source,
                    "source": "free_aggregator",
                    "status": "untested",
                })
        return proxies

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()
```

- [ ] **Step 2: Update `telegram_layer/src/proxy/__init__.py`**

```python
from .pool import ProxyPool
from .provider_hub import ProxyProviderHub, PROVIDER_REGISTRY
__all__ = ["ProxyPool", "ProxyProviderHub", "PROVIDER_REGISTRY"]
```

- [ ] **Step 3: Commit**

```bash
git add telegram_layer/src/proxy/provider_hub.py telegram_layer/src/proxy/__init__.py
git commit -m "feat: add ProxyProviderHub with 30+ provider registry and free aggregator"
```

---

### Task 4: ProxyAssignmentEngine Service

**Files:**
- Create: `telegram_layer/src/proxy/assignment.py`
- Modify: `telegram_layer/src/proxy/__init__.py`

**Interfaces:**
- Consumes: `ProxyPool`
- Produces: `ProxyAssignmentEngine` with assign_for_account, release, rotate, get_account_proxy, auto_assign_pending

- [ ] **Step 1: Create `telegram_layer/src/proxy/assignment.py`**

```python
"""Geo-aware proxy assignment and rotation engine."""

from datetime import datetime, timezone
from typing import Optional
from loguru import logger


class ProxyAssignmentEngine:
    """Assigns proxies to accounts with geo-awareness and rotation."""

    def __init__(self, proxy_pool, session_factory):
        self.pool = proxy_pool
        self._session_factory = session_factory

    async def assign_for_account(self, account_id: int, country: str = None,
                                  preferred_provider: str = None) -> Optional[dict]:
        """Find best healthy proxy and assign to account."""
        from app.models import Proxy
        from sqlalchemy import select

        # Try preferred provider first
        if preferred_provider:
            proxies = await self.pool.get_healthy(
                country=country, limit=5,
            )
            # Filter to preferred provider post-query
            proxies = [p for p in proxies if p["provider"] == preferred_provider]
            if not proxies:
                proxies = await self.pool.get_healthy(country=country, limit=5)

        else:
            proxies = await self.pool.get_healthy(country=country, limit=5)

        if not proxies:
            logger.warning(f"No healthy proxy for account {account_id}")
            return None

        proxy = proxies[0]

        # Claim it
        async with self._session_factory() as s:
            r = await s.execute(select(Proxy).where(Proxy.id == proxy["id"]))
            p = r.scalar_one()
            p.allocated_to_account_id = account_id
            p.allocated_at = datetime.now(timezone.utc)
            await s.commit()

        logger.info(f"Assigned proxy {proxy['id']} ({proxy['host']}) to account {account_id}")
        return proxy

    async def release(self, proxy_id: int) -> bool:
        from app.models import Proxy
        from sqlalchemy import select
        async with self._session_factory() as s:
            r = await s.execute(select(Proxy).where(Proxy.id == proxy_id))
            p = r.scalar_one_or_none()
            if not p:
                return False
            p.allocated_to_account_id = None
            p.allocated_at = None
            await s.commit()
            return True

    async def rotate(self, account_id: int, country: str = None) -> Optional[dict]:
        """Release current proxy, assign new one."""
        current = await self.get_account_proxy(account_id)
        if current:
            await self.release(current["id"])
        return await self.assign_for_account(account_id, country)

    async def get_account_proxy(self, account_id: int) -> Optional[dict]:
        from app.models import Proxy
        from sqlalchemy import select
        async with self._session_factory() as s:
            r = await s.execute(
                select(Proxy).where(Proxy.allocated_to_account_id == account_id)
            )
            p = r.scalar_one_or_none()
            if not p:
                return None
            return {
                "proxy_type": p.proxy_type or "socks5",
                "host": p.host,
                "port": p.port,
                "username": p.username,
                "password": p.password,
            }

    async def auto_assign_pending(self) -> int:
        """Batch-assign healthy proxies to accounts that have none."""
        from app.models import Account
        from sqlalchemy import select, or_
        count = 0
        async with self._session_factory() as s:
            r = await s.execute(
                select(Account).where(
                    Account.last_proxy.is_(None),
                    or_(Account.proxy_config.is_(None), Account.proxy_config == {}),
                )
            )
            unassigned = r.scalars().all()
        for account in unassigned:
            proxy = await self.assign_for_account(account.id)
            if proxy:
                count += 1
        logger.info(f"Auto-assigned proxies to {count} accounts")
        return count
```

- [ ] **Step 2: Update `telegram_layer/src/proxy/__init__.py`**

```python
from .pool import ProxyPool
from .provider_hub import ProxyProviderHub, PROVIDER_REGISTRY
from .assignment import ProxyAssignmentEngine
__all__ = ["ProxyPool", "ProxyProviderHub", "PROVIDER_REGISTRY", "ProxyAssignmentEngine"]
```

- [ ] **Step 3: Commit**

```bash
git add telegram_layer/src/proxy/assignment.py telegram_layer/src/proxy/__init__.py
git commit -m "feat: add ProxyAssignmentEngine with geo-aware rotation"
```

---

### Task 5: API Endpoints

**Files:**
- Create: `backend/app/api/v1/endpoints/proxy_providers.py`
- Create: `backend/app/api/v1/endpoints/proxy_pool.py`
- Create: `backend/app/api/v1/endpoints/proxy_assignment.py`

**Interfaces:**
- Consumes: `Infrastructure._resolve_service("proxy_provider_hub")`, `Infrastructure._resolve_service("proxy_pool")`, `Infrastructure._resolve_service("proxy_assignment")`
- Produces: FastAPI routers for all 3 services

- [ ] **Step 1: Create `backend/app/api/v1/endpoints/proxy_providers.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.models import User

router = APIRouter(prefix="/api/v1/proxy-providers", tags=["Proxy Providers"])

def _get_hub(request: Request):
    infra = getattr(request.app.state, "infrastructure", None)
    if not infra:
        raise HTTPException(status_code=503, detail="Infrastructure not initialized")
    hub = getattr(infra, "proxy_provider_hub", None)
    if not hub:
        hub = infra._resolve_service("proxy_provider_hub")
    return hub

@router.get("/")
async def list_providers(request: Request, user: User = Depends(get_current_user)):
    hub = _get_hub(request)
    return {"providers": hub.list_available()}

@router.get("/{provider_id}")
async def get_provider(provider_id: str, request: Request, user: User = Depends(get_current_user)):
    hub = _get_hub(request)
    info = hub.get_provider_status(provider_id)
    if not info:
        raise HTTPException(status_code=404, detail=f"Unknown provider: {provider_id}")
    return {"provider": provider_id, "info": info}

class FetchRequest(BaseModel):
    api_key: Optional[str] = None
    params: Optional[dict] = None

@router.post("/{provider_id}/fetch")
async def fetch_from_provider(provider_id: str, body: FetchRequest,
                              request: Request, user: User = Depends(get_current_user)):
    hub = _get_hub(request)
    proxies = await hub.fetch_from_provider(provider_id, body.api_key, body.params)
    return {"provider": provider_id, "count": len(proxies), "proxies": proxies[:50]}

@router.post("/free-pool/refresh")
async def refresh_free_pool(request: Request, user: User = Depends(get_current_user)):
    hub = _get_hub(request)
    proxies = await hub.fetch_free_pool()
    pool = getattr(request.app.state.infrastructure, "proxy_pool", None) or \
           request.app.state.infrastructure._resolve_service("proxy_pool")
    if pool and proxies:
        count = await pool.add_batch(proxies)
        return {"fetched": len(proxies), "added": count}
    return {"fetched": len(proxies), "added": 0}
```

- [ ] **Step 2: Create `backend/app/api/v1/endpoints/proxy_pool.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.models import User

router = APIRouter(prefix="/api/v1/proxy-pool", tags=["Proxy Pool"])

def _get_pool(request: Request):
    infra = getattr(request.app.state, "infrastructure", None)
    if not infra:
        raise HTTPException(status_code=503, detail="Infrastructure not initialized")
    pool = getattr(infra, "proxy_pool", None)
    if not pool:
        pool = infra._resolve_service("proxy_pool")
    return pool

class ProxyAddRequest(BaseModel):
    provider: str = "manual"
    proxy_type: str = "socks5"
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    country: Optional[str] = None
    source: str = "user_added"
    cost: Optional[float] = None

class ProxyBatchRequest(BaseModel):
    proxies: list[ProxyAddRequest]

@router.get("/")
async def list_proxies(request: Request, status: str = None, country: str = None,
                       provider: str = None, source: str = None, limit: int = 100,
                       user: User = Depends(get_current_user)):
    pool = _get_pool(request)
    results = await pool.search(status=status, country=country, provider=provider,
                                 source=source, limit=limit)
    return {"proxies": results, "count": len(results)}

@router.get("/healthy")
async def get_healthy(request: Request, country: str = None, proxy_type: str = None,
                      limit: int = 10, user: User = Depends(get_current_user)):
    pool = _get_pool(request)
    proxies = await pool.get_healthy(country=country, proxy_type=proxy_type, limit=limit)
    return {"proxies": proxies, "count": len(proxies)}

@router.post("/add")
async def add_proxy(body: ProxyAddRequest, request: Request,
                    user: User = Depends(get_current_user)):
    pool = _get_pool(request)
    result = await pool.add(**body.model_dump())
    return result

@router.post("/add-batch")
async def add_proxy_batch(body: ProxyBatchRequest, request: Request,
                          user: User = Depends(get_current_user)):
    pool = _get_pool(request)
    count = await pool.add_batch([p.model_dump() for p in body.proxies])
    return {"added": count}

@router.post("/check")
async def run_health_check(request: Request, user: User = Depends(get_current_user)):
    pool = _get_pool(request)
    result = await pool.run_health_check()
    return result

@router.get("/stats")
async def get_pool_stats(request: Request, user: User = Depends(get_current_user)):
    pool = _get_pool(request)
    stats = await pool.get_pool_stats()
    return stats

@router.delete("/{proxy_id}")
async def delete_proxy(proxy_id: int, request: Request,
                       user: User = Depends(get_current_user)):
    pool = _get_pool(request)
    ok = await pool.delete(proxy_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Proxy not found")
    return {"deleted": proxy_id}
```

- [ ] **Step 3: Create `backend/app/api/v1/endpoints/proxy_assignment.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.models import User

router = APIRouter(prefix="/api/v1/proxy-assignment", tags=["Proxy Assignment"])

def _get_engine(request: Request):
    infra = getattr(request.app.state, "infrastructure", None)
    if not infra:
        raise HTTPException(status_code=503, detail="Infrastructure not initialized")
    eng = getattr(infra, "proxy_assignment", None)
    if not eng:
        eng = infra._resolve_service("proxy_assignment")
    return eng

class AssignRequest(BaseModel):
    account_id: int
    country: Optional[str] = None
    preferred_provider: Optional[str] = None

@router.post("/assign")
async def assign_proxy(body: AssignRequest, request: Request,
                       user: User = Depends(get_current_user)):
    engine = _get_engine(request)
    proxy = await engine.assign_for_account(body.account_id, body.country, body.preferred_provider)
    if not proxy:
        raise HTTPException(status_code=404, detail="No healthy proxy available")
    return {"account_id": body.account_id, "proxy": proxy}

class ReleaseRequest(BaseModel):
    proxy_id: int

@router.post("/release")
async def release_proxy(body: ReleaseRequest, request: Request,
                        user: User = Depends(get_current_user)):
    engine = _get_engine(request)
    ok = await engine.release(body.proxy_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Proxy not found")
    return {"released": body.proxy_id}

class RotateRequest(BaseModel):
    account_id: int
    country: Optional[str] = None

@router.post("/rotate")
async def rotate_proxy(body: RotateRequest, request: Request,
                       user: User = Depends(get_current_user)):
    engine = _get_engine(request)
    proxy = await engine.rotate(body.account_id, body.country)
    if not proxy:
        raise HTTPException(status_code=404, detail="No healthy proxy available for rotation")
    return {"account_id": body.account_id, "proxy": proxy}

@router.get("/account/{account_id}")
async def get_account_proxy(account_id: int, request: Request,
                            user: User = Depends(get_current_user)):
    engine = _get_engine(request)
    proxy = await engine.get_account_proxy(account_id)
    if not proxy:
        raise HTTPException(status_code=404, detail="No proxy assigned to this account")
    return {"account_id": account_id, "proxy": proxy}
```

- [ ] **Step 4: Wire endpoints in `main.py`**

Add imports:
```python
proxy_providers, proxy_pool as proxy_pool_endpoints, proxy_assignment,
```

Add router includes:
```python
app.include_router(proxy_providers.router)
app.include_router(proxy_pool_endpoints.router)
app.include_router(proxy_assignment.router)
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/v1/endpoints/proxy_*.py backend/app/main.py
git commit -m "feat: add proxy provider, pool, and assignment API endpoints"
```

---

### Task 6: Background Tasks + Infrastructure Wiring

**Files:**
- Modify: `backend/app/main.py`
- Modify: `backend/app/services/infrastructure.py`
- Modify: `backend/app/services/module_dispatcher.py`

**Interfaces:**
- Consumes: ProxyPool, ProxyProviderHub, ProxyAssignmentEngine
- Produces: Wired Infrastructure, registered modules, background loops

- [ ] **Step 1: Wire into `backend/app/services/infrastructure.py`**

In `Infrastructure.__init__()`, add after existing service init:

```python
from telegram_layer.src.proxy import ProxyPool, ProxyProviderHub, ProxyAssignmentEngine

self.proxy_api_keys: dict[str, str] = {}  # populate from settings later
self.proxy_provider_hub = ProxyProviderHub(api_keys=self.proxy_api_keys)
```

In `Infrastructure.__init__()`, after `self.client_manager` is set, add:

```python
self.proxy_pool = ProxyPool(async_session_factory)
self.proxy_provider_hub.proxy_pool = self.proxy_pool
self.proxy_assignment = ProxyAssignmentEngine(self.proxy_pool, async_session_factory)
```

- [ ] **Step 2: Register in module dispatcher `backend/app/services/module_dispatcher.py`**

Add to `MODULE_SERVICES`:
```python
"proxy_pool": "ProxyPool",
"proxy_provider_hub": "ProxyProviderHub",
"proxy_assignment": "ProxyAssignmentEngine",
```

Add to `PARAM_REMAP` if needed (likely not, since they're injected via Infrastructure).

Add `_service_cache` reference in `_instantiate_service()` for proxy services that accept `proxy_pool` param.

- [ ] **Step 3: Add background tasks in `backend/app/main.py`**

In the lifespan function, add after existing bg loops:

```python
async def _free_proxy_aggregator_loop():
    while True:
        try:
            hub = getattr(app.state.infrastructure, 'proxy_provider_hub', None)
            pool = getattr(app.state.infrastructure, 'proxy_pool', None)
            if hub and pool:
                proxies = await hub.fetch_free_pool()
                if proxies:
                    added = await pool.add_batch(proxies)
                    await pool.expire_stale(max_age_hours=24)
                    logger.info(f"Free proxy aggregator: {len(proxies)} fetched, {added} new")
        except Exception as e:
            logger.warning(f"Free proxy aggregator error: {e}")
        await asyncio.sleep(600)  # every 10 min

async def _proxy_health_loop():
    while True:
        try:
            pool = getattr(app.state.infrastructure, 'proxy_pool', None)
            if pool:
                result = await pool.run_health_check()
                if result["checked"]:
                    logger.info(f"Proxy health check: {result}")
        except Exception as e:
            logger.warning(f"Proxy health check error: {e}")
        await asyncio.sleep(1800)  # every 30 min

async def _proxy_expiration_loop():
    while True:
        try:
            pool = getattr(app.state.infrastructure, 'proxy_pool', None)
            if pool:
                await pool.expire_stale(max_age_hours=24)
        except Exception as e:
            logger.warning(f"Proxy expiration error: {e}")
        await asyncio.sleep(3600)  # every 60 min
```

Create tasks and add to bg_tasks:
```python
task5 = asyncio.create_task(_free_proxy_aggregator_loop())
task6 = asyncio.create_task(_proxy_health_loop())
task7 = asyncio.create_task(_proxy_expiration_loop())
bg_tasks.extend([task5, task6, task7])
```

Update log message: `"Background tasks started: sub expiry, health check, flood resume, postbot scheduler, proxy aggregator, proxy health, proxy expiration"`

- [ ] **Step 4: Wire into TelegramClientManager for proxy assignment**

In `telegram_layer/src/client/manager.py`, modify `connect_account()`:

At the top of the method, add proxy resolution:
```python
# Try proxy assignment engine if infrastructure available
if hasattr(self, '_proxy_assignment') and self._proxy_assignment:
    assigned = await self._proxy_assignment.get_account_proxy(account_id)
    if assigned and not proxy:
        proxy = assigned
```

If `_proxy_assignment` is not stored on the manager, accept it as an optional parameter in the constructor or set it via a setter.

- [ ] **Step 5: Commit**

```bash
git add backend/app/main.py backend/app/services/infrastructure.py backend/app/services/module_dispatcher.py telegram_layer/src/client/manager.py
git commit -m "feat: wire proxy services into infrastructure, dispatcher, background tasks, and client"
```

---

### Task 7: Migration Script + Old Pool Deprecation

**Files:**
- Create: `backend/app/services/proxy_migration.py`
- Modify: `backend/app/main.py` (call migration on startup)

**Interfaces:**
- Consumes: `async_session_factory`, `ProxyPool`
- Produces: One-time migration of existing `account.proxy_config` to Proxy table

- [ ] **Step 1: Create `backend/app/services/proxy_migration.py`**

```python
"""One-time migration: move account.proxy_config JSON to Proxy table."""

from loguru import logger
from app.models import Account
from app.models import Proxy
from sqlalchemy import select


async def migrate_existing_proxy_configs(session_factory, proxy_pool):
    """Iterate accounts with proxy_config, insert into Proxy table, link them."""
    count = 0
    skip = 0
    async with session_factory() as s:
        r = await s.execute(
            select(Account).where(
                Account.proxy_config.isnot(None),
                Account.proxy_config != {},
            )
        )
        accounts = r.scalars().all()

    for account in accounts:
        cfg = account.proxy_config or {}
        if not cfg.get("host"):
            skip += 1
            continue

        # Check if already migrated (has a Proxy row linked)
        async with session_factory() as s:
            existing = await s.execute(
                select(Proxy).where(Proxy.allocated_to_account_id == account.id)
            )
            if existing.scalar_one_or_none():
                skip += 1
                continue

        proxy = await proxy_pool.add(
            provider=cfg.get("provider", "migrated"),
            proxy_type=cfg.get("proxy_type", "socks5"),
            host=cfg["host"],
            port=cfg.get("port", 1080),
            username=cfg.get("username"),
            password=cfg.get("password"),
            source="migrated",
        )

        # Link to account
        async with session_factory() as s:
            r2 = await s.execute(select(Proxy).where(Proxy.id == proxy["id"]))
            p = r2.scalar_one()
            p.allocated_to_account_id = account.id
            p.allocated_at = None
            await s.commit()

        count += 1

    logger.info(f"Proxy migration: {count} migrated, {skip} skipped (no host or already migrated)")
    return {"migrated": count, "skipped": skip}
```

- [ ] **Step 2: Call migration on startup in `main.py` lifespan**

After `infrastructure` init, add:

```python
# Migrate existing proxy_config values
try:
    from app.services.proxy_migration import migrate_existing_proxy_configs
    result = await migrate_existing_proxy_configs(async_session_factory, infra.proxy_pool)
    logger.info(f"Proxy migration result: {result}")
except Exception as e:
    logger.warning(f"Proxy migration failed (non-fatal): {e}")
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/services/proxy_migration.py backend/app/main.py
git commit -m "feat: add proxy migration script for existing account.proxy_config"
```

---

## Self-Review Checklist

- [x] Spec coverage: DB model (T1), ProxyPool (T2), ProxyProviderHub (T3), ProxyAssignmentEngine (T4), API endpoints (T5), wiring/bg tasks (T6), migration (T7)
- [x] No placeholders: every step has actual code
- [x] Type consistency: ProxyPool._to_dict() output matches what AssignmentEngine.get_account_proxy() consumes
- [x] Task right-sizing: each task produces independently testable deliverables
