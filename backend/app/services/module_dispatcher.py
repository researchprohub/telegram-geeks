"""Module service dispatcher — connects modules to telegram_layer services."""

import asyncio
import inspect
import sys
import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from loguru import logger

base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
telegram_layer_path = os.path.join(base_dir, 'telegram_layer')
if telegram_layer_path not in sys.path:
    sys.path.insert(0, telegram_layer_path)

MODULE_SERVICES = {
    "global_config": "GlobalConfigService",
    "converter": "ConverterService",
    "two_way_converter": "TwoWayConverter",
    "booster": "BoosterService",
    "account_management": "AccountManagementService",
    "mass_messaging": "MassMessagingService",
    "autoreponder": "AutoresponderService",
    "autoposting": "AutopostingService",
    "stories": "StoriesService",
    "reactions": "ReactionsService",
    "message_editor": "MessageEditorService",
    "invite_modules": "InviteService",
    "audience_collector": "AudienceCollectorService",
    "contact_book": "ContactBookService",
    "mass_unsubscriber": "MassUnsubscriberService",
    "gender_detector": "GenderDetectorService",
    "cloner": "ClonerService",
    "interceptor": "InterceptorService",
    "forwarder": "ForwarderService",
    "bot_creator": "BotCreatorService",
    "referrals": "ReferralService",
    "reporter": "ReporterService",
    "admin": "AdminService",
    "link_checker": "LinkCheckerService",
    "database_tools": "DatabaseToolsService",
    "calculator_reports": "CalculatorReportsService",
    "spambot_remover": "SpamBotRemoverService",
    "number_checker": "NumberCheckerService",
    "json_generator": "JsonGeneratorService",
    "duplicator": "DuplicatorService",
    "account_folders": "AccountFolderService",
    "registrar": "RegistrarService",
    "neuro_text": "NeuroTextEngine",
    "persona_manager": "PersonaOrchestrator",
    "proxy_checker": "ProxyCheckerService",
    "views_boost": "ViewsBoostService",
    "mass_subscriptions": "MassSubscriptionsService",
    "channel_comments": "ChannelCommentsService",
    "postbot": "PostbotService",
    "anti_detection": "AntiDetectionService",
    "mass_inspection": "MassInspectionService",
    "parameter_generator": "ParameterGeneratorService",
    "global_search": "GlobalSearchService",
    "admin_chat_search": "AdminChatSearchService",
    "create_chats": "CreateChatsService",
    "open_dialogs": "OpenDialogsService",
    "anomaly_detector": "AnomalyDetectorService",
    "flood_guard": "FloodGuardService",
    "geo_location": "GeoLocationService",
    "persona_emotions": "EmotionManager",
    "persona_generator": "PersonaGenerator",
    "group_prompt_generator": "GroupPromptGenerator",
    "persona_ab_test": "ABTestManager",
    "forwarder_wizard": "ForwarderWizard",
    "campaign_export": "CampaignExporter",
    "mass_subscribe_resume": "SubscribeResumeManager",
    "booster_username_check": "UsernameChecker",
    "affiliate_enhanced": "AffiliateManager",
    "marketplace": "MarketplaceManager",
    "sms_dashboard": "SMSDashboardProvider",
    "activity_pattern": "ActivityPatternService",
    "cleanup": "CleanupService",
    "safety_reporter": "SafetyReporterService",
    "topic_engine": "TopicEngineService",
    "scheduler": "SchedulerService",
    "pipeline_executor": "PipelineService",
    "anti_pattern": "AntiPatternService",
    "campaign_reporter": "CampaignReporterService",
    "ip_analyzer": "IpIntersectionAnalyzer",
    "soul_prompt": "SoulPromptBuilder",
    "persona_memory": "PersonaMemorySystem",
    "persona_analytics": "PersonaAnalyticsTracker",
    "persona_warmup": "WarmupOrchestrator",
    "model_routing": "ModelRouter",
    "persona_templates": "PersonaSerializer",
    "persona_knowledge_base": "PersonaKnowledgeBase",
}

PARAM_REMAP = {
    "converter": {
        "convert_to_tdata": {"session_string": "session_string", "api_id": "api_id",
            "api_hash": "api_hash", "output_dir": "output_dir",
            "phone_number": "phone_number", "device_model": "device_model",
            "app_version": "app_version"},
        "convert_from_tdata": {"tdata_path": "tdata_dir", "output_dir": "output_dir"},
    },
    "two_way_converter": {
        "convert_tdata_to_session": {"tdata_path": "tdata_path", "output_dir": "output_dir"},
        "convert_session_to_tdata": {"json_path": "json_path", "output_dir": "output_dir"},
        "batch_convert": {"files": "files", "direction": "direction", "output_base": "output_base"},
    },
    "duplicator": {
        "duplicate_session": {"account_id": "account_id", "device_model": "device_model"},
        "export_qr_code": {"account_id": "account_id"},
        "clone_to_device": {"account_id": "account_id", "session_string": "session_string", "device_name": "device_name"},
        "list_devices": {"account_id": "account_id"},
        "terminate_device": {"account_id": "account_id", "device_hash": "device_hash"},
    },
    "account_management": {
        "mass_inspection": {"accounts": "accounts"},
        "mass_unsubscribe": {"accounts": "accounts", "chat_ids": "chat_ids", "category": "category"},
        "delete_dialogs": {"account_id": "account_id", "chat_ids": "chat_ids"},
        "read_dialogs": {"account_id": "account_id", "chat_ids": "chat_ids"},
        "delete_chats": {"account_id": "account_id", "chat_ids": "chat_ids"},
        "export_account_data": {"account_id": "account_id", "output_format": "output_format"},
        "import_accounts": {"file_path": "file_path", "format": "format"},
        "enable_2fa": {"account_id": "account_id", "password": "password", "hint": "hint"},
        "disable_2fa": {"account_id": "account_id", "current_password": "current_password"},
        "change_2fa_password": {"account_id": "account_id", "current_password": "current_password", "new_password": "new_password", "hint": "hint"},
        "set_bio": {"account_id": "account_id", "bio": "bio"},
        "set_name": {"account_id": "account_id", "first_name": "first_name", "last_name": "last_name"},
        "set_avatar": {"account_id": "account_id", "photo_path": "photo_path"},
        "get_2fa_status": {"account_id": "account_id"},
    },
    "account_folders": {
        "add_account": {"account": "account"},
        "health_check": {"phone": "phone"},
        "bulk_health_check": {"account_phones": "account_phones"},
        "move_to_folder": {"phone": "phone", "target_folder": "target_folder"},
        "get_folder_summary": {},
        "search_accounts": {"query": "query"},
        "auto_sort": {},
    },
    "neuro_text": {
        "preview_spintax": {"template": "template", "count": "count"},
        "generate_with_spintax": {"prompt": "prompt", "tone": "tone",
            "persona_context": "persona_context", "spin_count": "spin_count"},
        "neuro_comment": {"post_url": "post_url", "post_content": "post_content",
            "persona_context": "persona_context"},
    },
    "persona_manager": {
        "add_persona": {"persona_data": "persona", "persona": "persona"},
        "generate_post": {"persona_obj": "persona", "persona": "persona",
            "topic": "topic", "context": "context"},
        "generate_reply": {"persona_obj": "persona", "persona": "persona",
            "message": "message", "context": "context"},
        "find_ppi_target": {"persona_obj": "persona", "persona": "persona"},
    },
    "proxy_checker": {
        "add_proxy": {"proxy_string": "proxy_string", "proxy_type": "proxy_type",
            "version": "version"},
        "check_proxies": {"proxy_strings": "proxy_strings"},
        "get_proxy_pool": {},
        "get_check_history": {},
    },
    "views_boost": {
        "boost_direct_views": {"account_phones": "account_phones", "post_urls": "post_urls",
            "views_per_post": "views_per_post"},
        "boost_post_views": {"url": "url", "count": "count"},
        "boost_proxy_views": {"proxy_list": "proxy_list", "channel_url": "channel_url",
            "views_per_post": "views_per_post"},
    },
    "mass_subscriptions": {
        "subscribe_to_channels": {"account_phones": "account_phones", "channel_links": "channel_links",
            "delay_range": "delay_range"},
    },
    "gender_detector": {
        "detect_gender": {"first_name": "first_name", "last_name": "last_name",
            "username": "username", "text": "first_name", "name": "first_name"},
    },
    "number_checker": {
        "check_number": {"phone": "phone_number", "phone_number": "phone_number"},
    },
    "calculator_reports": {
        "calculate_roi": {"messages_sent": "messages_sent", "conversions": "conversions",
            "cost_per_account": "cost_per_account", "revenue_per_conversion": "revenue_per_conversion"},
        "calculate_engagement_score": {"likes": "likes", "comments": "comments",
            "shares": "shares", "reposts": "reposts", "total_reach": "total_reach"},
    },
    "link_checker": {
        "check_link": {"url": "url", "link": "url"},
        "check_channel": {"chat_id": "chat_id", "channel": "channel"},
    },
    "json_generator": {
        "generate_json": {"session_string": "session_string", "api_id": "api_id",
            "api_hash": "api_hash", "output_path": "output_path",
            "phone_number": "phone_number", "display_name": "display_name"},
    },
    "booster": {
        "start_warmup": {"phone": "phone", "target_groups": "target_groups",
            "duration_days": "duration_days"},
        "run_warmup_cycle": {"account_id": "account_id", "phone": "phone"},
    },
    "mass_messaging": {
        "send_to_database": {"account_id": "account_id", "database_path": "database_path",
            "text": "text", "spin_syntax": "spin_syntax", "style": "style", "silent": "silent"},
        "send_by_id": {"account_id": "account_id", "chat_ids": "chat_ids",
            "text": "text", "formatting": "formatting", "silent": "silent"},
        "send_by_numbers": {"account_id": "account_id", "phone_numbers": "phone_numbers",
            "text": "text", "silent": "silent"},
        "send_to_contacts": {"account_id": "account_id", "text": "text",
            "style": "style", "silent": "silent"},
        "preview_message": {"text": "text", "spin": "spin", "style": "style"},
    },
    "autoreponder": {
        "add_template": {"account_id": "account_id", "trigger": "trigger",
            "response": "response", "match_type": "match_type"},
    },
    "autoposting": {
        "post_to_chats_v1": {"account_id": "account_id", "chat_ids": "chat_ids",
            "text": "text", "schedule_time": "schedule_time", "repeat": "repeat"},
    },
    "invite_modules": {
        "invite_by_numbers": {"account_id": "account_id", "chat_id": "chat_id",
            "phone_numbers": "phone_numbers", "phone_number": "phone_numbers",
            "numbers": "phone_numbers"},
    },
    "audience_collector": {
        "collect_from_comments": {"account_id": "account_id", "chat_id": "chat_id",
            "message_id": "message_id", "limit": "limit", "target": "chat_id"},
        "collect_from_account": {"account_id": "account_id", "target_user_id": "target_user_id", "limit": "limit"},
        "collect_from_replies": {"account_id": "account_id", "chat_id": "chat_id", "limit": "limit"},
        "collect_new_chat_members": {"account_id": "account_id", "chat_id": "chat_id", "limit": "limit"},
        "collect_by_hashtag": {"account_id": "account_id", "hashtag": "hashtag", "limit": "limit"},
        "collect_active_writers": {"account_id": "account_id", "chat_id": "chat_id", "hours": "hours", "limit": "limit"},
        "deduplicate": {"users": "users"},
    },
    "contact_book": {
        "add_contact": {"account_id": "account_id", "name": "name", "phone": "phone"},
    },
    "reactions": {
        "add_reaction": {"account_id": "account_id", "chat_id": "chat_id",
            "target": "target", "reaction": "reaction", "phone": "account_id"},
    },
    "stories": {
        "publish_story": {"account_id": "account_id", "target_id": "target_id",
            "media_type": "media_type", "caption": "caption", "phone": "account_id"},
    },
    "message_editor": {
        "edit_message": {"account_id": "account_id", "message_id": "message_id",
            "new_text": "new_text", "phone": "account_id"},
    },
    "channel_comments": {
        "post_comments": {"account_id": "account_id", "chat_id": "chat_id",
            "channel_id": "channel_id", "comment": "comment", "phone": "account_id"},
    },
    "postbot": {
        "create_posts": {"account_id": "account_id", "count": "count",
            "phone": "account_id"},
    },
    "mass_unsubscriber": {
        "unsubscribe_from_channels": {"account_id": "account_id",
            "channel_ids": "channel_ids", "phone": "account_id"},
    },
    "open_dialogs": {
        "get_all_dialogs": {"account_id": "account_id", "phone": "account_id"},
    },
    "anti_detection": {
        "create_behavior_profile": {"account_id": "account_id", "phone": "account_id"},
    },
    "anomaly_detector": {
        "build_baseline": {"account_id": "account_id", "hours": "hours"},
        "check_anomaly": {"account_id": "account_id", "action": "action", "value": "value"},
        "record_event": {"account_id": "account_id", "action": "action", "value": "value"},
        "get_report": {"account_id": "account_id"},
    },
    "flood_guard": {
        "get_risk": {"account_id": "account_id"},
        "record_action": {"account_id": "account_id"},
        "record_flood": {"account_id": "account_id", "wait_seconds": "wait_seconds"},
    },
    "geo_location": {
        "register_proxy": {"proxy_string": "proxy_string", "country": "country", "city": "city", "isp": "isp"},
        "register_account": {"phone": "phone", "country": "country", "timezone": "timezone"},
        "find_best_proxy": {"phone": "phone"},
        "get_stats": {},
    },
    "activity_pattern": {
        "generate_profile": {"name": "name", "pattern": "pattern"},
        "get_suggested_actions": {"profile_name": "profile_name", "pattern": "pattern"},
    },
    "cleanup": {
        "get_cleanup_plan": {"phone": "phone"},
        "execute_cleanup": {"phone": "phone", "steps": "steps"},
        "get_history": {"phone": "phone"},
    },
    "safety_reporter": {
        "record_incident": {"account_id": "account_id", "incident_type": "incident_type", "details": "details"},
        "generate_report": {"scope": "scope"},
    },
    "topic_engine": {
        "analyze_message": {"chat_id": "chat_id", "text": "text"},
        "get_chat_topics": {"chat_id": "chat_id", "hours": "hours"},
        "get_trends": {"hours": "hours"},
    },
    "scheduler": {
        "add_task": {"task_id": "task_id", "operation": "operation", "module_id": "module_id", "params": "params", "interval_min": "interval_min"},
        "remove_task": {"task_id": "task_id"},
        "list_tasks": {},
        "get_due_tasks": {},
        "get_stats": {},
    },
    "pipeline_executor": {
        "create_pipeline": {"name": "name", "stages": "stages"},
        "get_pipeline": {"pipeline_id": "pipeline_id"},
        "list_pipelines": {},
        "advance_stage": {"pipeline_id": "pipeline_id", "result": "result"},
    },
    "anti_pattern": {
        "check_message": {"account_id": "account_id", "chat_id": "chat_id", "text": "text"},
        "get_account_report": {"account_id": "account_id"},
    },
    "campaign_reporter": {
        "record_event": {"campaign_id": "campaign_id", "event_type": "event_type", "details": "details"},
        "generate_report": {"campaign_id": "campaign_id"},
        "compare_campaigns": {"campaign_ids": "campaign_ids"},
    },
    "global_config": {
        "get_config": {"key": "key"},
        "set_config": {"key": "key", "value": "value"},
        "list_all": {},
    },
    "registrar": {
        "register_account": {"phone": "phone", "api_id": "api_id", "api_hash": "api_hash"},
        "check_availability": {"phone": "phone"},
        "request_code": {"phone": "phone", "api_id": "api_id", "api_hash": "api_hash"},
        "sign_in": {"phone": "phone", "code": "code", "phone_code_hash": "phone_code_hash"},
        "request_flash_call": {"phone": "phone", "provider": "provider"},
        "complete_flash_call_registration": {"phone": "phone", "incoming_number": "incoming_number"},
        "request_qr_registration": {"cloud_password": "cloud_password"},
        "check_voice_verification_compatibility": {"sms_provider": "sms_provider"},
    },
    "ip_analyzer": {
        "register_ip": {"phone": "phone", "ip": "ip", "proxy": "proxy", "country": "country"},
        "find_intersections": {"min_accounts": "min_accounts"},
        "check_account_risk": {"phone": "phone"},
        "get_report": {},
    },
    "soul_prompt": {
        "build_soul_prompt": {"persona_data": "persona_data"},
        "build_group_prompt": {"group_data": "group_data"},
        "merge_prompts": {"soul_prompt": "soul_prompt", "group_prompt": "group_prompt", "task": "task"},
    },
    "persona_memory": {
        "remember_conversation": {"persona_id": "persona_id", "group_id": "group_id", "member": "member", "message": "message"},
        "get_context": {"persona_id": "persona_id", "group_id": "group_id", "topic": "topic"},
        "clear_persona": {"persona_id": "persona_id"},
    },
    "persona_analytics": {
        "record_event": {"persona_id": "persona_id", "event_type": "event_type", "group_id": "group_id"},
        "get_metrics": {"persona_id": "persona_id", "hours": "hours"},
        "get_quality_score": {"persona_id": "persona_id"},
        "compare_personas": {"persona_ids": "persona_ids", "hours": "hours"},
        "get_leaderboard": {"hours": "hours"},
    },
    "persona_warmup": {
        "start_warmup": {"persona_id": "persona_id", "group_ids": "group_ids"},
        "get_progress": {"persona_id": "persona_id"},
        "get_phase_summary": {},
    },
    "model_routing": {
        "route": {"persona_id": "persona_id", "task_type": "task_type", "persona_provider": "persona_provider"},
        "set_persona_provider": {"persona_id": "persona_id", "provider": "provider"},
        "get_usage_stats": {},
        "get_available_providers": {},
    },
    "persona_templates": {
        "export_persona": {"persona_dict": "persona_dict"},
        "import_persona": {"data": "data"},
        "validate_persona": {"data": "data"},
        "list_marketplace_templates": {},
        "get_template": {"template_id": "template_id"},
    },
    "persona_knowledge_base": {
        "add_document": {"persona_id": "persona_id", "title": "title", "content": "content", "source": "source", "tags": "tags"},
        "search": {"persona_id": "persona_id", "query": "query", "top_k": "top_k"},
        "get_relevant_context": {"persona_id": "persona_id", "query": "query"},
        "list_documents": {"persona_id": "persona_id"},
        "remove_document": {"persona_id": "persona_id", "doc_id": "doc_id"},
        "get_stats": {"persona_id": "persona_id"},
    },
    "cloner": {
        "clone_account": {"source_phone": "source_phone", "target_session": "target_session"},
        "clone_contacts": {"source_phone": "source_phone", "target_phone": "target_phone"},
    },
    "interceptor": {
        "start_intercept": {"account_id": "account_id", "chat_ids": "chat_ids"},
        "stop_intercept": {"account_id": "account_id"},
        "get_intercepted": {"account_id": "account_id", "limit": "limit"},
    },
    "forwarder": {
        "forward_messages": {"account_id": "account_id", "from_chat": "from_chat", "to_chat": "to_chat", "message_ids": "message_ids"},
        "auto_forward": {"account_id": "account_id", "from_chat": "from_chat", "to_chat": "to_chat"},
    },
    "bot_creator": {
        "create_bot": {"account_id": "account_id", "bot_token": "bot_token"},
        "set_bot_commands": {"account_id": "account_id", "commands": "commands"},
        "set_bot_avatar": {"account_id": "account_id", "photo_path": "photo_path"},
    },
    "referrals": {
        "track_referral": {"referrer": "referrer", "referee": "referee"},
        "get_referral_stats": {"account_id": "account_id"},
    },
    "reporter": {
        "report_user": {"account_id": "account_id", "user_id": "user_id", "reason": "reason"},
        "report_spam": {"account_id": "account_id", "chat_id": "chat_id"},
    },
    "admin": {
        "list_accounts": {},
        "get_account_detail": {"account_id": "account_id"},
        "delete_account": {"account_id": "account_id"},
        "update_account": {"account_id": "account_id", "data": "data"},
    },
    "database_tools": {
        "export_users": {"account_id": "account_id", "chat_id": "chat_id", "format": "format"},
        "import_users": {"file_path": "file_path", "format": "format"},
        "merge_databases": {"paths": "paths", "output": "output"},
    },
    "spambot_remover": {
        "check_restrictions": {"account_id": "account_id"},
        "appeal_restriction": {"account_id": "account_id", "reason": "reason", "strategy": "strategy"},
        "remove_restrictions": {"phone": "phone", "strategy": "strategy", "max_attempts": "max_attempts"},
        "batch_remove_restrictions": {"phones": "phones", "max_workers": "max_workers"},
        "submit_appeal": {"phone": "phone", "strategy": "strategy"},
    },
    "mass_inspection": {
        "inspect_accounts": {"accounts": "accounts"},
        "get_inspection_report": {"account_ids": "account_ids"},
    },
    "parameter_generator": {
        "generate": {"account_id": "account_id", "device_model": "device_model", "app_version": "app_version"},
        "generate_batch": {"count": "count", "device_model": "device_model"},
    },
    "global_search": {
        "search_messages": {"account_id": "account_id", "query": "query", "limit": "limit"},
        "search_users": {"account_id": "account_id", "query": "query", "limit": "limit"},
    },
    "admin_chat_search": {
        "search_admin_chats": {"account_id": "account_id", "query": "query"},
    },
    "create_chats": {
        "create_group": {"account_id": "account_id", "title": "title", "members": "members"},
        "create_channel": {"account_id": "account_id", "title": "title", "description": "description"},
    },
}


DEFAULT_PARAMS = {
    "converter": {
        "convert_to_tdata": {"output_dir": "./converted", "phone_number": "test",
            "device_model": "TelegramGeeks", "app_version": "1.0.0",
            "session_string": "TEST_SESSION", "api_id": 12345, "api_hash": "test_hash"},
        "convert_from_tdata": {"tdata_dir": "./data", "output_dir": "./sessions"},
    },
    "two_way_converter": {
        "convert_tdata_to_session": {"tdata_path": "./data", "output_dir": "./sessions"},
        "convert_session_to_tdata": {"json_path": "./sessions/test.session", "output_dir": "./converted"},
        "batch_convert": {"files": [], "direction": "tdata_to_session", "output_base": "./converted"},
    },
    "booster": {
        "start_warmup": {"phone": "test_account", "target_groups": [], "duration_days": 30},
        "run_warmup_cycle": {"account_id": "test_account", "phone": "test_account"},
    },
    "calculator_reports": {
        "calculate_roi": {"messages_sent": 100, "conversions": 10,
            "cost_per_account": 5.0, "revenue_per_conversion": 15.0},
        "calculate_engagement_score": {"total_messages": 100, "total_reactions": 50,
            "total_views": 1000, "unique_participants": 20, "total_members": 100},
    },
    "link_checker": {
        "check_link": {"url": "https://t.me/telegram"},
        "check_channel": {"chat_id": "test_channel", "channel": "@telegram"},
    },
    "neuro_text": {
        "preview_spintax": {"template": "Hello {World|Universe|Earth}!", "count": 5},
        "generate_with_spintax": {"prompt": "Write about technology", "tone": "casual",
            "spin_count": 3, "persona_context": {}},
        "neuro_comment": {"post_url": "https://t.me/channel/1",
            "post_content": "Sample content", "persona_context": {}},
    },
    "account_folders": {
        "add_account": {"account": {"phone_number": "test_phone", "status": "active"}},
        "health_check": {"phone": "test_phone"},
        "bulk_health_check": {"account_phones": ["test_phone"]},
        "move_to_folder": {"phone": "test_phone", "target_folder": "Active"},
        "search_accounts": {"query": "test"},
        "auto_sort": {},
    },
    "proxy_checker": {
        "add_proxy": {"proxy_string": "1.2.3.4:8080", "proxy_type": "http", "version": "ipv4"},
        "check_proxies": {"proxy_strings": [], "timeout": 5, "retry_attempts": 2, "thread_count": 5},
    },
    "views_boost": {
        "boost_direct_views": {"account_phones": [], "post_urls": ["https://t.me/channel/1"],
            "views_per_post": 100},
        "boost_post_views": {"url": "https://t.me/channel/1", "count": 100},
        "boost_proxy_views": {"proxy_list": [], "channel_url": "https://t.me/channel",
            "views_per_post": 100},
    },
    "mass_subscriptions": {
        "subscribe_to_channels": {"account_phones": [], "channel_links": [], "delay_range": [10, 30]},
    },
    "json_generator": {
        "generate_json": {"session_string": "TEST_SESSION", "api_id": 12345,
            "api_hash": "test_hash", "output_path": "./generated/test.session",
            "phone_number": "+1234567890", "display_name": "Test User"},
    },
    "gender_detector": {
        "detect_gender": {"first_name": "John", "last_name": "Doe", "username": "johndoe"},
    },
    "number_checker": {
        "check_number": {"phone_number": "+1234567890", "phone": "+1234567890"},
    },
    "autoreponder": {
        "add_template": {"account_id": "test", "trigger": "hello", "response": "Hi!",
            "match_type": "keyword"},
    },
    "autoposting": {
        "post_to_chats_v1": {"account_id": "test", "chat_ids": [], "text": "Test",
            "schedule_time": datetime.now(timezone.utc).isoformat(), "repeat": False},
    },
    "persona_manager": {
        "add_persona": {"persona": {"name": "TestBot", "identity": {"display_name": "Test Bot"},
            "personality": {"traits": ["friendly"]}, "communication": {"tone": "casual"},
            "knowledge": {"topics": []}, "behavior": {"response_delay": [5, 30]},
            "media": {"format": "text"}, "relationships": {"audience": "general"}}},
        "generate_post": {"persona": {"name": "TestBot", "identity": {"name": "Test"},
            "personality": {"traits": ["friendly"]}, "communication": {"tone": "casual"},
            "knowledge": {"topics": []}, "behavior": {"response_delay": [5, 30]},
            "media": {"format": "text"}, "relationships": {"audience": "general"}},
            "topic": "test", "context": {}},
    },
    "mass_messaging": {
        "send_to_database": {"account_id": "test_account", "database_path": "./contacts.csv",
            "text": "Hello!", "spin_syntax": True, "style": "casual"},
    },
    "invite_modules": {
        "invite_by_numbers": {"account_id": "test_account", "chat_id": "test_chat",
            "phone_numbers": ["+1234567890"]},
    },
    "audience_collector": {
        "collect_from_comments": {"account_id": "test_account", "chat_id": "test_channel",
            "message_id": "1", "limit": 100},
    },
    "contact_book": {
        "add_contact": {"account_id": "test_account", "user_id": "12345", "username": "testuser",
            "first_name": "Test", "last_name": "User", "phone": "+1234567890"},
    },
    "reactions": {
        "add_reaction": {"phone": "+1234567890", "chat_id": "test_chat",
            "message_id": "1", "emoji": "👍"},
    },
    "stories": {
        "publish_story": {"phone": "+1234567890", "chat_id": "test_chat",
            "media_url": "https://example.com/photo.jpg", "caption": "Story",
            "mentioned_user_ids": []},
    },
    "message_editor": {
        "edit_message": {"account_id": "test_account", "message_id": 1, "new_text": "Edited",
            "phone": "+1234567890", "chat_id": "test_chat"},
    },
    "channel_comments": {
        "post_comments": {"account_phones": ["+1234567890"],
            "channel_links": ["@test_channel"], "comments": ["Great post!"],
            "delay_range": [10, 30], "thread_count": 1,
            "comments_per_post": 1, "randomize_order": True},
    },
    "postbot": {
        "create_posts": {"account_phones": ["+1234567890"], "text": "Auto post",
            "media_path": "", "media_type": "text", "buttons": [],
            "buttons_per_row": 2, "link_preview": True,
            "delay_range": [10, 30], "posts_per_account": 3, "thread_count": 1,
            "groups": [], "persona": ""},
        "render_template": {"template_name": "greeting", "topic": "", "reason": "", "link": "",
            "option_a": "", "option_b": ""},
        "list_templates": {},
        "schedule_post": {"account_phones": [], "text": "Scheduled post",
            "publish_at": "2025-01-01T00:00:00Z", "groups": [], "persona": ""},
        "get_created_posts": {"limit": 100},
        "get_scheduled_posts": {"status": ""},
        "cancel_scheduled": {"post_id": ""},
        "export_post_ids": {},
    },
    "mass_unsubscriber": {
        "unsubscribe_from_channels": {"account_id": "test_account", "chat_ids": ["@test_channel"]},
    },
    "open_dialogs": {
        "get_all_dialogs": {"account_phone": "+1234567890", "limit": 50,
            "exclude_bots": True, "exclude_muted": False},
    },
    "anti_detection": {
        "create_behavior_profile": {"profile_name": "test_profile",
            "min_delay": 5, "max_delay": 60, "activity_pattern": "human",
            "max_actions_per_hour": 50, "active_hours": [9, 10, 11, 14, 15, 16, 17]},
    },
    "anomaly_detector": {
        "check_anomaly": {"account_id": "test", "action": "send_message", "value": 5},
        "build_baseline": {"account_id": "test", "hours": 24},
        "get_report": {"account_id": "test"},
    },
    "flood_guard": {
        "get_risk": {"account_id": "test"},
    },
    "geo_location": {
        "register_proxy": {"proxy_string": "1.2.3.4:8080", "country": "US"},
        "register_account": {"phone": "+1234567890", "country": "US"},
        "find_best_proxy": {"phone": "+1234567890"},
        "get_stats": {},
    },
    "activity_pattern": {
        "generate_profile": {"name": "default", "pattern": "balanced"},
        "get_suggested_actions": {"profile_name": "default", "pattern": "balanced"},
    },
    "cleanup": {
        "get_cleanup_plan": {"phone": "+1234567890"},
        "get_history": {},
    },
    "safety_reporter": {
        "generate_report": {"scope": "all"},
    },
    "topic_engine": {
        "analyze_message": {"chat_id": "test_chat", "text": "Sample message"},
        "get_chat_topics": {"chat_id": "test_chat", "hours": 24},
        "get_trends": {"hours": 72},
    },
    "scheduler": {
        "add_task": {"task_id": "task1", "operation": "send_message", "module_id": "mass_messaging", "params": {}, "interval_min": 60},
        "list_tasks": {},
        "get_stats": {},
    },
    "pipeline_executor": {
        "create_pipeline": {"name": "test_pipeline", "stages": []},
        "list_pipelines": {},
    },
    "anti_pattern": {
        "check_message": {"account_id": "test", "chat_id": "test_chat", "text": "Hello"},
        "get_account_report": {"account_id": "test"},
    },
    "campaign_reporter": {
        "generate_report": {"campaign_id": "test_campaign"},
        "compare_campaigns": {"campaign_ids": ["campaign_a", "campaign_b"]},
    },
    "persona_emotions": {
        "get_modifiers": {"persona_id": "persona_id"},
        "process_content": {"text": "text", "group_id": "group_id"},
        "shift_to": {"state": "state", "reason": "reason"},
        "get_state_history": {"limit": "limit"},
    },
    "persona_generator": {
        "from_archetype": {"archetype_id": "archetype_id", "name": "name", "tone": "tone"},
        "from_keywords": {"keywords": "keywords"},
        "list_archetypes": {},
    },
    "group_prompt_generator": {
        "generate": {"group_type": "group_type", "topic": "topic", "tone": "tone", "rules": "rules"},
        "list_templates": {},
    },
    "persona_ab_test": {
        "create_test": {"test_id": "test_id", "persona_a": "persona_a", "persona_b": "persona_b", "group_id": "group_id", "duration_hours": "duration_hours"},
        "get_test": {"test_id": "test_id"},
        "list_tests": {"status": "status"},
        "declare_winner": {"test_id": "test_id"},
        "clone_persona": {"persona": "persona", "changes": "changes"},
    },
    "forwarder_wizard": {
        "start_wizard": {"session_id": "session_id", "account_phone": "account_phone"},
        "process_step": {"session_id": "session_id", "step": "step", "data": "data"},
        "get_summary": {"session_id": "session_id"},
        "finalize": {"session_id": "session_id"},
        "cancel_wizard": {"session_id": "session_id"},
    },
    "campaign_export": {
        "export_snapshot": {"campaign": "campaign", "accounts": "accounts", "stats": "stats"},
        "to_json": {"snapshot": "snapshot"},
        "to_csv": {"snapshot": "snapshot"},
    },
    "mass_subscribe_resume": {
        "start_batch": {"batch_id": "batch_id", "accounts": "accounts", "channels": "channels"},
        "get_batch": {"batch_id": "batch_id"},
        "list_batches": {"status": "status"},
        "resume_batch": {"batch_id": "batch_id"},
    },
    "booster_username_check": {
        "check_accounts": {"phone_numbers": "phone_numbers"},
    },
    "affiliate_enhanced": {
        "register": {"user_id": "user_id", "referral_code": "referral_code"},
        "record_sale": {"affiliate_code": "affiliate_code", "amount": "amount", "referred_user_id": "referred_user_id"},
        "get_partner": {"user_id": "user_id"},
        "request_payout": {"user_id": "user_id", "amount": "amount", "method": "method"},
        "get_leaderboard": {"top_n": "top_n"},
        "get_stats": {},
    },
    "marketplace": {
        "publish": {"author": "author", "name": "name", "template_type": "template_type", "content": "content", "price": "price", "description": "description"},
        "list_templates": {"template_type": "template_type", "sort_by": "sort_by"},
        "get_template": {"template_id": "template_id"},
        "add_review": {"template_id": "template_id", "user_id": "user_id", "rating": "rating", "comment": "comment"},
        "search": {"query": "query"},
    },
    "sms_dashboard": {
        "get_price_matrix": {"country": "country"},
        "get_free_providers": {"status": "status"},
        "get_live_status": {},
        "get_crypto_matrix": {},
        "get_region_summary": {"country": "country"},
    },
}



class ModuleDispatcher:
    """Dispatch module operations to telegram_layer services via Infrastructure."""

    def __init__(self, infrastructure=None):
        self.infrastructure = infrastructure
        self._service_cache: Dict[str, Any] = {}
        self.available_modules = list(MODULE_SERVICES.keys())
        self._config_service = None
        self._concurrency_sem = None

        if infrastructure:
            logger.info(f"ModuleDispatcher initialized with Infrastructure ({len(self.available_modules)} modules)")
        else:
            logger.warning("ModuleDispatcher initialized WITHOUT Infrastructure (fallback mode)")

    def _get_cfg(self):
        if self._config_service is None:
            from telegram_layer.src.actions.global_config import GlobalConfigService
            self._config_service = GlobalConfigService()
        return self._config_service

    def get_delays(self) -> tuple:
        cfg = self._get_cfg()
        return (cfg.get("delays", "min_seconds") or 3, cfg.get("delays", "max_seconds") or 15)

    def _load_service(self, module_id: str):
        if module_id in self._service_cache:
            return self._service_cache[module_id]

        if self.infrastructure:
            service = self.infrastructure._resolve_service(module_id)
        else:
            service = self._fallback_load(module_id)

        if service:
            self._service_cache[module_id] = service
        return service

    def _fallback_load(self, module_id: str):
        class_name = MODULE_SERVICES.get(module_id)
        if not class_name:
            return None

        try:
            module_name = f"telegram_layer.src.actions.{module_id}"
            module = __import__(module_name, fromlist=[class_name])
            service_class = getattr(module, class_name, None)
            if service_class:
                try:
                    return service_class()
                except TypeError:
                    return None
        except Exception as e:
            logger.debug(f"Fallback load failed for {module_id}: {e}")
            return None

    def _remap_params(self, module_id: str, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        remap = PARAM_REMAP.get(module_id, {}).get(operation, {})
        defaults = DEFAULT_PARAMS.get(module_id, {}).get(operation, {})

        # Start with defaults
        mapped = dict(defaults)
        
        # Override with provided params (remapped)
        for key, value in params.items():
            if key in remap:
                mapped[remap[key]] = value
            else:
                mapped[key] = value

        return mapped

    async def execute(self, module_id: str, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        service = self._load_service(module_id)

        if not service:
            return {
                "status": "error",
                "message": f"Module '{module_id}' service not available",
                "module": module_id,
                "operation": operation,
            }

        method = getattr(service, operation, None)
        if not method:
            return {
                "status": "error",
                "message": f"Operation '{operation}' not found in module '{module_id}'",
                "module": module_id,
                "operation": operation,
            }

        params = self._remap_params(module_id, operation, params)

        # Special handling for persona_manager
        if module_id == "persona_manager" and operation == "add_persona":
            persona_data = params.get("persona")
            if isinstance(persona_data, dict):
                from telegram_layer.src.actions.persona_manager import Persona
                params["persona"] = Persona(data=persona_data)

        if module_id == "persona_manager" and operation in ("generate_post", "generate_reply", "find_ppi_target"):
            persona_id = params.get("persona_id", "")
            persona_dict = params.get("persona")
            # Always convert dict to Persona object
            if isinstance(persona_dict, dict):
                from telegram_layer.src.actions.persona_manager import Persona
                params["persona"] = Persona(data=persona_dict)
            elif persona_id and hasattr(service, "get_persona"):
                persona = service.get_persona(persona_id)
                if persona:
                    params["persona"] = persona
                else:
                    from telegram_layer.src.actions.persona_manager import Persona
                    params["persona"] = Persona(data={"id": persona_id, "name": persona_id, "identity": {"name": persona_id}})

        try:
            sig = inspect.signature(method)
            method_params = set(sig.parameters.keys())
            filtered_params = {k: v for k, v in params.items() if k in method_params}
        except (ValueError, TypeError):
            filtered_params = params

        try:
            logger.info(f"Executing {module_id}.{operation}")

            cfg = self._get_cfg()
            if cfg.get("threads", "stream_control"):
                max_streams = cfg.get("threads", "max_streams") or 5
                if self._concurrency_sem is None or self._concurrency_sem._value != max_streams:
                    self._concurrency_sem = asyncio.Semaphore(max_streams)
                async with self._concurrency_sem:
                    if asyncio.iscoroutinefunction(method):
                        result = await method(**filtered_params)
                    else:
                        result = method(**filtered_params) if filtered_params else method()
            elif asyncio.iscoroutinefunction(method):
                result = await method(**filtered_params)
            else:
                result = method(**filtered_params) if filtered_params else method()

            if hasattr(result, '__await__'):
                result = await result

            return {
                "status": "success",
                "message": f"Operation '{operation}' completed successfully",
                "module": module_id,
                "operation": operation,
                "result": result,
            }
        except Exception as e:
            logger.error(f"Module execution failed for {module_id}.{operation}: {e}", exc_info=True)
            return {
                "status": "error",
                "message": f"Execution failed: {str(e)}",
                "module": module_id,
                "operation": operation,
                "error": str(e),
            }

    def get_available_modules(self) -> list[str]:
        available = []
        for module_id in self.available_modules:
            if self._load_service(module_id):
                available.append(module_id)
        return available

    def get_status(self) -> dict:
        if self.infrastructure:
            infra_status = self.infrastructure.status()
        else:
            infra_status = {"ready": False, "client_manager": "none", "ai_engine": "none"}

        return {
            "dispatcher": "ready",
            "infrastructure": infra_status,
            "cached_services": list(self._service_cache.keys()),
            "total_modules": len(self.available_modules),
        }


dispatcher = ModuleDispatcher()
