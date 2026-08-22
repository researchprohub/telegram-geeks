# =============================================================================
# backend/app/services/proxy_provider_hub.py
# TelegramGeeks — Rotating Proxy Provider Hub
# Supports 14 providers with unified interface + crypto billing awareness
# =============================================================================

from __future__ import annotations
import asyncio
import hashlib
import random
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
import httpx
from loguru import logger


# ─────────────────────────────────────────────────────────────────
# ENUMS & CONSTANTS
# ─────────────────────────────────────────────────────────────────

class ProxyProtocol(str, Enum):
    HTTP    = "http"
    HTTPS   = "https"
    SOCKS5  = "socks5"
    SOCKS4  = "socks4"


class ProxyType(str, Enum):
    RESIDENTIAL = "residential"
    DATACENTER  = "datacenter"
    ISP         = "isp"
    MOBILE      = "mobile"


class RotationMode(str, Enum):
    PER_REQUEST = "per_request"   # New IP every request
    STICKY_10M  = "sticky_10m"   # Same IP for 10 minutes
    STICKY_30M  = "sticky_30m"   # Same IP for 30 minutes
    STICKY_60M  = "sticky_60m"   # Same IP for 60 minutes
    STICKY_120M = "sticky_120m"  # Same IP for 120 minutes


class ProxyProvider(str, Enum):
    BRIGHT_DATA   = "bright_data"
    OXYLABS       = "oxylabs"
    DECODO        = "decodo"
    IPROYAL       = "iproyal"
    DATAIMPULSE   = "dataimpulse"
    PROXY_CHEAP   = "proxy_cheap"
    NODEMAVEN     = "nodemaven"
    WEBSHARE      = "webshare"
    SOAX          = "soax"
    PROXYRACK     = "proxyrack"
    PROXY_SELLER  = "proxy_seller"
    PROXYSCRAPE   = "proxyscrape"
    FROXY         = "froxy"
    PROXYCOMPASS  = "proxycompass"
    CUSTOM        = "custom"      # Manual proxy entries


# ─────────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────────

@dataclass
class ProxyConfig:
    """Unified proxy configuration object passed to Telethon clients."""
    host:        str
    port:        int
    username:    Optional[str]   = None
    password:    Optional[str]   = None
    protocol:    ProxyProtocol   = ProxyProtocol.SOCKS5
    proxy_type:  ProxyType       = ProxyType.RESIDENTIAL
    provider:    ProxyProvider   = ProxyProvider.CUSTOM
    country:     Optional[str]   = None
    city:        Optional[str]   = None
    session_id:  Optional[str]   = None
    response_ms: Optional[int]   = None
    is_healthy:  bool            = True

    def to_telethon_tuple(self) -> tuple:
        """Convert to Telethon-compatible (host, port, username, password) tuple."""
        import socks
        proto_map = {
            ProxyProtocol.SOCKS5: socks.SOCKS5,
            ProxyProtocol.SOCKS4: socks.SOCKS4,
            ProxyProtocol.HTTP:   socks.HTTP,
            ProxyProtocol.HTTPS:  socks.HTTP,
        }
        return (proto_map.get(self.protocol, socks.SOCKS5), self.host, self.port,
                True, self.username, self.password)

    def to_url_string(self) -> str:
        """Return proxy as URL string for httpx/aiohttp clients."""
        if self.username and self.password:
            return f"{self.protocol.value}://{self.username}:{self.password}@{self.host}:{self.port}"
        return f"{self.protocol.value}://{self.host}:{self.port}"

    def to_dict(self) -> dict:
        return {
            "host": self.host, "port": self.port,
            "username": self.username, "password": self.password,
            "protocol": self.protocol.value, "provider": self.provider.value,
            "country": self.country, "city": self.city,
            "proxy_type": self.proxy_type.value,
            "response_ms": self.response_ms,
            "is_healthy": self.is_healthy,
        }


@dataclass
class ProviderCredentials:
    """Stored API credentials for a proxy provider."""
    provider:         ProxyProvider
    api_key:          Optional[str] = None
    username:         Optional[str] = None
    password:         Optional[str] = None
    customer_id:      Optional[str] = None
    zone_name:        Optional[str] = None
    plan_type:        ProxyType     = ProxyType.RESIDENTIAL
    is_active:        bool          = True
    monthly_gb_limit: Optional[float] = None
    used_gb:          float         = 0.0


# ─────────────────────────────────────────────────────────────────
# ABSTRACT BASE PROVIDER
# ─────────────────────────────────────────────────────────────────

class BaseProxyProvider(ABC):
    """Abstract base class all provider adapters must implement."""

    PROVIDER_ID: ProxyProvider
    DISPLAY_NAME: str
    CRYPTO_COINS: list[str]
    PROXY_TYPES: list[ProxyType]
    PROTOCOLS: list[ProxyProtocol]
    MIN_PRICE_PER_GB: float
    IP_POOL_SIZE: str

    def __init__(self, credentials: ProviderCredentials):
        self.creds = credentials
        self._session_counter = 0

    def _generate_session_id(self, account_id: str) -> str:
        """Generate a unique sticky session ID tied to a Telegram account."""
        seed = f"{account_id}_{int(time.time() // 600)}"
        return hashlib.md5(seed.encode()).hexdigest()[:8]

    @abstractmethod
    def build_proxy(
        self,
        country:       str,
        city:          Optional[str]   = None,
        rotation_mode: RotationMode    = RotationMode.PER_REQUEST,
        proxy_type:    ProxyType       = ProxyType.RESIDENTIAL,
        protocol:      ProxyProtocol   = ProxyProtocol.SOCKS5,
        account_id:    Optional[str]   = None,
        isp:           Optional[str]   = None,
    ) -> ProxyConfig:
        """Build and return a configured ProxyConfig for this provider."""
        ...

    async def health_check(self, proxy: ProxyConfig, timeout: int = 10) -> tuple[bool, int]:
        """
        Test proxy connectivity via Telegram's web interface.
        Returns (is_alive: bool, latency_ms: int).
        """
        start = time.monotonic()
        try:
            async with httpx.AsyncClient(
                proxy=proxy.to_url_string(),
                timeout=timeout
            ) as client:
                resp = await client.get("https://core.telegram.org/")
                latency = int((time.monotonic() - start) * 1000)
                return resp.status_code == 200, latency
        except Exception as e:
            logger.warning(f"Proxy health check failed for {self.PROVIDER_ID.value}: {e}")
            return False, 99999

    async def get_usage_stats(self) -> dict:
        """Override in providers that expose a usage API."""
        return {"used_gb": 0.0, "remaining_gb": None}


# =============================================================================
# ► PROVIDER IMPLEMENTATIONS
# =============================================================================

class BrightDataProvider(BaseProxyProvider):
    PROVIDER_ID      = ProxyProvider.BRIGHT_DATA
    DISPLAY_NAME     = "Bright Data"
    CRYPTO_COINS     = ["BTC", "ETH", "USDT", "USDC"]
    PROXY_TYPES      = [ProxyType.RESIDENTIAL, ProxyType.DATACENTER, ProxyType.ISP, ProxyType.MOBILE]
    PROTOCOLS        = [ProxyProtocol.HTTP, ProxyProtocol.HTTPS, ProxyProtocol.SOCKS5]
    MIN_PRICE_PER_GB = 0.60
    IP_POOL_SIZE     = "150M+"

    HOST_HTTP   = "brd.superproxy.io"
    PORT_HTTP   = 22225
    PORT_SOCKS5 = 22228

    def build_proxy(self, country, city=None, rotation_mode=RotationMode.PER_REQUEST,
                    proxy_type=ProxyType.RESIDENTIAL, protocol=ProxyProtocol.SOCKS5,
                    account_id=None, isp=None) -> ProxyConfig:
        session_id = self._generate_session_id(account_id or "default")
        username_parts = [f"customer-{self.creds.customer_id or 'cust'}",
                          f"zone-{self.creds.zone_name or 'residential_proxy1'}"]
        if country:
            username_parts.append(f"country-{country.lower()}")
        if city:
            username_parts.append(f"city-{city.lower().replace(' ', '_')}")
        if rotation_mode != RotationMode.PER_REQUEST:
            username_parts.append(f"session-{session_id}")

        port = self.PORT_SOCKS5 if protocol == ProxyProtocol.SOCKS5 else self.PORT_HTTP

        return ProxyConfig(
            host=self.HOST_HTTP, port=port,
            username="-".join(username_parts),
            password=self.creds.password or "",
            protocol=protocol, proxy_type=proxy_type,
            provider=self.PROVIDER_ID, country=country, city=city,
            session_id=session_id,
        )


class OxylabsProvider(BaseProxyProvider):
    PROVIDER_ID      = ProxyProvider.OXYLABS
    DISPLAY_NAME     = "Oxylabs"
    CRYPTO_COINS     = ["BTC", "ETH", "USDT"]
    PROXY_TYPES      = [ProxyType.RESIDENTIAL, ProxyType.DATACENTER, ProxyType.ISP, ProxyType.MOBILE]
    PROTOCOLS        = [ProxyProtocol.HTTP, ProxyProtocol.HTTPS, ProxyProtocol.SOCKS5]
    MIN_PRICE_PER_GB = 0.42
    IP_POOL_SIZE     = "100M+"

    HOSTS = {
        ProxyType.RESIDENTIAL: "pr.oxylabs.io",
        ProxyType.DATACENTER:  "dc.pr.oxylabs.io",
        ProxyType.ISP:         "isp.pr.oxylabs.io",
        ProxyType.MOBILE:      "mobile.pr.oxylabs.io",
    }
    PORT_HTTP   = 7777
    PORT_SOCKS5 = 10000

    def build_proxy(self, country, city=None, rotation_mode=RotationMode.PER_REQUEST,
                    proxy_type=ProxyType.RESIDENTIAL, protocol=ProxyProtocol.SOCKS5,
                    account_id=None, isp=None) -> ProxyConfig:
        session_id = self._generate_session_id(account_id or "default")
        username = f"customer-{self.creds.username or 'user'}_cc_{country.upper() if country else 'US'}"
        if city:
            username += f"_city-{city.lower().replace(' ', '_')}"
        if rotation_mode != RotationMode.PER_REQUEST:
            username += f"_sessid-{session_id}"

        host = self.HOSTS.get(proxy_type, self.HOSTS[ProxyType.RESIDENTIAL])
        port = self.PORT_SOCKS5 if protocol == ProxyProtocol.SOCKS5 else self.PORT_HTTP

        return ProxyConfig(
            host=host, port=port,
            username=username, password=self.creds.password or "",
            protocol=protocol, proxy_type=proxy_type,
            provider=self.PROVIDER_ID, country=country, city=city,
        )


class DecodoProvider(BaseProxyProvider):
    PROVIDER_ID      = ProxyProvider.DECODO
    DISPLAY_NAME     = "Decodo (Smartproxy)"
    CRYPTO_COINS     = ["BTC", "ETH", "USDT", "LTC"]
    PROXY_TYPES      = [ProxyType.RESIDENTIAL, ProxyType.DATACENTER, ProxyType.ISP, ProxyType.MOBILE]
    PROTOCOLS        = [ProxyProtocol.HTTP, ProxyProtocol.HTTPS, ProxyProtocol.SOCKS5]
    MIN_PRICE_PER_GB = 0.60
    IP_POOL_SIZE     = "115M+"

    HOST_RESIDENTIAL  = "gate.decodo.com"
    HOST_DATACENTER   = "dc.decodo.com"
    PORT_HTTP         = 10000
    PORT_SOCKS5       = 10001

    def build_proxy(self, country, city=None, rotation_mode=RotationMode.PER_REQUEST,
                    proxy_type=ProxyType.RESIDENTIAL, protocol=ProxyProtocol.SOCKS5,
                    account_id=None, isp=None) -> ProxyConfig:
        session_id = self._generate_session_id(account_id or "default")
        host = self.HOST_DATACENTER if proxy_type == ProxyType.DATACENTER else self.HOST_RESIDENTIAL
        port = self.PORT_SOCKS5 if protocol == ProxyProtocol.SOCKS5 else self.PORT_HTTP

        username_parts = [f"user-{self.creds.username or 'user'}", f"country-{country.upper() if country else 'US'}"]
        if city:
            username_parts.append(f"city-{city.title().replace(' ', '_')}")
        if rotation_mode != RotationMode.PER_REQUEST:
            username_parts.append(f"session-{session_id}")

        return ProxyConfig(
            host=host, port=port,
            username="-".join(username_parts),
            password=self.creds.password or "",
            protocol=protocol, proxy_type=proxy_type,
            provider=self.PROVIDER_ID, country=country, city=city,
        )


class IPRoyalProvider(BaseProxyProvider):
    PROVIDER_ID      = ProxyProvider.IPROYAL
    DISPLAY_NAME     = "IPRoyal"
    CRYPTO_COINS     = ["BTC", "ETH", "USDT", "LTC", "XMR", "DOGE", "TRX", "ADA", "SOL", "MATIC", "BNB", "USDC"]
    PROXY_TYPES      = [ProxyType.RESIDENTIAL, ProxyType.DATACENTER, ProxyType.ISP, ProxyType.MOBILE]
    PROTOCOLS        = [ProxyProtocol.HTTP, ProxyProtocol.HTTPS, ProxyProtocol.SOCKS5]
    MIN_PRICE_PER_GB = 1.75
    IP_POOL_SIZE     = "32M+"

    HOST        = "geo.iproyal.com"
    PORT_HTTP   = 12321
    PORT_SOCKS5 = 32325

    def build_proxy(self, country, city=None, rotation_mode=RotationMode.PER_REQUEST,
                    proxy_type=ProxyType.RESIDENTIAL, protocol=ProxyProtocol.SOCKS5,
                    account_id=None, isp=None) -> ProxyConfig:
        session_id = self._generate_session_id(account_id or "default")
        port = self.PORT_SOCKS5 if protocol == ProxyProtocol.SOCKS5 else self.PORT_HTTP
        username = f"{self.creds.username or 'user'}_country-{country.upper() if country else 'US'}"
        if city:
            username += f"_city-{city.title().replace(' ', '_')}"
        if rotation_mode != RotationMode.PER_REQUEST:
            username += f"_session-{session_id}"
        username += "_streaming-1"

        return ProxyConfig(
            host=self.HOST, port=port,
            username=username, password=self.creds.password or "",
            protocol=protocol, proxy_type=proxy_type,
            provider=self.PROVIDER_ID, country=country, city=city,
        )


class DataImpulseProvider(BaseProxyProvider):
    PROVIDER_ID      = ProxyProvider.DATAIMPULSE
    DISPLAY_NAME     = "DataImpulse"
    CRYPTO_COINS     = ["USDT_TRC20", "BTC", "ETH"]
    PROXY_TYPES      = [ProxyType.RESIDENTIAL, ProxyType.DATACENTER, ProxyType.MOBILE]
    PROTOCOLS        = [ProxyProtocol.HTTP, ProxyProtocol.SOCKS5]
    MIN_PRICE_PER_GB = 1.00
    IP_POOL_SIZE     = "90M+"

    HOST        = "gw.dataimpulse.com"
    PORT_HTTP   = 823
    PORT_SOCKS5 = 824

    def build_proxy(self, country, city=None, rotation_mode=RotationMode.PER_REQUEST,
                    proxy_type=ProxyType.RESIDENTIAL, protocol=ProxyProtocol.SOCKS5,
                    account_id=None, isp=None) -> ProxyConfig:
        session_id = self._generate_session_id(account_id or "default")
        port = self.PORT_SOCKS5 if protocol == ProxyProtocol.SOCKS5 else self.PORT_HTTP
        username_parts = [self.creds.username or "user", f"country={country.upper() if country else 'US'}"]
        if city:
            username_parts.append(f"city={city.title()}")
        if rotation_mode != RotationMode.PER_REQUEST:
            username_parts.append(f"sid={session_id}")

        return ProxyConfig(
            host=self.HOST, port=port,
            username=";".join(username_parts),
            password=self.creds.password or "",
            protocol=protocol, proxy_type=proxy_type,
            provider=self.PROVIDER_ID, country=country, city=city,
        )


class ProxyCheapProvider(BaseProxyProvider):
    PROVIDER_ID      = ProxyProvider.PROXY_CHEAP
    DISPLAY_NAME     = "Proxy-Cheap"
    CRYPTO_COINS     = ["BTC", "ETH", "USDT", "LTC"]
    PROXY_TYPES      = [ProxyType.RESIDENTIAL, ProxyType.DATACENTER, ProxyType.ISP]
    PROTOCOLS        = [ProxyProtocol.HTTP, ProxyProtocol.SOCKS5]
    MIN_PRICE_PER_GB = 4.99
    IP_POOL_SIZE     = "20M+"

    HOST        = "rotating.proxycheap.com"
    PORT_HTTP   = 31112
    PORT_SOCKS5 = 31113

    def build_proxy(self, country, city=None, rotation_mode=RotationMode.PER_REQUEST,
                    proxy_type=ProxyType.RESIDENTIAL, protocol=ProxyProtocol.SOCKS5,
                    account_id=None, isp=None) -> ProxyConfig:
        session_id = self._generate_session_id(account_id or "default")
        port = self.PORT_SOCKS5 if protocol == ProxyProtocol.SOCKS5 else self.PORT_HTTP
        username = f"{self.creds.username or 'user'}-cc-{country.upper() if country else 'US'}"
        if rotation_mode != RotationMode.PER_REQUEST:
            username += f"-session-{session_id}"

        return ProxyConfig(
            host=self.HOST, port=port,
            username=username, password=self.creds.password or "",
            protocol=protocol, proxy_type=proxy_type,
            provider=self.PROVIDER_ID, country=country, city=city,
        )


class NodeMavenProvider(BaseProxyProvider):
    PROVIDER_ID      = ProxyProvider.NODEMAVEN
    DISPLAY_NAME     = "NodeMaven"
    CRYPTO_COINS     = ["BTC", "USDT", "ETH"]
    PROXY_TYPES      = [ProxyType.RESIDENTIAL, ProxyType.MOBILE]
    PROTOCOLS        = [ProxyProtocol.HTTP, ProxyProtocol.SOCKS5]
    MIN_PRICE_PER_GB = 1.00
    IP_POOL_SIZE     = "1,400+ locations"

    HOST             = "gate.nodemaven.com"
    PORT_HTTP_BASE   = 8080
    PORT_SOCKS5_BASE = 1080

    def build_proxy(self, country, city=None, rotation_mode=RotationMode.PER_REQUEST,
                    proxy_type=ProxyType.RESIDENTIAL, protocol=ProxyProtocol.SOCKS5,
                    account_id=None, isp=None) -> ProxyConfig:
        session_id = self._generate_session_id(account_id or "default")
        port_offset = int(session_id[:4], 16) % 1000
        port = (self.PORT_SOCKS5_BASE + port_offset) if protocol == ProxyProtocol.SOCKS5 else (self.PORT_HTTP_BASE + port_offset)
        username_parts = [self.creds.username or "user", f"country-{country.upper() if country else 'US'}"]
        if city:
            username_parts.append(f"city-{city.title().replace(' ', '_')}")
        if rotation_mode != RotationMode.PER_REQUEST:
            username_parts.extend([f"sid-{session_id}", "filter-HQ"])

        return ProxyConfig(
            host=self.HOST, port=port,
            username="-".join(username_parts),
            password=self.creds.password or "",
            protocol=protocol, proxy_type=proxy_type,
            provider=self.PROVIDER_ID, country=country, city=city,
        )


class WebshareProvider(BaseProxyProvider):
    PROVIDER_ID      = ProxyProvider.WEBSHARE
    DISPLAY_NAME     = "Webshare"
    CRYPTO_COINS     = ["BTC", "USDT"]
    PROXY_TYPES      = [ProxyType.RESIDENTIAL, ProxyType.DATACENTER, ProxyType.ISP]
    PROTOCOLS        = [ProxyProtocol.HTTP, ProxyProtocol.SOCKS5]
    MIN_PRICE_PER_GB = 1.19
    IP_POOL_SIZE     = "30M+"

    HOST        = "p.webshare.io"
    PORT_HTTP   = 80
    PORT_SOCKS5 = 1080

    def build_proxy(self, country, city=None, rotation_mode=RotationMode.PER_REQUEST,
                    proxy_type=ProxyType.RESIDENTIAL, protocol=ProxyProtocol.SOCKS5,
                    account_id=None, isp=None) -> ProxyConfig:
        port = self.PORT_SOCKS5 if protocol == ProxyProtocol.SOCKS5 else self.PORT_HTTP
        username = f"{self.creds.username or 'user'}-rotate" if rotation_mode == RotationMode.PER_REQUEST else (self.creds.username or "user")
        return ProxyConfig(
            host=self.HOST, port=port,
            username=username, password=self.creds.password or "",
            protocol=protocol, proxy_type=proxy_type,
            provider=self.PROVIDER_ID, country=country, city=city,
        )


class SOAXProvider(BaseProxyProvider):
    PROVIDER_ID      = ProxyProvider.SOAX
    DISPLAY_NAME     = "SOAX"
    CRYPTO_COINS     = ["BTC", "ETH", "USDT"]
    PROXY_TYPES      = [ProxyType.RESIDENTIAL, ProxyType.MOBILE, ProxyType.ISP]
    PROTOCOLS        = [ProxyProtocol.HTTP, ProxyProtocol.SOCKS5]
    MIN_PRICE_PER_GB = 3.50
    IP_POOL_SIZE     = "8.5M+"

    HOST      = "proxy.soax.com"
    PORT_BASE = 9000
    COUNTRY_PORTS = {"US": 9000, "GB": 9001, "DE": 9002, "FR": 9003, "NL": 9010, "SG": 9009}

    def build_proxy(self, country, city=None, rotation_mode=RotationMode.PER_REQUEST,
                    proxy_type=ProxyType.RESIDENTIAL, protocol=ProxyProtocol.SOCKS5,
                    account_id=None, isp=None) -> ProxyConfig:
        port = self.COUNTRY_PORTS.get((country or "US").upper(), self.PORT_BASE)
        username = f"package-{self.creds.api_key or 'key'}"
        return ProxyConfig(
            host=self.HOST, port=port,
            username=username, password=self.creds.password or "",
            protocol=protocol, proxy_type=proxy_type,
            provider=self.PROVIDER_ID, country=country, city=city,
        )


class ProxyrackProvider(BaseProxyProvider):
    PROVIDER_ID      = ProxyProvider.PROXYRACK
    DISPLAY_NAME     = "Proxyrack"
    CRYPTO_COINS     = ["BTC"]
    PROXY_TYPES      = [ProxyType.RESIDENTIAL, ProxyType.DATACENTER]
    PROTOCOLS        = [ProxyProtocol.HTTP, ProxyProtocol.SOCKS5]
    MIN_PRICE_PER_GB = 5.00
    IP_POOL_SIZE     = "2M+"

    HOST        = "rotating.proxyrack.net"
    PORT_HTTP   = 9000
    PORT_SOCKS5 = 9001

    def build_proxy(self, country, city=None, rotation_mode=RotationMode.PER_REQUEST,
                    proxy_type=ProxyType.RESIDENTIAL, protocol=ProxyProtocol.SOCKS5,
                    account_id=None, isp=None) -> ProxyConfig:
        port = self.PORT_SOCKS5 if protocol == ProxyProtocol.SOCKS5 else self.PORT_HTTP
        return ProxyConfig(
            host=self.HOST, port=port,
            username=self.creds.username or "user",
            password=self.creds.api_key or self.creds.password or "",
            protocol=protocol, proxy_type=proxy_type,
            provider=self.PROVIDER_ID, country=country, city=city,
        )


class ProxySellerProvider(BaseProxyProvider):
    PROVIDER_ID      = ProxyProvider.PROXY_SELLER
    DISPLAY_NAME     = "Proxy-Seller"
    CRYPTO_COINS     = ["BTC", "ETH", "USDT"]
    PROXY_TYPES      = [ProxyType.RESIDENTIAL, ProxyType.ISP, ProxyType.DATACENTER]
    PROTOCOLS        = [ProxyProtocol.HTTP, ProxyProtocol.HTTPS, ProxyProtocol.SOCKS5]
    MIN_PRICE_PER_GB = 0.70
    IP_POOL_SIZE     = "20M+"

    HOST        = "proxy.proxy-seller.com"
    PORT_HTTP   = 1000
    PORT_SOCKS5 = 1001

    def build_proxy(self, country, city=None, rotation_mode=RotationMode.PER_REQUEST,
                    proxy_type=ProxyType.RESIDENTIAL, protocol=ProxyProtocol.SOCKS5,
                    account_id=None, isp=None) -> ProxyConfig:
        session_id = self._generate_session_id(account_id or "default")
        port = self.PORT_SOCKS5 if protocol == ProxyProtocol.SOCKS5 else self.PORT_HTTP
        username = f"{self.creds.username or 'user'}_country-{country.upper() if country else 'US'}"
        if rotation_mode != RotationMode.PER_REQUEST:
            username += f"_sid-{session_id}"
        return ProxyConfig(
            host=self.HOST, port=port,
            username=username, password=self.creds.password or "",
            protocol=protocol, proxy_type=proxy_type,
            provider=self.PROVIDER_ID, country=country, city=city,
        )


class ProxyScrapeProvider(BaseProxyProvider):
    PROVIDER_ID      = ProxyProvider.PROXYSCRAPE
    DISPLAY_NAME     = "ProxyScrape"
    CRYPTO_COINS     = ["BTC", "ETH", "USDT", "LTC"]
    PROXY_TYPES      = [ProxyType.RESIDENTIAL, ProxyType.DATACENTER]
    PROTOCOLS        = [ProxyProtocol.HTTP, ProxyProtocol.SOCKS5]
    MIN_PRICE_PER_GB = 0.00
    IP_POOL_SIZE     = "40M+"

    HOST        = "rotating.proxyscrape.com"
    PORT_HTTP   = 6060
    PORT_SOCKS5 = 7070

    def build_proxy(self, country, city=None, rotation_mode=RotationMode.PER_REQUEST,
                    proxy_type=ProxyType.RESIDENTIAL, protocol=ProxyProtocol.SOCKS5,
                    account_id=None, isp=None) -> ProxyConfig:
        port = self.PORT_SOCKS5 if protocol == ProxyProtocol.SOCKS5 else self.PORT_HTTP
        return ProxyConfig(
            host=self.HOST, port=port,
            username=self.creds.username or "user", password=self.creds.password or "",
            protocol=protocol, proxy_type=proxy_type,
            provider=self.PROVIDER_ID, country=country, city=city,
        )


class FroxyProvider(BaseProxyProvider):
    PROVIDER_ID      = ProxyProvider.FROXY
    DISPLAY_NAME     = "Froxy"
    CRYPTO_COINS     = ["BTC", "USDT"]
    PROXY_TYPES      = [ProxyType.RESIDENTIAL, ProxyType.ISP]
    PROTOCOLS        = [ProxyProtocol.HTTP, ProxyProtocol.SOCKS5]
    MIN_PRICE_PER_GB = 2.00
    IP_POOL_SIZE     = "8M+"

    HOST        = "geo.froxy.com"
    PORT_HTTP   = 6000
    PORT_SOCKS5 = 6001

    def build_proxy(self, country, city=None, rotation_mode=RotationMode.PER_REQUEST,
                    proxy_type=ProxyType.RESIDENTIAL, protocol=ProxyProtocol.SOCKS5,
                    account_id=None, isp=None) -> ProxyConfig:
        session_id = self._generate_session_id(account_id or "default")
        port = self.PORT_SOCKS5 if protocol == ProxyProtocol.SOCKS5 else self.PORT_HTTP
        username = f"{self.creds.username or 'user'}-country-{country.upper() if country else 'US'}"
        if rotation_mode != RotationMode.PER_REQUEST:
            username += f"-session-{session_id}"
        return ProxyConfig(
            host=self.HOST, port=port,
            username=username, password=self.creds.password or "",
            protocol=protocol, proxy_type=proxy_type,
            provider=self.PROVIDER_ID, country=country, city=city,
        )


class ProxyCompassProvider(BaseProxyProvider):
    PROVIDER_ID      = ProxyProvider.PROXYCOMPASS
    DISPLAY_NAME     = "ProxyCompass"
    CRYPTO_COINS     = ["BTC", "ETH", "USDT"]
    PROXY_TYPES      = [ProxyType.RESIDENTIAL, ProxyType.DATACENTER]
    PROTOCOLS        = [ProxyProtocol.HTTP, ProxyProtocol.HTTPS, ProxyProtocol.SOCKS5]
    MIN_PRICE_PER_GB = 3.00
    IP_POOL_SIZE     = "Custom"

    HOST        = "gate.proxycompass.com"
    PORT_HTTP   = 8080
    PORT_SOCKS5 = 1080

    def build_proxy(self, country, city=None, rotation_mode=RotationMode.PER_REQUEST,
                    proxy_type=ProxyType.RESIDENTIAL, protocol=ProxyProtocol.SOCKS5,
                    account_id=None, isp=None) -> ProxyConfig:
        port = self.PORT_SOCKS5 if protocol == ProxyProtocol.SOCKS5 else self.PORT_HTTP
        return ProxyConfig(
            host=self.HOST, port=port,
            username=self.creds.api_key or "key", password=self.creds.password or "",
            protocol=protocol, proxy_type=proxy_type,
            provider=self.PROVIDER_ID, country=country, city=city,
        )


# =============================================================================
# ► PROVIDER REGISTRY & FACTORY
# =============================================================================

PROVIDER_REGISTRY: dict[ProxyProvider, type[BaseProxyProvider]] = {
    ProxyProvider.BRIGHT_DATA:  BrightDataProvider,
    ProxyProvider.OXYLABS:      OxylabsProvider,
    ProxyProvider.DECODO:       DecodoProvider,
    ProxyProvider.IPROYAL:      IPRoyalProvider,
    ProxyProvider.DATAIMPULSE:  DataImpulseProvider,
    ProxyProvider.PROXY_CHEAP:  ProxyCheapProvider,
    ProxyProvider.NODEMAVEN:    NodeMavenProvider,
    ProxyProvider.WEBSHARE:     WebshareProvider,
    ProxyProvider.SOAX:         SOAXProvider,
    ProxyProvider.PROXYRACK:    ProxyrackProvider,
    ProxyProvider.PROXY_SELLER: ProxySellerProvider,
    ProxyProvider.PROXYSCRAPE:  ProxyScrapeProvider,
    ProxyProvider.FROXY:        FroxyProvider,
    ProxyProvider.PROXYCOMPASS: ProxyCompassProvider,
}


def get_provider_instance(credentials: ProviderCredentials) -> BaseProxyProvider:
    cls = PROVIDER_REGISTRY.get(credentials.provider)
    if not cls:
        raise ValueError(f"Unknown provider: {credentials.provider}")
    return cls(credentials)
