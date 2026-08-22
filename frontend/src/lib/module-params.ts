// param labels + types + enums for dynamic module page forms

export type ParamDef = {
  name: string;
  label: string;
  type: "string" | "number" | "boolean" | "json" | "select" | "file";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  fullWidth?: boolean;
};

export type OpsMap = Record<string, ParamDef[]>;
export type ModMap = Record<string, OpsMap>;

export const MODULE_PARAMS: ModMap = {
  // ── Account Operations ──────────────────────────────────────────────────
  converter: {
    convert_to_tdata: [
      { name: "session_path", label: "Session+JSON Path or ZIP", type: "string", placeholder: "accounts/session_01.session", required: true },
      { name: "output_dir", label: "Output TData Directory", type: "string", placeholder: "tdata_export/", required: true },
      { name: "two_fa_password", label: "2FA Password (if protected)", type: "string" },
    ],
    convert_from_tdata: [
      { name: "tdata_path", label: "TData Source Directory or ZIP", type: "string", placeholder: "tdata_folder/ or archive.zip", required: true },
      { name: "output_dir", label: "Output Session+JSON Directory", type: "string", placeholder: "sessions_export/", required: true },
      { name: "app_version", label: "Target App Version", type: "select", options: ["11.4.2", "11.3.0", "10.9.1", "10.8.0"] },
    ],
    mass_convert: [
      { name: "batch_folder", label: "Batch Source Folder", type: "string", placeholder: "all_accounts/", required: true },
      { name: "format", label: "Conversion Direction", type: "select", options: ["session_to_tdata", "tdata_to_session"], required: true },
      { name: "parallel_workers", label: "Parallel Workers", type: "number", placeholder: "5" },
    ],
  },

  two_way_converter: {
    convert_tdata_to_session: [
      { name: "tdata_path", label: "TData Folder / ZIP", type: "string", placeholder: "tdata_folder/", required: true },
      { name: "export_json", label: "Include Device JSON Fingerprint", type: "boolean" },
    ],
    convert_session_to_tdata: [
      { name: "session_file", label: "Telethon/Pyrogram .session File", type: "string", placeholder: "account.session", required: true },
      { name: "json_params_file", label: "Corresponding .json File", type: "string", placeholder: "account.json" },
    ],
    batch_convert: [
      { name: "source_dir", label: "Source Directory", type: "string", required: true },
      { name: "target_dir", label: "Target Directory", type: "string", required: true },
      { name: "mode", label: "Mode", type: "select", options: ["tdata_to_session", "session_to_tdata"], required: true },
    ],
  },

  booster: {
    start_warmup: [
      { name: "duration_days", label: "Warming Duration (Days)", type: "number", placeholder: "7", required: true },
      { name: "intensity", label: "Maturation Intensity", type: "select", options: ["gentle", "standard", "aggressive"], required: true },
      { name: "enable_stories", label: "Auto-Publish Daily Stories", type: "boolean" },
      { name: "enable_reactions", label: "Auto-React to Group Messages", type: "boolean" },
    ],
    get_progress: [
      { name: "job_id", label: "Warmup Job ID", type: "string", placeholder: "warmup_uuid_here" },
    ],
    run_warmup_cycle: [
      { name: "action_type", label: "Action to Execute", type: "select", options: ["read_dialogs", "browse_channels", "post_reactions", "mutual_p2p_chat"], required: true },
      { name: "partner_account_id", label: "Partner Account ID (for P2P Chat)", type: "string" },
    ],
  },

  registrar: {
    get_phone_number: [
      { name: "provider", label: "SMS Provider", type: "select", options: ["sms-activate", "5sim", "vak-sms", "smspva"], required: true },
      { name: "country", label: "Country Code", type: "select", options: ["US", "UK", "CA", "DE", "BR", "ID", "NG", "IN"], required: true },
      { name: "operator", label: "Carrier Operator", type: "string", placeholder: "any" },
    ],
    register_account: [
      { name: "phone", label: "Phone Number", type: "string", placeholder: "+15551234567", required: true },
      { name: "api_id", label: "API ID", type: "number", placeholder: "2040", required: true },
      { name: "api_hash", label: "API Hash", type: "string", placeholder: "b18441a1ff...", required: true },
      { name: "first_name", label: "First Name", type: "string", placeholder: "Alex" },
      { name: "last_name", label: "Last Name", type: "string", placeholder: "Taylor" },
      { name: "password_2fa", label: "2FA Cloud Password", type: "string", placeholder: "SecurePass2026!" },
    ],
    set_profile: [
      { name: "username", label: "Set @Username", type: "string", placeholder: "new_username" },
      { name: "bio", label: "Bio / About", type: "string", placeholder: "Web3 enthusiast & developer" },
      { name: "avatar_path", label: "Avatar Image Path", type: "string", placeholder: "avatars/photo_01.jpg" },
    ],
  },

  duplicator: {
    duplicate_session: [
      { name: "target_device", label: "Emulated Device Model", type: "select", options: ["Samsung Galaxy S24 Ultra", "Google Pixel 8 Pro", "Xiaomi 14 Pro", "OnePlus 12"], required: true },
      { name: "keep_original_active", label: "Keep Original Active", type: "boolean" },
    ],
    list_duplicates: [],
  },

  json_generator: {
    generate_json: [
      { name: "device_model", label: "Device Model", type: "select", options: ["Samsung Galaxy S24", "Google Pixel 8", "Xiaomi 14", "OnePlus 12", "iPhone 15 Pro"], required: true },
      { name: "app_version", label: "Telegram App Version", type: "select", options: ["11.4.2", "11.3.0", "10.9.1", "10.8.0"], required: true },
      { name: "system_version", label: "Android OS SDK", type: "select", options: ["SDK 34 (Android 14)", "SDK 33 (Android 13)", "SDK 32 (Android 12)"] },
      { name: "country", label: "Language & Country", type: "select", options: ["en-US", "en-GB", "de-DE", "ru-RU", "pt-BR", "es-ES"] },
    ],
    validate_json: [
      { name: "json_payload", label: "JSON String or Path", type: "string", placeholder: "account.json or raw JSON", required: true },
    ],
    batch_generate: [
      { name: "count", label: "Number of JSON Fingerprints to Generate", type: "number", placeholder: "50", required: true },
      { name: "export_format", label: "Export Format", type: "select", options: ["json_archive", "csv_table"], required: true },
    ],
  },

  spambot_remover: {
    check_spam_status: [],
    submit_appeal: [
      { name: "appeal_reason", label: "Appeal Template", type: "select", options: ["accidental_flag", "never_spammed", "hacked_recovered", "custom"], required: true },
      { name: "custom_message", label: "Custom Message (if custom selected)", type: "string" },
    ],
    remove_restrictions: [
      { name: "auto_respond_dialog", label: "Auto-respond to @SpamBot prompt sequence", type: "boolean" },
    ],
  },

  account_management: {
    mass_inspection: [
      { name: "folder", label: "Folder to Inspect", type: "select", options: ["all", "active", "warming", "spamblock_temp", "frozen"] },
      { name: "auto_move_banned", label: "Auto-move banned to 'perm_ban' folder", type: "boolean" },
    ],
    delete_dialogs: [
      { name: "leave_all_groups", label: "Leave All Chat Groups", type: "boolean" },
      { name: "delete_private_chats", label: "Delete Private Direct Dialogs", type: "boolean" },
    ],
    read_dialogs: [
      { name: "mark_all_read", label: "Mark All Dialogs as Read", type: "boolean" },
    ],
    import_accounts: [
      { name: "import_source", label: "Import Folder Path or ZIP", type: "string", placeholder: "imports/sessions.zip", required: true },
    ],
  },

  number_checker: {
    check_number: [
      { name: "phone_number", label: "Phone Number (+E.164)", type: "string", placeholder: "+15551234567", required: true },
    ],
    check_numbers_batch: [
      { name: "numbers_list", label: "Phone Numbers (One per line)", type: "string", placeholder: "+15551110001\n+15551110002", required: true, fullWidth: true },
    ],
  },

  account_folders: {
    add_account: [
      { name: "phone", label: "Phone Number", type: "string", required: true },
      { name: "folder", label: "Target Folder", type: "select", options: ["active", "warming", "temp_spam", "perm_ban", "frozen", "premium", "archive"] },
    ],
    health_check: [
      { name: "phone", label: "Phone Number", type: "string", required: true },
    ],
    bulk_health_check: [
      { name: "folder", label: "Folder to Check", type: "select", options: ["all", "active", "warming", "temp_spam", "frozen"] },
    ],
    move_to_folder: [
      { name: "target_folder", label: "Destination Folder", type: "select", options: ["active", "warming", "temp_spam", "perm_ban", "frozen", "premium", "archive"], required: true },
    ],
  },

  mass_inspection: {
    check_all_accounts: [
      { name: "timeout_seconds", label: "Per-Account Timeout (s)", type: "number", placeholder: "10" },
      { name: "detect_spambot", label: "Query @SpamBot on each account", type: "boolean" },
    ],
    get_inspection_history: [],
    sort_into_folders: [
      { name: "auto_sort", label: "Automatically sort by health status", type: "boolean" },
    ],
  },

  parameter_generator: {
    generate_beginner: [
      { name: "count", label: "Count", type: "number", placeholder: "10", required: true },
      { name: "preset", label: "Device Preset", type: "select", options: ["Pixel 8 Pro (Global)", "Galaxy S24 (US)", "Xiaomi 14 (EU)", "OnePlus 12 (Asia)"], required: true },
    ],
    generate_professional: [
      { name: "count", label: "Count (Up to 10,000)", type: "number", placeholder: "500", required: true },
      { name: "brand", label: "Device Brand", type: "select", options: ["all", "samsung", "google", "xiaomi", "oneplus", "oppo", "sony"] },
      { name: "lang_pack", label: "Language Profile", type: "select", options: ["en", "de", "es", "fr", "pt", "ru", "id"] },
    ],
  },

  proxy_checker: {
    add_proxy: [
      { name: "proxy_url", label: "Proxy URL (socks5://user:pass@ip:port)", type: "string", placeholder: "socks5://1.2.3.4:1080", required: true },
    ],
    check_proxies: [
      { name: "test_endpoint", label: "Test Target DC", type: "select", options: ["149.154.167.50:443 (DC2 - Europe)", "149.154.175.10:443 (DC1 - US)", "149.154.175.100:443 (DC4 - Europe)"] },
    ],
    get_proxy_pool: [],
  },

  cleanup: {
    get_cleanup_plan: [
      { name: "clear_messages", label: "Clear Saved Messages", type: "boolean" },
      { name: "leave_chats", label: "Leave All Channels & Groups", type: "boolean" },
      { name: "purge_contacts", label: "Delete Contact Book", type: "boolean" },
    ],
    execute_cleanup: [
      { name: "confirm_danger", label: "I understand this deletes dialog history", type: "boolean", required: true },
    ],
  },

  ip_analyzer: {
    register_ip: [
      { name: "ip_address", label: "IP Address", type: "string", placeholder: "185.220.101.5", required: true },
      { name: "account_id", label: "Account ID", type: "string", required: true },
    ],
    find_intersections: [],
    check_account_risk: [
      { name: "account_id", label: "Account ID to check", type: "string", required: true },
    ],
  },

  booster_username_check: {
    check_accounts: [
      { name: "auto_set_random_username", label: "Auto-set random username if missing", type: "boolean" },
    ],
  },

  // ── Messaging & Outreach ───────────────────────────────────────────────
  mass_messaging: {
    send_to_database: [
      { name: "database_path", label: "Audience Target Database", type: "string", placeholder: "Crypto Leads 2026", required: true },
      { name: "text", label: "Message Body (Spintax supported)", type: "string", placeholder: "{Hi|Hello} {there|friend}!", required: true, fullWidth: true },
      { name: "use_spintax", label: "Enable Spintax Engine", type: "boolean" },
    ],
    send_by_id: [
      { name: "user_ids", label: "User IDs (One per line or comma-separated)", type: "string", placeholder: "123456789, 987654321", required: true, fullWidth: true },
      { name: "text", label: "Message Body", type: "string", required: true, fullWidth: true },
    ],
    send_by_numbers: [
      { name: "phone_numbers", label: "Phone Numbers", type: "string", placeholder: "+15551110001\n+15551110002", required: true, fullWidth: true },
      { name: "text", label: "Message Body", type: "string", required: true, fullWidth: true },
    ],
    send_to_contacts: [
      { name: "text", label: "Message Body", type: "string", required: true, fullWidth: true },
    ],
  },

  autoreponder: {
    add_template: [
      { name: "trigger", label: "Trigger Keyword or Phrase", type: "string", placeholder: "price, buy, info, help", required: true },
      { name: "response", label: "Auto-Reply Text (Spintax supported)", type: "string", placeholder: "{Hello|Hi}! Check our catalog at https://...", required: true, fullWidth: true },
      { name: "match_type", label: "Match Mode", type: "select", options: ["contains", "exact", "regex", "ai_intent"], required: true },
      { name: "delay_reply_seconds", label: "Typing Simulation Delay (s)", type: "number", placeholder: "5" },
    ],
    remove_template: [
      { name: "template_id", label: "Template ID", type: "string", required: true },
    ],
    start_monitoring: [
      { name: "reply_limit_per_user", label: "Max Replies Per Contact", type: "number", placeholder: "2" },
    ],
  },

  autoposting: {
    post_to_chats_v1: [
      { name: "chat_ids", label: "Target Chat Links or IDs", type: "string", placeholder: "https://t.me/chat1\nhttps://t.me/chat2", required: true, fullWidth: true },
      { name: "text", label: "Post Message Body", type: "string", placeholder: "Announcement text here...", required: true, fullWidth: true },
      { name: "repeat", label: "Repeat Periodically", type: "boolean" },
      { name: "interval_minutes", label: "Interval Between Posts (Minutes)", type: "number", placeholder: "60" },
    ],
    post_to_chats_v2: [
      { name: "chat_ids", label: "Target Chats", type: "string", required: true, fullWidth: true },
      { name: "text", label: "Post Text", type: "string", required: true, fullWidth: true },
      { name: "media_url", label: "Attached Media / Photo URL", type: "string" },
    ],
    post_to_channels: [
      { name: "channel_id", label: "Channel ID or @Username", type: "string", placeholder: "@my_channel", required: true },
      { name: "text", label: "Broadcast Message", type: "string", required: true, fullWidth: true },
    ],
  },

  stories: {
    publish_story: [
      { name: "media_path", label: "Story Video / Photo File Path", type: "string", placeholder: "media/story_01.mp4", required: true },
      { name: "caption", label: "Story Caption (Optional)", type: "string", placeholder: "Special launch announcement!" },
      { name: "privacy", label: "Story Visibility", type: "select", options: ["everyone", "contacts", "close_friends"] },
      { name: "pinned", label: "Pin Story to Profile", type: "boolean" },
    ],
    delete_story: [
      { name: "story_id", label: "Story ID to delete", type: "number", required: true },
    ],
    export_stories: [],
  },

  reactions: {
    add_reaction: [
      { name: "post_url", label: "Telegram Post URL", type: "string", placeholder: "https://t.me/channel/123", required: true },
      { name: "reaction", label: "Emoji Reaction", type: "select", options: ["👍", "❤️", "🔥", "🎉", "🤩", "⚡️", "👏", "🚀"], required: true },
      { name: "count", label: "Reaction Count", type: "number", placeholder: "50" },
    ],
    remove_reaction: [
      { name: "post_url", label: "Post URL", type: "string", required: true },
    ],
    get_reactions: [
      { name: "post_url", label: "Post URL", type: "string", required: true },
    ],
  },

  message_editor: {
    edit_message: [
      { name: "chat_id", label: "Chat ID", type: "string", required: true },
      { name: "message_id", label: "Message ID", type: "number", required: true },
      { name: "new_text", label: "New Message Text", type: "string", required: true, fullWidth: true },
    ],
    pin_message: [
      { name: "chat_id", label: "Chat ID", type: "string", required: true },
      { name: "message_id", label: "Message ID", type: "number", required: true },
      { name: "notify_members", label: "Notify All Chat Members", type: "boolean" },
    ],
    batch_edit: [
      { name: "chat_id", label: "Chat ID", type: "string", required: true },
      { name: "old_word", label: "Search Word / Link to Replace", type: "string", required: true },
      { name: "new_word", label: "Replacement Word / Link", type: "string", required: true },
    ],
  },

  views_boost: {
    boost_direct_views: [
      { name: "post_url", label: "Post Link", type: "string", placeholder: "https://t.me/channel/100", required: true },
      { name: "count", label: "Target Views Count", type: "number", placeholder: "1000", required: true },
    ],
    boost_post_views: [
      { name: "post_url", label: "Post Link", type: "string", required: true },
      { name: "speed_per_hour", label: "Views Per Hour Rate", type: "number", placeholder: "250" },
    ],
    boost_proxy_views: [
      { name: "post_url", label: "Post Link", type: "string", required: true },
      { name: "count", label: "Views Count", type: "number", placeholder: "500" },
    ],
  },

  channel_comments: {
    post_comments: [
      { name: "chat_id", label: "Channel Broadcast URL", type: "string", placeholder: "https://t.me/channel_name", required: true },
      { name: "comment", label: "Comment Text (Spintax supported)", type: "string", placeholder: "{Great project|Awesome update}! Looking forward to {this|the launch}.", required: true, fullWidth: true },
      { name: "reply_to_latest", label: "Comment on Latest Post Only", type: "boolean" },
    ],
    post_from_account: [
      { name: "post_url", label: "Post URL", type: "string", required: true },
      { name: "comment", label: "Comment Text", type: "string", required: true },
    ],
  },

  postbot: {
    create_posts: [
      { name: "post_text", label: "Post Body (Markdown / HTML)", type: "string", required: true, fullWidth: true },
      { name: "buttons_json", label: "Inline URL Buttons (JSON: [[{'text': 'Website', 'url': 'https://...'}]])", type: "string", fullWidth: true },
      { name: "media_url", label: "Photo / Video Header URL", type: "string" },
    ],
    create_from_account: [
      { name: "channel_id", label: "Channel @Username", type: "string", required: true },
      { name: "text", label: "Text", type: "string", required: true },
    ],
    export_post_ids: [],
  },

  anti_detection: {
    create_behavior_profile: [
      { name: "typing_speed", label: "Typing Simulation Speed", type: "select", options: ["slow (human)", "moderate", "fast (bot-like)"] },
      { name: "action_jitter_pct", label: "Timing Jitter Percentage", type: "number", placeholder: "25" },
    ],
    apply_delay: [
      { name: "min_delay", label: "Min Delay (s)", type: "number", placeholder: "3" },
      { name: "max_delay", label: "Max Delay (s)", type: "number", placeholder: "8" },
    ],
    simulate_human_behavior: [
      { name: "enable_mouse_scrolling", label: "Simulate Dialog Scrolling", type: "boolean" },
      { name: "enable_online_status", label: "Maintain Natural Online Status", type: "boolean" },
    ],
  },

  anomaly_detector: {
    build_baseline: [
      { name: "metric_window_hours", label: "Baseline Window (Hours)", type: "number", placeholder: "24" },
    ],
    check_anomaly: [
      { name: "sensitivity_z_score", label: "Sensitivity (Z-Score Threshold)", type: "number", placeholder: "2.5" },
    ],
    record_event: [
      { name: "event_type", label: "Event Type", type: "string", placeholder: "flood_received" },
    ],
  },

  flood_guard: {
    get_risk: [],
    record_action: [
      { name: "action_name", label: "Action Name", type: "string", placeholder: "send_dm" },
    ],
    record_flood: [
      { name: "wait_seconds", label: "FloodWait Duration (s)", type: "number", placeholder: "300" },
    ],
  },

  // ── Audience & Parsing ──────────────────────────────────────────────────
  invite_modules: {
    invite_by_numbers: [
      { name: "chat_id", label: "Target Group Link or @Username", type: "string", placeholder: "https://t.me/my_community", required: true },
      { name: "phone_numbers", label: "Phone Numbers List (One per line)", type: "string", placeholder: "+15551110001\n+15551110002", required: true, fullWidth: true },
      { name: "limit_per_account", label: "Max Invites Per Account (Telegram Limit: 50/day)", type: "number", placeholder: "30" },
    ],
    invite_by_username: [
      { name: "chat_id", label: "Target Group", type: "string", required: true },
      { name: "usernames", label: "Usernames (@user1\n@user2)", type: "string", required: true, fullWidth: true },
    ],
    invite_by_id: [
      { name: "chat_id", label: "Target Group", type: "string", required: true },
      { name: "user_ids", label: "User IDs (123456789, 987654321)", type: "string", required: true, fullWidth: true },
    ],
    invite_via_admin_v1: [
      { name: "chat_id", label: "Target Group", type: "string", required: true },
      { name: "database_name", label: "Audience Database", type: "string", required: true },
    ],
  },

  audience_collector: {
    collect_from_comments: [
      { name: "chat_id", label: "Channel or Chat Link", type: "string", placeholder: "https://t.me/channel_name", required: true },
      { name: "limit", label: "Max User Limit", type: "number", placeholder: "500" },
      { name: "keywords", label: "Filter Keywords (Comma-separated)", type: "string", placeholder: "crypto, trade, web3" },
    ],
    collect_from_account: [
      { name: "chat_id", label: "Group Link / Username", type: "string", required: true },
      { name: "limit", label: "Max Users", type: "number", placeholder: "1000" },
    ],
    collect_from_replies: [
      { name: "chat_id", label: "Channel Post URL", type: "string", required: true },
    ],
  },

  contact_book: {
    add_contact: [
      { name: "name", label: "Contact Name", type: "string", placeholder: "John Doe", required: true },
      { name: "phone", label: "Phone Number", type: "string", placeholder: "+15551234567", required: true },
    ],
    get_contacts: [],
    export_contacts: [
      { name: "format", label: "Export Format", type: "select", options: ["vcf_vcard", "csv_table", "json"] },
    ],
    delete_contact: [
      { name: "phone", label: "Phone Number to Remove", type: "string", required: true },
    ],
  },

  mass_unsubscriber: {
    unsubscribe_from_channels: [
      { name: "keep_admin_channels", label: "Preserve Channels Where Account is Admin", type: "boolean" },
    ],
    unsubscribe_from_chats: [
      { name: "leave_all", label: "Leave All Groups Immediately", type: "boolean" },
    ],
    leave_all_chats: [],
  },

  gender_detector: {
    detect_gender: [
      { name: "first_name", label: "First Name", type: "string", placeholder: "Sarah", required: true },
      { name: "last_name", label: "Last Name", type: "string", placeholder: "Connor" },
      { name: "username", label: "Telegram Username", type: "string", placeholder: "sarah_c" },
    ],
    batch_detect: [
      { name: "database_path", label: "Target Database to Filter", type: "string", required: true },
      { name: "target_gender", label: "Target Filter", type: "select", options: ["female_only", "male_only", "classified_only"], required: true },
    ],
  },

  mass_subscriptions: {
    subscribe_to_channels: [
      { name: "channels_list", label: "Channel Links (One per line)", type: "string", placeholder: "https://t.me/chan1\nhttps://t.me/chan2", required: true, fullWidth: true },
      { name: "delay_between_subs", label: "Delay Between Joins (s)", type: "number", placeholder: "10" },
    ],
    subscribe_account: [
      { name: "channel_link", label: "Channel Link", type: "string", required: true },
    ],
  },

  open_dialogs: {
    get_all_dialogs: [
      { name: "limit", label: "Max Dialogs to Fetch", type: "number", placeholder: "50" },
    ],
    get_message_history: [
      { name: "chat_id", label: "Chat ID", type: "string", required: true },
      { name: "limit", label: "Message Limit", type: "number", placeholder: "100" },
    ],
    search_messages: [
      { name: "query", label: "Search Query", type: "string", placeholder: "password, api, order", required: true },
    ],
  },

  mass_subscribe_resume: {
    start_batch: [
      { name: "batch_id", label: "Batch Identifier", type: "string", placeholder: "batch_001", required: true },
    ],
    get_batch: [
      { name: "batch_id", label: "Batch Identifier", type: "string", required: true },
    ],
    resume_batch: [
      { name: "batch_id", label: "Batch Identifier", type: "string", required: true },
    ],
  },

  // ── Content & Forwarding ────────────────────────────────────────────────
  cloner: {
    clone_channel: [
      { name: "source_channel", label: "Source Channel (To Clone)", type: "string", placeholder: "https://t.me/original_feed", required: true },
      { name: "target_channel", label: "Destination Channel (Your Channel)", type: "string", placeholder: "https://t.me/my_feed", required: true },
      { name: "message_limit", label: "Post History Limit", type: "number", placeholder: "200" },
      { name: "include_media", label: "Mirror Photos & Videos", type: "boolean" },
      { name: "include_formatting", label: "Preserve Markdown & Links", type: "boolean" },
    ],
    clone_group: [
      { name: "source_group", label: "Source Group", type: "string", required: true },
      { name: "target_group", label: "Target Group", type: "string", required: true },
    ],
    clone_with_progress: [
      { name: "job_id", label: "Resume Cloner Job ID", type: "string" },
    ],
  },

  interceptor: {
    add_keyword: [
      { name: "keyword", label: "Trigger Keyword", type: "string", placeholder: "buy, looking for, recommendation", required: true },
      { name: "forward_to_chat", label: "Forward Captured Leads to Chat", type: "string", placeholder: "https://t.me/crm_leads_chat", required: true },
    ],
    remove_keyword: [
      { name: "keyword", label: "Keyword to Remove", type: "string", required: true },
    ],
    list_keywords: [],
    start_monitoring: [
      { name: "monitored_chats", label: "Monitored Chat Links", type: "string", placeholder: "https://t.me/crypto_chat1\nhttps://t.me/crypto_chat2", fullWidth: true },
    ],
  },

  forwarder: {
    start_forwarding: [
      { name: "crm_chat_id", label: "Central CRM Supergroup Link / ID", type: "string", placeholder: "-1001234567890", required: true },
      { name: "route_replies_back", label: "Enable 2-Way Reply Routing (Reply in CRM sends DM from account)", type: "boolean" },
    ],
    stop_forwarding: [],
    route_reply: [
      { name: "recipient_id", label: "Recipient ID", type: "string", required: true },
      { name: "reply_text", label: "Reply Text", type: "string", required: true, fullWidth: true },
    ],
  },

  forwarder_wizard: {
    start_wizard: [
      { name: "crm_group_name", label: "Name of New CRM Supergroup", type: "string", placeholder: "Telegram Geeks Inbound Leads", required: true },
    ],
    process_step: [
      { name: "step_number", label: "Wizard Step", type: "number", required: true },
    ],
    finalize: [],
  },

  neuro_text: {
    preview_spintax: [
      { name: "template", label: "Spintax Template Text", type: "string", placeholder: "{Hello|Hi|Hey} {friend|mate}, {check this out|take a look}!", required: true, fullWidth: true },
      { name: "samples_count", label: "Number of Variations to Generate", type: "number", placeholder: "5" },
    ],
    generate_with_spintax: [
      { name: "topic", label: "AI Topic Prompt", type: "string", placeholder: "Crypto trading signals promotion", required: true },
      { name: "tone", label: "Tone of Voice", type: "select", options: ["friendly", "professional", "hype", "urgent", "casual"] },
    ],
    neuro_comment: [
      { name: "post_context", label: "Context of Channel Post", type: "string", placeholder: "Bitcoin broke through $100k today...", required: true, fullWidth: true },
      { name: "persona_stance", label: "Comment Stance", type: "select", options: ["bullish", "skeptical", "inquisitive", "supportive"] },
    ],
  },

  soul_prompt: {
    build_soul_prompt: [
      { name: "persona_name", label: "Persona Name", type: "string", placeholder: "CryptoWhale_Alex", required: true },
      { name: "core_archetype", label: "Core Archetype", type: "select", options: ["crypto_trader", "tech_expert", "friendly_assistant", "community_manager"] },
      { name: "tone_modifiers", label: "Tone & Quirks", type: "string", placeholder: "uses emojis, concise, friendly" },
    ],
    build_group_prompt: [
      { name: "group_topic", label: "Group Main Theme", type: "string", placeholder: "Solana DeFi Trading", required: true },
    ],
    merge_prompts: [
      { name: "soul_prompt_id", label: "Soul Prompt ID", type: "string", required: true },
    ],
  },

  // ── Growth & Bots ───────────────────────────────────────────────────────
  bot_creator: {
    create_bot: [
      { name: "bot_name", label: "Bot Display Name", type: "string", placeholder: "Signals Assistant", required: true },
      { name: "bot_username", label: "Bot Username (@...bot)", type: "string", placeholder: "signals_assistant_bot", required: true },
      { name: "description", label: "Bot About Description", type: "string", placeholder: "Automated crypto trading alerts." },
      { name: "commands", label: "Commands (cmd - desc)", type: "string", placeholder: "start - Launch bot\nhelp - View commands", fullWidth: true },
    ],
    set_bot_commands: [
      { name: "bot_token", label: "Bot API Token", type: "string", required: true },
      { name: "commands_list", label: "Commands List", type: "string", required: true, fullWidth: true },
    ],
    set_bot_photo: [
      { name: "bot_token", label: "Bot API Token", type: "string", required: true },
      { name: "photo_path", label: "Photo Path", type: "string", required: true },
    ],
    delete_bot: [
      { name: "bot_username", label: "Bot Username to Delete", type: "string", required: true },
    ],
  },

  referrals: {
    create_referral_link: [
      { name: "bot_username", label: "Target Bot @Username", type: "string", placeholder: "hamster_kombat_bot", required: true },
      { name: "referrer_code", label: "Referral Parameter (start=...)", type: "string", placeholder: "ref_123456", required: true },
      { name: "quantity", label: "Number of Referral Accounts to Send", type: "number", placeholder: "50", required: true },
    ],
    create_mini_app_referral: [
      { name: "app_link", label: "Mini App Shortlink (https://t.me/bot/app?startapp=...)", type: "string", required: true },
      { name: "quantity", label: "Accounts Count", type: "number", placeholder: "25" },
    ],
    get_referral_stats: [],
  },

  reporter: {
    report_user: [
      { name: "target_username", label: "User @Username or ID", type: "string", placeholder: "@scam_user", required: true },
      { name: "reason", label: "Report Reason", type: "select", options: ["spam", "fake", "violence", "pornography", "copyright", "other"], required: true },
    ],
    report_message: [
      { name: "chat_id", label: "Chat Link / ID", type: "string", placeholder: "https://t.me/chat", required: true },
      { name: "message_id", label: "Message ID", type: "number", placeholder: "12345", required: true },
      { name: "reason", label: "Reason", type: "select", options: ["spam", "fake", "violence", "pornography"], required: true },
    ],
    report_channel: [
      { name: "channel_link", label: "Channel Link or @Username", type: "string", placeholder: "https://t.me/channel", required: true },
      { name: "reason", label: "Reason", type: "select", options: ["spam", "fake", "violence", "copyright"], required: true },
    ],
  },

  global_search: {
    search_global: [
      { name: "query", label: "Global Search Query", type: "string", placeholder: "crypto signals, web3, marketing", required: true },
      { name: "limit", label: "Max Results", type: "number", placeholder: "50" },
    ],
    search_users: [
      { name: "query", label: "Username / Name Query", type: "string", required: true },
    ],
    search_channels: [
      { name: "query", label: "Channel Keyword", type: "string", required: true },
    ],
    search_groups: [
      { name: "query", label: "Group Keyword", type: "string", required: true },
    ],
  },

  admin_chat_search: {
    search_admin_chats: [
      { name: "query", label: "Search inside Admin Chats", type: "string", required: true },
    ],
    get_chat_participants: [
      { name: "chat_id", label: "Chat ID", type: "string", required: true },
    ],
  },

  create_chats: {
    create_group: [
      { name: "title", label: "Group Title", type: "string", placeholder: "Crypto VIP Mastermind", required: true },
      { name: "about", label: "Group Description", type: "string", placeholder: "Exclusive discussion group." },
      { name: "is_supergroup", label: "Convert to Supergroup", type: "boolean" },
    ],
    create_channel: [
      { name: "title", label: "Channel Title", type: "string", placeholder: "Alpha Trading Broadcasts", required: true },
      { name: "username", label: "Public @Username (Optional)", type: "string", placeholder: "alpha_broadcasts" },
      { name: "about", label: "About", type: "string" },
    ],
    set_chat_photo: [
      { name: "chat_id", label: "Chat Link / ID", type: "string", required: true },
      { name: "photo_path", label: "Photo Path", type: "string", required: true },
    ],
  },

  marketplace: {
    publish: [
      { name: "template_name", label: "Template Name", type: "string", required: true },
      { name: "category", label: "Category", type: "select", options: ["personas", "prompts", "workflows"], required: true },
      { name: "price_usd", label: "Price (USD, 0 for free)", type: "number", placeholder: "0" },
    ],
    list_templates: [],
    get_template: [
      { name: "template_id", label: "Template ID", type: "string", required: true },
    ],
  },

  // ── AI Personas & Memory ────────────────────────────────────────────────
  persona_manager: {
    add_persona: [
      { name: "name", label: "Persona Name", type: "string", placeholder: "Crypto_Sage", required: true },
      { name: "role", label: "Community Role", type: "select", options: ["Expert Advisor", "Active Trader", "Support Agent", "Casual Enthusiast"], required: true },
      { name: "language", label: "Language", type: "select", options: ["English", "Spanish", "German", "Russian", "Portuguese", "French"] },
      { name: "system_prompt", label: "Core System Prompt", type: "string", placeholder: "You are an experienced crypto trader...", fullWidth: true },
    ],
    generate_post: [
      { name: "topic", label: "Post Topic / News", type: "string", placeholder: "Ethereum layer 2 scaling", required: true, fullWidth: true },
    ],
    generate_reply: [
      { name: "incoming_message", label: "Incoming User Message", type: "string", placeholder: "What do you think about the market today?", required: true, fullWidth: true },
    ],
    find_ppi_target: [
      { name: "chat_id", label: "Chat ID to analyze for conversation opportunities", type: "string", required: true },
    ],
  },

  persona_memory: {
    remember_conversation: [
      { name: "user_id", label: "Target User ID", type: "string", required: true },
      { name: "context_note", label: "Fact or Memory Note", type: "string", placeholder: "User bought 5 SOL at $180", required: true, fullWidth: true },
    ],
    get_context: [
      { name: "user_id", label: "User ID", type: "string", required: true },
    ],
    clear_persona: [],
  },

  persona_analytics: {
    record_event: [
      { name: "event_type", label: "Event Type", type: "select", options: ["reply_sent", "reaction_received", "link_clicked", "lead_converted"] },
    ],
    get_metrics: [],
    get_quality_score: [],
    get_leaderboard: [],
  },

  persona_warmup: {
    start_warmup: [
      { name: "days", label: "Warm-up Days (1-30)", type: "number", placeholder: "14", required: true },
      { name: "initial_phase", label: "Starting Phase", type: "select", options: ["phase_1_lurk", "phase_2_reactions", "phase_3_brief_replies", "phase_4_full_conversation"] },
    ],
    get_progress: [],
    get_phase_summary: [],
  },

  persona_knowledge_base: {
    add_document: [
      { name: "title", label: "Document Title", type: "string", placeholder: "Product FAQ 2026", required: true },
      { name: "content", label: "Knowledge Base Content", type: "string", placeholder: "Detailed product pricing and specifications...", required: true, fullWidth: true },
    ],
    search: [
      { name: "query", label: "Semantic Search Query", type: "string", placeholder: "refund policy", required: true },
    ],
    get_relevant_context: [
      { name: "query", label: "User Query Context", type: "string", required: true },
    ],
  },

  model_routing: {
    route: [
      { name: "preferred_model", label: "Primary Model Provider", type: "select", options: ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet", "deepseek-v3"], required: true },
      { name: "fallback_model", label: "Fallback Provider", type: "select", options: ["gpt-4o-mini", "claude-3-haiku", "deepseek-chat"] },
    ],
    set_persona_provider: [
      { name: "persona_id", label: "Persona ID", type: "string", required: true },
      { name: "provider", label: "Provider", type: "select", options: ["openai", "anthropic", "deepseek"] },
    ],
    get_usage_stats: [],
  },

  persona_templates: {
    export_persona: [
      { name: "persona_id", label: "Persona ID to Export", type: "string", required: true },
    ],
    import_persona: [
      { name: "template_json", label: "Persona JSON Template", type: "string", required: true, fullWidth: true },
    ],
    list_marketplace_templates: [],
  },

  persona_emotions: {
    get_modifiers: [],
    shift_to: [
      { name: "target_emotion", label: "Emotion State", type: "select", options: ["enthusiastic", "analytical", "skeptical", "empathetic", "assertive", "neutral"], required: true },
    ],
    get_state_history: [],
  },

  persona_generator: {
    from_archetype: [
      { name: "archetype", label: "Archetype Profile", type: "select", options: ["crypto_degen", "institutional_analyst", "customer_support", "casual_community_friend"], required: true },
      { name: "name", label: "Persona Display Name", type: "string", placeholder: "Alex Vance" },
    ],
    from_keywords: [
      { name: "keywords", label: "Keywords & Traits", type: "string", placeholder: "sarcastic, web3 builder, polite, witty", required: true, fullWidth: true },
    ],
    list_archetypes: [],
  },

  group_prompt_generator: {
    generate: [
      { name: "group_theme", label: "Group Focus", type: "string", placeholder: "NFT Collectors Lounge", required: true },
      { name: "moderation_rules", label: "Rules & Guardrails", type: "string", placeholder: "No spam, english only, be polite" },
    ],
    list_templates: [],
  },

  persona_ab_test: {
    create_test: [
      { name: "variant_a_prompt", label: "Variant A System Prompt", type: "string", required: true, fullWidth: true },
      { name: "variant_b_prompt", label: "Variant B System Prompt", type: "string", required: true, fullWidth: true },
      { name: "metric", label: "Winning Metric", type: "select", options: ["reply_rate", "sentiment_score", "conversions"], required: true },
    ],
    get_test: [{ name: "test_id", label: "Test ID", type: "string", required: true }],
    list_tests: [],
    declare_winner: [{ name: "test_id", label: "Test ID", type: "string", required: true }],
  },

  // ── Operations & Infrastructure ─────────────────────────────────────────
  sms_hub: {
    list_providers: [],
    get_phone: [
      { name: "provider", label: "Provider", type: "select", options: ["sms-activate", "5sim", "vak-sms", "smspva"], required: true },
      { name: "country", label: "Country Code", type: "string", placeholder: "US", required: true },
    ],
    get_code: [
      { name: "activation_id", label: "Activation Order ID", type: "string", required: true },
    ],
    configure_provider: [
      { name: "provider", label: "Provider", type: "select", options: ["sms-activate", "5sim", "vak-sms", "smspva"], required: true },
      { name: "api_key", label: "API Key", type: "string", required: true },
    ],
  },

  sms_dashboard: {
    get_price_matrix: [
      { name: "service", label: "Service", type: "select", options: ["tg (Telegram)", "wa (WhatsApp)", "tw (Twitter)"] },
    ],
    get_free_providers: [],
    get_live_status: [],
  },

  geo_location: {
    register_proxy: [
      { name: "proxy_str", label: "Proxy Address", type: "string", placeholder: "socks5://1.2.3.4:1080", required: true },
      { name: "country_code", label: "Country Code", type: "string", placeholder: "US", required: true },
    ],
    register_account: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "country_code", label: "Phone Country Code", type: "string", placeholder: "US", required: true },
    ],
    find_best_proxy: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
    ],
  },

  activity_pattern: {
    generate_profile: [
      { name: "profile_type", label: "Activity Profile", type: "select", options: ["early_bird (6am-4pm)", "standard_worker (9am-7pm)", "night_owl (2pm-2am)", "round_the_clock"], required: true },
      { name: "timezone", label: "Timezone", type: "select", options: ["UTC", "America/New_York", "Europe/London", "Europe/Berlin", "Asia/Singapore"] },
    ],
    get_suggested_actions: [],
  },

  anti_pattern: {
    check_message: [
      { name: "message_text", label: "Message Text to Scan", type: "string", required: true, fullWidth: true },
    ],
    get_account_report: [
      { name: "account_id", label: "Account ID", type: "string", required: true },
    ],
  },

  topic_engine: {
    analyze_message: [
      { name: "text", label: "Chat Message Text", type: "string", required: true, fullWidth: true },
    ],
    get_chat_topics: [
      { name: "chat_id", label: "Chat Link / ID", type: "string", required: true },
    ],
    get_trends: [],
  },

  scheduler: {
    add_task: [
      { name: "module_id", label: "Target Module", type: "string", placeholder: "mass_messaging", required: true },
      { name: "cron_expression", label: "Cron Schedule (e.g. 0 */2 * * *)", type: "string", placeholder: "0 */4 * * *", required: true },
      { name: "params_json", label: "Execution Params (JSON)", type: "string", placeholder: "{}" },
    ],
    remove_task: [
      { name: "task_id", label: "Task ID", type: "string", required: true },
    ],
    list_tasks: [],
    get_due_tasks: [],
  },

  pipeline_executor: {
    create_pipeline: [
      { name: "pipeline_name", label: "Pipeline Name", type: "string", placeholder: "Full Lead Acquisition Flow", required: true },
      { name: "steps_json", label: "Workflow Steps (JSON array)", type: "string", placeholder: "[{'step': 'scrape'}, {'step': 'filter'}, {'step': 'dm'}]", required: true, fullWidth: true },
    ],
    get_pipeline: [
      { name: "pipeline_id", label: "Pipeline ID", type: "string", required: true },
    ],
    list_pipelines: [],
  },

  campaign_reporter: {
    record_event: [
      { name: "campaign_id", label: "Campaign ID", type: "string", required: true },
      { name: "event", label: "Event Type", type: "select", options: ["sent", "failed", "reply", "click"] },
    ],
    generate_report: [
      { name: "campaign_id", label: "Campaign ID", type: "string", required: true },
    ],
    compare_campaigns: [
      { name: "campaign_ids", label: "Campaign IDs to Compare (Comma-separated)", type: "string", placeholder: "camp_1, camp_2", required: true },
    ],
  },

  campaign_export: {
    export_snapshot: [
      { name: "campaign_id", label: "Campaign ID", type: "string", required: true },
    ],
    to_json: [{ name: "campaign_id", label: "Campaign ID", type: "string", required: true }],
    to_csv: [{ name: "campaign_id", label: "Campaign ID", type: "string", required: true }],
  },

  affiliate_enhanced: {
    register: [
      { name: "payout_wallet", label: "USDT TRC20 / TON Payout Address", type: "string", required: true },
    ],
    record_sale: [
      { name: "partner_code", label: "Partner Code", type: "string", required: true },
      { name: "amount_usd", label: "Sale Amount ($)", type: "number", required: true },
    ],
    get_partner: [],
    request_payout: [
      { name: "amount", label: "Payout Amount ($)", type: "number", required: true },
    ],
  },

  safety_reporter: {
    record_incident: [
      { name: "incident_type", label: "Incident Type", type: "select", options: ["ban", "flood", "proxy_dead", "auth_fail"] },
      { name: "account_id", label: "Account ID", type: "string", required: true },
      { name: "notes", label: "Notes", type: "string" },
    ],
    generate_report: [],
  },

  admin: {
    create_chat: [
      { name: "title", label: "Chat Group Title", type: "string", required: true },
    ],
    create_channel: [
      { name: "title", label: "Channel Title", type: "string", required: true },
      { name: "username", label: "Public Username (@...)", type: "string" },
    ],
    add_admin: [
      { name: "chat_id", label: "Chat Link / ID", type: "string", required: true },
      { name: "user_id", label: "User @Username or ID", type: "string", required: true },
      { name: "is_anonymous", label: "Remain Anonymous Admin", type: "boolean" },
    ],
    remove_admin: [
      { name: "chat_id", label: "Chat ID", type: "string", required: true },
      { name: "user_id", label: "User ID", type: "string", required: true },
    ],
  },

  link_checker: {
    check_link: [
      { name: "url", label: "Telegram URL / Invite Link", type: "string", placeholder: "https://t.me/+AbCdEfGhIjKl", required: true },
    ],
    check_channel: [
      { name: "chat_id", label: "Channel @Username", type: "string", placeholder: "@telegram", required: true },
    ],
    check_user: [
      { name: "username", label: "Target @Username", type: "string", placeholder: "@durov", required: true },
    ],
  },

  database_tools: {
    union_databases: [
      { name: "database_a", label: "First Audience Database", type: "string", required: true },
      { name: "database_b", label: "Second Audience Database", type: "string", required: true },
      { name: "output_name", label: "Combined Output Database Name", type: "string", required: true },
    ],
    exclude_database: [
      { name: "primary_db", label: "Primary Database", type: "string", required: true },
      { name: "exclude_db", label: "Database of Users to Exclude", type: "string", required: true },
      { name: "output_name", label: "Cleaned Output Database Name", type: "string", required: true },
    ],
    clean_database: [
      { name: "database_name", label: "Database to De-Duplicate & Clean", type: "string", required: true },
      { name: "remove_deleted_accounts", label: "Remove Deleted Accounts", type: "boolean" },
      { name: "remove_bots", label: "Filter Out Bot Accounts", type: "boolean" },
    ],
  },

  calculator_reports: {
    calculate_roi: [
      { name: "messages_sent", label: "Total Messages Sent", type: "number", placeholder: "10000", required: true },
      { name: "conversions", label: "Number of Conversions / Buyers", type: "number", placeholder: "120", required: true },
      { name: "cost_per_account", label: "Cost Per Account ($)", type: "number", placeholder: "0.85", required: true },
      { name: "revenue_per_conversion", label: "Revenue Per Sale ($)", type: "number", placeholder: "49.00", required: true },
    ],
    calculate_engagement_score: [
      { name: "likes", label: "Likes & Reactions Count", type: "number", placeholder: "250" },
      { name: "comments", label: "Comments Count", type: "number", placeholder: "45" },
      { name: "shares", label: "Forwards / Shares", type: "number", placeholder: "30" },
      { name: "total_reach", label: "Total Views / Reach", type: "number", placeholder: "3500", required: true },
    ],
    generate_report: [
      { name: "report_title", label: "Report Title", type: "string", placeholder: "Monthly Growth Summary" },
    ],
  },

  global_config: {
    get_all: [],
    set: [
      { name: "key", label: "Configuration Key", type: "string", required: true },
      { name: "value", label: "Configuration Value", type: "string", required: true },
    ],
    update_section: [
      { name: "section", label: "Section (mtproto, proxies, ai, delays)", type: "select", options: ["mtproto", "proxies", "ai", "delays"] },
    ],
    check_license: [],
  },
};
