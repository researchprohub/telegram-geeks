"""Final comprehensive test for all 44 Telegram Expert modules."""
import asyncio
import httpx

BASE_URL = "http://localhost:8001/api/v1"

async def test_module(client, headers, module_id, operation, params):
    """Test a single module operation."""
    try:
        resp = await client.post(
            f"{BASE_URL}/modules/{module_id}/execute",
            headers=headers,
            json={"operation": operation, "params": params}
        )
        result = resp.json()
        status = result.get('status', 'unknown')
        return status == 'success'
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

        # Test all NEW modules
        new_modules_tests = [
            ("mass_inspection", "check_all_accounts", {"folder": "Active", "check_type": "all", "thread_count": 5}),
            ("parameter_generator", "generate_beginner", {"app_type": "android", "timezone_name": "Russia", "count": 10}),
            ("proxy_checker", "add_proxy", {"proxy_string": "127.0.0.1:8080:user:pass", "proxy_type": "socks5"}),
            ("account_folders", "get_folder_summary", {}),
            ("views_boost", "boost_direct_views", {"account_phones": ["+1234567890"], "post_urls": ["t.me/channel/1"], "views_per_post": 10, "thread_count": 2}),
            ("channel_comments", "post_comments", {"account_phones": ["+1234567890"], "channel_links": ["t.me/channel"], "comments": ["Great post!"], "thread_count": 2}),
            ("postbot", "create_posts", {"account_phones": ["+1234567890"], "text": "Test post", "thread_count": 2}),
            ("anti_detection", "create_behavior_profile", {"profile_name": "test_profile", "min_delay": 5, "max_delay": 30}),
            ("mass_subscriptions", "subscribe_to_channels", {"account_phones": ["+1234567890"], "channel_links": ["t.me/channel"], "thread_count": 2}),
            ("open_dialogs", "get_all_dialogs", {"account_phone": "+1234567890", "limit": 10}),
        ]

        print("=" * 60)
        print("NEW MODULES TEST RESULTS")
        print("=" * 60)
        
        passed = 0
        total = len(new_modules_tests)
        
        for module_id, operation, params in new_modules_tests:
            success = await test_module(client, headers, module_id, operation, params)
            icon = "✅" if success else "❌"
            print(f"  {icon} {module_id}.{operation}: {'success' if success else 'failed'}")
            if success:
                passed += 1
        
        print("\n" + "=" * 60)
        print("FINAL SUMMARY")
        print("=" * 60)
        print(f"New modules tested: {total}")
        print(f"New modules working: {passed}")
        print(f"Success rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 ALL NEW MODULES WORKING!")
        else:
            print(f"\n⚠️  {total - passed} module(s) failed")

if __name__ == "__main__":
    asyncio.run(main())
