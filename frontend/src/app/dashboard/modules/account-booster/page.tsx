"use client";

import { useState, useEffect } from "react";
import { Rocket, ArrowLeft, Loader2, Users, Zap, Target, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

const boosterModes = [
  { id: "members", label: "Members", icon: Users, desc: "Boost member count" },
  { id: "views", label: "Views", icon: Activity, desc: "Boost post views" },
  { id: "reactions", label: "Reactions", icon: Zap, desc: "Boost post reactions" },
];

const boostSources = [
  { id: "accounts", label: "My Accounts" },
  { id: "bots", label: "Bot Network" },
];

export default function AccountBoosterPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [mode, setMode] = useState("members");
  const [source, setSource] = useState("accounts");
  const [target, setTarget] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [speed, setSpeed] = useState(50);
  const [threadCount, setThreadCount] = useState(5);
  const [proxyMode, setProxyMode] = useState("account");
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
    if (!target.trim()) { setError("Enter target"); return; }
    setExecuting(true); setError(""); setLog([]);
    try {
      addLog(`Starting ${mode} boost on ${target} (${quantity}, speed ${speed})...`);
      const r = await api.post("/modules/account_booster/execute", {
        params: {
          mode,
          source,
          target: target.trim(),
          quantity,
          speed,
          account_id: accountId || undefined,
          thread_count: threadCount,
          proxy_mode: proxyMode,
        },
      });
      addLog("Boost started", "success");
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
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Account Booster</h1>
            <p className="text-xs text-muted-foreground">Boost members, views, and reactions using your accounts</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {boosterModes.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === m.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                title={m.desc}>
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-4">
            {boostSources.map(s => (
              <button key={s.id} onClick={() => setSource(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${source === s.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  {mode === "members" ? "Chat Username" : "Post Link"}
                </label>
                <input type="text" value={target} onChange={e => setTarget(e.target.value)}
                  placeholder={mode === "members" ? "@channel or @group" : "https://t.me/chat/1234"}
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Account</label>
                <select value={accountId} onChange={e => setAccountId(e.target.value)}
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                  <option value="">All active accounts</option>
                  {accounts.map((a: any) => (
                    <option key={a.id} value={a.phone_number || a.phone}>{a.phone_number || a.phone || `#${a.id}`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Quantity: {quantity}</label>
                <input type="range" min={10} max={1000} step={10} value={quantity} onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-[10px] text-muted-foreground"><span>10</span><span>1000</span></div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Speed: {speed}%</label>
                <input type="range" min={10} max={100} step={10} value={speed} onChange={e => setSpeed(Number(e.target.value))}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-[10px] text-muted-foreground"><span>Slow</span><span>Fast</span></div>
              </div>
            </div>

            <button onClick={handleExecute} disabled={executing || !target.trim()}
              className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
              {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
              {executing ? "Running..." : "Start Boost"}
            </button>
          </div>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Collect Audience", href: "/dashboard/modules/sbor-auditorii" },
          { label: "Mass Messaging", href: "/dashboard/modules/mass-messaging" },
          { label: "Chat Creator", href: "/dashboard/modules/chat-creator" },
        ]} />

        <ModuleFooter manualSlug="akkount-buster" />
      </div>
    </div>
  );
}