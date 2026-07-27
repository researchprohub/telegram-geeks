"use client";

import { useState, useEffect } from "react";
import { MessageSquare, ArrowLeft, Loader2, Eye, Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function OpenDialogsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountIds, setAccountIds] = useState<number[]>([]);
  const [threadCount, setThreadCount] = useState(5);
  const [proxyMode, setProxyMode] = useState("account");
  const [executing, setExecuting] = useState(false);
  const [dialogs, setDialogs] = useState<any[] | null>(null);
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

  function toggleAccount(id: number) {
    setAccountIds(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  }

  async function handleExecute() {
    if (accountIds.length === 0) { setError("Select at least one account"); return; }
    setExecuting(true); setError(""); setLog([]); setDialogs(null);
    try {
      addLog(`Fetching dialogues for ${accountIds.length} accounts...`);
      const r = await api.post("/modules/open_dialogs/execute", {
        params: {
          account_ids: accountIds,
          thread_count: threadCount,
          proxy_mode: proxyMode,
        },
      });
      const d = r.data?.dialogs || r.data?.result || [];
      setDialogs(Array.isArray(d) ? d.slice(0, 100) : [d]);
      addLog(`Fetched ${Array.isArray(d) ? d.length : 0} dialogues`, "success");
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
            <Inbox className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Open Dialogues</h1>
            <p className="text-xs text-muted-foreground">View all active conversations for selected accounts</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="mb-3">
            <label className="block text-xs text-muted-foreground mb-1">Select Accounts ({accountIds.length} selected)</label>
            <div className="bg-secondary rounded-lg border-0 max-h-48 overflow-y-auto">
              {accounts.filter((a: any) => a.id).map((a: any) => (
                <label key={a.id} className="flex items-center gap-2 px-3 py-2 hover:bg-secondary/80 cursor-pointer transition-colors">
                  <input type="checkbox" checked={accountIds.includes(a.id)} onChange={() => toggleAccount(a.id)}
                    className="accent-primary h-3.5 w-3.5" />
                  <span className="text-xs text-foreground">{a.phone_number || a.phone || `#${a.id}`}</span>
                </label>
              ))}
              {accounts.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No accounts loaded</p>}
            </div>
          </div>

          <button onClick={handleExecute} disabled={executing || accountIds.length === 0}
            className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            {executing ? "Fetching..." : "View Dialogues"}
          </button>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />

        {dialogs && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Dialogues ({dialogs.length})</h3>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {dialogs.map((d: any, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-secondary/30 rounded-lg px-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{d.name || d.title || `Chat #${d.id}`}</p>
                    {d.last_message && (
                      <p className="text-[10px] text-muted-foreground truncate">{d.last_message}</p>
                    )}
                  </div>
                  {d.unread > 0 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">{d.unread}</span>
                  )}
                </div>
              ))}
              {dialogs.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No dialogues found</p>}
            </div>
          </div>
        )}

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Account Manager", href: "/dashboard/accounts" },
          { label: "Mass Messaging", href: "/dashboard/modules/mass-messaging" },
          { label: "Autoresponder", href: "/dashboard/modules/autoresponder" },
        ]} />

        <ModuleFooter manualSlug="otkryityie-dialogi" />
      </div>
    </div>
  );
}