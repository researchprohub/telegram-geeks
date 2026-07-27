"use client";

import { useState, useEffect } from "react";
import { CalendarClock, ArrowLeft, Play, Loader2, Pause, StopCircle, Clock, List } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function AutopostingV1Page() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [chatIds, setChatIds] = useState("");
  const [messageText, setMessageText] = useState("");
  const [interval, setInterval] = useState(60);
  const [repeat, setRepeat] = useState(false);
  const [threadCount, setThreadCount] = useState(2);
  const [proxyMode, setProxyMode] = useState("account");
  const [minDelay, setMinDelay] = useState(3);
  const [maxDelay, setMaxDelay] = useState(10);
  const [executing, setExecuting] = useState(false);
  const [active, setActive] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } })
      .then(r => setAccounts(r.data?.items || r.data || []))
      .catch(() => {});
    fetchScheduled();
  }, []);

  function addLog(text: string, level = "info") {
    setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]);
  }

  async function fetchScheduled() {
    try {
      const r = await api.get("/modules/autoposting/scheduled");
      setScheduled(r.data?.tasks || r.data || []);
    } catch {}
  }

  async function handleExecute() {
    if (!accountId || !messageText) { setError("Select account and enter message"); return; }
    setExecuting(true); setError("");
    try {
      addLog("Posting to chats...");
      const channels = chatIds.split("\n").map(s => s.trim()).filter(Boolean);
      const r = await api.post("/modules/autoposting/execute", {
        operation: repeat ? "schedule_posting" : "post_to_chats_v1",
        params: {
          account_id: accountId,
          chat_ids: channels.length > 0 ? channels : undefined,
          text: messageText,
          interval_minutes: interval,
          repeat,
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });
      const res = r.data?.result || r.data;
      addLog(res.message || "Posted successfully", "success");
      if (repeat) { setActive(true); fetchScheduled(); }
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg); addLog(msg, "error");
    } finally { setExecuting(false); }
  }

  async function handleStop() {
    try {
      await api.post("/modules/autoposting/execute", { operation: "stop_schedule", params: {} });
      setActive(false);
      addLog("Autoposting stopped", "warn");
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
            <CalendarClock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Autoposting V1</h1>
            <p className="text-xs text-muted-foreground">Schedule and automate content posting</p>
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
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300">Autoposting is active</span>
            </div>
            <button onClick={handleStop} className="flex items-center gap-1 text-xs text-red-500 hover:underline">
              <StopCircle className="h-3.5 w-3.5" /> Stop
            </button>
          </div>
        )}

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
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">Interval (min)</label>
                <input type="number" min={5} value={interval} onChange={e => setInterval(parseInt(e.target.value) || 60)}
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer pb-1">
                <input type="checkbox" checked={repeat} onChange={e => setRepeat(e.target.checked)}
                  className="rounded border-border bg-secondary accent-primary" />
                <span className="text-xs text-muted-foreground">Repeat</span>
              </label>
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs text-muted-foreground mb-1">Channel IDs / Chat IDs (one per line)</label>
            <textarea value={chatIds} onChange={e => setChatIds(e.target.value)} rows={3}
              placeholder="-1001234567890&#10;-1009876543210"
              className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono" />
          </div>

          <div className="mt-3">
            <label className="block text-xs text-muted-foreground mb-1">Message Text</label>
            <textarea value={messageText} onChange={e => setMessageText(e.target.value)} rows={3}
              placeholder="Enter your message..."
              className="w-full bg-secondary border-0 rounded-lg p-3 text-sm text-foreground resize-y outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <button onClick={handleExecute} disabled={executing || !accountId || !messageText}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : repeat ? <Clock className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Posting..." : repeat ? "Schedule" : "Post Now"}
          </button>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <FloodControlPanel minDelay={minDelay} maxDelay={maxDelay} onMinDelayChange={setMinDelay} onMaxDelayChange={setMaxDelay} />

        {scheduled.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <List className="h-3.5 w-3.5" /> Scheduled Tasks
            </h3>
            <div className="space-y-1">
              {scheduled.map((task: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-1.5 text-xs">
                  <span className="text-foreground">{task.chat_id || task.channel}</span>
                  <span className="text-muted-foreground">{task.next_run || task.scheduled_at || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Autoposting V2", href: "/modules/autoposting-v2" },
          { label: "Mass Subscriptions", href: "/modules/mass-subscriptions" },
          { label: "Forwarder", href: "/modules/forwarder" },
        ]} />

        <ModuleFooter />
      </div>
    </div>
  );
}
