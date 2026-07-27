import {
  Search, Filter, Globe, ShieldCheck, Phone,
  UserSearch, Send, Bot, Zap, ArrowRightLeft, Eye, MessageSquare, Flag,
  BookUser, Smartphone, Edit3, Users, Shield, UserMinus,
  Rocket, Heart, LucideLink2, RefreshCw, Bell, Database,
  MousePointerClick, PlusCircle, Calculator, Terminal
} from "lucide-react";

export interface Module {
  id: string;
  name: string;
  category: string;
  icon: any;
  description: string;
  plan_required: "starter" | "pro";
}

export const categories = [
  { id: "all", label: "All", labelCn: "全部", labelRu: "Все" },
  { id: "accounts", label: "Accounts", labelCn: "账户", labelRu: "Аккаунты" },
  { id: "audience", label: "Audience", labelCn: "受众", labelRu: "Аудитория" },
  { id: "messaging", label: "Messaging", labelCn: "消息", labelRu: "Сообщения" },
  { id: "invite", label: "Invitations", labelCn: "邀请", labelRu: "Приглашения" },
  { id: "registration", label: "Registration", labelCn: "注册", labelRu: "Регистрация" },
  { id: "boost", label: "Growth", labelCn: "增长", labelRu: "Продвижение" },
  { id: "cloning", label: "Cloning", labelCn: "克隆", labelRu: "Клонирование" },
  { id: "tools", label: "Tools", labelCn: "工具", labelRu: "Инструменты" },
];

export const modules: Module[] = [
  { id: "mass-inspection", name: "Mass Inspection", category: "accounts", icon: Search, description: "Check all accounts for bans and restrictions", plan_required: "starter" },
  { id: "parameter-generator", name: "Parameter Generator", category: "accounts", icon: Filter, description: "Generate device parameters", plan_required: "starter" },
  { id: "web-accounts", name: "Web Accounts", category: "accounts", icon: Globe, description: "Open accounts in Telegram Web", plan_required: "starter" },
  { id: "admin-search", name: "Admin Rights Search", category: "accounts", icon: ShieldCheck, description: "Find chats with admin privileges", plan_required: "pro" },
  { id: "number-checker", name: "Number Checker", category: "accounts", icon: Phone, description: "Check phone registration on Telegram", plan_required: "starter" },
  { id: "audience-collector", name: "Audience Collector", category: "audience", icon: UserSearch, description: "Scrape members from groups and channels", plan_required: "starter" },
  { id: "global-search", name: "Global Search", category: "audience", icon: Search, description: "Search Telegram users, groups, channels", plan_required: "starter" },
  { id: "gender-detector", name: "Gender Detector", category: "audience", icon: UserSearch, description: "Determine gender from profile data", plan_required: "starter" },
  { id: "mass-messaging", name: "Mass Messaging", category: "messaging", icon: Send, description: "Send bulk messages with spintax and variables", plan_required: "starter" },
  { id: "autoresponder", name: "Autoresponder", category: "messaging", icon: Bot, description: "Auto-reply to incoming messages", plan_required: "pro" },
  { id: "autoposting-v1", name: "Autoposting V1", category: "messaging", icon: Zap, description: "Schedule text posting to chats", plan_required: "pro" },
  { id: "autoposting-v2", name: "Autoposting V2", category: "messaging", icon: Zap, description: "Advanced autoposting with RSS", plan_required: "pro" },
  { id: "forwarder", name: "Forwarder", category: "messaging", icon: ArrowRightLeft, description: "Forward messages between chats", plan_required: "pro" },
  { id: "interceptor", name: "Interceptor", category: "messaging", icon: Eye, description: "Intercept messages by keywords", plan_required: "pro" },
  { id: "channel-comments", name: "Channel Comments", category: "messaging", icon: MessageSquare, description: "Post comments on channel posts", plan_required: "starter" },
  { id: "reporter", name: "Reporter", category: "messaging", icon: Flag, description: "Report users, channels, and bots", plan_required: "starter" },
  { id: "postbot", name: "Postbot Creator", category: "messaging", icon: Bot, description: "Create posts via @postbot", plan_required: "starter" },
  { id: "contact-book", name: "Contact Book", category: "messaging", icon: BookUser, description: "Manage Telegram contacts", plan_required: "starter" },
  { id: "sms-sender", name: "SMS Sender (GPT)", category: "messaging", icon: Smartphone, description: "Send SMS via services with GPT", plan_required: "pro" },
  { id: "message-editor", name: "Message Editor", category: "messaging", icon: Edit3, description: "Edit or delete messages in chats", plan_required: "pro" },
  { id: "open-dialogs", name: "Open Dialogues", category: "messaging", icon: MessageSquare, description: "View active conversations", plan_required: "starter" },
  { id: "invite-v1", name: "Invite V1", category: "invite", icon: Users, description: "Invite users by username", plan_required: "starter" },
  { id: "invite-v2", name: "Invite V2", category: "invite", icon: Users, description: "Advanced invite with rate limits", plan_required: "pro" },
  { id: "invite-by-id", name: "Invite by ID", category: "invite", icon: Users, description: "Invite users by Telegram ID", plan_required: "starter" },
  { id: "invite-via-admin-v1", name: "Invite via Admin V1", category: "invite", icon: Users, description: "Admin-assisted invite by IDs", plan_required: "pro" },
  { id: "invite-via-admin-v2", name: "Invite via Admin V2", category: "invite", icon: Users, description: "Admin-assisted invite with scraping", plan_required: "pro" },
  { id: "add-admins", name: "Add Administrators", category: "invite", icon: Shield, description: "Grant admin rights in chats", plan_required: "pro" },
  { id: "remove-admins", name: "Remove Administrators", category: "invite", icon: UserMinus, description: "Remove admin privileges", plan_required: "pro" },
  { id: "universal-registrar", name: "Universal Registrar", category: "registration", icon: Bot, description: "Batch account registration via SMS", plan_required: "pro" },
  { id: "manual-registration", name: "Manual Registration", category: "registration", icon: Bot, description: "Single account registration", plan_required: "starter" },
  { id: "views-booster", name: "Views Booster", category: "boost", icon: Eye, description: "Boost post and channel views", plan_required: "starter" },
  { id: "account-booster", name: "Account Booster", category: "boost", icon: Rocket, description: "Warm up accounts and build trust", plan_required: "pro" },
  { id: "reactions", name: "Reactions Booster", category: "boost", icon: Heart, description: "Boost reactions on posts", plan_required: "pro" },
  { id: "mass-subscriptions", name: "Mass Subscriptions", category: "boost", icon: Users, description: "Bulk subscribe to channels", plan_required: "starter" },
  { id: "referrals-to-bots", name: "Referrals to Bots", category: "boost", icon: LucideLink2, description: "Add subscribers to Telegram bots", plan_required: "starter" },
  { id: "chat-cloner", name: "Chat Cloner", category: "cloning", icon: ArrowRightLeft, description: "Clone entire chat content", plan_required: "pro" },
  { id: "channel-cloner", name: "Channel Cloner", category: "cloning", icon: ArrowRightLeft, description: "Clone channel posts with media", plan_required: "pro" },
  { id: "session-duplicator", name: "Session Duplicator", category: "cloning", icon: RefreshCw, description: "Duplicate Telegram sessions", plan_required: "pro" },
  { id: "proxy-checker", name: "Proxy Checker", category: "tools", icon: Shield, description: "Test and manage proxy lists", plan_required: "starter" },
  { id: "database-tools", name: "Database Tools", category: "tools", icon: Database, description: "Export, import, maintain databases", plan_required: "starter" },
  { id: "account-selector", name: "Account Selector", category: "tools", icon: MousePointerClick, description: "Run targeted actions from one account", plan_required: "starter" },
  { id: "account-cleanup", name: "Account Cleanup", category: "tools", icon: UserMinus, description: "Mass unsubscribe, delete dialogs", plan_required: "starter" },
  { id: "bot-creator", name: "Bot Creator", category: "tools", icon: Bot, description: "Create and manage Telegram bots", plan_required: "starter" },
  { id: "chat-creator", name: "Chat Creator", category: "tools", icon: PlusCircle, description: "Create chats, groups, channels", plan_required: "pro" },
  { id: "folder-manager", name: "Folder Manager", category: "tools", icon: Users, description: "Manage account folders", plan_required: "starter" },
  { id: "reports", name: "Reports", category: "tools", icon: Calculator, description: "Calculator and report generator", plan_required: "starter" },
  { id: "console-log", name: "Console Log", category: "tools", icon: Terminal, description: "View module execution logs", plan_required: "starter" },
  { id: "stories", name: "Stories", category: "tools", icon: Bell, description: "Publish, delete, export stories", plan_required: "pro" }
];
