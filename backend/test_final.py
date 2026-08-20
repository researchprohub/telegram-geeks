"""Final comprehensive API test for all module types."""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:8001/api/v1"

async def test_module(client, headers, module_id, operation, params, expected_success=True):
    """Test a single module operation."""
    try:
        resp = await client.post(
            f"{BASE_URL}/modules/{module_id}/execute",
            headers=headers,
            json={"operation": operation, "params": params}
        )
        result = resp.json()
        status = result.get('status', 'unknown')
        success = (status == 'success') or (resp.status_code == 403 and not expected_success)
        
        icon = "✅" if success else "❌"
        print(f"  {icon} {module_id}.{operation}: {status}")
        if status == 'error' and expected_success:
            print(f"     Error: {result.get('message', 'Unknown')}")
        return success
    except Exception as e:
        print(f"  ❌ {module_id}.{operation}: EXCEPTION - {e}")
        return False

async def main():
    async with httpx.AsyncClient() as client:
        # Login
        resp = await client.post(f"{BASE_URL}/auth/login", json={
            "email": "test@example.com",
            "password": "Test123456"
        })
        if resp.status_code != 200:
            print(f"Login failed: {resp.json()}")
            return
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful!\n")

        results = []

        # Simple modules (no client_manager needed)
        print("=" * 60)
        print("SIMPLE MODULES (no client_manager required)")
        print("=" * 60)
        
        results.append(await test_module(client, headers, "converter", "convert_to_tdata", {
            "session_string": "test", "api_id": 12345, "api_hash": "test",
            "output_dir": "./sessions/test", "phone_number": "+1234567890"
        }))
        
        results.append(await test_module(client, headers, "gender_detector", "detect_gender", {
            "first_name": "John", "last_name": "Doe"
        }))
        
        results.append(await test_module(client, headers, "calculator_reports", "calculate_roi", {
            "investment": 1000, "revenue": 5000, "costs": 500
        }, expected_success=False))  # Pro-only module

        # Complex modules (need client_manager)
        print("\n" + "=" * 60)
        print("COMPLEX MODULES (client_manager required)")
        print("=" * 60)
        
        results.append(await test_module(client, headers, "booster", "start_warmup", {
            "phone": "+1234567890",
            "target_groups": [{"chat_id": 123456, "title": "Test"}],
            "duration_days": 30
        }))
        
        results.append(await test_module(client, headers, "booster", "get_progress", {
            "phone": "+1234567890"
        }))
        
        results.append(await test_module(client, headers, "mass_messaging", "send_by_id", {
            "account_id": "+1234567890", "chat_ids": [123456], "text": "Hello"
        }))
        
        results.append(await test_module(client, headers, "autoreponder", "add_template", {
            "account_id": "test", "trigger": "hello", "response": "Hi!", "match_type": "keyword"
        }))
        
        results.append(await test_module(client, headers, "autoposting", "post_to_chats_v1", {
            "account_id": "test", "chat_ids": [123456], "text": "Post",
            "schedule_time": "2026-07-20T10:00:00Z"
        }))

        # Summary
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        passed = sum(results)
        total = len(results)
        print(f"Passed: {passed}/{total}")
        if passed == total:
            print("ALL TESTS PASSED! ✅")
        else:
            print(f"{total - passed} test(s) failed.")

if __name__ == "__main__":
    asyncio.run(main())
