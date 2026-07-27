"""Booster Username Pre-Check — validates accounts have usernames before warm-up."""

from loguru import logger


class UsernameChecker:
    """Check if accounts have usernames before booster warm-up."""

    def __init__(self, client_manager=None):
        self.client_manager = client_manager

    async def check_accounts(self, phone_numbers: list[str]) -> dict:
        """Check which accounts have usernames set. Returns validation result."""
        has_username = []
        missing_username = []
        errors = []
        for phone in phone_numbers:
            if not self.client_manager:
                errors.append({"phone": phone, "error": "No client manager available"})
                continue
            try:
                client = await self.client_manager.get_client(phone)
                if not client:
                    errors.append({"phone": phone, "error": "Account not connected"})
                    continue
                me = await client.get_me()
                if getattr(me, "username", None):
                    has_username.append(phone)
                else:
                    missing_username.append(phone)
            except Exception as e:
                errors.append({"phone": phone, "error": str(e)})
        return self._build_result(has_username, missing_username, errors)

    @staticmethod
    def _build_result(has: list[str], missing: list[str], errors: list[dict]) -> dict:
        total = len(has) + len(missing) + len(errors)
        result = {
            "total_checked": total,
            "has_username": len(has),
            "missing_username": len(missing),
            "errors": len(errors),
            "accounts_with_username": has,
            "accounts_missing_username": missing,
            "can_proceed": len(missing) == 0 and len(errors) == 0,
            "warning": None,
            "error_details": errors,
        }
        if missing:
            result["warning"] = f"{len(missing)} accounts missing usernames — will be skipped during warm-up."
        return result
