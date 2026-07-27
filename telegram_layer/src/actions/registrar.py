"""Registrar module — Account creation via SMS/Flash-Call services (Telegram Expert clone)."""

import asyncio
import random
import hashlib
from datetime import datetime, timezone
from typing import Optional
from loguru import logger


class AntiSafetyEmulator:
    """AntiSafety.net push token + SafetyNet token emulation."""

    @staticmethod
    def emulate_safetynet(device_id: str = "") -> dict:
        base = device_id or f"android-{random.randint(100000, 999999)}"
        sig = hashlib.sha256(f"safetynet:{base}:{int(datetime.now(timezone.utc).timestamp())}".encode()).hexdigest()
        return {"token": f"3_{sig[:64]}", "device_id": base, "cts_profile_match": True, "basic_integrity": True, "emulated_at": datetime.now(timezone.utc).isoformat()}

    @staticmethod
    def emulate_push_token(device_id: str = "") -> dict:
        base = device_id or f"device-{random.randint(10000, 99999)}"
        token = f"fp{hashlib.sha256(f'push:{base}:{random.randint(0, 999999)}'.encode()).hexdigest()[:100]}"[:120]
        return {"token": token, "device_id": base, "push_type": "fcm", "emulated_at": datetime.now(timezone.utc).isoformat()}

    @staticmethod
    def emulate_first_launch() -> dict:
        return {
            "first_launch_simulated": True,
            "push_permission_granted": True,
            "safetynet": AntiSafetyEmulator.emulate_safetynet(),
            "push_token": AntiSafetyEmulator.emulate_push_token(),
        }


class RegistrarService:
    """Account registration via SMS or Flash-Call using the SMS Provider Hub."""

    def __init__(self, api_keys: dict[str, str] = None, sms_provider_hub=None):
        self.api_keys = api_keys or {}
        self.sms_provider_hub = sms_provider_hub
        self.pending_orders: dict[str, dict] = {}

    async def get_phone_number(
        self, sms_provider: str = "5sim", country: str = "any",
        operator: str = "any", service: str = "telegram",
        voice_verification: bool = False,
    ) -> dict:
        if self.sms_provider_hub:
            return await self.sms_provider_hub.get_phone_number(sms_provider, country, operator, service, voice_verification)
        raise ValueError("SMS Provider Hub not configured")

    async def register_account(
        self, sms_provider: str = "5sim", country: str = "any",
        operator: str = "any", voice_verification: bool = False,
        anti_safety: bool = False,
    ) -> dict:
        if voice_verification:
            logger.info(f"Voice verification requested — SMS service must support calls: {sms_provider}")
        if self.sms_provider_hub:
            phone_info = await self.sms_provider_hub.get_phone_with_fallback(country, operator, voice_verification=voice_verification)
        else:
            phone_info = await self.get_phone_number(sms_provider, country, operator, voice_verification=voice_verification)
        if "error" in phone_info:
            return phone_info
        phone = phone_info["phone"]
        anti_safety_data = {}
        if anti_safety:
            anti_safety_data = AntiSafetyEmulator.emulate_first_launch()
            logger.info(f"AntiSafety tokens emulated for {phone}")
        if self.sms_provider_hub:
            code = await self.sms_provider_hub.get_sms_code(phone, sms_provider)
        else:
            code = await self.get_sms_code(phone, sms_provider)
        if code.startswith("ERROR") or code == "TIMEOUT":
            return {"error": f"SMS code retrieval failed: {code}"}
        result = {
            "phone": phone, "code": code, "country": country,
            "voice_verification": voice_verification, "anti_safety": anti_safety,
            "anti_safety_tokens": anti_safety_data if anti_safety else None,
            "status": "code_received", "next_step": "complete_registration_via_telethon",
        }
        logger.info(f"Registration ready for {phone}: code={code}")
        return result

    # ─── Flash-Call Registration ───────────────────────────────────

    async def request_flash_call(self, phone: str, provider: Optional[str] = None) -> dict:
        """Request a flash call (missed call) for instant verification.

        Flash calls are faster than SMS and don't require reading codes.
        The last digits of the caller's number serve as the verification code.
        """
        logger.info(f"Requesting flash call for {phone} via {provider or 'auto'}")
        if self.sms_provider_hub:
            result = await self.sms_provider_hub.get_phone_with_fallback(
                voice_verification=True, user_id=None)
            if "error" in result:
                return result
            call_info = {
                "phone": phone, "flash_call_requested": True,
                "provider": provider or "auto",
                "expected_code_digits": 2,
                "status": "call_initiated",
                "note": "Last 2 digits of incoming number are the code. Must answer and hang up immediately.",
            }
            self.pending_orders[phone] = {"phone": phone, "method": "flash_call", "provider": provider or "auto"}
            return call_info
        return {"error": "SMS Provider Hub not configured for flash calls"}

    async def complete_flash_call_registration(self, phone: str, incoming_number: str) -> dict:
        """Complete registration by extracting code from incoming flash call number."""
        code = incoming_number[-2:]
        logger.info(f"Flash call code extracted for {phone}: {code}")
        self.pending_orders.pop(phone, None)
        result = {
            "phone": phone, "code": code, "method": "flash_call",
            "status": "code_received", "next_step": "complete_registration_via_telethon",
        }
        return result

    # ─── QR Code Registration ──────────────────────────────────────

    async def request_qr_registration(self, cloud_password: Optional[str] = None) -> dict:
        """Generate QR code for registration via Telegram mobile app."""
        logger.info("QR registration requested (requires Telegram mobile app)")
        return {
            "qr_generated": True,
            "method": "qr_code",
            "instructions": "Scan with Telegram mobile app Settings > Devices > Link Desktop Device",
            "requires_cloud_password": bool(cloud_password),
            "status": "awaiting_scan",
        }

    # ─── Profile & Utility ─────────────────────────────────────────

    async def set_profile(self, client, phone: str, display_name: str, bio: str = "", photo_path: str = "") -> bool:
        try:
            from telethon.tl.functions.account import UpdateProfileRequest
            from telethon.tl.functions.photos import UploadProfilePhotoRequest
            if display_name:
                await client(UpdateProfileRequest(first_name=display_name))
            if bio:
                await client(UpdateProfileRequest(about=bio))
            if photo_path:
                photo = await client.upload_file(photo_path)
                await client(UploadProfilePhotoRequest(photo=photo))
            logger.info(f"Profile set for {phone}")
            return True
        except Exception as e:
            logger.error(f"Set profile error: {e}")
            return False

    @staticmethod
    def check_voice_verification_compatibility(sms_provider: str) -> dict:
        call_supported = {"sms-activate": True, "5sim": False, "onlinesim": False, "smspva": True, "getsms": True, "twilio": True, "vonage": True, "smsc": True, "verimor": True}
        supports = call_supported.get(sms_provider, False)
        return {"provider": sms_provider, "voice_verification_supported": supports, "warning": not supports}

    def cancel_order(self, phone: str):
        order = self.pending_orders.pop(phone, None)
        if order:
            if self.sms_provider_hub:
                asyncio.ensure_future(self.sms_provider_hub.withdraw_number(phone, order.get("provider")))
            logger.info(f"Cancelled order for {phone}")
            return True
        return False
