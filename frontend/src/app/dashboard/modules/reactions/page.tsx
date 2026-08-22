"use client";

import { useState, useEffect } from "react";
import { Heart, Play, Loader2, Users, Globe, Sparkles, Flame, CheckCircle2 } from "lucide-react";
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

const REACTION_OPTIONS = [
  { value: "👍", label: "Thumbs Up" },
  { value: "❤️", label: "Heart" },
  { value: "🔥", label: "Fire" },
  { value: "🎉", label: "Party" },
  { value: "🤩", label: "Star Eyes" },
  { value: "⚡️", label: "Lightning" },
  { value: "👏", label: "Applause" },
  { value: "🚀", label: "Rocket" },
];

export default function ReactionsBoosterPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<(string | number)[]>([]);
  const [postUrl, setPostUrl] = useState("");
  const [reactionType, setReactionType] = useState("🔥");
  const [targetCount, setTargetCount] = useState(25);
  const [mode, setMode] = useState<"accounts" | "proxy">("accounts");
  const [proxyList, setProxyList] = useState("");

  // Concurrency & delays
  const [threadCount, setThreadCount] = useState(5);
  const [proxyMode, setProxyMode] = useState("account");
  const [proxyStr, setProxyStr] = useState("");
  const [minDelay, setMinDelay] = useState(2);
  const [maxDelay, setMaxDelay] = useState(6);

  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } })
      .then((r) => {
        const items = r.data?.items || r.data || [];
        setAccounts(items);
        if (items.length > 0) {
          setSelectedAccounts(items.slice(0, 5).map((a: any) => a.id));
        }
      })
      .catch(() => {});
  }, []);

  function addLog(text: string, level: "info" | "success" | "warn" | "error" | "flood" = "info") {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), text, level }]);
  }

  async function handleExecute() {
    if (!postUrl.trim()) {
      setError("Please specify a valid Telegram post URL");
      return;
    }
    if (mode === "accounts" && selectedAccounts.length === 0) {
      setError("Please select at least one account to place reactions");
      return;
    }

    setExecuting(true);
    setError("");
    addLog(`Initiating ${reactionType} reaction booster on ${postUrl}...`, "info");

    try {
      const r = await api.post("/modules/reactions/execute", {
        operation: mode === "accounts" ? "boost_account_reactions" : "boost_proxy_reactions",
        params: {
          post_url: postUrl,
          reaction: reactionType,
          count: targetCount,
          account_ids: mode === "accounts" ? selectedAccounts : undefined,
          account_id: selectedAccounts[0],
          proxy_list: mode === "proxy" ? proxyList.split("\n").map((s) => s.trim()).filter(Boolean) : undefined,
          thread_count: threadCount,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });

      const res = r.data?.result || r.data;
      addLog(`Reactions operation complete: ${res.message || `Boosted ${targetCount} reactions`}`, "success");
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg);
      addLog(`Reactions error: ${msg}`, "error");
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ModuleHeader
        title="Reactions & Engagement Booster"
        description="Boost emoji reactions on Telegram channel broadcasts, chat messages, and discussion threads"
        icon={<Heart className="h-6 w-6" />}
        category="Messaging & Outreach"
        planRequired="starter"
        accountCount={accounts.length}
        status={executing ? "running" : "ready"}
      />

      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-xs font-semibold text-destructive">
          {error}
        </div>
      )}

      {/* Split Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-7 space-y-5">
          {/* Reaction Emoji Palette */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Select Reaction Emoji
              </h3>
              <span className="text-xl font-bold">{reactionType}</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {REACTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReactionType(opt.value)}
                  className={cn(
                    "p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-xl",
                    reactionType === opt.value
                      ? "bg-primary/10 border-primary shadow-xs scale-105"
                      : "bg-secondary/40 border-border hover:bg-secondary"
                  )}
                  title={opt.label}
                >
                  <span>{opt.value}</span>
                  <span className="text-[9px] font-bold text-muted-foreground truncate w-full text-center">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Account Picker */}
          {mode === "accounts" && (
            <AccountPicker
              accounts={accounts}
              selectedIds={selectedAccounts}
              onSelectionChange={setSelectedAccounts}
              label="Reaction Sender Accounts"
            />
          )}

          {/* Target Post & Limits */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Flame className="h-4 w-4 text-warning" />
                Target Post & Quantity
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Telegram Post URL <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                placeholder="https://t.me/channel_name/12345"
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-foreground">Target Reactions Count</label>
                <span className="font-mono font-bold text-xs text-primary">{targetCount} reactions</span>
              </div>
              <input
                type="range"
                min={5}
                max={500}
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value) || 25)}
                className="w-full accent-primary h-2 bg-secondary rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Concurrency & Delays */}
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

        {/* Right Column: Execution & Terminal */}
        <div className="lg:col-span-5 space-y-5">
          <ModuleExecutionCard
            onExecute={handleExecute}
            isExecuting={executing}
            buttonText={`Deploy ${targetCount} ${reactionType} Reactions`}
            stats={{
              total: targetCount,
              rate: executing ? "15 reactions/min" : undefined,
            }}
          />

          <LogPanel
            entries={logs}
            title="Reactions Terminal Log"
            maxHeight="320px"
            onClear={() => setLogs([])}
          />
        </div>
      </div>

      <CrossLinkFooter
        links={[
          { label: "Views Booster", href: "/dashboard/modules/views-booster" },
          { label: "Channel Comments Booster", href: "/dashboard/modules/channel-comments" },
          { label: "Stories Booster", href: "/dashboard/modules/stories" },
        ]}
      />

      <ModuleFooter manualSlug="reactions" />
    </div>
  );
}
