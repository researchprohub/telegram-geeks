import { FormEvent, useState } from "react";
import { modulesApi, detail } from "../lib/api";

export default function NeuroText() {
  const [template, setTemplate] = useState("Hello {World|Universe}!");
  const [count, setCount] = useState("5");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const r = await modulesApi.execute("neuro_text", "preview_spintax", { template, count: Number(count) || 5 });
      setResult(r.data);
    } catch (err) { setError(detail(err)); setResult(null); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header><h1>Neuro-Text Engine</h1></header>
      <form className="card space-y-4 p-5" onSubmit={run}>
        <div>
          <label className="label" htmlFor="template">Spintax template</label>
          <textarea id="template" className="input min-h-24 font-mono" value={template} onChange={(e) => setTemplate(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="count">Variants</label>
          <input id="count" type="number" className="input w-32" value={count} onChange={(e) => setCount(e.target.value)} />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? "Running…" : "Preview"}</button>
      </form>
      {result !== null && <pre className="card max-h-96 overflow-auto p-4 text-xs text-muted-foreground">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}