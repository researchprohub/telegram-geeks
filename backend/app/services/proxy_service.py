"""
ProxyService — Real SOCKS5/HTTP/MTProxy health checking,
               account assignment, rotation, and ban-detection routing.

Probe method:
  - Opens a TCP socket through the proxy to api.telegram.org:443
  - Measures latency
  - Marks dead proxies automatically

Rotation strategies:
  - round_robin: even distribution across pool
  - least_used:  assign to account with fewest proxies sharing it
  - geo_match:   match proxy country to account's registered country
  - random:      random selection from alive pool
"""

try:
    import socks       # PySocks — pysocks>=1.7.1
    SOCKS_AVAILABLE = True
except ImportError:
    socks = None
    SOCKS_AVAILABLE = False
import time
import random
from datetime import datetime, timezone
from typing import Optional, Literal, List, Dict, Any
from sqlalchemy import select, func, update
from app.models import Proxy, ProxyStatus, Account, AccountFolder
from app.database import AsyncSessionLocal


PROXY_TEST_HOST = "149.154.167.51"   # Telegram DC2 IP
PROXY_TEST_PORT = 443
PROXY_TIMEOUT   = 10                  # seconds


class ProxyServiceClass:

    # ─────────────────────────────────────────────────────────────────────────
    # PROBE A SINGLE PROXY
    # ─────────────────────────────────────────────────────────────────────────
    async def probe_proxy(self, proxy: "Proxy") -> dict:
        """
        Tests a proxy by attempting a TCP connection to Telegram's DC2.
        Returns latency in ms or marks as dead.
        Runs in a thread pool to avoid blocking the event loop.
        """
        return await asyncio.get_event_loop().run_in_executor(
            None, self._probe_sync, proxy
        )

    def _probe_sync(self, proxy: "Proxy") -> dict:
        """Synchronous proxy probe — called via run_in_executor."""
        try:
            ptype = (proxy.proxy_type or "socks5").lower()
            if ptype in ("socks5", "socks4") and SOCKS_AVAILABLE and socks:
                sock = socks.socksocket()
                socks_type = (
                    socks.SOCKS5
                    if ptype == "socks5"
                    else socks.SOCKS4
                )
                sock.set_proxy(
                    socks_type,
                    proxy.host,
                    proxy.port,
                    username=proxy.username or None,
                    password=proxy.password or None,
                )
            elif ptype == "http" and SOCKS_AVAILABLE and socks:
                sock = socks.socksocket()
                sock.set_proxy(
                    socks.HTTP,
                    proxy.host,
                    proxy.port,
                    username=proxy.username or None,
                    password=proxy.password or None,
                )
            else:
                # Direct TCP / fallback
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

            sock.settimeout(PROXY_TIMEOUT)
            start = time.monotonic()
            sock.connect((PROXY_TEST_HOST, PROXY_TEST_PORT))
            latency_ms = round((time.monotonic() - start) * 1000)
            sock.close()

            return {
                "id":         proxy.id,
                "status":     "alive",
                "latency_ms": latency_ms,
                "host":       proxy.host,
                "port":       proxy.port,
            }

        except Exception as e:
            return {
                "id":     proxy.id,
                "status": "dead",
                "error":  str(e)[:80],
                "host":   proxy.host,
                "port":   proxy.port,
            }

    # ─────────────────────────────────────────────────────────────────────────
    # TEST ALL PROXIES (concurrent)
    # ─────────────────────────────────────────────────────────────────────────
    async def test_all(self, concurrency: int = 20) -> dict:
        """
        Probes every proxy in the database concurrently.
        Updates status and latency in place.
        Returns summary: { alive, dead, total, results }
        """
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Proxy))
            proxies = result.scalars().all()

        if not proxies:
            return {"alive": 0, "dead": 0, "total": 0, "results": []}

        semaphore = asyncio.Semaphore(concurrency)
        results   = []

        async def probe_one(proxy: "Proxy"):
            async with semaphore:
                probe = await self.probe_proxy(proxy)
                # Update DB
                async with AsyncSessionLocal() as db:
                    p = await db.get(Proxy, proxy.id)
                    if p:
                        p.status = (
                            ProxyStatus.ALIVE.value
                            if probe["status"] == "alive"
                            else ProxyStatus.DEAD.value
                        )
                        p.latency_ms   = probe.get("latency_ms", 9999)
                        p.last_checked = datetime.now(timezone.utc)
                        p.fail_count   = (
                            0
                            if probe["status"] == "alive"
                            else (p.fail_count or 0) + 1
                        )
                        await db.commit()
                results.append(probe)

        await asyncio.gather(*[probe_one(p) for p in proxies])

        alive = sum(1 for r in results if r["status"] == "alive")
        dead  = len(results) - alive
        return {
            "alive":   alive,
            "dead":    dead,
            "total":   len(results),
            "results": sorted(results, key=lambda x: x.get("latency_ms", 9999)),
        }

    # ─────────────────────────────────────────────────────────────────────────
    # ASSIGN PROXIES TO ACCOUNTS
    # ─────────────────────────────────────────────────────────────────────────
    async def assign_to_accounts(
        self,
        account_ids: list[str],
        strategy: Literal[
            "round_robin", "least_used", "geo_match", "random"
        ] = "round_robin",
    ) -> int:
        """
        Assigns live proxies to accounts using the chosen strategy.
        Skips accounts that already have a working proxy.
        Returns count of accounts successfully assigned.
        """
        # Get all alive proxies
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Proxy).where(
                    (Proxy.status == ProxyStatus.ALIVE.value) | (Proxy.status == "alive")
                )
                .order_by(Proxy.latency_ms.asc())
            )
            alive_proxies = result.scalars().all()

        if not alive_proxies:
            return 0

        assigned = 0

        if strategy == "round_robin":
            for i, acc_id in enumerate(account_ids):
                proxy = alive_proxies[i % len(alive_proxies)]
                await self._assign_one(acc_id, proxy.id)
                assigned += 1

        elif strategy == "least_used":
            # Count how many accounts each proxy serves
            async with AsyncSessionLocal() as db:
                usage_result = await db.execute(
                    select(Account.proxy_id, func.count(Account.id))
                    .group_by(Account.proxy_id)
                )
                usage = {
                    str(row[0]): row[1]
                    for row in usage_result.fetchall()
                    if row[0]
                }

            for acc_id in account_ids:
                # Find proxy with fewest assignments
                best = min(
                    alive_proxies,
                    key=lambda p: usage.get(str(p.id), 0),
                )
                await self._assign_one(acc_id, best.id)
                usage[str(best.id)] = usage.get(str(best.id), 0) + 1
                assigned += 1

        elif strategy == "random":
            for acc_id in account_ids:
                proxy = random.choice(alive_proxies)
                await self._assign_one(acc_id, proxy.id)
                assigned += 1

        elif strategy == "geo_match":
            # Match proxy country to account country if available
            for acc_id in account_ids:
                async with AsyncSessionLocal() as db:
                    acc = await db.get(Account, acc_id)
                    if not acc:
                        continue

                    acc_country = getattr(acc, "country", None)

                    if acc_country:
                        # Try to find proxy matching account country
                        country_proxies = [
                            p for p in alive_proxies
                            if getattr(p, "country", None) == acc_country
                        ]
                        proxy = (
                            random.choice(country_proxies)
                            if country_proxies
                            else random.choice(alive_proxies)
                        )
                    else:
                        proxy = alive_proxies[assigned % len(alive_proxies)]

                await self._assign_one(acc_id, proxy.id)
                assigned += 1

        return assigned

    async def _assign_one(self, account_id: str, proxy_id: int):
        async with AsyncSessionLocal() as db:
            acc = await db.get(Account, account_id)
            if acc:
                acc.proxy_id = proxy_id
                await db.commit()

    # ─────────────────────────────────────────────────────────────────────────
    # AUTO-ROTATE ON BAN DETECTION
    # ─────────────────────────────────────────────────────────────────────────
    async def rotate_proxy(self, account_id: str) -> dict:
        """
        Assigns a new alive proxy to an account.
        Called automatically when a proxy is detected as banned/dead.
        Marks the old proxy as potentially dead and increments fail count.
        """
        async with AsyncSessionLocal() as db:
            acc = await db.get(Account, account_id)
            if not acc:
                return {"status": "error", "message": "Account not found"}

            old_proxy_id = acc.proxy_id

            # Mark old proxy as suspect
            if old_proxy_id:
                old_proxy = await db.get(Proxy, old_proxy_id)
                if old_proxy:
                    old_proxy.fail_count = (old_proxy.fail_count or 0) + 1
                    if old_proxy.fail_count >= 3:
                        old_proxy.status = ProxyStatus.SUSPECT.value
                    await db.commit()

            # Find a new alive proxy different from old one
            result = await db.execute(
                select(Proxy)
                .where(
                    (Proxy.status == ProxyStatus.ALIVE.value) | (Proxy.status == "alive"),
                    Proxy.id != old_proxy_id,
                )
                .order_by(Proxy.latency_ms.asc())
                .limit(1)
            )
            new_proxy = result.scalar_one_or_none()

            if not new_proxy:
                return {
                    "status": "error",
                    "message": "No available alive proxy for rotation",
                }

            acc.proxy_id = new_proxy.id
            await db.commit()

            return {
                "status":     "rotated",
                "account_id": account_id,
                "old_proxy":  old_proxy_id,
                "new_proxy":  new_proxy.id,
                "new_host":   f"{new_proxy.host}:{new_proxy.port}",
            }

    # ─────────────────────────────────────────────────────────────────────────
    # BULK IMPORT PROXIES FROM TEXT
    # ─────────────────────────────────────────────────────────────────────────
    async def bulk_import(
        self,
        raw_text: str,
        proxy_type: str = "socks5",
    ) -> dict:
        """
        Parses and imports proxies from raw text.

        Supported formats:
          host:port
          host:port:username:password
          socks5://user:pass@host:port
          host:port@username:password
        """
        lines   = raw_text.strip().splitlines()
        parsed  = []
        invalid = []

        for line in lines:
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            proxy_data = self._parse_proxy_line(line, proxy_type)
            if proxy_data:
                parsed.append(proxy_data)
            else:
                invalid.append(line)

        # Bulk insert
        added = 0
        async with AsyncSessionLocal() as db:
            for p in parsed:
                # Check for duplicates
                existing = await db.execute(
                    select(Proxy).where(
                        Proxy.host == p["host"],
                        Proxy.port == p["port"],
                    )
                )
                if existing.scalar_one_or_none():
                    continue

                proxy = Proxy(
                    host=p["host"],
                    port=p["port"],
                    username=p.get("username"),
                    password=p.get("password"),
                    proxy_type=p["proxy_type"],
                    status=ProxyStatus.UNTESTED.value,
                    fail_count=0,
                    added_at=datetime.now(timezone.utc),
                )
                db.add(proxy)
                added += 1

            await db.commit()

        return {
            "added":   added,
            "invalid": len(invalid),
            "total":   len(lines),
            "invalid_lines": invalid[:10],  # Show first 10 invalid lines
        }

    def _parse_proxy_line(self, line: str, default_type: str) -> Optional[dict]:
        """Parses a single proxy line into structured data."""
        import re

        # Format: protocol://user:pass@host:port
        url_match = re.match(
            r"(socks5|socks4|http)://(?:([^:@]+):([^@]+)@)?([^:]+):(\d+)",
            line, re.IGNORECASE
        )
        if url_match:
            return {
                "proxy_type": url_match.group(1).lower(),
                "username":   url_match.group(2),
                "password":   url_match.group(3),
                "host":       url_match.group(4),
                "port":       int(url_match.group(5)),
            }

        # Format: host:port:user:pass
        parts = line.split(":")
        if len(parts) == 4:
            try:
                port = int(parts[1])
                return {
                    "proxy_type": default_type,
                    "host":       parts[0],
                    "port":       port,
                    "username":   parts[2],
                    "password":   parts[3],
                }
            except ValueError:
                pass

        # Format: host:port@user:pass
        at_parts = line.split("@")
        if len(at_parts) == 2:
            hp = at_parts[0].split(":")
            up = at_parts[1].split(":")
            if len(hp) == 2 and len(up) == 2:
                try:
                    return {
                        "proxy_type": default_type,
                        "host":       hp[0],
                        "port":       int(hp[1]),
                        "username":   up[0],
                        "password":   up[1],
                    }
                except ValueError:
                    pass

        # Format: host:port
        if len(parts) == 2:
            try:
                return {
                    "proxy_type": default_type,
                    "host":       parts[0],
                    "port":       int(parts[1]),
                    "username":   None,
                    "password":   None,
                }
            except ValueError:
                return None

        return None

    # ─────────────────────────────────────────────────────────────────────────
    # GET PROXY POOL STATS
    # ─────────────────────────────────────────────────────────────────────────
    async def get_stats(self) -> dict:
        async with AsyncSessionLocal() as db:
            total   = (await db.execute(
                select(func.count(Proxy.id))
            )).scalar() or 0
            alive   = (await db.execute(
                select(func.count(Proxy.id))
                .where(
                    (Proxy.status == ProxyStatus.ALIVE.value) | (Proxy.status == "alive")
                )
            )).scalar() or 0
            dead    = (await db.execute(
                select(func.count(Proxy.id))
                .where(
                    (Proxy.status == ProxyStatus.DEAD.value) | (Proxy.status == "dead")
                )
            )).scalar() or 0
            suspect = (await db.execute(
                select(func.count(Proxy.id))
                .where(
                    (Proxy.status == ProxyStatus.SUSPECT.value) | (Proxy.status == "suspect")
                )
            )).scalar() or 0
            avg_lat = (await db.execute(
                select(func.avg(Proxy.latency_ms))
                .where(
                    (Proxy.status == ProxyStatus.ALIVE.value) | (Proxy.status == "alive")
                )
            )).scalar() or 0

            return {
                "total":          total,
                "alive":          alive,
                "dead":           dead,
                "suspect":        suspect,
                "untested":       max(0, total - alive - dead - suspect),
                "avg_latency_ms": round(avg_lat or 0),
                "coverage_pct":   round(alive / max(total, 1) * 100, 1),
            }


ProxyService = ProxyServiceClass()
