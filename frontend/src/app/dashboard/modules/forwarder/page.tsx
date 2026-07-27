"use client";

import { useState, useEffect } from "react";
import { ArrowRightLeft, ArrowLeft, Play, Loader2, SwitchCamera, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function ForwarderPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [sourceChat, setSourceChat] = useState("");
  const [targetChat, setTargetChat] = useState("");
  const [direction, setDirection] = useState<"one-way" | "two-way">("one-way");
  const [filterType, setFilterType] = useState<"all" | "keywords" | "media">("all");
  const [keywords, setKeywords] = useState("");
  const [threadCount, setThreadCount] = useState(2);
  const [proxyMode, setProxyMode] = useState("account");
  const [minDelay, setMinDelay] = useState(3);
  const [maxDelay, setMaxDelay] = useState(8);
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
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
    if (!accountId || !sourceChat || !targetChat) { setError("Fill all required fields"); return; }
    setExecuting(true); setError("");
    try {
      addLog(`Starting ${direction} forwarding from ${sourceChat} to ${targetChat}...`);
      const r = await api.post("/modules/forwarder/execute", {
        operation: "start_forwarding",
        params: {
          account_id: accountId,
          source_chat_id: sourceChat,
          target_chat_id: targetChat,
          direction,
          filter_type: filterType,
          keywords: keywords ? keywords.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });
      const res = r.data?.result || r.data;
      addLog(`Forwarding active: ${res.forwarded || 0} messages forwarded`, "success");
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg); addLog(msg, "error");
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
            <ArrowRightLeft className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Forwarder</h1>
            <p className="text-xs text-muted-foreground">Forward messages between chats automatically</p>
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
              { id: "one-way", label: "One Way", icon: ArrowRightLeft },
              { id: "two-way", label: "Two Way", icon: SwitchCamera },
            ].map(m => (
              <button key={m.id} onClick={() => setDirection(m.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${direction === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
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
              <label className="block text-xs text-muted-foreground mb-1">Filter</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value as any)}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="all">All Messages</option>
                <option value="keywords">Keywords</option>
                <option value="media">Media Only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Source Chat ID</label>
              <input type="text" value={sourceChat} onChange={e => setSourceChat(e.target.value)} placeholder="-1001234567890"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Target Chat ID</label>
              <input type="text" value={targetChat} onChange={e => setTargetChat(e.target.value)} placeholder="-1009876543210"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
          </div>

          {filterType === "keywords" && (
            <div className="mt-3">
              <label className="block text-xs text-muted-foreground mb-1">Keywords (comma-separated)</label>
              <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="crypto, nft, trading"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          )}

          <button onClick={handleExecute} disabled={executing || !accountId || !sourceChat || !targetChat}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Starting..." : "Start Forwarding"}
          </button>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <FloodControlPanel minDelay={minDelay} maxDelay={maxDelay} onMinDelayChange={setMinDelay} onMaxDelayChange={setMaxDelay} />

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Interceptor", href: "/modules/interceptor" },
          { label: "Autoposting V1", href: "/modules/autoposting-v1" },
        ]} />

        <ModuleFooter />
      </div>
    </div>
  );
}
