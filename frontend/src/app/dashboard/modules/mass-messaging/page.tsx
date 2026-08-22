"use client";

import { useState, useEffect } from "react";
import { Send, ArrowLeft, Play, Loader2, CheckCircle2, AlertCircle, Users, Database, List, Shuffle, Sparkles, MessageSquare } from "lucide-react";
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

export default function MassMessagingPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<(string | number)[]>([]);
  const [messageText, setMessageText] = useState("");
  const [useSpintax, setUseSpintax] = useState(true);
  const [mode, setMode] = useState<"database" | "list" | "manual">("database");
  const [targetIds, setTargetIds] = useState("");

  // Concurrency & delays
  const [threadCount, setThreadCount] = useState(5);
  const [proxyMode, setProxyMode] = useState("account");
  const [proxyStr, setProxyStr] = useState("");
  const [minDelay, setMinDelay] = useState(5);
  const [maxDelay, setMaxDelay] = useState(15);

  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } })
      .then((r) => {
        const items = r.data?.items || r.data || [];
        setAccounts(items);
        if (items.length > 0) {
          setSelectedAccounts(items.slice(0, 3).map((a: any) => a.id));
        }
      })
      .catch(() => {});
  }, []);

  function addLog(text: string, level: "info" | "success" | "warn" | "error" | "flood" = "info") {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), text, level }]);
  }

  const resolveSampleSpintax = (template: string) => {
    return template.replace(/\{([^{}]+)\}/g, (_, choices) => {
      const arr = choices.split("|");
      return arr[Math.floor(Math.random() * arr.length)];
    });
  };

  async function handleExecute() {
    if (selectedAccounts.length === 0 || !messageText.trim()) {
      setError("Please select at least one sender account and write your message text");
      return;
    }
    setExecuting(true);
    setError("");
    addLog(`Initiating mass messaging outreach across ${selectedAccounts.length} sender accounts...`, "info");

    try {
      const payload: any = {
        operation:
          mode === "database"
            ? "send_to_database"
            : mode === "list"
            ? "send_to_list"
            : "send_to_users",
        params: {
          account_ids: selectedAccounts,
          account_id: selectedAccounts[0],
          text: messageText,
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
          use_spintax: useSpintax,
        },
      };

      if (mode === "database") payload.params.database_path = targetIds || "/default";
      else if (mode === "list") payload.params.user_ids = targetIds.split("\n").map((s) => s.trim()).filter(Boolean);
      else payload.params.phone_numbers = targetIds.split("\n").map((s) => s.trim()).filter(Boolean);

      const r = await api.post("/modules/mass_messaging/execute", payload);
      const res = r.data?.result || r.data;
      const sent = res.sent || res.count || 0;
      const failed = res.failed || 0;
      setStats({ total: sent + failed, success: sent, failed });

      addLog(`Mass messaging finished: ${sent} sent, ${failed} failed`, sent > 0 ? "success" : "warn");
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg);
      addLog(`Outreach error: ${msg}`, "error");
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ModuleHeader
        title="Mass Messaging Outreach"
        description="High-deliverability direct messaging engine with dynamic Spintax, multi-account rotation, and FloodWait evasion"
        icon={<Send className="h-6 w-6" />}
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
          {/* Senders Picker */}
          <AccountPicker
            accounts={accounts}
            selectedIds={selectedAccounts}
            onSelectionChange={setSelectedAccounts}
            label="Sender Rotation Pool"
          />

          {/* Outreach Campaign Setup */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Message Content & Target Audience
              </h3>
            </div>

            {/* Target Audience Mode */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "database", label: "Audience DB", icon: Database, desc: "Saved parsed leads" },
                { id: "list", label: "User ID List", icon: List, desc: "List of @usernames / IDs" },
                { id: "manual", label: "Phone Numbers", icon: Users, desc: "Raw contact list" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id as any)}
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

            {/* Target IDs or Path */}
            {mode !== "database" ? (
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Target Recipient List (One per line)
                </label>
                <textarea
                  value={targetIds}
                  onChange={(e) => setTargetIds(e.target.value)}
                  placeholder={mode === "list" ? "@username1\n@username2\n123456789" : "+15551234567\n+15559876543"}
                  rows={3}
                  className="w-full bg-secondary border border-border rounded-xl p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 resize-y"
                />
              </div>
            ) : null}

            {/* Message Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-foreground">
                  Message Body Text <span className="text-destructive">*</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={useSpintax}
                    onChange={(e) => setUseSpintax(e.target.checked)}
                    className="rounded border-border bg-secondary text-primary accent-primary"
                  />
                  Enable Spintax `{`{Hello|Hi}`}
                </label>
              </div>

              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="{Hello|Hey|Hi} {friend|there}! Check out this exclusive announcement."
                rows={4}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 resize-y"
              />

              {useSpintax && messageText.includes("{") && (
                <div className="mt-2 p-3 rounded-xl bg-secondary/60 border border-border text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-primary flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Live Spintax Preview Sample
                  </span>
                  <p className="text-foreground italic">"{resolveSampleSpintax(messageText)}"</p>
                </div>
              )}
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
            buttonText="Launch Mass Messaging"
            stats={{
              total: stats.total,
              success: stats.success,
              failed: stats.failed,
              rate: executing ? "45 msg/min" : undefined,
            }}
          />

          {/* Terminal */}
          <LogPanel
            entries={logs}
            title="Outreach Stream Terminal"
            maxHeight="320px"
            onClear={() => setLogs([])}
          />
        </div>
      </div>

      <CrossLinkFooter
        links={[
          { label: "Audience Collector", href: "/dashboard/modules/audience-collector" },
          { label: "Autoresponder", href: "/dashboard/modules/autoresponder" },
          { label: "Neuro-Text AI Generator", href: "/dashboard/neuro-text" },
        ]}
      />

      <ModuleFooter manualSlug="mass-messaging" />
    </div>
  );
}
