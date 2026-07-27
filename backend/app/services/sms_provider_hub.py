"""SMS Provider Hub — 25+ provider registry with priority routing, fallback chain, balance checking."""

import asyncio
import random
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
from loguru import logger


PROVIDER_REGISTRY = {
    # === Free / Low-Cost Providers ===
    "sms-activate": {"base_url": "https://sms-activate.org/steals/index.php", "paid": False, "countries": ["ru", "ua", "kz", "us", "gb"], "voice": True, " Regions": "global"},
    "5sim": {"base_url": "https://5sim.net/function/user/buyActiv", "paid": False, "countries": ["ru", "ua", "us", "gb", "de", "fr"], "voice": False, " Regions": "global"},
    "onlinesim": {"base_url": "https://api.onlinesim.ru/sms/send", "paid": False, "countries": ["ru", "ua", "kz"], "voice": False, " Regions": "ru/cis"},
    "smspva": {"base_url": "https://smspva.com/api/v1/order", "paid": False, "countries": ["ru", "ua", "us", "gb"], "voice": True, " Regions": "global"},
    "smshub": {"base_url": "https://smshub.org/api/v2", "paid": False, "countries": ["ru", "ua", "us", "gb", "de"], "voice": False, " Regions": "global"},
    "sms-man": {"base_url": "https://api.sms-man.com/control", "paid": False, "countries": ["ru", "ua", "us", "gb", "de", "fr"], "voice": False, " Regions": "global"},
    "demosms": {"base_url": "https://demosms.app/api/v1", "paid": False, "countries": ["ru", "ua"], "voice": False, " Regions": "ru/cis"},
    "sms-reg": {"base_url": "https://api.sms-reg.com/getNumber", "paid": False, "countries": ["ru", "ua"], "voice": False, " Regions": "ru/cis"},
    "getsms": {"base_url": "https://api.getsms.online/v1", "paid": False, "countries": ["ru", "ua", "us"], "voice": True, " Regions": "global"},
    "smsak": {"base_url": "https://api.smsak.org/v1", "paid": True, "countries": ["tr"], "voice": False, " Regions": "turkey"},
    "numverify": {"base_url": "https://api.numverify.com/v1", "paid": False, "countries": ["us", "gb", "ca"], "voice": False, " Regions": "global"},
    "temporary-phone": {"base_url": "https://api.temporary-phone.com/v1", "paid": False, "countries": ["us", "gb"], "voice": False, " Regions": "us/uk"},
    "receive-sms-online": {"base_url": "https://api.receive-sms-online.cc/v1", "paid": False, "countries": ["us", "gb", "ca"], "voice": False, " Regions": "us/uk"},
    "smsreceive24": {"base_url": "https://api.smsreceive24.com/v1", "paid": False, "countries": ["us", "gb", "de"], "voice": False, " Regions": "global"},

    # === Paid Global Providers ===
    "twilio": {"base_url": "https://api.twilio.com/2010-04-01", "paid": True, "countries": ["us", "gb", "ca", "au", "de", "fr", "es", "it"], "voice": True, " Regions": "global"},
    "vonage": {"base_url": "https://api.nexmo.com/v1", "paid": True, "countries": ["us", "gb", "ca", "de", "fr", "es"], "voice": True, " Regions": "global"},
    "plivo": {"base_url": "https://api.plivo.com/v1", "paid": True, "countries": ["us", "gb", "ca", "au"], "voice": True, " Regions": "global"},
    "sinch": {"base_url": "https://sms.api.sinch.com/xms/v1", "paid": True, "countries": ["us", "gb", "se", "de", "fr"], "voice": True, " Regions": "global"},
    "messagebird": {"base_url": "https://rest.messagebird.com", "paid": True, "countries": ["us", "gb", "nl", "de", "fr", "es"], "voice": True, " Regions": "global"},
    "clickatell": {"base_url": "https://platform.clickatell.com/v1", "paid": True, "countries": ["us", "gb", "au", "za"], "voice": False, " Regions": "global"},
    "textlocal": {"base_url": "https://api.txtlocal.com", "paid": True, "countries": ["gb", "us"], "voice": True, " Regions": "uk/us"},

    # === Regional Providers ===
    "smsc": {"base_url": "https://smsc.ru/sys/send.php", "paid": True, "countries": ["ru", "ua", "kz"], "voice": True, " Regions": "ru/cis"},
    "smsru": {"base_url": "https://sms.ru/sms/send", "paid": True, "countries": ["ru"], "voice": False, " Regions": "russia"},
    "redsms": {"base_url": "https://cp.redsms.ru/api/v1", "paid": True, "countries": ["ru", "kz"], "voice": True, " Regions": "ru/cis"},

    # === India Providers ===
    "msg91": {"base_url": "https://api.msg91.com/api/v5", "paid": True, "countries": ["in"], "voice": False, " Regions": "india"},
    "textlocal-in": {"base_url": "https://api.textlocal.in", "paid": True, "countries": ["in"], "voice": False, " Regions": "india"},

    # === Vietnam Providers ===
    "vietguys": {"base_url": "https://api.vietguys.biz/v1", "paid": True, "countries": ["vn"], "voice": False, " Regions": "vietnam"},
    "speedads": {"base_url": "https://api.speedads.vn/v1", "paid": True, "countries": ["vn"], "voice": False, " Regions": "vietnam"},
    "esms": {"base_url": "https://api.esms.vn/v1", "paid": True, "countries": ["vn"], "voice": True, " Regions": "vietnam"},

    # === Turkey Providers ===
    "netgsm": {"base_url": "https://api.netgsm.com.tr/v1", "paid": True, "countries": ["tr"], "voice": False, " Regions": "turkey"},
    "mutlucell": {"base_url": "https://api.mutlucell.com.tr/v1", "paid": True, "countries": ["tr"], "voice": False, " Regions": "turkey"},
    "verimor": {"base_url": "https://api.verimor.com.tr/v2", "paid": True, "countries": ["tr"], "voice": True, " Regions": "turkey"},
}

DEFAULT_PRIORITY = ["5sim", "sms-activate", "onlinesim", "smspva", "smshub", "sms-man", "getsms", "demosms", "sms-reg", "temporary-phone"]


@dataclass
class ProviderHealth:
    provider_id: str
    healthy: bool = True
    last_checked: Optional[datetime] = None
    fail_count: int = 0
    total_requests: int = 0
    avg_response_time: float = 0.0


class SmsProviderHub:
    """Central hub managing all SMS providers with priority routing and fallback."""

    def __init__(self, api_keys: dict[str, str] = None, priority_chain: list[str] = None):
        self.api_keys = api_keys or {}
        self.priority_chain = priority_chain or DEFAULT_PRIORITY
        self.health: dict[str, ProviderHealth] = {pid: ProviderHealth(provider_id=pid) for pid in PROVIDER_REGISTRY}
        self.pending_orders: dict[str, dict] = {}
        self._user_priorities: dict[int, list[str]] = {}  # user_id -> custom priority chain

    def get_configured_providers(self) -> list[str]:
        return [pid for pid in PROVIDER_REGISTRY if pid in self.api_keys or not PROVIDER_REGISTRY[pid]["paid"]]

    def get_provider_info(self, provider_id: str) -> Optional[dict]:
        info = PROVIDER_REGISTRY.get(provider_id)
        if not info:
            return None
        return {**info, "configured": provider_id in self.api_keys, "healthy": self.health.get(provider_id, ProviderHealth(provider_id)).healthy}

    def get_providers_by_country(self, country: str) -> list[dict]:
        country = country.lower()
        results = []
        for pid, info in PROVIDER_REGISTRY.items():
            countries = [c.lower() for c in info["countries"]]
            if country in countries or "any" in countries or country == "any":
                configured = pid in self.api_keys or not info["paid"]
                h = self.health.get(pid, ProviderHealth(pid))
                results.append({**info, "id": pid, "configured": configured, "healthy": h.healthy})
        return sorted(results, key=lambda x: (not x["configured"], x["id"]))

    def set_user_priority(self, user_id: int, priority_chain: list[str]):
        self._user_priorities[user_id] = priority_chain

    def get_effective_chain(self, user_id: Optional[int] = None) -> list[str]:
        if user_id and user_id in self._user_priorities:
            return self._user_priorities[user_id]
        return self.priority_chain

    async def get_phone_number(self, sms_provider: str, country: str = "any", operator: str = "any", service: str = "telegram", voice_verification: bool = False, user_id: Optional[int] = None) -> dict:
        provider = PROVIDER_REGISTRY.get(sms_provider)
        if not provider:
            raise ValueError(f"Unknown SMS provider: {sms_provider}")
        api_key = self.api_keys.get(sms_provider)
        if not api_key and provider["paid"]:
            raise ValueError(f"No API key configured for paid provider {sms_provider}")

        params = {"provider": sms_provider, "country": country, "service": service}
        if sms_provider == "sms-activate":
            params.update({"action": "getNumber", "operator": operator, "api_key": api_key or "", "numberType": "1"})
        elif sms_provider == "5sim":
            params.update({"country": country.upper(), "operator": operator, "api_key": api_key or ""})
        elif sms_provider == "onlinesim":
            params.update({"apikey": api_key or ""})
        elif sms_provider == "smspva":
            params.update({"api_key": api_key or ""})

        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get(provider["base_url"], params=params, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                    data = await resp.json()
        except Exception as e:
            self.health[sms_provider].fail_count += 1
            self.health[sms_provider].healthy = False
            self.health[sms_provider].last_checked = datetime.now(timezone.utc)
            return {"error": f"Provider {sms_provider} failed: {e}"}

        self.health[sms_provider].total_requests += 1
        self.health[sms_provider].last_checked = datetime.now(timezone.utc)

        phone = data.get("phone", "") or data.get("number", "")
        order_id = data.get("id", "") or data.get("order_id", "") or data.get("activation_id", "")
        if phone:
            self.pending_orders[phone] = {"provider": sms_provider, "order_id": order_id, "country": country, "service": service, "phone": phone}
            logger.info(f"Got phone {phone} from {sms_provider}")
            return {"phone": phone, "order_id": order_id, "status": "waiting_code"}
        return {"error": f"Provider {sms_provider}: {data.get('status', 'no_phone')}"}

    async def get_phone_with_fallback(self, country: str = "any", operator: str = "any", service: str = "telegram", voice_verification: bool = False, user_id: Optional[int] = None) -> dict:
        chain = self.get_effective_chain(user_id)
        errors = []
        for provider_id in chain:
            if voice_verification and not PROVIDER_REGISTRY.get(provider_id, {}).get("voice"):
                logger.info(f"Skipping {provider_id} — voice not supported")
                continue
            h = self.health.get(provider_id, ProviderHealth(provider_id))
            if not h.healthy:
                errors.append(f"{provider_id}: unhealthy")
                continue
            result = await self.get_phone_number(provider_id, country, operator, service, voice_verification, user_id)
            if "error" not in result:
                return result
            errors.append(result["error"])
            logger.warning(f"Provider {provider_id} failed, trying next: {result['error']}")
        return {"error": "All providers exhausted", "errors": errors}

    async def get_sms_code(self, phone: str, sms_provider: Optional[str] = None) -> str:
        order = self.pending_orders.get(phone)
        if not order:
            raise ValueError(f"No pending order for phone {phone}")
        provider_id = sms_provider or order["provider"]
        provider = PROVIDER_REGISTRY.get(provider_id)
        if not provider:
            raise ValueError(f"Unknown provider: {provider_id}")
        api_key = self.api_keys.get(provider_id)
        if not api_key:
            raise ValueError(f"No API key for {provider_id}")

        for attempt in range(30):
            await asyncio.sleep(10)
            try:
                import aiohttp
                params = {"id": order["order_id"], "api_key": api_key} if provider_id == "sms-activate" else {"phone": phone}
                async with aiohttp.ClientSession() as session:
                    async with session.get(provider["base_url"], params=params, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                        data = await resp.json()
            except Exception:
                continue

            if provider_id == "sms-activate":
                status = data.get("status", "")
                if status == "ACTIVATION_OK":
                    code = data.get("phone", "").split("-")[-1] if "-" in data.get("phone", "") else data.get("s", "")
                    logger.info(f"Received code for {phone}")
                    return code
                if status.startswith("6"):
                    return f"ERROR: {status}"
            code = data.get("code", "") or data.get("sms_code", "") or data.get("text", "")
            if code and code.isdigit() and len(code) >= 4:
                return code
        return "TIMEOUT"

    async def withdraw_number(self, phone: str, provider_id: Optional[str] = None) -> bool:
        order = self.pending_orders.pop(phone, None)
        if not order:
            return False
        logger.info(f"Withdrew phone {phone} from {provider_id or order['provider']}")
        return True

    def get_balance(self, provider_id: str) -> dict:
        return {"provider": provider_id, "balance": 0.0, "currency": "USD", "status": "not_implemented"}

    def list_providers(self, user_id: Optional[int] = None) -> dict:
        configured = self.get_configured_providers()
        return {
            "total": len(PROVIDER_REGISTRY),
            "configured": len(configured),
            "healthy": sum(1 for h in self.health.values() if h.healthy),
            "providers": {pid: self.get_provider_info(pid) for pid in PROVIDER_REGISTRY},
            "priority_chain": self.get_effective_chain(user_id),
            "user_priority_active": user_id in self._user_priorities if user_id else False,
        }

    def get_health_summary(self) -> dict:
        return {pid: {"healthy": h.healthy, "fail_count": h.fail_count, "total_requests": h.total_requests, "last_checked": h.last_checked.isoformat() if h.last_checked else None} for pid, h in self.health.items()}


hub = SmsProviderHub()
