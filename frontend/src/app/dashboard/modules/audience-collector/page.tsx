"use client";

import { useState, useEffect } from "react";
import { UserSearch, ArrowLeft, Play, Loader2, Download, Filter, Hash, MessageCircle, Users, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ModuleHeader } from "@/components/modules/ModuleHeader";
import { AccountPicker, AccountItem } from "@/components/modules/AccountPicker";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel, LogEntry } from "@/components/modules/LogPanel";
import { ModuleExecutionCard } from "@/components/modules/ModuleExecutionCard";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { cn } from "@/lib/utils";

export default function AudienceCollectorPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<(string | number)[]>([]);
  const [source, setSource] = useState<"group" | "comments" | "members">("group");
  const [chatLink, setChatLink] = useState("");
  const [keywords, setKeywords] = useState("");
  const [limit, setLimit] = useState(500);

  // Concurrency & delays
  const [threadCount, setThreadCount] = useState(5);
  const [proxyMode, setProxyMode] = useState("account");
  const [proxyStr, setProxyStr] = useState("");
  const [minDelay, setMinDelay] = useState(2);
  const [maxDelay, setMaxDelay] = useState(6);

  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } })
      .then((r) => {
        const items = r.data?.items || r.data || [];
        setAccounts(items);
        if (items.length > 0) {
          setSelectedAccounts([items[0].id]);
        }
      })
      .catch(() => {});
  }, []);

  function addLog(text: string, level: "info" | "success" | "warn" | "error" | "flood" = "info") {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), text, level }]);
  }

  async function handleExecute() {
    if (selectedAccounts.length === 0 || !chatLink) {
      setError("Please select at least one account and specify a target chat link");
      return;
    }
    setExecuting(true);
    setError("");
    setResults(null);

    addLog(`Initiating ${source.toUpperCase()} audience collection from ${chatLink}...`, "info");
    addLog(`Configured with ${threadCount} workers, Delays: ${minDelay}-${maxDelay}s`, "info");

    try {
      const r = await api.post("/modules/audience_collector/execute", {
        operation:
          source === "group"
            ? "collect_from_group"
            : source === "comments"
            ? "collect_from_comments"
            : "collect_members",
        params: {
          account_id: selectedAccounts[0],
          account_ids: selectedAccounts,
          chat_id: chatLink,
          limit,
          keywords: keywords ? keywords.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });

      const res = r.data?.result || r.data;
      setResults(res);
      const count = res.count || res.users?.length || (Array.isArray(res) ? res.length : 0);
      addLog(`Audience collection complete: Parsed ${count} active user records`, "success");
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg);
      addLog(`Audience collection failed: ${msg}`, "error");
    } finally {
      setExecuting(false);
    }
  }

  function handleExportCsv() {
    const userList = results?.users || (Array.isArray(results) ? results : []);
    if (!userList || userList.length === 0) return;
    const csv =
      "username,id,first_name,phone\n" +
      userList
        .map(
          (u: any) =>
            `"${u.username || ""}","${u.id || ""}","${u.first_name || ""}","${u.phone || ""}"`
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audience_${source}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const collectedUsers = results?.users || (Array.isArray(results) ? results : []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <ModuleHeader
        title="Audience Collector & Scraper"
        description="Extract active members, chat commenters, and reply leads via high-speed MTProto parsers"
        icon={<UserSearch className="h-6 w-6" />}
        category="Audience & Parsing"
        planRequired="starter"
        accountCount={accounts.length}
        status={executing ? "running" : "ready"}
      />

      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-xs font-semibold text-destructive">
          {error}
        </div>
      )}

      {/* Split Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-7 space-y-5">
          {/* Account Selector */}
          <AccountPicker
            accounts={accounts}
            selectedIds={selectedAccounts}
            onSelectionChange={setSelectedAccounts}
            label="Scraper Collector Accounts"
          />

          {/* Collection Strategy & Target Input */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Target Chat & Parsing Strategy
              </h3>
            </div>

            {/* Source Mode Toggle */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "group", label: "Group Members", icon: Users, desc: "Fast participant scrape" },
                { id: "comments", label: "Post Comments", icon: Hash, desc: "Scrapes active commenters" },
                { id: "members", label: "Deep Inspection", icon: UserSearch, desc: "Detailed presence check" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSource(m.id as any)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
                    source === m.id
                      ? "bg-primary/10 border-primary shadow-xs"
                      : "bg-secondary/40 border-border hover:bg-secondary"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <m.icon className={cn("h-4 w-4", source === m.id ? "text-primary" : "text-muted-foreground")} />
                    <span className={source === m.id ? "text-primary" : "text-foreground"}>{m.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{m.desc}</p>
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Target Group / Channel Username or Link <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={chatLink}
                  onChange={(e) => setChatLink(e.target.value)}
                  placeholder="https://t.me/cryptotraders or @cryptotraders"
                  className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Max Lead Limit</label>
                  <input
                    type="number"
                    min={10}
                    max={50000}
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value) || 500)}
                    className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Filter Keywords (Optional)
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="crypto, defi, solana"
                    className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Concurrency & Anti-Flood */}
          <ThreadProxyPanel
            threadCount={threadCount}
            onThreadChange={setThreadCount}
            proxyMode={proxyMode}
            onProxyChange={setProxyMode}
            proxyStr={proxyStr}
            onProxyStrChange={setProxyStr}
          />

          <FloodControlPanel
            minDelay={minDelay}
            maxDelay={maxDelay}
            onMinDelayChange={setMinDelay}
            onMaxDelayChange={setMaxDelay}
          />
        </div>

        {/* Right Column: Execution & Results */}
        <div className="lg:col-span-5 space-y-5">
          <ModuleExecutionCard
            onExecute={handleExecute}
            isExecuting={executing}
            buttonText="Start Audience Scraping"
            hasResults={collectedUsers.length > 0}
            onExportCsv={handleExportCsv}
            stats={{
              total: limit,
              success: collectedUsers.length,
              rate: executing ? "120 users/sec" : undefined,
            }}
          />

          {/* Real-Time Terminal Log */}
          <LogPanel
            entries={logs}
            title="Scraper Stream Terminal"
            maxHeight="280px"
            onClear={() => setLogs([])}
          />

          {/* Results Table Drawer */}
          {results && (
            <div className="bg-card rounded-2xl border border-border p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Parsed Audience ({collectedUsers.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Download className="h-3 w-3" /> Download CSV
                </button>
              </div>

              {collectedUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">
                  No users matched the criteria in the specified channel.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
                      <tr>
                        <th className="py-2 px-3">Username</th>
                        <th className="py-2 px-3">Telegram ID</th>
                        <th className="py-2 px-3">Name / Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {collectedUsers.slice(0, 50).map((u: any, i: number) => (
                        <tr key={i} className="hover:bg-secondary/40 transition-colors">
                          <td className="py-2 px-3 font-bold text-foreground font-mono text-[11px]">
                            {u.username ? `@${u.username}` : "—"}
                          </td>
                          <td className="py-2 px-3 font-mono text-muted-foreground text-[11px]">
                            {u.id || "—"}
                          </td>
                          <td className="py-2 px-3 text-foreground text-[11px]">
                            {u.first_name || u.phone || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cross Links */}
      <CrossLinkFooter
        links={[
          { label: "Mass Messaging Outreach", href: "/dashboard/modules/mass-messaging" },
          { label: "Telegram Inviter Engine", href: "/dashboard/modules/invite-v1" },
          { label: "Channel Cloner", href: "/dashboard/modules/channel-cloner" },
        ]}
      />

      <ModuleFooter manualSlug="audience-collector" />
    </div>
  );
}
