"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw, Zap, Bot, Send, Bell, Heart,
  Users, BookUser, UserMinus, UserSearch,
  ArrowRightLeft, Shield, Link2 as LucideLink2,
  Flag, Database, Calculator,
  Search, Filter, Eye, MessageSquare, Terminal, ArrowRight,
  Smartphone, Globe, PlusCircle, MousePointerClick, ShieldCheck, Edit3, Phone, Rocket,
  Cloud, Sparkles, Brain, LayoutGrid, List, Sliders, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export interface Module {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  operations: string[];
  plan_required: string;
}

const fallbackModules: Module[] = [
  // Account Operations (16)
  { id: "converter", name: "TDATA Converter", category: "account", icon: "RefreshCw", description: "Convert session+json to TDATA format", operations: ["convert_to_tdata", "convert_from_tdata", "mass_convert"], plan_required: "starter" },
  { id: "two_way_converter", name: "Two-Way TData Converter", category: "account", icon: "ArrowRightLeft", description: "Full two-way conversion between TData and Session+JSON", operations: ["convert_tdata_to_session", "convert_session_to_tdata", "batch_convert"], plan_required: "starter" },
  { id: "booster", name: "Account Booster", category: "account", icon: "Zap", description: "30-day progressive account warm-up engine", operations: ["start_warmup", "get_progress", "run_warmup_cycle"], plan_required: "starter" },
  { id: "registrar", name: "Universal Registrar", category: "account", icon: "Bot", description: "Batch account registration via 25+ SMS APIs", operations: ["get_phone_number", "register_account", "set_profile"], plan_required: "pro" },
  { id: "duplicator", name: "Session Duplicator", category: "account", icon: "RefreshCw", description: "Create protected secondary Telegram sessions", operations: ["duplicate_session", "list_duplicates"], plan_required: "pro" },
  { id: "json_generator", name: "JSON Generator", category: "account", icon: "Database", description: "Generate device parameters and session JSONs", operations: ["generate_json", "validate_json", "batch_generate"], plan_required: "starter" },
  { id: "spambot_remover", name: "SpamBot Remover", category: "account", icon: "Shield", description: "Remove Telegram account restrictions via @SpamBot appeal", operations: ["check_spam_status", "submit_appeal", "remove_restrictions"], plan_required: "pro" },
  { id: "account_management", name: "Account Management", category: "account", icon: "Users", description: "Mass inspection, dialog cleanup, archive, import/export", operations: ["mass_inspection", "delete_dialogs", "read_dialogs", "import_accounts"], plan_required: "pro" },
  { id: "number_checker", name: "Number Checker", category: "account", icon: "Phone", description: "Validate phone numbers and check Telegram existence", operations: ["check_number", "check_numbers_batch"], plan_required: "starter" },
  { id: "account_folders", name: "Account Folders", category: "account", icon: "Users", description: "Auto-organize accounts: Active, Spamblock, Frozen, Archive", operations: ["add_account", "health_check", "bulk_health_check", "move_to_folder"], plan_required: "starter" },
  { id: "mass_inspection", name: "Mass Inspection", category: "account", icon: "Search", description: "Batch check all accounts simultaneously for bans and spam status", operations: ["check_all_accounts", "get_inspection_history", "sort_into_folders"], plan_required: "starter" },
  { id: "parameter_generator", name: "Parameter Generator", category: "account", icon: "Filter", description: "Generate device fingerprints, app versions, system SDKs", operations: ["generate_beginner", "generate_professional"], plan_required: "starter" },
  { id: "proxy_checker", name: "Proxy Pool Manager", category: "account", icon: "Globe", description: "Add, test latency, rotate, and manage HTTP/SOCKS5 proxies", operations: ["add_proxy", "check_proxies", "get_proxy_pool"], plan_required: "starter" },
  { id: "cleanup", name: "Account Cleanup", category: "account", icon: "UserMinus", description: "Digital footprint removal: clear dialogs, leave groups, purge contacts", operations: ["get_cleanup_plan", "execute_cleanup"], plan_required: "starter" },
  { id: "ip_analyzer", name: "IP Intersection Analyzer", category: "account", icon: "Globe", description: "Cross-account IP conflict detection and proxy overlap analysis", operations: ["register_ip", "find_intersections", "check_account_risk"], plan_required: "starter" },
  { id: "booster_username_check", name: "Booster Username Pre-Check", category: "account", icon: "UserSearch", description: "Validate accounts have usernames set before initiating warming", operations: ["check_accounts"], plan_required: "starter" },

  // Messaging & Outreach (12)
  { id: "mass_messaging", name: "Mass Messaging", category: "messaging", icon: "Send", description: "Send bulk direct messages with Spintax and neuro-text", operations: ["send_to_database", "send_by_id", "send_by_numbers", "send_to_contacts"], plan_required: "starter" },
  { id: "autoreponder", name: "Autoresponder", category: "messaging", icon: "Bot", description: "Template-based auto-reply with keyword triggers and spin syntax", operations: ["add_template", "remove_template", "start_monitoring"], plan_required: "starter" },
  { id: "autoposting", name: "Autoposting V1", category: "messaging", icon: "Zap", description: "Scheduled multi-account posting to chats and channels", operations: ["post_to_chats_v1", "post_to_chats_v2", "post_to_channels"], plan_required: "starter" },
  { id: "stories", name: "Stories Booster", category: "messaging", icon: "Bell", description: "Publish, delete, export, and auto-view Telegram stories", operations: ["publish_story", "delete_story", "export_stories"], plan_required: "starter" },
  { id: "reactions", name: "Reactions Booster", category: "messaging", icon: "Heart", description: "Boost emoji reactions on channel posts and messages", operations: ["add_reaction", "remove_reaction", "get_reactions"], plan_required: "starter" },
  { id: "message_editor", name: "Message Editor", category: "messaging", icon: "Edit3", description: "Edit sent messages within 48h or pin in bulk", operations: ["edit_message", "pin_message", "batch_edit"], plan_required: "starter" },
  { id: "views_boost", name: "Views Booster", category: "messaging", icon: "Eye", description: "Boost post views using accounts or rotating proxies", operations: ["boost_direct_views", "boost_post_views", "boost_proxy_views"], plan_required: "starter" },
  { id: "channel_comments", name: "Channel Comments", category: "messaging", icon: "MessageSquare", description: "Post context-aware comments on channel broadcasts", operations: ["post_comments", "post_from_account"], plan_required: "starter" },
  { id: "postbot", name: "PostBot Creator", category: "messaging", icon: "Bot", description: "Automated post creation and inline keyboard formatting", operations: ["create_posts", "create_from_account", "export_post_ids"], plan_required: "starter" },
  { id: "anti_detection", name: "Anti-Detection Shield", category: "messaging", icon: "Shield", description: "Behavior profiling, realistic typing simulations, delay jitter", operations: ["create_behavior_profile", "apply_delay", "simulate_human_behavior"], plan_required: "starter" },
  { id: "anomaly_detector", name: "Anomaly Detector", category: "messaging", icon: "ShieldCheck", description: "Detect abnormal activity patterns with z-score analysis", operations: ["build_baseline", "check_anomaly", "record_event"], plan_required: "starter" },
  { id: "flood_guard", name: "Predictive Flood Guard", category: "messaging", icon: "ShieldCheck", description: "Predictive FloodWait protection with action rate tracking", operations: ["get_risk", "record_action", "record_flood"], plan_required: "starter" },

  // Audience & Parsing (8)
  { id: "invite_modules", name: "Invite Tools", category: "audience", icon: "Users", description: "Invite audience by ID, phone number, username, or via admin", operations: ["invite_by_numbers", "invite_by_username", "invite_by_id", "invite_via_admin_v1"], plan_required: "starter" },
  { id: "audience_collector", name: "Audience Collector", category: "audience", icon: "UserSearch", description: "Extract active members, commenters, replies, and hashtags", operations: ["collect_from_comments", "collect_from_account", "collect_from_replies"], plan_required: "starter" },
  { id: "contact_book", name: "Contact Book", category: "audience", icon: "BookUser", description: "Bulk add, export, clean, and sync account contacts", operations: ["add_contact", "get_contacts", "export_contacts", "delete_contact"], plan_required: "starter" },
  { id: "mass_unsubscriber", name: "Mass Unsubscriber", category: "audience", icon: "UserMinus", description: "Bulk leave spam channels and flooded chat groups", operations: ["unsubscribe_from_channels", "unsubscribe_from_chats", "leave_all_chats"], plan_required: "starter" },
  { id: "gender_detector", name: "Gender Detector", category: "audience", icon: "UserSearch", description: "AI-powered gender classification of Telegram users", operations: ["detect_gender", "batch_detect"], plan_required: "starter" },
  { id: "mass_subscriptions", name: "Mass Subscriptions", category: "audience", icon: "PlusCircle", description: "Subscribe hundreds of accounts to channels at scale", operations: ["subscribe_to_channels", "subscribe_account"], plan_required: "starter" },
  { id: "open_dialogs", name: "Open Dialogues", category: "audience", icon: "MessageSquare", description: "Browse dialogs, message history, and search conversations", operations: ["get_all_dialogs", "get_message_history", "search_messages"], plan_required: "starter" },
  { id: "mass_subscribe_resume", name: "Mass Subscribe Resume", category: "audience", icon: "RefreshCw", description: "Checkpoint-based recovery for interrupted mass subscription runs", operations: ["start_batch", "get_batch", "resume_batch"], plan_required: "starter" },

  // Content & Forwarding (6)
  { id: "cloner", name: "Channel/Chat Cloner", category: "content", icon: "ArrowRightLeft", description: "Copy channels and group history including restricted media", operations: ["clone_channel", "clone_group", "clone_with_progress"], plan_required: "pro" },
  { id: "interceptor", name: "Message Interceptor", category: "content", icon: "Eye", description: "Realtime keyword-based message interceptor and lead capturer", operations: ["add_keyword", "remove_keyword", "list_keywords", "start_monitoring"], plan_required: "pro" },
  { id: "forwarder", name: "Message Forwarder", category: "content", icon: "ArrowRightLeft", description: "Route inbound replies from multiple accounts into a single CRM chat", operations: ["start_forwarding", "stop_forwarding", "route_reply"], plan_required: "pro" },
  { id: "forwarder_wizard", name: "Forwarder Setup Wizard", category: "content", icon: "ArrowRightLeft", description: "Step-by-step supergroup forwarding configuration assistant", operations: ["start_wizard", "process_step", "finalize"], plan_required: "pro" },
  { id: "neuro_text", name: "Neuro-Text Engine", category: "content", icon: "Sparkles", description: "AI-powered Spintax generator and neuro-comment creator", operations: ["preview_spintax", "generate_with_spintax", "neuro_comment"], plan_required: "starter" },
  { id: "soul_prompt", name: "Soul Prompt Engine", category: "content", icon: "Heart", description: "Generates Level 0 Soul Prompts + Level 2 Group context prompts", operations: ["build_soul_prompt", "build_group_prompt", "merge_prompts"], plan_required: "starter" },

  // Growth & Bots (7)
  { id: "bot_creator", name: "Bot Creator", category: "growth", icon: "Bot", description: "Automated BotFather bot registration, token setup, commands", operations: ["create_bot", "set_bot_commands", "set_bot_photo", "delete_bot"], plan_required: "pro" },
  { id: "referrals", name: "Referrals to Bots", category: "growth", icon: "LucideLink2", description: "Generate referral links for bots and Telegram Mini Apps", operations: ["create_referral_link", "create_mini_app_referral", "get_referral_stats"], plan_required: "pro" },
  { id: "reporter", name: "Mass Reporter", category: "growth", icon: "Flag", description: "Mass complaint filing with anti-detection protection", operations: ["report_user", "report_message", "report_channel"], plan_required: "pro" },
  { id: "global_search", name: "Global Search", category: "growth", icon: "Search", description: "Search Telegram global database for users, groups, and channels", operations: ["search_global", "search_users", "search_channels", "search_groups"], plan_required: "starter" },
  { id: "admin_chat_search", name: "Admin Chat Search", category: "growth", icon: "ShieldCheck", description: "Search within admin-accessible chats and channels", operations: ["search_admin_chats", "get_chat_participants"], plan_required: "starter" },
  { id: "create_chats", name: "Chat Creator", category: "growth", icon: "PlusCircle", description: "Create groups, supergroups, and channels programmatically", operations: ["create_group", "create_channel", "set_chat_photo"], plan_required: "starter" },
  { id: "marketplace", name: "Template Marketplace", category: "growth", icon: "Sparkles", description: "Publish, rate, review, and download persona & prompt templates", operations: ["publish", "list_templates", "get_template"], plan_required: "pro" },

  // AI Personas & Memory (11)
  { id: "persona_manager", name: "AI Persona Orchestrator", category: "personas", icon: "Brain", description: "7-layer persona architecture with PPI + HPI conversational modes", operations: ["add_persona", "generate_post", "generate_reply", "find_ppi_target"], plan_required: "starter" },
  { id: "persona_memory", name: "Persona Memory System", category: "personas", icon: "Brain", description: "3-tier memory: short-term, factual long-term, and episodic context", operations: ["remember_conversation", "get_context", "clear_persona"], plan_required: "starter" },
  { id: "persona_analytics", name: "Persona Analytics", category: "personas", icon: "Calculator", description: "Engagement, conversion, and quality metrics with leaderboard", operations: ["record_event", "get_metrics", "get_quality_score", "get_leaderboard"], plan_required: "starter" },
  { id: "persona_warmup", name: "Persona Warm-Up", category: "personas", icon: "Zap", description: "5-phase gradual introduction (lurk → react → reply → regular → full)", operations: ["start_warmup", "get_progress", "get_phase_summary"], plan_required: "starter" },
  { id: "persona_knowledge_base", name: "Persona Knowledge Base (RAG)", category: "personas", icon: "Database", description: "Per-persona document store with keyword and semantic retrieval", operations: ["add_document", "search", "get_relevant_context"], plan_required: "starter" },
  { id: "model_routing", name: "Multi-Model Router", category: "personas", icon: "Globe", description: "Route personas to optimal LLM provider based on cost and quality", operations: ["route", "set_persona_provider", "get_usage_stats"], plan_required: "pro" },
  { id: "persona_templates", name: "Persona Templates", category: "personas", icon: "Database", description: "Import/export personas, version history, marketplace templates", operations: ["export_persona", "import_persona", "list_marketplace_templates"], plan_required: "starter" },
  { id: "persona_emotions", name: "Persona Emotion States", category: "personas", icon: "Heart", description: "6-emotion state machine with community role behaviors", operations: ["get_modifiers", "shift_to", "get_state_history"], plan_required: "pro" },
  { id: "persona_generator", name: "AI Persona Generator", category: "personas", icon: "Sparkles", description: "Generate personas from archetypes or prompt keywords", operations: ["from_archetype", "from_keywords", "list_archetypes"], plan_required: "starter" },
  { id: "group_prompt_generator", name: "AI Group Prompt Generator", category: "personas", icon: "MessageSquare", description: "Generate group context prompts from templates or AI", operations: ["generate", "list_templates"], plan_required: "starter" },
  { id: "persona_ab_test", name: "Persona A/B Testing", category: "personas", icon: "Zap", description: "Clone persona, run variants, auto-declare winner by engagement", operations: ["create_test", "get_test", "list_tests", "declare_winner"], plan_required: "pro" },

  // Operations & Infrastructure (17)
  { id: "sms_hub", name: "SMS Provider Hub", category: "admin", icon: "Smartphone", description: "25+ SMS providers with priority routing, fallback chain, balance check", operations: ["list_providers", "get_phone", "get_code", "configure_provider"], plan_required: "pro" },
  { id: "sms_dashboard", name: "SMS Live Dashboard", category: "admin", icon: "Smartphone", description: "Live price matrix, crypto payment support, region comparison", operations: ["get_price_matrix", "get_free_providers", "get_live_status"], plan_required: "starter" },
  { id: "geo_location", name: "Geo Location Matcher", category: "admin", icon: "Globe", description: "Proxy-country matching and timezone alignment for accounts", operations: ["register_proxy", "register_account", "find_best_proxy"], plan_required: "starter" },
  { id: "activity_pattern", name: "Activity Pattern Scheduler", category: "admin", icon: "Zap", description: "Natural daily activity profiles (morning, night, worker, balanced)", operations: ["generate_profile", "get_suggested_actions"], plan_required: "starter" },
  { id: "anti_pattern", name: "Anti-Pattern Detector", category: "admin", icon: "Shield", description: "Detect and avoid repetitive behavioral patterns across operations", operations: ["check_message", "get_account_report"], plan_required: "starter" },
  { id: "topic_engine", name: "Topic Trends Engine", category: "admin", icon: "Filter", description: "Group topic analysis with crypto/tech/marketing keyword detection", operations: ["analyze_message", "get_chat_topics", "get_trends"], plan_required: "pro" },
  { id: "scheduler", name: "Task Scheduler", category: "admin", icon: "Zap", description: "Schedule periodic module operations and cron task execution", operations: ["add_task", "remove_task", "list_tasks", "get_due_tasks"], plan_required: "pro" },
  { id: "pipeline_executor", name: "Pipeline Workflow Executor", category: "admin", icon: "RefreshCw", description: "Multi-stage workflow execution engine for complex automations", operations: ["create_pipeline", "get_pipeline", "list_pipelines"], plan_required: "pro" },
  { id: "campaign_reporter", name: "Campaign Reporter", category: "admin", icon: "Calculator", description: "Per-campaign event recording and cross-campaign comparison", operations: ["record_event", "generate_report", "compare_campaigns"], plan_required: "pro" },
  { id: "campaign_export", name: "Live Campaign Export", category: "admin", icon: "Database", description: "Mid-campaign progress snapshot with CSV/JSON export", operations: ["export_snapshot", "to_json", "to_csv"], plan_required: "pro" },
  { id: "affiliate_enhanced", name: "Affiliate & Partner Hub", category: "admin", icon: "LucideLink2", description: "4-tier affiliate system with commissions, milestone bonuses, payouts", operations: ["register", "record_sale", "get_partner", "request_payout"], plan_required: "pro" },
  { id: "safety_reporter", name: "Safety Reporter", category: "admin", icon: "ShieldCheck", description: "System-wide incident monitoring and automated safety reports", operations: ["record_incident", "generate_report"], plan_required: "starter" },
  { id: "admin", name: "Admin Tools", category: "admin", icon: "Shield", description: "Create chats/channels, manage permissions and channel admins", operations: ["create_chat", "create_channel", "add_admin", "remove_admin"], plan_required: "starter" },
  { id: "link_checker", name: "Link Checker", category: "admin", icon: "LucideLink2", description: "Check Telegram links, user validity, and group metadata without accounts", operations: ["check_link", "check_channel", "check_user"], plan_required: "starter" },
  { id: "database_tools", name: "Database Tools", category: "admin", icon: "Database", description: "Union, exclude, clean, and validate audience databases", operations: ["union_databases", "exclude_database", "clean_database"], plan_required: "pro" },
  { id: "calculator_reports", name: "Calculator & Reports", category: "admin", icon: "Calculator", description: "ROI calculator, engagement score analytics, summary reports", operations: ["calculate_roi", "calculate_engagement_score", "generate_report"], plan_required: "starter" },
  { id: "global_config", name: "Global Config", category: "admin", icon: "Shield", description: "Proxy, delay, thread, GPT, license, and antivirus settings", operations: ["get_all", "set", "update_section", "check_license"], plan_required: "pro" },
];

const moduleIcons: Record<string, any> = {
  Search, Filter, Globe, ShieldCheck, Phone, UserSearch, Send, Bot, Zap,
  ArrowRightLeft, Eye, MessageSquare, Flag, BookUser, Smartphone, Edit3,
  Users, Shield, UserMinus, Rocket, Heart, LucideLink2, RefreshCw, Bell,
  Database, MousePointerClick, PlusCircle, Calculator, Terminal, Brain, Sparkles,
};

const categoryLabels: Record<string, string> = {
  all: "All Modules",
  account: "Account Operations",
  messaging: "Messaging & Outreach",
  audience: "Audience & Parsing",
  content: "Content & Cloner",
  growth: "Growth & Bots",
  personas: "AI Personas & Memory",
  admin: "Infrastructure & Admin",
};

export default function ModulesPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>(fallbackModules);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/modules/");
        if (!cancelled && res.data?.modules && res.data.modules.length > 0) {
          const formatted = res.data.modules.map((m: any) => ({
            id: m.id,
            name: m.name,
            category: m.category || "account",
            icon: m.icon || "Sparkles",
            description: m.description,
            operations: m.operations || [],
            plan_required: m.tier || "starter",
          }));
          setModules(formatted);
        }
      } catch {
        // fallback active
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const cats = ["all", "account", "messaging", "audience", "content", "growth", "personas", "admin"];
    return cats;
  }, []);

  const filteredModules = useMemo(() => {
    return modules.filter((mod) => {
      const matchesSearch =
        searchQuery === "" ||
        mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === "all" ||
        mod.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [modules, searchQuery, selectedCategory]);

  const getCategoryCount = (cat: string) => {
    if (cat === "all") return modules.length;
    return modules.filter((m) => m.category.toLowerCase() === cat.toLowerCase()).length;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Sliders className="h-6 w-6 text-primary" />
            Telegram Expert Automation Suite (77 Modules)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enterprise MTProto automation modules, AI persona engines, scrapers, and account boosters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === "grid"
                  ? "bg-card text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === "table"
                  ? "bg-card text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all 77 modules by name, keyword, or operation..."
            className="w-full bg-card border border-border rounded-2xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const count = getCategoryCount(cat);
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <span>{categoryLabels[cat] || cat}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                    active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modules List / Grid */}
      {filteredModules.length === 0 ? (
        <div className="py-20 text-center bg-card rounded-2xl border border-dashed border-border p-8 space-y-2">
          <Zap className="h-8 w-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No modules found</h3>
          <p className="text-xs text-muted-foreground">Try refining your search keyword or clearing category filters.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((mod) => {
            const IconComp = moduleIcons[mod.icon] || moduleIcons[mod.id] || Sparkles;
            return (
              <div
                key={mod.id}
                onClick={() => router.push(`/dashboard/modules/${mod.id}`)}
                className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <IconComp className="h-5 w-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-bold text-muted-foreground uppercase border border-border">
                        {mod.category}
                      </span>
                      {mod.plan_required === "pro" && (
                        <span className="px-1.5 py-0.5 rounded-md bg-primary/15 text-primary text-[9px] font-black uppercase border border-primary/30 flex items-center gap-0.5">
                          <Sparkles className="h-2.5 w-2.5" /> PRO
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                      <span>{mod.name}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground font-mono">
                    {mod.operations.length} {mod.operations.length === 1 ? "operation" : "operations"}
                  </span>
                  <span className="font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Open Engine →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
              <tr>
                <th className="py-3 px-4">Module Name</th>
                <th className="py-3 px-4 hidden md:table-cell">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Operations</th>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredModules.map((mod) => {
                const IconComp = moduleIcons[mod.icon] || moduleIcons[mod.id] || Sparkles;
                return (
                  <tr
                    key={mod.id}
                    onClick={() => router.push(`/dashboard/modules/${mod.id}`)}
                    className="hover:bg-secondary/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                          <IconComp className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {mod.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground max-w-sm truncate hidden md:table-cell">
                      {mod.description}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-secondary text-muted-foreground uppercase text-[10px] font-bold border border-border">
                        {mod.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-foreground font-bold">
                      {mod.operations.length}
                    </td>
                    <td className="py-3.5 px-4">
                      {mod.plan_required === "pro" ? (
                        <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-black uppercase border border-primary/30">
                          PRO
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-bold uppercase">
                          BASE
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/modules/${mod.id}`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-[11px] hover:bg-primary/90 transition-all shadow-xs"
                      >
                        Launch
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
