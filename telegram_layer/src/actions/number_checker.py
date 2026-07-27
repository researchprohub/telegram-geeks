"""Number checker — Phone number validation (Telegram Expert clone)."""

import re
from loguru import logger


class NumberCheckerService:
    """Validate and check phone numbers for Telegram existence."""

    @staticmethod
    def check_number(phone_number: str) -> dict:
        """Validate a single phone number."""
        # Clean the number
        cleaned = re.sub(r'[^\d+]', '', phone_number)

        # Basic format validation
        valid = bool(re.match(r'^\+\d{7,15}$', cleaned))

        result = {
            "original": phone_number,
            "cleaned": cleaned,
            "valid_format": valid,
            "exists_on_telegram": None,  # Requires API call
            "country_code": None,
            "is_valid": valid,
        }

        # Extract country code
        if valid and cleaned.startswith('+'):
            cc_match = re.match(r'^\+(\d{1,3})', cleaned)
            if cc_match:
                result["country_code"] = cc_match.group(1)

        return result

    async def check_numbers_batch(self, phone_numbers: list[str], account_id: str, client_manager) -> list[dict]:
        """Batch check phone numbers via Telegram API."""
        results = []
        client = await client_manager.get_client(account_id)
        if not client:
            return [{"error": "Account not connected"}]

        for phone in phone_numbers:
            try:
                # Resolve phone to Telegram user
                from telethon.tl.functions.contacts import ResolveUsernameRequest
                from telethon.tl.types import InputUserPhone

                resolved = await client(ResolveUsernameRequest(phone))
                if resolved:
                    results.append({
                        "phone": phone,
                        "valid_format": True,
                        "exists_on_telegram": True,
                        "username": getattr(resolved, 'username', None),
                        "first_name": getattr(resolved, 'first_name', None),
                        "last_name": getattr(resolved, 'last_name', None),
                        "is_bot": isinstance(resolved, type) and "bot" in str(type(resolved)).lower(),
                        "is_premium": getattr(resolved, 'premium', False),
                        "status": "found",
                    })
                else:
                    results.append({
                        "phone": phone,
                        "valid_format": True,
                        "exists_on_telegram": False,
                        "status": "not_found",
                    })
            except Exception as e:
                num_check = self.check_number(phone)
                results.append({
                    "phone": phone,
                    "valid_format": num_check["valid_format"],
                    "exists_on_telegram": False,
                    "status": "error",
                    "error": str(e),
                })

            # Anti-detection delay
            import asyncio
            await asyncio.sleep(3 + __import__('random').randint(0, 10))

        return results

    @staticmethod
    def auto_format_phone(raw: str) -> str:
        """Auto-format phone number: remove spaces, brackets, dashes, keep digits and +."""
        cleaned = re.sub(r'[\s\-\(\)\[\]]', '', raw.strip())
        if not cleaned.startswith('+'):
            if cleaned.startswith('00'):
                cleaned = '+' + cleaned[2:]
            elif cleaned.startswith('8') and len(cleaned) == 11:
                pass
            else:
                cleaned = '+' + cleaned
        return cleaned

    @staticmethod
    def validate_country_code(phone: str) -> bool:
        """Validate that a phone number has a valid country code."""
        cc_match = re.match(r'^\+(\d{1,3})', phone)
        if not cc_match:
            return False
        cc = int(cc_match.group(1))
        # Common country codes
        valid_codes = {
            1: "North America", 7: "Russia/Kazakhstan", 20: "Egypt", 27: "South Africa",
            30: "Greece", 31: "Netherlands", 32: "Belgium", 33: "France", 34: "Spain",
            36: "Hungary", 39: "Italy", 40: "Romania", 41: "Switzerland", 43: "Austria",
            44: "UK", 45: "Denmark", 46: "Sweden", 47: "Norway", 48: "Poland",
            49: "Germany", 51: "Peru", 52: "Mexico", 53: "Cuba", 54: "Argentina",
            55: "Brazil", 56: "Chile", 57: "Colombia", 58: "Venezuela", 60: "Malaysia",
            61: "Australia", 62: "Indonesia", 63: "Philippines", 64: "New Zealand",
            65: "Singapore", 66: "Thailand", 81: "Japan", 82: "South Korea",
            84: "Vietnam", 86: "China", 90: "Turkey", 91: "India", 92: "Pakistan",
            93: "Afghanistan", 94: "Sri Lanka", 98: "Iran",
        }
        return cc in valid_codes
