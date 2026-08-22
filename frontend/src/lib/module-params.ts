// param labels + types + enums for dynamic module page forms

type ParamDef = { name: string; label: string; type: "string" | "number" | "boolean" | "json" | "select"; options?: string[]; required?: boolean };
type OpsMap = Record<string, ParamDef[]>;
type ModMap = Record<string, OpsMap>;

export const MODULE_PARAMS: ModMap = {
  account_folders: {
    health_check: [{ name: "phone", label: "Phone Number", type: "string", required: true }],
    bulk_health_check: [{ name: "account_phones", label: "Account Phones (JSON array)", type: "json" }],
    move_to_folder: [
      { name: "phone", label: "Phone Number", type: "string", required: true },
      { name: "target_folder", label: "Target Folder", type: "select", options: ["Active", "Spamblock", "Frozen", "Archive", "Deleted"], required: true },
    ],
    search_accounts: [{ name: "query", label: "Search Query", type: "string", required: true }],
  },
  anti_detection: {
    create_behavior_profile: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "phone", label: "Phone Number", type: "string" },
    ],
  },
  audience_collector: {
    collect_from_comments: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "chat_id", label: "Chat ID", type: "string", required: true },
      { name: "message_id", label: "Message ID", type: "string" },
      { name: "limit", label: "Limit", type: "number" },
    ],
  },
  autoposting: {
    post_to_chats_v1: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "chat_ids", label: "Chat IDs (JSON array)", type: "json" },
      { name: "text", label: "Message Text", type: "string", required: true },
      { name: "repeat", label: "Repeat", type: "boolean" },
    ],
  },
  autoreponder: {
    add_template: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "trigger", label: "Trigger Keyword", type: "string", required: true },
      { name: "response", label: "Response Text", type: "string", required: true },
      { name: "match_type", label: "Match Type", type: "select", options: ["exact", "contains", "keyword"], required: true },
    ],
  },
  calculator_reports: {
    calculate_roi: [
      { name: "messages_sent", label: "Messages Sent", type: "number", required: true },
      { name: "conversions", label: "Conversions", type: "number", required: true },
      { name: "cost_per_account", label: "Cost Per Account", type: "number", required: true },
      { name: "revenue_per_conversion", label: "Revenue Per Conversion", type: "number", required: true },
    ],
    calculate_engagement_score: [
      { name: "likes", label: "Likes", type: "number" },
      { name: "comments", label: "Comments", type: "number" },
      { name: "shares", label: "Shares", type: "number" },
      { name: "total_reach", label: "Total Reach", type: "number" },
    ],
  },
  channel_comments: {
    post_comments: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "chat_id", label: "Chat ID", type: "string", required: true },
      { name: "comment", label: "Comment Text", type: "string", required: true },
    ],
  },
  contact_book: {
    add_contact: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "name", label: "Contact Name", type: "string", required: true },
      { name: "phone", label: "Phone Number", type: "string", required: true },
    ],
  },
  gender_detector: {
    detect_gender: [
      { name: "first_name", label: "First Name", type: "string", required: true },
      { name: "last_name", label: "Last Name", type: "string" },
      { name: "username", label: "Username", type: "string" },
    ],
  },
  invite_modules: {
    invite_by_numbers: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "chat_id", label: "Chat ID", type: "string", required: true },
      { name: "phone_numbers", label: "Phone Numbers (JSON array)", type: "json", required: true },
    ],
  },
  json_generator: {
    generate_json: [
      { name: "session_string", label: "Session String", type: "string", required: true },
      { name: "api_id", label: "API ID", type: "number", required: true },
      { name: "api_hash", label: "API Hash", type: "string", required: true },
      { name: "phone_number", label: "Phone Number", type: "string", required: true },
      { name: "display_name", label: "Display Name", type: "string" },
    ],
  },
  link_checker: {
    check_link: [{ name: "url", label: "URL / Link", type: "string", required: true }],
    check_channel: [{ name: "chat_id", label: "Chat ID / Username", type: "string", required: true }],
  },
  mass_messaging: {
    send_to_database: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "database_path", label: "Database / File Path", type: "string", required: true },
      { name: "text", label: "Message Text", type: "string", required: true },
      { name: "spin_syntax", label: "Use Spintax", type: "boolean" },
      { name: "style", label: "Style", type: "select", options: ["casual", "professional", "friendly"] },
    ],
  },
  mass_subscriptions: {
    subscribe_to_channels: [
      { name: "account_phones", label: "Account Phones (JSON array)", type: "json", required: true },
      { name: "channel_links", label: "Channel Links (JSON array)", type: "json", required: true },
      { name: "delay_range", label: "Delay Range (JSON [min,max])", type: "json" },
    ],
  },
  mass_unsubscriber: {
    unsubscribe_from_channels: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "channel_ids", label: "Channel IDs (JSON array)", type: "json" },
    ],
  },
  message_editor: {
    edit_message: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "message_id", label: "Message ID", type: "number", required: true },
      { name: "new_text", label: "New Text", type: "string", required: true },
    ],
  },
  number_checker: {
    check_number: [{ name: "phone_number", label: "Phone Number", type: "string", required: true }],
  },
  open_dialogs: {
    get_all_dialogs: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "phone", label: "Phone Number", type: "string" },
    ],
  },
  postbot: {
    create_posts: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "count", label: "Post Count", type: "number" },
    ],
  },
  proxy_checker: {
    add_proxy: [
      { name: "proxy_string", label: "Proxy (ip:port)", type: "string", required: true },
      { name: "proxy_type", label: "Proxy Type", type: "select", options: ["http", "socks5"], required: true },
      { name: "version", label: "Version", type: "select", options: ["ipv4", "ipv6"] },
    ],
    check_proxies: [{ name: "proxy_strings", label: "Proxies (JSON array)", type: "json", required: true }],
  },
  reactions: {
    add_reaction: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "chat_id", label: "Chat ID", type: "string", required: true },
      { name: "target", label: "Message ID / Target", type: "string", required: true },
      { name: "reaction", label: "Reaction Emoji", type: "select", options: ["👍", "❤️", "🔥", "👏", "😂", "💯", "🎉", "😢", "😡", "🤡"], required: true },
    ],
  },
  stories: {
    publish_story: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "target_id", label: "Target Chat ID", type: "string", required: true },
      { name: "media_type", label: "Media Type", type: "select", options: ["text", "photo", "video"] },
      { name: "caption", label: "Caption Text", type: "string" },
    ],
  },
  anomaly_detector: {
    build_baseline: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "hours", label: "Lookback Hours", type: "number" },
    ],
    check_anomaly: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "action", label: "Action", type: "string", required: true },
      { name: "value", label: "Action Value", type: "number" },
    ],
    record_event: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "action", label: "Action", type: "string", required: true },
      { name: "value", label: "Value", type: "number" },
    ],
    get_report: [{ name: "account_id", label: "Account ID", type: "string", required: true }],
  },
  flood_guard: {
    get_risk: [{ name: "account_id", label: "Account ID", type: "string", required: true }],
    record_action: [{ name: "account_id", label: "Account ID", type: "string", required: true }],
    record_flood: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "wait_seconds", label: "Wait Seconds", type: "number", required: true },
    ],
  },
  geo_location: {
    register_proxy: [
      { name: "proxy_string", label: "Proxy (ip:port)", type: "string", required: true },
      { name: "country", label: "Country Code", type: "string", required: true },
      { name: "city", label: "City", type: "string" },
      { name: "isp", label: "ISP", type: "string" },
    ],
    register_account: [
      { name: "phone", label: "Phone Number", type: "string", required: true },
      { name: "country", label: "Country Code", type: "string", required: true },
      { name: "timezone", label: "Timezone", type: "string" },
    ],
    find_best_proxy: [{ name: "phone", label: "Phone Number", type: "string", required: true }],
    get_stats: [],
  },
  activity_pattern: {
    generate_profile: [
      { name: "name", label: "Profile Name", type: "string", required: true },
      { name: "pattern", label: "Pattern", type: "select", options: ["balanced", "morning_person", "night_owl", "worker"], required: true },
    ],
    get_suggested_actions: [
      { name: "profile_name", label: "Profile Name", type: "string" },
      { name: "pattern", label: "Pattern", type: "select", options: ["balanced", "morning_person", "night_owl", "worker"] },
    ],
  },
  cleanup: {
    get_cleanup_plan: [{ name: "phone", label: "Phone Number", type: "string", required: true }],
    execute_cleanup: [
      { name: "phone", label: "Phone Number", type: "string", required: true },
      { name: "steps", label: "Steps (JSON array)", type: "json" },
    ],
    get_history: [{ name: "phone", label: "Phone Number", type: "string" }],
  },
  safety_reporter: {
    record_incident: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "incident_type", label: "Incident Type", type: "string", required: true },
      { name: "details", label: "Details (JSON)", type: "json" },
    ],
    generate_report: [{ name: "scope", label: "Scope", type: "select", options: ["all", "today", "week", "month"] }],
  },
  topic_engine: {
    analyze_message: [
      { name: "chat_id", label: "Chat ID", type: "string", required: true },
      { name: "text", label: "Message Text", type: "string", required: true },
    ],
    get_chat_topics: [
      { name: "chat_id", label: "Chat ID", type: "string", required: true },
      { name: "hours", label: "Hours Lookback", type: "number" },
    ],
    get_trends: [{ name: "hours", label: "Hours Lookback", type: "number" }],
  },
  scheduler: {
    add_task: [
      { name: "task_id", label: "Task ID", type: "string", required: true },
      { name: "operation", label: "Operation", type: "string", required: true },
      { name: "module_id", label: "Module ID", type: "string", required: true },
      { name: "params", label: "Params (JSON)", type: "json" },
      { name: "interval_min", label: "Interval (minutes)", type: "number", required: true },
    ],
    remove_task: [{ name: "task_id", label: "Task ID", type: "string", required: true }],
    list_tasks: [],
    get_due_tasks: [],
    get_stats: [],
  },
  pipeline_executor: {
    create_pipeline: [
      { name: "name", label: "Pipeline Name", type: "string", required: true },
      { name: "stages", label: "Stages (JSON array)", type: "json", required: true },
    ],
    get_pipeline: [{ name: "pipeline_id", label: "Pipeline ID", type: "string", required: true }],
    list_pipelines: [],
    advance_stage: [
      { name: "pipeline_id", label: "Pipeline ID", type: "string", required: true },
      { name: "result", label: "Result (JSON)", type: "json" },
    ],
  },
  anti_pattern: {
    check_message: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "chat_id", label: "Chat ID", type: "string", required: true },
      { name: "text", label: "Message Text", type: "string", required: true },
    ],
    get_account_report: [{ name: "account_id", label: "Account ID", type: "string", required: true }],
  },
  campaign_reporter: {
    record_event: [
      { name: "campaign_id", label: "Campaign ID", type: "string", required: true },
      { name: "event_type", label: "Event Type", type: "string", required: true },
      { name: "details", label: "Details (JSON)", type: "json" },
    ],
    generate_report: [{ name: "campaign_id", label: "Campaign ID", type: "string", required: true }],
    compare_campaigns: [{ name: "campaign_ids", label: "Campaign IDs (JSON array)", type: "json", required: true }],
  },
  views_boost: {
    boost_post_views: [
      { name: "url", label: "Post URL", type: "string", required: true },
      { name: "count", label: "View Count", type: "number", required: true },
    ],
    boost_direct_views: [
      { name: "account_phones", label: "Account Phones (JSON array)", type: "json", required: true },
      { name: "post_urls", label: "Post URLs (JSON array)", type: "json", required: true },
      { name: "views_per_post", label: "Views Per Post", type: "number" },
    ],
    boost_proxy_views: [
      { name: "proxy_list", label: "Proxy List (JSON array)", type: "json" },
      { name: "channel_url", label: "Channel URL", type: "string", required: true },
      { name: "views_per_post", label: "Views Per Post", type: "number" },
    ],
  },
};
