# =============================================================================
# backend/app/services/proxy_hub_orchestrator.py
# Master orchestrator managing all 14 provider connections simultaneously
# =============================================================================

from __future__ import annotations
import asyncio
from collections import defaultdict
from typing import Optional
from loguru import logger
from app.services.proxy_provider_hub import (
    BaseProxyProvider, ProxyConfig, ProxyProvider, ProxyType,
    ProxyProtocol, RotationMode, ProviderCredentials,
    get_provider_instance, PROVIDER_REGISTRY
)


class ProxyHubOrchestrator:
    """
    Central proxy hub managing all 14 provider integrations.
    
    Key responsibilities:
    - Provider health monitoring across all accounts
    - Smart provider selection based on country + DC alignment
    - Automatic failover when a provider's proxy fails
    - Usage tracking per provider to prevent GB overruns
    - Telegram DC-aware geo-matching
    """

    # Telegram DC → optimal countries map for geo-matching
    DC_GEO_MAP = {
        1: ["US"],                        # DC1 — Miami, USA
        2: ["NL", "DE", "GB", "FR"],      # DC2 — Amsterdam, EU
        3: ["US"],                        # DC3 — Miami, USA (backup)
        4: ["NL", "DE", "GB", "FR"],      # DC4 — Amsterdam, EU (backup)
        5: ["SG", "JP", "AU", "IN"],      # DC5 — Singapore, APAC
    }

    def __init__(self):
        self._providers: dict[ProxyProvider, BaseProxyProvider] = {}
        self._health_cache: dict[str, tuple[bool, int]] = {}
        self._provider_stats: dict[ProxyProvider, dict] = defaultdict(
            lambda: {"requests": 0, "failures": 0, "avg_latency_ms": 0}
        )

    def register_provider(self, credentials: ProviderCredentials) -> None:
        """Register an active provider with credentials."""
        instance = get_provider_instance(credentials)
        self._providers[credentials.provider] = instance
        logger.info(f"Proxy provider registered: {credentials.provider.value} (plan: {credentials.plan_type.value})")

    def get_active_providers(self) -> list[BaseProxyProvider]:
        return [p for p in self._providers.values() if p.creds.is_active]

    def get_provider_catalog(self) -> list[dict]:
        """Return full catalog of all 14 providers with their specs."""
        catalog = []
        for provider_id, cls in PROVIDER_REGISTRY.items():
            registered = provider_id in self._providers
            catalog.append({
                "provider_id":      provider_id.value,
                "display_name":     cls.DISPLAY_NAME,
                "crypto_coins":     cls.CRYPTO_COINS,
                "proxy_types":      [p.value for p in cls.PROXY_TYPES],
                "protocols":        [p.value for p in cls.PROTOCOLS],
                "min_price_per_gb": cls.MIN_PRICE_PER_GB,
                "ip_pool_size":     cls.IP_POOL_SIZE,
                "is_registered":    registered,
                "is_active":        registered and self._providers[provider_id].creds.is_active,
            })
        return catalog

    def get_best_provider_for_dc(
        self,
        telegram_dc:  int,
        proxy_type:   ProxyType   = ProxyType.RESIDENTIAL,
        prefer_cheap: bool        = False,
    ) -> Optional[BaseProxyProvider]:
        """
        Select the best registered provider for a given Telegram DC.
        Prioritizes geo-alignment then latency, with optional cost preference.
        """
        target_countries = self.DC_GEO_MAP.get(telegram_dc, ["US"])
        active = self.get_active_providers()

        compatible = [p for p in active if proxy_type in p.PROXY_TYPES]
        if not compatible:
            return None

        def score(p: BaseProxyProvider) -> tuple:
            stats = self._provider_stats[p.PROVIDER_ID]
            reliability = 1.0 - (stats["failures"] / max(stats["requests"], 1))
            return (
                reliability > 0.85,
                not prefer_cheap or -p.MIN_PRICE_PER_GB,
            )

        compatible.sort(key=score, reverse=True)
        return compatible[0]

    async def get_proxy_for_account(
        self,
        account_id:    str,
        telegram_dc:   int = 2,
        country:       Optional[str]  = None,
        city:          Optional[str]  = None,
        proxy_type:    ProxyType      = ProxyType.RESIDENTIAL,
        protocol:      ProxyProtocol  = ProxyProtocol.SOCKS5,
        rotation_mode: RotationMode   = RotationMode.STICKY_30M,
        provider_id:   Optional[ProxyProvider] = None,
    ) -> Optional[ProxyConfig]:
        """
        Main entrypoint: get a working proxy for a Telegram account.
        Tries providers in priority order with automatic failover.
        """
        if not country:
            country = self.DC_GEO_MAP.get(telegram_dc, ["US"])[0]

        if provider_id and provider_id in self._providers:
            providers_to_try = [self._providers[provider_id]]
        else:
            best = self.get_best_provider_for_dc(telegram_dc, proxy_type)
            providers_to_try = [best] if best else []
            for p in self.get_active_providers():
                if p not in providers_to_try:
                    providers_to_try.append(p)

        for provider in providers_to_try:
            try:
                proxy = provider.build_proxy(
                    country=country, city=city,
                    rotation_mode=rotation_mode,
                    proxy_type=proxy_type, protocol=protocol,
                    account_id=account_id,
                )
                is_alive, latency = await provider.health_check(proxy)

                stats = self._provider_stats[provider.PROVIDER_ID]
                stats["requests"] += 1
                if is_alive:
                    stats["avg_latency_ms"] = int(stats["avg_latency_ms"] * 0.9 + latency * 0.1)
                    proxy.response_ms = latency
                    proxy.is_healthy = True
                    logger.info(f"Proxy assigned for {account_id}: provider={provider.PROVIDER_ID.value}, country={country}, latency={latency}ms")
                    return proxy
                else:
                    stats["failures"] += 1
                    logger.warning(f"Proxy health check failed for {provider.PROVIDER_ID.value}, country={country}")
            except Exception as e:
                logger.error(f"Proxy provider error {provider.PROVIDER_ID.value}: {e}")

        logger.warning(f"All proxy providers failed for account={account_id}")
        return None

    async def bulk_health_sweep(self) -> dict:
        """Run health checks across all registered providers."""
        results = {}
        for provider_id, provider in self._providers.items():
            if not provider.creds.is_active:
                results[provider_id.value] = {"status": "disabled", "display_name": provider.DISPLAY_NAME}
                continue
            test_proxy = provider.build_proxy(country="US")
            alive, latency = await provider.health_check(test_proxy)
            results[provider_id.value] = {
                "alive": alive, "latency_ms": latency,
                "display_name": provider.DISPLAY_NAME,
            }
        return results

    async def get_all_usage_stats(self) -> dict:
        """Pull bandwidth usage stats from all registered providers."""
        tasks = {pid: asyncio.create_task(p.get_usage_stats())
                 for pid, p in self._providers.items()}
        await asyncio.gather(*tasks.values(), return_exceptions=True)
        return {pid.value: task.result()
                for pid, task in tasks.items()
                if not task.exception()}


# Singleton instance
proxy_hub = ProxyHubOrchestrator()
