"""
SMSService — Integrates SMS activation providers for automated
              Telegram account registration.

Supported Providers:
  - sms-activate.org (API v1)
  - 5sim.net (API v1)
  - vak-sms.com (API v1)
  - smspva.com (API v1)

Flow:
  1. Request phone number for service 'tg' in target country
  2. Start Telegram client auth flow (send_code_request)
  3. Poll SMS provider for OTP code
  4. Complete sign_up with generated name + device parameters
  5. Save session string to Account DB
  6. Auto-refund number if no SMS arrives within timeout
"""

import asyncio
import logging
from typing import Optional, Literal, Dict, Any
import aiohttp
from app.services.settings_service import SettingsService

logger = logging.getLogger(__name__)

SMS_PROVIDERS = {
    "sms-activate": {
        "base_url": "https://api.sms-activate.org/stubs/handler_api.php",
        "service":  "tg",
    },
    "5sim": {
        "base_url": "https://5sim.net/v1/user",
        "service":  "telegram",
    },
    "vak-sms": {
        "base_url": "https://vak-sms.com/api",
        "service":  "tg",
    },
    "smspva": {
        "base_url": "http://smspva.com/priemnik.php",
        "service":  "opt29",
    },
}

# Country code mappings for SMS-Activate
SMS_ACTIVATE_COUNTRIES = {
    "US": "187", "GB": "16",  "CA": "36",  "DE": "43",
    "FR": "78",  "ES": "56",  "IT": "86",  "RU": "0",
    "UA": "1",   "TR": "26",  "IN": "22",  "BR": "73",
    "ID": "6",   "PK": "66",  "NG": "19",  "EG": "21",
}


class SMSServiceClass:

    # ─────────────────────────────────────────────────────────────────────────
    # REQUEST A NUMBER
    # ─────────────────────────────────────────────────────────────────────────
    async def request_number(
        self,
        provider: Literal["sms-activate", "5sim", "vak-sms", "smspva"] = "sms-activate",
        country: str = "US",
        service: str = "tg",
    ) -> dict:
        """
        Orders a phone number from the specified provider.
        Returns: { id: str, phone: str, cost: float, provider: str }
        """
        api_key = await self._get_api_key(provider)
        if not api_key:
            return {
                "status": "error",
                "message": f"API key not configured for provider: {provider}",
            }

        if provider == "sms-activate":
            country_id = SMS_ACTIVATE_COUNTRIES.get(country, "187")
            url = (
                f"https://api.sms-activate.org/stubs/handler_api.php"
                f"?api_key={api_key}&action=getNumber&service={service}&country={country_id}"
            )
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                    text = await resp.text()

            # Expected: ACCESS_NUMBER:$id:$number
            if text.startswith("ACCESS_NUMBER"):
                parts = text.split(":")
                return {
                    "status":        "success",
                    "activation_id": parts[1],
                    "phone_number":  f"+{parts[2]}",
                    "provider":      provider,
                }
            elif text == "NO_NUMBERS":
                return {"status": "error", "message": "No numbers available in this country"}
            elif text == "NO_BALANCE":
                return {"status": "error", "message": "Insufficient balance on SMS provider"}
            else:
                return {"status": "error", "message": f"SMS provider error: {text}"}

        elif provider == "5sim":
            url = f"https://5sim.net/v1/user/buy/activation/{country.lower()}/any/telegram"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Accept": "application/json",
            }
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return {
                            "status":        "success",
                            "activation_id": str(data["id"]),
                            "phone_number":  data["phone"],
                            "provider":      provider,
                            "price":         data.get("price"),
                        }
                    else:
                        text = await resp.text()
                        return {"status": "error", "message": f"5sim error: {text[:100]}"}

        return {"status": "error", "message": f"Unsupported provider: {provider}"}

    # ─────────────────────────────────────────────────────────────────────────
    # POLL FOR OTP CODE
    # ─────────────────────────────────────────────────────────────────────────
    async def poll_for_code(
        self,
        provider: str,
        activation_id: str,
        timeout_seconds: int = 120,
        poll_interval: int = 5,
    ) -> dict:
        """
        Polls the SMS provider until the OTP code arrives or timeout occurs.
        Auto-cancels / refunds on timeout.
        """
        api_key  = await self._get_api_key(provider)
        elapsed  = 0

        while elapsed < timeout_seconds:
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

            if provider == "sms-activate":
                url = (
                    f"https://api.sms-activate.org/stubs/handler_api.php"
                    f"?api_key={api_key}&action=getStatus&id={activation_id}"
                )
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                        text = await resp.text()

                # STATUS_OK:12345
                if text.startswith("STATUS_OK"):
                    code = text.split(":")[1].strip()
                    return {"status": "received", "code": code, "elapsed_s": elapsed}
                elif text == "STATUS_WAIT_CODE":
                    continue  # Keep waiting
                elif text == "STATUS_CANCEL":
                    return {"status": "cancelled", "message": "Activation was cancelled"}

            elif provider == "5sim":
                url = f"https://5sim.net/v1/user/check/{activation_id}"
                headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            sms_list = data.get("sms", [])
                            if sms_list:
                                code = sms_list[0].get("code", "")
                                return {"status": "received", "code": code, "elapsed_s": elapsed}
                            if data.get("status") == "CANCELED":
                                return {"status": "cancelled", "message": "Activation cancelled"}

        # Timeout reached — trigger auto-refund
        await self.refund_number(provider, activation_id)
        return {
            "status":  "timeout",
            "message": f"No SMS received in {timeout_seconds}s. Number refunded.",
        }

    # ─────────────────────────────────────────────────────────────────────────
    # REFUND / CANCEL NUMBER
    # ─────────────────────────────────────────────────────────────────────────
    async def refund_number(self, provider: str, activation_id: str) -> bool:
        """Cancels an order and requests a refund from the provider."""
        api_key = await self._get_api_key(provider)
        if not api_key:
            return False

        try:
            if provider == "sms-activate":
                # status 8 = cancel / refund
                url = (
                    f"https://api.sms-activate.org/stubs/handler_api.php"
                    f"?api_key={api_key}&action=setStatus&status=8&id={activation_id}"
                )
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                        text = await resp.text()
                return text.startswith("ACCESS_CANCEL")

            elif provider == "5sim":
                url = f"https://5sim.net/v1/user/cancel/{activation_id}"
                headers = {"Authorization": f"Bearer {api_key}"}
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                        return resp.status == 200

        except Exception as e:
            logger.error(f"Refund error for {provider}/{activation_id}: {e}")
            return False

        return False

    # ─────────────────────────────────────────────────────────────────────────
    # FULL AUTOMATED REGISTRATION FLOW
    # ─────────────────────────────────────────────────────────────────────────
    async def full_registration_flow(
        self,
        provider: str,
        country: str,
        account_params: dict,
        proxy: Optional[dict] = None,
    ) -> dict:
        """
        End-to-end automated account registration:
          1. Buy number
          2. Send code via Telethon
          3. Wait for SMS
          4. Complete Telethon signup
          5. Save session string to database
        """
        # Step 1: Request number
        order = await self.request_number(provider=provider, country=country)
        if order.get("status") != "success":
            return order

        phone         = order["phone_number"]
        activation_id = order["activation_id"]

        try:
            from telethon import TelegramClient
            from telethon.sessions import StringSession
            import socks

            # Configure proxy if provided
            proxy_tuple = None
            if proxy:
                proxy_tuple = (
                    socks.SOCKS5,
                    proxy["host"],
                    proxy["port"],
                    True,
                    proxy.get("username"),
                    proxy.get("password"),
                )

            client = TelegramClient(
                StringSession(),
                api_id=account_params["api_id"],
                api_hash=account_params["api_hash"],
                device_model=account_params["device_model"],
                system_version=account_params["system_version"],
                app_version=account_params["app_version"],
                lang_code=account_params["lang_code"],
                system_lang_code=account_params["system_lang_code"],
                proxy=proxy_tuple,
            )

            await client.connect()

            # Step 2: Send code request to Telegram
            sent_code = await client.send_code_request(phone)

            # Step 3: Wait for SMS OTP
            sms_result = await self.poll_for_code(
                provider=provider,
                activation_id=activation_id,
                timeout_seconds=120,
            )

            if sms_result.get("status") != "received":
                await client.disconnect()
                return {
                    "status":  "failed",
                    "stage":   "sms_wait",
                    "message": sms_result.get("message", "SMS timeout"),
                }

            otp_code = sms_result["code"]

            # Step 4: Sign up with name
            try:
                user = await client.sign_up(
                    code=otp_code,
                    first_name=account_params["first_name"],
                    last_name=account_params.get("last_name", ""),
                    phone=phone,
                    phone_code_hash=sent_code.phone_code_hash,
                )
            except Exception:
                # Might already be registered — try sign_in
                user = await client.sign_in(
                    phone=phone,
                    code=otp_code,
                    phone_code_hash=sent_code.phone_code_hash,
                )

            session_str = client.session.save()
            await client.disconnect()

            # Step 5: Save to DB
            from app.models import Account, AccountFolder, AccountStatus
            from app.database import AsyncSessionLocal
            from datetime import datetime, timezone

            async with AsyncSessionLocal() as db:
                acc = Account(
                    phone_number=phone,
                    session_string=session_str,
                    status=AccountStatus.WARMING.value,
                    folder=AccountFolder.ACTIVE.value,
                    first_name=account_params["first_name"],
                    api_id=account_params["api_id"],
                    api_hash=account_params["api_hash"],
                    device_model=account_params["device_model"],
                    os_version=account_params["system_version"],
                    app_version=account_params["app_version"],
                    lang_code=account_params["lang_code"],
                    system_lang_code=account_params["system_lang_code"],
                    country=country,
                    last_check_at=datetime.now(timezone.utc),
                )
                db.add(acc)
                await db.commit()
                await db.refresh(acc)
                account_id = acc.id

            return {
                "status":         "success",
                "account_id":     account_id,
                "phone_number":   phone,
                "telegram_id":    getattr(user, "id", None),
                "first_name":     account_params["first_name"],
                "session_saved":  True,
            }

        except Exception as e:
            # Auto refund on any crash
            await self.refund_number(provider, activation_id)
            logger.error(f"Full registration flow failed: {e}")
            return {
                "status":  "failed",
                "stage":   "registration",
                "error":   str(e),
                "refunded": True,
            }

    async def _get_api_key(self, provider: str) -> Optional[str]:
        """Fetches decrypted API key from system settings."""
        key_name = f"sms_{provider.replace('-', '_')}_api_key"
        return await SettingsService.get(key_name)


SMSService = SMSServiceClass()
