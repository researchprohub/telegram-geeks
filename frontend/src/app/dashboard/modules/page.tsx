"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw, Zap, Bot, Send, Bell, Heart,
  Users, BookUser, UserMinus, UserSearch,
  ArrowRightLeft, Shield, Link2 as LucideLink2,
  Flag, Database, Calculator,
  Search, Filter, Eye, MessageSquare, Terminal, ArrowRight,
  Smartphone, Globe, PlusCircle, MousePointerClick, ShieldCheck, Edit3, Phone, Rocket,
  Cloud, Sparkles,
} from "lucide-react";
const fallbackModules: Module[] = [
  { id: "mass-inspection", name: "Mass Inspection", category: "accounts", icon: "Search", description: "Check all accounts for bans and restrictions", operations: [], plan_required: "starter" },
  { id: "parameter-generator", name: "Parameter Generator", category: "accounts", icon: "Filter", description: "Generate device parameters", operations: [], plan_required: "starter" },
  { id: "web-accounts", name: "Web Accounts", category: "accounts", icon: "Globe", description: "Open accounts in Telegram Web", operations: [], plan_required: "starter" },
  { id: "admin-search", name: "Admin Rights Search", category: "accounts", icon: "ShieldCheck", description: "Find chats and channels with administrator privileges", operations: [], plan_required: "pro" },
  { id: "number-checker", name: "Number Checker", category: "accounts", icon: "Phone", description: "Check if phone numbers are registered on Telegram", operations: [], plan_required: "starter" },
  { id: "audience-collector", name: "Audience Collector", category: "audience", icon: "UserSearch", description: "Scrape members from groups and channels", operations: [], plan_required: "starter" },
  { id: "global-search", name: "Global Search", category: "audience", icon: "Search", description: "Search Telegram for users, groups, channels", operations: [], plan_required: "starter" },
  { id: "gender-detector", name: "Gender Detector", category: "audience", icon: "UserSearch", description: "Determine gender of Telegram users", operations: [], plan_required: "starter" },
  { id: "mass-messaging", name: "Mass Messaging", category: "messaging", icon: "Send", description: "Send bulk messages with spintax", operations: [], plan_required: "starter" },
  { id: "autoresponder", name: "Autoresponder", category: "messaging", icon: "Bot", description: "Auto-reply to incoming messages", operations: [], plan_required: "pro" },
  { id: "autoposting-v1", name: "Autoposting V1", category: "messaging", icon: "Zap", description: "Schedule text posting to chats", operations: [], plan_required: "pro" },
  { id: "autoposting-v2", name: "Autoposting V2", category: "messaging", icon: "Zap", description: "Advanced autoposting with RSS", operations: [], plan_required: "pro" },
  { id: "forwarder", name: "Forwarder", category: "messaging", icon: "ArrowRightLeft", description: "Forward messages between chats", operations: [], plan_required: "pro" },
  { id: "interceptor", name: "Interceptor", category: "messaging", icon: "Eye", description: "Intercept messages by keywords", operations: [], plan_required: "pro" },
  { id: "channel-comments", name: "Channel Comments", category: "messaging", icon: "MessageSquare", description: "Post comments on channel posts", operations: [], plan_required: "starter" },
  { id: "reporter", name: "Reporter", category: "messaging", icon: "Flag", description: "Report users, channels, and bots", operations: [], plan_required: "starter" },
  { id: "postbot", name: "Postbot Creator", category: "messaging", icon: "Bot", description: "Create posts via @postbot", operations: [], plan_required: "starter" },
  { id: "contact-book", name: "Contact Book", category: "messaging", icon: "BookUser", description: "Manage Telegram contacts", operations: [], plan_required: "starter" },
  { id: "sms-sender", name: "SMS Sender (GPT)", category: "messaging", icon: "Smartphone", description: "Send SMS via services with GPT", operations: [], plan_required: "pro" },
  { id: "message-editor", name: "Changing Messages", category: "messaging", icon: "Edit3", description: "Edit or delete messages in chats and channels", operations: [], plan_required: "pro" },
  { id: "open-dialogs", name: "Open Dialogues", category: "messaging", icon: "MessageSquare", description: "View all active conversations for selected accounts", operations: [], plan_required: "starter" },
  { id: "invite-v1", name: "Invite V1", category: "invite", icon: "Users", description: "Invite users by username", operations: [], plan_required: "starter" },
  { id: "add-admins", name: "Add Administrators", category: "invite", icon: "Shield", description: "Grant admin rights to users in your chats and channels", operations: [], plan_required: "pro" },
  { id: "remove-admins", name: "Delete Administrators", category: "invite", icon: "UserMinus", description: "Remove admin privileges from users in chats and channels", operations: [], plan_required: "pro" },
  { id: "invite-v2", name: "Invite V2", category: "invite", icon: "Users", description: "Advanced invite with limits", operations: [], plan_required: "pro" },
  { id: "invite-by-id", name: "Invite by ID", category: "invite", icon: "Users", description: "Invite users by Telegram ID", operations: [], plan_required: "starter" },
  { id: "invite-via-admin-v1", name: "Invite via Admin V1", category: "invite", icon: "Users", description: "Admin-assisted invite by IDs", operations: [], plan_required: "pro" },
  { id: "invite-via-admin-v2", name: "Invite via Admin V2", category: "invite", icon: "Users", description: "Admin-assisted invite with scraping", operations: [], plan_required: "pro" },
  { id: "universal-registrar", name: "Universal Registrar", category: "registration", icon: "Bot", description: "Batch account registration via SMS", operations: [], plan_required: "pro" },
  { id: "manual-registration", name: "Manual Registration", category: "registration", icon: "Bot", description: "Single account registration", operations: [], plan_required: "starter" },
  { id: "views-booster", name: "Views Booster", category: "boost", icon: "Eye", description: "Boost post and channel views", operations: [], plan_required: "starter" },
  { id: "account-booster", name: "Account Booster", category: "boost", icon: "Rocket", description: "Boost members, views, and reactions using your accounts", operations: [], plan_required: "pro" },
  { id: "reactions", name: "Reactions Booster", category: "boost", icon: "Heart", description: "Boost reactions on posts", operations: [], plan_required: "pro" },
  { id: "mass-subscriptions", name: "Mass Subscriptions", category: "boost", icon: "Users", description: "Bulk subscribe to channels", operations: [], plan_required: "starter" },
  { id: "referrals-to-bots", name: "Referrals to Bots", category: "boost", icon: "Link2", description: "Add subscribers to Telegram bots", operations: [], plan_required: "starter" },
  { id: "chat-cloner", name: "Chat Cloner", category: "cloning", icon: "ArrowRightLeft", description: "Clone chat content", operations: [], plan_required: "pro" },
  { id: "channel-cloner", name: "Channel Cloner", category: "cloning", icon: "ArrowRightLeft", description: "Clone channel posts", operations: [], plan_required: "pro" },
  { id: "session-duplicator", name: "Session Duplicator", category: "cloning", icon: "RefreshCw", description: "Duplicate Telegram sessions", operations: [], plan_required: "pro" },
  { id: "stories", name: "Stories", category: "stories", icon: "Bell", description: "Publish, delete, export, comment on stories", operations: [], plan_required: "pro" },
  { id: "proxy-checker", name: "Proxy Checker", category: "tools", icon: "Shield", description: "Test and manage proxy list", operations: [], plan_required: "starter" },
  { id: "database-tools", name: "Database Tools", category: "tools", icon: "Database", description: "Export, import, maintain databases", operations: [], plan_required: "starter" },
  { id: "account-selector", name: "Select Action with Account", category: "tools", icon: "MousePointerClick", description: "Run targeted actions from a single account", operations: [], plan_required: "starter" },
  { id: "account-cleanup", name: "Account Cleanup", category: "tools", icon: "UserMinus", description: "Mass unsubscribe, delete dialogs, lift restrictions", operations: [], plan_required: "starter" },
  { id: "bot-creator", name: "Bot Creator", category: "tools", icon: "Bot", description: "Create and manage Telegram bots", operations: [], plan_required: "starter" },
  { id: "chat-creator", name: "Chat Creator", category: "tools", icon: "PlusCircle", description: "Create new chats, groups, and channels", operations: [], plan_required: "pro" },
  { id: "folder-manager", name: "Folder Manager", category: "tools", icon: "Users", description: "Manage account folders", operations: [], plan_required: "starter" },
  { id: "reports", name: "Reports", category: "tools", icon: "Calculator", description: "Calculator and report generator", operations: [], plan_required: "starter" },
  { id: "console-log", name: "Console Log", category: "tools", icon: "Terminal", description: "View module execution logs", operations: [], plan_required: "starter" },
];

interface Module {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  operations: string[];
  plan_required: string;
}

const planNames: Record<string, string> = {
  starter: "Base",
  pro: "Pro",
};

const moduleIcons: Record<string, any> = {
  "mass-inspection": Search,
  "parameter-generator": Filter,
  "web-accounts": Globe,
  "admin-search": ShieldCheck,
  "number-checker": Phone,
  "audience-collector": UserSearch,
  "global-search": Search,
  "gender-detector": UserSearch,
  "mass-messaging": Send,
  "autoresponder": Bot,
  "autoposting-v1": Zap,
  "autoposting-v2": Zap,
  "forwarder": ArrowRightLeft,
  "interceptor": Eye,
  "channel-comments": MessageSquare,
  "reporter": Flag,
  "postbot": Bot,
  "contact-book": BookUser,
  "sms-sender": Smartphone,
  "message-editor": Edit3,
  "open-dialogs": MessageSquare,
  "invite-v1": Users,
  "invite-v2": Users,
  "invite-by-id": Users,
  "invite-via-admin-v1": Users,
  "invite-via-admin-v2": Users,
  "add-admins": Shield,
  "remove-admins": UserMinus,
  "universal-registrar": Bot,
  "manual-registration": Bot,
  "views-booster": Eye,
  "account-booster": Rocket,
  "reactions": Heart,
  "mass-subscriptions": Users,
  "referrals-to-bots": LucideLink2,
  "chat-cloner": ArrowRightLeft,
  "channel-cloner": ArrowRightLeft,
  "session-duplicator": RefreshCw,
  "stories": Bell,
  "proxy-checker": Shield,
  "database-tools": Database,
  "account-selector": MousePointerClick,
  "account-cleanup": UserMinus,
  "bot-creator": Bot,
  "chat-creator": PlusCircle,
  "folder-manager": Users,
  "reports": Calculator,
  "console-log": Terminal,
};

const PAGE_SIZE = 12;

export default function ModulesPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setModules(fallbackModules);
    setLoading(false);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const categories = ["all", ...new Set(modules.map(m => m.category))];

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || module.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredModules.length / PAGE_SIZE);
  const paginatedModules = filteredModules.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.07] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Modules</h1>
            <p className="text-sm text-slate-400">48 available</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary/50 focus:border-primary/30 outline-none transition-all pl-10"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-primary to-cyan-400 text-white font-semibold shadow-[0_0_14px_-3px_hsl(var(--primary)/0.5)]"
                  : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.05]"
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Module Grid */}
      <div className="px-6 py-6">

        {filteredModules.length === 0 ? (
          <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-12 text-center">
            <Zap className="h-12 w-12 text-slate-500/30 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-2">No modules found</p>
            <p className="text-xs text-slate-500/60">Try a different search or category</p>
          </div>
        ) : (
          <>
            {/* Cards: mobile */}
            <div className="grid grid-cols-2 gap-3 md:hidden">
              {paginatedModules.map(module => {
                const IconComponent = moduleIcons[module.id] || RefreshCw;
                return (
                  <div key={module.id} onClick={() => router.push(`/dashboard/modules/${module.id}`)}
                    className="bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/[0.07] p-4 hover:bg-white/[0.06] transition-all cursor-pointer">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-400/20 flex items-center justify-center mb-2 border border-white/[0.06]">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1 line-clamp-2">{module.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-2">{module.description}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      module.plan_required === "starter"
                        ? "bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_-2px_hsl(187_100%_50%/0.3)]"
                        : "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_8px_-2px_hsl(280_70%_60%/0.3)]"
                    }`}>
                      {module.plan_required === "starter" ? <Cloud className="w-2.5 h-2.5" /> : <Sparkles className="w-2.5 h-2.5" />}
                      {planNames[module.plan_required] || module.plan_required}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Table: desktop */}
            <div className="hidden md:block">
              <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-400 text-xs uppercase tracking-wider">Module</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-400 text-xs uppercase tracking-wider hidden lg:table-cell">Description</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-400 text-xs uppercase tracking-wider">Category</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-400 text-xs uppercase tracking-wider">Plan</th>
                      <th className="w-10 px-5 py-3.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {paginatedModules.map(module => {
                      const IconComponent = moduleIcons[module.id] || RefreshCw;
                      return (
                        <tr key={module.id} onClick={() => router.push(`/dashboard/modules/${module.id}`)}
                          className="hover:bg-white/[0.03] cursor-pointer transition-all group">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/15 to-cyan-400/15 flex items-center justify-center shrink-0 border border-white/[0.05]">
                                <IconComponent className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-medium text-white">{module.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-400 text-xs hidden lg:table-cell max-w-xs truncate">
                            {module.description}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/[0.04] text-slate-400 border border-white/[0.05] capitalize">{module.category}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              module.plan_required === "starter"
                                ? "bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_-2px_hsl(187_100%_50%/0.3)]"
                                : "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_8px_-2px_hsl(280_70%_60%/0.3)]"
                            }`}>
                              {module.plan_required === "starter" ? <Cloud className="w-2.5 h-2.5" /> : <Sparkles className="w-2.5 h-2.5" />}
                              {planNames[module.plan_required] || module.plan_required}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>

        )}

        {totalPages > 1 && (
          <div className="relative flex items-center justify-center mt-8">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-10 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2 relative">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/[0.03] border border-white/[0.07] text-slate-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPage === p
                    ? "bg-primary text-white shadow-[0_0_14px_-3px_hsl(var(--primary)/0.6)] border border-primary/30"
                    : "bg-white/[0.03] border border-white/[0.07] text-slate-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/[0.03] border border-white/[0.07] text-slate-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
            </div>
            <Sparkles className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20 pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
}
