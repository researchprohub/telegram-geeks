"use client";

import { useState, useEffect } from "react";
import { Copy, ArrowLeft, Play, Loader2, Users, FileJson } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function SessionDuplicatorPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [sourcePhone, setSourcePhone] = useState("");
  const [targetPhones, setTargetPhones] = useState("");
  const [mode, setMode] = useState<"session" | "json">("session");
  const [threadCount, setThreadCount] = useState(2);
  const [proxyMode, setProxyMode] = useState("account");
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } }).then(r => setAccounts(r.data?.items || r.data || [])).catch(() => {});
  }, []);

  function addLog(text: string, level = "info") { setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]); }

  async function handleExecute() {
    if (!sourcePhone) { setError("Select source account"); return; }
    if (mode === "session" && !targetPhones.trim()) { setError("Enter target phones"); return; }
    setExecuting(true); setError("");
    try {
      const targets = targetPhones.split("\n").map(s => s.trim()).filter(Boolean);
      addLog(`Duplicating ${sourcePhone} to ${targets.length || "all"} accounts...`);
      const r = await api.post("/modules/duplicator/execute", {
        operation: mode === "session" ? "duplicate_session" : "duplicate_json",
        params: { source_phone: sourcePhone, target_phones: targets.length > 0 ? targets : undefined, thread_count: threadCount, proxy_mode: proxyMode },
      });
      const res = r.data?.result || r.data;
      addLog(`Duplicated to ${res.copied || "?"} accounts`, "success");
      if (res.failed > 0) addLog(`${res.failed} failed`, "warn");
    } catch (e: any) { const msg = e.response?.data?.detail || e.message; setError(msg); addLog(msg, "error"); }
    finally { setExecuting(false); }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Copy className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-lg font-bold text-foreground">Session Duplicator</h1><p className="text-xs text-muted-foreground">Duplicate sessions across multiple accounts</p></div>
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {[
              { id: "session", label: "Session", icon: Copy },
              { id: "json", label: "JSON", icon: FileJson },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Source Account</label>
              <select value={sourcePhone} onChange={e => setSourcePhone(e.target.value)} className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select account...</option>
                {accounts.map((a: any) => (<option key={a.id} value={a.phone_number || a.phone}>{a.phone_number || a.phone || `#${a.id}`}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Threads</label>
              <input type="number" min={1} max={10} value={threadCount} onChange={e => setThreadCount(parseInt(e.target.value) || 2)} className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          {mode === "session" && (
            <div className="mt-3">
              <label className="block text-xs text-muted-foreground mb-1">Target Phones (one per line, leave empty for all)</label>
              <textarea value={targetPhones} onChange={e => setTargetPhones(e.target.value)} rows={4} placeholder="+1234567890&#10;+9876543210" className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
          )}
          <button onClick={handleExecute} disabled={executing || !sourcePhone}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} {executing ? "Duplicating..." : "Duplicate"}
          </button>
        </div>
        <LogPanel entries={log} />
        <CrossLinkFooter links={[{ label: "Manual Registration", href: "/modules/manual-registration" }, { label: "Universal Registrar", href: "/modules/universal-registrar" }]} />
        <ModuleFooter />
      </div>
    </div>
  );
}
