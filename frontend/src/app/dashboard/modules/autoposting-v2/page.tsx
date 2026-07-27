"use client";

import { useState, useEffect } from "react";
import { CalendarClock, ArrowLeft, Play, Loader2, Pause, StopCircle, Clock, List, FileText, Image, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function AutopostingV2Page() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [sourceType, setSourceType] = useState<"text" | "rss" | "file">("text");
  const [content, setContent] = useState("");
  const [rssUrl, setRssUrl] = useState("");
  const [chatIds, setChatIds] = useState("");
  const [interval, setInterval] = useState(120);
  const [threadCount, setThreadCount] = useState(2);
  const [proxyMode, setProxyMode] = useState("account");
  const [minDelay, setMinDelay] = useState(3);
  const [maxDelay, setMaxDelay] = useState(10);
  const [executing, setExecuting] = useState(false);
  const [active, setActive] = useState(false);
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
    if (!accountId) { setError("Select account"); return; }
    if (sourceType === "rss" && !rssUrl) { setError("Enter RSS URL"); return; }
    if (sourceType === "text" && !content) { setError("Enter content"); return; }
    setExecuting(true); setError("");
    try {
      addLog(`Starting autoposting V2 (${sourceType})...`);
      const channels = chatIds.split("\n").map(s => s.trim()).filter(Boolean);
      const r = await api.post("/modules/autoposting/execute", {
        operation: "post_to_chats_v2",
        params: {
          account_id: accountId,
          chat_ids: channels.length > 0 ? channels : undefined,
          source_type: sourceType,
          content: sourceType === "text" ? content : undefined,
          rss_url: sourceType === "rss" ? rssUrl : undefined,
          interval_minutes: interval,
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });
      const res = r.data?.result || r.data;
      addLog(res.message || "Autoposting started", "success");
      setActive(true);
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
            <CalendarClock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Autoposting V2</h1>
            <p className="text-xs text-muted-foreground">Advanced autoposting with RSS, file, and text sources</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        {active && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-300">Autoposting V2 is running</span>
          </div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {[
              { id: "text", label: "Text", icon: FileText },
              { id: "rss", label: "RSS", icon: Globe },
              { id: "file", label: "File", icon: Image },
            ].map(m => (
              <button key={m.id} onClick={() => setSourceType(m.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${sourceType === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
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
              <label className="block text-xs text-muted-foreground mb-1">Interval (min)</label>
              <input type="number" min={5} value={interval} onChange={e => setInterval(parseInt(e.target.value) || 120)}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          {sourceType === "rss" ? (
            <div className="mt-3">
              <label className="block text-xs text-muted-foreground mb-1">RSS Feed URL</label>
              <input type="text" value={rssUrl} onChange={e => setRssUrl(e.target.value)} placeholder="https://example.com/feed.xml"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          ) : (
            <div className="mt-3">
              <label className="block text-xs text-muted-foreground mb-1">{sourceType === "text" ? "Content" : "File Path / URL"}</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
                placeholder={sourceType === "text" ? "Enter your content here..." : "https://example.com/file.pdf"}
                className="w-full bg-secondary border-0 rounded-lg p-3 text-sm text-foreground resize-y outline-none focus:ring-2 focus:ring-primary" />
            </div>
          )}

          <div className="mt-3">
            <label className="block text-xs text-muted-foreground mb-1">Target Channels (one per line)</label>
            <textarea value={chatIds} onChange={e => setChatIds(e.target.value)} rows={3}
              placeholder="-1001234567890&#10;-1009876543210"
              className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono" />
          </div>

          <button onClick={handleExecute} disabled={executing || !accountId}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Starting..." : "Start Autoposting"}
          </button>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <FloodControlPanel minDelay={minDelay} maxDelay={maxDelay} onMinDelayChange={setMinDelay} onMaxDelayChange={setMaxDelay} />

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Autoposting V1", href: "/modules/autoposting-v1" },
          { label: "Forwarder", href: "/modules/forwarder" },
        ]} />

        <ModuleFooter />
      </div>
    </div>
  );
}
