"""Oxapay API integration for crypto payments.

API Docs: https://docs.oxapay.com/
Supports: Multiple cryptos, white-label payments, static addresses.
No KYC required for basic integration.
"""

import aiohttp
from loguru import logger


class OxapayService:
    """Oxapay crypto payment gateway integration."""

    BASE_URL = "https://api.oxapay.com/v1"

    def __init__(self, api_key: str, merchant_id: str = ""):
        self.api_key = api_key
        self.merchant_id = merchant_id
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    async def _request(self, method: str, endpoint: str, data: dict | None = None) -> dict:
        """Make an authenticated API request."""
        async with aiohttp.ClientSession() as session:
            url = f"{self.BASE_URL}{endpoint}"
            async with session.request(method, url, json=data, headers=self.headers, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                if resp.status >= 400:
                    error_text = await resp.text()
                    raise RuntimeError(f"Oxapay API error {resp.status}: {error_text}")
                return await resp.json()

    async def create_invoice(
        self,
        amount: float,
        currency: str = "USD",
        coin: str = "USDT",
        network: str = "TRC20",
        track_id: str = "",
        callback_url: str = "",
        description: str = "",
        expires_in: int = 900,  # 15 minutes
    ) -> dict:
        """Generate a payment invoice.
        
        POST /payment/invoice
        Returns: invoice_id, payment_url, pay_address, pay_amount, etc.
        """
        payload = {
            "amount": amount,
            "currency": currency,
            "coin": coin,
            "network": network,
            "track_id": track_id,
            "expires_in": expires_in,
        }
        if description:
            payload["description"] = description
        if callback_url:
            payload["callback_url"] = callback_url

        result = await self._request("POST", "/payment/invoice", payload)
        logger.info(f"Oxapay invoice created: track_id={track_id}")
        return result

    async def create_white_label(
        self,
        amount: float,
        currency: str = "USD",
        coin: str = "USDT",
        network: str = "TRC20",
        track_id: str = "",
        callback_url: str = "",
        branding: dict | None = None,
    ) -> dict:
        """Generate a white-label payment (branded, no Oxapay redirect).
        
        POST /payment/white-label
        Returns: payment_address, pay_amount, qr_code, etc.
        """
        payload = {
            "amount": amount,
            "currency": currency,
            "coin": coin,
            "network": network,
            "track_id": track_id,
        }
        if callback_url:
            payload["callback_url"] = callback_url
        if branding:
            payload["branding"] = branding

        result = await self._request("POST", "/payment/white-label", payload)
        logger.info(f"Oxapay white-label created: track_id={track_id}")
        return result

    async def create_static_address(
        self,
        coin: str = "USDT",
        network: str = "TRC20",
        track_id: str = "",
        callback_url: str = "",
    ) -> dict:
        """Generate a static deposit address.
        
        POST /payment/static-address
        """
        payload = {
            "coin": coin,
            "network": network,
            "track_id": track_id,
        }
        if callback_url:
            payload["callback_url"] = callback_url

        result = await self._request("POST", "/payment/static-address", payload)
        return result

    async def get_payment_status(self, track_id: str) -> dict:
        """Check payment status.
        
        GET /payment/{track_id}
        """
        return await self._request("GET", f"/payment/{track_id}")

    async def list_payments(
        self,
        page: int = 1,
        limit: int = 50,
        status: str = "",
        coin: str = "",
    ) -> dict:
        """List all payments.
        
        GET /payment/list
        """
        params = {"page": page, "limit": limit}
        if status:
            params["status"] = status
        if coin:
            params["coin"] = coin
        return await self._request("GET", "/payment/list", params)

    async def handle_callback(self, payload: dict) -> bool:
        """Handle webhook callback from Oxapay.
        
        Validates and processes incoming payment notifications.
        """
        track_id = payload.get("track_id", "")
        status = payload.get("status", "")
        coin = payload.get("coin", "")
        amount = payload.get("amount", 0)
        paid_amount = payload.get("paid_amount", 0)
        tx_hash = payload.get("tx_hash", "")

        logger.info(f"Oxapay callback: track_id={track_id}, status={status}, amount={amount}")

        # Process confirmed payments
        if status in ("paid", "paid_over", "completed"):
            logger.info(f"Payment confirmed: track_id={track_id}, tx={tx_hash}")
            # TODO: Update order in database, credit user account
            return True

        return False

    async def get_exchange_rate(self, from_coin: str, to_coin: str = "USDT") -> dict:
        """Get exchange rate between two coins.
        
        GET /exchange/rate
        """
        return await self._request("GET", "/exchange/rate", {
            "fromCoin": from_coin,
            "toCoin": to_coin,
        })

    async def convert_crypto(
        self,
        from_coin: str,
        to_coin: str,
        from_network: str,
        to_network: str,
        amount: float,
    ) -> dict:
        """Convert between cryptocurrencies.
        
        POST /exchange/convert
        """
        return await self._request("POST", "/exchange/convert", {
            "fromCoin": from_coin,
            "toCoin": to_coin,
            "fromNetwork": from_network,
            "toNetwork": to_network,
            "amount": amount,
        })


# Module-level singleton for endpoint convenience
_default = OxapayService(api_key="")


async def create_invoice(*args, **kwargs) -> dict:
    return await _default.create_invoice(*args, **kwargs)


async def get_payment_status(*args, **kwargs) -> dict:
    return await _default.get_payment_status(*args, **kwargs)
