import { useState } from "react";
import { modulesApi, detail } from "../lib/api";
import {
  Users,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  MessageCircle,
  Layers,
  FileSpreadsheet,
  Copy,
  Check,
} from "lucide-react";

interface ScrapedUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  status?: string;
  is_premium?: boolean;
  is_bot?: boolean;
}

export default function Scraper() {
  const [activeTab, setActiveTab] = useState<"members" | "comments" | "search" | "cleaner">("members");

  // Tab 1: Member Scraper Form
  const [groupTarget, setGroupTarget] = useState("");
  const [limit, setLimit] = useState(1000);
  const [lastSeenFilter, setLastSeenFilter] = useState("24h");
  const [onlyUsernames, setOnlyUsernames] = useState(true);
  const [excludeBots, setExcludeBots] = useState(true);
  const [onlyPremium, setOnlyPremium] = useState(false);

  // Tab 2: Comments Scraper Form
  const [channelLink, setChannelLink] = useState("");
  const [postsCount, setPostsCount] = useState(10);

  // Tab 3: Global Search Form
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "group" | "channel">("all");

  // Tab 4: Cleaner / Deduplicator
  const [rawAudienceText, setRawAudienceText] = useState("");

  // Results & State
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<ScrapedUser[]>([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const handleRunMemberScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTarget.trim()) {
      setError("Please enter a group username or invite link.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccessMsg("");
    setResults([]);

    try {
      const res = await modulesApi.execute("scraper", "scrape_group_members", {
        group: groupTarget.trim(),
        limit: limit,
        filter_active: lastSeenFilter,
        only_usernames: onlyUsernames,
        exclude_bots: excludeBots,
        only_premium: onlyPremium,
      });

      const d1 = res.data as any;
      const items = d1?.users || d1?.members || (Array.isArray(d1) ? d1 : []);
      setResults(items);
      setSuccessMsg(`Successfully gathered ${items.length} qualified targeted users!`);
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRunCommentScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelLink.trim()) {
      setError("Please enter a channel link.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccessMsg("");
    setResults([]);

    try {
      const res = await modulesApi.execute("comment_scraper", "scrape_comment_authors", {
        channel: channelLink.trim(),
        posts_limit: postsCount,
      });

      const d2 = res.data as any;
      const items = d2?.authors || d2?.users || (Array.isArray(d2) ? d2 : []);
      setResults(items);
      setSuccessMsg(`Extracted ${items.length} active engaged commenters!`);
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRunGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError("Please enter a keyword to search.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await modulesApi.execute("global_search", "search_telegram_entities", {
        query: searchQuery.trim(),
        type: searchType,
      });
      const d3 = res.data as any;
      const items = d3?.results || d3?.chats || (Array.isArray(d3) ? d3 : []);
      setResults(items);
      setSuccessMsg(`Found ${items.length} matching communities for "${searchQuery}"!`);
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDeduplicate = () => {
    const lines = rawAudienceText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const unique = Array.from(new Set(lines));
    setRawAudienceText(unique.join("\n"));
    setSuccessMsg(`Deduplication complete: ${lines.length - unique.length} duplicates removed (${unique.length} unique leads).`);
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;
    const header = "id,username,first_name,last_name,phone,status,is_premium\n";
    const body = results
      .map((u) => `"${u.id}","${u.username || ""}","${u.first_name || ""}","${u.last_name || ""}","${u.phone || ""}","${u.status || ""}","${u.is_premium ? "true" : "false"}"`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `telegram_audience_${Date.now()}.csv`;
    a.click();
  };

  const handleExportUsernames = () => {
    const list = results.map((u) => (u.username ? (u.username.startsWith("@") ? u.username : `@${u.username}`) : u.id)).join("\n");
    navigator.clipboard.writeText(list);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="h-6 w-6 text-primary" />
            Audience Gathering & Scraper Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Collect hyper-targeted Telegram audiences: Group members, active commenters, keyword search & deduplicator.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "members"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Group Members Scraper</span>
        </button>

        <button
          onClick={() => setActiveTab("comments")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "comments"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          <span>Channel Comments Scraper</span>
        </button>

        <button
          onClick={() => setActiveTab("search")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "search"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <Search className="h-4 w-4" />
          <span>Global Telegram Search</span>
        </button>

        <button
          onClick={() => setActiveTab("cleaner")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "cleaner"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <Filter className="h-4 w-4" />
          <span>Lead Cleaner & Deduplicator</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Area (2 cols) */}
        <div className="lg:col-span-2">
          {/* TAB 1: Member Scraper */}
          {activeTab === "members" && (
            <form onSubmit={handleRunMemberScrape} className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-md space-y-5">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">Group Member Extraction</h3>
                <p className="text-xs text-muted-foreground">Extract targeted members from public and private chats with advanced activity filtering.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Target Group (Username or Invite Link)</label>
                  <input
                    type="text"
                    value={groupTarget}
                    onChange={(e) => setGroupTarget(e.target.value)}
                    placeholder="https://t.me/cryptoleads or @group_username"
                    required
                    className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Extraction Limit</label>
                    <input
                      type="number"
                      min={50}
                      max={10000}
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value) || 100)}
                      className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Filter by Last Active</label>
                    <select
                      value={lastSeenFilter}
                      onChange={(e) => setLastSeenFilter(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="24h">Active in Last 24 Hours</option>
                      <option value="3d">Active in Last 3 Days</option>
                      <option value="7d">Active in Last 7 Days</option>
                      <option value="30d">Active in Last 30 Days</option>
                      <option value="all">All Members (No filter)</option>
                    </select>
                  </div>
                </div>

                {/* Filters Checkboxes */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Audience Quality Filters</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onlyUsernames}
                        onChange={(e) => setOnlyUsernames(e.target.checked)}
                        className="h-3.5 w-3.5 accent-primary rounded"
                      />
                      <span>Must Have @Username</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={excludeBots}
                        onChange={(e) => setExcludeBots(e.target.checked)}
                        className="h-3.5 w-3.5 accent-primary rounded"
                      />
                      <span>Exclude Bots & Admins</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onlyPremium}
                        onChange={(e) => setOnlyPremium(e.target.checked)}
                        className="h-3.5 w-3.5 accent-primary rounded"
                      />
                      <span>Telegram Premium Only</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={busy}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  <span>{busy ? "Gathering Audience…" : "Start Scraper"}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Comments Scraper */}
          {activeTab === "comments" && (
            <form onSubmit={handleRunCommentScrape} className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-md space-y-5">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">Channel Comments & Discussion Authors</h3>
                <p className="text-xs text-muted-foreground">Scrape authors of comments from public Telegram channels to target the most engaged potential leads.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Target Channel (Username or Link)</label>
                  <input
                    type="text"
                    value={channelLink}
                    onChange={(e) => setChannelLink(e.target.value)}
                    placeholder="https://t.me/durov or @channel_username"
                    required
                    className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Inspect Latest Posts Count</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={postsCount}
                    onChange={(e) => setPostsCount(Number(e.target.value) || 10)}
                    className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={busy}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{busy ? "Extracting Commenters…" : "Scrape Commenters"}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Global Search */}
          {activeTab === "search" && (
            <form onSubmit={handleRunGlobalSearch} className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-md space-y-5">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">Global Telegram Keyword Search</h3>
                <p className="text-xs text-muted-foreground">Find niche communities, channels, and groups matching target industry keywords.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Search Keyword / Niche</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Solana Trading, E-commerce Germany, Real Estate Dubai"
                    required
                    className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Entity Type</label>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="all">All (Groups & Channels)</option>
                    <option value="group">Supergroups Only</option>
                    <option value="channel">Broadcast Channels Only</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={busy}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  <span>{busy ? "Searching Telegram…" : "Search Communities"}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: Lead Cleaner */}
          {activeTab === "cleaner" && (
            <div className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-md space-y-5">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">Lead Cleaner & Deduplicator</h3>
                <p className="text-xs text-muted-foreground">Paste lists of usernames or IDs from multiple sources to eliminate duplicates and clean formatting.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Raw Usernames / IDs (One per line)</label>
                  <textarea
                    rows={8}
                    value={rawAudienceText}
                    onChange={(e) => setRawAudienceText(e.target.value)}
                    placeholder="@lead1&#10;@lead2&#10;@lead1&#10;123456789"
                    className="w-full rounded-xl border border-border bg-background/80 p-3 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  onClick={handleDeduplicate}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold shadow-md hover:opacity-90 flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  <span>Deduplicate & Clean List</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Results Panel */}
        <div className="rounded-2xl border border-border bg-card/30 p-5 backdrop-blur-md flex flex-col justify-between h-[520px]">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
              <div>
                <span className="text-xs font-bold text-foreground block">Collected Results</span>
                <span className="text-[11px] text-muted-foreground">{results.length} total leads gathered</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleExportUsernames}
                  disabled={results.length === 0}
                  className="p-1.5 rounded-lg border border-border bg-card hover:bg-card/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                  title="Copy Usernames"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={results.length === 0}
                  className="p-1.5 rounded-lg border border-border bg-card hover:bg-card/80 text-primary hover:text-primary transition-colors disabled:opacity-30"
                  title="Export to CSV"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[380px] custom-scrollbar space-y-1.5">
              {results.map((u, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-background/50 border border-border/40 text-xs">
                  <div className="truncate mr-2">
                    <span className="font-semibold text-foreground font-mono">
                      {u.username ? (u.username.startsWith("@") ? u.username : `@${u.username}`) : `ID:${u.id}`}
                    </span>
                    {(u.first_name || u.last_name) && (
                      <span className="text-muted-foreground text-[11px] ml-1.5 truncate">
                        ({u.first_name} {u.last_name})
                      </span>
                    )}
                  </div>
                  {u.is_premium && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-bold shrink-0">
                      ★ Premium
                    </span>
                  )}
                </div>
              ))}

              {results.length === 0 && (
                <div className="text-center py-20 text-muted-foreground text-xs">
                  No scraped items. Select a target and run an audience gathering task.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Ready for Campaign Import</span>
            <span className="text-primary font-medium">{results.length} leads</span>
          </div>
        </div>
      </div>
    </div>
  );
}