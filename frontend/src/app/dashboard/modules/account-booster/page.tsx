"use client";

import { useState, useEffect } from "react";
import { Rocket, ArrowLeft, Loader2, Users, Zap, Target, Activity, Flame, Eye, Heart, Sparkles, CheckCircle2 } from "lucide-react";
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

const boosterModes = [
  { id: "members", label: "Mass Subscriptions", icon: Users, desc: "Join channels & groups" },
  { id: "views", label: "Views Booster", icon: Eye, desc: "Simulate organic post views" },
  { id: "reactions", label: "Reactions Wave", icon: Heart, desc: "Deploy emoji reactions" },
  { id: "warmup", label: "7-Day Warm-up", icon: Flame, desc: "Autonomous maturation cycle" },
];

export default function AccountBoosterPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<(string | number)[]>([]);
  const [mode, setMode] = useState("members");
  const [target, setTarget] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [speed, setSpeed] = useState(25);

  // Concurrency & delays
  const [threadCount, setThreadCount] = useState(5);
  const [proxyMode, setProxyMode] = useState("account");
  const [proxyStr, setProxyStr] = useState("");
  const [minDelay, setMinDelay] = useState(3);
  const [maxDelay, setMaxDelay] = useState(8);

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
    if (!target.trim() && mode !== "warmup") {
      setError("Please specify a target Telegram link or channel username");
      return;
    }
    if (selectedAccounts.length === 0) {
      setError("Please select at least one account to execute boost tasks");
      return;
    }

    setExecuting(true);
    setError("");
    addLog(`Initiating ${mode.toUpperCase()} booster on ${target || "account pool"}...`, "info");

    try {
      const r = await api.post("/modules/account_booster/execute", {
        params: {
          mode,
          target: target.trim(),
          quantity,
          speed,
          account_ids: selectedAccounts,
          account_id: selectedAccounts[0],
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });

      addLog(`Account booster operation running: Task dispatched across ${selectedAccounts.length} accounts`, "success");
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg);
      addLog(`Booster error: ${msg}`, "error");
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ModuleHeader
        title="TelegramBooster Account Engine"
        description="Comprehensive account maturation, view amplification, channel subscription waves, and reaction booster"
        icon={<Rocket className="h-6 w-6" />}
        category="Account Operations"
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
          {/* Booster Mode Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {boosterModes.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  mode === m.id
                    ? "bg-primary/10 border-primary shadow-xs"
                    : "bg-secondary/40 border-border hover:bg-secondary"
                )}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <m.icon className={cn("h-4 w-4", mode === m.id ? "text-primary" : "text-muted-foreground")} />
                  <span className={mode === m.id ? "text-primary" : "text-foreground"}>{m.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{m.desc}</p>
              </button>
            ))}
          </div>

          {/* Account Picker */}
          <AccountPicker
            accounts={accounts}
            selectedIds={selectedAccounts}
            onSelectionChange={setSelectedAccounts}
            label="Assigned Worker Accounts"
          />

          {/* Target & Quantity Settings */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Target & Volume Configuration
              </h3>
            </div>

            {mode !== "warmup" && (
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Target Channel / Post Link <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="https://t.me/target_channel or https://t.me/channel/123"
                  className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-foreground">Target Volume</label>
                  <span className="font-mono font-bold text-xs text-primary">{quantity} actions</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={2000}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 100)}
                  className="w-full accent-primary h-2 bg-secondary rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-foreground">Pacing Velocity</label>
                  <span className="font-mono font-bold text-xs text-warning">{speed} actions/hour</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={200}
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value) || 25)}
                  className="w-full accent-warning h-2 bg-secondary rounded-lg cursor-pointer"
                />
              </div>
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

        {/* Right Column: Execution & Stream */}
        <div className="lg:col-span-5 space-y-5">
          <ModuleExecutionCard
            onExecute={handleExecute}
            isExecuting={executing}
            buttonText={`Start ${mode.toUpperCase()} Booster`}
            stats={{
              total: quantity,
              rate: `${speed} /hr`,
            }}
          />

          <LogPanel
            entries={logs}
            title="Booster Execution Terminal"
            maxHeight="320px"
            onClear={() => setLogs([])}
          />
        </div>
      </div>

      <CrossLinkFooter
        links={[
          { label: "Account Folders", href: "/dashboard/modules/account-folders" },
          { label: "Reactions Booster", href: "/dashboard/modules/reactions" },
          { label: "Views Booster", href: "/dashboard/modules/views-booster" },
        ]}
      />

      <ModuleFooter manualSlug="account-booster" />
    </div>
  );
}