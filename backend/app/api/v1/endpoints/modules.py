"""Modules API — Exposes all Telegram Expert modules with plan-tier gating."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
from loguru import logger

from app.dependencies import get_current_user
from app.models import User
from app.schemas import PLAN_TIERS, MODULE_CATEGORIES
from app.services.module_dispatcher import dispatcher

router = APIRouter(tags=["Modules"], redirect_slashes=False)

MODULE_REGISTRY = [
    # Account Management
    {"id": "converter", "name": "TDATA Converter", "category": "account", "icon": "refresh-cw",
     "description": "Convert session+json to TDATA format.", "operations": ["convert_to_tdata", "convert_from_tdata", "mass_convert"], "tier": "starter"},
    {"id": "two_way_converter", "name": "Two-Way TData Converter", "category": "account", "icon": "arrow-left-right",
     "description": "Full two-way conversion between TData and Session+JSON.", "operations": ["convert_tdata_to_session", "convert_session_to_tdata", "batch_convert"], "tier": "starter"},
    {"id": "booster", "name": "Account Booster", "category": "account", "icon": "zap",
     "description": "30-day progressive account warm-up.", "operations": ["start_warmup", "get_progress", "run_warmup_cycle"], "tier": "starter"},
    {"id": "registrar", "name": "Registrar", "category": "account", "icon": "user-plus",
     "description": "Create accounts via SMS services.", "operations": ["get_phone_number", "register_account", "set_profile"], "tier": "pro"},
    {"id": "duplicator", "name": "Session Duplicator", "category": "account", "icon": "copy",
     "description": "Create a second protected session.", "operations": ["duplicate_session", "list_duplicates"], "tier": "pro"},
    {"id": "json_generator", "name": "JSON Generator", "category": "account", "icon": "file-json",
     "description": "Generate session+json files.", "operations": ["generate_json", "validate_json", "batch_generate"], "tier": "starter"},
    {"id": "spambot_remover", "name": "SpamBot Remover", "category": "account", "icon": "shield-off",
     "description": "Remove Telegram restrictions via @SpamBot.", "operations": ["check_spam_status", "submit_appeal", "remove_restrictions"], "tier": "pro"},
    {"id": "account_management", "name": "Account Management", "category": "account", "icon": "settings-2",
     "description": "Mass inspection, dialogs, archive, import/export.", "operations": ["mass_inspection", "delete_dialogs", "read_dialogs", "import_accounts", "export_account_data"], "tier": "pro"},
    {"id": "number_checker", "name": "Number Checker", "category": "account", "icon": "phone-check",
     "description": "Validate phone numbers + Telegram existence.", "operations": ["check_number", "check_numbers_batch"], "tier": "starter"},
    {"id": "account_folders", "name": "Account Folders", "category": "account", "icon": "folder",
     "description": "Organize accounts: Active, Spamblock, Frozen, Archive.", "operations": ["add_account", "health_check", "bulk_health_check", "move_to_folder", "get_folder_summary", "search_accounts", "auto_sort"], "tier": "starter"},
    {"id": "mass_inspection", "name": "Mass Inspection", "category": "account", "icon": "search",
     "description": "Check all accounts simultaneously.", "operations": ["check_all_accounts", "get_inspection_history", "sort_into_folders"], "tier": "starter"},
    {"id": "parameter_generator", "name": "Parameter Generator", "category": "account", "icon": "sliders",
     "description": "Generate device parameters for accounts.", "operations": ["generate_beginner", "generate_professional", "get_generation_history"], "tier": "starter"},
    {"id": "proxy_checker", "name": "Proxy Pool Manager", "category": "account", "icon": "globe",
     "description": "Add, check, and manage proxy pool.", "operations": ["add_proxy", "check_proxies", "get_proxy_pool", "get_check_history"], "tier": "starter"},

    # Messaging
    {"id": "mass_messaging", "name": "Mass Messaging", "category": "messaging", "icon": "send",
     "description": "DM to database, by ID, by numbers, to contacts.", "operations": ["send_to_database", "send_by_id", "send_by_numbers", "send_to_contacts"], "tier": "starter"},
    {"id": "autoreponder", "name": "Autoresponder", "category": "messaging", "icon": "bot",
     "description": "Template-based auto-reply with spin syntax.", "operations": ["add_template", "remove_template", "start_monitoring"], "tier": "starter"},
    {"id": "autoposting", "name": "Autoposting", "category": "messaging", "icon": "calendar-clock",
     "description": "Scheduled posting to chats and channels.", "operations": ["post_to_chats_v1", "post_to_chats_v2", "post_to_channels", "cancel_post"], "tier": "starter"},
    {"id": "stories", "name": "Stories", "category": "messaging", "icon": "bell",
     "description": "Publish, delete, export stories.", "operations": ["publish_story", "delete_story", "export_stories"], "tier": "starter"},
    {"id": "reactions", "name": "Reactions", "category": "messaging", "icon": "heart",
     "description": "Add/remove/get reactions.", "operations": ["add_reaction", "remove_reaction", "get_reactions"], "tier": "starter"},
    {"id": "message_editor", "name": "Message Editor", "category": "messaging", "icon": "pencil",
     "description": "Edit sent messages within 48h.", "operations": ["edit_message", "pin_message", "batch_edit"], "tier": "starter"},
    {"id": "views_boost", "name": "Views Boost", "category": "messaging", "icon": "eye",
     "description": "Boost post views using accounts or proxies.", "operations": ["boost_direct_views", "boost_post_views", "boost_proxy_views"], "tier": "starter"},
    {"id": "channel_comments", "name": "Channel Comments", "category": "messaging", "icon": "message-square",
     "description": "Post comments on channel posts.", "operations": ["post_comments", "post_from_account", "get_channel_comment_status"], "tier": "starter"},
    {"id": "postbot", "name": "PostBot", "category": "messaging", "icon": "bot",
     "description": "Automated post creation and management.", "operations": ["create_posts", "create_from_account", "export_post_ids"], "tier": "starter"},
    {"id": "anti_detection", "name": "Anti-Detection", "category": "messaging", "icon": "shield",
     "description": "Behavior profiling and human-like patterns.", "operations": ["create_behavior_profile", "apply_delay", "simulate_human_behavior", "get_behavior_profiles"], "tier": "starter"},
    {"id": "anomaly_detector", "name": "Anomaly Detector", "category": "messaging", "icon": "alert-triangle",
     "description": "Detect unusual account activity patterns with z-score analysis.", "operations": ["build_baseline", "check_anomaly", "record_event", "get_report"], "tier": "starter"},
    {"id": "flood_guard", "name": "Flood Guard", "category": "messaging", "icon": "droplet",
     "description": "Predictive FloodWait protection with action rate tracking.", "operations": ["get_risk", "record_action", "record_flood"], "tier": "starter"},
    {"id": "geo_location", "name": "Geo Location", "category": "messaging", "icon": "map-pin",
     "description": "Proxy-country matching and timezone alignment.", "operations": ["register_proxy", "register_account", "find_best_proxy", "get_stats"], "tier": "starter"},
    {"id": "activity_pattern", "name": "Activity Pattern", "category": "messaging", "icon": "activity",
     "description": "Natural daily activity profiles (morning, night, worker, balanced).", "operations": ["generate_profile", "get_suggested_actions"], "tier": "starter"},
    {"id": "anti_pattern", "name": "Anti-Pattern", "category": "messaging", "icon": "ban",
     "description": "Detect and avoid repetitive behavioral patterns.", "operations": ["check_message", "get_account_report"], "tier": "starter"},

    # Audience
    {"id": "invite_modules", "name": "Invite Tools", "category": "audience", "icon": "user-plus",
     "description": "Invite by numbers, username, ID, via admin.", "operations": ["invite_by_numbers", "invite_by_username", "invite_by_id", "invite_via_admin_v1", "invite_via_admin_v2"], "tier": "starter"},
    {"id": "audience_collector", "name": "Audience Collector", "category": "audience", "icon": "users",
     "description": "Collect from comments, accounts, replies, members, hashtags.", "operations": ["collect_from_comments", "collect_from_account", "collect_from_replies", "collect_new_chat_members", "collect_by_hashtag", "deduplicate"], "tier": "starter"},
    {"id": "contact_book", "name": "Contact Book", "category": "audience", "icon": "book-user",
     "description": "Add/export/delete/search contacts.", "operations": ["add_contact", "get_contacts", "export_contacts", "search_contacts", "delete_contact"], "tier": "starter"},
    {"id": "mass_unsubscriber", "name": "Mass Unsubscriber", "category": "audience", "icon": "user-minus",
     "description": "Unsubscribe from channels/chats.", "operations": ["unsubscribe_from_channels", "unsubscribe_from_chats", "leave_all_chats", "unsubscribe_from_all_channels"], "tier": "starter"},
    {"id": "gender_detector", "name": "Gender Detector", "category": "audience", "icon": "user-search",
     "description": "AI-powered gender detection.", "operations": ["detect_gender", "batch_detect"], "tier": "starter"},
    {"id": "mass_subscriptions", "name": "Mass Subscriptions", "category": "audience", "icon": "plus-circle",
     "description": "Subscribe/unsubscribe from channels at scale.", "operations": ["subscribe_to_channels", "subscribe_account", "unsubscribe_from_channels", "unsubscribe_account"], "tier": "starter"},
    {"id": "open_dialogs", "name": "Open Dialogs", "category": "audience", "icon": "message-circle",
     "description": "Browse dialogs, message history, search.", "operations": ["get_all_dialogs", "get_message_history", "search_messages", "get_contact_list"], "tier": "starter"},

    # Content
    {"id": "cloner", "name": "Channel/Chat Cloner", "category": "content", "icon": "clone",
     "description": "Copy channel/group content including protected.", "operations": ["clone_channel", "clone_group", "clone_with_progress"], "tier": "pro"},
    {"id": "interceptor", "name": "Interceptor", "category": "content", "icon": "radio",
     "description": "Keyword-based message monitoring.", "operations": ["add_keyword", "remove_keyword", "list_keywords", "intercept_message", "start_monitoring", "stop_monitoring"], "tier": "pro"},
    {"id": "forwarder", "name": "Forwarder", "category": "content", "icon": "arrow-right-left",
     "description": "Route replies from accounts to working group.", "operations": ["start_forwarding", "stop_forwarding", "route_reply", "get_status"], "tier": "pro"},

    # Growth
    {"id": "bot_creator", "name": "Bot Creator", "category": "growth", "icon": "bot",
     "description": "BotFather automation.", "operations": ["create_bot", "set_bot_commands", "set_bot_photo", "delete_bot", "list_bots", "update_bot_info"], "tier": "pro"},
    {"id": "referrals", "name": "Referrals", "category": "growth", "icon": "link",
     "description": "Referral links for bots and Mini Apps.", "operations": ["create_referral_link", "create_mini_app_referral", "get_referral_stats", "revoke_referral_link", "list_referral_links"], "tier": "pro"},
    {"id": "reporter", "name": "Reporter", "category": "growth", "icon": "flag",
     "description": "Mass complaint filing with anti-detection.", "operations": ["report_user", "report_message", "report_channel", "mass_report"], "tier": "pro"},
    {"id": "global_search", "name": "Global Search", "category": "growth", "icon": "search",
     "description": "Search users, channels, groups globally.", "operations": ["search_global", "search_users", "search_channels", "search_groups", "get_user_info", "get_search_history"], "tier": "starter"},
    {"id": "admin_chat_search", "name": "Admin Chat Search", "category": "growth", "icon": "search-check",
     "description": "Search within admin-accessible chats.", "operations": ["search_admin_chats", "get_chat_participants"], "tier": "starter"},
    {"id": "create_chats", "name": "Create Chats", "category": "growth", "icon": "plus-square",
     "description": "Create groups and channels programmatically.", "operations": ["create_group", "create_channel", "set_chat_photo", "set_chat_description", "get_created_chats"], "tier": "starter"},

    # Operations
    {"id": "global_config", "name": "Global Config", "category": "admin", "icon": "settings-2",
     "description": "Proxy, delay, thread, GPT, license and antivirus settings.", "operations": ["get_all", "set", "update_section", "check_license", "set_license"], "tier": "pro"},
    {"id": "cleanup", "name": "Cleanup", "category": "account", "icon": "trash-2",
     "description": "Digital footprint removal: clear dialogs, leave groups, delete contacts.", "operations": ["get_cleanup_plan", "execute_cleanup", "get_history"], "tier": "starter"},
    {"id": "safety_reporter", "name": "Safety Reporter", "category": "account", "icon": "clipboard-check",
     "description": "System-wide incident monitoring and report generation.", "operations": ["record_incident", "generate_report"], "tier": "starter"},

    # Admin
    {"id": "admin", "name": "Admin Tools", "category": "admin", "icon": "settings",
     "description": "Create chats/channels, manage admins.", "operations": ["create_chat", "create_channel", "add_admin", "remove_admin", "set_chat_photo", "set_chat_description"], "tier": "starter"},
    {"id": "link_checker", "name": "Link Checker", "category": "admin", "icon": "link-2",
     "description": "Check entity info without accounts.", "operations": ["check_link", "check_channel", "check_user", "check_group"], "tier": "starter"},
    {"id": "database_tools", "name": "Database Tools", "category": "admin", "icon": "database",
     "description": "Union, exclude, clean, validate databases.", "operations": ["union_databases", "exclude_database", "clean_database", "validate_database", "verify_links"], "tier": "pro"},
    {"id": "calculator_reports", "name": "Calculator & Reports", "category": "admin", "icon": "calculator",
     "description": "ROI calculator, engagement score, reports.", "operations": ["calculate_roi", "calculate_engagement_score", "generate_report", "generate_summary_report", "export_report"], "tier": "starter"},

    # AI & Content Generation
    {"id": "neuro_text", "name": "Neuro-Text Engine", "category": "content", "icon": "sparkles",
     "description": "Spintax editor + GPT content generation.", "operations": ["preview_spintax", "generate_with_spintax", "neuro_comment"], "tier": "starter"},
    {"id": "persona_manager", "name": "AI Persona Manager", "category": "growth", "icon": "user-cog",
     "description": "7-layer persona architecture. PPI + HPI modes + Dual Prompt (Soul Prompt + Group Prompt).", "operations": ["add_persona", "generate_post", "generate_reply", "find_ppi_target"], "tier": "starter"},
    {"id": "soul_prompt", "name": "Soul Prompt Engine", "category": "content", "icon": "heart",
     "description": "Level 0 Soul Prompt + Level 2 Group Context Prompt generation and merging.", "operations": ["build_soul_prompt", "build_group_prompt", "merge_prompts"], "tier": "starter"},

    # Persona System
    {"id": "persona_memory", "name": "Persona Memory System", "category": "growth", "icon": "brain",
     "description": "3-tier memory: short-term, long-term (facts), episodic (experiences).", "operations": ["remember_conversation", "get_context", "clear_persona"], "tier": "starter"},
    {"id": "persona_analytics", "name": "Persona Analytics", "category": "admin", "icon": "bar-chart-3",
     "description": "Engagement, conversion, quality metrics per persona with leaderboard.", "operations": ["record_event", "get_metrics", "get_quality_score", "compare_personas", "get_leaderboard"], "tier": "starter"},
    {"id": "persona_warmup", "name": "Persona Warm-Up", "category": "account", "icon": "thermometer",
     "description": "5-phase gradual persona introduction (lurk→react→reply→regular→full).", "operations": ["start_warmup", "get_progress", "get_phase_summary"], "tier": "starter"},
    {"id": "persona_knowledge_base", "name": "Persona Knowledge Base (RAG)", "category": "growth", "icon": "book-open",
     "description": "Per-persona document store with keyword retrieval.", "operations": ["add_document", "search", "get_relevant_context", "list_documents", "remove_document", "get_stats"], "tier": "starter"},

    # AI & Content Generation
    {"id": "model_routing", "name": "Multi-Model Router", "category": "admin", "icon": "git-branch",
     "description": "Route per-persona to optimal AI provider based on cost/quality/task.", "operations": ["route", "set_persona_provider", "get_usage_stats", "get_available_providers"], "tier": "pro"},
    {"id": "persona_templates", "name": "Persona Templates", "category": "content", "icon": "file-text",
     "description": "Import/export personas, version history, marketplace templates.", "operations": ["export_persona", "import_persona", "list_marketplace_templates", "get_template", "snapshot"], "tier": "starter"},

    # Infrastructure
    {"id": "sms_hub", "name": "SMS Provider Hub", "category": "admin", "icon": "smartphone",
     "description": "25+ SMS providers with priority routing, fallback chain, balance dashboard.", "operations": ["list_providers", "get_phone", "get_code", "configure_provider", "set_priority"], "tier": "pro"},
    {"id": "ip_analyzer", "name": "IP Intersection Analyzer", "category": "account", "icon": "network",
     "description": "Cross-account IP conflict detection and proxy overlap analysis.", "operations": ["register_ip", "find_intersections", "check_account_risk", "get_report"], "tier": "starter"},

    # Orchestrator
    {"id": "topic_engine", "name": "Topic Engine", "category": "admin", "icon": "hash",
     "description": "Group topic analysis with crypto/tech/marketing keyword detection.", "operations": ["analyze_message", "get_chat_topics", "get_trends"], "tier": "pro"},
    {"id": "scheduler", "name": "Task Scheduler", "category": "admin", "icon": "calendar",
     "description": "Schedule periodic module operations and manage execution tasks.", "operations": ["add_task", "remove_task", "list_tasks", "get_due_tasks", "get_stats"], "tier": "pro"},
    {"id": "pipeline_executor", "name": "Pipeline Executor", "category": "admin", "icon": "git-branch",
     "description": "Multi-stage workflow execution engine for complex automations.", "operations": ["create_pipeline", "get_pipeline", "list_pipelines", "advance_stage"], "tier": "pro"},
    {"id": "campaign_reporter", "name": "Campaign Reporter", "category": "growth", "icon": "bar-chart-3",
     "description": "Per-campaign event recording and cross-campaign comparison.", "operations": ["record_event", "generate_report", "compare_campaigns"], "tier": "pro"},

    # Persona Emotion System
    {"id": "persona_emotions", "name": "Persona Emotion States", "category": "growth", "icon": "heart",
     "description": "6-emotion state machine with auto-triggers + Community Roles (Leader/Core/Newcomer/Lurker/Validator).", "operations": ["get_modifiers", "shift_to", "get_state_history"], "tier": "pro"},
    {"id": "persona_generator", "name": "AI Persona Generator", "category": "content", "icon": "wand-2",
     "description": "Generate personas from archetypes (11) or AI from keywords with soul prompt.", "operations": ["from_archetype", "from_keywords", "list_archetypes"], "tier": "starter"},
    {"id": "group_prompt_generator", "name": "AI Group Prompt Generator", "category": "content", "icon": "message-square-plus",
     "description": "Generate group context prompts from templates or AI.", "operations": ["generate", "list_templates"], "tier": "starter"},
    {"id": "persona_ab_test", "name": "A/B Testing", "category": "growth", "icon": "split-square-vertical",
     "description": "Clone persona, run variants, auto-declare winner by engagement.", "operations": ["create_test", "get_test", "list_tests", "declare_winner", "clone_persona"], "tier": "pro"},

    # Account Tools
    {"id": "forwarder_wizard", "name": "Forwarder Setup Wizard", "category": "account", "icon": "arrow-right-left",
     "description": "Step-by-step supergroup forwarding configuration wizard.", "operations": ["start_wizard", "process_step", "get_summary", "finalize", "cancel_wizard"], "tier": "pro"},
    {"id": "mass_subscribe_resume", "name": "Mass Subscribe Resume", "category": "account", "icon": "refresh-cw",
     "description": "Checkpoint-based progress tracking for interrupted mass subscriptions.", "operations": ["start_batch", "get_batch", "list_batches", "resume_batch"], "tier": "starter"},
    {"id": "campaign_export", "name": "Live Campaign Export", "category": "growth", "icon": "download",
     "description": "Mid-campaign progress snapshot with CSV/JSON export.", "operations": ["export_snapshot", "to_json", "to_csv"], "tier": "pro"},
    {"id": "booster_username_check", "name": "Booster Username Pre-Check", "category": "account", "icon": "user-check",
     "description": "Validate accounts have usernames before warm-up.", "operations": ["check_accounts"], "tier": "starter"},

    # Growth & Monetization
    {"id": "affiliate_enhanced", "name": "Affiliate Program", "category": "growth", "icon": "link-2",
     "description": "4-tier affiliate system with commissions, milestone bonuses, payouts, leaderboard.", "operations": ["register", "record_sale", "get_partner", "request_payout", "get_leaderboard", "get_stats"], "tier": "pro"},
    {"id": "marketplace", "name": "Template Marketplace", "category": "content", "icon": "store",
     "description": "Publish, rate, review, and download persona & group prompt templates.", "operations": ["publish", "list_templates", "get_template", "add_review", "search"], "tier": "pro"},

    # Infrastructure
    {"id": "sms_dashboard", "name": "SMS Provider Live Dashboard", "category": "admin", "icon": "monitor-smartphone",
     "description": "Live price matrix, crypto payment support, region-based provider comparison.", "operations": ["get_price_matrix", "get_free_providers", "get_live_status", "get_crypto_matrix", "get_region_summary"], "tier": "starter"},
]


class ModuleExecuteRequest(BaseModel):
    operation: str
    params: dict[str, Any] = {}


class PlanTierResponse(BaseModel):
    tier: str
    name: str
    price_monthly: float
    price_yearly: float
    description: str
    modules: list[str]
    accounts_limit: int
    campaigns_limit: int
    groups_limit: int
    ai_requests_per_day: int
    features: list[str]


ROLE_TO_PLAN = {
    "admin": "agency",
    "operator": "starter",
    "viewer": "starter",
    "pro": "pro",
}


def _check_module_access(user: User, module_id: str) -> None:
    if user.role == "admin":
        return

    plan_tier = ROLE_TO_PLAN.get(user.role, "starter")

    module = next((m for m in MODULE_REGISTRY if m["id"] == module_id), None)
    if not module:
        raise HTTPException(status_code=404, detail=f"Module '{module_id}' not found")

    required_tier = module.get("tier", "starter")
    tier_order = ["starter", "pro", "agency"]

    if required_tier not in tier_order or plan_tier not in tier_order:
        return

    if tier_order.index(plan_tier) >= tier_order.index(required_tier):
        return

    raise HTTPException(
        status_code=403,
        detail={
            "message": f"Module '{module_id}' requires {required_tier.capitalize()} plan",
            "required_tier": required_tier,
            "current_tier": plan_tier,
            "upgrade_url": "/pricing",
        }
    )


@router.get("/plans", response_model=list[PlanTierResponse], tags=["Plans"])
async def list_plans():
    plans = []
    for tier_key, tier_data in PLAN_TIERS.items():
        plans.append(PlanTierResponse(
            tier=tier_key, name=tier_data["name"],
            price_monthly=tier_data["price_monthly"], price_yearly=tier_data["price_yearly"],
            description=tier_data["description"], modules=tier_data["modules"],
            accounts_limit=tier_data["accounts_limit"], campaigns_limit=tier_data["campaigns_limit"],
            groups_limit=tier_data["groups_limit"], ai_requests_per_day=tier_data["ai_requests_per_day"],
            features=tier_data["features"],
        ))
    return plans


@router.get("/", tags=["Modules"])
@router.get("", tags=["Modules"])
async def list_modules(category: Optional[str] = None, user: User = Depends(get_current_user)):
    modules = MODULE_REGISTRY
    if category:
        modules = [m for m in modules if m["category"] == category]
    categories = sorted(set(m["category"] for m in MODULE_REGISTRY))
    return {
        "total": len(MODULE_REGISTRY), "active": len(MODULE_REGISTRY),
        "categories": categories, "module_categories": MODULE_CATEGORIES,
        "modules": [{**m, "status": "active"} for m in modules],
    }


@router.get("/status", tags=["Modules"])
async def get_dispatcher_status(user: User = Depends(get_current_user)):
    return dispatcher.get_status()


@router.get("/{module_id}", tags=["Modules"])
async def get_module(module_id: str, user: User = Depends(get_current_user)):
    module = next((m for m in MODULE_REGISTRY if m["id"] == module_id), None)
    if not module:
        raise HTTPException(status_code=404, detail=f"Module '{module_id}' not found")
    _check_module_access(user, module_id)
    return {**module, "status": "active"}


@router.get("/{module_id}/params", tags=["Modules"])
async def get_module_params(module_id: str, user: User = Depends(get_current_user)):
    """Return per-operation param defaults + remap hints so UIs can auto-generate forms."""
    module = next((m for m in MODULE_REGISTRY if m["id"] == module_id), None)
    if not module:
        raise HTTPException(status_code=404, detail=f"Module '{module_id}' not found")
    _check_module_access(user, module_id)
    from app.services.module_dispatcher import DEFAULT_PARAMS, PARAM_REMAP
    defaults = DEFAULT_PARAMS.get(module_id, {})
    remap = PARAM_REMAP.get(module_id, {})
    operations = {}
    for op in module.get("operations", []):
        operations[op] = {
            "defaults": defaults.get(op, {}),
            "remap": remap.get(op, {}),
        }
    return {"module_id": module_id, "operations": operations}


@router.post("/{module_id}/execute", tags=["Modules"])
async def execute_module(module_id: str, body: ModuleExecuteRequest, user: User = Depends(get_current_user)):
    module = next((m for m in MODULE_REGISTRY if m["id"] == module_id), None)
    if not module:
        raise HTTPException(status_code=404, detail=f"Module '{module_id}' not found")
    if body.operation not in module["operations"]:
        raise HTTPException(status_code=400, detail=f"Operation '{body.operation}' not available. Available: {module['operations']}")
    _check_module_access(user, module_id)
    logger.info(f"User {user.id} ({user.role}) executing {module_id}.{body.operation}")
    result = await dispatcher.execute(module_id, body.operation, body.params)
    return result
