"""Geo Location — proxy-country matching for accounts."""

from loguru import logger


class GeoLocationService:
    def __init__(self):
        self.proxy_geo: dict[str, dict] = {}
        self.account_geo: dict[str, dict] = {}

    def register_proxy(self, proxy_string: str, country: str, city: str = "", isp: str = "") -> dict:
        self.proxy_geo[proxy_string] = {"country": country, "city": city, "isp": isp}
        return {"status": "ok", "proxy": proxy_string, "country": country}

    def register_account(self, phone: str, country: str, timezone: str = "") -> dict:
        self.account_geo[phone] = {"country": country, "timezone": timezone}
        return {"status": "ok", "phone": phone, "country": country}

    def find_best_proxy(self, phone: str) -> dict:
        acc = self.account_geo.get(phone)
        if not acc:
            return {"error": "account not registered", "matched": False}
        country = acc["country"]
        proxies_in_country = [(p, g) for p, g in self.proxy_geo.items() if g.get("country") == country]
        if not proxies_in_country:
            return {"error": f"no proxy in {country}", "matched": False}
        best = proxies_in_country[0]
        return {"matched": True, "proxy": best[0], "country": best[1]["country"], "city": best[1].get("city", "")}

    def get_stats(self) -> dict:
        return {"proxies": len(self.proxy_geo), "accounts": len(self.account_geo)}
