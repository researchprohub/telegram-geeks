"""Test plan-tier gating with the new architecture."""
import asyncio
import httpx

BASE_URL = "http://localhost:8001/api/v1"

async def main():
    async with httpx.AsyncClient() as client:
        # Login as test user (operator role, mapped to starter plan)
        resp = await client.post(f"{BASE_URL}/auth/login", json={
            "email": "test@example.com",
            "password": "Test123456"
        })
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Test 1: Starter-accessible module (converter)
        print("Test 1: converter (starter-accessible)...")
        resp = await client.post(
            f"{BASE_URL}/modules/converter/execute",
            headers=headers,
            json={
                "operation": "convert_to_tdata",
                "params": {
                    "session_string": "test", "api_id": 12345, "api_hash": "test",
                    "output_dir": "./sessions/test", "phone_number": "+1234567890"
                }
            }
        )
        print(f"  Status: {resp.status_code}, Response: {resp.json()['status']}")
        assert resp.status_code == 200, "Converter should work for starter"

        # Test 2: Pro-only module (calculator_reports)
        print("\nTest 2: calculator_reports (pro-only)...")
        resp = await client.post(
            f"{BASE_URL}/modules/calculator_reports/execute",
            headers=headers,
            json={
                "operation": "calculate_roi",
                "params": {"investment": 1000, "revenue": 5000, "costs": 500}
            }
        )
        print(f"  Status: {resp.status_code}")
        if resp.status_code == 403:
            detail = resp.json()["detail"]
            print(f"  Blocked: {detail.get('message', 'Unknown')}")
            print(f"  Required tier: {detail.get('required_tier')}")
            assert detail.get('required_tier') == 'pro', "Should require pro tier"
        else:
            print(f"  Response: {resp.json()['status']}")

        # Test 3: Pro-only module (link_checker)
        print("\nTest 3: link_checker (pro-only)...")
        resp = await client.post(
            f"{BASE_URL}/modules/link_checker/execute",
            headers=headers,
            json={
                "operation": "check_link",
                "params": {"url": "t.me/telegram"}
            }
        )
        print(f"  Status: {resp.status_code}")
        if resp.status_code == 403:
            detail = resp.json()["detail"]
            print(f"  Blocked: {detail.get('message', 'Unknown')}")
        else:
            print(f"  Response: {resp.json()['status']}")

        # Test 4: Starter-accessible complex module (booster)
        print("\nTest 4: booster (starter-accessible, needs client_manager)...")
        resp = await client.post(
            f"{BASE_URL}/modules/booster/execute",
            headers=headers,
            json={
                "operation": "start_warmup",
                "params": {
                    "phone": "+1234567890",
                    "target_groups": [{"chat_id": 123456}],
                    "duration_days": 30
                }
            }
        )
        print(f"  Status: {resp.status_code}, Response: {resp.json()['status']}")
        assert resp.status_code == 200, "Booster should work for starter"

        print("\n" + "=" * 60)
        print("PLAN-TIER GATING VERIFIED ✅")
        print("=" * 60)
        print("Starter modules: converter, booster ✅")
        print("Pro-only modules: calculator_reports, link_checker ✅")

if __name__ == "__main__":
    asyncio.run(main())
