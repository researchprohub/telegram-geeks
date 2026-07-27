"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Play, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { MODULE_PARAMS } from "@/lib/module-params";
import * as Icons from "lucide-react";

const ICON_MAP: Record<string, string> = {
  registrar: "UserPlus", account_management: "Settings2", mass_messaging: "Send",
  autoreponder: "Bot", autoposting: "CalendarClock", stories: "Bell",
  reactions: "Heart", message_editor: "Pencil", invite_modules: "Users",
  audience_collector: "UserSearch", contact_book: "BookUser",
  mass_unsubscriber: "UserMinus", gender_detector: "UserSearch",
  cloner: "Copy", interceptor: "Radio", forwarder: "ArrowRightLeft",
  bot_creator: "Bot", referrals: "Link", reporter: "Flag",
  admin: "Settings", link_checker: "SearchCheck", database_tools: "Database",
  calculator_reports: "Calculator", spambot_remover: "ShieldOff",
  number_checker: "PhoneCheck", json_generator: "FileJson",
  duplicator: "Copy", account_folders: "Folder", persona_manager: "UserCog",
  proxy_checker: "Globe", views_boost: "Eye", mass_subscriptions: "PlusCircle",
  channel_comments: "MessageSquare", postbot: "Bot", anti_detection: "Shield",
  mass_inspection: "Search", parameter_generator: "Sliders",
  global_search: "Search", admin_chat_search: "SearchCheck",
  create_chats: "PlusSquare", open_dialogs: "MessageCircle",
};

export default function ModuleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [formValues, setFormValues] = useState<Record<string, Record<string, any>>>({});
  const [jsonFallback, setJsonFallback] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => { fetchModule(); }, [id]);

  async function fetchModule() {
    setLoading(true);
    try {
      const r = await api.get(`/modules/${id}`);
      const mod = r.data;
      setModule(mod);
      const ops = mod.operations || [];
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
    } catch {
      setError("Failed to load module");
    } finally { setLoading(false); }
  }

  function setParam(op: string, name: string, value: any) {
    setFormValues(prev => ({ ...prev, [op]: { ...prev[op], [name]: value } }));
  }

  function parseParamValue(def: any, raw: any): any {
    if (def.type === "number") return raw === "" ? undefined : Number(raw);
    if (def.type === "json") try { return raw ? JSON.parse(raw) : undefined; } catch { return raw; }
    if (def.type === "boolean") return raw;
    return raw || undefined;
  }

  async function handleExecute(operation: string) {
    setExecuting(operation);
    setError("");
    try {
      const isKnown = !!MODULE_PARAMS[module.id]?.[operation];
      let params: any = {};

      if (isKnown) {
        const defs = MODULE_PARAMS[module.id][operation];
        defs.forEach((d: any) => {
          const val = parseParamValue(d, formValues[operation]?.[d.name]);
          if (val !== undefined) params[d.name] = val;
        });
      } else {
        const raw = jsonFallback[operation] || "{}";
        try { params = JSON.parse(raw); }
        catch { params = {}; }
      }

      const r = await api.post(`/modules/${module.id}/execute`, { operation, params });
      setResults(prev => ({ ...prev, [operation]: r.data }));
    } catch (e: any) {
      setResults(prev => ({ ...prev, [operation]: { status: "error", message: e.response?.data?.detail || e.message } }));
    } finally { setExecuting(null); }
  }

  function renderForm(op: string) {
    const defs = MODULE_PARAMS[module.id]?.[op];
    if (!defs) {
      const val = jsonFallback[op] !== undefined ? jsonFallback[op] : "{}";
      return (
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Params (JSON)</label>
          <textarea value={val} onChange={e => setJsonFallback(prev => ({ ...prev, [op]: e.target.value }))}
            rows={3} className="w-full bg-secondary border-0 rounded-lg p-2 text-xs font-mono text-foreground resize-y outline-none focus:ring-2 focus:ring-primary" />
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {defs.map((def: any) => (
          <div key={def.name}>
            <label className="block text-xs text-muted-foreground mb-0.5">{def.label}{def.required ? " *" : ""}</label>
            {def.type === "select" ? (
              <select value={formValues[op]?.[def.name] || ""} onChange={e => setParam(op, def.name, e.target.value)}
                className="w-full bg-secondary border-0 rounded-lg px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select...</option>
                {def.options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : def.type === "boolean" ? (
              <label className="flex items-center gap-2 cursor-pointer pt-1.5">
                <input type="checkbox" checked={!!formValues[op]?.[def.name]} onChange={e => setParam(op, def.name, e.target.checked)}
                  className="rounded border-border bg-secondary accent-primary" />
                <span className="text-sm text-foreground">Enabled</span>
              </label>
            ) : def.type === "json" ? (
              <textarea value={formValues[op]?.[def.name] || ""} onChange={e => setParam(op, def.name, e.target.value)}
                rows={2} className="w-full bg-secondary border-0 rounded-lg p-2 text-xs font-mono text-foreground resize-y outline-none focus:ring-2 focus:ring-primary" />
            ) : (
              <input type={def.type === "number" ? "number" : "text"} value={formValues[op]?.[def.name] || ""}
                onChange={e => setParam(op, def.name, e.target.value)}
                className="w-full bg-secondary border-0 rounded-lg px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            )}
          </div>
        ))}
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!module) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center"><p className="text-muted-foreground">Module not found</p>
        <button onClick={() => router.push("/dashboard/modules")} className="mt-2 text-sm text-primary hover:underline">Back to modules</button>
      </div>
    </div>
  );

  const IconComp = (Icons as any)[ICON_MAP[module.id] || "Zap"] || Icons.Zap;

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <IconComp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{module.name}</h1>
            <p className="text-xs text-muted-foreground">{module.description}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        {(module.operations || []).map((op: string) => (
          <div key={op} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground capitalize">{op.replace(/_/g, " ")}</h3>
              <button onClick={() => handleExecute(op)} disabled={executing === op}
                className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1">
                {executing === op ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                {executing === op ? "Running..." : "Execute"}
              </button>
            </div>
            {renderForm(op)}

            {results[op] && (
              <div className={`mt-3 rounded-lg border p-3 ${results[op].status === "success" ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  {results[op].status === "success" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                  <span className={`text-xs font-medium ${results[op].status === "success" ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                    {results[op].status === "success" ? "Success" : "Error"}
                  </span>
                </div>
                {results[op].message && <p className="text-xs text-muted-foreground mb-1">{results[op].message}</p>}
                <pre className="text-xs text-foreground bg-black/10 dark:bg-white/5 p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
                  {JSON.stringify(results[op].result || results[op], null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
