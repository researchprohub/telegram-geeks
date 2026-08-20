"use client";

import { useState, useEffect } from "react";
import { MessageCircle, ArrowLeft, Play, Square, Loader2, Users, Hash, Clock, ShieldCheck, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function AutoresponderPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [responseText, setResponseText] = useState("");
  const [delay, setDelay] = useState(3);
  const [privateOnly, setPrivateOnly] = useState(true);
  const [ignoreCommands, setIgnoreCommands] = useState(true);
  const [stats] = useState({ total_replied: 0, active_sessions: 0 });
  const [threadCount, setThreadCount] = useState(2);
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

  function toggleAccount(id: string) {
    setSelectedAccounts(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  }

  async function handleToggle() {
    if (enabled) {
      setExecuting(true);
      try {
        const r = await api.post("/modules/autoresponder/stop", { accounts: selectedAccounts });
        addLog("Autoresponder stopped", "success");
        setEnabled(false);
      } catch (e: any) {
        addLog(e.response?.data?.detail || e.message, "error");
      } finally { setExecuting(false); }
      return;
    }

    if (selectedAccounts.length === 0) { setError("Select at least one account"); return; }
    setExecuting(true); setError(""); setLog([]);
    try {
      addLog("Starting autoresponder...");
      const r = await api.post("/modules/autoresponder/start", {
        accounts: selectedAccounts,
        keywords: keywords ? keywords.split(" ").filter(Boolean) : [],
        response_text: responseText,
        delay_seconds: delay,
        private_only: privateOnly,
        ignore_commands: ignoreCommands,
      });
      addLog("Autoresponder started", "success");
      setEnabled(true);
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
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Autoresponder</h1>
            <p className="text-xs text-muted-foreground">Auto-reply to incoming Telegram messages</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Status</h3>
            <button onClick={() => setEnabled(!enabled)}
              className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? "bg-green-500" : "bg-secondary"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          {enabled && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block animate-pulse" /> Running
            </p>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Accounts</h3>
          <div className="flex flex-wrap gap-2">
            {accounts.map((a: any) => {
              const phone = a.phone_number || a.phone || `#${a.id}`;
              const selected = selectedAccounts.includes(phone);
              return (
                <button key={a.id} onClick={() => toggleAccount(phone)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                  <Users className="h-3 w-3 inline mr-1" />{phone}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Keywords (space-separated, empty = reply to all)</label>
              <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="hello help price"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Delay (seconds)</label>
              <input type="number" min={1} value={delay} onChange={e => setDelay(parseInt(e.target.value) || 3)}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs text-muted-foreground mb-1">Response Message <span className="text-muted-foreground/60">(supports spintax: {`{Hi|Hello}`})</span></label>
            <textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={4}
              placeholder="Hi! Thanks for your message. We'll get back to you shortly."
              className="w-full bg-secondary border-0 rounded-lg p-3 text-sm text-foreground resize-y outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="mt-3 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={privateOnly} onChange={e => setPrivateOnly(e.target.checked)}
                className="rounded border-border bg-secondary accent-primary" />
              <span className="text-xs text-muted-foreground">Private chats only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={ignoreCommands} onChange={e => setIgnoreCommands(e.target.checked)}
                className="rounded border-border bg-secondary accent-primary" />
              <span className="text-xs text-muted-foreground">Ignore commands (/...)</span>
            </label>
          </div>

          <button onClick={handleToggle} disabled={executing || (!enabled && selectedAccounts.length === 0)}
            className={`mt-3 text-xs font-medium px-4 py-2 rounded-lg transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5 ${enabled ? "bg-destructive text-destructive-foreground hover:opacity-90" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : enabled ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Processing..." : enabled ? "Stop Autoresponder" : "Start Autoresponder"}
          </button>
        </div>

        {stats.total_replied > 0 || stats.active_sessions > 0 ? (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total Replied</p>
                <p className="text-lg font-bold text-foreground">{stats.total_replied}</p>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Active Sessions</p>
                <p className="text-lg font-bold text-foreground">{stats.active_sessions}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-4 text-center py-6">
            <Terminal className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No stats yet — start the autoresponder to see data</p>
          </div>
        )}

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Interceptor", href: "/dashboard/modules/interceptor" },
          { label: "Forwarder", href: "/dashboard/modules/forwarder" },
          { label: "Mass Messaging", href: "/dashboard/modules/mass-messaging" },
        ]} />

        <ModuleFooter manualSlug="avtootvetchik" />
      </div>
    </div>
  );
}
