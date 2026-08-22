"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Layers,
  Settings2,
  Terminal,
  Download,
  Check,
  FileJson,
  Sliders,
  CheckCircle,
} from "lucide-react";
import * as Icons from "lucide-react";
import api from "@/lib/api";
import { MODULE_PARAMS } from "@/lib/module-params";
import { ModuleHeader } from "@/components/modules/ModuleHeader";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel, LogEntry } from "@/components/modules/LogPanel";
import { ModuleExecutionCard } from "@/components/modules/ModuleExecutionCard";
import { AccountPicker, AccountItem } from "@/components/modules/AccountPicker";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, string> = {
  registrar: "UserPlus",
  account_management: "Settings2",
  mass_messaging: "Send",
  autoreponder: "Bot",
  autoposting: "CalendarClock",
  stories: "Bell",
  reactions: "Heart",
  message_editor: "Pencil",
  invite_modules: "Users",
  audience_collector: "UserSearch",
  contact_book: "BookUser",
  mass_unsubscriber: "UserMinus",
  gender_detector: "UserSearch",
  cloner: "Copy",
  interceptor: "Radio",
  forwarder: "ArrowRightLeft",
  bot_creator: "Bot",
  referrals: "Link",
  reporter: "Flag",
  admin: "Settings",
  link_checker: "SearchCheck",
  database_tools: "Database",
  calculator_reports: "Calculator",
  spambot_remover: "ShieldOff",
  number_checker: "PhoneCheck",
  json_generator: "FileJson",
  duplicator: "Copy",
  account_folders: "Folder",
  persona_manager: "UserCog",
  proxy_checker: "Globe",
  views_boost: "Eye",
  mass_subscriptions: "PlusCircle",
  channel_comments: "MessageSquare",
  postbot: "Bot",
  anti_detection: "Shield",
  mass_inspection: "Search",
  parameter_generator: "Sliders",
  global_search: "Search",
  admin_chat_search: "SearchCheck",
  create_chats: "PlusSquare",
  open_dialogs: "MessageCircle",
};

export default function ModuleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOp, setSelectedOp] = useState<string>("");
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});
  const [formValues, setFormValues] = useState<Record<string, Record<string, any>>>({});
  const [jsonFallback, setJsonFallback] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Accounts state
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<(string | number)[]>([]);

  // Global concurrency & anti-flood settings
  const [threadCount, setThreadCount] = useState(5);
  const [proxyMode, setProxyMode] = useState("account");
  const [proxyStr, setProxyStr] = useState("");
  const [minDelay, setMinDelay] = useState(3);
  const [maxDelay, setMaxDelay] = useState(8);

  const addLog = (text: string, level: "info" | "success" | "warn" | "error" | "flood" = "info") => {
    setLogs((prev) => [
      ...prev,
      { time: new Date().toLocaleTimeString(), text, level },
    ]);
  };

  useEffect(() => {
    fetchModuleAndAccounts();
  }, [id]);

  async function fetchModuleAndAccounts() {
    setLoading(true);
    try {
      const [modRes, accRes] = await Promise.allSettled([
        api.get(`/modules/${id}`),
        api.get("/accounts/", { params: { pageSize: 100 } }),
      ]);

      if (modRes.status === "fulfilled") {
        const mod = modRes.value.data;
        setModule(mod);
        const ops = mod.operations || [];
        if (ops.length > 0) {
          setSelectedOp(ops[0]);
        }

        const fv: Record<string, Record<string, any>> = {};
        ops.forEach((op: string) => {
          fv[op] = {};
          (MODULE_PARAMS[mod.id]?.[op] || []).forEach((p: any) => {
            if (p.type === "boolean") fv[op][p.name] = false;
            else if (p.type === "number") fv[op][p.name] = "";
            else fv[op][p.name] = "";
          });
        });
        setFormValues(fv);
      } else {
        setError("Failed to load module configuration");
      }

      if (accRes.status === "fulfilled") {
        const accList = accRes.value.data?.items || accRes.value.data || [];
        setAccounts(accList);
        if (accList.length > 0) {
          setSelectedAccounts([accList[0].id]);
        }
      }
    } catch {
      setError("Failed to load module");
    } finally {
      setLoading(false);
    }
  }

  function setParam(op: string, name: string, value: any) {
    setFormValues((prev) => ({ ...prev, [op]: { ...prev[op], [name]: value } }));
  }

  function parseParamValue(def: any, raw: any): any {
    if (def.type === "number") return raw === "" ? undefined : Number(raw);
    if (def.type === "json") {
      try {
        return raw ? JSON.parse(raw) : undefined;
      } catch {
        return raw;
      }
    }
    if (def.type === "boolean") return !!raw;
    return raw || undefined;
  }

  async function handleExecute() {
    if (!selectedOp) return;
    setExecuting(true);
    setError("");
    addLog(`Initializing operation '${selectedOp}' on module '${module?.name || id}'...`, "info");
    addLog(`Configured with ${threadCount} threads, Proxy: ${proxyMode}, Delays: ${minDelay}-${maxDelay}s`, "info");

    try {
      const isKnown = !!MODULE_PARAMS[module.id]?.[selectedOp];
      let params: any = {};

      if (isKnown) {
        const defs = MODULE_PARAMS[module.id][selectedOp];
        defs.forEach((d: any) => {
          const val = parseParamValue(d, formValues[selectedOp]?.[d.name]);
          if (val !== undefined) params[d.name] = val;
        });
      } else {
        const raw = jsonFallback[selectedOp] || "{}";
        try {
          params = JSON.parse(raw);
        } catch {
          params = {};
        }
      }

      // Inject concurrency, proxy, and account info if applicable
      if (selectedAccounts.length > 0 && !params.account_id && !params.account_ids) {
        params.account_ids = selectedAccounts;
        params.account_id = selectedAccounts[0];
      }
      params.thread_count = threadCount;
      params.proxy_mode = proxyMode;
      if (proxyMode === "custom" && proxyStr) params.custom_proxy = proxyStr;
      params.delay_min = minDelay;
      params.delay_max = maxDelay;

      const r = await api.post(`/modules/${module.id}/execute`, { operation: selectedOp, params });
      const data = r.data;
      setResults((prev) => ({ ...prev, [selectedOp]: data }));

      if (data.status === "error") {
        addLog(`Execution completed with error: ${data.message || "Operation rejected"}`, "error");
      } else {
        addLog(`Execution succeeded: ${data.message || "Task completed successfully"}`, "success");
        if (data.result) {
          addLog(`Result payload received (${JSON.stringify(data.result).length} bytes)`, "info");
        }
      }
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setResults((prev) => ({
        ...prev,
        [selectedOp]: { status: "error", message: msg },
      }));
      addLog(`Execution failed: ${msg}`, "error");
    } finally {
      setExecuting(false);
    }
  }

  function handleExportCsv() {
    const res = results[selectedOp]?.result || results[selectedOp];
    if (!res) return;
    const items = Array.isArray(res) ? res : res.items || [res];
    if (items.length === 0) return;
    const headers = Object.keys(items[0]).join(",");
    const rows = items
      .map((item: any) =>
        Object.values(item)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${module.id}_${selectedOp}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportJson() {
    const res = results[selectedOp];
    if (!res) return;
    const blob = new Blob([JSON.stringify(res, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${module.id}_${selectedOp}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">Loading module engine workspace...</p>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="bg-card border border-border p-8 rounded-2xl text-center max-w-md space-y-4 shadow-sm">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-lg font-bold text-foreground">Module Not Found</h2>
          <p className="text-xs text-muted-foreground">
            The requested module identifier '{id}' could not be located in the operational registry.
          </p>
          <button
            onClick={() => router.push("/dashboard/modules")}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
          >
            Back to Module Catalog
          </button>
        </div>
      </div>
    );
  }

  const IconComp = (Icons as any)[ICON_MAP[module.id] || "Zap"] || Icons.Zap;
  const currentResult = results[selectedOp];
  const defs = MODULE_PARAMS[module.id]?.[selectedOp];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <ModuleHeader
        title={module.name}
        description={module.description}
        icon={<IconComp className="h-6 w-6" />}
        category={module.category || "Automation"}
        planRequired={module.plan_required || "starter"}
        accountCount={accounts.length}
        status={executing ? "running" : "ready"}
      />

      {/* Operation Tabs Navigation */}
      {(module.operations || []).length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {module.operations.map((op: string) => (
            <button
              key={op}
              onClick={() => setSelectedOp(op)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2",
                selectedOp === op
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <span className="capitalize">{op.replace(/_/g, " ")}</span>
            </button>
          ))}
        </div>
      )}

      {/* Split Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Configuration & Parameters */}
        <div className="lg:col-span-7 space-y-5">
          {/* Account Multi-Selector */}
          {accounts.length > 0 && (
            <AccountPicker
              accounts={accounts}
              selectedIds={selectedAccounts}
              onSelectionChange={setSelectedAccounts}
              label="Assigned Execution Accounts"
            />
          )}

          {/* Primary Parameter Form */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                Parameters: <span className="text-foreground capitalize">{selectedOp.replace(/_/g, " ")}</span>
              </h3>
              <span className="text-[10px] font-mono text-muted-foreground">Type-Safe MTProto Payload</span>
            </div>

            {!defs ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-muted-foreground">Custom JSON Payload</label>
                <textarea
                  value={jsonFallback[selectedOp] || "{}"}
                  onChange={(e) =>
                    setJsonFallback((prev) => ({ ...prev, [selectedOp]: e.target.value }))
                  }
                  rows={4}
                  className="w-full bg-secondary border border-border rounded-xl p-3 text-xs font-mono text-foreground outline-none focus:ring-2 focus:ring-primary/40 resize-y"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {defs.map((def: any) => (
                  <div key={def.name} className={cn(def.type === "json" || def.fullWidth ? "sm:col-span-2" : "")}>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      {def.label} {def.required && <span className="text-destructive">*</span>}
                    </label>

                    {def.type === "select" ? (
                      <select
                        value={formValues[selectedOp]?.[def.name] || ""}
                        onChange={(e) => setParam(selectedOp, def.name, e.target.value)}
                        className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="">Choose an option...</option>
                        {def.options?.map((o: string) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : def.type === "boolean" ? (
                      <label className="flex items-center gap-2.5 cursor-pointer pt-2">
                        <input
                          type="checkbox"
                          checked={!!formValues[selectedOp]?.[def.name]}
                          onChange={(e) => setParam(selectedOp, def.name, e.target.checked)}
                          className="h-4 w-4 rounded border-border bg-secondary text-primary focus:ring-primary/40 accent-primary"
                        />
                        <span className="text-xs font-semibold text-foreground">
                          {formValues[selectedOp]?.[def.name] ? "Enabled / Active" : "Disabled"}
                        </span>
                      </label>
                    ) : def.type === "json" ? (
                      <textarea
                        value={formValues[selectedOp]?.[def.name] || ""}
                        onChange={(e) => setParam(selectedOp, def.name, e.target.value)}
                        rows={2}
                        placeholder="{ ... }"
                        className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs font-mono text-foreground outline-none focus:ring-2 focus:ring-primary/40 resize-y"
                      />
                    ) : (
                      <input
                        type={def.type === "number" ? "number" : "text"}
                        value={formValues[selectedOp]?.[def.name] || ""}
                        onChange={(e) => setParam(selectedOp, def.name, e.target.value)}
                        placeholder={def.placeholder || `Enter ${def.label}...`}
                        className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Concurrency & Proxy Routing */}
          <ThreadProxyPanel
            threadCount={threadCount}
            onThreadChange={setThreadCount}
            proxyMode={proxyMode}
            onProxyChange={setProxyMode}
            proxyStr={proxyStr}
            onProxyStrChange={setProxyStr}
          />

          {/* Anti-Flood Randomizer */}
          <FloodControlPanel
            minDelay={minDelay}
            maxDelay={maxDelay}
            onMinDelayChange={setMinDelay}
            onMaxDelayChange={setMaxDelay}
          />
        </div>

        {/* Right Column: Execution Control, Telemetry & Results Drawer */}
        <div className="lg:col-span-5 space-y-5">
          {/* Execution Action Card */}
          <ModuleExecutionCard
            onExecute={handleExecute}
            onStop={() => addLog("Stopping worker processes...", "warn")}
            isExecuting={executing}
            buttonText={`Launch ${selectedOp.replace(/_/g, " ").toUpperCase()}`}
            hasResults={!!currentResult}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
          />

          {/* Live Terminal Log */}
          <LogPanel
            entries={logs}
            title={`${module.name} Execution Stream`}
            maxHeight="320px"
            onClear={() => setLogs([])}
          />

          {/* Formatted Results Drawer */}
          {currentResult && (
            <div
              className={cn(
                "rounded-2xl border p-5 shadow-sm space-y-3",
                currentResult.status === "error"
                  ? "bg-destructive/10 border-destructive/30"
                  : "bg-card border-border"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentResult.status === "error" ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  )}
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                    {currentResult.status === "error" ? "Task Result: Error" : "Task Result: Complete"}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Status: {currentResult.status || "OK"}
                </span>
              </div>

              {currentResult.message && (
                <p className="text-xs text-foreground font-semibold">{currentResult.message}</p>
              )}

              <div className="bg-background/80 rounded-xl p-3 border border-border/80 overflow-x-auto max-h-56 overflow-y-auto">
                <pre className="text-[11px] font-mono text-foreground leading-relaxed">
                  {JSON.stringify(currentResult.result || currentResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
