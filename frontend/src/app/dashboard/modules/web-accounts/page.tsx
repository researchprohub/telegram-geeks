"use client";

import { useState, useEffect } from "react";
import { Globe, ArrowLeft, Loader2, ExternalLink, Monitor } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

const openModes = [
  { id: "webk", label: "Telegram WebK", desc: "Open accounts in web.telegram.org/k/" },
  { id: "weba", label: "Telegram WebA", desc: "Open accounts in web.telegram.org/a/" },
];

export default function WebAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountIds, setAccountIds] = useState<number[]>([]);
  const [mode, setMode] = useState("webk");
  const [threadCount, setThreadCount] = useState(1);
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

  function toggleAccount(id: number) {
    setAccountIds(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  }

  async function handleExecute() {
    if (accountIds.length === 0) { setError("Select at least one account"); return; }
    setExecuting(true); setError(""); setLog([]);
    try {
      addLog(`Opening ${accountIds.length} accounts in ${mode === "webk" ? "Telegram WebK" : "Telegram WebA"}...`);
      const r = await api.post("/modules/web_accounts/execute", {
        params: {
          account_ids: accountIds,
          web_type: mode,
          proxy_mode: proxyMode,
        },
      });
      const urls = r.data?.urls || r.data?.sessions || [];
      if (urls.length > 0) {
        urls.forEach((u: string) => addLog(`Opening session: ${u}`));
        window.open(urls[0], "_blank");
        for (let i = 1; i < urls.length && i < 5; i++) {
          setTimeout(() => window.open(urls[i], "_blank"), i * 800);
        }
      }
      addLog(`Opened ${urls.length} sessions`, "success");
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
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Web Accounts</h1>
            <p className="text-xs text-muted-foreground">Open and manage Telegram accounts through the web interface</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {openModes.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${mode === m.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                title={m.desc}>
                {m.id === "webk" ? <Monitor className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                {m.label}
              </button>
            ))}
          </div>

          <div className="mb-3">
            <label className="block text-xs text-muted-foreground mb-1">Select Accounts ({accountIds.length} selected)</label>
            <div className="bg-secondary rounded-lg border-0 max-h-48 overflow-y-auto">
              {accounts.filter((a: any) => a.id).map((a: any) => (
                <label key={a.id} className="flex items-center gap-2 px-3 py-2 hover:bg-secondary/80 cursor-pointer transition-colors">
                  <input type="checkbox" checked={accountIds.includes(a.id)} onChange={() => toggleAccount(a.id)}
                    className="accent-primary h-3.5 w-3.5" />
                  <span className="text-xs text-foreground">
                    {a.phone_number || a.phone || `Account #${a.id}`}
                    {a.first_name ? ` (${a.first_name})` : ""}
                  </span>
                  {a.status && (
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${
                      a.status === "active" ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" :
                      a.status === "banned" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" :
                      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                    }`}>{a.status}</span>
                  )}
                </label>
              ))}
              {accounts.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No accounts loaded</p>
              )}
            </div>
          </div>

          <button onClick={handleExecute} disabled={executing || accountIds.length === 0}
            className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
            {executing ? "Opening..." : "Open in Browser"}
          </button>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Account Manager", href: "/dashboard/accounts" },
          { label: "Session Duplicator", href: "/dashboard/modules/session-duplicator" },
          { label: "Mass Inspection", href: "/dashboard/modules/mass-inspection" },
        ]} />

        <ModuleFooter manualSlug="web-accounts" />
      </div>
    </div>
  );
}