"use client";

import { useState, useEffect } from "react";
import { Flag, ArrowLeft, Play, Loader2, AlertTriangle, FileText, Users, ShieldAlert, CheckCircle2 } from "lucide-react";
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

const REPORT_REASONS = [
  { id: "spam", label: "Spam & Unsolicited Ads", icon: ShieldAlert },
  { id: "fake", label: "Scam / Fake Account", icon: AlertTriangle },
  { id: "violence", label: "Violence & Extremism", icon: ShieldAlert },
  { id: "pornography", label: "Pornography", icon: AlertTriangle },
  { id: "impersonation", label: "Impersonation / Phishing", icon: ShieldAlert },
  { id: "copyright", label: "Copyright Infringement", icon: FileText },
];

export default function ReporterPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<(string | number)[]>([]);
  const [chatId, setChatId] = useState("");
  const [messageId, setMessageId] = useState("");
  const [reason, setReason] = useState("spam");
  const [mode, setMode] = useState<"single" | "mass" | "channel">("single");

  // Concurrency & delays
  const [threadCount, setThreadCount] = useState(3);
  const [proxyMode, setProxyMode] = useState("account");
  const [proxyStr, setProxyStr] = useState("");
  const [minDelay, setMinDelay] = useState(4);
  const [maxDelay, setMaxDelay] = useState(12);

  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
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

  async function handleExecute() {
    if (selectedAccounts.length === 0 || !chatId.trim()) {
      setError("Please select reporter accounts and enter a target chat or username");
      return;
    }

    setExecuting(true);
    setError("");
    addLog(`Initiating complaint filing on target ${chatId} (${reason})...`, "info");

    try {
      const r = await api.post("/modules/safety_reporter/execute", {
        operation: mode === "single" ? "report_message" : mode === "mass" ? "mass_report" : "report_channel",
        params: {
          account_ids: selectedAccounts,
          account_id: selectedAccounts[0],
          chat_id: chatId,
          message_id: messageId || undefined,
          reason,
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });

      const res = r.data?.result || r.data;
      addLog(res.message || `Filed ${res.count || selectedAccounts.length} complaint reports successfully`, "success");
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg);
      addLog(`Reporting error: ${msg}`, "error");
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ModuleHeader
        title="Mass Complaint Reporter"
        description="Filing automated Telegram abuse & spam reports with anti-detection IP rotation"
        icon={<Flag className="h-6 w-6" />}
        category="Growth & Bots"
        planRequired="pro"
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
          {/* Target Type Mode */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "single", label: "Single Message", icon: AlertTriangle, desc: "Report individual post ID" },
              { id: "mass", label: "User Account", icon: Users, desc: "Report profile / bot" },
              { id: "channel", label: "Channel / Group", icon: Flag, desc: "Report entire channel" },
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

          {/* Account Picker */}
          <AccountPicker
            accounts={accounts}
            selectedIds={selectedAccounts}
            onSelectionChange={setSelectedAccounts}
            label="Reporting Sender Pool"
          />

          {/* Report Details Form */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                Target Entity & Violation Category
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Target Username / Chat Link <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="@scam_channel or https://t.me/channel"
                  className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {mode === "single" && (
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Message ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={messageId}
                    onChange={(e) => setMessageId(e.target.value)}
                    placeholder="12345"
                    className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              )}

              {/* Violation Reason Cards */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">
                  Violation Category <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setReason(r.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all text-xs font-bold flex items-center gap-2",
                        reason === r.id
                          ? "bg-destructive/10 border-destructive text-destructive shadow-xs"
                          : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <r.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{r.label}</span>
                    </button>
                  ))}
                </div>
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
            buttonText={`Submit ${selectedAccounts.length} Reports`}
          />

          <LogPanel
            entries={logs}
            title="Complaint Submission Stream"
            maxHeight="320px"
            onClear={() => setLogs([])}
          />
        </div>
      </div>

      <CrossLinkFooter
        links={[
          { label: "SpamBot Restriction Remover", href: "/dashboard/modules/spambot-remover" },
          { label: "Global Search", href: "/dashboard/modules/global-search" },
          { label: "Account Folders", href: "/dashboard/modules/account-folders" },
        ]}
      />

      <ModuleFooter manualSlug="reporter" />
    </div>
  );
}
