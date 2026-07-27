"use client";

import { useState, useEffect } from "react";
import { UserSearch, ArrowLeft, Play, Loader2, Download, Filter, Hash, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function AudienceCollectorPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [source, setSource] = useState<"group" | "comments" | "members">("group");
  const [chatLink, setChatLink] = useState("");
  const [keywords, setKeywords] = useState("");
  const [limit, setLimit] = useState(500);
  const [threadCount, setThreadCount] = useState(2);
  const [proxyMode, setProxyMode] = useState("account");
  const [minDelay, setMinDelay] = useState(3);
  const [maxDelay, setMaxDelay] = useState(8);
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [results, setResults] = useState<any>(null);
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
    if (!accountId || !chatLink) { setError("Select account and enter chat link"); return; }
    setExecuting(true); setError(""); setLog([]); setResults(null);
    try {
      addLog(`Starting ${source} collection from ${chatLink}...`);
      const r = await api.post("/modules/audience_collector/execute", {
        operation: source === "group" ? "collect_from_group" : source === "comments" ? "collect_from_comments" : "collect_members",
        params: {
          account_id: accountId,
          chat_id: chatLink,
          limit,
          keywords: keywords ? keywords.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });
      const res = r.data?.result || r.data;
      setResults(res);
      addLog(`Collected ${res.count || res.users?.length || 0} users`, "success");
      if (res.count === 0) addLog("No users found", "warn");
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg);
      addLog(msg, "error");
    } finally { setExecuting(false); }
  }

  function handleExport() {
    if (!results?.users) return;
    const csv = "username,id,phone\n" + results.users.map((u: any) => `${u.username || ""},${u.id},${u.phone || ""}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audience.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UserSearch className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Audience Collector</h1>
            <p className="text-xs text-muted-foreground">Collect users from groups, comments, and member lists</p>
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
              { id: "group", label: "By Group", icon: MessageCircle },
              { id: "comments", label: "By Comments", icon: Hash },
              { id: "members", label: "Members", icon: UserSearch },
            ].map(m => (
              <button key={m.id} onClick={() => setSource(m.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${source === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
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
              <label className="block text-xs text-muted-foreground mb-1">Chat Link / ID</label>
              <input type="text" value={chatLink} onChange={e => setChatLink(e.target.value)} placeholder="https://t.me/group or @username"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Max Users</label>
              <input type="number" min={1} max={10000} value={limit} onChange={e => setLimit(parseInt(e.target.value) || 500)}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Keywords (optional, comma-separated)</label>
              <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="crypto, trading, airdrop"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <button onClick={handleExecute} disabled={executing || !accountId || !chatLink}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Collecting..." : "Collect Audience"}
          </button>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <FloodControlPanel minDelay={minDelay} maxDelay={maxDelay} onMinDelayChange={setMinDelay} onMaxDelayChange={setMaxDelay} />

        {results && (
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Results</h3>
              <button onClick={handleExport} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{results.count || results.users?.length || 0} users collected</p>
            {results.users && results.users.length > 0 && (
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border"><th className="text-left py-1 text-muted-foreground">Username</th><th className="text-left py-1 text-muted-foreground">ID</th><th className="text-left py-1 text-muted-foreground">Phone</th></tr></thead>
                  <tbody>
                    {results.users.slice(0, 50).map((u: any, i: number) => (
                      <tr key={i} className="border-b border-border/50"><td className="py-1">{u.username || "—"}</td><td className="py-1">{u.id}</td><td className="py-1">{u.phone || "—"}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Mass Messaging", href: "/modules/mass-messaging" },
          { label: "Invite Module", href: "/modules/invite-v1" },
        ]} />

        <ModuleFooter manualSlug="audience-collector" />
      </div>
    </div>
  );
}
