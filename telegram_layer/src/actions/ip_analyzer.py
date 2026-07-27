"""IP Intersection Analyzer — Detect cross-account IP conflicts and proxy overlaps.

Telegram flags accounts sharing the same IP. This module detects intersections
before they become a ban vector.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional
from loguru import logger


class IpIntersectionAnalyzer:
    """Analyze IP/Proxy intersections across accounts to detect ban risks."""

    def __init__(self):
        self._account_ips: dict[str, dict] = {}  # phone -> {ip, proxy, last_seen, country}
        self._ip_accounts: dict[str, list[str]] = {}  # ip -> [phones]
        self._intersection_history: list[dict] = []

    def register_account_ip(self, phone: str, ip: str, proxy: Optional[str] = None, country: Optional[str] = None):
        now = datetime.now(timezone.utc)
        old = self._account_ips.get(phone)
        if old and old.get("ip") != ip:
            self._intersection_history.append({
                "phone": phone, "old_ip": old["ip"], "new_ip": ip,
                "proxy": proxy, "timestamp": now.isoformat(),
                "type": "ip_change",
            })
        if old and old.get("ip") == ip:
            self._account_ips[phone]["last_seen"] = now
            if proxy:
                self._account_ips[phone]["proxy"] = proxy
            return

        self._account_ips[phone] = {"ip": ip, "proxy": proxy, "country": country, "last_seen": now, "registered": now}
        self._ip_accounts.setdefault(ip, []).append(phone)
        logger.info(f"Registered IP {ip} for {phone}")

    def remove_account(self, phone: str):
        old = self._account_ips.pop(phone, None)
        if old:
            ip = old["ip"]
            if ip in self._ip_accounts:
                self._ip_accounts[ip] = [p for p in self._ip_accounts[ip] if p != phone]
                if not self._ip_accounts[ip]:
                    del self._ip_accounts[ip]

    def find_intersections(self, min_accounts: int = 2) -> list[dict]:
        results = []
        for ip, phones in self._ip_accounts.items():
            if len(phones) >= min_accounts:
                accounts = [{"phone": p, **self._account_ips.get(p, {})} for p in phones]
                results.append({"ip": ip, "account_count": len(phones), "accounts": accounts, "risk": "high" if len(phones) >= 5 else "medium" if len(phones) >= 3 else "low"})
        return sorted(results, key=lambda x: x["account_count"], reverse=True)

    def get_account_ip(self, phone: str) -> Optional[dict]:
        return self._account_ips.get(phone)

    def get_ip_accounts(self, ip: str) -> list[str]:
        return self._ip_accounts.get(ip, [])

    def check_account_risk(self, phone: str) -> dict:
        info = self._account_ips.get(phone)
        if not info:
            return {"phone": phone, "risk": "unknown", "reason": "No IP registered"}
        ip = info["ip"]
        sharing = [p for p in self._ip_accounts.get(ip, []) if p != phone]
        risk = "none"
        reason = "Unique IP"
        if len(sharing) >= 5:
            risk = "critical"
            reason = f"IP shared by {len(sharing)+1} accounts (including this one)"
        elif len(sharing) >= 3:
            risk = "high"
            reason = f"IP shared by {len(sharing)+1} accounts"
        elif sharing:
            risk = "medium"
            reason = f"IP shared with {len(sharing)} other account(s)"
        return {"phone": phone, "ip": ip, "risk": risk, "reason": reason, "sharing_with": sharing, "proxy": info.get("proxy"), "country": info.get("country")}

    def find_clusters(self, min_cluster_size: int = 3) -> list[dict]:
        clusters = []
        for ip, phones in self._ip_accounts.items():
            if len(phones) >= min_cluster_size:
                clusters.append({"ip": ip, "size": len(phones), "phones": phones, "created_at": min((self._account_ips[p]["registered"] for p in phones if self._account_ips[p].get("registered")), default=datetime.now(timezone.utc)).isoformat()})
        return sorted(clusters, key=lambda x: x["size"], reverse=True)

    def get_proxy_overlap(self) -> list[dict]:
        proxy_map: dict[str, list[str]] = {}
        for phone, info in self._account_ips.items():
            proxy = info.get("proxy")
            if proxy:
                proxy_map.setdefault(proxy, []).append(phone)
        return [{"proxy": proxy, "account_count": len(phones), "phones": phones} for proxy, phones in proxy_map.items() if len(phones) > 1]

    def export_report(self) -> dict:
        return {
            "total_accounts_tracked": len(self._account_ips),
            "unique_ips": len(self._ip_accounts),
            "intersection_clusters": self.find_clusters(2),
            "proxy_overlaps": self.get_proxy_overlap(),
            "high_risk_accounts": [self.check_account_risk(p) for p in self._account_ips if self.check_account_risk(p)["risk"] in ("critical", "high")],
            "recent_ip_changes": self._intersection_history[-20:] if self._intersection_history else [],
        }


ip_analyzer = IpIntersectionAnalyzer()
