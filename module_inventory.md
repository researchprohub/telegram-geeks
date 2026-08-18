# Module Inventory - Real vs Mock

## Backend API v1 Endpoints - Real
- auth.py
- accounts.py
- personas.py
- campaigns.py
- groups.py
- analytics.py
- advanced_analytics.py
- orchestration.py
- modules.py
- neuro_text.py
- global_config.py
- admin.py
- payments.py
- tools.py
- tdata_upload.py
- proxies.py
- postbot.py
- spambot_remover.py
- sms_providers.py
- registrar.py
- partners.py
- model_routing.py
- ip_analyzer.py
- persona_* endpoints
- community_roles_endpoints.py
- group_knowledge_endpoints.py

## Backend Services - Real
- account_service.py
- campaign_service.py
- campaign_executor.py
- persona_service.py
- orchestration_service.py
- analytics_service.py
- account_health.py
- flood_resume_service.py
- neuro_text_bridge.py
- module_dispatcher.py
- settings_service.py
- sms_provider_hub.py
- manual_deposit_service.py
- nowpayments_service.py
- oxapay_service.py

## Telegram Layer Actions - Real
account_management, account_folders, activity_pattern, admin, admin_chat_search, affiliate_enhanced, anomaly_detector, anti_detection, anti_pattern, autoreponder, autoposting, audience_collector, booster, booster_username_check, bot_creator, calculator_reports, campaign_export, campaign_reporter, channel_comments, cleanup, cloner, contact_book, converter, create_chats, database_tools, duplicator, flood_guard, forwarder, forwarder_wizard, gender_detector, geo_location, global_config, global_search, interceptor, invite_modules, ip_analyzer, json_generator, link_checker, mass_messaging, mass_subscriptions, mass_unsubscriber, mass_inspection, mass_subscribe_resume, marketplace, media_fetcher, message_editor, model_routing, neuro_text, number_checker, open_dialogs, parameter_generator, persona_*, pipeline, postbot, sms_dashboard, etc.

## TODOs found
- nowpayments_service.py:156 - Update order status in DB
- oxapay_service.py:163 - Update order in database, credit user account
- admin.py:220 - Implement credit/balance system

No NotImplementedError / mock stubs detected. Modules appear implemented.
