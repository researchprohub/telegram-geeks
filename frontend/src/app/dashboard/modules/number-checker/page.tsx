"use client";

import { useState, useEffect } from "react";
import { Phone, ArrowLeft, Loader2, Search, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

const sources = [
  { id: "account", label: "Accounts" },
  { id: "manual", label: "Manual Entry" },
];

export default function NumberCheckerPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [source, setSource] = useState("account");
  const [numbers, setNumbers] = useState("");
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
    if (source === "manual" && !numbers.trim()) { setError("Enter at least one phone number"); return; }
    setExecuting(true); setError(""); setLog([]); setResults(null);
    try {
      addLog("Checking phone numbers on Telegram...");
      const r = await api.post("/modules/number_checker/execute", {
        params: {
          account_id: accountId || undefined,
          source,
          numbers: source === "manual" ? numbers.split("\n").map(s => s.trim()).filter(Boolean) : undefined,
        },
      });
      const res = r.data?.result || r.data?.items || [];
      setResults(Array.isArray(res) ? res : [res]);
      addLog("Check completed", "success");
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
            <Phone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Number Checker</h1>
            <p className="text-xs text-muted-foreground">Check if phone numbers are registered on Telegram</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {sources.map(s => (
              <button key={s.id} onClick={() => setSource(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${source === s.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
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

            {source === "manual" && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Phone Numbers (one per line)</label>
                <textarea value={numbers} onChange={e => setNumbers(e.target.value)}
                  placeholder="+79001234567&#10;+79007654321&#10;+79009998877"
                  rows={5}
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary resize-none" />
              </div>
            )}

            <button onClick={handleExecute} disabled={executing}
              className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
              {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              {executing ? "Checking..." : "Check"}
            </button>
          </div>
        </div>

        {results && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Results ({results.length})</h3>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {results.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-foreground">{r.phone || r.number || r.id}</span>
                  </div>
                  {r.on_telegram || r.registered ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400">
                      <CheckCircle className="h-3 w-3" /> On Telegram
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-500">
                      <XCircle className="h-3 w-3" /> Not on Telegram
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {log.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Log</h3>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {log.map((e, i) => (
                <p key={i} className={`text-xs ${e.level === "error" ? "text-red-400" : e.level === "success" ? "text-green-400" : "text-muted-foreground"}`}>
                  [{e.time}] {e.text}
                </p>
              ))}
            </div>
          </div>
        )}

        <CrossLinkFooter links={[
          { label: "Account Manager", href: "/dashboard/accounts" },
          { label: "Account Cleanup", href: "/dashboard/modules/account-cleanup" },
          { label: "Web Accounts", href: "/dashboard/modules/web-accounts" },
        ]} />

        <ModuleFooter manualSlug="number-checker" />
      </div>
    </div>
  );
}