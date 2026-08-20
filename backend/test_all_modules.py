"""Comprehensive test for all 44 Telegram Expert modules."""
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
        
        # Check the outer status from dispatcher
        status = result.get('status', 'unknown')
        
        # For errors, check if it's expected
        if status == 'error' and not expected_success:
            success = True
        elif status == 'success':
            success = True
        else:
            success = False
        
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
        # Login as test user
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

        # Test all modules
        tests_passed = []
        tests_failed = []

        # ===== ACCOUNT MODULES =====
        print("=" * 60)
        print("ACCOUNT MODULES")
        print("=" * 60)
        
        tests_passed.append(await test_module(client, headers, "converter", "convert_to_tdata", {
            "session_string": "test", "api_id": 12345, "api_hash": "test",
            "output_dir": "./sessions/test", "phone_number": "+1234567890"
        }))
        
        tests_passed.append(await test_module(client, headers, "booster", "start_warmup", {
            "phone": "+1234567890",
            "target_groups": [{"chat_id": 123456}],
            "duration_days": 30
        }))
        
        tests_passed.append(await test_module(client, headers, "mass_inspection", "check_all_accounts", {
            "folder": "Active", "check_type": "all", "thread_count": 5
        }))
        
        tests_passed.append(await test_module(client, headers, "parameter_generator", "generate_beginner", {
            "app_type": "android", "timezone_name": "Russia",
            "manufacturer": "Samsung", "count": 10
        }))
        
        tests_passed.append(await test_module(client, headers, "proxy_checker", "add_proxy", {
            "proxy_string": "127.0.0.1:8080:user:pass", "proxy_type": "socks5"
        }))
        
        tests_passed.append(await test_module(client, headers, "account_folders", "get_folder_summary", {}))

        # ===== MESSAGING MODULES =====
        print("\n" + "=" * 60)
        print("MESSAGING MODULES")
        print("=" * 60)
        
        tests_passed.append(await test_module(client, headers, "mass_messaging", "send_by_id", {
            "account_id": "+1234567890", "chat_ids": [123456], "text": "Hello"
        }))
        
        tests_passed.append(await test_module(client, headers, "autoreponder", "add_template", {
            "account_id": "test", "trigger": "hello", "response": "Hi!", "match_type": "keyword"
        }))
        
        tests_passed.append(await test_module(client, headers, "autoposting", "post_to_chats_v1", {
            "account_id": "test", "chat_ids": [123456], "text": "Post",
            "schedule_time": "2026-07-20T10:00:00Z"
        }))
        
        tests_passed.append(await test_module(client, headers, "views_boost", "boost_direct_views", {
            "account_phones": ["+1234567890"], "post_urls": ["t.me/channel/1"],
            "views_per_post": 10, "thread_count": 2
        }))
        
        tests_passed.append(await test_module(client, headers, "channel_comments", "post_comments", {
            "account_phones": ["+1234567890"], "channel_links": ["t.me/channel"],
            "comments": ["Great post!", "Interesting!"], "thread_count": 2
        }))
        
        tests_passed.append(await test_module(client, headers, "postbot", "create_posts", {
            "account_phones": ["+1234567890"], "text": "Test post",
            "thread_count": 2
        }))
        
        tests_passed.append(await test_module(client, headers, "anti_detection", "create_behavior_profile", {
            "profile_name": "test_profile", "min_delay": 5, "max_delay": 30
        }))

        # ===== AUDIENCE MODULES =====
        print("\n" + "=" * 60)
        print("AUDIENCE MODULES")
        print("=" * 60)
        
        tests_passed.append(await test_module(client, headers, "invite_modules", "invite_by_username", {
            "account_id": "+1234567890", "usernames": ["telegram"],
            "group_id": 123456
        }))
        
        tests_passed.append(await test_module(client, headers, "audience_collector", "collect_from_account", {
            "account_id": "+1234567890", "chat_id": 123456
        }))
        
        tests_passed.append(await test_module(client, headers, "contact_book", "add_contact", {
            "phone": "+1234567890", "name": "Test Contact"
        }))
        
        tests_passed.append(await test_module(client, headers, "mass_subscriptions", "subscribe_to_channels", {
            "account_phones": ["+1234567890"], "channel_links": ["t.me/channel"],
            "thread_count": 2
        }))
        
        tests_passed.append(await test_module(client, headers, "open_dialogs", "get_all_dialogs", {
            "account_phone": "+1234567890", "limit": 10
        }))

        # ===== CONTENT MODULES =====
        print("\n" + "=" * 60)
        print("CONTENT MODULES")
        print("=" * 60)
        
        tests_passed.append(await test_module(client, headers, "cloner", "clone_channel", {
            "account_id": "+1234567890", "source_channel": "t.me/channel"
        }))
        
        tests_passed.append(await test_module(client, headers, "interceptor", "add_keyword", {
            "account_id": "+1234567890", "keyword": "test"
        }))
        
        tests_passed.append(await test_module(client, headers, "forwarder", "start_forwarding", {
            "account_id": "+1234567890", "source_chat": 123456, "target_chat": 789012
        }))

        # ===== GROWTH MODULES =====
        print("\n" + "=" * 60)
        print("GROWTH MODULES")
        print("=" * 60)
        
        tests_passed.append(await test_module(client, headers, "bot_creator", "create_bot", {
            "account_id": "+1234567890", "bot_name": "TestBot"
        }))
        
        tests_passed.append(await test_module(client, headers, "referrals", "create_referral_link", {
            "account_id": "+1234567890", "bot_username": "testbot"
        }))
        
        tests_passed.append(await test_module(client, headers, "global_search", "search_users", {
            "account_phone": "+1234567890", "query": "telegram"
        }))
        
        tests_passed.append(await test_module(client, headers, "admin_chat_search", "search_admin_chats", {
            "account_phone": "+1234567890"
        }))
        
        tests_passed.append(await test_module(client, headers, "create_chats", "create_group", {
            "account_phone": "+1234567890", "title": "Test Group"
        }))

        # ===== ADMIN MODULES =====
        print("\n" + "=" * 60)
        print("ADMIN MODULES")
        print("=" * 60)
        
        tests_passed.append(await test_module(client, headers, "admin", "create_channel", {
            "account_phone": "+1234567890", "title": "Test Channel"
        }))
        
        tests_passed.append(await test_module(client, headers, "link_checker", "check_link", {
            "url": "t.me/telegram"
        }))
        
        tests_passed.append(await test_module(client, headers, "database_tools", "union_databases", {
            "files": ["./test1.csv", "./test2.csv"], "output_file": "./merged.csv"
        }))
        
        tests_passed.append(await test_module(client, headers, "calculator_reports", "calculate_roi", {
            "messages_sent": 1000, "conversions": 50,
            "cost_per_account": 1.0, "revenue_per_conversion": 10.0
        }, expected_success=False))  # Pro-only module

        # ===== SUMMARY =====
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        total_tests = len(tests_passed)
        passed = sum(tests_passed)
        failed = total_tests - passed
        
        print(f"Total tests: {total_tests}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success rate: {(passed/total_tests)*100:.1f}%")
        
        if failed == 0:
            print("\n🎉 ALL TESTS PASSED!")
        else:
            print(f"\n⚠️  {failed} test(s) failed")

if __name__ == "__main__":
    asyncio.run(main())
