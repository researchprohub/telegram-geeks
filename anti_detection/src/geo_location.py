"""Geo Location — Proxy-country matching for Telegram accounts."""

import random
from loguru import logger


class GeoLocationService:
    """Manage geo-location matching between accounts, proxies, and target groups."""

    # Country code mappings
    COUNTRY_CODES = {
        "US": "United States", "GB": "United Kingdom", "CA": "Canada", "AU": "Australia",
        "DE": "Germany", "FR": "France", "NL": "Netherlands", "SE": "Sweden",
        "JP": "Japan", "KR": "South Korea", "CN": "China", "IN": "India",
        "BR": "Brazil", "RU": "Russia", "UA": "Ukraine", "PL": "Poland",
        "IT": "Italy", "ES": "Spain", "MX": "Mexico", "SG": "Singapore",
    }

    # Proxy geo preferences by target region
    REGION_PROXY_PREFS = {
        "north_america": ["US", "CA"],
        "europe": ["GB", "DE", "FR", "NL", "SE", "PL", "IT", "ES"],
        "asia_pacific": ["JP", "KR", "SG", "AU"],
        "latin_america": ["BR", "MX"],
    }

    def __init__(self):
        self.account_geos: dict[str, str] = {}  # account_id -> country_code
        self.proxy_geos: dict[str, str] = {}  # proxy_id -> country_code
        self.target_geos: dict[str, str] = {}  # group/channel_id -> country_code

    def match_proxy_to_target(self, proxy_country: str, target_geo: str) -> bool:
        """Check if proxy country matches target region."""
        if proxy_country == target_geo:
            return True

        # Check regional compatibility
        for region, countries in self.REGION_PROXY_PREFS.items():
            if proxy_country in countries and target_geo in countries:
                return True
        return False

    def detect_geo_mismatch(self, account_geo: str, proxy_geo: str) -> bool:
        """Detect if proxy geo mismatches account geo."""
        if account_geo == proxy_geo:
            return False
        # Check if in same region
        for region, countries in self.REGION_PROXY_PREFS.items():
            if account_geo in countries and proxy_geo in countries:
                return False
        return True

    def rotate_to_matching_proxy(self, account_id: str, target_geo: str, proxy_pool: list[dict]) -> dict | None:
        """Find and switch to a proxy matching the target geo."""
        # Find compatible proxies
        compatible = [
            p for p in proxy_pool
            if self.match_proxy_to_target(p.get("country", ""), target_geo)
        ]

        if not compatible:
            logger.warning(f"No compatible proxy found for {target_geo}")
            return None

        # Pick random compatible proxy
        chosen = random.choice(compatible)
        logger.info(f"Rotated {account_id} to proxy {chosen.get('id')} (country: {chosen.get('country')})")
        return chosen

    def get_account_geo_fingerprint(self, account_id: str) -> dict:
        """Get historical geo pattern for an account."""
        return {
            "account_id": account_id,
            "registered_geo": self.account_geos.get(account_id, "unknown"),
            "current_proxy_geo": self.proxy_geos.get(account_id, "unknown"),
            "target_geo": self.target_geos.get(account_id, "unknown"),
            "mismatch_detected": self.detect_geo_mismatch(
                self.account_geos.get(account_id, ""),
                self.proxy_geos.get(account_id, ""),
            ),
        }

    def suggest_geo_adjustments(self, account_id: str, target_groups: list[dict]) -> list[dict]:
        """Recommend geo adjustments based on target group locations."""
        suggestions = []
        target_countries = set()
        for group in target_groups:
            country = group.get("country", group.get("geo", "unknown"))
            if country != "unknown":
                target_countries.add(country)

        current_proxy = self.proxy_geos.get(account_id, "unknown")
        for country in target_countries:
            if not self.match_proxy_to_target(current_proxy, country):
                suggestions.append({
                    "account_id": account_id,
                    "current_proxy_geo": current_proxy,
                    "recommended_geo": country,
                    "reason": f"Target group is in {country}",
                })

        return suggestions

    def set_account_geo(self, account_id: str, country_code: str):
        """Set the registered geo for an account."""
        self.account_geos[account_id] = country_code
        logger.info(f"Set geo for {account_id}: {country_code}")

    def set_proxy_geo(self, proxy_id: str, country_code: str):
        """Set the geo for a proxy."""
        self.proxy_geos[proxy_id] = country_code

    def set_target_geo(self, entity_id: int, country_code: str):
        """Set the geo for a target group/channel."""
        self.target_geos[str(entity_id)] = country_code
