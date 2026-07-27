"use client";

import { useState } from "react";
import { Globe, ArrowLeft, Play, Loader2, CheckCircle2, XCircle, Plus, Trash2, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";

export default function ProxyCheckerPage() {
  const router = useRouter();
  const [proxies, setProxies] = useState<string[]>([""]);
  const [proxyType, setProxyType] = useState("http");
  const [timeout, setTimeout_] = useState(10);
  const [threadCount, setThreadCount] = useState(5);
  const [proxyMode, setProxyMode] = useState("none");
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState("");

  function addLog(text: string, level = "info") {
    setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]);
  }

  function addProxy() { setProxies(prev => [...prev, ""]); }

  function removeProxy(i: number) { setProxies(prev => prev.filter((_, idx) => idx !== i)); }

  function updateProxy(i: number, v: string) {
    setProxies(prev => { const n = [...prev]; n[i] = v; return n; });
  }

  async function handleExecute() {
    const valid = proxies.filter(p => p.trim());
    if (valid.length === 0) { setError("Enter at least one proxy"); return; }
    setExecuting(true); setError(""); setLog([]); setResults(null);
    try {
      addLog(`Checking ${valid.length} proxies...`);
      const r = await api.post("/modules/proxy_checker/execute", {
        operation: "check_proxies",
        params: { proxy_strings: valid.map(p => p.trim()), proxy_type: proxyType, timeout_seconds: timeout, thread_count: threadCount },
      });
      const res = r.data?.result || r.data;
      const list = res.results || res.proxies || res;
      setResults(Array.isArray(list) ? list : [list]);
      const working = Array.isArray(list) ? list.filter((p: any) => p.status === "ok" || p.alive).length : 0;
      addLog(`${working}/${valid.length} proxies working`, working > 0 ? "success" : "warn");
      if (valid.length > 0) addLog(`Average ping: ${res.avg_ping || "N/A"}ms`);
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg);
      addLog(msg, "error");
    } finally { setExecuting(false); }
  }

  function handleExport() {
    if (!results) return;
    const csv = "proxy,status,ping_ms,country\n" + results.map((p: any) =>
      `${p.proxy || p.address || ""},${p.status || p.alive ? "ok" : "dead"},${p.ping || ""},${p.country || ""}`
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "proxy-results.csv"; a.click();
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
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Proxy Checker</h1>
            <p className="text-xs text-muted-foreground">Validate and benchmark proxy servers</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Proxies</h3>
            <div className="flex items-center gap-2">
              <select value={proxyType} onChange={e => setProxyType(e.target.value)}
                className="bg-secondary border-0 rounded-lg px-2.5 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="http">HTTP</option>
                <option value="socks5">SOCKS5</option>
              </select>
              <button onClick={addProxy} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {proxies.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="text" value={p} onChange={e => updateProxy(i, e.target.value)}
                  placeholder="ip:port or user:pass@ip:port"
                  className="flex-1 bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary font-mono" />
                {proxies.length > 1 && (
                  <button onClick={() => removeProxy(i)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Threads</label>
              <input type="number" min={1} max={50} value={threadCount} onChange={e => setThreadCount(parseInt(e.target.value) || 5)}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Timeout (s)</label>
              <input type="number" min={1} max={60} value={timeout} onChange={e => setTimeout_(parseInt(e.target.value) || 10)}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <button onClick={handleExecute} disabled={executing}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Checking..." : "Check Proxies"}
          </button>
        </div>

        {results && (
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Results</h3>
              <button onClick={handleExport} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {results.map((p: any, i: number) => {
                const ok = p.status === "ok" || p.alive;
                return (
                  <div key={i} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                      <span className="text-xs font-mono text-foreground">{p.proxy || p.address || p}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{p.ping ? `${p.ping}ms` : "—"}</span>
                      <span>{p.country || "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <LogPanel entries={log} />

        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Proxy Pool Checker</h3>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Bulk Proxy List (ip:port:user:pass, one per line)</label>
            <textarea rows={5} placeholder="123.45.67.89:8080:user1:pass1&#10;98.76.54.32:3128:user2:pass2"
              className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Threads</label>
              <input type="number" min={1} max={100} defaultValue={10}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Check Speed (ms)</label>
              <input type="number" min={100} max={30000} step={100} defaultValue={5000}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <button onClick={handleExecute} disabled={executing}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
            Check Pool
          </button>
        </div>

        {results && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Pool Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-2 pr-3">Proxy</th>
                    <th className="text-left py-2 pr-3">Speed (ms)</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((p: any, i: number) => {
                    const ok = p.status === "ok" || p.alive;
                    return (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 pr-3 font-mono text-foreground">{p.proxy || p.address || `#${i + 1}`}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{p.ping ? `${p.ping}ms` : "—"}</td>
                        <td className="py-2">
                          {ok ?
                            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400"><CheckCircle2 className="h-3 w-3" /> Working</span> :
                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400"><XCircle className="h-3 w-3" /> Failed</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <ModuleFooter manualSlug="proxy-checker" />
      </div>
    </div>
  );
}
