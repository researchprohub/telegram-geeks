"use client";

import { useState, useEffect } from "react";
import { Send, ArrowLeft, Play, Loader2, CheckCircle2, AlertCircle, Users, Database, List, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { RecurringCTA } from "@/components/modules/RecurringCTA";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function MassMessagingPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [useSpintax, setUseSpintax] = useState(false);
  const [mode, setMode] = useState<"database" | "list" | "manual">("database");
  const [targetIds, setTargetIds] = useState("");
  const [spinSyntax, setSpinSyntax] = useState("");
  const [threadCount, setThreadCount] = useState(3);
  const [proxyMode, setProxyMode] = useState("account");
  const [minDelay, setMinDelay] = useState(5);
  const [maxDelay, setMaxDelay] = useState(15);
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } })
      .then(r => setAccounts(r.data?.items || r.data || []))
      .catch(() => {});
  }, []);

  function addLog(text: string, level = "info") {
    const t = new Date().toLocaleTimeString();
    setLog(prev => [...prev, { time: t, text, level }]);
  }

  async function handleExecute() {
    if (!accountId || !messageText) { setError("Select account and enter message"); return; }
    setExecuting(true); setError(""); setLog([]);
    try {
      addLog("Starting mass messaging...");
      const payload: any = {
        operation: mode === "database" ? "send_to_database" : mode === "list" ? "send_to_list" : "send_to_users",
        params: {
          account_id: accountId,
          text: messageText,
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
          use_spintax: useSpintax,
        },
      };
      if (mode === "database") payload.params.database_path = targetIds || "/default";
      else if (mode === "list") payload.params.user_ids = targetIds.split("\n").filter(Boolean);
      else payload.params.phone_numbers = targetIds.split("\n").filter(Boolean);
      if (useSpintax) payload.params.spin_syntax = spinSyntax;

      const r = await api.post("/modules/mass_messaging/execute", payload);
      const res = r.data;
      if (res.status === "success") {
        addLog(`Sent ${res.sent || "?"} messages successfully`, "success");
        if (res.failed > 0) addLog(`${res.failed} failed`, "warn");
      } else {
        addLog(res.message || "Failed", "error");
      }
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg);
      addLog(msg, "error");
    } finally { setExecuting(false); }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Send className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Mass Messaging</h1>
            <p className="text-xs text-muted-foreground">Send bulk messages to databases, lists, or individual users</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {[
              { id: "database", label: "Database", icon: Database },
              { id: "list", label: "User List", icon: List },
              { id: "manual", label: "Manual", icon: Users },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Account</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select account...</option>
                {accounts.map((a: any) => (
                  <option key={a.id} value={a.phone_number || a.phone}>{a.phone_number || a.phone || `#${a.id}`}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={useSpintax} onChange={e => setUseSpintax(e.target.checked)}
                  className="rounded border-border bg-secondary accent-primary" />
                <span className="text-xs text-muted-foreground">Spintax</span>
              </label>
              <Shuffle className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          {useSpintax && (
            <div className="mt-3">
              <label className="block text-xs text-muted-foreground mb-1">Spintax Syntax</label>
              <input type="text" value={spinSyntax} onChange={e => setSpinSyntax(e.target.value)}
                placeholder="{Hi|Hello} {there|friend}! Check this {link|page}: {https://...}"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          )}

          <div className="mt-3">
            <label className="block text-xs text-muted-foreground mb-1">Message Text</label>
            <textarea value={messageText} onChange={e => setMessageText(e.target.value)} rows={4}
              placeholder="Enter your message text..."
              className="w-full bg-secondary border-0 rounded-lg p-3 text-sm text-foreground resize-y outline-none focus:ring-2 focus:ring-primary" />
          </div>

          {mode !== "database" && (
            <div className="mt-3">
              <label className="block text-xs text-muted-foreground mb-1">{mode === "list" ? "User IDs (one per line)" : "Phone Numbers (one per line)"}</label>
              <textarea value={targetIds} onChange={e => setTargetIds(e.target.value)} rows={3}
                placeholder={mode === "list" ? "123456789\n987654321" : "+1234567890\n+9876543210"}
                className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
          )}

          <button onClick={handleExecute} disabled={executing || !accountId || !messageText}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Sending..." : "Start Mass Messaging"}
          </button>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <FloodControlPanel minDelay={minDelay} maxDelay={maxDelay} onMinDelayChange={setMinDelay} onMaxDelayChange={setMaxDelay} />

        <LogPanel entries={log} title="Messaging Log" />

        <RecurringCTA />

        <CrossLinkFooter links={[
          { label: "Audience Collector", href: "/modules/audience-collector" },
          { label: "Mass Subscriptions", href: "/modules/mass-subscriptions" },
          { label: "Invite Module", href: "/modules/invite-v1" },
        ]} />

        <ModuleFooter manualSlug="mass-messaging" />
      </div>
    </div>
  );
}
