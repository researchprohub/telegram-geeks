"""Debug API response."""
import sys
sys.path.insert(0, "/app")

import asyncio
import httpx

async def test_api():
    async with httpx.AsyncClient() as client:
        # Login
        resp = await client.post("http://localhost:8000/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "Test123456"
        })
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test mass_inspection
        resp = await client.post(
            "http://localhost:8000/api/v1/modules/mass_inspection/execute",
            headers=headers,
            json={"operation": "check_all_accounts", "params": {"folder": "Active", "check_type": "all"}}
        )
        print(f"Status code: {resp.status_code}")
        print(f"Response: {resp.json()}")

asyncio.run(test_api())
