"use client";

import { useState, useEffect } from "react";
import { Search, ArrowLeft, Loader2, Users, Hash, Radio, Globe, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

const searchTypes = [
  { id: "all", label: "All", icon: Globe },
  { id: "users", label: "Users", icon: Users },
  { id: "groups", label: "Groups", icon: Hash },
  { id: "channels", label: "Channels", icon: Radio },
];

export default function GlobalSearchPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [limit, setLimit] = useState(20);
  const [threadCount, setThreadCount] = useState(3);
  const [proxyMode, setProxyMode] = useState("account");
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
    if (!query.trim()) { setError("Enter a search query"); return; }
    setExecuting(true); setError(""); setLog([]); setResults(null);
    try {
      addLog(`Searching for "${query}" (${searchType})...`);
      const r = await api.post("/modules/global_search/execute", {
        params: {
          query: query.trim(),
          search_type: searchType,
          limit,
          account_id: accountId || undefined,
          thread_count: threadCount,
          proxy_mode: proxyMode,
        },
      });
      const res = r.data?.result || r.data;
      const items = res.results || res.items || res;
      setResults(Array.isArray(items) ? items : [items]);
      const count = Array.isArray(items) ? items.length : 0;
      addLog(`Found ${count} results`, count > 0 ? "success" : "warn");
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
            <Search className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Global Search</h1>
            <p className="text-xs text-muted-foreground">Search Telegram globally for users, groups, and channels</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {searchTypes.map(t => (
              <button key={t.id} onClick={() => setSearchType(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${searchType === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Search Query</label>
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Username, name, or keyword..."
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
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
            <label className="block text-xs text-muted-foreground mb-1">Max Results ({limit})</label>
            <input type="range" min={1} max={100} value={limit} onChange={e => setLimit(parseInt(e.target.value))}
              className="w-full accent-primary" />
          </div>

          <button onClick={handleExecute} disabled={executing || !query.trim()}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            {executing ? "Searching..." : "Search"}
          </button>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />

        {results && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Results ({results.length})</h3>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {results.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {item.type === "channel" || item.type === "supergroup" ? <Radio className="h-3.5 w-3.5 text-primary" /> :
                       item.type === "group" || item.type === "chat" ? <Hash className="h-3.5 w-3.5 text-primary" /> :
                       <Users className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{item.title || item.name || item.username || `#${item.id}`}</p>
                      {item.username && <p className="text-[10px] text-muted-foreground truncate">@{item.username}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      item.type === "channel" || item.type === "supergroup" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" :
                      item.type === "group" || item.type === "chat" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" :
                      "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                    }`}>{item.type || "user"}</span>
                    <button onClick={() => router.push(`/dashboard/modules/audience-collector?target=${item.username || item.id}`)}
                      className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5">
                      <UserCheck className="h-3 w-3" /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Audience Collector", href: "/dashboard/modules/audience-collector" },
          { label: "Gender Determination", href: "/dashboard/modules/gender-detector" },
          { label: "Mass Inspection", href: "/dashboard/modules/mass-inspection" },
        ]} />

        <ModuleFooter manualSlug="globalnyiy-poisk" />
      </div>
    </div>
  );
}
