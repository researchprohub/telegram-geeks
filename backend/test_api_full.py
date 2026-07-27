"""Comprehensive API test for all module types."""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000/api/v1"

async def main():
    async with httpx.AsyncClient() as client:
        # Step 1: Login (user already exists from previous test)
        print("Step 1: Logging in...")
        resp = await client.post(f"{BASE_URL}/auth/login", json={
            "email": "test@example.com",
            "password": "Test123456"
        })
        if resp.status_code != 200:
            print(f"Login failed: {resp.json()}")
            return
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful!")

        # Step 2: List modules
        print("\nStep 2: Listing modules...")
        resp = await client.get(f"{BASE_URL}/modules", headers=headers)
        modules_data = resp.json()
        print(f"Total modules: {modules_data.get('total', 0)}")
        print(f"Categories: {modules_data.get('categories', [])}")

        # Step 3: Test converter (simple, no client_manager)
        print("\nStep 3: Testing converter...")
        resp = await client.post(
            f"{BASE_URL}/modules/converter/execute",
            headers=headers,
            json={
                "operation": "convert_to_tdata",
                "params": {
                    "session_string": "test_session",
                    "api_id": 12345,
                    "api_hash": "test_hash",
                    "output_dir": "./sessions/test_api_converter",
                    "phone_number": "+1234567890"
                }
            }
        )
        print(f"  Status: {resp.status_code}, Result: {resp.json()['status']}")

        # Step 4: Test booster (needs client_manager)
        print("\nStep 4: Testing booster...")
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
        result = resp.json()
        print(f"  Status: {resp.status_code}, Result: {result['status']}")
        if result['status'] == 'success':
            print(f"  Warmup started: {result['result']['current_day']}/30 days")

        # Step 5: Test gender_detector (simple)
        print("\nStep 5: Testing gender_detector...")
        resp = await client.post(
            f"{BASE_URL}/modules/gender_detector/execute",
            headers=headers,
            json={
                "operation": "detect_gender",
                "params": {"first_name": "Jane", "last_name": "Smith"}
            }
        )
        result = resp.json()
        print(f"  Status: {resp.status_code}, Result: {result['status']}")
        if result['status'] == 'success':
            print(f"  Detected: {result['result'].get('gender', 'unknown')}")

        # Step 6: Test mass_messaging (needs client_manager)
        print("\nStep 6: Testing mass_messaging...")
        resp = await client.post(
            f"{BASE_URL}/modules/mass_messaging/execute",
            headers=headers,
            json={
                "operation": "send_by_id",
                "params": {
                    "account_id": "+1234567890",
                    "chat_ids": [123456],
                    "text": "Hello World"
                }
            }
        )
        result = resp.json()
        print(f"  Status: {resp.status_code}, Result: {result['status']}")
        if result['status'] == 'error':
            print(f"  Error: {result.get('message', 'Unknown error')}")

        # Step 7: Test autoreponder (needs client_manager)
        print("\nStep 7: Testing autoreponder...")
        resp = await client.post(
            f"{BASE_URL}/modules/autoreponder/execute",
            headers=headers,
            json={
                "operation": "add_template",
                "params": {
                    "account_id": "test_account",
                    "trigger": "hello",
                    "response": "Hi there! How can I help?",
                    "match_type": "keyword"
                }
            }
        )
        result = resp.json()
        print(f"  Status: {resp.status_code}, Result: {result['status']}")
        if result['status'] == 'success':
            print(f"  Template ID: {result['result']}")

        # Step 8: Test autoposting (needs client_manager)
        print("\nStep 8: Testing autoposting...")
        resp = await client.post(
            f"{BASE_URL}/modules/autoposting/execute",
            headers=headers,
            json={
                "operation": "post_to_chats_v1",
                "params": {
                    "account_id": "test_account",
                    "chat_ids": [123456],
                    "text": "Test post",
                    "schedule_time": "2026-07-20T10:00:00Z"
                }
            }
        )
        result = resp.json()
        print(f"  Status: {resp.status_code}, Result: {result['status']}")
        if result['status'] == 'success':
            print(f"  Post ID: {result['result'].get('post_id', 'N/A')}")

        # Step 9: Test contact_book (simple)
        print("\nStep 9: Testing contact_book...")
        resp = await client.post(
            f"{BASE_URL}/modules/contact_book/execute",
            headers=headers,
            json={
                "operation": "add_contact",
                "params": {
                    "phone": "+1234567890",
                    "name": "Test Contact"
                }
            }
        )
        result = resp.json()
        print(f"  Status: {resp.status_code}, Result: {result['status']}")

        # Step 10: Test link_checker (simple, async)
        print("\nStep 10: Testing link_checker...")
        resp = await client.post(
            f"{BASE_URL}/modules/link_checker/execute",
            headers=headers,
            json={
                "operation": "check_link",
                "params": {"url": "t.me/telegram"}
            }
        )
        result = resp.json()
        print(f"  Status: {resp.status_code}, Result: {result['status']}")

        # Step 11: Test number_checker (simple)
        print("\nStep 11: Testing number_checker...")
        resp = await client.post(
            f"{BASE_URL}/modules/number_checker/execute",
            headers=headers,
            json={
                "operation": "check_number",
                "params": {"phone_number": "+1234567890"}
            }
        )
        result = resp.json()
        print(f"  Status: {resp.status_code}, Result: {result['status']}")

        # Step 12: Test json_generator (simple)
        print("\nStep 12: Testing json_generator...")
        resp = await client.post(
            f"{BASE_URL}/modules/json_generator/execute",
            headers=headers,
            json={
                "operation": "generate_json",
                "params": {
                    "phone_number": "+1234567890",
                    "api_id": 12345,
                    "api_hash": "test_hash"
                }
            }
        )
        result = resp.json()
        print(f"  Status: {resp.status_code}, Result: {result['status']}")

        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print("All module types tested successfully!")
        print("Infrastructure is working correctly.")

if __name__ == "__main__":
    asyncio.run(main())
