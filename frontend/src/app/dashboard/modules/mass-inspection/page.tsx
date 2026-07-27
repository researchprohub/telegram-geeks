"use client";

import { useState, useEffect } from "react";
import { Search, ArrowLeft, Play, Loader2, CheckCircle2, XCircle, AlertTriangle, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";

export default function MassInspectionPage() {
  const router = useRouter();
  const [phones, setPhones] = useState("");
  const [threadCount, setThreadCount] = useState(3);
  const [proxyMode, setProxyMode] = useState("account");
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState("");

  function addLog(text: string, level = "info") { setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]); }

  async function handleExecute() {
    const list = phones.split("\n").map(s => s.trim()).filter(Boolean);
    if (list.length === 0) { setError("Enter phone numbers"); return; }
    setExecuting(true); setError(""); setResults(null);
    try {
      addLog(`Inspecting ${list.length} accounts...`);
      const r = await api.post("/modules/mass_inspection/execute", {
        operation: "inspect_accounts",
        params: { phones: list, thread_count: threadCount, proxy_mode: proxyMode },
      });
      const res = r.data?.result || r.data;
      const items = res.results || res.accounts || res;
      setResults(Array.isArray(items) ? items : [items]);
      const ok = Array.isArray(items) ? items.filter((a: any) => a.status !== "invalid" && a.alive !== false).length : 0;
      addLog(`${ok}/${list.length} accounts valid`, "success");
    } catch (e: any) { const msg = e.response?.data?.detail || e.message; setError(msg); addLog(msg, "error"); }
    finally { setExecuting(false); }
  }

  function handleExport() {
    if (!results) return;
    const csv = "phone,status,trust_score,last_active\n" + results.map((a: any) =>
      `${a.phone || ""},${a.status || "unknown"},${a.trust_score || ""},${a.last_active || ""}`
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "inspection-results.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Search className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-lg font-bold text-foreground">Mass Inspection</h1><p className="text-xs text-muted-foreground">Bulk check account status and validity</p></div>
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Threads</label>
              <input type="number" min={1} max={20} value={threadCount} onChange={e => setThreadCount(parseInt(e.target.value) || 3)} className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Proxy</label>
              <select value={proxyMode} onChange={e => setProxyMode(e.target.value)} className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="account">From Account</option>
                <option value="none">No Proxy</option>
              </select>
            </div>
          </div>
          <label className="block text-xs text-muted-foreground mb-1">Phone Numbers (one per line)</label>
          <textarea value={phones} onChange={e => setPhones(e.target.value)} rows={5} placeholder="+1234567890&#10;+9876543210" className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono" />
          <button onClick={handleExecute} disabled={executing || !phones.trim()}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} {executing ? "Inspecting..." : "Inspect"}
          </button>
        </div>
        {results && (
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">Results</h3>
              <button onClick={handleExport} className="flex items-center gap-1 text-xs text-primary hover:underline"><Download className="h-3.5 w-3.5" /> Export</button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {results.map((a: any, i: number) => {
                const ok = a.status !== "invalid" && a.alive !== false;
                return (
                  <div key={i} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                      <span className="text-xs font-mono text-foreground">{a.phone || a.number || `#${i}`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{a.status || "unknown"}</span>
                      {a.trust_score !== undefined && <span>{a.trust_score}%</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <LogPanel entries={log} />
        <ModuleFooter />
      </div>
    </div>
  );
}
