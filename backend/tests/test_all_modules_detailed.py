"""Detailed module execution test."""
import asyncio
import httpx
import json

async def main():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        resp = await client.post("/api/v1/auth/login", json={
            "email": "admin@telegramgeeks.com",
            "password": "Admin@123456"
        })
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        tests = [
            ("converter", "convert_to_tdata", {}),
            ("converter", "convert_from_tdata", {}),
            ("two_way_converter", "convert_tdata_to_session", {"tda_dir": "/tmp/test_td"}),
            ("booster", "start_warmup", {"account_id": 1}),
            ("booster", "run_warmup_cycle", {"account_id": 1}),
            ("gender_detector", "detect_gender", {"name": "Alexander"}),
            ("calculator_reports", "calculate_roi", {"investment": 100, "return_val": 150}),
            ("calculator_reports", "calculate_engagement_score", {"likes": 50, "comments": 10, "shares": 5}),
            ("link_checker", "check_link", {"link": "https://t.me/telegram"}),
            ("link_checker", "check_channel", {"channel": "@telegram"}),
            ("neuro_text", "preview_spintax", {"spintax": "Hello {World|Universe}!"}),
            ("neuro_text", "generate_with_spintax", {"spintax": "Hi {there|everyone}"}),
            ("neuro_text", "neuro_comment", {"prompt": "Write a comment about AI"}),
            ("account_folders", "health_check", {}),
            ("account_folders", "add_account", {"account_id": 1, "folder": "active"}),
            ("account_folders", "get_folder_summary", {}),
            ("proxy_checker", "add_proxy", {"proxy": "http://1.2.3.4:8080"}),
            ("proxy_checker", "check_proxies", {}),
            ("views_boost", "boost_direct_views", {"target_url": "https://t.me/channel/1"}),
            ("mass_subscriptions", "subscribe_to_channels", {"channel_ids": [123]}),
            ("mass_messaging", "send_to_database", {"limit": 5}),
            ("autoreponder", "add_template", {"pattern": "hi", "response": "hello"}),
            ("autoposting", "post_to_chats_v1", {"chat_id": 1, "message": "test"}),
            ("persona_manager", "add_persona", {"name": "TestBot", "layer_1_identity": {"display_name": "Test"}}),
            ("persona_manager", "generate_post", {"persona_id": 1, "topic": "AI"}),
            ("mass_inspection", "check_all_accounts", {}),
            ("number_checker", "check_number", {"phone": "+1234567890"}),
            ("json_generator", "generate_json", {"session_file": "/tmp/test.session"}),
            ("invite_modules", "invite_by_numbers", {"numbers": ["+1234567890"]}),
            ("audience_collector", "collect_from_comments", {"target": "channel_id"}),
            ("contact_book", "add_contact", {"name": "Test", "phone": "+123"}),
            ("reactions", "add_reaction", {"target": "message_id", "reaction": "👍"}),
            ("stories", "publish_story", {"target_id": 1, "media_type": "photo"}),
            ("message_editor", "edit_message", {"message_id": 1, "new_text": "edited"}),
            ("channel_comments", "post_comments", {"channel_id": 1, "comment": "great post"}),
            ("anti_detection", "create_behavior_profile", {"profile_name": "test"}),
            ("postbot", "create_posts", {"count": 3}),
            ("mass_unsubscriber", "unsubscribe_from_channels", {"channel_ids": [123]}),
            ("open_dialogs", "get_all_dialogs", {}),
        ]
        
        passed = 0
        failed = 0
        errors = []
        
        for mod_id, op, params in tests:
            try:
                resp = await client.post(
                    f"/api/v1/modules/{mod_id}/execute",
                    json={"operation": op, "params": params},
                    headers=headers,
                    timeout=30
                )
                data = resp.json()
                status = data.get("status", data.get("result", "unknown"))
                if resp.status_code == 200 and "error" not in str(data).lower():
                    passed += 1
                    print(f"  PASS  {mod_id:25s} {op:25s} -> {status}")
                else:
                    failed += 1
                    detail = str(data)[:120]
                    errors.append((mod_id, op, detail))
                    print(f"  FAIL  {mod_id:25s} {op:25s} -> {detail}")
            except Exception as e:
                failed += 1
                errors.append((mod_id, op, str(e)))
                print(f"  ERR   {mod_id:25s} {op:25s} -> {e}")
        
        print(f"\n{'='*80}")
        print(f"RESULTS: {passed} passed, {failed} failed out of {len(tests)}")
        
        if errors:
            print(f"\nFAILED DETAILS:")
            for mod_id, op, detail in errors:
                print(f"  {mod_id}.{op}: {detail[:100]}")

if __name__ == "__main__":
    asyncio.run(main())
