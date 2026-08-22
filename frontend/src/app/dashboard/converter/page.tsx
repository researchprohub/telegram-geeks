"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeftRight, Upload, Download, FileArchive, CheckCircle2, AlertCircle, Loader2, Info, Search, ArrowLeft, RefreshCw, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import api, { accountsApi, toolsApi } from "@/lib/api";
import { ModuleHeader } from "@/components/modules/ModuleHeader";
import { AccountPicker, AccountItem } from "@/components/modules/AccountPicker";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel, LogEntry } from "@/components/modules/LogPanel";
import { ModuleExecutionCard } from "@/components/modules/ModuleExecutionCard";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { cn } from "@/lib/utils";

export default function ConverterPage() {
  const router = useRouter();
  const [direction, setDirection] = useState<"import" | "export-tdata" | "export-json">("import");
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [minDelay, setMinDelay] = useState(2);
  const [maxDelay, setMaxDelay] = useState(5);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const r = await api.get("/accounts/", { params: { pageSize: 100 } });
      const items = r.data?.items || r.data || [];
      setAccounts(items);
      if (items.length > 0) {
        setSelectedIds(items.map((a: any) => a.id));
      }
    } catch {
      setAccounts([]);
    }
  }

  function addLog(text: string, level: "info" | "success" | "warn" | "error" | "flood" = "info") {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), text, level }]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith(".zip") || f.name.endsWith(".session") || f.name.endsWith(".json")
    );
    setFiles((prev) => [...prev, ...droppedFiles]);
    addLog(`Added ${droppedFiles.length} file(s) from drag-and-drop`, "info");
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
      addLog(`Selected ${selected.length} file(s)`, "info");
    }
  }

  async function handleImport() {
    if (!files.length) return;
    setLoading(true);
    setResult(null);
    addLog(`Initiating TData import for ${files.length} archive(s)...`, "info");

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const r = await api.post("/accounts/upload/bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const d = r.data;
      setResult({ type: "import", success: (d.total_accounts || 0) > 0, data: d });
      addLog(`Import complete: ${d.total_accounts || files.length} accounts imported, ${d.failed || 0} failed`, "success");
      fetchAccounts();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Import failed";
      setResult({ type: "import", success: false, error: msg });
      addLog(`Import failed: ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(type: "tdata" | "json") {
    if (selectedIds.length === 0) return;
    setLoading(true);
    setResult(null);
    const label = type === "tdata" ? "TData Portable" : "Session+JSON";
    addLog(`Exporting ${selectedIds.length} account(s) as ${label} ZIP...`, "info");

    try {
      const fn = type === "tdata" ? toolsApi.exportTData : toolsApi.exportSessionJson;
      const numericIds = selectedIds.map((id) => Number(id)).filter((n) => !isNaN(n));
      const r = await fn(numericIds.length > 0 ? numericIds : undefined);

      const blob = new Blob([r.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = type === "tdata" ? "accounts_tdata.zip" : "accounts_session_json.zip";
      a.click();
      window.URL.revokeObjectURL(url);

      setResult({ type: "export", success: true, format: label });
      addLog(`Downloaded ${label} ZIP archive successfully`, "success");
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Export failed";
      setResult({ type: "export", success: false, error: msg });
      addLog(`Export failed: ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ModuleHeader
        title="TDATA Converter & Session Bridge"
        description="Two-way conversion between Telegram Desktop (TData) portable folders and Pyrogram/Telethon Session+JSON archives"
        icon={<ArrowLeftRight className="h-6 w-6" />}
        category="Account Operations"
        planRequired="starter"
        accountCount={accounts.length}
        status={loading ? "running" : "ready"}
      />

      {/* Mode Selector */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { id: "import", label: "Import TData ZIP", icon: Upload, desc: "Import desktop portable folders into DB" },
          { id: "export-tdata", label: "Export → TData ZIP", icon: Download, desc: "Generate portable folders for Telegram Desktop" },
          { id: "export-json", label: "Export → Session+JSON", icon: FileArchive, desc: "Generate Telethon session files + device specs" },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setDirection(m.id as any);
              setFiles([]);
              setResult(null);
            }}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all",
              direction === m.id
                ? "bg-primary/10 border-primary shadow-xs"
                : "bg-secondary/40 border-border hover:bg-secondary"
            )}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <m.icon className={cn("h-4 w-4", direction === m.id ? "text-primary" : "text-muted-foreground")} />
              <span className={direction === m.id ? "text-primary" : "text-foreground"}>{m.label}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{m.desc}</p>
          </button>
        ))}
      </div>

      {/* Split Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-5">
          {direction === "import" ? (
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  Upload TData ZIP or Session Files
                </h3>
                <span className="font-mono text-xs font-bold text-primary">{files.length} selected</span>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("conv-file-input")?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2",
                  dragActive
                    ? "border-primary bg-primary/10 scale-[0.99]"
                    : "border-border hover:border-primary/50 bg-secondary/20"
                )}
              >
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-xs text-foreground">Drop TData ZIP files or sessions here</p>
                  <p className="text-[10px] text-muted-foreground">Accepts .zip (containing tdata folder), .session, or .json</p>
                </div>
                <input
                  id="conv-file-input"
                  type="file"
                  multiple
                  accept=".zip,.session,.json"
                  className="hidden"
                  onChange={handleFiles}
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 bg-secondary/50 rounded-xl border border-border/60 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileArchive className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-foreground truncate">{f.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({(f.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFiles((prev) => prev.filter((_, j) => j !== i));
                        }}
                        className="text-muted-foreground hover:text-destructive text-sm px-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <AccountPicker
              accounts={accounts}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              label={direction === "export-tdata" ? "Select Accounts to Export as TData" : "Select Accounts to Export as JSON"}
            />
          )}

          <FloodControlPanel
            minDelay={minDelay}
            maxDelay={maxDelay}
            onMinDelayChange={setMinDelay}
            onMaxDelayChange={setMaxDelay}
          />
        </div>

        {/* Right Column: Execution & Stream */}
        <div className="lg:col-span-5 space-y-5">
          <ModuleExecutionCard
            onExecute={
              direction === "import"
                ? handleImport
                : () => handleExport(direction === "export-tdata" ? "tdata" : "json")
            }
            isExecuting={loading}
            buttonText={
              direction === "import"
                ? `Import ${files.length} Account ZIPs`
                : direction === "export-tdata"
                ? `Download ${selectedIds.length} Accounts as TData ZIP`
                : `Download ${selectedIds.length} Accounts as Session+JSON`
            }
            hasResults={!!result}
            stats={{
              total: direction === "import" ? files.length : selectedIds.length,
              success: result?.success ? (result.type === "import" ? result.data?.total_accounts : selectedIds.length) : undefined,
            }}
          />

          <LogPanel
            entries={logs}
            title="Conversion Activity Terminal"
            maxHeight="320px"
            onClear={() => setLogs([])}
          />
        </div>
      </div>

      <CrossLinkFooter
        links={[
          { label: "Universal Registrar", href: "/dashboard/modules/universal-registrar" },
          { label: "Parameter Generator", href: "/dashboard/modules/parameter-generator" },
          { label: "Account Folders", href: "/dashboard/modules/account-folders" },
        ]}
      />

      <ModuleFooter manualSlug="converter" />
    </div>
  );
}
