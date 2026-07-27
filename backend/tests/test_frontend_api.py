"""Test API connectivity from frontend container."""
import sys
sys.path.insert(0, "/app")

import asyncio
import httpx

async def test_api():
    """Test API connectivity."""
    async with httpx.AsyncClient() as client:
        # Test login
        print("Testing login endpoint...")
        resp = await client.post("http://backend:8000/api/v1/auth/login", json={
            "email": "admin@test.com",
            "password": "Test123456"
        })
        
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.json()}")
        
        if resp.status_code == 200:
            token = resp.json()["access_token"]
            print(f"Token: {token[:50]}...")
            
            # Test modules endpoint
            print("\nTesting modules endpoint...")
            headers = {"Authorization": f"Bearer {token}"}
            resp = await client.get("http://backend:8000/api/v1/modules", headers=headers)
            
            print(f"Status: {resp.status_code}")
            modules_data = resp.json()
            print(f"Total modules: {modules_data['total']}")
        else:
            print(f"Login failed: {resp.json()}")

if __name__ == "__main__":
    asyncio.run(test_api())
