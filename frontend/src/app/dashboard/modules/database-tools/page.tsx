"use client";

import { useState, useEffect } from "react";
import { Database, ArrowLeft, Play, Loader2, Upload, Download, Trash2, RefreshCw, Layers, XCircle, Link } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function DatabaseToolsPage() {
  const router = useRouter();
  const [operation, setOperation] = useState<"export" | "import" | "backup" | "clean">("export");
  const [databasePath, setDatabasePath] = useState("/default");
  const [backupName, setBackupName] = useState("");
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [error, setError] = useState("");

  function addLog(text: string, level = "info") { setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]); }

  async function handleExecute() {
    setExecuting(true); setError("");
    try {
      addLog(`Running ${operation} on ${databasePath}...`);
      const r = await api.post("/modules/database_tools/execute", {
        operation,
        params: { database_path: databasePath, backup_name: backupName || undefined },
      });
      const res = r.data?.result || r.data;
      addLog(res.message || `${operation} completed`, "success");
    } catch (e: any) { const msg = e.response?.data?.detail || e.message; setError(msg); addLog(msg, "error"); }
    finally { setExecuting(false); }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Database className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-lg font-bold text-foreground">Database Tools</h1><p className="text-xs text-muted-foreground">Export, import, backup, and clean databases</p></div>
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {[
              { id: "export", label: "Export", icon: Upload },
              { id: "import", label: "Import", icon: Download },
              { id: "backup", label: "Backup", icon: RefreshCw },
              { id: "clean", label: "Clean", icon: Trash2 },
            ].map(m => (
              <button key={m.id} onClick={() => setOperation(m.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${operation === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Database Path</label>
              <input type="text" value={databasePath} onChange={e => setDatabasePath(e.target.value)} placeholder="/default" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            {operation === "backup" && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Backup Name</label>
                <input type="text" value={backupName} onChange={e => setBackupName(e.target.value)} placeholder="backup-2024-01-01" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
            )}
          </div>
          <button onClick={handleExecute} disabled={executing}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Running..." : operation.charAt(0).toUpperCase() + operation.slice(1)}
          </button>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Union Databases</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">First Database</label>
              <input type="text" value={databasePath} onChange={e => setDatabasePath(e.target.value)} placeholder="/db1"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Second Database</label>
              <input type="text" placeholder="/db2"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <button onClick={handleExecute} disabled={executing}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
            Union Databases
          </button>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Exclude Databases</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Source Database</label>
              <input type="text" placeholder="/source"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Exclude Database</label>
              <input type="text" placeholder="/exclude"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <button onClick={handleExecute} disabled={executing}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
            Exclude Databases
          </button>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Verify Links</h3>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Telegram Links (one per line)</label>
            <textarea rows={4} placeholder="https://t.me/username&#10;https://t.me/+abc123"
              className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono" />
          </div>
          <button onClick={handleExecute} disabled={executing}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link className="h-3.5 w-3.5" />}
            Verify Links
          </button>
        </div>

        <LogPanel entries={log} />
        <CrossLinkFooter links={[{ label: "Mass Inspection", href: "/dashboard/modules/mass-inspection" }, { label: "Session Duplicator", href: "/dashboard/modules/session-duplicator" }]} />
        <ModuleFooter />
      </div>
    </div>
  );
}
