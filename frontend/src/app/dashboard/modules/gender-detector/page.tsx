"use client";

import { useState, useEffect } from "react";
import { VenetianMask, ArrowLeft, Loader2, CheckCircle2, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function GenderDetectorPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [usernames, setUsernames] = useState("");
  const [threadCount, setThreadCount] = useState(3);
  const [proxyMode, setProxyMode] = useState("account");
  const [minDelay, setMinDelay] = useState(5);
  const [maxDelay, setMaxDelay] = useState(15);
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
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
    const items = usernames.split("\n").map(s => s.trim()).filter(Boolean);
    if (items.length === 0) { setError("Enter at least one username or ID"); return; }
    setExecuting(true); setError(""); setLog([]); setResults(null);
    try {
      addLog(`Analyzing ${items.length} users...`);
      const r = await api.post("/modules/gender_detector/execute", {
        params: {
          account_id: accountId || undefined,
          usernames: items,
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });
      const res = r.data?.result || r.data;
      const list = res.results || res.users || res;
      setResults(Array.isArray(list) ? list : [list]);
      addLog(`Analysis complete: ${list.length} users processed`, "success");
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
            <VenetianMask className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Gender Detector</h1>
            <p className="text-xs text-muted-foreground">Determine gender of Telegram users by their profiles</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
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
          </div>

          <div className="mt-3">
            <label className="block text-xs text-muted-foreground mb-1">Usernames or User IDs (one per line)</label>
            <textarea value={usernames} onChange={e => setUsernames(e.target.value)} rows={5}
              placeholder="@username1&#10;@username2&#10;123456789"
              className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono" />
          </div>

          <button onClick={handleExecute} disabled={executing || !usernames.trim()}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <VenetianMask className="h-3.5 w-3.5" />}
            {executing ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <FloodControlPanel minDelay={minDelay} maxDelay={maxDelay} onMinDelayChange={setMinDelay} onMaxDelayChange={setMaxDelay} />

        {results && results.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-2 pr-3">Username</th>
                    <th className="text-left py-2 pr-3">Gender</th>
                    <th className="text-left py-2">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 pr-3 font-mono text-foreground">{item.username || item.id || "#" + (i + 1)}</td>
                      <td className="py-2 pr-3">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          item.gender === "male" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" :
                          item.gender === "female" ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          {item.gender === "male" || item.gender === "m" ? <CheckCircle2 className="h-3 w-3" /> :
                           item.gender === "female" || item.gender === "f" ? <CheckCircle2 className="h-3 w-3" /> :
                           <HelpCircle className="h-3 w-3" />}
                          {item.gender === "male" || item.gender === "m" ? "Male" :
                           item.gender === "female" || item.gender === "f" ? "Female" : "Unknown"}
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground">{item.confidence ? `${item.confidence}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Audience Collector", href: "/dashboard/modules/audience-collector" },
          { label: "Global Search", href: "/dashboard/modules/global-search" },
          { label: "Mass Messaging", href: "/dashboard/modules/mass-messaging" },
        ]} />

        <ModuleFooter manualSlug="opredelenie-pola" />
      </div>
    </div>
  );
}
