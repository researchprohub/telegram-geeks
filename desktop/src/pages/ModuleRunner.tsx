import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { modulesApi, detail } from "../lib/api";
import { fieldList, toParamValue, FormField } from "../lib/paramForm";
import type { ModuleParamsResponse } from "../types";
import {
  Play,
  ArrowLeft,
  Terminal,
  Copy,
  Check,
  Download,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Sparkles,
  Sliders,
  ShieldCheck,
} from "lucide-react";

export default function ModuleRunner() {
  const { moduleId = "" } = useParams();
  const [meta, setMeta] = useState<{ name?: string; description?: string; category?: string; tier?: string }>({});
  const [params, setParams] = useState<ModuleParamsResponse | null>(null);
  const [op, setOp] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [metaR, p] = await Promise.all([modulesApi.list(), modulesApi.params(moduleId)]);
        const found = metaR.data.modules.find((m) => m.id === moduleId);
        if (!cancelled) {
          setMeta(
            found
              ? { name: found.name, description: found.description, category: found.category, tier: found.tier }
              : {}
          );
          setParams(p.data);
          const ops = Object.keys(p.data.operations);
          const first = ops[0] ?? "";
          setOp(first);
          const defs = first ? p.data.operations[first].defaults : {};
          setFields(fieldList(defs));
          const init: Record<string, string | boolean> = {};
          for (const [k, v] of Object.entries(defs)) {
            init[k] = typeof v === "boolean" ? v : v == null ? "" : String(v);
          }
          setValues(init);
        }
      } catch (err) {
        setError(detail(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  const ops = useMemo(() => (params ? Object.keys(params.operations) : []), [params]);

  const selectOp = (next: string) => {
    setOp(next);
    const defs = params?.operations[next]?.defaults ?? {};
    setFields(fieldList(defs));
    const init: Record<string, string | boolean> = {};
    for (const [k, v] of Object.entries(defs)) init[k] = typeof v === "boolean" ? v : v == null ? "" : String(v);
    setValues(init);
    setResult(null);
  };

  const run = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body: Record<string, unknown> = {};
      for (const f of fields) body[f.key] = toParamValue(f.kind, values[f.key] ?? "");
      const r = await modulesApi.execute(moduleId, op, body);
      setResult(r.data);
    } catch (err) {
      setResult(null);
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 py-8 animate-in fade-in duration-300">
      {/* Back Link & Header */}
      <div>
        <Link
          to="/modules"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Modules Hub</span>
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Cpu className="h-6 w-6 text-primary" />
                {meta.name || moduleId}
              </h1>
              {meta.tier === "pro" ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  PRO MODULE
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  BASE MODULE
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {meta.description || `Configurable MTProto protocol module: ${moduleId}`}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Operation Tabs */}
      {ops.length > 0 && (
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Select Operation Mode
          </label>
          <div className="flex flex-wrap gap-2">
            {ops.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => selectOp(o)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  o === op
                    ? "bg-primary text-black font-bold shadow-sm"
                    : "bg-card/40 border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {o.replace(/_/g, " ").toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Runner Grid (Form + Terminal Output) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Parameter Form (6 cols) */}
        <form onSubmit={run} className="lg:col-span-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md p-6 space-y-5">
          <div className="border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground">Operation Parameters</h3>
            <p className="text-xs text-muted-foreground">Configure input fields and execution flags.</p>
          </div>

          <div className="space-y-4">
            {fields.length === 0 && (
              <div className="p-4 rounded-xl bg-background/50 border border-border/40 text-xs text-muted-foreground text-center">
                This operation runs directly with standard presets (no additional parameters required).
              </div>
            )}

            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5 capitalize">
                  {f.key.replace(/_/g, " ")}
                </label>
                {f.kind === "checkbox" ? (
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(values[f.key])}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.checked }))}
                      className="h-4 w-4 accent-primary rounded"
                    />
                    <span>Enable {f.key.replace(/_/g, " ")}</span>
                  </label>
                ) : (
                  <input
                    type={f.kind === "number" ? "number" : "text"}
                    value={String(values[f.key] ?? "")}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={busy || !op}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              <Play className={`h-4 w-4 fill-black ${busy ? "animate-spin" : ""}`} />
              <span>{busy ? "Executing Module…" : "Run Operation"}</span>
            </button>
          </div>
        </form>

        {/* Right Col: Terminal Output (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-border bg-card/30 backdrop-blur-md flex flex-col justify-between h-[520px]">
          <div>
            <div className="p-4 border-b border-border bg-card/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Execution Console</span>
              </div>

              {result !== null && (
                <button
                  onClick={handleCopyResult}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy JSON"}</span>
                </button>
              )}
            </div>

            <div className="p-4 overflow-y-auto max-h-[410px] custom-scrollbar">
              {result !== null ? (
                <pre className="p-3.5 rounded-xl bg-background/90 font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto border border-border/60">
                  {JSON.stringify(result, null, 2)}
                </pre>
              ) : (
                <div className="text-center py-28 text-muted-foreground text-xs font-sans">
                  Click "Run Operation" to execute this module task and inspect the structured MTProto output.
                </div>
              )}
            </div>
          </div>

          <div className="p-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground bg-card/20">
            <span>Embedded Dispatcher: <strong>Port 8765</strong></span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Anti-Detection Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}