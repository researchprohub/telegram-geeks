"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeftRight, Upload, Download, FileArchive, CheckCircle2, AlertCircle, Loader2, Info, Search, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import api, { accountsApi, toolsApi } from "@/lib/api";

export default function ConverterPage() {
  const router = useRouter();
  const [direction, setDirection] = useState<"import" | "export-tdata" | "export-json">("import");
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [log, setLog] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (direction !== "import") fetchAccounts(); }, [direction]);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [log]);

  async function fetchAccounts() {
    try {
      const r = await accountsApi.list(1, 1000);
      setAccounts(r.data.items || []);
    } catch { setAccounts([]); }
  }

  const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files).filter(f => f.name.endsWith(".zip") || f.name.endsWith(".json"))]);
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  }

  function toggleAccount(id: number) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function handleImport() {
    if (!files.length) return;
    setLoading(true); setResult(null); setLog([]);
    addLog(`Starting import of ${files.length} file(s)...`);

    try {
      const formData = new FormData();
      files.forEach(f => formData.append("files", f));

      const r = await api.post("/accounts/upload/bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const d = r.data;
      setResult({ type: "import", success: d.total_accounts > 0, data: d });
      addLog(`Imported ${d.total_accounts} accounts, ${d.failed} failed`);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Import failed";
      setResult({ type: "import", success: false, error: msg });
      addLog(`Error: ${msg}`);
    } finally { setLoading(false); }
  }

  async function handleExport(type: "tdata" | "json") {
    const ids = Array.from(selectedIds);
    if (!ids.length && !selectAll) return;
    setLoading(true); setResult(null); setLog([]);
    const label = type === "tdata" ? "TData" : "Session+JSON";
    addLog(`Exporting ${selectAll ? "all accounts" : `${ids.length} account(s)`} as ${label}...`);

    try {
      const fn = type === "tdata" ? toolsApi.exportTData : toolsApi.exportSessionJson;
      const r = await fn(selectAll ? undefined : ids);
      const blob = new Blob([r.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = type === "tdata" ? "accounts_tdata.zip" : "accounts_session_json.zip";
      a.click();
      window.URL.revokeObjectURL(url);
      setResult({ type: "export", success: true, format: label });
      addLog(`Downloaded ${label} ZIP successfully`);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Export failed";
      setResult({ type: "export", success: false, error: msg });
      addLog(`Error: ${msg}`);
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">TData Converter</h1>
            <p className="text-xs text-muted-foreground">Two-way TData ↔ Session+JSON conversion</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-card rounded-xl border border-border p-1 flex">
          {[
            { id: "import", label: "Import TData", icon: Upload },
            { id: "export-tdata", label: "Export → TData", icon: Download },
            { id: "export-json", label: "Export → Session+JSON", icon: FileArchive },
          ].map(d => {
            const Icon = d.icon;
            return (
              <button key={d.id} onClick={() => { setDirection(d.id as any); setFiles([]); setResult(null); setLog([]); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${direction === d.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon className="h-4 w-4" /> {d.label}
              </button>
            );
          })}
        </div>

        {direction === "import" && (
          <>
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Upload TData ZIP Files</h3>
              <div onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={handleDrop}
                onClick={() => document.getElementById("conv-file-input")?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium text-foreground text-sm">Drop TData ZIP files here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                <input id="conv-file-input" type="file" multiple accept=".zip" className="hidden" onChange={handleFiles} />
              </div>
              {files.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileArchive className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{f.name}</span>
                        <span className="text-xs text-muted-foreground">({(f.size / 1024).toFixed(0)} KB)</span>
                      </div>
                      <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-lg leading-none px-1">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleImport} disabled={!files.length || loading}
              className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : <><Upload className="h-4 w-4" /> Import Accounts ({files.length})</>}
            </button>
          </>
        )}

        {direction !== "import" && (
          <>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Select Accounts</h3>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={selectAll} onChange={e => { setSelectAll(e.target.checked); if (e.target.checked) setSelectedIds(new Set()); }}
                    className="rounded border-border" />
                  Export All
                </label>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" placeholder="Search accounts..." className="w-full pl-9 pr-4 py-2 rounded-lg bg-secondary border-0 text-sm outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {accounts.filter((a: any) => a.session_string).map((a: any) => (
                  <label key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors">
                    <input type="checkbox" checked={selectAll || selectedIds.has(a.id)} onChange={() => toggleAccount(a.id)} disabled={selectAll}
                      className="rounded border-border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.phone_number}</p>
                      <p className="text-xs text-muted-foreground">DC: {a.dc_id || "?"} · Score: {a.health_score ?? "?"}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : a.status === "warming" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                      {a.status}
                    </span>
                  </label>
                ))}
                {accounts.filter((a: any) => a.session_string).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No accounts with session strings found</p>
                )}
              </div>
            </div>
            <button onClick={() => handleExport(direction === "export-tdata" ? "tdata" : "json")}
              disabled={(selectedIds.size === 0 && !selectAll) || loading}
              className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Exporting...</> : <><Download className="h-4 w-4" /> Download as {direction === "export-tdata" ? "TData ZIP" : "Session+JSON ZIP"}</>}
            </button>
          </>
        )}

        {/* Live log */}
        {log.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Live Log</h3>
            <div className="bg-[#0A0A0F] text-green-400 text-xs font-mono p-3 rounded-lg max-h-40 overflow-y-auto">
              {log.map((l, i) => <div key={i}>{l}</div>)}
              <div ref={logEndRef} />
            </div>
          </div>
        )}

        {/* Result */}
        {result && result.success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm text-green-800 dark:text-green-300">
                {result.type === "import" ? "Import Complete" : `${result.format} Downloaded`}
              </p>
              {result.type === "import" && (
                <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                  {result.data.total_accounts} account(s) imported, {result.data.failed} failed
                </p>
              )}
            </div>
          </div>
        )}
        {result && !result.success && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{result.error || "Operation failed"}</p>
          </div>
        )}

        {/* Info box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm">About TData Converter</h4>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
              <strong>Import:</strong> Upload Telegram Desktop Portable ZIPs to import accounts.<br />
              <strong>Export → TData:</strong> Download accounts as TData ZIP for use with Telegram Desktop.<br />
              <strong>Export → Session+JSON:</strong> Download accounts as editable JSON files.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
