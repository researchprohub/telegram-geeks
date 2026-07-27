"""Debug parameter_generator."""
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
        
        # Test parameter_generator
        resp = await client.post(
            "http://localhost:8000/api/v1/modules/parameter_generator/execute",
            headers=headers,
            json={"operation": "generate_beginner", "params": {
                "app_type": "android",
                "timezone_name": "Russia",
                "count": 10
            }}
        )
        print(f"Status code: {resp.status_code}")
        result = resp.json()
        print(f"Response keys: {result.keys()}")
        print(f"Status: {result.get('status')}")
        print(f"Message: {result.get('message')}")
        if 'result' in result:
            print(f"Result keys: {result['result'].keys()}")

asyncio.run(test())
