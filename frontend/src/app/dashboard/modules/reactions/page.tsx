"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ArrowLeft, Play, Loader2, Users, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

const REACTION_OPTIONS = [
  { value: "👍", label: "Thumbs Up" },
  { value: "❤️", label: "Heart" },
  { value: "🔥", label: "Fire" },
  { value: "😁", label: "Grin" },
  { value: "😢", label: "Cry" },
  { value: "😡", label: "Angry" },
];

export default function ReactionsBoosterPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [postUrl, setPostUrl] = useState("");
  const [reactionType, setReactionType] = useState("👍");
  const [targetCount, setTargetCount] = useState(50);
  const [mode, setMode] = useState<"accounts" | "proxy">("accounts");
  const [proxyList, setProxyList] = useState("");
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

  function toggleAccount(phone: string) {
    setSelectedAccounts(prev => prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]);
  }

  async function handleExecute() {
    if (!postUrl) { setError("Enter post URL"); return; }
    if (mode === "accounts" && selectedAccounts.length === 0) { setError("Select at least one account"); return; }
    setExecuting(true); setError("");
    try {
      addLog(`Boosting ${reactionType} reactions for ${postUrl}...`);
      const r = await api.post("/modules/reactions/execute", {
        operation: mode === "accounts" ? "boost_account_reactions" : "boost_proxy_reactions",
        params: {
          post_url: postUrl,
          reaction: reactionType,
          count: targetCount,
          account_phones: mode === "accounts" ? selectedAccounts : undefined,
          proxy_list: mode === "proxy" ? proxyList.split("\n").map(s => s.trim()).filter(Boolean) : undefined,
          thread_count: threadCount,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });
      const res = r.data?.result || r.data;
      addLog(res.message || `Boosted ${targetCount} reactions`, "success");
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
            <ThumbsUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Reactions Booster</h1>
            <p className="text-xs text-muted-foreground">Boost reactions on Telegram posts</p>
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
              { id: "accounts", label: "Accounts", icon: Users },
              { id: "proxy", label: "Proxy", icon: Globe },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Post URL</label>
              <input type="text" value={postUrl} onChange={e => setPostUrl(e.target.value)} placeholder="https://t.me/channel/123"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Reaction Type</label>
              <select value={reactionType} onChange={e => setReactionType(e.target.value)}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="all">All Reactions</option>
                {REACTION_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label} {r.value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Target Count</label>
              <input type="number" min={1} max={10000} value={targetCount} onChange={e => setTargetCount(parseInt(e.target.value) || 50)}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          {mode === "accounts" && (
            <div className="mt-3">
              <label className="block text-xs text-muted-foreground mb-1">Select Accounts</label>
              <div className="max-h-32 overflow-y-auto space-y-1">
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
              </div>
            </div>
          )}

          {mode === "proxy" && (
            <div className="mt-3">
              <label className="block text-xs text-muted-foreground mb-1">Proxy List (one per line)</label>
              <textarea value={proxyList} onChange={e => setProxyList(e.target.value)} rows={3}
                placeholder="socks5://user:pass@ip:port&#10;socks5://user2:pass2@ip2:port2"
                className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
          )}

          <button onClick={handleExecute} disabled={executing || !postUrl}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Boosting..." : "Boost Reactions"}
          </button>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <FloodControlPanel minDelay={minDelay} maxDelay={maxDelay} onMinDelayChange={setMinDelay} onMaxDelayChange={setMaxDelay} />

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Views Booster", href: "/modules/views-booster" },
          { label: "Mass Subscriptions", href: "/modules/mass-subscriptions" },
          { label: "Referrals to Bots", href: "/modules/referrals-to-bots" },
        ]} />

        <ModuleFooter manualSlug="nakrutka-reaktsiy" />
      </div>
    </div>
  );
}
