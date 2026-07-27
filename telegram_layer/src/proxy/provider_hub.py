"""Central registry of proxy provider configurations."""

from dataclasses import dataclass, field, asdict


@dataclass
class ProxyProviderConfig:
    """Configuration for a single proxy provider."""
    name: str
    api_endpoint: str | None = None
    api_key: str | None = None
    api_key_header: str = "Authorization"
    proxy_type: str = "socks5"
    country: str | None = None
    cost_per_gb: float | None = None
    max_proxies: int = 100
    requires_auth: bool = False
    free: bool = False
    notes: str = ""


class ProxyProviderHub:
    """In-memory registry of proxy provider configurations."""

    def __init__(self):
        self._registry: dict[str, ProxyProviderConfig] = {}

    def register(self, config: ProxyProviderConfig) -> None:
        self._registry[config.name] = config

    def get(self, name: str) -> ProxyProviderConfig | None:
        return self._registry.get(name)

    def list_providers(self) -> list[dict]:
        return [asdict(c) for c in self._registry.values()]

    def free_providers(self) -> list[dict]:
        return [asdict(c) for c in self._registry.values() if c.free]

    def paid_providers(self) -> list[dict]:
        return [asdict(c) for c in self._registry.values() if not c.free]

    def get_by_country(self, country: str) -> list[dict]:
        return [asdict(c) for c in self._registry.values() if c.country == country]

    def load_defaults(self) -> None:
        _PAID: list[ProxyProviderConfig] = [
            ProxyProviderConfig(name="brightdata", cost_per_gb=12.0, max_proxies=500),
            ProxyProviderConfig(name="oxylabs", cost_per_gb=15.0),
            ProxyProviderConfig(name="smartproxy", cost_per_gb=10.0),
            ProxyProviderConfig(name="soax", cost_per_gb=9.0),
            ProxyProviderConfig(name="netnut", cost_per_gb=14.0),
            ProxyProviderConfig(name="iproyal", cost_per_gb=8.0),
            ProxyProviderConfig(name="proxyempire", cost_per_gb=11.0),
            ProxyProviderConfig(name="proxyrack", cost_per_gb=7.0),
            ProxyProviderConfig(name="stormproxies", cost_per_gb=6.0),
            ProxyProviderConfig(name="geosurf", cost_per_gb=13.0),
            ProxyProviderConfig(name="packetstream", cost_per_gb=5.0),
            ProxyProviderConfig(name="lunanode", cost_per_gb=8.0),
            ProxyProviderConfig(name="proxiesapi"),
            ProxyProviderConfig(name="proxy-cheap", cost_per_gb=4.0),
            ProxyProviderConfig(name="proxyline"),
            ProxyProviderConfig(name="proxiesforrent", cost_per_gb=6.0),
            ProxyProviderConfig(name="microleaves", cost_per_gb=16.0),
            ProxyProviderConfig(name="my-private-network", cost_per_gb=9.0),
            ProxyProviderConfig(name="proxyfish"),
            ProxyProviderConfig(name="buyproxies", cost_per_gb=3.0),
            ProxyProviderConfig(name="proxycrawl", proxy_type="http", cost_per_gb=10.0),
            ProxyProviderConfig(name="scraperapi", proxy_type="http", cost_per_gb=5.0),
            ProxyProviderConfig(name="scrapingbee", proxy_type="http", cost_per_gb=8.0),
            ProxyProviderConfig(name="scrapehero"),
            ProxyProviderConfig(name="scrapingant"),
            ProxyProviderConfig(name="scrapingfish"),
            ProxyProviderConfig(name="scrapfly"),
            ProxyProviderConfig(name="apify"),
            ProxyProviderConfig(name="crawlera", requires_auth=True, cost_per_gb=15.0),
            ProxyProviderConfig(name="zenrows", cost_per_gb=7.0),
            ProxyProviderConfig(name="serpapi", proxy_type="http"),
            ProxyProviderConfig(name="serper", proxy_type="http"),
            ProxyProviderConfig(name="scrapecrow"),
            ProxyProviderConfig(name="scrape-it-cloud"),
            ProxyProviderConfig(name="scrape-simple"),
            ProxyProviderConfig(name="scrapeless"),
            ProxyProviderConfig(name="browsercat"),
            ProxyProviderConfig(name="browserless"),
            ProxyProviderConfig(name="browserbase"),
            ProxyProviderConfig(name="stealthy", cost_per_gb=12.0),
            ProxyProviderConfig(name="zmproxies", cost_per_gb=9.0),
            ProxyProviderConfig(name="proxyv6", proxy_type="http", cost_per_gb=6.0),
            ProxyProviderConfig(name="proxy6", proxy_type="http", cost_per_gb=5.0),
            ProxyProviderConfig(name="aliveproxy", cost_per_gb=8.0),
            ProxyProviderConfig(name="proxy-seller"),
            ProxyProviderConfig(name="proxy-sale"),
            ProxyProviderConfig(name="proxybunker"),
        ]
        _FREE: list[ProxyProviderConfig] = [
            ProxyProviderConfig(name="free-proxy-list", free=True, notes="Updated hourly, high churn"),
            ProxyProviderConfig(name="proxyscrape", free=True),
            ProxyProviderConfig(name="geonode", free=True),
            ProxyProviderConfig(name="openproxy", free=True),
            ProxyProviderConfig(name="proxy11", free=True),
            ProxyProviderConfig(name="sslproxies", free=True),
            ProxyProviderConfig(name="proxynova", free=True),
            ProxyProviderConfig(name="proxydb", free=True),
            ProxyProviderConfig(name="hidemy.name", free=True),
            ProxyProviderConfig(name="freeproxylist", free=True),
            ProxyProviderConfig(name="proxylist", free=True),
            ProxyProviderConfig(name="proxyservers", free=True),
            ProxyProviderConfig(name="socks-proxy", free=True, proxy_type="socks5"),
            ProxyProviderConfig(name="proxy-list", free=True),
            ProxyProviderConfig(name="github-proxies", free=True, notes="Community-maintained proxy list on GitHub"),
        ]
        for cfg in _PAID + _FREE:
            self.register(cfg)
