"use client";

import { useState, useEffect } from "react";
import { Radio, ArrowLeft, Play, Loader2, Pause, StopCircle, Activity, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function InterceptorPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [chatIds, setChatIds] = useState("");
  const [keywords, setKeywords] = useState("");
  const [mode, setMode] = useState<"all" | "keywords" | "mentions">("all");
  const [threadCount, setThreadCount] = useState(2);
  const [proxyMode, setProxyMode] = useState("account");
  const [minDelay, setMinDelay] = useState(2);
  const [maxDelay, setMaxDelay] = useState(5);
  const [executing, setExecuting] = useState(false);
  const [active, setActive] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [intercepted, setIntercepted] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } })
      .then(r => setAccounts(r.data?.items || r.data || []))
      .catch(() => {});
  }, []);

  function addLog(text: string, level = "info") {
    setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]);
  }

  async function handleExecute() {
    if (!accountId) { setError("Select account"); return; }
    setExecuting(true); setError("");
    try {
      const channels = chatIds.split("\n").map(s => s.trim()).filter(Boolean);
      addLog(`Starting interceptor (${mode})...`);
      const r = await api.post("/modules/interceptor/execute", {
        operation: "start_intercept",
        params: {
          account_id: accountId,
          chat_ids: channels.length > 0 ? channels : undefined,
          mode,
          keywords: keywords ? keywords.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });
      const res = r.data?.result || r.data;
      addLog("Interceptor started", "success");
      setActive(true);
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg); addLog(msg, "error");
    } finally { setExecuting(false); }
  }

  async function handleStop() {
    try {
      await api.post("/modules/interceptor/execute", { operation: "stop_intercept", params: { account_id: accountId } });
      setActive(false);
      addLog("Interceptor stopped", "warn");
    } catch {}
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Radio className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Interceptor</h1>
            <p className="text-xs text-muted-foreground">Monitor chats and intercept messages in real-time</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        {active && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300">Interceptor is running</span>
            </div>
            <button onClick={handleStop} className="flex items-center gap-1 text-xs text-red-500 hover:underline">
              <StopCircle className="h-3.5 w-3.5" /> Stop
            </button>
          </div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {[
              { id: "all", label: "All Messages", icon: MessageCircle },
              { id: "keywords", label: "Keywords", icon: Activity },
              { id: "mentions", label: "Mentions", icon: Radio },
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
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Keywords (comma-separated)</label>
              <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="crypto, airdrop, bonus"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs text-muted-foreground mb-1">Chat IDs to Monitor (one per line, leave empty for all)</label>
            <textarea value={chatIds} onChange={e => setChatIds(e.target.value)} rows={3}
              placeholder="-1001234567890&#10;-1009876543210"
              className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono" />
          </div>

          <div className="flex gap-2 mt-3">
            <button onClick={handleExecute} disabled={executing || !accountId || active}
              className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
              {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {executing ? "Starting..." : "Start Intercept"}
            </button>
            {active && (
              <button onClick={handleStop} className="bg-destructive/10 text-destructive text-xs font-medium px-4 py-2 rounded-lg hover:bg-destructive/20 transition-colors inline-flex items-center gap-1.5">
                <StopCircle className="h-3.5 w-3.5" /> Stop
              </button>
            )}
          </div>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <FloodControlPanel minDelay={minDelay} maxDelay={maxDelay} onMinDelayChange={setMinDelay} onMaxDelayChange={setMaxDelay} />

        <LogPanel entries={log} title="Intercept Log" />

        <CrossLinkFooter links={[
          { label: "Forwarder", href: "/dashboard/modules/forwarder" },
          { label: "Channel Comments", href: "/dashboard/modules/channel-comments" },
        ]} />

        <ModuleFooter />
      </div>
    </div>
  );
}
