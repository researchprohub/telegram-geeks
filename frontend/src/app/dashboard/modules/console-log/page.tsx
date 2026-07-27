"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, ArrowLeft, Trash2, RefreshCw, Download, Pause, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ModuleFooter } from "@/components/modules/ModuleFooter";

export default function ConsoleLogPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<any[]>([]);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => { if (!paused) fetchLogs(); }, 3000);
    return () => clearInterval(interval);
  }, [paused]);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, autoScroll]);

  async function fetchLogs() {
    try {
      const r = await api.get("/modules/logs/recent");
      const data = r.data?.logs || r.data?.entries || r.data || [];
      setEntries(Array.isArray(data) ? data : []);
    } catch { if (!loading) setError("Failed to fetch logs"); }
    finally { setLoading(false); }
  }

  async function handleClear() {
    try {
      await api.post("/modules/logs/clear", {});
      setEntries([]);
    } catch {}
  }

  function handleExport() {
    const text = entries.map((e: any) => `[${e.time || e.timestamp}] [${e.level || "info"}] ${e.text || e.message}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "console-log.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Terminal className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-lg font-bold text-foreground">Console Log</h1><p className="text-xs text-muted-foreground">Real-time system log viewer</p></div>
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setPaused(!paused)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${paused ? "bg-amber-500/10 text-amber-400" : "bg-secondary text-secondary-foreground"}`}>
              {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />} {paused ? "Resume" : "Pause"}
            </button>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} className="rounded border-border bg-secondary accent-primary" />
              Auto-scroll
            </label>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleExport} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Download className="h-3.5 w-3.5" /></button>
            <button onClick={handleClear} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
            <button onClick={fetchLogs} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><RefreshCw className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        <div className="bg-black/95 dark:bg-black rounded-xl border border-border p-4 font-mono text-xs overflow-y-auto" style={{ maxHeight: "70vh" }}>
          {entries.length === 0 ? (
            <div className="text-gray-500 italic text-center py-8">No log entries yet</div>
          ) : (
            entries.map((e: any, i: number) => {
              const level = e.level || "info";
              const color = level === "error" ? "text-red-400" : level === "success" ? "text-green-400" : level === "warn" ? "text-yellow-400" : "text-gray-300";
              return (
                <div key={i} className="leading-5 hover:bg-white/5 px-1 rounded">
                  <span className="text-gray-600">[{e.time || e.timestamp || "—"}]</span>{" "}
                  <span className={`${color}`}>[{level.toUpperCase()}]</span>{" "}
                  <span className="text-gray-300">{e.text || e.message}</span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
