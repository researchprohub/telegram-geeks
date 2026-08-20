"""Test login and get tokens for test accounts."""
import asyncio
import httpx

async def test_login():
    """Test login for both admin and user accounts."""
    
    async with httpx.AsyncClient() as client:
        # Test admin login
        print("Testing Admin Login...")
        resp = await client.post("http://localhost:8001/api/v1/auth/login", json={
            "email": "admin@test.com",
            "password": "Admin@12345678"
        })
        
        if resp.status_code == 200:
            admin_token = resp.json()["access_token"]
            print("✅ Admin login successful!")
            print(f"   Token: {admin_token[:50]}...")
        else:
            print(f"❌ Admin login failed: {resp.json()}")
            admin_token = None
        
        # Test user login
        print("\nTesting User Login...")
        resp = await client.post("http://localhost:8001/api/v1/auth/login", json={
            "email": "demo@test.com",
            "password": "Demo123456"
        })
        
        if resp.status_code == 200:
            user_token = resp.json()["access_token"]
            print("✅ User login successful!")
            print(f"   Token: {user_token[:50]}...")
        else:
            print(f"❌ User login failed: {resp.json()}")
            user_token = None
        
        # Test modules endpoint
        if admin_token:
            print("\nTesting Admin Modules Access...")
            headers = {"Authorization": f"Bearer {admin_token}"}
            resp = await client.get("http://localhost:8001/api/v1/modules", headers=headers)
            
            if resp.status_code == 200:
                modules_data = resp.json()
                print(f"✅ Admin can access {modules_data['total']} modules")
            else:
                print(f"❌ Admin modules access failed: {resp.json()}")
        
        # Test user modules endpoint
        if user_token:
            print("\nTesting User Modules Access...")
            headers = {"Authorization": f"Bearer {user_token}"}
            resp = await client.get("http://localhost:8001/api/v1/modules", headers=headers)
            
            if resp.status_code == 200:
                modules_data = resp.json()
                print(f"✅ User can access {modules_data['total']} modules")
            else:
                print(f"❌ User modules access failed: {resp.json()}")

if __name__ == "__main__":
    asyncio.run(test_login())
