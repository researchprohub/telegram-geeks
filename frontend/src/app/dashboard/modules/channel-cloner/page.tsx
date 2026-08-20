"use client";

import { useState, useEffect } from "react";
import { Copy, ArrowLeft, Play, Loader2, Layers, Hash } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function ChannelClonerPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [sourceChannel, setSourceChannel] = useState("");
  const [targetChannel, setTargetChannel] = useState("");
  const [includeMedia, setIncludeMedia] = useState(true);
  const [limit, setLimit] = useState(200);
  const [threadCount, setThreadCount] = useState(2);
  const [proxyMode, setProxyMode] = useState("account");
  const [minDelay, setMinDelay] = useState(2);
  const [maxDelay, setMaxDelay] = useState(6);
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
    if (!accountId || !sourceChannel || !targetChannel) { setError("Fill all fields"); return; }
    setExecuting(true); setError("");
    try {
      addLog(`Cloning channel ${sourceChannel} → ${targetChannel}...`);
      const r = await api.post("/modules/cloner/execute", {
        operation: "clone_channel",
        params: {
          account_id: accountId,
          source_channel: sourceChannel,
          target_channel: targetChannel,
          include_media: includeMedia,
          message_limit: limit,
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });
      const res = r.data?.result || r.data;
      addLog(`Cloned ${res.posts || res.messages || "?"} posts`, "success");
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
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Channel Cloner</h1>
            <p className="text-xs text-muted-foreground">Clone entire channels with media and formatting</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <FloodControlPanel minDelay={minDelay} maxDelay={maxDelay} onMinDelayChange={setMinDelay} onMaxDelayChange={setMaxDelay} />

        <div className="bg-card rounded-xl border border-border p-4">
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
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">Post Limit</label>
                <input type="number" min={10} max={10000} value={limit} onChange={e => setLimit(parseInt(e.target.value) || 200)}
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer pb-1">
                <input type="checkbox" checked={includeMedia} onChange={e => setIncludeMedia(e.target.checked)}
                  className="rounded border-border bg-secondary accent-primary" />
                <span className="text-xs text-muted-foreground">Media</span>
              </label>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Source Channel</label>
              <input type="text" value={sourceChannel} onChange={e => setSourceChannel(e.target.value)} placeholder="@source or https://t.me/source"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Target Channel</label>
              <input type="text" value={targetChannel} onChange={e => setTargetChannel(e.target.value)} placeholder="@target or -100..."
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <button onClick={handleExecute} disabled={executing || !accountId || !sourceChannel || !targetChannel}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Cloning..." : "Clone Channel"}
          </button>
        </div>

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Chat Cloner", href: "/dashboard/modules/chat-cloner" },
          { label: "Autoposting V1", href: "/dashboard/modules/autoposting-v1" },
        ]} />

        <ModuleFooter />
      </div>
    </div>
  );
}
