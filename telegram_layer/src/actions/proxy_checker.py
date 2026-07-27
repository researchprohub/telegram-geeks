import re
"""Proxy Pool Checker module — validate and manage proxy lists.

Telegram Expert manual: https://en.telegramexpert.pro/manuals/proverka-dobavlenie-i-udalenie-proksi

Validates proxy lists and displays:
- host, port, login, password, type (HTTP/SOCKS5), version (ipv4)
- response speed, status (ok/bad)
"""

import asyncio
import time
import socket
from datetime import datetime, timezone
from typing import Dict, List, Optional
from loguru import logger


class ProxyCheckerService:
    """Validate and manage proxy lists."""

    def __init__(self, config_service=None):
        self.proxy_pool: List[Dict] = []
        self.check_history: List[Dict] = []
        self.config_service = config_service

    def add_proxy(
        self,
        proxy_string: str,
        proxy_type: str = "socks5",
        version: str = "ipv4",
    ) -> Dict:
        """Add a new proxy to the pool.
        
        Args:
            proxy_string: Format "ip:port", "ip:port:login:pass", "http://ip:port", or "socks5://ip:port"
            proxy_type: "http" or "socks5"
            version: "ipv4" or "ipv6"
        """
        logger.info(f"Adding proxy: {proxy_string[:20]}...")
        
        # Normalize URL-format proxies to ip:port format
        normalized = proxy_string.strip()
        detected_type = proxy_type
        
        # Handle http:// or https:// URLs
        if normalized.startswith(("http://", "https://")):
            detected_type = "http"
            normalized = normalized.split("://")[1]
            # Remove trailing slash
            normalized = normalized.rstrip("/")
        # Handle socks5:// URLs
        elif normalized.startswith("socks5://"):
            detected_type = "socks5"
            normalized = normalized.split("://")[1]
            normalized = normalized.rstrip("/")
        
        # Parse ip:port[:login:pass]
        # Handle IPv6 addresses in brackets
        ipv6_match = re.match(r'\[([^\]]+)\]:(\d+)(?::([^:]+))?(?::([^:]+))?$', normalized)
        if ipv6_match:
            host, port, login, password = ipv6_match.groups()
            parts = [host, str(port), login or "", password or ""]
        else:
            parts = normalized.split(':')
        
        if len(parts) < 2:
            return {"status": "error", "message": "Invalid proxy format. Use ip:port or ip:port:login:pass"}
        
        try:
            port_num = int(parts[1])
        except ValueError:
            return {"status": "error", "message": f"Invalid port number: {parts[1]}"}
        
        proxy_entry = {
            "host": parts[0],
            "port": port_num,
            "login": parts[2] if len(parts) > 2 else "",
            "password": parts[3] if len(parts) > 3 else "",
            "type": detected_type,
            "version": version,
            "status": "pending",
            "response_time_ms": 0,
            "added_at": datetime.now(timezone.utc).isoformat(),
        }
        
        self.proxy_pool.append(proxy_entry)
        return {"status": "success", "proxy": proxy_entry}

    async def check_proxies(
        self,
        timeout: int = 5,
        retry_attempts: int = 2,
        thread_count: int = 5,
    ) -> Dict:
        """Check all proxies in the pool.
        
        Args:
            timeout: Response time threshold in seconds
            retry_attempts: Number of retry attempts
            thread_count: Number of concurrent checks
        """
        if self.config_service:
            enabled = self.config_service.get("proxy", "enabled")
            source = self.config_service.get("proxy", "source")
            if not enabled or source == "disabled":
                logger.info("Proxy checking disabled by config")
                return {"status": "disabled", "total": 0, "results": [], "summary": {"ok": 0, "bad": 0}}

        logger.info(f"Checking {len(self.proxy_pool)} proxies (timeout={timeout}s, retries={retry_attempts}, threads={thread_count})")
        
        if not self.proxy_pool:
            return {
                "status": "completed",
                "total": 0,
                "results": [],
                "summary": {"ok": 0, "bad": 0},
            }
        
        results = []
        semaphore = asyncio.Semaphore(thread_count)
        
        async def check_single(proxy: Dict) -> Dict:
            async with semaphore:
                return await self._check_single_proxy(proxy, timeout, retry_attempts)
        
        tasks = [check_single(p) for p in self.proxy_pool]
        for task in asyncio.as_completed(tasks):
            result = await task
            results.append(result)
        
        # Update summary
        summary = {
            "ok": sum(1 for r in results if r["status"] == "ok"),
            "bad": sum(1 for r in results if r["status"] == "bad"),
            "total": len(results),
        }
        
        check_record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_checked": len(results),
            "summary": summary,
            "results": results,
        }
        self.check_history.append(check_record)
        
        logger.info(f"Proxy check complete: {summary}")
        return {
            "status": "completed",
            "total": len(results),
            "results": results,
            "summary": summary,
        }

    async def _check_single_proxy(self, proxy: Dict, timeout: int, retry_attempts: int) -> Dict:
        """Check a single proxy with retries."""
        proxy_copy = proxy.copy()
        proxy_copy["checked_at"] = datetime.now(timezone.utc).isoformat()
        
        start_time = time.time()
        
        for attempt in range(retry_attempts):
            try:
                # Test TCP connection
                is_valid = await self._test_tcp_connection(
                    proxy["host"],
                    proxy["port"],
                    timeout
                )
                
                elapsed_ms = (time.time() - start_time) * 1000
                proxy_copy["response_time_ms"] = int(elapsed_ms)
                
                if is_valid:
                    proxy_copy["status"] = "ok"
                    proxy["status"] = "ok"
                    return proxy_copy
                else:
                    proxy_copy["status"] = "bad"
                    proxy["status"] = "bad"
                    
            except Exception as e:
                logger.debug(f"Proxy check attempt {attempt + 1} failed: {e}")
                await asyncio.sleep(1)
        
        # All retries exhausted
        proxy_copy["status"] = "bad"
        proxy["status"] = "bad"
        return proxy_copy

    async def _test_tcp_connection(self, host: str, port: int, timeout: int) -> bool:
        """Test TCP connection to proxy server."""
        try:
            loop = asyncio.get_event_loop()
            _, writer = await asyncio.wait_for(
                asyncio.open_connection(host, port),
                timeout=timeout
            )
            writer.close()
            await writer.wait_closed()
            return True
        except (asyncio.TimeoutError, ConnectionError, OSError):
            return False

    def delete_proxy(self, host: str, port: int) -> Dict:
        """Delete a proxy from the pool."""
        original_len = len(self.proxy_pool)
        self.proxy_pool = [
            p for p in self.proxy_pool
            if not (p["host"] == host and p["port"] == port)
        ]
        
        if len(self.proxy_pool) < original_len:
            return {"status": "success", "message": f"Deleted proxy {host}:{port}"}
        else:
            return {"status": "error", "message": "Proxy not found"}

    def get_proxy_pool(self) -> List[Dict]:
        """Get current proxy pool."""
        return self.proxy_pool

    def get_check_history(self, limit: int = 50) -> List[Dict]:
        """Get history of proxy checks."""
        return self.check_history[-limit:]
