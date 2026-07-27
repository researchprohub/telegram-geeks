"use client";

import { useState, useEffect } from "react";
import { PlusCircle, ArrowLeft, Play, Loader2, Hash, Link, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function MassSubscriptionsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [channelLinks, setChannelLinks] = useState("");
  const [mode, setMode] = useState<"manual" | "auto">("manual");
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
    setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]);
  }

  function toggleAccount(phone: string) {
    setSelectedAccounts(prev => prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]);
  }

  async function handleExecute() {
    if (selectedAccounts.length === 0 || !channelLinks.trim()) { setError("Select accounts and enter channels"); return; }
    setExecuting(true); setError(""); setLog([]);
    try {
      const channels = channelLinks.split("\n").map(s => s.trim()).filter(Boolean);
      addLog(`Subscribing ${selectedAccounts.length} accounts to ${channels.length} channels...`);
      const r = await api.post("/modules/mass_subscriptions/execute", {
        operation: "subscribe_to_channels",
        params: {
          account_phones: selectedAccounts,
          channel_links: channels,
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
          mode,
        },
      });
      const res = r.data?.result || r.data;
      addLog(`Subscribed to ${res.subscribed || "?"} channels`, "success");
      if (res.failed > 0) addLog(`${res.failed} failed`, "warn");
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
            <PlusCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Mass Subscriptions</h1>
            <p className="text-xs text-muted-foreground">Bulk subscribe accounts to Telegram channels</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <FloodControlPanel minDelay={minDelay} maxDelay={maxDelay} onMinDelayChange={setMinDelay} onMaxDelayChange={setMaxDelay} />

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {[
              { id: "manual", label: "Manual", icon: Users },
              { id: "auto", label: "Auto-find", icon: Hash },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-foreground mb-2">Select Accounts</h3>
          <div className="max-h-32 overflow-y-auto space-y-1 mb-3">
            {accounts.map((a: any) => {
              const phone = a.phone_number || a.phone;
              return (
                <label key={a.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-secondary/50">
                  <input type="checkbox" checked={selectedAccounts.includes(phone)} onChange={() => toggleAccount(phone)}
                    className="rounded border-border bg-secondary accent-primary" />
                  <span className="text-sm text-foreground">{phone || `#${a.id}`}</span>
                </label>
              );
            })}
            {accounts.length === 0 && <p className="text-xs text-muted-foreground">No accounts</p>}
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Channel Links (one per line)</label>
            <textarea value={channelLinks} onChange={e => setChannelLinks(e.target.value)} rows={4}
              placeholder="https://t.me/channel1&#10;https://t.me/channel2"
              className="w-full bg-secondary border-0 rounded-lg p-3 text-sm text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono" />
          </div>

          <button onClick={handleExecute} disabled={executing || selectedAccounts.length === 0 || !channelLinks.trim()}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Subscribing..." : "Start Subscription"}
          </button>
        </div>

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Mass Messaging", href: "/modules/mass-messaging" },
          { label: "Autoposting", href: "/modules/autoposting-v1" },
          { label: "Views Booster", href: "/modules/views-booster" },
        ]} />

        <ModuleFooter manualSlug="mass-subscriptions" />
      </div>
    </div>
  );
}
