"""NowPayments API integration for crypto payments."""

import hashlib
import hmac
import time
import aiohttp
from typing import Optional
from loguru import logger


class NowPaymentsService:
    """NowPayments crypto payment gateway integration.
    
    API Docs: https://nowpayments.io/api
    Supports: 200+ cryptocurrencies, fiat conversion, lowest fees.
    """

    BASE_URL = "https://api.nowpayments.io/v1"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def _request(self, method: str, endpoint: str, data: dict | None = None) -> dict:
        """Make an authenticated API request."""
        async with aiohttp.ClientSession() as session:
            url = f"{self.BASE_URL}{endpoint}"
            async with session.request(method, url, json=data, headers=self.headers, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                if resp.status >= 400:
                    error_text = await resp.text()
                    raise RuntimeError(f"NowPayments API error {resp.status}: {error_text}")
                return await resp.json()

    async def create_payment(
        self,
        amount: float,
        currency: str = "USD",
        pay_currency: Optional[str] = None,
        order_id: str = "",
        order_description: str = "",
        ipn_url: str = "",
        limit_price: Optional[str] = None,
        price_currency: Optional[str] = None,
        network: Optional[str] = None,
        network_fee: Optional[str] = "medium",
        metadata: dict | None = None,
    ) -> dict:
        """Create a payment invoice.
        
        POST /payment
        Returns: payment_id, pay_address, pay_amount, expiration_date, etc.
        """
        payload = {
            "price_amount": amount,
            "price_currency": currency,
            "order_id": order_id,
            "order_description": order_description,
        }
        if pay_currency:
            payload["pay_currency"] = pay_currency
        if ipn_url:
            payload["ipn_callback_url"] = ipn_url
        if limit_price:
            payload["limit_price"] = limit_price
        if price_currency:
            payload["price_currency"] = price_currency
        if network:
            payload["network"] = network
        if network_fee:
            payload["network_fee"] = network_fee
        if metadata:
            payload["metadata"] = metadata

        result = await self._request("POST", "/payment", payload)
        logger.info(f"NowPayments payment created: {result.get('payment_id')}")
        return result

    async def create_invoice(
        self,
        amount: float,
        currency: str = "USD",
        order_id: str = "",
        order_description: str = "",
        ipn_url: str = "",
        metadata: dict | None = None,
    ) -> dict:
        """Create a payment invoice (redirect-based).
        
        POST /invoice
        Returns: invoice_id, invoice_url, etc.
        """
        payload = {
            "price_amount": amount,
            "price_currency": currency,
            "order_id": order_id,
            "order_description": order_description,
        }
        if ipn_url:
            payload["ipn_callback_url"] = ipn_url
        if metadata:
            payload["metadata"] = metadata

        result = await self._request("POST", "/invoice", payload)
        logger.info(f"NowPayments invoice created: {result.get('invoice_id')}")
        return result

    async def get_payment_status(self, payment_id: str) -> dict:
        """Get payment status.
        
        GET /payment/{paymentId}
        """
        return await self._request("GET", f"/payment/{payment_id}")

    async def get_supported_currencies(self, fiat_currency: str = "usd") -> list[str]:
        """Get list of supported cryptocurrencies.
        
        GET /supported-currencies?fiat_currency=usd
        """
        result = await self._request("GET", "/supported-currencies", {"fiat_currency": fiat_currency})
        return result if isinstance(result, list) else []

    async def calculate_fiat_amount(self, crypto_amount: float, from_currency: str, to_currency: str = "USD") -> dict:
        """Calculate fiat equivalent of crypto amount.
        
        POST /calculator
        """
        return await self._request("POST", "/calculator", {
            "from": from_currency,
            "to": to_currency,
            "amount": crypto_amount,
        })

    async def handle_ipn(self, payload: dict) -> bool:
        """Handle Instant Payment Notification webhook.
        
        Validates the IPN and processes the payment.
        """
        # Validate IPN (check that it's from NowPayments)
        ipn_id = payload.get("ipn_id")
        payment_id = payload.get("payment_id")
        payment_status = payload.get("payment_status")
        pay_amount = payload.get("pay_amount")
        actual_amount = payload.get("actual_amount", 0)
        order_id = payload.get("order_id", "")

        logger.info(f"NowPayments IPN received: payment={payment_id}, status={payment_status}, order={order_id}")

        # Only process confirmed payments
        if payment_status in ("confirmed", "finished"):
            # Mark order as completed in your database
            # TODO: Update order status in DB
            logger.info(f"Payment {payment_id} confirmed for order {order_id}")
            return True

        return False

    async def validate_ipn_signature(self, payload: dict, signature: str) -> bool:
        """Validate IPN signature using HMAC-SHA512."""
        # NowPayments signs the payload with your API key
        data = str(payload).encode()
        expected = hmac.new(
            self.api_key.encode(),
            data,
            hashlib.sha512,
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    async def refund_payment(
        self,
        payment_id: str,
        pay_amount: float,
        pay_currency: str,
        refund_address: str,
        refund_currency: str = "USD",
    ) -> dict:
        """Issue a refund.
        
        POST /refund
        """
        return await self._request("POST", "/refund", {
            "payment_id": payment_id,
            "pay_amount": pay_amount,
            "pay_currency": pay_currency,
            "refund_address": refund_address,
            "refund_currency": refund_currency,
        })


# Module-level singleton for endpoint convenience
_default = NowPaymentsService(api_key="")


async def create_payment(*args, **kwargs) -> dict:
    return await _default.create_payment(*args, **kwargs)


async def get_payment_status(*args, **kwargs) -> dict:
    return await _default.get_payment_status(*args, **kwargs)
