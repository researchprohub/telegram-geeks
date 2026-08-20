import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { modulesApi, detail } from "../lib/api";
import { fieldList, toParamValue, FormField } from "../lib/paramForm";
import type { ModuleParamsResponse } from "../types";

export default function ModuleRunner() {
  const { moduleId = "" } = useParams();
  const [meta, setMeta] = useState<{ name?: string; description?: string }>({});
  const [params, setParams] = useState<ModuleParamsResponse | null>(null);
  const [op, setOp] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [metaR, p] = await Promise.all([modulesApi.list(), modulesApi.params(moduleId)]);
        const found = metaR.data.modules.find((m) => m.id === moduleId);
        if (!cancelled) {
          setMeta(found ? { name: found.name, description: found.description } : {});
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
      } catch (err) { setError(detail(err)); }
    })();
    return () => { cancelled = true; };
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
    } catch (err) { setResult(null); setError(detail(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header>
        <h1>{meta.name || moduleId}</h1>
        <p className="text-muted-foreground">{meta.description || "Module runner."}</p>
      </header>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {ops.map((o) => (
          <button key={o} className={`rounded-md px-3 py-1.5 text-sm ${o === op ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`} onClick={() => selectOp(o)}>
            {o}
          </button>
        ))}
      </div>
      <form className="card space-y-4 p-5" onSubmit={run}>
        {fields.length === 0 && <p className="text-sm text-muted-foreground">This operation takes no parameters.</p>}
        {fields.map((f) => (
          <div key={f.key}>
            <label className="label" htmlFor={f.key}>{f.key}</label>
            {f.kind === "checkbox" ? (
              <input id={f.key} type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={Boolean(values[f.key])} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.checked }))} />
            ) : (
              <input id={f.key} className="input font-mono" type={f.kind === "number" ? "number" : "text"} value={String(values[f.key] ?? "")} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
            )}
          </div>
        ))}
        <button className="btn-primary" disabled={busy || !op}>{busy ? "Running…" : "Run"}</button>
      </form>
      {result !== null && (
        <pre className="card max-h-96 overflow-auto p-4 text-xs text-muted-foreground">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}