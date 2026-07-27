"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, ArrowLeft, Loader2, Search, Users, Hash, Radio } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function AdminSearchPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [threadCount, setThreadCount] = useState(5);
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
    setExecuting(true); setError(""); setLog([]); setResults(null);
    try {
      addLog(`Scanning accounts for admin rights...`);
      const r = await api.post("/modules/admin_search/execute", {
        params: {
          account_id: accountId || undefined,
          thread_count: threadCount,
          proxy_mode: proxyMode,
        },
      });
      const res = r.data?.result || r.data;
      const items = res.chats || res.result || res;
      setResults(Array.isArray(items) ? items : [items]);
      const count = Array.isArray(items) ? items.length : 0;
      addLog(`Found ${count} chats with admin rights`, count > 0 ? "success" : "warn");
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
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Admin Rights Search</h1>
            <p className="text-xs text-muted-foreground">Find chats and channels where accounts have administrator privileges</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="mb-3">
            <label className="block text-xs text-muted-foreground mb-1">Account (or scan all)</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)}
              className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
              <option value="">All active accounts</option>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.phone_number || a.phone}>{a.phone_number || a.phone || `#${a.id}`}</option>
              ))}
            </select>
          </div>

          <button onClick={handleExecute} disabled={executing}
            className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            {executing ? "Scanning..." : "Search"}
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
                      {item.type === "channel" ? <Radio className="h-3.5 w-3.5 text-primary" /> :
                       item.type === "supergroup" ? <Hash className="h-3.5 w-3.5 text-primary" /> :
                       <Users className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{item.title || item.name}</p>
                      {item.username && <p className="text-[10px] text-muted-foreground truncate">@{item.username}</p>}
                    </div>
                  </div>
                  <ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />
                </div>
              ))}
              {results.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">No admin rights found</p>
              )}
            </div>
          </div>
        )}

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Chat Creator", href: "/dashboard/modules/chat-creator" },
          { label: "Invite via Admin", href: "/dashboard/modules/invite-via-admin-v1" },
          { label: "Account Cleanup", href: "/dashboard/modules/account-cleanup" },
        ]} />

        <ModuleFooter manualSlug="poisk-chatov-i-kanalov-s-pravami-administratora" />
      </div>
    </div>
  );
}