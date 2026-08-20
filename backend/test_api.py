"""Test script to register user and test modules via API."""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:8001/api/v1"

async def main():
    async with httpx.AsyncClient() as client:
        # Step 1: Register a user
        print("Step 1: Registering user...")
        try:
            resp = await client.post(f"{BASE_URL}/auth/register", json={
                "email": "test@example.com",
                "password": "Test123456",
                "full_name": "Test User"
            })
            print(f"Register status: {resp.status_code}")
            print(f"Register response: {resp.json()}")
        except Exception as e:
            print(f"Register error: {e}")

        # Step 2: Login
        print("\nStep 2: Logging in...")
        resp = await client.post(f"{BASE_URL}/auth/login", json={
            "email": "test@example.com",
            "password": "Test123456"
        })
        print(f"Login status: {resp.status_code}")
        data = resp.json()
        if resp.status_code == 200:
            token = data["access_token"]
            print(f"Login successful! Token: {token[:50]}...")
            
            # Set auth header
            headers = {"Authorization": f"Bearer {token}"}
            
            # Step 3: List modules
            print("\nStep 3: Listing modules...")
            resp = await client.get(f"{BASE_URL}/modules", headers=headers)
            print(f"List modules status: {resp.status_code}")
            modules_data = resp.json()
            print(f"Total modules: {modules_data.get('total', 0)}")
            print(f"Categories: {modules_data.get('categories', [])}")
            
            # Step 4: Test converter module
            print("\nStep 4: Testing converter module...")
            resp = await client.post(
                f"{BASE_URL}/modules/converter/execute",
                headers=headers,
                json={
                    "operation": "convert_to_tdata",
                    "params": {
                        "session_string": "test_session_string_here",
                        "api_id": 12345,
                        "api_hash": "test_api_hash",
                        "output_dir": "./sessions/test_converter",
                        "phone_number": "+1234567890"
                    }
                }
            )
            print(f"Converter status: {resp.status_code}")
            print(f"Converter response: {json.dumps(resp.json(), indent=2)}")
            
            # Step 5: Test booster module (needs client_manager)
            print("\nStep 5: Testing booster module...")
            resp = await client.post(
                f"{BASE_URL}/modules/booster/execute",
                headers=headers,
                json={
                    "operation": "start_warmup",
                    "params": {
                        "phone": "+1234567890",
                        "target_groups": [{"chat_id": 123456, "title": "Test Group"}],
                        "duration_days": 30
                    }
                }
            )
            print(f"Booster status: {resp.status_code}")
            print(f"Booster response: {json.dumps(resp.json(), indent=2)}")
            
            # Step 6: Test gender_detector (no client_manager needed)
            print("\nStep 6: Testing gender_detector module...")
            resp = await client.post(
                f"{BASE_URL}/modules/gender_detector/execute",
                headers=headers,
                json={
                    "operation": "detect_gender",
                    "params": {
                        "first_name": "John",
                        "last_name": "Doe",
                        "username": "johndoe"
                    }
                }
            )
            print(f"Gender detector status: {resp.status_code}")
            print(f"Gender detector response: {json.dumps(resp.json(), indent=2)}")
            
            # Step 7: Test calculator_reports (no client_manager needed)
            print("\nStep 7: Testing calculator_reports module...")
            resp = await client.post(
                f"{BASE_URL}/modules/calculator_reports/execute",
                headers=headers,
                json={
                    "operation": "calculate_roi",
                    "params": {
                        "investment": 1000,
                        "revenue": 5000,
                        "costs": 500
                    }
                }
            )
            print(f"Calculator status: {resp.status_code}")
            print(f"Calculator response: {json.dumps(resp.json(), indent=2)}")
            
            # Step 8: Test link_checker (async, needs no client_manager)
            print("\nStep 8: Testing link_checker module...")
            resp = await client.post(
                f"{BASE_URL}/modules/link_checker/execute",
                headers=headers,
                json={
                    "operation": "check_link",
                    "params": {
                        "url": "t.me/telegram"
                    }
                }
            )
            print(f"Link checker status: {resp.status_code}")
            print(f"Link checker response: {json.dumps(resp.json(), indent=2)}")
            
            # Step 9: Test mass_messaging (needs client_manager)
            print("\nStep 9: Testing mass_messaging module...")
            resp = await client.post(
                f"{BASE_URL}/modules/mass_messaging/execute",
                headers=headers,
                json={
                    "operation": "preview_message",
                    "params": {
                        "text": "Hello {friend|pal|buddy}!",
                        "spin": True,
                        "style": "casual"
                    }
                }
            )
            print(f"Mass messaging status: {resp.status_code}")
            print(f"Mass messaging response: {json.dumps(resp.json(), indent=2)}")
            
        else:
            print(f"Login failed: {data}")

if __name__ == "__main__":
    asyncio.run(main())
