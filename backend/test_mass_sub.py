"""Debug mass_subscriptions."""
import sys
sys.path.insert(0, "/app")

import asyncio
import httpx

async def test():
    async with httpx.AsyncClient() as client:
        # Login
        resp = await client.post("http://localhost:8000/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "Test123456"
        })
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test mass_subscriptions
        resp = await client.post(
            "http://localhost:8000/api/v1/modules/mass_subscriptions/execute",
            headers=headers,
            json={"operation": "subscribe_to_channels", "params": {
                "account_phones": ["+1234567890"],
                "channel_links": ["t.me/channel"],
                "thread_count": 2
            }}
        )
        print(f"Status code: {resp.status_code}")
        result = resp.json()
        print(f"Full response: {result}")

asyncio.run(test())
