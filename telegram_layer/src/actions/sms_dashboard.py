"""SMS Provider Live Dashboard — price matrix, availability, payment methods."""

from datetime import datetime, timezone
from typing import Optional

# Static price matrix — in production this would be dynamic
PRICE_MATRIX = {
    "herosms":    {"IN": 0.07, "VN": 0.05, "RU": 0.10, "TR": 0.08, "US": 0.12, "GB": 0.10, "DE": 0.09, "crypto": ["BTC", "ETH", "USDT", "SOL", "TRX"]},
    "5sim":       {"IN": 0.05, "VN": 0.008, "RU": 0.05, "TR": 0.05, "US": 0.08, "GB": 0.07, "DE": 0.06, "crypto": ["BTC", "ETH", "USDT", "BNB"]},
    "smsman":     {"IN": 0.06, "VN": 0.04, "RU": 0.08, "TR": 0.07, "US": 0.10, "GB": 0.09, "crypto": ["BTC", "ETH", "USDT", "BNB"]},
    "grizzly":    {"IN": 0.05, "VN": 0.04, "RU": 0.06, "TR": 0.06, "US": 0.09, "GB": 0.08, "crypto": ["BTC", "ETH", "USDT"]},
    "onlinesim":  {"IN": 0.08, "VN": None, "RU": 0.09, "TR": 0.08, "US": None, "GB": None, "crypto": ["BTC", "ETH", "Payeer"]},
    "smspool":    {"IN": 0.07, "VN": 0.05, "RU": 0.08, "TR": 0.07, "US": 0.11, "GB": 0.09, "crypto": ["BTC", "ETH", "USDT"]},
    "smscodes":   {"IN": None, "VN": None, "RU": None, "TR": None, "US": None, "GB": None, "crypto": ["BTC", "ETH", "USDT", "BNB", "DOGE", "XRP", "TRX", "ZEC"]},
    "juicysms":   {"IN": 0.06, "VN": 0.04, "RU": 0.07, "TR": 0.07, "US": 0.10, "GB": 0.08, "crypto": ["BTC", "ETH", "USDT"]},
    "verifysms":  {"IN": None, "VN": None, "RU": None, "TR": None, "US": None, "GB": None, "crypto": ["BTC", "ETH", "USDT"]},
    "smsreg":     {"IN": None, "VN": None, "RU": None, "TR": None, "US": None, "GB": None, "crypto": ["BTC", "ETH", "Payeer"]},
    "smspin":     {"IN": None, "VN": None, "RU": None, "TR": None, "US": 0.78, "GB": None, "crypto": ["BTC", "ETH", "USDT", "BNB", "Binance Pay"]},
    "quackr":     {"IN": None, "VN": None, "RU": None, "TR": None, "US": None, "GB": None, "crypto": ["BTC", "ETH", "USDT"]},
}

FREE_PROVIDERS = {
    "quackr_free":      {"countries": ["US", "UK", "IN", "EU"], "status": "online", "limit": "public"},
    "receivesms":       {"countries": ["US", "UK", "EU"], "status": "online", "limit": "public"},
    "anonymsms":        {"countries": ["US", "EU"], "status": "online", "limit": "public"},
    "tempsms":          {"countries": ["Multiple"], "status": "online", "limit": "public"},
    "smsreceivefree":   {"countries": ["US", "UK", "EU"], "status": "online", "limit": "public"},
    "sms24":            {"countries": ["EU"], "status": "offline", "limit": "public"},
    "freephonenum":     {"countries": ["Multiple"], "status": "limited", "limit": "public"},
    "smsget":           {"countries": ["RU"], "status": "online", "limit": "public"},
    "mytempsms":        {"countries": ["Multiple"], "status": "online", "limit": "public"},
    "receivesmsfast":   {"countries": ["US", "IN", "RU", "UK", "CN"], "status": "online", "limit": "public"},
    "receivesmss":      {"countries": ["Multiple"], "status": "online", "limit": "public"},
    "textrapp":         {"countries": ["US"], "status": "online", "limit": "public"},
    "smsbus":           {"countries": ["Multiple"], "status": "online", "limit": "public"},
}


class SMSDashboardProvider:
    """Generate live SMS provider dashboard data."""

    @staticmethod
    def get_price_matrix(country: Optional[str] = None) -> dict:
        if country:
            data = {}
            for provider, prices in PRICE_MATRIX.items():
                price = prices.get(country.upper())
                if price is not None:
                    data[provider] = {"price": price, "crypto": prices.get("crypto", [])}
            return data
        return PRICE_MATRIX

    @staticmethod
    def get_free_providers(status: Optional[str] = None) -> dict:
        if status:
            return {k: v for k, v in FREE_PROVIDERS.items() if v["status"] == status}
        return FREE_PROVIDERS

    @staticmethod
    def get_live_status() -> dict:
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "paid_providers": {k: {"status": "configured"} for k in PRICE_MATRIX.keys()},
            "free_providers": {k: {"status": v["status"]} for k, v in FREE_PROVIDERS.items()},
            "total_providers": len(PRICE_MATRIX) + len(FREE_PROVIDERS),
            "countries_covered": sorted(set(c for p in PRICE_MATRIX.values() for c in p.keys() if c != "crypto" and p.get(c) is not None)),
        }

    @staticmethod
    def get_crypto_matrix() -> dict:
        return {provider: prices.get("crypto", []) for provider, prices in PRICE_MATRIX.items()}

    @staticmethod
    def get_region_summary(country: str) -> dict:
        country = country.upper()
        providers = {}
        for name, prices in PRICE_MATRIX.items():
            p = prices.get(country)
            if p is not None:
                providers[name] = {"price": p, "crypto": prices.get("crypto", [])}
        free = [k for k, v in FREE_PROVIDERS.items() if country.lower() in [c.lower() for c in v["countries"]]]
        return {
            "country": country,
            "paid_providers": providers,
            "free_providers": free,
            "cheapest": min(providers, key=lambda k: providers[k]["price"]) if providers else None,
        }
